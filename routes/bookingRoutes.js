const express = require("express");
const bookingController = require("../controllers/bookingController");

const router = express.Router();

router.post("/create", bookingController.createBooking);
router.get("/get", bookingController.getBookings);
router.get("/payment/webhook", bookingController.paymentWebhook);
router.post("/payment/verify/:id", bookingController.verifyPayment);
router.post("/:id/pay", bookingController.initiatePayment);
router.get("/:id/payment/status", bookingController.getPaymentStatus);
router.get("/:id", bookingController.getBooking);

module.exports = router;
