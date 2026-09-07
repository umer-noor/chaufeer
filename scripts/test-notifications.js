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

  // Create booking -> should auto-create notification(s)
  r = await req("Create Booking", "POST", "/booking/create", {
    auth: true,
    body: {
      service_type: "airport_transfer",
      pickup_location: "Airport",
      dropoff_location: "City",
      pickup_date: "2026-10-15",
      pickup_time: "10:00",
      dropoff_date: "2026-10-15",
      dropoff_time: "12:00",
      passengers_count: 2,
      amount: 12,
      currency: "KWD",
    },
  });
  ids.booking = r.data?.data?.id;
  assert("Booking created", Boolean(ids.booking), ids.booking || r.data?.message);

  r = await req("Get Notifications", "GET", "/notifications/get", { auth: true });
  const list = r.data?.data || [];
  assert("Has notifications list", Array.isArray(list) && list.length > 0, `count=${list.length}`);
  assert("Response has unread_count", typeof r.data?.unread_count === "number");
  assert(
    "Booking created notif exists",
    list.some((n) => n.type === "booking_created" && n.booking_id === ids.booking)
  );

  const unreadBefore = list.filter((n) => n.is_read === false);
  assert("Has at least one unread", unreadBefore.length > 0, `unread=${unreadBefore.length}`);

  const one = unreadBefore.find((n) => n.booking_id === ids.booking) || unreadBefore[0];
  ids.notif = one?.id;

  r = await req("Unread Count", "GET", "/notifications/unread-count", { auth: true });
  assert(
    "Unread count > 0",
    Number(r.data?.data?.unread_count) > 0,
    String(r.data?.data?.unread_count)
  );

  r = await req("Mark One Read", "GET", `/notifications/${ids.notif}/read`, { auth: true });
  assert("Marked one is_read true", r.data?.data?.is_read === true);

  r = await req("Get After One Read", "GET", "/notifications/get", { auth: true });
  const afterOne = r.data?.data || [];
  const marked = afterOne.find((n) => n.id === ids.notif);
  assert("List shows one as read", marked?.is_read === true);

  // Status change -> more notifications
  if (ids.booking) {
    r = await req("Complete Booking", "PUT", `/booking/${ids.booking}/status`, {
      auth: true,
      body: { status: "completed" },
    });
    assert("Booking completed", r.data?.data?.booking_status === "completed");
  }

  r = await req("Get After Complete", "GET", "/notifications/get", { auth: true });
  const afterComplete = r.data?.data || [];
  assert(
    "Completed notif exists",
    afterComplete.some((n) => n.type === "booking_completed" && n.booking_id === ids.booking)
  );

  r = await req("Mark All Read", "GET", "/notifications/mark-all-read", { auth: true });
  assert("Mark all success", r.ok);

  r = await req("Unread After Mark All", "GET", "/notifications/unread-count", { auth: true });
  assert(
    "Unread count is 0",
    Number(r.data?.data?.unread_count) === 0,
    String(r.data?.data?.unread_count)
  );

  r = await req("Filter Unread", "GET", "/notifications/get?is_read=false", { auth: true });
  assert("No unread left", Array.isArray(r.data?.data) && r.data.data.length === 0);

  r = await req("Filter Read", "GET", "/notifications/get?is_read=true", { auth: true });
  assert("Has read items", Array.isArray(r.data?.data) && r.data.data.length > 0);

  console.log("\n--- RESULTS ---");
  results.forEach((x) => {
    console.log(`${x.ok ? "PASS" : "FAIL"} | ${x.name} | ${x.status} | ${x.message}`);
  });

  const failed = results.filter((x) => !x.ok).length;
  console.log(`\n${results.length - failed}/${results.length} passed`);
  if (failed) process.exit(1);
})();
