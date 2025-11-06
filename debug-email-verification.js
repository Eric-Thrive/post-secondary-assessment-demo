#!/usr/bin/env node

/**
 * Debug script for email verification issues
 * Run with: node debug-email-verification.js
 */

const { Client } = require("pg");

async function debugEmailVerification() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log("✅ Connected to database");

    // Check for unverified users
    const result = await client.query(`
      SELECT 
        id, username, email, email_verified, 
        email_verification_token IS NOT NULL as has_token,
        email_verification_expiry,
        created_at
      FROM users 
      WHERE email_verified = false 
      ORDER BY created_at DESC 
      LIMIT 10
    `);

    console.log(`\n📊 Found ${result.rows.length} unverified users:`);

    result.rows.forEach((user, index) => {
      console.log(`\n${index + 1}. ${user.username} (${user.email})`);
      console.log(`   Created: ${user.created_at}`);
      console.log(`   Has Token: ${user.has_token}`);
      console.log(`   Token Expiry: ${user.email_verification_expiry}`);

      if (user.email_verification_expiry) {
        const isExpired = new Date() > new Date(user.email_verification_expiry);
        console.log(`   Token Expired: ${isExpired}`);
      }
    });

    // Check environment variables
    console.log(`\n🔧 Environment Configuration:`);
    console.log(
      `   SENDGRID_API_KEY: ${process.env.SENDGRID_API_KEY ? "Set" : "Missing"}`
    );
    console.log(
      `   SENDGRID_FROM_EMAIL: ${process.env.SENDGRID_FROM_EMAIL || "Not set"}`
    );
    console.log(`   BASE_URL: ${process.env.BASE_URL || "Not set"}`);
    console.log(`   NODE_ENV: ${process.env.NODE_ENV || "Not set"}`);
  } catch (error) {
    console.error("❌ Debug failed:", error);
  } finally {
    await client.end();
  }
}

debugEmailVerification().catch(console.error);
