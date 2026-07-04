const mongoose = require("mongoose");

const SECTION_TYPES = ["featured", "itinerary"];

const serviceCoverageSchema = new mongoose.Schema(
  {
    section_type: {
      type: String,
      trim: true,
      default: "",
    },
    section_heading: {
      type: String,
      trim: true,
      default: "",
    },
    section_subtitle: {
      type: String,
      trim: true,
      default: "",
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
    image_url: {
      type: String,
      trim: true,
      default: "",
    },
    icon_key: {
      type: String,
      trim: true,
      default: "",
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

module.exports = mongoose.model("ServiceCoverage", serviceCoverageSchema);
module.exports.SECTION_TYPES = SECTION_TYPES;
