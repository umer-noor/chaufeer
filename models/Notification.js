const mongoose = require("mongoose");

const NOTIFICATION_TYPES = [
  "booking_created",
  "booking_cancelled",
  "booking_completed",
  "booking_inprogress",
  "booking_upcoming",
  "long_distance_quote",
  "quote_priced",
  "quote_expired",
];

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    recipient_role: {
      type: String,
      enum: ["admin", "user"],
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: NOTIFICATION_TYPES,
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    booking_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      default: null,
    },
    quote_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PriceQuote",
      default: null,
    },
    is_read: {
      type: Boolean,
      default: false,
      index: true,
    },
    meta: {
      type: Object,
      default: {},
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

notificationSchema.index({ recipient: 1, created_at: -1 });
notificationSchema.index({ recipient: 1, is_read: 1 });

module.exports = mongoose.model("Notification", notificationSchema);
module.exports.NOTIFICATION_TYPES = NOTIFICATION_TYPES;
