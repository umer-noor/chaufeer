const { OAuth2Client } = require("google-auth-library");
const axios = require("axios");
const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const { sendOtpEmail } = require("../utils/sendEmail");
const {
  generateOtp,
  isValidOtpFormat,
  hashOtp,
  compareOtp,
  getOtpExpiryDate,
} = require("../utils/otp");

const googleClient = new OAuth2Client();

const getGoogleClientIds = () => {
  return [
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_ID_IOS,
    process.env.GOOGLE_CLIENT_ID_ANDROID,
  ].filter(Boolean);
};

const signup = async ({ full_name, email, password, phone_number }) => {
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    const error = new Error("Email already registered");
    error.statusCode = 400;
    throw error;
  }

  const user = await User.create({
    full_name,
    email,
    password,
    phone_number,
    provider: "local",
    provider_id: email,
  });

  return { user, token: generateToken(user) };
};

const login = async ({ email, password }) => {
  const user = await User.findOne({ email }).select("+password");

  if (!user || user.provider !== "local") {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
  }

  const isPasswordValid = await user.comparePassword(password);

  if (!isPasswordValid) {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
  }

  return { user, token: generateToken(user) };
};

const verifyGoogleToken = async (id_token) => {
  const clientIds = getGoogleClientIds();

  if (clientIds.length === 0) {
    throw new Error("Google Client ID is not configured");
  }

  const ticket = await googleClient.verifyIdToken({
    idToken: id_token,
    audience: clientIds,
  });

  const payload = ticket.getPayload();

  if (!payload) {
    const error = new Error("Invalid Google token");
    error.statusCode = 401;
    throw error;
  }

  return {
    provider_id: payload.sub,
    email: payload.email,
    full_name: payload.name,
  };
};

const verifyFacebookToken = async (access_token) => {
  const appId = process.env.FACEBOOK_APP_ID;
  const appSecret = process.env.FACEBOOK_APP_SECRET;

  if (!appId || !appSecret) {
    throw new Error("Facebook App ID or Secret is not configured");
  }

  const debugUrl = `https://graph.facebook.com/debug_token?input_token=${access_token}&access_token=${appId}|${appSecret}`;
  const debugResponse = await axios.get(debugUrl);
  const debugData = debugResponse.data.data;

  if (!debugData?.is_valid) {
    const error = new Error("Invalid Facebook token");
    error.statusCode = 401;
    throw error;
  }

  if (debugData.app_id !== appId) {
    const error = new Error("Facebook token does not belong to this app");
    error.statusCode = 401;
    throw error;
  }

  const profileUrl = `https://graph.facebook.com/me?fields=id,name,email&access_token=${access_token}`;
  const profileResponse = await axios.get(profileUrl);
  const profile = profileResponse.data;

  return {
    provider_id: profile.id,
    email: profile.email || `facebook_${profile.id}@oauth.local`,
    full_name: profile.name,
  };
};

const findOrCreateOAuthUser = async (provider, profile) => {
  let user = await User.findOne({ provider, provider_id: profile.provider_id });

  if (user) {
    user.full_name = profile.full_name;
    if (profile.email && user.email.endsWith("@oauth.local")) {
      user.email = profile.email;
    }
    await user.save();
    return user;
  }

  const existingEmailUser = await User.findOne({ email: profile.email });

  if (existingEmailUser) {
    const error = new Error("Email already registered with another login method");
    error.statusCode = 400;
    throw error;
  }

  return User.create({
    full_name: profile.full_name,
    email: profile.email,
    provider,
    provider_id: profile.provider_id,
  });
};

const signupWithGoogle = async (id_token) => {
  const profile = await verifyGoogleToken(id_token);
  const user = await findOrCreateOAuthUser("google", profile);

  return { user, token: generateToken(user) };
};

const signupWithFacebook = async (access_token) => {
  const profile = await verifyFacebookToken(access_token);
  const user = await findOrCreateOAuthUser("facebook", profile);

  return { user, token: generateToken(user) };
};

const findLocalUserByEmail = async (email) => {
  return User.findOne({ email: email.toLowerCase().trim(), provider: "local" }).select(
    "+reset_password_otp +reset_password_otp_expires"
  );
};

const sendPasswordResetOtp = async (email) => {
  const user = await findLocalUserByEmail(email);

  if (!user) {
    const error = new Error("No account found with this email");
    error.statusCode = 404;
    throw error;
  }

  const otp = generateOtp();
  user.reset_password_otp = await hashOtp(otp);
  user.reset_password_otp_expires = getOtpExpiryDate();
  await user.save();

  await sendOtpEmail({
    email: user.email,
    full_name: user.full_name,
    otp,
    purpose: "password reset",
  });

  if (process.env.NODE_ENV === "development") {
    console.log(`[DEV] Password reset OTP for ${user.email}: ${otp}`);
  }

  return { email: user.email };
};

const verifyOtp = async ({ email, otp }) => {
  if (!isValidOtpFormat(otp)) {
    const error = new Error("OTP must be a 6-digit number");
    error.statusCode = 400;
    throw error;
  }

  const user = await findLocalUserByEmail(email);

  if (!user) {
    const error = new Error("No account found with this email");
    error.statusCode = 404;
    throw error;
  }

  if (!user.reset_password_otp || !user.reset_password_otp_expires) {
    const error = new Error(
      "No OTP found for this email. Call POST /api/auth/forgot-password first."
    );
    error.statusCode = 400;
    throw error;
  }

  if (user.reset_password_otp_expires < new Date()) {
    const error = new Error("OTP has expired. Please request a new one");
    error.statusCode = 400;
    throw error;
  }

  const isOtpValid = await compareOtp(otp, user.reset_password_otp);

  if (!isOtpValid) {
    const error = new Error("Invalid OTP");
    error.statusCode = 400;
    throw error;
  }

  return { email: user.email, verified: true };
};

const resetPassword = async ({ email, otp, new_password }) => {
  if (!new_password || new_password.length < 6) {
    const error = new Error("new_password must be at least 6 characters");
    error.statusCode = 400;
    throw error;
  }

  await verifyOtp({ email, otp });

  const user = await findLocalUserByEmail(email);
  user.password = new_password;
  user.reset_password_otp = undefined;
  user.reset_password_otp_expires = undefined;
  await user.save();

  return user;
};

const getProfile = async (user_id) => {
  const user = await User.findById(user_id);

  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  return user;
};

const updateProfile = async (user_id, { full_name, phone_number }) => {
  const user = await User.findById(user_id);

  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  if (full_name !== undefined) {
    user.full_name = full_name;
  }

  if (phone_number !== undefined) {
    user.phone_number = phone_number;
  }

  await user.save();
  return user;
};

const deleteAccount = async (user_id, password) => {
  const user = await User.findById(user_id).select("+password");

  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  if (user.provider === "local") {
    if (!password) {
      const error = new Error("password is required to delete a local account");
      error.statusCode = 400;
      throw error;
    }

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      const error = new Error("Invalid password");
      error.statusCode = 401;
      throw error;
    }
  }

  await User.findByIdAndDelete(user_id);
  return true;
};

module.exports = {
  signup,
  login,
  signupWithGoogle,
  signupWithFacebook,
  sendPasswordResetOtp,
  verifyOtp,
  resetPassword,
  getProfile,
  updateProfile,
  deleteAccount,
};
