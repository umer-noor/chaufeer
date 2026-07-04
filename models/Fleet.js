const mongoose = require("mongoose");

const FLEET_CATEGORIES = [
  "green_class",
  "ultra_luxury",
  "business_van",
  "vip_business_class",
  "economy_class",
];

const VEHICLE_TYPES = ["sedan", "suv", "van"];

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
