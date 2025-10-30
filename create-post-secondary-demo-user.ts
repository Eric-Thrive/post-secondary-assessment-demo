import { db } from "./apps/server/db";
import { users, assessmentCases } from "./packages/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

async function createPostSecondaryDemoUser() {
  try {
    const username = "postsec-demo";
    const password = "Demo123!";
    const email = "postsec-demo@localhost.com";

    console.log("Creating/updating post-secondary demo user...");

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    const hashedPassword = await bcrypt.hash(password, 10);

    let userId: number;

    if (existingUser.length > 0) {
      console.log("Demo user exists, updating...");

      await db
        .update(users)
        .set({
          password: hashedPassword,
          role: "customer",
          assignedModules: ["post_secondary"],
          isActive: true,
          maxReports: 10,
        })
        .where(eq(users.username, username));

      userId = existingUser[0].id;
      console.log("✅ Demo user updated successfully!");
    } else {
      console.log("Creating new demo user...");

      const [newUser] = await db
        .insert(users)
        .values({
          username: username,
          password: hashedPassword,
          email: email,
          role: "customer",
          assignedModules: ["post_secondary"],
          customerId: "demo-postsec",
          customerName: "Post-Secondary Demo User",
          isActive: true,
          reportCount: 1,
          maxReports: 10,
        })
        .returning({
          id: users.id,
          username: users.username,
          email: users.email,
          role: users.role,
        });

      userId = newUser.id;
      console.log("✅ Demo user created successfully!");
      console.log("User details:", newUser);
    }

    // Create a sample post-secondary assessment case
    console.log("\nCreating sample post-secondary assessment case...");

    const caseId = `PS-DEMO-${Date.now()}`;

    const [assessmentCase] = await db
      .insert(assessmentCases)
      .values({
        caseId: caseId,
        moduleType: "post_secondary",
        displayName: "Sample Post-Secondary Assessment",
        uniqueId: "STUDENT-12345",
        programMajor: "Computer Science",
        reportAuthor: "Dr. Jane Smith",
        dateIssued: new Date(),
        status: "completed",
        customerId: "demo-postsec",
        createdByUserId: userId,
        documentNames: [],
        reportData: {},
        itemMasterData: {},
        reportDataJson: {
          studentInfo: {
            uniqueId: "STUDENT-12345",
            programMajor: "Computer Science",
            reportAuthor: "Dr. Jane Smith",
            dateIssued: new Date().toISOString(),
          },
          barriers: [
            {
              id: "B-001",
              label: "Reading Comprehension Deficit",
              status: "validated",
              evidence:
                "WAIS-IV Verbal Comprehension Index score of 82 (12th percentile)",
              functionalImpact:
                "Struggles to extract meaning from college-level textbooks",
            },
            {
              id: "B-002",
              label: "Written Expression Difficulties",
              status: "validated",
              evidence:
                "WIAT-III Written Expression composite score of 75 (5th percentile)",
              functionalImpact:
                "Difficulty organizing thoughts into coherent written arguments",
            },
            {
              id: "B-003",
              label: "Executive Functioning Deficits",
              status: "validated",
              evidence:
                "BRIEF-A shows clinically significant elevations in Planning/Organization",
              functionalImpact:
                "Struggles to break down large assignments into manageable steps",
            },
          ],
          accommodations: [
            {
              id: "A-001",
              label: "Extended Time for Exams (1.5x)",
              barriersAddressed: ["B-001", "B-002"],
              category: "Testing Accommodation",
            },
            {
              id: "A-002",
              label: "Note-Taking Support",
              barriersAddressed: ["B-001", "B-003"],
              category: "Academic Support",
            },
            {
              id: "A-003",
              label: "Text-to-Speech Software",
              barriersAddressed: ["B-001"],
              category: "Assistive Technology",
            },
          ],
        },
      })
      .returning();

    console.log("✅ Sample assessment case created!");
    console.log("Case ID:", assessmentCase.caseId);

    console.log(`
🎓 Post-Secondary Demo User Created!
   
   Login Credentials:
   Username: ${username}
   Password: ${password}
   Email: ${email}
   Role: customer
   Module: post_secondary
   
   Sample Assessment:
   Case ID: ${assessmentCase.caseId}
   Display Name: ${assessmentCase.displayName}
   Status: ${assessmentCase.status}
   
   You can now login and view the post-secondary pathway!
`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating demo user:", error);
    process.exit(1);
  }
}

createPostSecondaryDemoUser();
