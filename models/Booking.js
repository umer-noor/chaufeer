const mongoose = require("mongoose");

const SERVICE_TYPES = [
  "airport_transfer",
  "a_to_b_transfer",
  "hourly_service",
  "daily_service",
];

const bookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    user_email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    service_type: {
      type: String,
      enum: SERVICE_TYPES,
      required: [true, "Service type is required"],
    },
    pick_up_location: {
      type: String,
      required: [true, "Pick up location is required"],
      trim: true,
    },
    drop_off_location: {
      type: String,
      required: [true, "Drop off location is required"],
      trim: true,
    },
    class: {
      type: String,
      required: [true, "Class is required"],
      trim: true,
    },
    date_and_time: {
      type: Date,
      required: [true, "Date and time is required"],
    },
    passengers: {
      type: Number,
      required: [true, "Passengers is required"],
      min: [0, "Passengers cannot be negative"],
    },
    childs: {
      type: Number,
      required: [true, "Childs is required"],
      min: [0, "Childs cannot be negative"],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Booking", bookingSchema);
module.exports.SERVICE_TYPES = SERVICE_TYPES;
