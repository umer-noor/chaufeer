const Booking = require("../models/Booking");
const User = require("../models/User");
const myfatoorahService = require("./myfatoorahService");
const { sendBookingConfirmationEmail } = require("../utils/sendEmail");

const buildOrderId = (bookingId) => bookingId.toString();

const getRedirectUrls = () => {
  const successUrl =
    process.env.MYFATOORAH_SUCCESS_URL || process.env.FATORA_SUCCESS_URL;
  const failureUrl =
    process.env.MYFATOORAH_FAILURE_URL || process.env.FATORA_FAILURE_URL;

  if (!successUrl || !failureUrl) {
    const error = new Error(
      "MYFATOORAH_SUCCESS_URL and MYFATOORAH_FAILURE_URL must be configured"
    );
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
  booking.fatora_transaction_id =
    paymentResult.transaction_id || booking.fatora_transaction_id;
  booking.payment_response_code =
    paymentResult.auth_code || booking.payment_response_code;
  booking.payment_description =
    paymentResult.description || booking.payment_description;

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
  booking.currency =
    currency ||
    booking.currency ||
    process.env.MYFATOORAH_CURRENCY ||
    process.env.FATORA_CURRENCY ||
    "KWD";
  booking.payment_status = "pending";

  const { successUrl, failureUrl } = getRedirectUrls();

  const checkout = await myfatoorahService.createCheckout({
    amount: booking.amount,
    currency: booking.currency,
    orderId: buildOrderId(booking._id),
    clientName: booking.passenger_name || user.full_name,
    clientEmail: booking.passenger_email || user.email,
    clientPhone: booking.phone_number || user.phone_number,
    successUrl,
    failureUrl,
    language: language || "en",
  });

  booking.fatora_order_id = checkout.invoice_id;
  booking.fatora_checkout_url = checkout.checkout_url;
  await booking.save();

  return {
    booking,
    checkout_url: checkout.checkout_url,
  };
};

const verifyAndUpdatePayment = async (
  user,
  bookingId,
  { transaction_id, order_id, payment_id }
) => {
  const booking = await Booking.findOne({ _id: bookingId, user: user._id });

  if (!booking) {
    const error = new Error("Booking not found");
    error.statusCode = 404;
    throw error;
  }

  const paymentResult = await myfatoorahService.getPaymentStatus({
    paymentId: payment_id || null,
    invoiceId:
      order_id ||
      transaction_id ||
      booking.fatora_order_id ||
      booking.fatora_transaction_id,
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

const handleWebhook = async (payload, signatureHeader) => {
  // MyFatoorah POST webhook
  if (payload && typeof payload === "object" && (payload.Data || payload.Event)) {
    if (
      process.env.MYFATOORAH_WEBHOOK_SECRET &&
      !myfatoorahService.verifyWebhookSignature(payload.Data, signatureHeader)
    ) {
      const error = new Error("Invalid signature");
      error.statusCode = 401;
      throw error;
    }

    const data = payload.Data || {};
    const customerReference = data.CustomerReference;
    const invoiceId = data.InvoiceId;

    let booking = null;

    if (customerReference) {
      booking = await Booking.findById(customerReference).catch(() => null);
    }

    if (!booking && invoiceId) {
      booking = await Booking.findOne({ fatora_order_id: String(invoiceId) });
    }

    if (!booking) {
      return null;
    }

    const paymentResult = await myfatoorahService.getPaymentStatus({
      invoiceId: String(invoiceId || booking.fatora_order_id),
    });

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
  }

  // Legacy Fatora-style GET query support
  const orderId = payload.order_id || payload.orderId || payload.orderid;
  const bookingId = orderId ? String(orderId) : null;

  if (!bookingId) {
    const error = new Error("order_id or MyFatoorah webhook Data is required");
    error.statusCode = 400;
    throw error;
  }

  const booking = await Booking.findById(bookingId);

  if (!booking) {
    const error = new Error("Booking not found");
    error.statusCode = 404;
    throw error;
  }

  const paymentResult = await myfatoorahService.getPaymentStatus({
    invoiceId: booking.fatora_order_id || bookingId,
  });

  return updateBookingPayment(booking, paymentResult);
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
