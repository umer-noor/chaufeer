const bookingService = require("../services/bookingService");

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
  createdAt: booking.createdAt,
  updatedAt: booking.updatedAt,
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
};
