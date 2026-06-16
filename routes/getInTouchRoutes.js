const express = require("express");
const getInTouchController = require("../controllers/getInTouchController");

const router = express.Router();

router.post("/create", getInTouchController.getInTouch);
router.get("/get", getInTouchController.getInquiries);
router.get("/:id", getInTouchController.getInquiry);

module.exports = router;
