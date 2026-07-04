const Booking = require("../models/Booking");
const { SERVICE_TYPES } = require("../models/Booking");
const { sendBookingConfirmationEmail } = require("../utils/sendEmail");

const createBooking = async (user, bookingData) => {
  if (!SERVICE_TYPES.includes(bookingData.service_type)) {
    const error = new Error(
      "Invalid service type. Use: airport_transfer, a_to_b_transfer, hourly_service, daily_service"
    );
    error.statusCode = 400;
    throw error;
  }

  const bookingPayload = {
    user: user._id,
    user_email: user.email,
    service_type: bookingData.service_type,
    pick_up_location: bookingData.pick_up_location,
    drop_off_location: bookingData.drop_off_location,
    class: bookingData.class,
    date_and_time: bookingData.date_and_time,
    passengers: bookingData.passengers,
    childs: bookingData.childs,
  };

  if (bookingData.amount !== undefined && bookingData.amount !== null) {
    bookingPayload.amount = Number(bookingData.amount);
    bookingPayload.currency =
      bookingData.currency || process.env.FATORA_CURRENCY || "QAR";
    bookingPayload.payment_status = "pending";
  }

  const booking = await Booking.create(bookingPayload);

  const shouldSendEmailNow = bookingPayload.amount === undefined;

  if (shouldSendEmailNow) {
    try {
      await sendBookingConfirmationEmail(booking, user);
    } catch (error) {
      console.error("Booking email failed:", error.message);
    }
  }

  return booking;
};

const getBookingsByUser = async (userId) => {
  return Booking.find({ user: userId }).sort({ created_at: -1 });
};

const getBookingById = async (bookingId, userId) => {
  return Booking.findOne({ _id: bookingId, user: userId });
};

module.exports = {
  createBooking,
  getBookingsByUser,
  getBookingById,
  SERVICE_TYPES,
};
