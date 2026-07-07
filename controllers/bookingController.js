const bookingService = require("../services/bookingService");
const paymentService = require("../services/paymentService");

const formatFleetRef = (fleet) => {
  if (!fleet) {
    return null;
  }

  if (typeof fleet === "string") {
    return { id: fleet };
  }

  return {
    id: fleet._id,
    vehicle_name: fleet.vehicle_name,
    vehicle_type: fleet.vehicle_type,
    category: fleet.category,
    image_url: fleet.image_url,
  };
};

const formatBooking = (booking) => ({
  id: booking._id,
  user_email: booking.user_email,
  service_type: booking.service_type,
  fleet_id: booking.fleet_id?._id || booking.fleet_id || null,
  fleet_name: booking.fleet_name || "",
  fleet: formatFleetRef(booking.fleet_id),
  pickup_location: booking.pickup_location,
  pickup_latitude: booking.pickup_latitude ?? null,
  pickup_longitude: booking.pickup_longitude ?? null,
  dropoff_location: booking.dropoff_location,
  dropoff_latitude: booking.dropoff_latitude ?? null,
  dropoff_longitude: booking.dropoff_longitude ?? null,
  pickup_date: booking.pickup_date || "",
  pickup_time: booking.pickup_time || "",
  date_and_time: booking.date_and_time || null,
  passengers_count: booking.passengers_count,
  children_count: booking.children_count ?? 0,
  hours: booking.hours ?? null,
  passenger_name: booking.passenger_name || "",
  passenger_email: booking.passenger_email || "",
  phone_number: booking.phone_number || "",
  special_requests: booking.special_requests || "",
  payment_method: booking.payment_method || "cash",
  addons: booking.addons || [],
  booking_status: booking.booking_status || "confirmed",
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
    const booking = await bookingService.createBooking(req.user, req.body);

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

const updateBooking = async (req, res, next) => {
  try {
    const booking = await bookingService.updateBooking(
      req.params.id,
      req.user._id,
      req.body
    );

    res.status(200).json({
      success: true,
      message: "Booking updated successfully",
      data: formatBooking(booking),
    });
  } catch (error) {
    next(error);
  }
};

const cancelBooking = async (req, res, next) => {
  try {
    const booking = await bookingService.cancelBooking(req.params.id, req.user._id);

    res.status(200).json({
      success: true,
      message: "Booking cancelled successfully",
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
  updateBooking,
  cancelBooking,
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
