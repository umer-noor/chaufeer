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
