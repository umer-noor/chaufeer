const mongoose = require("mongoose");

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const dropStaleUserIndexes = async () => {
  const collection = mongoose.connection.collection("users");

  try {
    await collection.dropIndex("provider_1_providerId_1");
    console.log("Dropped stale index: provider_1_providerId_1");
  } catch {
    // Legacy index may not exist
  }

  const User = require("../models/User");
  await User.syncIndexes();
};

const connectDB = async () => {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const uri = process.env.MONGODB_URI?.trim();

    if (!uri) {
      throw new Error(
        "MONGODB_URI is missing or empty. Copy .env.example to .env, add your MongoDB connection string, and save the file."
      );
    }

    cached.promise = mongoose
      .connect(uri)
      .then(async (mongooseInstance) => {
        console.log(`MongoDB connected`);
        await dropStaleUserIndexes();
        return mongooseInstance;
      })
      .catch((error) => {
        cached.promise = null;
        throw error;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
};

module.exports = connectDB;
