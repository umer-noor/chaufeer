const fleetService = require("../services/fleetService");

const formatFleet = (fleet) => ({
  id: fleet._id,
  vehicle_name: fleet.vehicle_name,
  vehicle_type: fleet.vehicle_type,
  category: fleet.category,
  image_url: fleet.image_url,
  seat_count: fleet.seat_count,
  luggage_capacity: fleet.luggage_capacity,
  amenities: fleet.amenities || [],
  is_active: fleet.is_active,
  display_order: fleet.display_order,
  created_at: fleet.created_at,
  updated_at: fleet.updated_at,
});

const createFleet = async (req, res, next) => {
  try {
    const fleet = await fleetService.createFleet(req.body);

    res.status(201).json({
      success: true,
      message: "Fleet created successfully",
      data: formatFleet(fleet),
    });
  } catch (error) {
    next(error);
  }
};

const getFleets = async (req, res, next) => {
  try {
    const fleets = await fleetService.getAllFleets(req.query);

    res.status(200).json({
      success: true,
      count: fleets.length,
      data: fleets.map(formatFleet),
    });
  } catch (error) {
    next(error);
  }
};

const getFleet = async (req, res, next) => {
  try {
    const fleet = await fleetService.getFleetById(req.params.id);

    if (!fleet) {
      return res.status(404).json({ success: false, message: "Fleet not found" });
    }

    res.status(200).json({
      success: true,
      data: formatFleet(fleet),
    });
  } catch (error) {
    next(error);
  }
};

const updateFleet = async (req, res, next) => {
  try {
    const fleet = await fleetService.updateFleet(req.params.id, req.body);

    if (!fleet) {
      return res.status(404).json({ success: false, message: "Fleet not found" });
    }

    res.status(200).json({
      success: true,
      message: "Fleet updated successfully",
      data: formatFleet(fleet),
    });
  } catch (error) {
    next(error);
  }
};

const deleteFleet = async (req, res, next) => {
  try {
    const fleet = await fleetService.deleteFleet(req.params.id);

    if (!fleet) {
      return res.status(404).json({ success: false, message: "Fleet not found" });
    }

    res.status(200).json({
      success: true,
      message: "Fleet deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createFleet,
  getFleets,
  getFleet,
  updateFleet,
  deleteFleet,
};
