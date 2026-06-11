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
    name: payload.name,
    avatar: payload.picture || null,
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

  const profileUrl = `https://graph.facebook.com/me?fields=id,name,email,picture.type(large)&access_token=${accessToken}`;
  const profileResponse = await axios.get(profileUrl);
  const profile = profileResponse.data;

  return {
    providerId: profile.id,
    email: profile.email || null,
    name: profile.name,
    avatar: profile.picture?.data?.url || null,
  };
};

const findOrCreateUser = async (provider, profile) => {
  let user = await User.findOne({
    provider,
    providerId: profile.providerId,
  });

  if (!user && profile.email) {
    user = await User.findOne({ email: profile.email });
  }

  if (user) {
    user.name = profile.name;
    user.avatar = profile.avatar;
    if (profile.email && !user.email) {
      user.email = profile.email;
    }
    await user.save();
  } else {
    user = await User.create({
      name: profile.name,
      email: profile.email,
      avatar: profile.avatar,
      provider,
      providerId: profile.providerId,
    });
  }

  return user;
};

const authenticateWithGoogle = async (idToken) => {
  const profile = await verifyGoogleToken(idToken);
  const user = await findOrCreateUser("google", profile);
  const token = generateToken(user._id);

  return { user, token };
};

const authenticateWithFacebook = async (accessToken) => {
  const profile = await verifyFacebookToken(accessToken);
  const user = await findOrCreateUser("facebook", profile);
  const token = generateToken(user._id);

  return { user, token };
};

const getCurrentUser = async (userId) => {
  return User.findById(userId).select("-__v");
};

module.exports = {
  authenticateWithGoogle,
  authenticateWithFacebook,
  getCurrentUser,
};
