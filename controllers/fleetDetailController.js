const fleetDetailService = require("../services/fleetDetailService");

const formatFleetRef = (fleet) => {
  if (!fleet) {
    return null;
  }

  if (typeof fleet === "string") {
    return { id: fleet };
  }

  return {
    id: fleet._id,
    vehicle_name: fleet.vehicle_name,
    vehicle_type: fleet.vehicle_type,
    category: fleet.category,
    image_url: fleet.image_url,
    seat_count: fleet.seat_count,
    luggage_capacity: fleet.luggage_capacity,
    amenities: fleet.amenities || [],
  };
};

const formatFleetDetail = (detail) => ({
  id: detail._id,
  fleet: formatFleetRef(detail.fleet),
  title: detail.title,
  description: detail.description,
  vehicle_image_url: detail.vehicle_image_url,
  highlights: detail.highlights || [],
  is_featured: detail.is_featured,
  is_active: detail.is_active,
  display_order: detail.display_order,
  created_at: detail.created_at,
  updated_at: detail.updated_at,
});

const createFleetDetail = async (req, res, next) => {
  try {
    const detail = await fleetDetailService.createFleetDetail(req.body);

    const populated = await fleetDetailService.getFleetDetailById(detail._id);

    res.status(201).json({
      success: true,
      message: "Fleet detail created successfully",
      data: formatFleetDetail(populated),
    });
  } catch (error) {
    next(error);
  }
};

const getFleetDetails = async (req, res, next) => {
  try {
    const details = await fleetDetailService.getAllFleetDetails(req.query);

    res.status(200).json({
      success: true,
      count: details.length,
      data: details.map(formatFleetDetail),
    });
  } catch (error) {
    next(error);
  }
};

const getFleetDetail = async (req, res, next) => {
  try {
    const detail = await fleetDetailService.getFleetDetailById(req.params.id);

    if (!detail) {
      return res.status(404).json({ success: false, message: "Fleet detail not found" });
    }

    res.status(200).json({
      success: true,
      data: formatFleetDetail(detail),
    });
  } catch (error) {
    next(error);
  }
};

const updateFleetDetail = async (req, res, next) => {
  try {
    const detail = await fleetDetailService.updateFleetDetail(req.params.id, req.body);

    if (!detail) {
      return res.status(404).json({ success: false, message: "Fleet detail not found" });
    }

    res.status(200).json({
      success: true,
      message: "Fleet detail updated successfully",
      data: formatFleetDetail(detail),
    });
  } catch (error) {
    next(error);
  }
};

const deleteFleetDetail = async (req, res, next) => {
  try {
    const detail = await fleetDetailService.deleteFleetDetail(req.params.id);

    if (!detail) {
      return res.status(404).json({ success: false, message: "Fleet detail not found" });
    }

    res.status(200).json({
      success: true,
      message: "Fleet detail deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createFleetDetail,
  getFleetDetails,
  getFleetDetail,
  updateFleetDetail,
  deleteFleetDetail,
};
