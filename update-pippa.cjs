const { Client } = require("pg");

async function updatePippa() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log("✅ Connected to database");

    // First, let's see what users exist
    const allUsers = await client.query(`
      SELECT username, email, role, email_verified 
      FROM users 
      WHERE role IN ('system_admin', 'developer') OR username ILIKE '%pippa%'
      ORDER BY username
    `);

    console.log("\n📊 Admin/Dev users:");
    allUsers.rows.forEach((user) => {
      console.log(
        `   ${user.username} (${user.email}) - ${user.role} - Verified: ${user.email_verified}`
      );
    });

    // Update Pippa if found
    const result = await client.query(`
      UPDATE users 
      SET email_verified = true,
          email_verification_token = NULL,
          email_verification_expiry = NULL
      WHERE username ILIKE 'pippa'
      RETURNING username, email, email_verified, role
    `);

    if (result.rows.length > 0) {
      console.log("\n✅ Updated Pippa user:");
      result.rows.forEach((user) => {
        console.log(`   Username: ${user.username}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Email Verified: ${user.email_verified}`);
      });
    } else {
      console.log('\n❌ No user found with username "pippa"');
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await client.end();
  }
}

updatePippa();
