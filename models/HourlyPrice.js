const mongoose = require("mongoose");

// Edge case 3: hourly (dynamic) price per fleet
const hourlyPriceSchema = new mongoose.Schema(
  {
    fleet_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Fleet",
      required: true,
      unique: true,
    },
    price_per_hour: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: "KWD",
      trim: true,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

module.exports = mongoose.model("HourlyPrice", hourlyPriceSchema);
