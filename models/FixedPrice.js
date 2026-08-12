const mongoose = require("mongoose");

// Edge case 2: fixed price for rides under 45km (per fleet)
const fixedPriceSchema = new mongoose.Schema(
  {
    fleet_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Fleet",
      required: true,
      unique: true,
    },
    price: {
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

module.exports = mongoose.model("FixedPrice", fixedPriceSchema);
