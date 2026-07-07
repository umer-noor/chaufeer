const Booking = require("../models/Booking");
const Fleet = require("../models/Fleet");
const {
  SERVICE_TYPES,
  PAYMENT_METHODS,
  BOOKING_STATUSES,
} = require("../models/Booking");
const { sendBookingConfirmationEmail } = require("../utils/sendEmail");

const buildDateAndTime = (pickup_date, pickup_time, date_and_time) => {
  if (date_and_time) {
    return new Date(date_and_time);
  }

  if (pickup_date && pickup_time) {
    return new Date(`${pickup_date}T${pickup_time}:00`);
  }

  if (pickup_date) {
    return new Date(`${pickup_date}T00:00:00`);
  }

  return null;
};

const normalizeBookingInput = (data) => {
  const pickup_location = data.pickup_location || data.pick_up_location;
  const dropoff_location = data.dropoff_location || data.drop_off_location;
  const passengers_count = data.passengers_count ?? data.passengers;
  const children_count = data.children_count ?? data.childs ?? 0;
  const fleet_name = data.fleet_name || data.class || "";
  const pickup_date = data.pickup_date || "";
  const pickup_time = data.pickup_time || "";

  return {
    service_type: data.service_type,
    fleet_id: data.fleet_id || null,
    fleet_name,
    pickup_location,
    pickup_latitude: data.pickup_latitude ?? null,
    pickup_longitude: data.pickup_longitude ?? null,
    dropoff_location,
    dropoff_latitude: data.dropoff_latitude ?? null,
    dropoff_longitude: data.dropoff_longitude ?? null,
    pickup_date,
    pickup_time,
    date_and_time: buildDateAndTime(pickup_date, pickup_time, data.date_and_time),
    passengers_count,
    children_count,
    hours: data.hours ?? null,
    passenger_name: data.passenger_name || "",
    passenger_email: data.passenger_email || "",
    phone_number: data.phone_number || "",
    special_requests: data.special_requests || "",
    payment_method: data.payment_method || "cash",
    addons: Array.isArray(data.addons) ? data.addons : [],
    amount: data.amount,
    currency: data.currency,
  };
};

const resolveFleetName = async (fleet_id, fleet_name) => {
  if (!fleet_id) {
    return fleet_name || "";
  }

  const fleet = await Fleet.findById(fleet_id);

  if (!fleet) {
    const error = new Error("Fleet not found");
    error.statusCode = 404;
    throw error;
  }

  return fleet.vehicle_name || fleet_name || "";
};

const createBooking = async (user, bookingData) => {
  const normalized = normalizeBookingInput(bookingData);

  if (!SERVICE_TYPES.includes(normalized.service_type)) {
    const error = new Error(
      "Invalid service type. Use: airport_transfer, a_to_b_transfer, hourly_service, daily_service"
    );
    error.statusCode = 400;
    throw error;
  }

  if (normalized.payment_method && !PAYMENT_METHODS.includes(normalized.payment_method)) {
    const error = new Error("Invalid payment_method. Use: cash, card, paypal");
    error.statusCode = 400;
    throw error;
  }

  if (!normalized.pickup_location || !normalized.dropoff_location) {
    const error = new Error("pickup_location and dropoff_location are required");
    error.statusCode = 400;
    throw error;
  }

  if (normalized.passengers_count === undefined || normalized.passengers_count === null) {
    const error = new Error("passengers_count is required");
    error.statusCode = 400;
    throw error;
  }

  const fleet_name = await resolveFleetName(normalized.fleet_id, normalized.fleet_name);

  const bookingPayload = {
    user: user._id,
    user_email: user.email,
    ...normalized,
    fleet_name,
    booking_status: "confirmed",
  };

  if (bookingPayload.amount !== undefined && bookingPayload.amount !== null) {
    bookingPayload.amount = Number(bookingPayload.amount);
    bookingPayload.currency =
      bookingPayload.currency || process.env.FATORA_CURRENCY || "QAR";
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
  return Booking.find({ user: userId })
    .populate("fleet_id", "vehicle_name vehicle_type category image_url")
    .sort({ created_at: -1 });
};

const getBookingById = async (bookingId, userId) => {
  return Booking.findOne({ _id: bookingId, user: userId }).populate(
    "fleet_id",
    "vehicle_name vehicle_type category image_url"
  );
};

const assertBookingIsEditable = (booking) => {
  if (!booking) {
    const error = new Error("Booking not found");
    error.statusCode = 404;
    throw error;
  }

  if (booking.booking_status === "cancelled") {
    const error = new Error("Cancelled booking cannot be updated");
    error.statusCode = 400;
    throw error;
  }

  if (booking.booking_status === "completed") {
    const error = new Error("Completed booking cannot be updated");
    error.statusCode = 400;
    throw error;
  }
};

const updateBooking = async (bookingId, userId, bookingData) => {
  const booking = await Booking.findOne({ _id: bookingId, user: userId });
  assertBookingIsEditable(booking);

  const merged = { ...booking.toObject(), ...bookingData };
  const normalized = normalizeBookingInput(merged);

  if (bookingData.service_type && !SERVICE_TYPES.includes(normalized.service_type)) {
    const error = new Error(
      "Invalid service type. Use: airport_transfer, a_to_b_transfer, hourly_service, daily_service"
    );
    error.statusCode = 400;
    throw error;
  }

  if (
    bookingData.payment_method &&
    !PAYMENT_METHODS.includes(normalized.payment_method)
  ) {
    const error = new Error("Invalid payment_method. Use: cash, card, paypal");
    error.statusCode = 400;
    throw error;
  }

  const allowedFields = [
    "service_type",
    "fleet_id",
    "fleet_name",
    "pickup_location",
    "pickup_latitude",
    "pickup_longitude",
    "dropoff_location",
    "dropoff_latitude",
    "dropoff_longitude",
    "pickup_date",
    "pickup_time",
    "date_and_time",
    "passengers_count",
    "children_count",
    "hours",
    "passenger_name",
    "passenger_email",
    "phone_number",
    "special_requests",
    "payment_method",
    "addons",
  ];

  const hasUpdate =
    allowedFields.some((field) => bookingData[field] !== undefined) ||
    bookingData.pick_up_location !== undefined ||
    bookingData.drop_off_location !== undefined ||
    bookingData.passengers !== undefined ||
    bookingData.childs !== undefined ||
    bookingData.class !== undefined;

  if (!hasUpdate) {
    const error = new Error("No valid fields provided to update");
    error.statusCode = 400;
    throw error;
  }

  allowedFields.forEach((field) => {
    booking[field] = normalized[field];
  });

  if (
    bookingData.fleet_id !== undefined ||
    bookingData.fleet_name !== undefined ||
    bookingData.class !== undefined
  ) {
    booking.fleet_name = await resolveFleetName(booking.fleet_id, booking.fleet_name);
  }

  await booking.save();
  return booking.populate("fleet_id", "vehicle_name vehicle_type category image_url");
};

const cancelBooking = async (bookingId, userId) => {
  const booking = await Booking.findOne({ _id: bookingId, user: userId });

  if (!booking) {
    const error = new Error("Booking not found");
    error.statusCode = 404;
    throw error;
  }

  if (booking.booking_status === "cancelled") {
    const error = new Error("Booking is already cancelled");
    error.statusCode = 400;
    throw error;
  }

  if (booking.booking_status === "completed") {
    const error = new Error("Completed booking cannot be cancelled");
    error.statusCode = 400;
    throw error;
  }

  booking.booking_status = "cancelled";
  await booking.save();

  return booking.populate("fleet_id", "vehicle_name vehicle_type category image_url");
};

module.exports = {
  createBooking,
  getBookingsByUser,
  getBookingById,
  updateBooking,
  cancelBooking,
  SERVICE_TYPES,
  PAYMENT_METHODS,
  BOOKING_STATUSES,
};
