/**
 * Phase 5 — Budget Management & Financial Reports E2E Tests
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

function parseCookieForHeader(setCookieStr) {
  if (!setCookieStr) return null;
  return setCookieStr.split(";")[0].trim();
}

async function register(suffix) {
  const ts = Date.now();
  const email = `phase5_${suffix}_${ts}@test.com`;
  const res = await fetch(`${BASE}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: `Test ${suffix}`, email, password: "TestPass123!" }),
  });
  const cookie = parseCookieForHeader(res.headers.get("set-cookie"));
  const data = await res.json();
  return { ok: res.ok, cookie, data, email };
}

async function getCategories(cookie) {
  const res = await fetch(`${BASE}/api/categories`, { headers: { Cookie: cookie } });
  const data = await res.json();
  return data.categories || [];
}

async function createTx(cookie, payload) {
  const res = await fetch(`${BASE}/api/transactions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify(payload),
  });
  return { ok: res.ok, data: await res.json() };
}

async function getBudgets(cookie, month, year) {
  const res = await fetch(`${BASE}/api/budgets?month=${month}&year=${year}`, {
    headers: { Cookie: cookie },
  });
  return { res, data: await res.json() };
}

async function createBudget(cookie, payload) {
  const res = await fetch(`${BASE}/api/budgets`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify(payload),
  });
  return { res, data: await res.json() };
}

async function updateBudget(cookie, id, amount) {
  const res = await fetch(`${BASE}/api/budgets/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({ amount }),
  });
  return { res, data: await res.json() };
}

async function deleteBudget(cookie, id) {
  const res = await fetch(`${BASE}/api/budgets/${id}`, {
    method: "DELETE",
    headers: { Cookie: cookie },
  });
  return { res, data: await res.json() };
}

async function getReports(cookie, period) {
  const res = await fetch(`${BASE}/api/reports?period=${period}`, {
    headers: { Cookie: cookie },
  });
  return { res, data: await res.json() };
}

async function run() {
  console.log("\n=== RUNNING PHASE 5 BUDGET & REPORTS TESTS ===\n");

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  // ── 1. Unauthenticated access ─────────────────────────────────────────────
  console.log("1. Unauthenticated Access...");
  const unauthedBudgets = await fetch(`${BASE}/api/budgets`);
  assert(unauthedBudgets.status === 401, "Unauthenticated /api/budgets → 401");

  const unauthedReports = await fetch(`${BASE}/api/reports`);
  assert(unauthedReports.status === 401, "Unauthenticated /api/reports → 401");

  const unauthedBudgetsPage = await fetch(`${BASE}/budgets`, { redirect: "manual" });
  assert(unauthedBudgetsPage.status === 307, "Unauthenticated /budgets page → 307 redirect");

  const unauthedReportsPage = await fetch(`${BASE}/reports`, { redirect: "manual" });
  assert(unauthedReportsPage.status === 307, "Unauthenticated /reports page → 307 redirect");

  // ── 2. Register User A ───────────────────────────────────────────────────
  console.log("\n2. Register User A...");
  const userA = await register("A");
  assert(userA.ok, "User A registered");
  assert(!!userA.cookie, "User A has session cookie");

  // ── 3. Empty budget state ─────────────────────────────────────────────────
  console.log("\n3. Empty Budget State...");
  const { res: emptyBRes, data: emptyBData } = await getBudgets(userA.cookie, month, year);
  assert(emptyBRes.ok, "GET /api/budgets 200 for authenticated user");
  assert(Array.isArray(emptyBData.budgets) && emptyBData.budgets.length === 0, "Empty: no budgets");
  assert(emptyBData.summary?.totalBudget === 0, "Empty: totalBudget = 0");

  // ── 4. Get categories and create transactions ─────────────────────────────
  console.log("\n4. Setting up transactions for User A...");
  const cats = await getCategories(userA.cookie);
  assert(cats.length === 14, `Has 14 categories (got ${cats.length})`);

  const salaryCat = cats.find(c => c.type === "INCOME");
  const foodCat = cats.find(c => c.name === "Food & Dining");
  const groceryCat = cats.find(c => c.name === "Groceries");
  const transportCat = cats.find(c => c.name === "Transportation");

  const today = new Date().toISOString().split("T")[0];
  const tx1 = await createTx(userA.cookie, { type: "INCOME", amount: 60000, categoryId: salaryCat.id, date: today, description: "Salary" });
  assert(tx1.ok, "Created income ₹60,000");
  const tx2 = await createTx(userA.cookie, { type: "EXPENSE", amount: 4200, categoryId: foodCat.id, date: today, description: "Dining" });
  assert(tx2.ok, "Created food expense ₹4,200");
  const tx3 = await createTx(userA.cookie, { type: "EXPENSE", amount: 2800, categoryId: groceryCat.id, date: today, description: "Groceries" });
  assert(tx3.ok, "Created grocery expense ₹2,800");
  const tx4 = await createTx(userA.cookie, { type: "EXPENSE", amount: 900, categoryId: transportCat.id, date: today, description: "Cab" });
  assert(tx4.ok, "Created transport expense ₹900");

  // ── 5. Create budgets ─────────────────────────────────────────────────────
  console.log("\n5. Create Budgets...");
  const { res: bRes1, data: bData1 } = await createBudget(userA.cookie, {
    categoryId: foodCat.id, amount: 5000, month, year,
  });
  assert(bRes1.status === 201, `Food budget created (status ${bRes1.status})`);
  assert(bData1.budget?.id, "Food budget has ID");

  const foodBudgetId = bData1.budget?.id;

  const { res: bRes2, data: bData2 } = await createBudget(userA.cookie, {
    categoryId: groceryCat.id, amount: 3000, month, year,
  });
  assert(bRes2.status === 201, "Grocery budget created");

  const { res: bRes3 } = await createBudget(userA.cookie, {
    categoryId: transportCat.id, amount: 500, month, year,
  });
  assert(bRes3.status === 201, "Transport budget created (will be over budget)");

  // ── 6. Duplicate budget rejection ─────────────────────────────────────────
  console.log("\n6. Duplicate Budget Rejection...");
  const { res: dupRes } = await createBudget(userA.cookie, {
    categoryId: foodCat.id, amount: 9999, month, year,
  });
  assert(dupRes.status === 409, `Duplicate food budget rejected with 409 (got ${dupRes.status})`);

  // ── 7. Validation ─────────────────────────────────────────────────────────
  console.log("\n7. Budget Validation...");
  const { res: negRes } = await createBudget(userA.cookie, {
    categoryId: groceryCat.id, amount: -100, month, year,
  });
  assert(negRes.status === 400, "Negative amount rejected (400)");

  const { res: noAmtRes } = await createBudget(userA.cookie, {
    categoryId: groceryCat.id, amount: 0, month, year,
  });
  assert(noAmtRes.status === 400, "Zero amount rejected (400)");

  // ── 8. Budget progress accuracy ───────────────────────────────────────────
  console.log("\n8. Budget Progress Accuracy...");
  const { data: progData } = await getBudgets(userA.cookie, month, year);
  const foodBudget = progData.budgets.find(b => b.category?.name === "Food & Dining");
  const groceryBudget = progData.budgets.find(b => b.category?.name === "Groceries");
  const transportBudget = progData.budgets.find(b => b.category?.name === "Transportation");

  assert(foodBudget?.amount === 5000, "Food budget amount = 5000");
  assert(foodBudget?.spent === 4200, `Food spent = 4200 (got ${foodBudget?.spent})`);
  assert(foodBudget?.remaining === 800, `Food remaining = 800 (got ${foodBudget?.remaining})`);
  assert(foodBudget?.percentage === 84, `Food percentage = 84% (got ${foodBudget?.percentage}%)`);
  assert(foodBudget?.status === "near", `Food status = "near" (got "${foodBudget?.status}")`);

  assert(groceryBudget?.spent === 2800, `Grocery spent = 2800 (got ${groceryBudget?.spent})`);
  assert(groceryBudget?.status === "near", `Grocery status = "near" (2800/3000=93% is near limit, got "${groceryBudget?.status}")`);

  assert(transportBudget?.spent === 900, `Transport spent = 900 (got ${transportBudget?.spent})`);
  assert(transportBudget?.status === "over", `Transport status = "over" (over budget by 400)`);
  assert(transportBudget?.remaining < 0, "Transport remaining is negative");

  // ── 9. Overall summary ────────────────────────────────────────────────────
  console.log("\n9. Overall Budget Summary...");
  const summary = progData.summary;
  assert(summary.totalBudget === 8500, `Total budget = 8500 (got ${summary.totalBudget})`);
  assert(summary.totalSpent === 7900, `Total spent = 7900 (got ${summary.totalSpent})`);

  // ── 10. Month filter ──────────────────────────────────────────────────────
  console.log("\n10. Month Filter (previous month has no budgets)...");
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const { data: prevData } = await getBudgets(userA.cookie, prevMonth, prevYear);
  assert(prevData.budgets.length === 0, "Previous month has no budgets (month isolation)");

  // ── 11. Edit budget ───────────────────────────────────────────────────────
  console.log("\n11. Edit Budget...");
  const { res: editRes, data: editData } = await updateBudget(userA.cookie, foodBudgetId, 6000);
  assert(editRes.ok, "Budget updated successfully");
  assert(editData.budget?.amount === 6000, `Updated amount = 6000 (got ${editData.budget?.amount})`);

  // ── 12. Delete budget ─────────────────────────────────────────────────────
  console.log("\n12. Delete Budget...");
  const { res: delRes } = await deleteBudget(userA.cookie, foodBudgetId);
  assert(delRes.ok, "Budget deleted successfully");

  const { data: afterDel } = await getBudgets(userA.cookie, month, year);
  assert(!afterDel.budgets.find(b => b.id === foodBudgetId), "Food budget no longer in list");
  assert(afterDel.budgets.length === 2, `Remaining budgets = 2 (got ${afterDel.budgets.length})`);

  // ── 13. Cross-user budget isolation ──────────────────────────────────────
  console.log("\n13. Cross-user Budget Isolation (User B)...");
  const userB = await register("B");
  assert(userB.ok, "User B registered");

  const { data: bBudgets } = await getBudgets(userB.cookie, month, year);
  assert(bBudgets.budgets.length === 0, "User B sees 0 budgets from User A");

  // User B tries to access User A's budget
  const { res: crossRes } = await fetch(`${BASE}/api/budgets/${bData2.budget?.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Cookie: userB.cookie },
    body: JSON.stringify({ amount: 99999 }),
  }).then(r => ({ res: r }));
  assert(crossRes.status === 404, `User B can't edit User A's budget (got ${crossRes.status})`);

  const { res: crossDelRes } = await fetch(`${BASE}/api/budgets/${bData2.budget?.id}`, {
    method: "DELETE",
    headers: { Cookie: userB.cookie },
  }).then(r => ({ res: r }));
  assert(crossDelRes.status === 404, "User B can't delete User A's budget");

  // ── 14. Reports — Empty state ─────────────────────────────────────────────
  console.log("\n14. Reports — User B (empty state)...");
  const { res: bRepRes, data: bRepData } = await getReports(userB.cookie, "all_time");
  assert(bRepRes.ok, "User B GET /api/reports 200");
  assert(bRepData.summary.totalIncome === 0, "User B: no income from User A");
  assert(bRepData.summary.totalExpense === 0, "User B: no expenses from User A");
  assert(bRepData.summary.transactionCount === 0, "User B: 0 transactions");
  assert(bRepData.categoryBreakdown.length === 0, "User B: no category data");

  // ── 15. Reports — Accuracy ────────────────────────────────────────────────
  console.log("\n15. Reports — Accuracy (User A)...");
  const { data: repData } = await getReports(userA.cookie, "all_time");
  assert(repData.summary.totalIncome === 60000, `Total income = 60000 (got ${repData.summary.totalIncome})`);
  assert(repData.summary.totalExpense === 7900, `Total expense = 7900 (got ${repData.summary.totalExpense})`);
  assert(repData.summary.balance === 52100, `Balance = 52100 (got ${repData.summary.balance})`);
  assert(repData.summary.transactionCount === 4, `Transaction count = 4 (got ${repData.summary.transactionCount})`);
  assert(repData.summary.incomeCount === 1, "Income count = 1");
  assert(repData.summary.expenseCount === 3, "Expense count = 3");

  // ── 16. Category breakdown ────────────────────────────────────────────────
  console.log("\n16. Category Breakdown...");
  const catBreakdown = repData.categoryBreakdown;
  assert(catBreakdown.length === 3, `3 expense categories (got ${catBreakdown.length})`);
  const foodCatRep = catBreakdown.find(c => c.name === "Food & Dining");
  assert(foodCatRep?.amount === 4200, `Food & Dining = 4200 (got ${foodCatRep?.amount})`);
  const totalPct = catBreakdown.reduce((s, c) => s + c.percentage, 0);
  assert(totalPct >= 98 && totalPct <= 100, `Category percentages sum ≈ 100% (got ${totalPct}%)`);
  // Sorted by amount desc
  assert(catBreakdown[0].name === "Food & Dining", "Categories sorted by amount descending");

  // ── 17. Monthly report ────────────────────────────────────────────────────
  console.log("\n17. Monthly Report Structure...");
  const monthly = repData.monthlyReport;
  assert(monthly.length === 6, `6-month report returned (got ${monthly.length})`);
  const currentMonthSlot = monthly[monthly.length - 1];
  assert(typeof currentMonthSlot.income === "number" && typeof currentMonthSlot.expense === "number", "Month slot has income & expense");
  assert(monthly.some(m => m.income > 0), "At least one month has income data");

  // ── 18. Top categories ────────────────────────────────────────────────────
  console.log("\n18. Top Categories...");
  assert(Array.isArray(repData.topCategories) && repData.topCategories.length <= 5, "Top categories ≤ 5");
  assert(repData.topCategories[0]?.name === "Food & Dining", "Top category is Food & Dining");

  // ── 19. Period filter ─────────────────────────────────────────────────────
  console.log("\n19. Report Period Filter...");
  const { data: prevMonthRep } = await getReports(userA.cookie, "previous_month");
  assert(prevMonthRep.summary.transactionCount === 0, "Previous month report: 0 transactions (all added this month)");
  assert(prevMonthRep.summary.totalIncome === 0, "Previous month report: income = 0");

  const { data: currMonthRep } = await getReports(userA.cookie, "current_month");
  assert(currMonthRep.summary.totalIncome === 60000, "Current month report: income correct");
  assert(currMonthRep.summary.totalExpense === 7900, "Current month report: expenses correct");

  // ── 20. CSV Export ────────────────────────────────────────────────────────
  console.log("\n20. CSV Export...");
  const csvRes = await fetch(`${BASE}/api/reports?period=all_time&format=csv`, {
    headers: { Cookie: userA.cookie },
  });
  assert(csvRes.ok, "CSV export request succeeded");
  assert(csvRes.headers.get("content-type")?.includes("text/csv"), "Response is text/csv");
  const csvText = await csvRes.text();
  assert(csvText.includes('"Date"') && csvText.includes('"Type"') && csvText.includes('"Category"'), "CSV has quoted header row");
  assert(csvText.includes("INCOME"), "CSV contains INCOME rows");
  assert(csvText.includes("EXPENSE"), "CSV contains EXPENSE rows");
  assert(csvText.includes("Salary"), "CSV contains salary description");
  // 4 data rows + 1 header
  const csvLines = csvText.trim().split("\n").filter(l => l.length > 0);
  assert(csvLines.length === 5, `CSV has 5 lines (header + 4 transactions), got ${csvLines.length}`);

  // ── 21. CSV cross-user isolation ──────────────────────────────────────────
  console.log("\n21. CSV Cross-user Isolation...");
  const bCsvRes = await fetch(`${BASE}/api/reports?period=all_time&format=csv`, {
    headers: { Cookie: userB.cookie },
  });
  const bCsv = await bCsvRes.text();
  const bCsvLines = bCsv.trim().split("\n").filter(l => l.length > 0);
  assert(bCsvLines.length === 1, `User B CSV has only header row (got ${bCsvLines.length} lines)`);
  assert(bCsv.includes('"Date"'), "User B CSV has header (correct)");
  assert(!bCsv.includes("Salary"), "User B CSV does not contain User A's data");


  // ── 22. Unauthenticated CSV ───────────────────────────────────────────────
  console.log("\n22. Unauthenticated CSV Rejected...");
  const unauthedCsv = await fetch(`${BASE}/api/reports?period=all_time&format=csv`);
  assert(unauthedCsv.status === 401, "Unauthenticated CSV export → 401");

  // ── Result ────────────────────────────────────────────────────────────────
  console.log(`\n${"=".repeat(56)}`);
  if (failed === 0) {
    console.log(`=== ALL ${passed} PHASE 5 BUDGET & REPORTS TESTS PASSED! ===`);
  } else {
    console.log(`=== ${passed} passed, ${failed} FAILED ===`);
    process.exit(1);
  }
}

run().catch((err) => {
  console.error("\n[FATAL ERROR]", err.message);
  process.exit(1);
});
