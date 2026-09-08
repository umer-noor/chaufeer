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

const createBooking = async (token, body) => {
  const res = await fetch(`${API}/booking/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  return res.json().catch(() => ({}));
};

const listBookings = async (token) => {
  const res = await fetch(`${API}/booking/get`, {
    headers: { Authorization: `Bearer ${token}` },
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

  const clientEmail = `client.bookings.${Date.now()}@test.com`;
  const clientPassword = "Client@123";
  await User.create({
    full_name: "Client Bookings Tester",
    email: clientEmail,
    password: clientPassword,
    phone_number: "+96550002222",
    provider: "local",
    role: "user",
    is_email_verified: true,
  });

  const adminToken = await login("admin@chaufeer.com", "Admin@123");
  const clientToken = await login(clientEmail, clientPassword);

  assert("Admin login", Boolean(adminToken));
  assert("Client login", Boolean(clientToken));
  if (!adminToken || !clientToken) {
    console.error("Login failed");
    process.exit(1);
  }

  const adminBooking = await createBooking(adminToken, {
    service_type: "airport_transfer",
    pickup_location: "Airport",
    dropoff_location: "City",
    pickup_date: "2026-11-10",
    pickup_time: "09:00",
    dropoff_date: "2026-11-10",
    dropoff_time: "11:00",
    passengers_count: 1,
    amount: 15,
    currency: "KWD",
  });
  const adminBookingId = adminBooking?.data?.id;
  assert("Admin booking created", Boolean(adminBookingId), adminBookingId || adminBooking.message);

  const clientBooking = await createBooking(clientToken, {
    service_type: "airport_transfer",
    pickup_location: "Hotel",
    dropoff_location: "Airport",
    pickup_date: "2026-11-11",
    pickup_time: "14:00",
    dropoff_date: "2026-11-11",
    dropoff_time: "16:00",
    passengers_count: 2,
    amount: 20,
    currency: "KWD",
  });
  const clientBookingId = clientBooking?.data?.id;
  assert("Client booking created", Boolean(clientBookingId), clientBookingId || clientBooking.message);

  const adminList = await listBookings(adminToken);
  results.push({
    name: "Admin GET /booking/get",
    ok: adminList.ok,
    status: adminList.status,
    message: `count=${adminList.data.count ?? 0}`,
  });
  const adminIds = (adminList.data.data || []).map((b) => String(b.id));
  assert(
    "Admin sees client booking",
    adminIds.includes(String(clientBookingId)),
    `adminCount=${adminList.data.count}`
  );
  assert(
    "Admin sees own booking",
    adminIds.includes(String(adminBookingId)),
    `adminCount=${adminList.data.count}`
  );

  const clientList = await listBookings(clientToken);
  results.push({
    name: "Client GET /booking/get",
    ok: clientList.ok,
    status: clientList.status,
    message: `count=${clientList.data.count ?? 0}`,
  });
  const clientIds = (clientList.data.data || []).map((b) => String(b.id));
  assert(
    "Client sees own booking",
    clientIds.includes(String(clientBookingId)),
    `clientCount=${clientList.data.count}`
  );
  assert(
    "Client does not see admin booking",
    !clientIds.includes(String(adminBookingId)),
    `clientIds=${clientIds.join(",")}`
  );
  assert(
    "Client count < admin count",
    Number(clientList.data.count) < Number(adminList.data.count),
    `client=${clientList.data.count} admin=${adminList.data.count}`
  );

  console.log("\n--- RESULTS ---");
  results.forEach((x) => {
    console.log(`${x.ok ? "PASS" : "FAIL"} | ${x.name} | ${x.status} | ${x.message}`);
  });

  const failed = results.filter((x) => !x.ok).length;
  console.log(`\n${results.length - failed}/${results.length} passed`);

  // Keep mongoose connection from hanging process
  process.exit(failed ? 1 : 0);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
