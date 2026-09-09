const DeviceToken = require("../models/DeviceToken");
const fcmService = require("./fcmService");

const saveDeviceToken = async (userId, { token, platform = "web" }) => {
  if (!token || !String(token).trim()) {
    const error = new Error("token is required");
    error.statusCode = 400;
    throw error;
  }

  const safePlatform = ["web", "android", "ios"].includes(platform) ? platform : "web";
  const value = String(token).trim();

  const saved = await DeviceToken.findOneAndUpdate(
    { token: value },
    {
      user: userId,
      token: value,
      platform: safePlatform,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return {
    id: saved._id,
    token: saved.token,
    platform: saved.platform,
  };
};

const removeDeviceToken = async (userId, token) => {
  if (!token) {
    const error = new Error("token is required");
    error.statusCode = 400;
    throw error;
  }

  const result = await DeviceToken.deleteOne({ user: userId, token: String(token).trim() });
  return { deleted: result.deletedCount > 0 };
};

const sendPushToUser = async (userId, { title, body, data = {} }) => {
  if (!userId || !title || !body) {
    return;
  }

  try {
    const devices = await DeviceToken.find({ user: userId }).select("token");
    const tokens = devices.map((d) => d.token);
    if (!tokens.length) {
      return;
    }

    const result = await fcmService.sendToTokens(tokens, { title, body, data });

    if (result.invalid_tokens?.length) {
      await DeviceToken.deleteMany({ token: { $in: result.invalid_tokens } });
    }
  } catch (error) {
    console.error("sendPushToUser failed:", error.message);
  }
};

module.exports = {
  saveDeviceToken,
  removeDeviceToken,
  sendPushToUser,
};
