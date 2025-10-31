import { describe, test, expect, afterEach } from "vitest";
import { db } from "../../apps/server/db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "../../apps/server/auth";

/**
 * Integration tests for email-verified registration flow
 * Tests Requirements: 2.1, 2.2, 2.3, 3.1, 4.1
 *
 * NOTE: These tests require the server to be running.
 * Start the server with: npm run dev
 * Then run tests with: npx vitest run --config=vitest.config.integration.ts tests/integration/registration-flow.test.ts
 */

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:5000";

describe("Registration Flow Integration Tests", () => {
  const timestamp = Date.now();
  const testEmail = `test-${timestamp}@example.com`;
  const testUsername = `testuser-${timestamp}`;
  const testPassword = "TestPass123!";

  afterEach(async () => {
    // Cleanup test users
    try {
      await db.delete(users).where(eq(users.email, testEmail));
      await db.delete(users).where(eq(users.username, testUsername));
    } catch (error) {
      console.log("Cleanup error (may be expected):", error);
    }
  });

  describe("Complete Registration and Verification Flow", () => {
    test("should successfully register user, send verification email, and verify account", async () => {
      // Step 1: Register new user
      const registerResponse = await fetch(`${BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: testUsername,
          password: testPassword,
          email: testEmail,
        }),
      });

      expect(registerResponse.status).toBe(201);
      const registerData = await registerResponse.json();
      expect(registerData.message).toContain("check your email");
      expect(registerData.email).toBe(testEmail);
      expect(registerData.user.username).toBe(testUsername);

      // Step 2: Verify user exists in database with emailVerified = false
      const [createdUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, testEmail));

      expect(createdUser).toBeDefined();
      expect(createdUser.emailVerified).toBe(false);
      expect(createdUser.emailVerificationToken).toBeDefined();
      expect(createdUser.emailVerificationExpiry).toBeDefined();

      // Step 3: Attempt login before verification (should fail)
      const loginBeforeVerifyResponse = await fetch(
        `${BASE_URL}/api/auth/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: testUsername,
            password: testPassword,
          }),
        }
      );

      expect(loginBeforeVerifyResponse.status).toBe(403);
      const loginBeforeData = await loginBeforeVerifyResponse.json();
      expect(loginBeforeData.code).toBe("EMAIL_NOT_VERIFIED");
      expect(loginBeforeData.message).toContain("verify your email");

      // Step 4: Verify email using token
      const verificationToken = createdUser.emailVerificationToken!;
      const verifyResponse = await fetch(
        `${BASE_URL}/api/auth/verify-email?token=${verificationToken}`
      );

      expect(verifyResponse.status).toBe(200);
      const verifyData = await verifyResponse.json();
      expect(verifyData.success).toBe(true);
      expect(verifyData.message).toContain("verified successfully");
      expect(verifyData.redirectUrl).toBe("/login");

      // Step 5: Verify user is now marked as verified in database
      const [verifiedUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, testEmail));

      expect(verifiedUser.emailVerified).toBe(true);
      expect(verifiedUser.emailVerificationToken).toBeNull();
      expect(verifiedUser.emailVerificationExpiry).toBeNull();

      // Step 6: Login should now succeed
      const loginAfterVerifyResponse = await fetch(
        `${BASE_URL}/api/auth/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: testUsername,
            password: testPassword,
          }),
        }
      );

      expect(loginAfterVerifyResponse.status).toBe(200);
      const loginAfterData = await loginAfterVerifyResponse.json();
      expect(loginAfterData.message).toBe("Login successful");
      expect(loginAfterData.user.username).toBe(testUsername);
    });
  });

  describe("Duplicate Email Handling", () => {
    test("should reject registration with duplicate email", async () => {
      // Step 1: Register first user
      const firstRegisterResponse = await fetch(
        `${BASE_URL}/api/auth/register`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: testUsername,
            password: testPassword,
            email: testEmail,
          }),
        }
      );

      expect(firstRegisterResponse.status).toBe(201);

      // Step 2: Attempt to register with same email but different username
      const duplicateEmailResponse = await fetch(
        `${BASE_URL}/api/auth/register`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: `${testUsername}-different`,
            password: testPassword,
            email: testEmail, // Same email
          }),
        }
      );

      expect(duplicateEmailResponse.status).toBe(409);
      const duplicateData = await duplicateEmailResponse.json();
      expect(duplicateData.error).toBe("Email already exists");
    });

    test("should reject registration with duplicate username", async () => {
      // Step 1: Register first user
      const firstRegisterResponse = await fetch(
        `${BASE_URL}/api/auth/register`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: testUsername,
            password: testPassword,
            email: testEmail,
          }),
        }
      );

      expect(firstRegisterResponse.status).toBe(201);

      // Step 2: Attempt to register with same username but different email
      const duplicateUsernameResponse = await fetch(
        `${BASE_URL}/api/auth/register`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: testUsername, // Same username
            password: testPassword,
            email: `different-${testEmail}`,
          }),
        }
      );

      expect(duplicateUsernameResponse.status).toBe(409);
      const duplicateData = await duplicateUsernameResponse.json();
      expect(duplicateData.error).toBe("Username already exists");
    });
  });

  describe("Expired Token Handling", () => {
    test("should reject expired verification token", async () => {
      // Step 1: Create user with expired token manually
      const hashedPassword = await hashPassword(testPassword);
      const expiredDate = new Date(Date.now() - 1000 * 60 * 60 * 25); // 25 hours ago

      const [createdUser] = await db
        .insert(users)
        .values({
          username: testUsername,
          password: hashedPassword,
          email: testEmail,
          customerId: `customer-${testUsername}`,
          role: "customer",
          isActive: true,
          reportCount: 0,
          maxReports: -1,
          emailVerified: false,
          emailVerificationToken: "expired-token-hash",
          emailVerificationExpiry: expiredDate,
        })
        .returning();

      expect(createdUser).toBeDefined();

      // Step 2: Attempt to verify with expired token
      const verifyResponse = await fetch(
        `${BASE_URL}/api/auth/verify-email?token=expired-token-hash`
      );

      expect(verifyResponse.status).toBe(400);
      const verifyData = await verifyResponse.json();
      expect(verifyData.code).toBe("EXPIRED_TOKEN");
      expect(verifyData.message).toContain("expired");
      expect(verifyData.email).toBe(testEmail);
    });

    test("should reject invalid verification token", async () => {
      // Step 1: Register user
      const registerResponse = await fetch(`${BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: testUsername,
          password: testPassword,
          email: testEmail,
        }),
      });

      expect(registerResponse.status).toBe(201);

      // Step 2: Attempt to verify with invalid token
      const verifyResponse = await fetch(
        `${BASE_URL}/api/auth/verify-email?token=invalid-token-that-does-not-exist`
      );

      expect(verifyResponse.status).toBe(400);
      const verifyData = await verifyResponse.json();
      expect(verifyData.code).toBe("INVALID_TOKEN");
      expect(verifyData.message).toContain("invalid");
    });
  });

  describe("Resend Verification Flow", () => {
    test("should successfully resend verification email with new token", async () => {
      // Step 1: Register user
      const registerResponse = await fetch(`${BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: testUsername,
          password: testPassword,
          email: testEmail,
        }),
      });

      expect(registerResponse.status).toBe(201);

      // Step 2: Get original token
      const [userBeforeResend] = await db
        .select()
        .from(users)
        .where(eq(users.email, testEmail));

      const originalToken = userBeforeResend.emailVerificationToken;
      expect(originalToken).toBeDefined();

      // Step 3: Request resend verification email
      const resendResponse = await fetch(
        `${BASE_URL}/api/auth/resend-verification`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: testEmail,
          }),
        }
      );

      expect(resendResponse.status).toBe(200);
      const resendData = await resendResponse.json();
      expect(resendData.message).toContain("new verification email");

      // Step 4: Verify new token was generated
      const [userAfterResend] = await db
        .select()
        .from(users)
        .where(eq(users.email, testEmail));

      const newToken = userAfterResend.emailVerificationToken;
      expect(newToken).toBeDefined();
      expect(newToken).not.toBe(originalToken); // Token should be different

      // Step 5: Old token should not work
      const oldTokenVerifyResponse = await fetch(
        `${BASE_URL}/api/auth/verify-email?token=${originalToken}`
      );

      expect(oldTokenVerifyResponse.status).toBe(400);

      // Step 6: New token should work
      const newTokenVerifyResponse = await fetch(
        `${BASE_URL}/api/auth/verify-email?token=${newToken}`
      );

      expect(newTokenVerifyResponse.status).toBe(200);
      const verifyData = await newTokenVerifyResponse.json();
      expect(verifyData.success).toBe(true);
    });

    test("should handle resend for already verified email", async () => {
      // Step 1: Register and verify user
      await fetch(`${BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: testUsername,
          password: testPassword,
          email: testEmail,
        }),
      });

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, testEmail));
      const token = user.emailVerificationToken!;

      await fetch(`${BASE_URL}/api/auth/verify-email?token=${token}`);

      // Step 2: Attempt to resend verification for already verified email
      const resendResponse = await fetch(
        `${BASE_URL}/api/auth/resend-verification`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: testEmail,
          }),
        }
      );

      expect(resendResponse.status).toBe(200);
      const resendData = await resendResponse.json();
      expect(resendData.message).toContain("already verified");
    });

    test("should handle resend for non-existent email gracefully", async () => {
      // Attempt to resend verification for email that doesn't exist
      const resendResponse = await fetch(
        `${BASE_URL}/api/auth/resend-verification`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "nonexistent@example.com",
          }),
        }
      );

      // Should return success message for security (don't reveal if email exists)
      expect(resendResponse.status).toBe(200);
      const resendData = await resendResponse.json();
      expect(resendData.message).toContain("If an account");
    });
  });

  describe("Verification Token Security", () => {
    test("should not allow token reuse after successful verification", async () => {
      // Step 1: Register user
      await fetch(`${BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: testUsername,
          password: testPassword,
          email: testEmail,
        }),
      });

      // Step 2: Get verification token
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, testEmail));
      const token = user.emailVerificationToken!;

      // Step 3: Verify email successfully
      const firstVerifyResponse = await fetch(
        `${BASE_URL}/api/auth/verify-email?token=${token}`
      );
      expect(firstVerifyResponse.status).toBe(200);

      // Step 4: Attempt to use same token again
      const secondVerifyResponse = await fetch(
        `${BASE_URL}/api/auth/verify-email?token=${token}`
      );

      // Should indicate already verified
      expect(secondVerifyResponse.status).toBe(200);
      const secondVerifyData = await secondVerifyResponse.json();
      expect(secondVerifyData.code).toBe("ALREADY_VERIFIED");
    });

    test("should require verification token in query parameter", async () => {
      // Attempt to verify without token
      const verifyResponse = await fetch(`${BASE_URL}/api/auth/verify-email`);

      expect(verifyResponse.status).toBe(400);
      const verifyData = await verifyResponse.json();
      expect(verifyData.code).toBe("MISSING_TOKEN");
    });
  });

  describe("Registration Validation", () => {
    test("should reject registration with missing required fields", async () => {
      // Missing email
      const noEmailResponse = await fetch(`${BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: testUsername,
          password: testPassword,
        }),
      });

      expect(noEmailResponse.status).toBe(400);
      const noEmailData = await noEmailResponse.json();
      expect(noEmailData.error).toContain("email are required");

      // Missing password
      const noPasswordResponse = await fetch(`${BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: testUsername,
          email: testEmail,
        }),
      });

      expect(noPasswordResponse.status).toBe(400);
      const noPasswordData = await noPasswordResponse.json();
      expect(noPasswordData.error).toContain("password");

      // Missing username
      const noUsernameResponse = await fetch(`${BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password: testPassword,
          email: testEmail,
        }),
      });

      expect(noUsernameResponse.status).toBe(400);
      const noUsernameData = await noUsernameResponse.json();
      expect(noUsernameData.error).toContain("Username");
    });

    test("should reject weak passwords", async () => {
      // Too short
      const shortPasswordResponse = await fetch(
        `${BASE_URL}/api/auth/register`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: testUsername,
            password: "Short1!",
            email: testEmail,
          }),
        }
      );

      expect(shortPasswordResponse.status).toBe(400);
      const shortPasswordData = await shortPasswordResponse.json();
      expect(shortPasswordData.error).toContain("at least 8 characters");

      // Missing uppercase
      const noUpperResponse = await fetch(`${BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: testUsername,
          password: "lowercase123",
          email: testEmail,
        }),
      });

      expect(noUpperResponse.status).toBe(400);
      const noUpperData = await noUpperResponse.json();
      expect(noUpperData.error).toContain("uppercase");

      // Missing number
      const noNumberResponse = await fetch(`${BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: testUsername,
          password: "NoNumbers!",
          email: testEmail,
        }),
      });

      expect(noNumberResponse.status).toBe(400);
      const noNumberData = await noNumberResponse.json();
      expect(noNumberData.error).toContain("number");
    });

    test("should reject empty or whitespace-only fields", async () => {
      // Whitespace username
      const whitespaceUsernameResponse = await fetch(
        `${BASE_URL}/api/auth/register`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: "   ",
            password: testPassword,
            email: testEmail,
          }),
        }
      );

      expect(whitespaceUsernameResponse.status).toBe(400);
      const whitespaceUsernameData = await whitespaceUsernameResponse.json();
      expect(whitespaceUsernameData.error).toContain("empty");

      // Whitespace email
      const whitespaceEmailResponse = await fetch(
        `${BASE_URL}/api/auth/register`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: testUsername,
            password: testPassword,
            email: "   ",
          }),
        }
      );

      expect(whitespaceEmailResponse.status).toBe(400);
      const whitespaceEmailData = await whitespaceEmailResponse.json();
      expect(whitespaceEmailData.error).toContain("empty");
    });
  });
});
