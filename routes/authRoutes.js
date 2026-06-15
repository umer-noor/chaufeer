const express = require("express");
const authController = require("../controllers/authController");

const router = express.Router();

router.post("/signup", authController.signup);
router.post("/signup/google", authController.googleSignup);
router.post("/signup/facebook", authController.facebookSignup);
router.post("/login", authController.login);
router.post("/logout", authController.logout);

module.exports = router;
