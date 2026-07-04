require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const corsOptions = require("./config/cors");
const appRoute = require("./appRoute");
const errorHandler = require("./middleware/errorHandler");

const app = express();

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Chaufeer API is running",
    docs: {
      health: "/api/health",
      auth: {
        signup: "POST /api/auth/signup",
        login: "POST /api/auth/login",
        logout: "POST /api/auth/logout",
        google: "POST /api/auth/signup/google",
        facebook: "POST /api/auth/signup/facebook",
        forgot_password: "POST /api/auth/forgot-password",
        verify_otp: "POST /api/auth/verify-otp",
        reset_password: "POST /api/auth/reset-password",
        profile: "GET /api/auth/profile",
        update_profile: "PUT /api/auth/profile",
        delete_account: "DELETE /api/auth/delete-account",
      },
      booking: {
        create: "POST /api/booking/create",
        get: "GET /api/booking/get",
        get_one: "GET /api/booking/:id",
        pay: "POST /api/booking/:id/pay",
        verify_payment: "POST /api/booking/payment/verify/:id",
        payment_status: "GET /api/booking/:id/payment/status",
        payment_webhook: "GET /api/booking/payment/webhook",
      },
      get_in_touch: {
        create: "POST /api/get_in_touch/create",
        get: "GET /api/get_in_touch/get",
        get_one: "GET /api/get_in_touch/:id",
      },
      fleet: {
        create: "POST /api/fleet/create",
        get: "GET /api/fleet/get",
        get_one: "GET /api/fleet/:id",
        update: "PUT /api/fleet/:id",
        delete: "DELETE /api/fleet/:id",
      },
      fleet_detail: {
        create: "POST /api/fleet_detail/create",
        get: "GET /api/fleet_detail/get",
        get_one: "GET /api/fleet_detail/:id",
        update: "PUT /api/fleet_detail/:id",
        delete: "DELETE /api/fleet_detail/:id",
      },
      service_coverage: {
        create: "POST /api/service_coverage/create",
        get: "GET /api/service_coverage/get",
        get_one: "GET /api/service_coverage/:id",
        update: "PUT /api/service_coverage/:id",
        delete: "DELETE /api/service_coverage/:id",
      },
      customer_review: {
        create: "POST /api/customer_review/create",
        get: "GET /api/customer_review/get",
        get_one: "GET /api/customer_review/:id",
        update: "PUT /api/customer_review/:id",
        delete: "DELETE /api/customer_review/:id",
      },
    },
  });
});

app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    next(error);
  }
});

app.use("/api", appRoute);

app.use(errorHandler);

module.exports = app;
