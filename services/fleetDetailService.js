const FleetDetail = require("../models/FleetDetail");

const createFleetDetail = async (data) => {
  return FleetDetail.create(data);
};

const getAllFleetDetails = async ({ fleet, is_featured, is_active }) => {
  const filter = {};

  if (fleet) {
    filter.fleet = fleet;
  }

  if (is_featured !== undefined) {
    filter.is_featured = is_featured === "true" || is_featured === true;
  }

  if (is_active !== undefined) {
    filter.is_active = is_active === "true" || is_active === true;
  }

  return FleetDetail.find(filter)
    .populate("fleet", "vehicle_name vehicle_type category image_url")
    .sort({ display_order: 1, created_at: -1 });
};

const getFleetDetailById = async (id) => {
  return FleetDetail.findById(id).populate(
    "fleet",
    "vehicle_name vehicle_type category image_url seat_count luggage_capacity amenities"
  );
};

const updateFleetDetail = async (id, data) => {
  return FleetDetail.findByIdAndUpdate(id, data, { new: true, runValidators: true }).populate(
    "fleet",
    "vehicle_name vehicle_type category image_url"
  );
};

const deleteFleetDetail = async (id) => {
  return FleetDetail.findByIdAndDelete(id);
};

module.exports = {
  createFleetDetail,
  getAllFleetDetails,
  getFleetDetailById,
  updateFleetDetail,
  deleteFleetDetail,
};
