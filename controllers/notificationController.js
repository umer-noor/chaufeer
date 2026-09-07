const notificationService = require("../services/notificationService");

const formatNotification = (item) => ({
  id: item._id,
  type: item.type,
  title: item.title,
  message: item.message,
  booking_id: item.booking_id || null,
  quote_id: item.quote_id || null,
  is_read: Boolean(item.is_read),
  recipient_role: item.recipient_role,
  meta: item.meta || {},
  created_at: item.created_at,
  updated_at: item.updated_at,
});

const getNotifications = async (req, res, next) => {
  try {
    const notifications = await notificationService.getNotificationsForUser(req.user._id, {
      is_read: req.query.is_read,
      limit: req.query.limit,
    });

    const unread_count = await notificationService.getUnreadCount(req.user._id);

    res.status(200).json({
      success: true,
      count: notifications.length,
      unread_count,
      data: notifications.map(formatNotification),
    });
  } catch (error) {
    next(error);
  }
};

const getUnreadCount = async (req, res, next) => {
  try {
    const unread_count = await notificationService.getUnreadCount(req.user._id);

    res.status(200).json({
      success: true,
      data: { unread_count },
    });
  } catch (error) {
    next(error);
  }
};

// GET routes so UI can mark read without a separate PUT API design
const markNotificationRead = async (req, res, next) => {
  try {
    const notification = await notificationService.markAsRead(req.params.id, req.user._id);

    res.status(200).json({
      success: true,
      message: "Notification marked as read",
      data: formatNotification(notification),
    });
  } catch (error) {
    next(error);
  }
};

const markAllNotificationsRead = async (req, res, next) => {
  try {
    const result = await notificationService.markAllAsRead(req.user._id);

    res.status(200).json({
      success: true,
      message: "All notifications marked as read",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
};
