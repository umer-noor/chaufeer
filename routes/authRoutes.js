const express = require("express");
const authController = require("../controllers/authController");

const router = express.Router();

router.post("/signup", authController.signup);
router.post("/signup/google", authController.googleSignup);
router.post("/signup/facebook", authController.facebookSignup);
router.post("/login", authController.login);
router.post("/logout", authController.logout);
router.post("/forgot-password", authController.forgotPassword);
router.post("/verify-otp", authController.verifyOtp);
router.post("/reset-password", authController.resetPassword);
router.get("/profile", authController.getProfile);
router.put("/profile", authController.updateProfile);
router.delete("/delete-account", authController.deleteAccount);

module.exports = router;
