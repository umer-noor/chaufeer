require("dotenv").config();

const connectDB = require("../config/db");
const User = require("../models/User");

const BASE = process.env.TEST_API_URL?.replace(/\/$/, "") || "http://localhost:5000";
const API = `${BASE}/api`;
const results = [];

const assert = (name, ok, message = "") => {
  results.push({ name, ok, status: ok ? 200 : 400, message });
};

const login = async (email, password) => {
  const res = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json().catch(() => ({}));
  return data?.data?.token || "";
};

const createBooking = async (token) => {
  const res = await fetch(`${API}/booking/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      service_type: "airport_transfer",
      pickup_location: "Hotel",
      dropoff_location: "Airport",
      pickup_date: "2026-12-01",
      pickup_time: "10:00",
      dropoff_date: "2026-12-01",
      dropoff_time: "12:00",
      passengers_count: 1,
      amount: 25,
      currency: "KWD",
    }),
  });
  return res.json().catch(() => ({}));
};

const updateStatus = async (token, id, status) => {
  const res = await fetch(`${API}/booking/${id}/status`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status }),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok && data.success !== false, status: res.status, data };
};

(async () => {
  console.log(`Testing ${API}\n`);

  const health = await fetch(`${API}/health`);
  if (!health.ok) {
    console.error("Server not reachable");
    process.exit(1);
  }

  await connectDB();

  const clientEmail = `client.status.${Date.now()}@test.com`;
  await User.create({
    full_name: "Client Status Tester",
    email: clientEmail,
    password: "Client@123",
    phone_number: "+96550003333",
    provider: "local",
    role: "user",
    is_email_verified: true,
  });

  const adminToken = await login("admin@chaufeer.com", "Admin@123");
  const clientToken = await login(clientEmail, "Client@123");
  assert("Admin login", Boolean(adminToken));
  assert("Client login", Boolean(clientToken));

  const created = await createBooking(clientToken);
  const bookingId = created?.data?.id;
  assert("Client booking created", Boolean(bookingId), bookingId || created.message);

  const byAdmin = await updateStatus(adminToken, bookingId, "inprogress");
  results.push({
    name: "Admin updates client booking status",
    ok: byAdmin.ok,
    status: byAdmin.status,
    message: byAdmin.data.message || "",
  });
  assert(
    "Admin update not 404",
    byAdmin.ok && byAdmin.status !== 404,
    String(byAdmin.status)
  );

  const completed = await updateStatus(adminToken, bookingId, "completed");
  assert(
    "Admin completes client booking",
    completed.ok && completed.data?.data?.booking_status === "completed",
    completed.data?.data?.booking_status || completed.data?.message
  );

  // Client should still only update own booking (sanity)
  const own = await createBooking(adminToken);
  const ownId = own?.data?.id;
  const clientOnAdmin = await updateStatus(clientToken, ownId, "completed");
  assert(
    "Client cannot update admin booking",
    !clientOnAdmin.ok,
    String(clientOnAdmin.status)
  );

  console.log("\n--- RESULTS ---");
  results.forEach((x) => {
    console.log(`${x.ok ? "PASS" : "FAIL"} | ${x.name} | ${x.status} | ${x.message}`);
  });

  const failed = results.filter((x) => !x.ok).length;
  console.log(`\n${results.length - failed}/${results.length} passed`);
  process.exit(failed ? 1 : 0);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
