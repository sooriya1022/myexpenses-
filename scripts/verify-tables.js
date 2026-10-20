const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `;
    console.log("CONFIRMED_TABLES:", tables.map(t => t.table_name));
    await prisma.$disconnect();
  } catch (err) {
    console.error("VERIFY_ERROR:", err.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

main();
