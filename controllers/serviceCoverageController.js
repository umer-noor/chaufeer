const serviceCoverageService = require("../services/serviceCoverageService");

const formatServiceCoverage = (item) => ({
  id: item._id,
  section_type: item.section_type,
  section_heading: item.section_heading || "",
  section_subtitle: item.section_subtitle || "",
  title: item.title,
  description: item.description,
  image_url: item.image_url || "",
  icon_key: item.icon_key || "",
  is_active: item.is_active,
  display_order: item.display_order,
  created_at: item.created_at,
  updated_at: item.updated_at,
});

const createServiceCoverage = async (req, res, next) => {
  try {
    const item = await serviceCoverageService.createServiceCoverage(req.body);

    res.status(201).json({
      success: true,
      message: "Service coverage created successfully",
      data: formatServiceCoverage(item),
    });
  } catch (error) {
    next(error);
  }
};

const getServiceCoverages = async (req, res, next) => {
  try {
    const items = await serviceCoverageService.getAllServiceCoverages(req.query);

    res.status(200).json({
      success: true,
      count: items.length,
      data: items.map(formatServiceCoverage),
    });
  } catch (error) {
    next(error);
  }
};

const getServiceCoverage = async (req, res, next) => {
  try {
    const item = await serviceCoverageService.getServiceCoverageById(req.params.id);

    if (!item) {
      return res.status(404).json({ success: false, message: "Service coverage not found" });
    }

    res.status(200).json({
      success: true,
      data: formatServiceCoverage(item),
    });
  } catch (error) {
    next(error);
  }
};

const updateServiceCoverage = async (req, res, next) => {
  try {
    const item = await serviceCoverageService.updateServiceCoverage(req.params.id, req.body);

    if (!item) {
      return res.status(404).json({ success: false, message: "Service coverage not found" });
    }

    res.status(200).json({
      success: true,
      message: "Service coverage updated successfully",
      data: formatServiceCoverage(item),
    });
  } catch (error) {
    next(error);
  }
};

const deleteServiceCoverage = async (req, res, next) => {
  try {
    const item = await serviceCoverageService.deleteServiceCoverage(req.params.id);

    if (!item) {
      return res.status(404).json({ success: false, message: "Service coverage not found" });
    }

    res.status(200).json({
      success: true,
      message: "Service coverage deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createServiceCoverage,
  getServiceCoverages,
  getServiceCoverage,
  updateServiceCoverage,
  deleteServiceCoverage,
};
