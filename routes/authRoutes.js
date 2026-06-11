const express = require("express");
const authController = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/google", authController.googleAuth);
router.post("/facebook", authController.facebookAuth);
router.get("/me", protect, authController.getMe);

module.exports = router;
