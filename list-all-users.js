import pg from "pg";
import * as dotenv from "dotenv";

dotenv.config();

const { Client } = pg;

async function listUsers() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log("Connected to database\n");

    // List all users
    const result = await client.query(
      `SELECT id, username, email, role, assigned_modules, is_active, created_at 
       FROM users 
       ORDER BY created_at DESC 
       LIMIT 20`
    );

    console.log(`Total users found: ${result.rows.length}\n`);

    result.rows.forEach((user, index) => {
      console.log(`${index + 1}. ${user.username}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Modules: ${JSON.stringify(user.assigned_modules)}`);
      console.log(`   Active: ${user.is_active}`);
      console.log(`   Created: ${user.created_at}`);
      console.log("");
    });

    // Specifically search for 'milk' with case-insensitive search
    const milkSearch = await client.query(
      `SELECT * FROM users WHERE LOWER(username) = LOWER($1) OR LOWER(email) LIKE LOWER($2)`,
      ["milk", "%milk%"]
    );

    if (milkSearch.rows.length > 0) {
      console.log('\n⚠️  Found user(s) matching "milk":');
      console.log(milkSearch.rows);
    } else {
      console.log('\n✅ No users found matching "milk"');
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await client.end();
  }
}

listUsers();
