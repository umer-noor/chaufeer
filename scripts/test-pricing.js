require("dotenv").config();

const BASE = process.env.TEST_API_URL?.replace(/\/$/, "") || "http://localhost:5000";
const API = `${BASE}/api`;
const ADMIN_EMAIL = "admin@chaufeer.com";
const ADMIN_PASS = "Admin@123";

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

(async () => {
  console.log(`Testing ${API}\n`);

  let r = await req("Health", "GET", "/health");
  if (!r.ok) {
    console.error("Server not reachable. Start: npm run dev");
    process.exit(1);
  }

  r = await req("Admin Login", "POST", "/auth/login", {
    body: { email: ADMIN_EMAIL, password: ADMIN_PASS },
  });
  token = r.data?.data?.token || "";
  if (!token) {
    console.error("Admin login failed");
    results.forEach((x) => console.log(`${x.ok ? "PASS" : "FAIL"} ${x.name} (${x.status}) ${x.message}`));
    process.exit(1);
  }

  r = await req("Create Fleet", "POST", "/fleet/create", {
    auth: true,
    body: {
      vehicle_name: "Pricing Test Car",
      vehicle_type: "sedan",
      category: "economy_class",
      seat_count: 4,
      display_order: 99,
    },
  });
  ids.fleet = r.data?.data?.id;

  if (ids.fleet) {
    await req("Create Fixed Price", "POST", "/pricing/fixed/create", {
      auth: true,
      body: { fleet_id: ids.fleet, price: 8, currency: "KWD" },
    });

    await req("Create Hourly Price", "POST", "/pricing/hourly/create", {
      auth: true,
      body: { fleet_id: ids.fleet, price_per_hour: 5, currency: "KWD" },
    });

    r = await req("Quote Hourly", "POST", "/pricing/quote", {
      auth: true,
      body: { fleet_id: ids.fleet, hours: 4, pricing_type: "hourly" },
    });
    const hourlyOk = r.data?.data?.pricing_mode === "hourly" && r.data?.data?.amount === 20;
    results.push({
      name: "Hourly amount = 20",
      ok: hourlyOk,
      status: r.status,
      message: `amount=${r.data?.data?.amount}`,
    });

    r = await req("Quote Fixed <=45km", "POST", "/pricing/quote", {
      auth: true,
      body: {
        fleet_id: ids.fleet,
        distance_km: 20,
        pickup_latitude: 29.22,
        pickup_longitude: 47.96,
        dropoff_latitude: 29.33,
        dropoff_longitude: 48.07,
      },
    });
    const fixedOk = r.data?.data?.pricing_mode === "fixed" && r.data?.data?.amount === 8;
    results.push({
      name: "Fixed amount = 8",
      ok: fixedOk,
      status: r.status,
      message: `amount=${r.data?.data?.amount}`,
    });

    r = await req("Quote Long >45km", "POST", "/pricing/quote", {
      auth: true,
      body: {
        fleet_id: ids.fleet,
        distance_km: 60,
        pickup_latitude: 29.22,
        pickup_longitude: 47.96,
        dropoff_latitude: 29.8,
        dropoff_longitude: 48.2,
        pickup_location: "A",
        dropoff_location: "B",
      },
    });
    ids.quote = r.data?.data?.quote_id;
    const longOk =
      r.data?.data?.pricing_mode === "long_distance" &&
      r.data?.data?.requires_admin_price === true;
    results.push({
      name: "Long distance awaiting admin",
      ok: longOk,
      status: r.status,
      message: r.data?.data?.status || "",
    });

    await req("Pending Quotes", "GET", "/pricing/quotes/pending/list", { auth: true });

    if (ids.quote) {
      await req("Set Quote Price", "PUT", `/pricing/quotes/${ids.quote}/set-price`, {
        auth: true,
        body: { amount: 45, fleet_id: ids.fleet },
      });
      r = await req("Get Quote Priced", "GET", `/pricing/quotes/${ids.quote}`, { auth: true });
      results.push({
        name: "Quote priced amount 45",
        ok: r.data?.data?.status === "priced" && r.data?.data?.amount === 45,
        status: r.status,
        message: `status=${r.data?.data?.status}`,
      });
    }

    await req("List Fixed Prices", "GET", "/pricing/fixed/get", { auth: true });
    await req("List Hourly Prices", "GET", "/pricing/hourly/get", { auth: true });
  }

  r = await req("Create Booking", "POST", "/booking/create", {
    auth: true,
    body: {
      service_type: "airport_transfer",
      fleet_id: ids.fleet,
      pickup_location: "Airport",
      dropoff_location: "City",
      pickup_date: "2026-09-01",
      pickup_time: "10:00",
      passengers_count: 2,
      amount: 8,
      currency: "KWD",
      payment_method: "card",
    },
  });
  ids.booking = r.data?.data?.id;

  console.log("\n--- RESULTS ---");
  results.forEach((x) => {
    console.log(`${x.ok ? "PASS" : "FAIL"} | ${x.name} | ${x.status} | ${x.message}`);
  });

  const failed = results.filter((x) => !x.ok).length;
  console.log(`\n${results.length - failed}/${results.length} passed`);
  if (failed) process.exit(1);
})();
