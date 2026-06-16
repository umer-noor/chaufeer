const mongoose = require("mongoose");

const getInTouchSchema = new mongoose.Schema(
  {
    full_name: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
    },
    phone_number: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
    },
    email_address: {
      type: String,
      required: [true, "Email address is required"],
      lowercase: true,
      trim: true,
    },
    note: {
      type: String,
      required: [true, "Note is required"],
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("GetInTouch", getInTouchSchema);
