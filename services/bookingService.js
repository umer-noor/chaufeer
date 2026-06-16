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

  const booking = await Booking.create({
    user: user._id,
    user_email: user.email,
    service_type: bookingData.service_type,
    pick_up_location: bookingData.pick_up_location,
    drop_off_location: bookingData.drop_off_location,
    class: bookingData.class,
    date_and_time: bookingData.date_and_time,
    passengers: bookingData.passengers,
    childs: bookingData.childs,
  });

  try {
    await sendBookingConfirmationEmail(booking, user);
  } catch (error) {
    console.error("Booking email failed:", error.message);
  }

  return booking;
};

const getBookingsByUser = async (userId) => {
  return Booking.find({ user: userId }).sort({ createdAt: -1 });
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
