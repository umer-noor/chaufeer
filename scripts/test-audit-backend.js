require("dotenv").config();

const connectDB = require("../config/db");
const Fleet = require("../models/Fleet");
const Booking = require("../models/Booking");
const CustomerReview = require("../models/CustomerReview");
const GetInTouch = require("../models/GetInTouch");

const BASE = process.env.TEST_API_URL?.replace(/\/$/, "") || "http://localhost:5000";
const API = `${BASE}/api`;
const results = [];
const created = { bookingId: null, reviewId: null, inquiryId: null };

const assert = (name, ok, message = "") => {
  results.push({ name, ok, message });
};

const login = async () => {
  const res = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@chaufeer.com", password: "Admin@123" }),
  });
  const data = await res.json().catch(() => ({}));
  return data?.data?.token || "";
};

(async () => {
  console.log(`Testing ${API}\n`);
  const health = await fetch(`${API}/health`);
  if (!health.ok) {
    console.error("Server not reachable");
    process.exit(1);
  }

  await connectDB();

  const token = await login();
  assert("Login", Boolean(token));

  let fleet = await Fleet.findOne({ is_active: { $ne: false } }).sort({ created_at: -1 });
  if (!fleet) {
    fleet = await Fleet.create({
      vehicle_name: "Audit Temp Fleet",
      vehicle_type: "sedan",
      category: "economy_executive_sedans",
      is_active: true,
    });
  }
  assert("Fleet available", Boolean(fleet?._id), String(fleet?._id));

  // Reject booking without terms / fleet
  const bad = await fetch(`${API}/booking/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      service_type: "airport_transfer",
      pickup_location: "A",
      dropoff_location: "B",
      passengers_count: 1,
      pickup_date: "2026-12-20",
      pickup_time: "10:00",
    }),
  });
  assert("Reject without fleet/terms", bad.status === 400, String(bad.status));

  const good = await fetch(`${API}/booking/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      service_type: "airport_transfer",
      fleet_id: String(fleet._id),
      pickup_location: "Airport",
      dropoff_location: "City",
      passengers_count: 2,
      pickup_date: "2026-12-20",
      pickup_time: "10:00",
      dropoff_date: "2026-12-20",
      dropoff_time: "12:00",
      amount: 25,
      base_amount: 20,
      tax_amount: 3,
      tolls_amount: 1,
      waiting_amount: 1,
      currency: "KWD",
      terms_accepted: true,
      terms_version: "v1",
    }),
  });
  const goodData = await good.json().catch(() => ({}));
  created.bookingId = goodData?.data?.id;
  assert("Create booking", good.ok && Boolean(created.bookingId), goodData.message || "");
  assert("Has booking_reference", Boolean(goodData?.data?.booking_reference), goodData?.data?.booking_reference);
  assert("Has price_breakdown", Boolean(goodData?.data?.price_breakdown), JSON.stringify(goodData?.data?.price_breakdown));
  assert("Terms stored", goodData?.data?.terms_accepted === true);

  if (created.bookingId) {
    const st = await fetch(`${API}/booking/${created.bookingId}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status: "assigned" }),
    });
    const stData = await st.json().catch(() => ({}));
    assert("Status assigned", st.ok && stData?.data?.booking_status === "assigned", stData?.data?.booking_status);
  }

  // Honeypot should not save
  const beforeCount = await GetInTouch.countDocuments();
  await fetch(`${API}/get_in_touch/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      full_name: "Bot",
      phone_number: "123",
      email_address: "bot@test.com",
      note: "spam",
      website: "http://spam",
    }),
  });
  const afterCount = await GetInTouch.countDocuments();
  assert("Honeypot ignored", afterCount === beforeCount, `${beforeCount}->${afterCount}`);

  // Cleanup everything we created in this test
  if (created.bookingId) {
    await Booking.deleteOne({ _id: created.bookingId });
  }
  if (fleet.vehicle_name === "Audit Temp Fleet") {
    await Fleet.deleteOne({ _id: fleet._id });
  }

  // Also wipe any leftover test-named reviews/fleets
  await CustomerReview.deleteMany({
    $or: [{ customer_name: /test/i }, { review_title: /test/i }, { review_content: /api\s*test/i }],
  });
  await Fleet.deleteMany({
    vehicle_name: /test\s*mercedes|pricing\s*test\s*car|audit\s*temp\s*fleet/i,
  });

  console.log("\n--- RESULTS ---");
  results.forEach((x) => console.log(`${x.ok ? "PASS" : "FAIL"} | ${x.name} | ${x.message}`));
  const failed = results.filter((x) => !x.ok).length;
  console.log(`\n${results.length - failed}/${results.length} passed`);
  process.exit(failed ? 1 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
