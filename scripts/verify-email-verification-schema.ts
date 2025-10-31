import { db, pool } from "../apps/server/db";
import { sql } from "drizzle-orm";

async function verifySchema() {
  try {
    console.log("🔍 Verifying email verification schema changes...\n");

    // Check if email verification columns exist in users table
    console.log("1. Checking users table columns...");
    const usersColumns = await db.execute(sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'users'
      AND column_name IN ('email_verified', 'email_verification_token', 'email_verification_expiry')
      ORDER BY column_name;
    `);

    if (usersColumns.rows.length === 3) {
      console.log("   ✅ All email verification columns exist:");
      usersColumns.rows.forEach((row: any) => {
        console.log(`      - ${row.column_name} (${row.data_type})`);
      });
    } else {
      console.log("   ❌ Missing email verification columns");
      console.log(
        `      Found ${usersColumns.rows.length} of 3 expected columns`
      );
    }

    // Check if support_requests table exists
    console.log("\n2. Checking support_requests table...");
    const supportRequestsTable = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'support_requests'
      );
    `);

    if (supportRequestsTable.rows[0].exists) {
      console.log("   ✅ support_requests table exists");

      const supportRequestsCount = await db.execute(sql`
        SELECT COUNT(*) as count FROM support_requests;
      `);
      console.log(`      Records: ${supportRequestsCount.rows[0].count}`);
    } else {
      console.log("   ❌ support_requests table does not exist");
    }

    // Check if sales_inquiries table exists
    console.log("\n3. Checking sales_inquiries table...");
    const salesInquiriesTable = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'sales_inquiries'
      );
    `);

    if (salesInquiriesTable.rows[0].exists) {
      console.log("   ✅ sales_inquiries table exists");

      const salesInquiriesCount = await db.execute(sql`
        SELECT COUNT(*) as count FROM sales_inquiries;
      `);
      console.log(`      Records: ${salesInquiriesCount.rows[0].count}`);
    } else {
      console.log("   ❌ sales_inquiries table does not exist");
    }

    // Check indexes
    console.log("\n4. Checking indexes...");
    const indexes = await db.execute(sql`
      SELECT indexname
      FROM pg_indexes
      WHERE tablename IN ('users', 'support_requests', 'sales_inquiries')
      AND indexname LIKE 'idx_%'
      ORDER BY indexname;
    `);

    if (indexes.rows.length > 0) {
      console.log("   ✅ Found indexes:");
      indexes.rows.forEach((row: any) => {
        console.log(`      - ${row.indexname}`);
      });
    } else {
      console.log("   ⚠️  No custom indexes found (may not be applied yet)");
    }

    // Check existing users email_verified status
    console.log("\n5. Checking existing users email verification status...");
    const verifiedUsers = await db.execute(sql`
      SELECT 
        COUNT(*) as total_users,
        COUNT(*) FILTER (WHERE email_verified = true) as verified_users,
        COUNT(*) FILTER (WHERE email_verified = false) as unverified_users
      FROM users;
    `);

    const stats = verifiedUsers.rows[0];
    console.log(`   Total users: ${stats.total_users}`);
    console.log(`   Verified: ${stats.verified_users}`);
    console.log(`   Unverified: ${stats.unverified_users}`);

    console.log("\n✅ Schema verification complete!");
  } catch (error) {
    console.error("❌ Verification failed:", error);
    throw error;
  } finally {
    await pool.end();
  }
}

verifySchema();
