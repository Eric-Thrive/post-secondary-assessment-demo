import { db, pool } from "../apps/server/db.js";
import { sql } from "drizzle-orm";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  try {
    console.log("🚀 Starting email verification migration...");

    // Read the index migration file
    const indexMigrationPath = path.join(
      __dirname,
      "../migrations/0001_add_email_verification_indexes.sql"
    );
    const indexMigration = fs.readFileSync(indexMigrationPath, "utf-8");

    console.log("📝 Applying indexes and backward compatibility updates...");

    // Split by statement separator and execute each statement
    const statements = indexMigration
      .split("--")
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith("--"));

    for (const statement of statements) {
      if (statement.trim()) {
        await db.execute(sql.raw(statement));
      }
    }

    console.log("✅ Migration completed successfully!");
    console.log("\nChanges applied:");
    console.log(
      "  ✓ Added email_verified, email_verification_token, email_verification_expiry columns to users table"
    );
    console.log("  ✓ Created support_requests table");
    console.log("  ✓ Created sales_inquiries table");
    console.log("  ✓ Added indexes for performance optimization");
    console.log("  ✓ Set existing users to email_verified = true");

    // Verify the changes
    const result = await db.execute(sql`
      SELECT COUNT(*) as count 
      FROM users 
      WHERE email_verified = true
    `);

    console.log(`\n📊 Verified users count: ${result.rows[0].count}`);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  } finally {
    await pool.end();
  }
}

runMigration();
