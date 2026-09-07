const Notification = require("../models/Notification");
const User = require("../models/User");
const {
  buildBookingCreated,
  buildBookingCancelled,
  buildBookingCompleted,
  buildBookingInProgress,
  buildLongDistanceQuote,
  buildQuotePriced,
  buildQuoteExpired,
} = require("../utils/notificationMessages");

const createNotification = async ({
  recipient,
  recipient_role,
  type,
  title,
  message,
  booking_id = null,
  quote_id = null,
  meta = {},
}) => {
  if (!recipient || !title || !message) {
    return null;
  }

  return Notification.create({
    recipient,
    recipient_role,
    type,
    title,
    message,
    booking_id,
    quote_id,
    is_read: false,
    meta,
  });
};

const getAdminIds = async () => {
  const admins = await User.find({ role: "admin" }).select("_id");
  return admins.map((admin) => admin._id);
};

const notifyAdmins = async ({ type, title, message, booking_id, quote_id, meta }) => {
  const adminIds = await getAdminIds();

  await Promise.all(
    adminIds.map((adminId) =>
      createNotification({
        recipient: adminId,
        recipient_role: "admin",
        type,
        title,
        message,
        booking_id,
        quote_id,
        meta,
      })
    )
  );
};

const notifyUser = async ({
  userId,
  type,
  title,
  message,
  booking_id,
  quote_id,
  meta,
}) => {
  if (!userId) {
    return null;
  }

  return createNotification({
    recipient: userId,
    recipient_role: "user",
    type,
    title,
    message,
    booking_id,
    quote_id,
    meta,
  });
};

const notifyBookingCreated = async (booking, customer) => {
  const texts = buildBookingCreated({
    booking,
    customerName: customer?.full_name || booking.passenger_name || "Customer",
  });

  try {
    await notifyAdmins({
      type: "booking_created",
      title: texts.admin.title,
      message: texts.admin.message,
      booking_id: booking._id,
      meta: { booking_status: booking.booking_status || "upcoming" },
    });

    await notifyUser({
      userId: booking.user,
      type: "booking_created",
      title: texts.user.title,
      message: texts.user.message,
      booking_id: booking._id,
      meta: { booking_status: booking.booking_status || "upcoming" },
    });
  } catch (error) {
    console.error("notifyBookingCreated failed:", error.message);
  }
};

const notifyBookingStatusChanged = async (booking, status, customerName) => {
  let texts = null;
  let type = null;

  if (status === "cancelled") {
    type = "booking_cancelled";
    texts = buildBookingCancelled({ booking, customerName });
  } else if (status === "completed") {
    type = "booking_completed";
    texts = buildBookingCompleted({ booking, customerName });
  } else if (status === "inprogress") {
    type = "booking_inprogress";
    texts = buildBookingInProgress({ booking });
  } else {
    return;
  }

  try {
    await notifyAdmins({
      type,
      title: texts.admin.title,
      message: texts.admin.message,
      booking_id: booking._id,
      meta: { booking_status: status },
    });

    await notifyUser({
      userId: booking.user?._id || booking.user,
      type,
      title: texts.user.title,
      message: texts.user.message,
      booking_id: booking._id,
      meta: { booking_status: status },
    });
  } catch (error) {
    console.error("notifyBookingStatusChanged failed:", error.message);
  }
};

const notifyLongDistanceQuote = async (quote, customer) => {
  const texts = buildLongDistanceQuote({
    quote,
    customerName: customer?.full_name || "Customer",
    distanceKm: quote.distance_km,
  });

  try {
    await notifyAdmins({
      type: "long_distance_quote",
      title: texts.admin.title,
      message: texts.admin.message,
      quote_id: quote._id || quote.quote_id,
      meta: { distance_km: quote.distance_km, status: "awaiting_admin" },
    });

    await notifyUser({
      userId: quote.user || customer?._id,
      type: "long_distance_quote",
      title: texts.user.title,
      message: texts.user.message,
      quote_id: quote._id || quote.quote_id,
      meta: { distance_km: quote.distance_km, status: "awaiting_admin" },
    });
  } catch (error) {
    console.error("notifyLongDistanceQuote failed:", error.message);
  }
};

const notifyQuotePriced = async (quote) => {
  const texts = buildQuotePriced({
    quote,
    amount: quote.amount,
    currency: quote.currency,
  });

  try {
    await notifyAdmins({
      type: "quote_priced",
      title: texts.admin.title,
      message: texts.admin.message,
      quote_id: quote._id,
      meta: { amount: quote.amount, currency: quote.currency },
    });

    await notifyUser({
      userId: quote.user,
      type: "quote_priced",
      title: texts.user.title,
      message: texts.user.message,
      quote_id: quote._id,
      meta: { amount: quote.amount, currency: quote.currency },
    });
  } catch (error) {
    console.error("notifyQuotePriced failed:", error.message);
  }
};

const notifyQuoteExpired = async (quote) => {
  const texts = buildQuoteExpired({
    quote,
    distanceKm: quote.distance_km,
  });

  try {
    await notifyAdmins({
      type: "quote_expired",
      title: texts.admin.title,
      message: texts.admin.message,
      quote_id: quote._id,
      meta: { distance_km: quote.distance_km },
    });

    await notifyUser({
      userId: quote.user,
      type: "quote_expired",
      title: texts.user.title,
      message: texts.user.message,
      quote_id: quote._id,
      meta: { distance_km: quote.distance_km },
    });
  } catch (error) {
    console.error("notifyQuoteExpired failed:", error.message);
  }
};

const getNotificationsForUser = async (userId, { is_read, limit = 50 } = {}) => {
  const filter = { recipient: userId };

  if (is_read === "true" || is_read === true) {
    filter.is_read = true;
  } else if (is_read === "false" || is_read === false) {
    filter.is_read = false;
  }

  const safeLimit = Math.min(Number(limit) || 50, 100);

  return Notification.find(filter).sort({ created_at: -1 }).limit(safeLimit);
};

const getUnreadCount = async (userId) => {
  return Notification.countDocuments({ recipient: userId, is_read: false });
};

const markAsRead = async (notificationId, userId) => {
  const notification = await Notification.findOne({
    _id: notificationId,
    recipient: userId,
  });

  if (!notification) {
    const error = new Error("Notification not found");
    error.statusCode = 404;
    throw error;
  }

  if (!notification.is_read) {
    notification.is_read = true;
    await notification.save();
  }

  return notification;
};

const markAllAsRead = async (userId) => {
  const result = await Notification.updateMany(
    { recipient: userId, is_read: false },
    { $set: { is_read: true } }
  );

  return { modified_count: result.modifiedCount || 0 };
};

module.exports = {
  createNotification,
  notifyBookingCreated,
  notifyBookingStatusChanged,
  notifyLongDistanceQuote,
  notifyQuotePriced,
  notifyQuoteExpired,
  getNotificationsForUser,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
};
