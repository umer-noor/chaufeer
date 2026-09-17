const express = require("express");
const authController = require("../controllers/authController");
const rateLimit = require("../middleware/rateLimit");

const router = express.Router();

const authLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  keyFn: (req) => `auth:${req.ip}:${req.path}`,
  message: "Too many auth attempts. Please try again in 15 minutes.",
});

const otpLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  keyFn: (req) => `otp:${req.ip}:${(req.body?.email || "").toLowerCase()}`,
  message: "Too many OTP requests. Please try again in 15 minutes.",
});

router.post("/signup", authLimit, authController.signup);
router.post("/signup/google", authLimit, authController.googleSignup);
router.post("/signup/facebook", authLimit, authController.facebookSignup);
router.post("/login", authLimit, authController.login);
router.post("/logout", authController.logout);
router.post("/forgot-password", otpLimit, authController.forgotPassword);
router.post("/verify-otp", otpLimit, authController.verifyOtp);
router.post("/verify-signup-otp", otpLimit, authController.verifySignupOtp);
router.post("/resend-signup-otp", otpLimit, authController.resendSignupOtp);
router.post("/reset-password", otpLimit, authController.resetPassword);
router.get("/profile", authController.getProfile);
router.put("/profile", authController.updateProfile);
router.delete("/delete-account", authController.deleteAccount);

module.exports = router;
