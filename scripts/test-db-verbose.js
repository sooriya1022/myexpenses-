require("dotenv").config();
const { PrismaClient } = require("@prisma/client");

async function main() {
  const prisma = new PrismaClient({
    log: ["error"],
  });
  try {
    const result = await prisma.$queryRawUnsafe("SELECT 1 AS ok");
    console.log("DB_SUCCESS:", JSON.stringify(result));
  } catch (e) {
    // Print full error without exposing connection string
    const msg = e.message || "";
    // Strip any URL that might contain password
    const safe = msg.replace(/postgresql:\/\/[^@]+@/g, "postgresql://***:***@");
    console.error("DB_ERROR (full):", safe);
    // Also print error code if available
    if (e.errorCode) console.error("Error code:", e.errorCode);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
