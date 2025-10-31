import pg from "pg";

const client = new pg.Client({
  connectionString:
    "postgresql://neondb_owner:npg_4mHBtfowpI6Q@ep-dark-breeze-aezh6e7z.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require",
  connectionTimeoutMillis: 5000,
});

try {
  console.log("Attempting to connect...");
  await client.connect();
  console.log("✅ Connected successfully");

  const res = await client.query("SELECT NOW()");
  console.log("Database time:", res.rows[0].now);

  await client.end();
  console.log("✅ Connection closed");
} catch (error) {
  console.error("❌ Connection failed:", error.message);
  process.exit(1);
}
