const User = require("../models/User");

const getAllUsers = async () => {
  return User.find().select("-password").sort({ createdAt: -1 });
};

const getUserById = async (id) => {
  return User.findById(id).select("-password");
};

const createUser = async (userData) => {
  return User.create(userData);
};

const updateUser = async (id, userData) => {
  return User.findByIdAndUpdate(id, userData, {
    new: true,
    runValidators: true,
  });
};

const deleteUser = async (id) => {
  return User.findByIdAndDelete(id);
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
};
