require("dotenv").config();

const BASE = process.env.TEST_API_URL?.replace(/\/$/, "") || "http://localhost:5000";
const API = `${BASE}/api`;
const EMAIL = "admin@chaufeer.com";
const PASSWORD = "Admin@123";

const results = [];
let token = "";
const ids = {};

const req = async (name, method, path, { body, auth = false } = {}) => {
  const headers = { "Content-Type": "application/json" };
  if (auth && token) headers.Authorization = `Bearer ${token}`;

  try {
    const res = await fetch(`${API}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    const ok = res.ok && data.success !== false;
    results.push({ name, ok, status: res.status, message: data.message || "" });
    return { ok, status: res.status, data };
  } catch (error) {
    results.push({ name, ok: false, status: 0, message: error.message });
    return { ok: false, data: {} };
  }
};

const assert = (name, ok, message = "") => {
  results.push({ name, ok, status: ok ? 200 : 400, message });
};

(async () => {
  console.log(`Testing ${API}\n`);

  let r = await req("Health", "GET", "/health");
  if (!r.ok) {
    console.error("Server not reachable");
    process.exit(1);
  }

  r = await req("Login", "POST", "/auth/login", {
    body: { email: EMAIL, password: PASSWORD },
  });
  token = r.data?.data?.token || "";
  if (!token) {
    console.error("Login failed");
    process.exit(1);
  }

  r = await req("Get Profile", "GET", "/auth/profile", { auth: true });
  assert("Profile has email", Boolean(r.data?.data?.email));

  r = await req("Update Profile", "PUT", "/auth/profile", {
    auth: true,
    body: {
      full_name: "Admin One",
      phone_number: "+97450000001",
      profile_image_url: "https://example.com/admin.jpg",
      email: "hacker@email.com",
    },
  });
  const profile = r.data?.data || {};
  assert("Email not changed", profile.email === EMAIL);
  assert("Name updated", profile.full_name === "Admin One");
  assert("Image updated", profile.profile_image_url === "https://example.com/admin.jpg");

  r = await req("Create Booking Future", "POST", "/booking/create", {
    auth: true,
    body: {
      service_type: "airport_transfer",
      pickup_location: "Airport",
      dropoff_location: "City",
      pickup_date: "2026-08-20",
      pickup_time: "05:30",
      dropoff_date: "2026-08-20",
      dropoff_time: "21:00",
      passengers_count: 2,
      amount: 10,
      currency: "KWD",
    },
  });
  ids.future = r.data?.data?.id;
  assert("Future is upcoming", r.data?.data?.booking_status === "upcoming");

  r = await req("Create Booking Today", "POST", "/booking/create", {
    auth: true,
    body: {
      service_type: "airport_transfer",
      pickup_location: "Airport",
      dropoff_location: "Hotel",
      pickup_date: "2026-08-19",
      pickup_time: "00:01",
      dropoff_date: "2026-08-19",
      dropoff_time: "23:59",
      passengers_count: 1,
      amount: 8,
      currency: "KWD",
    },
  });
  ids.today = r.data?.data?.id;
  assert(
    "Today is inprogress",
    r.data?.data?.booking_status === "inprogress",
    r.data?.data?.booking_status
  );

  r = await req("Get Upcoming", "GET", "/booking/get?status=upcoming", { auth: true });
  const upcoming = r.data?.data || [];
  assert(
    "Upcoming contains future",
    upcoming.some((b) => b.id === ids.future && b.booking_status === "upcoming")
  );
  assert(
    "Upcoming contains inprogress",
    upcoming.some((b) => b.id === ids.today && b.booking_status === "inprogress")
  );

  r = await req("Get Upcoming Date Filter", "GET", "/booking/get?status=upcoming&from=2026-08-20T00:00:00.000Z&to=2026-08-20T23:59:59.000Z", {
    auth: true,
  });
  const filtered = r.data?.data || [];
  assert("Date filter has future", filtered.some((b) => b.id === ids.future));
  assert("Date filter excludes today trip", !filtered.some((b) => b.id === ids.today));

  if (ids.today) {
    r = await req("Update Status Completed", "PUT", `/booking/${ids.today}/status`, {
      auth: true,
      body: { status: "completed" },
    });
    assert("Status completed", r.data?.data?.booking_status === "completed");
  }

  if (ids.future) {
    await req("Cancel Future", "PUT", `/booking/${ids.future}/cancel`, { auth: true });
  }

  r = await req("Get History", "GET", "/booking/get?status=history", { auth: true });
  const history = r.data?.data || [];
  assert(
    "History has cancelled",
    history.some((b) => b.id === ids.future && b.booking_status === "cancelled")
  );
  assert(
    "History has completed",
    history.some((b) => b.id === ids.today && b.booking_status === "completed")
  );

  r = await req("Get Upcoming After", "GET", "/booking/get?status=upcoming", { auth: true });
  const upcomingAfter = r.data?.data || [];
  assert("Cancelled not in upcoming", !upcomingAfter.some((b) => b.id === ids.future));
  assert("Completed not in upcoming", !upcomingAfter.some((b) => b.id === ids.today));

  console.log("\n--- RESULTS ---");
  results.forEach((x) => {
    console.log(`${x.ok ? "PASS" : "FAIL"} | ${x.name} | ${x.status} | ${x.message}`);
  });

  const failed = results.filter((x) => !x.ok).length;
  console.log(`\n${results.length - failed}/${results.length} passed`);
  if (failed) process.exit(1);
})();
