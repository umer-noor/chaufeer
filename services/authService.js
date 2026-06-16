const { OAuth2Client } = require("google-auth-library");
const axios = require("axios");
const User = require("../models/User");
const generateToken = require("../utils/generateToken");

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
    providerId: email,
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

const verifyGoogleToken = async (idToken) => {
  const clientIds = getGoogleClientIds();

  if (clientIds.length === 0) {
    throw new Error("Google Client ID is not configured");
  }

  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: clientIds,
  });

  const payload = ticket.getPayload();

  if (!payload) {
    const error = new Error("Invalid Google token");
    error.statusCode = 401;
    throw error;
  }

  return {
    providerId: payload.sub,
    email: payload.email,
    full_name: payload.name,
  };
};

const verifyFacebookToken = async (accessToken) => {
  const appId = process.env.FACEBOOK_APP_ID;
  const appSecret = process.env.FACEBOOK_APP_SECRET;

  if (!appId || !appSecret) {
    throw new Error("Facebook App ID or Secret is not configured");
  }

  const debugUrl = `https://graph.facebook.com/debug_token?input_token=${accessToken}&access_token=${appId}|${appSecret}`;
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

  const profileUrl = `https://graph.facebook.com/me?fields=id,name,email&access_token=${accessToken}`;
  const profileResponse = await axios.get(profileUrl);
  const profile = profileResponse.data;

  return {
    providerId: profile.id,
    email: profile.email || `facebook_${profile.id}@oauth.local`,
    full_name: profile.name,
  };
};

const findOrCreateOAuthUser = async (provider, profile) => {
  let user = await User.findOne({ provider, providerId: profile.providerId });

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
    providerId: profile.providerId,
  });
};

const signupWithGoogle = async (idToken) => {
  const profile = await verifyGoogleToken(idToken);
  const user = await findOrCreateOAuthUser("google", profile);

  return { user, token: generateToken(user) };
};

const signupWithFacebook = async (accessToken) => {
  const profile = await verifyFacebookToken(accessToken);
  const user = await findOrCreateOAuthUser("facebook", profile);

  return { user, token: generateToken(user) };
};

module.exports = {
  signup,
  login,
  signupWithGoogle,
  signupWithFacebook,
};
