const Booking = require("../models/Booking");
const User = require("../models/User");
const fatoraService = require("./fatoraService");
const { sendBookingConfirmationEmail } = require("../utils/sendEmail");

const SUCCESS_RESPONSE_CODE = "000";

const buildOrderId = (bookingId) => bookingId.toString();

const parseBookingIdFromOrderId = (orderId) => {
  if (!orderId) {
    return null;
  }

  return orderId.toString();
};

const getRedirectUrls = () => {
  const successUrl = process.env.FATORA_SUCCESS_URL;
  const failureUrl = process.env.FATORA_FAILURE_URL;

  if (!successUrl || !failureUrl) {
    const error = new Error("FATORA_SUCCESS_URL and FATORA_FAILURE_URL must be configured");
    error.statusCode = 500;
    throw error;
  }

  return { successUrl, failureUrl };
};

const mapPaymentStatus = (paymentStatus) => {
  if (paymentStatus === "SUCCESS") {
    return "paid";
  }

  if (paymentStatus === "FAILURE") {
    return "failed";
  }

  return "pending";
};

const updateBookingPayment = async (booking, paymentResult) => {
  const paymentStatus = mapPaymentStatus(paymentResult.payment_status);

  booking.payment_status = paymentStatus;
  booking.fatora_transaction_id = paymentResult.transaction_id || booking.fatora_transaction_id;
  booking.payment_response_code = paymentResult.auth_code || booking.payment_response_code;
  booking.payment_description = paymentResult.description || booking.payment_description;

  if (paymentStatus === "paid") {
    booking.paid_at = paymentResult.payment_date
      ? new Date(paymentResult.payment_date)
      : new Date();
  }

  await booking.save();
  return booking;
};

const initiatePayment = async (user, bookingId, { amount, currency, language }) => {
  const booking = await Booking.findOne({ _id: bookingId, user: user._id });

  if (!booking) {
    const error = new Error("Booking not found");
    error.statusCode = 404;
    throw error;
  }

  if (booking.payment_status === "paid") {
    const error = new Error("Booking is already paid");
    error.statusCode = 400;
    throw error;
  }

  const paymentAmount = amount ?? booking.amount;

  if (paymentAmount === undefined || paymentAmount === null || Number(paymentAmount) <= 0) {
    const error = new Error("A valid amount is required to initiate payment");
    error.statusCode = 400;
    throw error;
  }

  booking.amount = Number(paymentAmount);
  booking.currency = currency || booking.currency || process.env.FATORA_CURRENCY || "QAR";
  booking.payment_status = "pending";
  booking.fatora_order_id = buildOrderId(booking._id);

  const { successUrl, failureUrl } = getRedirectUrls();

  const checkoutUrl = await fatoraService.createCheckout({
    amount: booking.amount,
    currency: booking.currency,
    orderId: booking.fatora_order_id,
    clientName: user.full_name,
    clientEmail: user.email,
    clientPhone: user.phone_number,
    successUrl,
    failureUrl,
    language: language || "en",
    note: `Chaufeer booking ${booking.service_type.replace(/_/g, " ")}`,
  });

  booking.fatora_checkout_url = checkoutUrl;
  await booking.save();

  return {
    booking,
    checkout_url: checkoutUrl,
  };
};

const verifyAndUpdatePayment = async (user, bookingId, { transaction_id, order_id }) => {
  const booking = await Booking.findOne({ _id: bookingId, user: user._id });

  if (!booking) {
    const error = new Error("Booking not found");
    error.statusCode = 404;
    throw error;
  }

  const orderId = order_id || booking.fatora_order_id || buildOrderId(booking._id);
  const paymentResult = await fatoraService.verifyPayment({
    orderId,
    transactionId: transaction_id || booking.fatora_transaction_id,
  });

  const wasPaid = booking.payment_status === "paid";
  const updatedBooking = await updateBookingPayment(booking, paymentResult);

  if (!wasPaid && updatedBooking.payment_status === "paid") {
    try {
      await sendBookingConfirmationEmail(updatedBooking, user);
    } catch (error) {
      console.error("Booking confirmation email failed after payment:", error.message);
    }
  }

  return {
    booking: updatedBooking,
    fatora: paymentResult,
  };
};

const handleWebhook = async (query) => {
  const orderId =
    query.order_id || query.orderId || query.orderid;
  const transactionId =
    query.transaction_id || query.transId || query.transid;
  const responseCode = query.response_code || query.responseCode;
  const status = query.status || query.payment_status;
  const description = query.description || query.Failerdescription;

  const bookingId = parseBookingIdFromOrderId(orderId);

  if (!bookingId) {
    const error = new Error("order_id is required");
    error.statusCode = 400;
    throw error;
  }

  const booking = await Booking.findById(bookingId);

  if (!booking) {
    const error = new Error("Booking not found");
    error.statusCode = 404;
    throw error;
  }

  let paymentResult;

  try {
    paymentResult = await fatoraService.verifyPayment({
      orderId,
      transactionId,
    });
  } catch (error) {
    if (responseCode === SUCCESS_RESPONSE_CODE || status === "SUCCESS") {
      booking.payment_status = "paid";
      booking.fatora_transaction_id = transactionId || booking.fatora_transaction_id;
      booking.payment_response_code = responseCode || booking.payment_response_code;
      booking.payment_description = description || booking.payment_description;
      booking.paid_at = new Date();
      await booking.save();
      return booking;
    }

    if (status === "FAILURE") {
      booking.payment_status = "failed";
      booking.fatora_transaction_id = transactionId || booking.fatora_transaction_id;
      booking.payment_description = description || booking.payment_description;
      await booking.save();
      return booking;
    }

    throw error;
  }

  const wasPaid = booking.payment_status === "paid";
  const updatedBooking = await updateBookingPayment(booking, paymentResult);

  if (!wasPaid && updatedBooking.payment_status === "paid") {
    const user = await User.findById(updatedBooking.user);

    if (user) {
      try {
        await sendBookingConfirmationEmail(updatedBooking, user);
      } catch (error) {
        console.error("Booking confirmation email failed after webhook:", error.message);
      }
    }
  }

  return updatedBooking;
};

const getPaymentStatus = async (userId, bookingId) => {
  const booking = await Booking.findOne({ _id: bookingId, user: userId });

  if (!booking) {
    const error = new Error("Booking not found");
    error.statusCode = 404;
    throw error;
  }

  return booking;
};

module.exports = {
  initiatePayment,
  verifyAndUpdatePayment,
  handleWebhook,
  getPaymentStatus,
};
