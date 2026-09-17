const Fleet = require("../models/Fleet");
const { FLEET_CATEGORIES, VEHICLE_TYPES } = require("../models/Fleet");

const assertCategory = (category) => {
  if (!category) {
    return;
  }

  if (!FLEET_CATEGORIES.includes(category)) {
    const error = new Error(
      `Invalid category. Use: ${FLEET_CATEGORIES.join(", ")}`
    );
    error.statusCode = 400;
    throw error;
  }
};

const assertVehicleType = (vehicle_type) => {
  if (!vehicle_type) {
    return;
  }

  if (!VEHICLE_TYPES.includes(vehicle_type)) {
    const error = new Error(`Invalid vehicle_type. Use: ${VEHICLE_TYPES.join(", ")}`);
    error.statusCode = 400;
    throw error;
  }
};

const createFleet = async (data) => {
  assertCategory(data.category);
  assertVehicleType(data.vehicle_type);
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
  if (data.category !== undefined) {
    assertCategory(data.category);
  }
  if (data.vehicle_type !== undefined) {
    assertVehicleType(data.vehicle_type);
  }
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
