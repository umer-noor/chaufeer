const mongoose = require("mongoose");

const customerReviewSchema = new mongoose.Schema(
  {
    section_title: {
      type: String,
      trim: true,
      default: "",
    },
    section_subtitle: {
      type: String,
      trim: true,
      default: "",
    },
    customer_name: {
      type: String,
      trim: true,
      default: "",
    },
    customer_image_url: {
      type: String,
      trim: true,
      default: "",
    },
    star_rating: {
      type: Number,
      default: 0,
    },
    review_title: {
      type: String,
      trim: true,
      default: "",
    },
    review_content: {
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

module.exports = mongoose.model("CustomerReview", customerReviewSchema);
