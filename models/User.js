const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    full_name: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      minlength: 6,
      select: false,
      required: function () {
        return this.provider === "local";
      },
    },
    phone_number: {
      type: String,
      trim: true,
      required: function () {
        return this.provider === "local";
      },
    },
    provider: {
      type: String,
      enum: ["local", "google", "facebook"],
      default: "local",
    },
    provider_id: {
      type: String,
      default: null,
    },
    reset_password_otp: {
      type: String,
      select: false,
    },
    reset_password_otp_expires: {
      type: Date,
      select: false,
    },
    signup_otp: {
      type: String,
      select: false,
    },
    signup_otp_expires: {
      type: Date,
      select: false,
    },
    is_email_verified: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

// OAuth only — local users are unique by email; avoid null provider_id collisions
userSchema.index(
  { provider: 1, provider_id: 1 },
  {
    unique: true,
    partialFilterExpression: {
      provider: { $in: ["google", "facebook"] },
      provider_id: { $exists: true, $type: "string" },
    },
  }
);

userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) {
    return false;
  }

  // Support existing bcrypt-hashed passwords until they are reset
  if (this.password.startsWith("$2a$") || this.password.startsWith("$2b$")) {
    return bcrypt.compare(candidatePassword, this.password);
  }

  return this.password === candidatePassword;
};

module.exports = mongoose.model("User", userSchema);
module.exports.ROLES = ["user", "admin"];
