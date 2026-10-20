require("dotenv").config();
const { PrismaClient } = require("@prisma/client");

async function test(label, url) {
  const prisma = new PrismaClient({ datasources: { db: { url } } });
  try {
    const result = await prisma.$queryRawUnsafe("SELECT 1 AS ok");
    console.log(`${label}: SUCCESS`, JSON.stringify(result));
    return true;
  } catch (e) {
    console.error(`${label}: FAIL — ${e.message.split("\n")[0]}`);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  const base = process.env.DATABASE_URL || "";
  const url5432 = base;
  const url6543 = base.replace(":5432/", ":6543/");

  console.log("Testing port 5432 (session pooler)...");
  const ok5432 = await test("5432", url5432);

  if (!ok5432) {
    console.log("\nTesting port 6543 (transaction pooler)...");
    const ok6543 = await test("6543", url6543);
    if (ok6543) {
      console.log("\n✓ Port 6543 works. Updating .env...");
      const fs = require("fs");
      const envPath = require("path").join(__dirname, "../.env");
      let env = fs.readFileSync(envPath, "utf8");
      env = env.replace(/:5432\//g, ":6543/");
      fs.writeFileSync(envPath, env);
      console.log("✓ .env updated to use port 6543.");
    }
  }
}

main().catch(console.error);
