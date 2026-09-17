require("dotenv").config();

const connectDB = require("../config/db");
const Fleet = require("../models/Fleet");
const CustomerReview = require("../models/CustomerReview");
const FixedPrice = require("../models/FixedPrice");
const HourlyPrice = require("../models/HourlyPrice");

const TEST_FLEET_NAME = /test\s*mercedes|pricing\s*test\s*car|test\s*car/i;
const TEST_REVIEW = /api\s*test\s*review|test\s*user|^great\s*s$/i;

(async () => {
  await connectDB();

  const fleets = await Fleet.find({
    $or: [
      { vehicle_name: TEST_FLEET_NAME },
      { vehicle_name: /test/i },
    ],
  });

  const fleetIds = fleets.map((f) => f._id);
  console.log(
    "Test fleets found:",
    fleets.map((f) => `${f._id} | ${f.vehicle_name}`).join("\n") || "(none)"
  );

  if (fleetIds.length) {
    const fixed = await FixedPrice.deleteMany({ fleet_id: { $in: fleetIds } });
    const hourly = await HourlyPrice.deleteMany({ fleet_id: { $in: fleetIds } });
    const fleetDel = await Fleet.deleteMany({ _id: { $in: fleetIds } });
    console.log("Deleted fixed prices:", fixed.deletedCount);
    console.log("Deleted hourly prices:", hourly.deletedCount);
    console.log("Deleted fleets:", fleetDel.deletedCount);
  }

  const reviews = await CustomerReview.find({
    $or: [
      { customer_name: TEST_REVIEW },
      { review_title: TEST_REVIEW },
      { review_content: TEST_REVIEW },
      { customer_name: /test/i },
      { review_title: /test/i },
      { review_content: /api\s*test/i },
    ],
  });

  console.log(
    "Test reviews found:",
    reviews
      .map((r) => `${r._id} | ${r.customer_name} | ${r.review_title}`)
      .join("\n") || "(none)"
  );

  if (reviews.length) {
    const reviewDel = await CustomerReview.deleteMany({
      _id: { $in: reviews.map((r) => r._id) },
    });
    console.log("Deleted reviews:", reviewDel.deletedCount);
  }

  console.log("Cleanup done");
  process.exit(0);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
