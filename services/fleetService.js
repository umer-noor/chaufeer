const Fleet = require("../models/Fleet");
const { FLEET_CATEGORIES, VEHICLE_TYPES } = require("../models/Fleet");

const createFleet = async (data) => {
  return Fleet.create(data);
};

const getAllFleets = async ({ category, vehicle_type, is_active }) => {
  const filter = {};

  if (category) {
    filter.category = category;
  }

  if (vehicle_type) {
    filter.vehicle_type = vehicle_type;
  }

  if (is_active !== undefined) {
    filter.is_active = is_active === "true" || is_active === true;
  }

  return Fleet.find(filter).sort({ display_order: 1, created_at: -1 });
};

const getFleetById = async (id) => {
  return Fleet.findById(id);
};

const updateFleet = async (id, data) => {
  return Fleet.findByIdAndUpdate(id, data, { new: true, runValidators: true });
};

const deleteFleet = async (id) => {
  return Fleet.findByIdAndDelete(id);
};

module.exports = {
  createFleet,
  getAllFleets,
  getFleetById,
  updateFleet,
  deleteFleet,
  FLEET_CATEGORIES,
  VEHICLE_TYPES,
};
