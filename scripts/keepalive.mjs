// Pings the database with a trivial read so the Supabase free-tier project doesn't
// get auto-paused after a period of inactivity. Run on a schedule via
// .github/workflows/keepalive.yml -- read-only, no data is modified.

import { Client } from "pg";

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10_000,
  query_timeout: 10_000,
});

await client.connect();
const result = await client.query("SELECT 1");
console.log("Keepalive ping OK:", result.rows);
await client.end();
