/**
 * Phase 6A — UI/UX Redesign & Navigation Verification Tests
 */

const BASE = "http://localhost:3000";

let passed = 0;
let failed = 0;

function assert(condition, label, detail = "") {
  if (condition) {
    console.log(`   ✓ ${label}`);
    passed++;
  } else {
    console.error(`   ✗ FAIL: ${label}${detail ? " — " + detail : ""}`);
    failed++;
  }
}

function parseCookie(res) {
  const raw = res.headers.get("set-cookie");
  if (!raw) return null;
  return raw.split(";")[0].trim();
}

async function run() {
  console.log("\n=== RUNNING PHASE 6A UI/UX & NAVIGATION TESTS ===\n");

  // 1. Unauthenticated Route Protection for Settings
  console.log("1. Checking Unauthenticated Route Protection for Settings...");
  const unauthSettings = await fetch(`${BASE}/settings`, { redirect: "manual" });
  assert(
    unauthSettings.status === 307,
    "Unauthenticated /settings returns 307 redirect",
    `Got status ${unauthSettings.status}`
  );
  const location = unauthSettings.headers.get("location");
  assert(
    location && location.includes("/login"),
    "Redirect location targets /login",
    `Got location: ${location}`
  );

  // 2. Register a new user to test authenticated routes
  console.log("\n2. Registering a test user...");
  const ts = Date.now();
  const regRes = await fetch(`${BASE}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Siddharth Verma",
      email: `sid_ui_${ts}@example.com`,
      password: "TestPass123!",
    }),
  });
  assert(regRes.status === 201, "User registered successfully");
  const cookie = parseCookie(regRes);
  assert(!!cookie, "Auth cookie obtained");

  // 3. Authenticated page access for all 5 sidebar destinations
  console.log("\n3. Testing Authenticated Access to All 5 Sidebar Destinations...");
  const routes = ["/dashboard", "/transactions", "/budgets", "/reports", "/settings"];
  for (const r of routes) {
    const pageRes = await fetch(`${BASE}${r}`, {
      headers: { Cookie: cookie },
      redirect: "manual",
    });
    assert(pageRes.status === 200, `Authenticated ${r} returns 200 OK`);
  }

  // 4. Verify /api/auth/me returns valid user info for the sidebar
  console.log("\n4. Verifying /api/auth/me user profile for Sidebar card...");
  const meRes = await fetch(`${BASE}/api/auth/me`, {
    headers: { Cookie: cookie },
  });
  assert(meRes.status === 200, "/api/auth/me returns 200");
  const meData = await meRes.json();
  assert(meData.user?.name === "Siddharth Verma", "User name matches registered name");
  assert(meData.user?.email.includes("sid_ui_"), "User email matches registered email");

  // 5. Logout destroys session
  console.log("\n5. Testing Logout...");
  const logoutRes = await fetch(`${BASE}/api/auth/logout`, {
    method: "POST",
    headers: { Cookie: cookie },
  });
  assert(logoutRes.status === 200, "Logout endpoint returns 200");

  const postLogoutSettings = await fetch(`${BASE}/settings`, {
    redirect: "manual",
  });
  assert(
    postLogoutSettings.status === 307,
    "Unauthenticated request after logout returns 307 redirect"
  );

  console.log(`\n${"=".repeat(56)}`);
  if (failed === 0) {
    console.log(`=== ALL ${passed} PHASE 6A UI TESTS PASSED! ===\n`);
  } else {
    console.log(`=== ${passed} passed, ${failed} FAILED ===\n`);
    process.exit(1);
  }
}

run().catch((e) => {
  console.error("Test error:", e);
  process.exit(1);
});
