const express = require("express");
const customerReviewController = require("../controllers/customerReviewController");

const router = express.Router();

router.get("/get", customerReviewController.getCustomerReviews);
router.post("/create", customerReviewController.createCustomerReview);
router.get("/:id", customerReviewController.getCustomerReview);
router.put("/:id", customerReviewController.updateCustomerReview);
router.delete("/:id", customerReviewController.deleteCustomerReview);

module.exports = router;
