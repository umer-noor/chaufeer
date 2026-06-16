const express = require("express");
const bookingController = require("../controllers/bookingController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/create", protect, bookingController.createBooking);
router.get("/get", protect, bookingController.getBookings);
router.get("/:id", protect, bookingController.getBooking);

module.exports = router;
