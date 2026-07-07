const mongoose = require("mongoose");

const SERVICE_TYPES = [
  "airport_transfer",
  "a_to_b_transfer",
  "hourly_service",
  "daily_service",
];

const PAYMENT_METHODS = ["cash", "card", "paypal"];
const BOOKING_STATUSES = ["pending", "confirmed", "cancelled", "completed"];

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
    fleet_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Fleet",
      default: null,
    },
    fleet_name: {
      type: String,
      trim: true,
      default: "",
    },
    pickup_location: {
      type: String,
      required: [true, "Pickup location is required"],
      trim: true,
    },
    pickup_latitude: {
      type: Number,
      default: null,
    },
    pickup_longitude: {
      type: Number,
      default: null,
    },
    dropoff_location: {
      type: String,
      required: [true, "Dropoff location is required"],
      trim: true,
    },
    dropoff_latitude: {
      type: Number,
      default: null,
    },
    dropoff_longitude: {
      type: Number,
      default: null,
    },
    pickup_date: {
      type: String,
      trim: true,
      default: "",
    },
    pickup_time: {
      type: String,
      trim: true,
      default: "",
    },
    date_and_time: {
      type: Date,
      default: null,
    },
    passengers_count: {
      type: Number,
      required: [true, "Passengers count is required"],
      min: [0, "Passengers count cannot be negative"],
    },
    children_count: {
      type: Number,
      default: 0,
      min: [0, "Children count cannot be negative"],
    },
    hours: {
      type: Number,
      default: null,
      min: [0, "Hours cannot be negative"],
    },
    passenger_name: {
      type: String,
      trim: true,
      default: "",
    },
    passenger_email: {
      type: String,
      lowercase: true,
      trim: true,
      default: "",
    },
    phone_number: {
      type: String,
      trim: true,
      default: "",
    },
    special_requests: {
      type: String,
      trim: true,
      default: "",
    },
    payment_method: {
      type: String,
      enum: PAYMENT_METHODS,
      default: "cash",
    },
    addons: {
      type: [String],
      default: [],
    },
    booking_status: {
      type: String,
      enum: BOOKING_STATUSES,
      default: "confirmed",
    },
    amount: {
      type: Number,
      min: [0, "Amount cannot be negative"],
    },
    currency: {
      type: String,
      default: "QAR",
      trim: true,
    },
    payment_status: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },
    fatora_order_id: {
      type: String,
      trim: true,
    },
    fatora_transaction_id: {
      type: String,
      trim: true,
    },
    fatora_checkout_url: {
      type: String,
      trim: true,
    },
    payment_response_code: {
      type: String,
      trim: true,
    },
    payment_description: {
      type: String,
      trim: true,
    },
    paid_at: {
      type: Date,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

module.exports = mongoose.model("Booking", bookingSchema);
module.exports.SERVICE_TYPES = SERVICE_TYPES;
module.exports.PAYMENT_METHODS = PAYMENT_METHODS;
module.exports.BOOKING_STATUSES = BOOKING_STATUSES;
