const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  try {
    const result = await prisma.$queryRawUnsafe("SELECT 1 AS ok");
    console.log("DB_CONNECTION_SUCCESS:", JSON.stringify(result));
  } catch (e) {
    console.error("DB_CONNECTION_FAIL:", e.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
