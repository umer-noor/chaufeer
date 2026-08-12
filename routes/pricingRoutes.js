const express = require("express");
const pricingController = require("../controllers/pricingController");
const requireAdmin = require("../middleware/requireAdmin");

const router = express.Router();

// App: calculate / request price (3 edge cases)
router.post("/quote", pricingController.createQuote);

// Admin: long-distance quotes (>45km) — register before :id
router.get("/quotes/pending/list", requireAdmin, pricingController.getPendingQuotes);
router.put("/quotes/:id/set-price", requireAdmin, pricingController.setQuotePrice);
router.get("/quotes/:id", pricingController.getQuote);

// Admin: fixed price CRUD (≤45km)
router.get("/fixed/get", requireAdmin, pricingController.getFixedPrices);
router.post("/fixed/create", requireAdmin, pricingController.createFixedPrice);
router.get("/fixed/:id", requireAdmin, pricingController.getFixedPrice);
router.put("/fixed/:id", requireAdmin, pricingController.updateFixedPrice);
router.delete("/fixed/:id", requireAdmin, pricingController.deleteFixedPrice);

// Admin: hourly price CRUD
router.get("/hourly/get", requireAdmin, pricingController.getHourlyPrices);
router.post("/hourly/create", requireAdmin, pricingController.createHourlyPrice);
router.get("/hourly/:id", requireAdmin, pricingController.getHourlyPrice);
router.put("/hourly/:id", requireAdmin, pricingController.updateHourlyPrice);
router.delete("/hourly/:id", requireAdmin, pricingController.deleteHourlyPrice);

module.exports = router;
