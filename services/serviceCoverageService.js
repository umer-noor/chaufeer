const ServiceCoverage = require("../models/ServiceCoverage");
const { SECTION_TYPES } = require("../models/ServiceCoverage");

const createServiceCoverage = async (data) => {
  return ServiceCoverage.create(data);
};

const getAllServiceCoverages = async ({ section_type, is_active }) => {
  const filter = {};

  if (section_type) {
    filter.section_type = section_type;
  }

  if (is_active !== undefined) {
    filter.is_active = is_active === "true" || is_active === true;
  }

  return ServiceCoverage.find(filter).sort({ display_order: 1, created_at: -1 });
};

const getServiceCoverageById = async (id) => {
  return ServiceCoverage.findById(id);
};

const updateServiceCoverage = async (id, data) => {
  return ServiceCoverage.findByIdAndUpdate(id, data, { new: true, runValidators: true });
};

const deleteServiceCoverage = async (id) => {
  return ServiceCoverage.findByIdAndDelete(id);
};

module.exports = {
  createServiceCoverage,
  getAllServiceCoverages,
  getServiceCoverageById,
  updateServiceCoverage,
  deleteServiceCoverage,
  SECTION_TYPES,
};
