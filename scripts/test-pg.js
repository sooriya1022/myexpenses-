const { Client } = require('pg');
require('dotenv').config();

async function check() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.log("NO_URL");
    return;
  }
  
  // Try port 5432
  console.log("Testing connection with pg client...");
  const client = new Client({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });

  try {
    await client.connect();
    console.log("PG_SUCCESS: Connected to database!");
    const res = await client.query('SELECT current_user, current_database(), version();');
    console.log("PG_DATA:", res.rows[0].current_user, res.rows[0].current_database);
    await client.end();
  } catch (err) {
    console.log("PG_ERROR_CODE:", err.code);
    console.log("PG_ERROR_MESSAGE:", err.message);
    if (err.routine) console.log("PG_ROUTINE:", err.routine);
    try { await client.end(); } catch (e) {}
  }
}

check();
