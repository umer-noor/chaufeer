const express = require("express");
const userRoutes = require("./routes/userRoutes");
const authRoutes = require("./routes/authRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const getInTouchRoutes = require("./routes/getInTouchRoutes");
const fleetRoutes = require("./routes/fleetRoutes");
const fleetDetailRoutes = require("./routes/fleetDetailRoutes");
const serviceCoverageRoutes = require("./routes/serviceCoverageRoutes");
const customerReviewRoutes = require("./routes/customerReviewRoutes");
const requireAuthUnlessPublic = require("./middleware/routeAuth");

const router = express.Router();

router.use(requireAuthUnlessPublic);

router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API is running",
  });
});

router.use("/auth", authRoutes);
router.use("/booking", bookingRoutes);
router.use("/get_in_touch", getInTouchRoutes);
router.use("/fleet", fleetRoutes);
router.use("/fleet_detail", fleetDetailRoutes);
router.use("/service_coverage", serviceCoverageRoutes);
router.use("/customer_review", customerReviewRoutes);
router.use("/users", userRoutes);

module.exports = router;
