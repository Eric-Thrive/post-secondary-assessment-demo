import pkg from "pg";
const { Client } = pkg;

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

try {
  await client.connect();
  console.log("✅ Connected to database");

  // Update Pippa's email verification status
  const result = await client.query(`
    UPDATE users 
    SET email_verified = true,
        email_verification_token = NULL,
        email_verification_expiry = NULL
    WHERE username ILIKE 'pippa'
    RETURNING username, email, email_verified, role
  `);

  if (result.rows.length > 0) {
    console.log("✅ Updated Pippa user:");
    result.rows.forEach((user) => {
      console.log(`   Username: ${user.username}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Email Verified: ${user.email_verified}`);
    });
  } else {
    console.log('❌ No user found with username "pippa"');

    // Show available users
    const allUsers = await client.query(`
      SELECT username, email, role 
      FROM users 
      WHERE role IN ('system_admin', 'developer')
      ORDER BY username
    `);

    console.log("\n📊 Available admin/dev users:");
    allUsers.rows.forEach((user) => {
      console.log(`   ${user.username} (${user.email}) - ${user.role}`);
    });
  }
} catch (error) {
  console.error("❌ Error:", error.message);
} finally {
  await client.end();
}
