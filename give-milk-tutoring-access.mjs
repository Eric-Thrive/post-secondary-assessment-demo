import pg from "pg";
import "dotenv/config";

const { Client } = pg;

async function giveMilkTutoringAccess() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log("🔧 Giving Milk access to tutoring module...\n");

    await client.query(
      `UPDATE users 
       SET assigned_modules = $1
       WHERE username = $2`,
      [JSON.stringify(["k12", "tutoring"]), "Milk"]
    );

    console.log('✅ Updated Milk\'s modules to: ["k12", "tutoring"]');
    console.log("\nMilk can now access both K-12 and Tutoring modules.");
    console.log("Please log out and log back in for changes to take effect.");
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await client.end();
  }
}

giveMilkTutoringAccess();
