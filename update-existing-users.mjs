import pg from "pg";

const client = new pg.Client({
  connectionString:
    "postgresql://neondb_owner:npg_4mHBtfowpI6Q@ep-dark-breeze-aezh6e7z.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require",
  connectionTimeoutMillis: 5000,
});

try {
  console.log("Connecting to database...");
  await client.connect();
  console.log("✅ Connected\n");

  console.log("Updating existing users to email_verified = true...");
  const result = await client.query(`
    UPDATE users 
    SET email_verified = true 
    WHERE email_verified = false
  `);

  console.log(`✅ Updated ${result.rowCount} users to verified status\n`);

  // Verify the update
  const verifyResult = await client.query(`
    SELECT 
      COUNT(*) as total_users,
      COUNT(*) FILTER (WHERE email_verified = true) as verified_users,
      COUNT(*) FILTER (WHERE email_verified = false) as unverified_users
    FROM users
  `);

  const stats = verifyResult.rows[0];
  console.log("Current status:");
  console.log(`  Total users: ${stats.total_users}`);
  console.log(`  Verified: ${stats.verified_users}`);
  console.log(`  Unverified: ${stats.unverified_users}`);

  await client.end();
  console.log("\n✅ Done!");
} catch (error) {
  console.error("❌ Error:", error.message);
  process.exit(1);
}
