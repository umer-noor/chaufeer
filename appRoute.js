const express = require("express");
const userRoutes = require("./routes/userRoutes");
const authRoutes = require("./routes/authRoutes");

const router = express.Router();

router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API is running",
  });
});

router.use("/auth", authRoutes);
router.use("/users", userRoutes);

module.exports = router;
