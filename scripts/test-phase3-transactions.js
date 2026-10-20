async function runPhase3Tests() {
  const baseUrl = "http://localhost:3000";
  console.log("=== RUNNING PHASE 3 TRANSACTION CRUD & DATA ISOLATION TESTS ===");

  const timestamp = Date.now();
  const userA = {
    name: "Priya Sharma",
    email: `priya_${timestamp}@example.com`,
    password: "PriyaPassword123!",
  };
  const userB = {
    name: "Karan Verma",
    email: `karan_${timestamp}@example.com`,
    password: "KaranPassword123!",
  };

  try {
    // 1. Unauthenticated protection checks
    console.log("\n1. Testing Unauthenticated API and Page Access...");
    const unauthApiRes = await fetch(`${baseUrl}/api/transactions`);
    console.log("   ✓ Unauthenticated /api/transactions status (expected 401):", unauthApiRes.status);
    if (unauthApiRes.status !== 401) throw new Error("Unauthenticated API access was not rejected with 401!");

    const unauthPageRes = await fetch(`${baseUrl}/transactions`, { redirect: "manual" });
    console.log("   ✓ Unauthenticated /transactions redirect status (expected 307):", unauthPageRes.status);
    if (unauthPageRes.status !== 307) throw new Error("Unauthenticated /transactions was not redirected!");

    // 2. Register User A
    console.log("\n2. Registering User A...");
    const regARes = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userA),
    });
    if (!regARes.ok) throw new Error("Failed to register User A");
    const cookieA = regARes.headers.get("set-cookie")?.match(/myexpense_token=([^;]+)/)?.[1];
    if (!cookieA) throw new Error("No auth cookie for User A");
    console.log("   ✓ User A registered and session cookie acquired.");

    // 3. Fetch User A categories
    console.log("\n3. Fetching User A Categories (/api/categories)...");
    const catARes = await fetch(`${baseUrl}/api/categories`, {
      headers: { Cookie: `myexpense_token=${cookieA}` },
    });
    const catAData = await catARes.json();
    console.log(`   ✓ User A has ${catAData.categories.length} categories.`);
    const salaryCat = catAData.categories.find((c) => c.name === "Salary" && c.type === "INCOME");
    const groceriesCat = catAData.categories.find((c) => c.name === "Groceries" && c.type === "EXPENSE");
    const rentCat = catAData.categories.find((c) => c.name === "Housing & Rent" && c.type === "EXPENSE");

    if (!salaryCat || !groceriesCat || !rentCat) throw new Error("Default categories not found!");

    // 4. Create Transactions for User A
    console.log("\n4. Creating Transactions for User A (Income & Expenses)...");
    // Income: Salary 75,000
    const tx1Res = await fetch(`${baseUrl}/api/transactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: `myexpense_token=${cookieA}` },
      body: JSON.stringify({
        amount: 75000,
        type: "INCOME",
        categoryId: salaryCat.id,
        date: "2026-10-01T10:00:00.000Z",
        description: "Monthly Tech Salary",
      }),
    });
    const tx1Data = await tx1Res.json();
    if (!tx1Res.ok) throw new Error(`Failed to create tx1: ${tx1Data.error}`);
    console.log("   ✓ Created Income transaction:", tx1Data.transaction.id, `(₹${tx1Data.transaction.amount})`);

    // Expense: Groceries 4,500
    const tx2Res = await fetch(`${baseUrl}/api/transactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: `myexpense_token=${cookieA}` },
      body: JSON.stringify({
        amount: 4500,
        type: "EXPENSE",
        categoryId: groceriesCat.id,
        date: "2026-10-02T12:30:00.000Z",
        description: "Weekly Grocery Essentials",
      }),
    });
    const tx2Data = await tx2Res.json();
    if (!tx2Res.ok) throw new Error(`Failed to create tx2: ${tx2Data.error}`);
    console.log("   ✓ Created Expense transaction:", tx2Data.transaction.id, `(₹${tx2Data.transaction.amount})`);

    // Expense: Rent 18,000
    const tx3Res = await fetch(`${baseUrl}/api/transactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: `myexpense_token=${cookieA}` },
      body: JSON.stringify({
        amount: 18000,
        type: "EXPENSE",
        categoryId: rentCat.id,
        date: "2026-10-03T09:00:00.000Z",
        description: "October 2026 Apartment Rent",
      }),
    });
    const tx3Data = await tx3Res.json();
    if (!tx3Res.ok) throw new Error(`Failed to create tx3: ${tx3Data.error}`);
    console.log("   ✓ Created Expense transaction:", tx3Data.transaction.id, `(₹${tx3Data.transaction.amount})`);

    // 5. Read Transactions and Verify Calculation
    console.log("\n5. Reading Transactions & Calculating Balances...");
    const readARes = await fetch(`${baseUrl}/api/transactions`, {
      headers: { Cookie: `myexpense_token=${cookieA}` },
    });
    const readAData = await readARes.json();
    console.log("   ✓ Total transactions returned:", readAData.transactions.length);
    console.log("   ✓ Total Income calculated:", readAData.summary.totalIncome, "(Expected 75000)");
    console.log("   ✓ Total Expense calculated:", readAData.summary.totalExpense, "(Expected 22500)");
    console.log("   ✓ Net Balance calculated:", readAData.summary.balance, "(Expected 52500)");

    if (
      readAData.summary.totalIncome !== 75000 ||
      readAData.summary.totalExpense !== 22500 ||
      readAData.summary.balance !== 52500
    ) {
      throw new Error("Financial summary calculations mismatch!");
    }

    // 6. Edit Transaction (Update Groceries to 5,200)
    console.log("\n6. Editing Transaction (PUT /api/transactions/[id])...");
    const editRes = await fetch(`${baseUrl}/api/transactions/${tx2Data.transaction.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Cookie: `myexpense_token=${cookieA}` },
      body: JSON.stringify({
        amount: 5200,
        description: "Updated Grocery Order + Fruits",
      }),
    });
    const editData = await editRes.json();
    if (!editRes.ok) throw new Error(`Failed to edit transaction: ${editData.error}`);
    console.log("   ✓ Updated amount:", editData.transaction.amount, "(Expected 5200)");
    console.log("   ✓ Updated description:", editData.transaction.description);

    // Verify recalculation after edit
    const recheckRes = await fetch(`${baseUrl}/api/transactions`, {
      headers: { Cookie: `myexpense_token=${cookieA}` },
    });
    const recheckData = await recheckRes.json();
    console.log("   ✓ Recalculated Total Expense:", recheckData.summary.totalExpense, "(Expected 23200)");
    console.log("   ✓ Recalculated Net Balance:", recheckData.summary.balance, "(Expected 51800)");
    if (recheckData.summary.totalExpense !== 23200 || recheckData.summary.balance !== 51800) {
      throw new Error("Recalculation after edit mismatch!");
    }

    // 7. Multi-User Isolation Checks with User B
    console.log("\n7. Testing Multi-User Security & Isolation with User B...");
    const regBRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userB),
    });
    const cookieB = regBRes.headers.get("set-cookie")?.match(/myexpense_token=([^;]+)/)?.[1];
    if (!cookieB) throw new Error("No auth cookie for User B");

    // User B reads their transactions -> must be 0
    const readBRes = await fetch(`${baseUrl}/api/transactions`, {
      headers: { Cookie: `myexpense_token=${cookieB}` },
    });
    const readBData = await readBRes.json();
    console.log("   ✓ User B sees own transactions count:", readBData.transactions.length, "(Expected 0)");
    if (readBData.transactions.length !== 0) throw new Error("Isolation breach: User B saw User A transactions!");

    // User B attempts to read User A's transaction
    const hackGetRes = await fetch(`${baseUrl}/api/transactions/${tx1Data.transaction.id}`, {
      headers: { Cookie: `myexpense_token=${cookieB}` },
    });
    console.log("   ✓ User B GET User A's transaction status (expected 404):", hackGetRes.status);
    if (hackGetRes.status !== 404) throw new Error("User B was able to view User A's transaction!");

    // User B attempts to edit User A's transaction
    const hackPutRes = await fetch(`${baseUrl}/api/transactions/${tx1Data.transaction.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Cookie: `myexpense_token=${cookieB}` },
      body: JSON.stringify({ amount: 999999 }),
    });
    console.log("   ✓ User B PUT User A's transaction status (expected 404):", hackPutRes.status);
    if (hackPutRes.status !== 404) throw new Error("User B was able to edit User A's transaction!");

    // User B attempts to delete User A's transaction
    const hackDelRes = await fetch(`${baseUrl}/api/transactions/${tx1Data.transaction.id}`, {
      method: "DELETE",
      headers: { Cookie: `myexpense_token=${cookieB}` },
    });
    console.log("   ✓ User B DELETE User A's transaction status (expected 404):", hackDelRes.status);
    if (hackDelRes.status !== 404) throw new Error("User B was able to delete User A's transaction!");

    // User B attempts to create a transaction referencing User A's category ID
    const hackCatRes = await fetch(`${baseUrl}/api/transactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: `myexpense_token=${cookieB}` },
      body: JSON.stringify({
        amount: 1000,
        type: "EXPENSE",
        categoryId: groceriesCat.id, // User A's category
        date: new Date().toISOString(),
      }),
    });
    console.log("   ✓ User B using User A's category status (expected 404):", hackCatRes.status);
    if (hackCatRes.status !== 404) throw new Error("User B was able to reference User A's category!");

    // 8. Delete Transaction by Owner (User A)
    console.log("\n8. Testing Deletion by Owner (User A)...");
    const delRes = await fetch(`${baseUrl}/api/transactions/${tx3Data.transaction.id}`, {
      method: "DELETE",
      headers: { Cookie: `myexpense_token=${cookieA}` },
    });
    console.log("   ✓ User A DELETE status:", delRes.status);
    if (delRes.status !== 200) throw new Error("Failed to delete transaction as owner!");

    const finalRes = await fetch(`${baseUrl}/api/transactions`, {
      headers: { Cookie: `myexpense_token=${cookieA}` },
    });
    const finalData = await finalRes.json();
    console.log("   ✓ Remaining transactions count for User A:", finalData.transactions.length, "(Expected 2)");
    if (finalData.transactions.length !== 2) throw new Error("Transaction count after delete mismatch!");

    // 9. Input Validation Tests
    console.log("\n9. Testing Input Validation Rules...");
    // Negative amount
    const invalidAmtRes = await fetch(`${baseUrl}/api/transactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: `myexpense_token=${cookieA}` },
      body: JSON.stringify({
        amount: -50,
        type: "EXPENSE",
        categoryId: groceriesCat.id,
        date: new Date().toISOString(),
      }),
    });
    console.log("   ✓ Negative amount rejected (expected 400):", invalidAmtRes.status);
    if (invalidAmtRes.status !== 400) throw new Error("Negative amount was not rejected!");

    // Invalid type
    const invalidTypeRes = await fetch(`${baseUrl}/api/transactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: `myexpense_token=${cookieA}` },
      body: JSON.stringify({
        amount: 50,
        type: "INVALID_TYPE",
        categoryId: groceriesCat.id,
        date: new Date().toISOString(),
      }),
    });
    console.log("   ✓ Invalid type rejected (expected 400):", invalidTypeRes.status);
    if (invalidTypeRes.status !== 400) throw new Error("Invalid type was not rejected!");

    console.log("\n=== ALL PHASE 3 TRANSACTION TESTS PASSED WITH 100% SUCCESS! ===");
    process.exit(0);
  } catch (err) {
    console.error("\n❌ TEST FAILED:", err.message);
    process.exit(1);
  }
}

runPhase3Tests();
