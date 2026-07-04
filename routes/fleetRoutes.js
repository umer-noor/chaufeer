const express = require("express");
const fleetController = require("../controllers/fleetController");

const router = express.Router();

router.get("/get", fleetController.getFleets);
router.post("/create", fleetController.createFleet);
router.get("/:id", fleetController.getFleet);
router.put("/:id", fleetController.updateFleet);
router.delete("/:id", fleetController.deleteFleet);

module.exports = router;
