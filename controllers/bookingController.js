const bookingService = require("../services/bookingService");
const paymentService = require("../services/paymentService");

const formatBooking = (booking) => ({
  id: booking._id,
  user_email: booking.user_email,
  service_type: booking.service_type,
  pick_up_location: booking.pick_up_location,
  drop_off_location: booking.drop_off_location,
  class: booking.class,
  date_and_time: booking.date_and_time,
  passengers: booking.passengers,
  childs: booking.childs,
  amount: booking.amount ?? null,
  currency: booking.currency || "QAR",
  payment_status: booking.payment_status || "pending",
  fatora_order_id: booking.fatora_order_id || null,
  fatora_transaction_id: booking.fatora_transaction_id || null,
  fatora_checkout_url: booking.fatora_checkout_url || null,
  payment_description: booking.payment_description || null,
  paid_at: booking.paid_at || null,
  created_at: booking.created_at,
  updated_at: booking.updated_at,
});

const createBooking = async (req, res, next) => {
  try {
    const {
      service_type,
      pick_up_location,
      drop_off_location,
      class: fleetClass,
      date_and_time,
      passengers,
      childs,
      amount,
      currency,
    } = req.body;

    if (
      !service_type ||
      !pick_up_location ||
      !drop_off_location ||
      !fleetClass ||
      !date_and_time ||
      passengers === undefined ||
      childs === undefined
    ) {
      return res.status(400).json({
        success: false,
        message:
          "service_type, pick_up_location, drop_off_location, class, date_and_time, passengers, and childs are required",
      });
    }

    const booking = await bookingService.createBooking(req.user, {
      service_type,
      pick_up_location,
      drop_off_location,
      class: fleetClass,
      date_and_time,
      passengers,
      childs,
      amount,
      currency,
    });

    res.status(201).json({
      success: true,
      message: "Booking created successfully",
      data: formatBooking(booking),
    });
  } catch (error) {
    next(error);
  }
};

const getBookings = async (req, res, next) => {
  try {
    const bookings = await bookingService.getBookingsByUser(req.user._id);

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings.map(formatBooking),
    });
  } catch (error) {
    next(error);
  }
};

const getBooking = async (req, res, next) => {
  try {
    const booking = await bookingService.getBookingById(req.params.id, req.user._id);

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    res.status(200).json({
      success: true,
      data: formatBooking(booking),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBooking,
  getBookings,
  getBooking,
  initiatePayment: async (req, res, next) => {
    try {
      const { amount, currency, language } = req.body;
      const result = await paymentService.initiatePayment(req.user, req.params.id, {
        amount,
        currency,
        language,
      });

      res.status(200).json({
        success: true,
        message: "Payment checkout created successfully",
        data: {
          booking: formatBooking(result.booking),
          checkout_url: result.checkout_url,
        },
      });
    } catch (error) {
      next(error);
    }
  },
  verifyPayment: async (req, res, next) => {
    try {
      const { transaction_id, order_id } = req.body;
      const result = await paymentService.verifyAndUpdatePayment(req.user, req.params.id, {
        transaction_id,
        order_id,
      });

      res.status(200).json({
        success: true,
        message: "Payment verified successfully",
        data: {
          booking: formatBooking(result.booking),
          payment: {
            payment_status: result.fatora.payment_status,
            transaction_id: result.fatora.transaction_id,
            amount: result.fatora.amount,
            currency: result.fatora.currency,
            description: result.fatora.description,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  },
  paymentWebhook: async (req, res, next) => {
    try {
      const booking = await paymentService.handleWebhook(req.query);

      res.status(200).json({
        success: true,
        message: "Webhook processed successfully",
        data: formatBooking(booking),
      });
    } catch (error) {
      next(error);
    }
  },
  getPaymentStatus: async (req, res, next) => {
    try {
      const booking = await paymentService.getPaymentStatus(req.user._id, req.params.id);

      res.status(200).json({
        success: true,
        data: formatBooking(booking),
      });
    } catch (error) {
      next(error);
    }
  },
};
