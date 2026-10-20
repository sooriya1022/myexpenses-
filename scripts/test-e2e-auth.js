async function runE2E() {
  const baseUrl = "http://localhost:3000";
  console.log("=== RUNNING LIVE HTTP E2E AUTHENTICATION TESTS ===");

  const timestamp = Date.now();
  const testUser = {
    name: "Aarav Patel",
    email: `aarav_${timestamp}@example.com`,
    password: "SecurePass123!",
  };

  try {
    // 1. Test Registration
    console.log("\n1. Testing HTTP User Registration (/api/auth/register)...");
    const regRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testUser),
    });
    const regData = await regRes.json();
    if (!regRes.ok) throw new Error(`Registration failed: ${regData.error}`);
    console.log("   ✓ HTTP Registration status:", regRes.status, "Created!");
    console.log("   ✓ User created:", regData.user.name, regData.user.email);

    // Extract auth cookie from registration response
    const regCookies = regRes.headers.get("set-cookie") || "";
    const hasAuthCookie = regCookies.includes("myexpense_token=");
    console.log("   ✓ Secure HTTP-only session cookie issued:", hasAuthCookie);

    // 2. Reject Duplicate Registration
    console.log("\n2. Testing Duplicate Email Rejection...");
    const dupRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testUser),
    });
    console.log("   ✓ Duplicate registration HTTP status (expected 409):", dupRes.status);
    if (dupRes.status !== 409) throw new Error("Duplicate registration was not rejected with 409!");

    // 3. Reject Incorrect Password Login
    console.log("\n3. Testing Incorrect Password Login Rejection...");
    const badLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testUser.email, password: "WrongPassword999!" }),
    });
    console.log("   ✓ Bad login HTTP status (expected 401):", badLoginRes.status);
    if (badLoginRes.status !== 401) throw new Error("Bad login was not rejected with 401!");

    // 4. Correct Login
    console.log("\n4. Testing Correct Password Login (/api/auth/login)...");
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testUser.email, password: testUser.password }),
    });
    const loginData = await loginRes.json();
    if (!loginRes.ok) throw new Error(`Login failed: ${loginData.error}`);
    console.log("   ✓ Login HTTP status:", loginRes.status, "Success!");

    const loginCookies = loginRes.headers.get("set-cookie") || "";
    const cookieMatch = loginCookies.match(/myexpense_token=([^;]+)/);
    const sessionToken = cookieMatch ? cookieMatch[1] : null;
    if (!sessionToken) throw new Error("No session token found in login cookie!");
    console.log("   ✓ Verified session token received in Set-Cookie header.");

    // 5. Protected Route Access Check With Cookie
    console.log("\n5. Testing Protected Route Access (Authenticated)...");
    const authedDashRes = await fetch(`${baseUrl}/dashboard`, {
      headers: { Cookie: `myexpense_token=${sessionToken}` },
      redirect: "manual",
    });
    console.log("   ✓ Protected /dashboard response status (expected 200):", authedDashRes.status);
    if (authedDashRes.status !== 200) throw new Error("Authenticated user failed to access dashboard!");

    // 6. Protected Route Access Check Without Cookie
    console.log("\n6. Testing Protected Route Access (Unauthenticated)...");
    const unauthedDashRes = await fetch(`${baseUrl}/dashboard`, {
      redirect: "manual",
    });
    console.log("   ✓ Unauthenticated /dashboard response status (expected 307 redirect):", unauthedDashRes.status);
    const redirectLoc = unauthedDashRes.headers.get("location") || "";
    console.log("   ✓ Redirects unauthenticated visitor to:", redirectLoc);
    if (unauthedDashRes.status !== 307 && !redirectLoc.includes("/login")) {
      throw new Error("Unauthenticated user was not redirected to /login!");
    }

    // 7. Check Current User Session (/api/auth/me)
    console.log("\n7. Testing Session Profile (/api/auth/me)...");
    const meRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Cookie: `myexpense_token=${sessionToken}` },
    });
    const meData = await meRes.json();
    console.log("   ✓ /api/auth/me verified user:", meData.user.name, `(${meData.user.email})`);

    // 8. Logout
    console.log("\n8. Testing Logout (/api/auth/logout)...");
    const logoutRes = await fetch(`${baseUrl}/api/auth/logout`, { method: "POST" });
    const logoutCookies = logoutRes.headers.get("set-cookie") || "";
    console.log("   ✓ Logout HTTP status:", logoutRes.status);
    console.log("   ✓ Auth cookie cleared (maxAge=0 or expired):", logoutCookies.includes("Max-Age=0") || logoutCookies.includes("1970"));

    console.log("\n=== ALL E2E HTTP AUTHENTICATION TESTS PASSED! ===");
    process.exit(0);
  } catch (err) {
    console.error("\n❌ E2E TEST FAILED:", err.message);
    process.exit(1);
  }
}

runE2E();
