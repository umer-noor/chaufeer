const mongoose = require("mongoose");

// Approved Maseer 8-category structure (auditor go-live)
const FLEET_CATEGORIES = [
  "economy_executive_sedans",
  "business_class_sedans",
  "first_class_sedans",
  "premium_suvs",
  "luxury_ultra_luxury",
  "vans_minivans",
  "coasters_buses",
  "electric_mobility",
];

const VEHICLE_TYPES = ["sedan", "suv", "van", "bus", "ev"];

const fleetSchema = new mongoose.Schema(
  {
    vehicle_name: {
      type: String,
      trim: true,
      default: "",
    },
    vehicle_type: {
      type: String,
      trim: true,
      default: "",
    },
    category: {
      type: String,
      trim: true,
      default: "",
    },
    image_url: {
      type: String,
      trim: true,
      default: "",
    },
    seat_count: {
      type: Number,
      default: 0,
    },
    luggage_capacity: {
      type: Number,
      default: 0,
    },
    amenities: [
      {
        name: {
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
    ],
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

module.exports = mongoose.model("Fleet", fleetSchema);
module.exports.FLEET_CATEGORIES = FLEET_CATEGORIES;
module.exports.VEHICLE_TYPES = VEHICLE_TYPES;
