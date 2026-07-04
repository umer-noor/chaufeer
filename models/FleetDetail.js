const mongoose = require("mongoose");

const highlightSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      default: "",
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    icon_key: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: false }
);

const fleetDetailSchema = new mongoose.Schema(
  {
    fleet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Fleet",
      default: null,
    },
    title: {
      type: String,
      trim: true,
      default: "",
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    vehicle_image_url: {
      type: String,
      trim: true,
      default: "",
    },
    highlights: {
      type: [highlightSchema],
      default: [],
    },
    is_featured: {
      type: Boolean,
      default: false,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    display_order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

module.exports = mongoose.model("FleetDetail", fleetDetailSchema);
