/**
 * Phase 6B — Multilingual Support Verification Tests
 * Tests English, Tamil, and Hindi translations, category translator,
 * cookie persistence, and page accessibility across all three languages.
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

async function run() {
  console.log("\n=== RUNNING PHASE 6B MULTILINGUAL SUPPORT TESTS ===\n");

  // 1. Verify translation dictionary integrity
  console.log("1. Checking translation dictionary structure and completeness...");
  const { translations, LANGUAGES, getCategoryTranslation } = await import(
    "../src/lib/translations.ts"
  );

  assert(Array.isArray(LANGUAGES) && LANGUAGES.length === 3, "Supports exactly 3 languages (en, ta, hi)");
  assert(LANGUAGES.some((l) => l.code === "en" && l.name === "English"), "English (en) configured");
  assert(LANGUAGES.some((l) => l.code === "ta" && l.nativeName === "தமிழ்"), "Tamil (ta) configured with proper Unicode");
  assert(LANGUAGES.some((l) => l.code === "hi" && l.nativeName === "हिन्दी"), "Hindi (hi) configured with Devanagari");

  const requiredSections = [
    "common",
    "nav",
    "welcomeModal",
    "landing",
    "auth",
    "dashboard",
    "transactions",
    "budgets",
    "reports",
    "settings",
    "categories",
  ];

  for (const lang of ["en", "ta", "hi"]) {
    for (const section of requiredSections) {
      assert(
        translations[lang] && translations[lang][section],
        `[${lang}] has section '${section}'`
      );
    }
  }

  // 2. Test Category Translator
  console.log("\n2. Testing Category Translation Helper...");
  assert(
    getCategoryTranslation("Food & Dining", "en") === "Food & Dining",
    "English category: Food & Dining"
  );
  assert(
    getCategoryTranslation("Food & Dining", "ta") === "உணவு & சாப்பாடு",
    "Tamil category: உணவு & சாப்பாடு"
  );
  assert(
    getCategoryTranslation("Food & Dining", "hi") === "खान-पान",
    "Hindi category: खान-पान"
  );
  assert(
    getCategoryTranslation("Salary", "ta") === "மாத சம்பளம்",
    "Tamil category: மாத சம்பளம்"
  );
  assert(
    getCategoryTranslation("Salary", "hi") === "वेतन / सैलरी",
    "Hindi category: वेतन / सैलरी"
  );
  // Unknown / custom category should return original string
  assert(
    getCategoryTranslation("My Custom Freelance Gig", "ta") === "My Custom Freelance Gig",
    "User-generated category preserves original string without error"
  );

  // 3. Register user and test language switching
  console.log("\n3. Testing authenticated session with language cookies...");
  const ts = Date.now();
  const regRes = await fetch(`${BASE}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Ananya Iyer",
      email: `ananya_lang_${ts}@test.com`,
      password: "TestPass123!",
    }),
  });
  assert(regRes.status === 201, "User registered successfully");
  const rawCookie = regRes.headers.get("set-cookie");
  const authCookie = rawCookie ? rawCookie.split(";")[0].trim() : "";
  assert(!!authCookie, "Obtained auth cookie");

  // 4. Test page access with language cookies (en, ta, hi)
  console.log("\n4. Testing HTTP responses across all three languages...");
  const pages = ["/", "/dashboard", "/transactions", "/budgets", "/reports", "/settings"];

  for (const lang of ["en", "ta", "hi"]) {
    const langCookie = `myexpense_lang=${lang}; myexpense_lang_selected=true; ${authCookie}`;
    for (const page of pages) {
      const res = await fetch(`${BASE}${page}`, {
        headers: { Cookie: langCookie },
        redirect: "manual",
      });
      assert(
        res.status === 200,
        `Page ${page} responds with 200 OK for language [${lang}]`
      );
    }
  }

  // 5. Test CSV export with language parameter
  console.log("\n5. Testing CSV export with language parameters...");
  for (const lang of ["en", "ta", "hi"]) {
    const csvRes = await fetch(`${BASE}/api/reports?period=all_time&format=csv&lang=${lang}`, {
      headers: { Cookie: authCookie },
    });
    assert(csvRes.status === 200, `CSV export succeeds for lang=${lang}`);
    assert(
      csvRes.headers.get("content-type")?.includes("text/csv"),
      `CSV content-type is text/csv for lang=${lang}`
    );
    const csvText = await csvRes.text();
    assert(csvText.includes("Date"), `CSV header contains Date for lang=${lang}`);
  }

  console.log(`\n${"=".repeat(56)}`);
  if (failed === 0) {
    console.log(`=== ALL ${passed} PHASE 6B MULTILINGUAL TESTS PASSED! ===\n`);
  } else {
    console.log(`=== ${passed} passed, ${failed} FAILED ===\n`);
    process.exit(1);
  }
}

run().catch((e) => {
  console.error("Test error:", e);
  process.exit(1);
});
