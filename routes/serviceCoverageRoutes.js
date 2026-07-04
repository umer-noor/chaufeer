const express = require("express");
const serviceCoverageController = require("../controllers/serviceCoverageController");

const router = express.Router();

router.get("/get", serviceCoverageController.getServiceCoverages);
router.post("/create", serviceCoverageController.createServiceCoverage);
router.get("/:id", serviceCoverageController.getServiceCoverage);
router.put("/:id", serviceCoverageController.updateServiceCoverage);
router.delete("/:id", serviceCoverageController.deleteServiceCoverage);

module.exports = router;
