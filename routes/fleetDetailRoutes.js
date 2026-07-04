const express = require("express");
const fleetDetailController = require("../controllers/fleetDetailController");

const router = express.Router();

router.get("/get", fleetDetailController.getFleetDetails);
router.post("/create", fleetDetailController.createFleetDetail);
router.get("/:id", fleetDetailController.getFleetDetail);
router.put("/:id", fleetDetailController.updateFleetDetail);
router.delete("/:id", fleetDetailController.deleteFleetDetail);

module.exports = router;
