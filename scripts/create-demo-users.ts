#!/usr/bin/env tsx

import { db } from "../apps/server/db";
import { users } from "../packages/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

async function createDemoUsers() {
  try {
    console.log(
      "🚀 Creating demo users for all 3 modules (role-based system)...\n"
    );

    const demoUsers = [
      {
        username: "demo-k12",
        password: "Demo123!",
        email: "demo-k12@localhost.com",
        role: "demo",
        assignedModules: ["k12"],
        customerName: "K12 Demo User",
        maxReports: 5,
      },
      {
        username: "demo-postsecondary",
        password: "Demo123!",
        email: "demo-postsecondary@localhost.com",
        role: "demo",
        assignedModules: ["post_secondary"],
        customerName: "Post-Secondary Demo User",
        maxReports: 5,
      },
      {
        username: "demo-tutoring",
        password: "Demo123!",
        email: "demo-tutoring@localhost.com",
        role: "demo",
        assignedModules: ["tutoring"],
        customerName: "Tutoring Demo User",
        maxReports: 5,
      },
    ];

    for (const demoUser of demoUsers) {
      console.log(`📝 Processing ${demoUser.username}...`);

      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.username, demoUser.username));

      const hashedPassword = await bcrypt.hash(demoUser.password, 12);

      if (existingUser) {
        console.log("   ↻ User exists, updating...");

        await db
          .update(users)
          .set({
            password: hashedPassword,
            role: demoUser.role,
            assignedModules: demoUser.assignedModules,
            customerName: demoUser.customerName,
            maxReports: demoUser.maxReports,
            isActive: true,
            reportCount: 0,
          })
          .where(eq(users.username, demoUser.username));

        console.log("   ✅ Updated successfully!");
      } else {
        console.log("   + Creating new user...");

        await db.insert(users).values({
          username: demoUser.username,
          password: hashedPassword,
          email: demoUser.email,
          role: demoUser.role,
          assignedModules: demoUser.assignedModules,
          customerId: `demo-${demoUser.assignedModules[0]}`,
          customerName: demoUser.customerName,
          isActive: true,
          reportCount: 0,
          maxReports: demoUser.maxReports,
        });

        console.log("   ✅ Created successfully!");
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("🎉 All demo users created/updated successfully!");
    console.log("=".repeat(60));
    console.log("\n📋 Demo User Credentials:\n");

    demoUsers.forEach((user) => {
      console.log(`🔹 ${user.customerName}`);
      console.log(`   Username: ${user.username}`);
      console.log(`   Password: ${user.password}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Module: ${user.assignedModules[0]}`);
      console.log(`   Max Reports: ${user.maxReports}`);
      console.log("");
    });

    console.log("=".repeat(60));

    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating demo users:", error);
    process.exit(1);
  }
}

createDemoUsers();
