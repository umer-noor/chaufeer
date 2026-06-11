const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      sparse: true,
    },
    avatar: {
      type: String,
      default: null,
    },
    provider: {
      type: String,
      enum: ["google", "facebook", "local"],
      required: true,
    },
    providerId: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.index({ provider: 1, providerId: 1 }, { unique: true });
userSchema.index({ email: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model("User", userSchema);
