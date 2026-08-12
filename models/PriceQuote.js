const mongoose = require("mongoose");

const QUOTE_STATUSES = ["awaiting_admin", "priced", "expired", "cancelled"];
const PRICING_MODES = ["fixed", "hourly", "long_distance"];

// Edge case 1: distance > 45km — waiting for admin to set price (15 min)
const priceQuoteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    fleet_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Fleet",
      default: null,
    },
    pickup_latitude: { type: Number, default: null },
    pickup_longitude: { type: Number, default: null },
    dropoff_latitude: { type: Number, default: null },
    dropoff_longitude: { type: Number, default: null },
    pickup_location: { type: String, trim: true, default: "" },
    dropoff_location: { type: String, trim: true, default: "" },
    distance_km: { type: Number, required: true },
    pricing_mode: {
      type: String,
      enum: PRICING_MODES,
      default: "long_distance",
    },
    status: {
      type: String,
      enum: QUOTE_STATUSES,
      default: "awaiting_admin",
    },
    amount: {
      type: Number,
      default: null,
    },
    currency: {
      type: String,
      default: "KWD",
      trim: true,
    },
    admin_note: {
      type: String,
      trim: true,
      default: "",
    },
    priced_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    expires_at: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

priceQuoteSchema.index({ status: 1, created_at: -1 });
priceQuoteSchema.index({ expires_at: 1 });

module.exports = mongoose.model("PriceQuote", priceQuoteSchema);
module.exports.QUOTE_STATUSES = QUOTE_STATUSES;
module.exports.PRICING_MODES = PRICING_MODES;
module.exports.LONG_DISTANCE_KM = 45;
module.exports.QUOTE_TTL_MINUTES = 15;
