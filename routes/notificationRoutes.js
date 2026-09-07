const express = require("express");
const notificationController = require("../controllers/notificationController");

const router = express.Router();

router.get("/get", notificationController.getNotifications);
router.get("/unread-count", notificationController.getUnreadCount);
router.get("/mark-all-read", notificationController.markAllNotificationsRead);
router.get("/:id/read", notificationController.markNotificationRead);

module.exports = router;
