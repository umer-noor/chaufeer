require("dotenv").config();

// Local pre-deploy tests. Set TEST_API_URL=https://chaufeer.vercel.app to test production.
const BASE = process.env.TEST_API_URL?.replace(/\/$/, "") || "http://localhost:5000";
const API = `${BASE}/api`;
const EMAIL = "umernoor42@gmail.com";
const PASSWORD = "admin123";

const results = [];
let token = "";
const ids = {};

const req = async (name, method, path, { body, auth = false, publicRoute = false } = {}) => {
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

  let r = await req("Health", "GET", "/health", { publicRoute: true });
  if (!r.ok) {
    console.error("Server not reachable. Run: npm run dev");
    process.exit(1);
  }

  r = await req("Login", "POST", "/auth/login", {
    body: { email: EMAIL, password: PASSWORD },
    publicRoute: true,
  });
  token = r.data?.data?.token || "";
  if (!token) {
    console.error("Login failed - check user in DB (provider: local, password: admin123)");
    results.forEach((x) => console.log(`${x.ok ? "PASS" : "FAIL"} ${x.name} (${x.status}) ${x.message}`));
    process.exit(1);
  }

  await req("Profile", "GET", "/auth/profile", { auth: true });
  await req("Logout", "POST", "/auth/logout", { auth: true });
  await req("Forgot Password (email)", "POST", "/auth/forgot-password", {
    body: { email: EMAIL },
    publicRoute: true,
  });

  r = await req("Create Fleet", "POST", "/fleet/create", {
    auth: true,
    body: {
      vehicle_name: "Test Mercedes S-Class",
      vehicle_type: "sedan",
      category: "ultra_luxury",
      image_url: "https://example.com/car.jpg",
      seat_count: 3,
      luggage_capacity: 2,
      amenities: [{ name: "WiFi", icon_key: "wifi" }],
      display_order: 1,
    },
  });
  ids.fleet = r.data?.data?.id;

  await req("Get Fleets (public)", "GET", "/fleet/get", { publicRoute: true });

  if (ids.fleet) {
    r = await req("Create Fleet Detail", "POST", "/fleet_detail/create", {
      auth: true,
      body: {
        fleet: ids.fleet,
        title: "Test Fleet Detail",
        vehicle_image_url: "https://example.com/detail.jpg",
        highlights: [{ title: "24/7 Available", icon_key: "clock" }],
        is_featured: true,
      },
    });
    ids.fleet_detail = r.data?.data?.id;
    await req("Get Fleet Details (public)", "GET", "/fleet_detail/get", { publicRoute: true });
  }

  r = await req("Create Service Coverage", "POST", "/service_coverage/create", {
    auth: true,
    body: {
      section_type: "featured",
      title: "Airport Transfers",
      description: "Professional airport transfers",
      display_order: 1,
    },
  });
  ids.coverage = r.data?.data?.id;
  await req("Get Service Coverage (public)", "GET", "/service_coverage/get", { publicRoute: true });

  r = await req("Create Customer Review", "POST", "/customer_review/create", {
    auth: true,
    body: {
      customer_name: "Test User",
      star_rating: 5,
      review_title: "Great service",
      review_content: "API test review",
    },
  });
  ids.review = r.data?.data?.id;
  await req("Get Customer Reviews (public)", "GET", "/customer_review/get", { publicRoute: true });

  r = await req("Create Booking", "POST", "/booking/create", {
    auth: true,
    body: {
      service_type: "airport_transfer",
      pick_up_location: "Hamad Airport",
      drop_off_location: "Doha City",
      class: "Business",
      date_and_time: "2026-08-01T10:00:00.000Z",
      passengers: 2,
      childs: 0,
      amount: 100,
      currency: "QAR",
    },
  });
  ids.booking = r.data?.data?.id;
  await req("Get Bookings", "GET", "/booking/get", { auth: true });

  r = await req("Get In Touch", "POST", "/get_in_touch/create", {
    publicRoute: true,
    body: {
      full_name: "API Tester",
      phone_number: "+97412345678",
      email_address: EMAIL,
      note: "Automated API test",
    },
  });
  ids.inquiry = r.data?.data?.id;
  await req("Get Inquiries", "GET", "/get_in_touch/get", { auth: true });

  const noAuth = await fetch(`${API}/auth/profile`);
  const noAuthData = await noAuth.json().catch(() => ({}));
  results.push({
    name: "No token returns 401",
    ok: noAuth.status === 401,
    status: noAuth.status,
    message: noAuthData.message || "",
  });

  console.log("\n--- RESULTS ---");
  results.forEach((x) => {
    console.log(`${x.ok ? "PASS" : "FAIL"} | ${x.name} | ${x.status} | ${x.message}`);
  });

  const failed = results.filter((x) => !x.ok).length;
  console.log(`\n${results.length - failed}/${results.length} passed`);
  if (failed) process.exit(1);
})();
