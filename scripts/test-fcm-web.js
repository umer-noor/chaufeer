require("dotenv").config();

const BASE = process.env.TEST_API_URL?.replace(/\/$/, "") || "http://localhost:5000";
const API = `${BASE}/api`;
const results = [];

const assert = (name, ok, message = "") => {
  results.push({ name, ok, status: ok ? 200 : 400, message });
};

(async () => {
  console.log(`Testing ${API}\n`);

  const health = await fetch(`${API}/health`);
  if (!health.ok) {
    console.error("Server not reachable. Start with: npm run dev");
    process.exit(1);
  }

  const loginRes = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@chaufeer.com", password: "Admin@123" }),
  });
  const loginData = await loginRes.json().catch(() => ({}));
  const token = loginData?.data?.token || "";
  assert("Login", Boolean(token));

  const fakeToken = `test-web-token-${Date.now()}`;

  const saveRes = await fetch(`${API}/notifications/device-token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ token: fakeToken, platform: "web" }),
  });
  const saveData = await saveRes.json().catch(() => ({}));
  assert("Save device token", saveRes.ok && saveData.success === true, saveData.message || "");

  const listRes = await fetch(`${API}/notifications/get`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const listData = await listRes.json().catch(() => ({}));
  assert(
    "GET notifications unchanged shape",
    listRes.ok &&
      listData.success === true &&
      typeof listData.unread_count === "number" &&
      Array.isArray(listData.data),
    `count=${listData.count}`
  );

  // Credential check (invalid token is expected to fail send, but init must work)
  const fcm = require("../services/fcmService");
  assert("FCM env configured", fcm.isConfigured());
  const send = await fcm.sendToTokens([fakeToken], {
    title: "FCM test",
    body: "Backend credential check",
    data: { type: "test" },
  });
  assert(
    "FCM admin SDK reachable",
    typeof send.success_count === "number" && typeof send.failure_count === "number",
    `success=${send.success_count} fail=${send.failure_count}`
  );

  const delRes = await fetch(`${API}/notifications/device-token`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ token: fakeToken }),
  });
  const delData = await delRes.json().catch(() => ({}));
  assert("Remove device token", delRes.ok && delData.success === true, delData.message || "");

  console.log("\n--- RESULTS ---");
  results.forEach((x) => {
    console.log(`${x.ok ? "PASS" : "FAIL"} | ${x.name} | ${x.message}`);
  });
  const failed = results.filter((x) => !x.ok).length;
  console.log(`\n${results.length - failed}/${results.length} passed`);
  console.log("\nNote: Real browser push needs a real FCM token from UI.");
  process.exit(failed ? 1 : 0);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
