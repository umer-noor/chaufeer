const express = require("express");
const getInTouchController = require("../controllers/getInTouchController");
const rateLimit = require("../middleware/rateLimit");

const router = express.Router();

const formLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8,
  keyFn: (req) => `touch:${req.ip}`,
  message: "Too many contact requests. Please try again later.",
});

router.post("/create", formLimit, getInTouchController.getInTouch);
router.get("/get", getInTouchController.getInquiries);
router.get("/:id", getInTouchController.getInquiry);

module.exports = router;
