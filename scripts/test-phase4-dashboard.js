/**
 * Phase 4 — Dashboard & Analytics E2E Tests
 * Tests /api/dashboard endpoint for all analytics requirements.
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

/** Extract just "name=value" from a Set-Cookie header string for use as Cookie: header */
function parseCookieForHeader(setCookieStr) {
  if (!setCookieStr) return null;
  return setCookieStr.split(";")[0].trim();
}

async function register(suffix) {
  const ts = Date.now();
  const email = `phase4_${suffix}_${ts}@test.com`;
  const res = await fetch(`${BASE}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: `Test ${suffix}`, email, password: "TestPass123!" }),
  });
  const rawSetCookie = res.headers.get("set-cookie");
  const cookie = parseCookieForHeader(rawSetCookie);
  const data = await res.json();
  return { ok: res.ok, cookie, data, email };
}


async function createTx(cookie, payload) {
  const res = await fetch(`${BASE}/api/transactions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify(payload),
  });
  return res;
}

async function getCategories(cookie) {
  const res = await fetch(`${BASE}/api/categories`, {
    headers: { Cookie: cookie },
  });
  const data = await res.json();
  return data.categories || [];
}

async function getDashboard(cookie, period = "all_time") {
  const res = await fetch(`${BASE}/api/dashboard?period=${period}`, {
    headers: { Cookie: cookie },
  });
  return { res, data: await res.json() };
}

async function run() {
  console.log("\n=== RUNNING PHASE 4 DASHBOARD & ANALYTICS TESTS ===\n");

  // ── 1. Unauthenticated access ────────────────────────────────────────────────
  console.log("1. Unauthenticated Access...");
  const unauthed = await fetch(`${BASE}/api/dashboard`);
  assert(unauthed.status === 401, "Unauthenticated /api/dashboard returns 401");

  // ── 2. Register User A (fresh, no transactions) ──────────────────────────────
  console.log("\n2. Register User A (empty state)...");
  const userA = await register("A");
  assert(userA.ok, "User A registered successfully");
  assert(!!userA.cookie, "User A received session cookie");

  // ── 3. Dashboard with no transactions ────────────────────────────────────────
  console.log("\n3. Empty-state Dashboard (no transactions)...");
  const { res: emptyRes, data: emptyData } = await getDashboard(userA.cookie);
  assert(emptyRes.ok, "GET /api/dashboard 200 for authenticated user");
  assert(emptyData.summary?.totalIncome === 0, "Empty: totalIncome = 0");
  assert(emptyData.summary?.totalExpense === 0, "Empty: totalExpense = 0");
  assert(emptyData.summary?.balance === 0, "Empty: balance = 0");
  assert(emptyData.summary?.transactionCount === 0, "Empty: transactionCount = 0");
  assert(Array.isArray(emptyData.categoryExpenses) && emptyData.categoryExpenses.length === 0, "Empty: no category expenses");
  assert(Array.isArray(emptyData.recentTransactions) && emptyData.recentTransactions.length === 0, "Empty: no recent transactions");
  assert(Array.isArray(emptyData.monthlyChartData) && emptyData.monthlyChartData.length === 6, "Monthly chart always has 6 months");

  // ── 4. Create transactions for User A ────────────────────────────────────────
  console.log("\n4. Creating transactions for User A...");
  const cats = await getCategories(userA.cookie);
  assert(cats.length === 14, `User A has 14 categories (got ${cats.length})`);

  const salaryCat = cats.find((c) => c.type === "INCOME");
  const foodCat = cats.find((c) => c.name === "Food & Dining");
  const groceryCat = cats.find((c) => c.name === "Groceries");
  const transportCat = cats.find((c) => c.name === "Transportation");
  assert(!!salaryCat, "Income category found");
  assert(!!foodCat, "Food & Dining category found");

  // Current month transactions
  const today = new Date().toISOString().split("T")[0];

  const txPayloads = [
    { type: "INCOME", amount: 80000, categoryId: salaryCat.id, date: today, description: "Monthly Salary" },
    { type: "EXPENSE", amount: 5000, categoryId: foodCat.id, date: today, description: "Lunch & Dinner" },
    { type: "EXPENSE", amount: 3200, categoryId: groceryCat.id, date: today, description: "Supermarket" },
    { type: "EXPENSE", amount: 1500, categoryId: transportCat.id, date: today, description: "Cab rides" },
  ];

  for (const payload of txPayloads) {
    const r = await createTx(userA.cookie, payload);
    assert(r.ok, `Created ${payload.type} ₹${payload.amount} (${payload.description})`);
  }

  // ── 5. All-time summary accuracy ─────────────────────────────────────────────
  console.log("\n5. All-time Summary Accuracy...");
  const { data: allTime } = await getDashboard(userA.cookie, "all_time");
  assert(allTime.summary.totalIncome === 80000, `Total Income = ₹80,000 (got ${allTime.summary.totalIncome})`);
  assert(allTime.summary.totalExpense === 9700, `Total Expense = ₹9,700 (got ${allTime.summary.totalExpense})`);
  assert(allTime.summary.balance === 70300, `Balance = ₹70,300 (got ${allTime.summary.balance})`);
  assert(allTime.summary.transactionCount === 4, `Transaction count = 4 (got ${allTime.summary.transactionCount})`);

  // ── 6. Current-month filter ───────────────────────────────────────────────────
  console.log("\n6. Current-month Filter...");
  const { data: currMonth } = await getDashboard(userA.cookie, "current_month");
  assert(currMonth.summary.totalIncome === 80000, "Current month: income correct");
  assert(currMonth.summary.totalExpense === 9700, "Current month: expenses correct");
  assert(currMonth.summary.transactionCount === 4, "Current month: count = 4");

  // ── 7. Category expense breakdown ────────────────────────────────────────────
  console.log("\n7. Category Expense Breakdown...");
  const catExpenses = allTime.categoryExpenses;
  assert(Array.isArray(catExpenses) && catExpenses.length === 3, `3 expense categories returned (got ${catExpenses.length})`);
  const foodEntry = catExpenses.find((c) => c.name === "Food & Dining");
  const groceryEntry = catExpenses.find((c) => c.name === "Groceries");
  const transportEntry = catExpenses.find((c) => c.name === "Transportation");
  assert(!!foodEntry && foodEntry.amount === 5000, `Food & Dining = ₹5,000`);
  assert(!!groceryEntry && groceryEntry.amount === 3200, `Groceries = ₹3,200`);
  assert(!!transportEntry && transportEntry.amount === 1500, `Transportation = ₹1,500`);
  // Percentages add up to ~100
  const totalPct = catExpenses.reduce((s, c) => s + c.percentage, 0);
  assert(totalPct >= 98 && totalPct <= 100, `Category percentages sum ≈ 100% (got ${totalPct}%)`);
  // Sorted by amount desc
  assert(catExpenses[0].name === "Food & Dining", "Categories sorted by amount descending");
  // Color present
  assert(!!catExpenses[0].color && catExpenses[0].color.startsWith("#"), "Category has color hex");

  // ── 8. Monthly chart data structure ──────────────────────────────────────────
  console.log("\n8. Monthly Chart Data...");
  const monthly = allTime.monthlyChartData;
  assert(monthly.length === 6, `6 months in chart data (got ${monthly.length})`);
  const currentMonthLabel = new Date().toLocaleString("en-IN", { month: "short", year: "2-digit" });
  const lastSlot = monthly[monthly.length - 1];
  assert(!!lastSlot.month, "Last month slot has label");
  assert(typeof lastSlot.income === "number" && typeof lastSlot.expense === "number", "Month slot has income & expense numbers");
  // Current month slot should have the data we added
  const hasCurrentMonthData = monthly.some((m) => m.income > 0 || m.expense > 0);
  assert(hasCurrentMonthData, "At least one month slot has non-zero data");

  // ── 9. Recent transactions ────────────────────────────────────────────────────
  console.log("\n9. Recent Transactions...");
  const recent = allTime.recentTransactions;
  assert(recent.length === 4, `Recent transactions: 4 returned (got ${recent.length})`);
  assert(recent.every((tx) => tx.category && tx.category.name), "All recent tx have category.name");
  assert(recent.every((tx) => tx.category && tx.category.color), "All recent tx have category.color");
  assert(recent.every((tx) => typeof tx.amount === "number"), "All recent tx have numeric amount");
  assert(recent.every((tx) => tx.type === "INCOME" || tx.type === "EXPENSE"), "All recent tx have valid type");

  // ── 10. Previous month returns no data (transactions are this month) ──────────
  console.log("\n10. Previous Month Returns Empty (all transactions are current month)...");
  const { data: prevMonth } = await getDashboard(userA.cookie, "previous_month");
  assert(prevMonth.summary.totalIncome === 0, "Previous month: income = 0 (no old transactions)");
  assert(prevMonth.summary.totalExpense === 0, "Previous month: expense = 0 (no old transactions)");

  // ── 11. User B cannot see User A's dashboard ──────────────────────────────────
  console.log("\n11. Cross-user Data Isolation...");
  const userB = await register("B");
  assert(userB.ok, "User B registered");
  const { data: bDash } = await getDashboard(userB.cookie, "all_time");
  assert(bDash.summary.totalIncome === 0, "User B dashboard: income = 0 (isolated from A)");
  assert(bDash.summary.transactionCount === 0, "User B dashboard: 0 transactions (isolated from A)");
  assert(bDash.categoryExpenses.length === 0, "User B: no category data from User A");
  assert(bDash.recentTransactions.length === 0, "User B: no recent tx from User A");

  // ── 12. API response structure ────────────────────────────────────────────────
  console.log("\n12. API Response Structure...");
  const { data: structCheck } = await getDashboard(userA.cookie);
  assert("summary" in structCheck, "Response has summary");
  assert("monthlyChartData" in structCheck, "Response has monthlyChartData");
  assert("categoryExpenses" in structCheck, "Response has categoryExpenses");
  assert("recentTransactions" in structCheck, "Response has recentTransactions");
  assert("period" in structCheck, "Response has period");

  // ── Result ────────────────────────────────────────────────────────────────────
  console.log(`\n${"=".repeat(52)}`);
  if (failed === 0) {
    console.log(`=== ALL ${passed} PHASE 4 DASHBOARD TESTS PASSED! ===`);
  } else {
    console.log(`=== ${passed} passed, ${failed} FAILED ===`);
    process.exit(1);
  }
}

run().catch((err) => {
  console.error("\n[FATAL ERROR]", err.message);
  process.exit(1);
});
