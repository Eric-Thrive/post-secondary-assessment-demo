import type { Express } from "express";
import "../types";
import { db } from "../db";
import { users, organizations } from "@shared/schema";
import { eq } from "drizzle-orm";
import {
  generateRegistrationToken,
  generateResetToken,
  hashPassword,
  hashResetToken,
  isResetTokenValid,
  requireAuth,
  requireRole,
  verifyPassword,
} from "../auth";
import { UserRole, ModuleType } from "@shared/schema";
import { DEMO_CUSTOMER_ID } from "@shared/constants/environments";
import { isReadOnlyEnvironment } from "../config/database";
import {
  normalizeDemoPermissions,
  resolvePostLoginRedirect,
} from "../config/loginRedirects";
import {
  generateVerificationTokenWithExpiry,
  createVerificationLink,
} from "../services/email-verification";
import { sendVerificationEmail } from "../services/sendgrid";
import { sendRegistrationNotification as sendAdminNotification } from "../services/admin-notifications";
import { rateLimiters } from "../middleware/rate-limit";

/**
 * Register authentication-related routes.
 */
export function registerAuthRoutes(app: Express): void {
  // Debug middleware to check request body before auth routes (sensitive data sanitized)
  app.use("/api/auth", (req, _res, next) => {
    console.log("🔍 Auth middleware - Request received:", {
      method: req.method,
      url: req.url,
      hasBody: !!req.body && Object.keys(req.body).length > 0,
    });
    next();
  });

  app.post(
    "/api/auth/register",
    rateLimiters.registration,
    async (req, res) => {
      try {
        const {
          username,
          password,
          email,
          customerId,
          customerName,
          role,
          assignedModules,
        } = req.body;

        if (!username || !password || !email) {
          return res
            .status(400)
            .json({ error: "Username, password, and email are required" });
        }

        const trimmedUsername = username.trim();
        const trimmedEmail = email.trim();

        if (!trimmedUsername) {
          return res.status(400).json({
            error: "Username cannot be empty or contain only whitespace",
          });
        }

        if (!trimmedEmail) {
          return res.status(400).json({
            error: "Email cannot be empty or contain only whitespace",
          });
        }

        if (password.length < 8) {
          return res
            .status(400)
            .json({ error: "Password must be at least 8 characters long" });
        }

        if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
          return res.status(400).json({
            error:
              "Password must contain at least one uppercase letter, one lowercase letter, and one number",
          });
        }

        const [existingUser] = await db
          .select()
          .from(users)
          .where(eq(users.username, trimmedUsername));

        if (existingUser) {
          return res.status(409).json({ error: "Username already exists" });
        }

        const [existingEmail] = await db
          .select()
          .from(users)
          .where(eq(users.email, trimmedEmail));

        if (existingEmail) {
          return res.status(409).json({ error: "Email already exists" });
        }

        const hashedPassword = await hashPassword(password);
        const registrationToken = generateRegistrationToken();

        // Generate email verification token
        const verificationTokenData = generateVerificationTokenWithExpiry(24);

        let assignedRole = role || "customer";
        let assignedCustomerId: string;
        let assignedOrganizationId: string | null = null;
        const userModules = assignedModules || ["post_secondary"];

        // Create organization for non-admin users
        if (
          assignedRole !== "system_admin" &&
          assignedRole !== "developer" &&
          assignedRole !== "admin"
        ) {
          const orgId = `org-${trimmedUsername.toLowerCase()}-${Date.now()}`;
          assignedCustomerId = `customer-${trimmedUsername.toLowerCase()}-${Date.now()}`;

          // Handle demo user registration
          if (assignedRole === "demo") {
            assignedCustomerId = DEMO_CUSTOMER_ID;
          }

          const [newOrg] = await db
            .insert(organizations)
            .values({
              id: orgId,
              name: `${trimmedUsername}'s Organization`,
              customerId: assignedCustomerId,
              assignedModules: userModules,
              maxUsers: assignedRole === "demo" ? 1 : 10,
              isActive: true,
            })
            .returning();

          assignedOrganizationId = newOrg.id;
        } else {
          // Admins don't need organizations
          assignedCustomerId = customerId || "system";
        }

        const [newUser] = await db
          .insert(users)
          .values({
            username: trimmedUsername,
            password: hashedPassword,
            email: trimmedEmail,
            customerId: assignedCustomerId,
            customerName,
            role: assignedRole,
            assignedModules: userModules,
            organizationId: assignedOrganizationId,
            isActive: true,
            registrationToken,
            reportCount: 0,
            maxReports: assignedRole === "demo" ? 5 : -1, // Demo users get 5 reports, others unlimited
            emailVerified: false,
            emailVerificationToken: verificationTokenData.hashedToken,
            emailVerificationExpiry: verificationTokenData.expiry,
          })
          .returning({
            id: users.id,
            username: users.username,
            email: users.email,
            organizationId: users.organizationId,
            role: users.role,
            registrationToken: users.registrationToken,
          });

        // Send verification email to user
        const baseUrl =
          req.headers.origin || process.env.BASE_URL || "http://localhost:5000";
        const verificationLink = createVerificationLink(
          verificationTokenData.token,
          baseUrl
        );

        try {
          await sendVerificationEmail(
            trimmedEmail,
            trimmedUsername,
            verificationLink
          );
          console.log(`✅ Verification email sent to ${trimmedEmail}`);
        } catch (emailError) {
          console.error("Error sending verification email:", emailError);
          // Don't block registration if email fails
        }

        // Send admin notification asynchronously
        await sendAdminNotification({
          username: newUser.username,
          email: newUser.email || "",
          organizationName: customerName,
          registeredAt: new Date(),
        });

        res.status(201).json({
          message:
            "Registration successful. Please check your email to verify your account.",
          email: trimmedEmail,
          user: {
            id: newUser.id,
            username: newUser.username,
            email: newUser.email,
            organizationId: newUser.organizationId,
            role: newUser.role,
          },
        });
      } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ error: "Registration failed" });
      }
    }
  );

  app.get("/api/auth/verify-email", async (req, res) => {
    try {
      const { token } = req.query;

      if (!token || typeof token !== "string") {
        return res.status(400).json({
          error: "Verification token is required",
          code: "MISSING_TOKEN",
        });
      }

      // Find user with matching verification token
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.emailVerificationToken, token));

      if (!user) {
        return res.status(400).json({
          error: "Invalid verification token",
          code: "INVALID_TOKEN",
          message:
            "This verification link is invalid. Please request a new verification email.",
        });
      }

      // Check if already verified
      if (user.emailVerified) {
        return res.status(200).json({
          success: true,
          message: "Email already verified. You can log in now.",
          code: "ALREADY_VERIFIED",
          redirectUrl: "/login",
        });
      }

      // Check if token has expired
      if (
        !user.emailVerificationExpiry ||
        new Date() > user.emailVerificationExpiry
      ) {
        return res.status(400).json({
          error: "Verification token expired",
          code: "EXPIRED_TOKEN",
          message:
            "This verification link has expired. Please request a new verification email.",
          email: user.email,
        });
      }

      // Verify the token using bcrypt
      const { validateToken } = await import("../services/email-verification");
      const isValid = validateToken(
        token,
        user.emailVerificationToken!,
        user.emailVerificationExpiry
      );

      if (!isValid) {
        return res.status(400).json({
          error: "Invalid verification token",
          code: "INVALID_TOKEN",
          message:
            "This verification link is invalid. Please request a new verification email.",
        });
      }

      // Update user to verified and clear verification token
      await db
        .update(users)
        .set({
          emailVerified: true,
          emailVerificationToken: null,
          emailVerificationExpiry: null,
        })
        .where(eq(users.id, user.id));

      console.log(
        `✅ Email verified for user: ${user.username} (${user.email})`
      );

      res.json({
        success: true,
        message: "Email verified successfully! You can now log in.",
        redirectUrl: "/login",
      });
    } catch (error) {
      console.error("Email verification error:", error);
      res.status(500).json({
        error: "Email verification failed",
        code: "VERIFICATION_ERROR",
      });
    }
  });

  app.post(
    "/api/auth/resend-verification",
    rateLimiters.resendVerification,
    async (req, res) => {
      try {
        const { email } = req.body;

        if (!email) {
          return res.status(400).json({ error: "Email is required" });
        }

        const trimmedEmail = email.trim();

        // Find user by email
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, trimmedEmail));

        if (!user) {
          // Return success message even if user doesn't exist (security)
          return res.json({
            message:
              "If an account with that email exists and is unverified, a new verification email has been sent.",
          });
        }

        // Check if already verified
        if (user.emailVerified) {
          return res.json({
            message:
              "This email address is already verified. You can log in now.",
          });
        }

        // Generate new verification token
        const verificationTokenData = generateVerificationTokenWithExpiry(24);

        // Update user with new token
        await db
          .update(users)
          .set({
            emailVerificationToken: verificationTokenData.hashedToken,
            emailVerificationExpiry: verificationTokenData.expiry,
          })
          .where(eq(users.id, user.id));

        // Send new verification email
        const baseUrl =
          req.headers.origin || process.env.BASE_URL || "http://localhost:5000";
        const verificationLink = createVerificationLink(
          verificationTokenData.token,
          baseUrl
        );

        try {
          await sendVerificationEmail(
            trimmedEmail,
            user.username,
            verificationLink
          );
          console.log(`✅ Resent verification email to ${trimmedEmail}`);
        } catch (emailError) {
          console.error("Error resending verification email:", emailError);
          return res.status(500).json({
            error: "Failed to send verification email. Please try again later.",
          });
        }

        res.json({
          message:
            "A new verification email has been sent. Please check your inbox.",
        });
      } catch (error) {
        console.error("Resend verification error:", error);
        res.status(500).json({ error: "Failed to resend verification email" });
      }
    }
  );

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res
          .status(400)
          .json({ error: "Username and password are required" });
      }

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.username, username));

      if (!user || !user.password) {
        return res.status(401).json({ error: "Invalid username or password" });
      }

      if (!user.isActive) {
        return res.status(403).json({
          error: "Account is inactive. Contact support for assistance.",
        });
      }

      const isValidPassword = await verifyPassword(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: "Invalid username or password" });
      }

      // Check if email is verified
      if (!user.emailVerified) {
        return res.status(403).json({
          error: "Email not verified",
          code: "EMAIL_NOT_VERIFIED",
          message:
            "Please verify your email address before logging in. Check your inbox for the verification link.",
          email: user.email,
        });
      }

      const parsedDemoPermissions = normalizeDemoPermissions(
        user.demoPermissions
      );

      // Set userId for auth middleware
      req.session.userId = user.id;

      // Also set user object for backwards compatibility
      req.session.user = {
        id: user.id,
        username: user.username,
        email: user.email,
        emailVerified: user.emailVerified,
        role: user.role as UserRole,
        assignedModules: (user.assignedModules as ModuleType[]) || [],
        organizationId: user.organizationId || undefined,
        customerId: user.customerId,
        customerName: user.customerName || undefined,
        demoPermissions: parsedDemoPermissions,
      };

      if (!isReadOnlyEnvironment()) {
        await db
          .update(users)
          .set({ lastLogin: new Date() })
          .where(eq(users.id, user.id));
      } else {
        console.log("ℹ️ Skipping lastLogin update in read-only environment");
      }

      const redirectInfo = resolvePostLoginRedirect({
        role: user.role,
        demoPermissions: parsedDemoPermissions,
      });

      res.json({
        message: "Login successful",
        user: req.session.user,
        redirectUrl: redirectInfo.url,
        redirectSource: redirectInfo.source,
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ error: "Logout failed" });
      }
      res.json({ message: "Logout successful" });
    });
  });

  app.get("/api/auth/me", requireAuth, (req, res) => {
    console.log("📧 /api/auth/me - User object:", {
      email: req.user?.email,
      emailVerified: req.user?.emailVerified,
      emailVerifiedType: typeof req.user?.emailVerified,
    });
    console.log("📧 Full req.user:", JSON.stringify(req.user, null, 2));

    // Explicitly construct the user object to ensure all fields are included
    const userResponse = {
      id: req.user?.id,
      username: req.user?.username,
      email: req.user?.email,
      emailVerified: req.user?.emailVerified,
      role: req.user?.role,
      assignedModules: req.user?.assignedModules,
      organizationId: req.user?.organizationId,
      organizationName: req.user?.organizationName,
      customerId: req.user?.customerId,
      customerName: req.user?.customerName,
      reportCount: req.user?.reportCount,
      maxReports: req.user?.maxReports,
      isActive: req.user?.isActive,
      lastLogin: req.user?.lastLogin,
      demoPermissions: req.user?.demoPermissions,
    };

    console.log(
      "📧 Response being sent:",
      JSON.stringify(userResponse, null, 2)
    );

    res.setHeader(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, private"
    );
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    res.json({
      user: userResponse,
      session: {
        id: req.sessionID,
        cookie: req.session.cookie,
      },
    });
  });

  app.post("/api/auth/reset-password-request", async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email.trim()));

      if (!user || !user.isActive) {
        return res.json({
          message:
            "If an account with that email exists, a reset link has been sent.",
        });
      }

      const token = generateResetToken();
      const hashedToken = hashResetToken(token);
      const expiry = new Date(Date.now() + 1000 * 60 * 60);

      await db
        .update(users)
        .set({
          resetToken: hashedToken,
          resetTokenExpiry: expiry,
        })
        .where(eq(users.id, user.id));

      try {
        const { sendEmail, generatePasswordResetEmail } = await import(
          "../services/sendgrid"
        );
        const origin =
          typeof req.headers.origin === "string" ? req.headers.origin : "";
        const emailParams = generatePasswordResetEmail(email, token, origin);
        const emailSent = await sendEmail(emailParams);
        if (!emailSent) {
          console.error("Failed to send password reset email - delivery error");
        }
      } catch (emailError) {
        console.error("Error sending password reset email:", emailError);
      }

      res.json({
        message:
          "If an account with that email exists, a reset link has been sent.",
      });
    } catch (error) {
      console.error("Password reset request error:", error);
      res.status(500).json({ error: "Password reset request failed" });
    }
  });

  app.post("/api/auth/forgot-username", async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      const usersWithEmail = await db
        .select({
          id: users.id,
          username: users.username,
          email: users.email,
          isActive: users.isActive,
        })
        .from(users)
        .where(eq(users.email, email.trim()));

      const activeUsers = usersWithEmail.filter((user) => user.isActive);
      if (activeUsers.length === 0) {
        return res.json({
          message:
            "If an account with that email exists, your username information has been sent.",
        });
      }

      try {
        const { sendEmail, generateForgotUsernameEmail } = await import(
          "../services/sendgrid"
        );
        const usernames = activeUsers.map((user) => user.username);
        const emailParams = generateForgotUsernameEmail(email, usernames);
        const emailSent = await sendEmail(emailParams);
        if (!emailSent) {
          console.error(
            "Failed to send forgot username email - delivery error"
          );
        } else {
          console.log("Forgot username email sent successfully");
        }
      } catch (emailError) {
        console.error("Error sending forgot username email:", emailError);
      }

      res.json({
        message:
          "If an account with that email exists, your username information has been sent.",
      });
    } catch (error) {
      console.error("Forgot username request error:", error);
      res.status(500).json({ error: "Forgot username request failed" });
    }
  });

  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return res
          .status(400)
          .json({ error: "Token and new password are required" });
      }

      const hashedToken = hashResetToken(token);

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.resetToken, hashedToken));

      if (!user || !user.isActive) {
        return res
          .status(400)
          .json({ error: "Invalid or expired reset token" });
      }

      if (
        !user.resetToken ||
        !user.resetTokenExpiry ||
        !isResetTokenValid(token, user.resetToken, user.resetTokenExpiry)
      ) {
        await db
          .update(users)
          .set({
            resetToken: null,
            resetTokenExpiry: null,
          })
          .where(eq(users.id, user.id));

        return res.status(400).json({ error: "Reset token has expired" });
      }

      const hashedPassword = await hashPassword(newPassword);

      await db
        .update(users)
        .set({
          password: hashedPassword,
          resetToken: null,
          resetTokenExpiry: null,
        })
        .where(eq(users.id, user.id));

      res.json({ message: "Password has been reset successfully" });
    } catch (error) {
      console.error("Password reset error:", error);
      res.status(500).json({ error: "Password reset failed" });
    }
  });
}

/**
 * Register administrative user management routes.
 */
export function registerAdminRoutes(app: Express): void {
  app.get(
    "/api/admin/users",
    requireAuth,
    requireRole([UserRole.SYSTEM_ADMIN, UserRole.DEVELOPER]),
    async (_req, res) => {
      try {
        const allUsers = await db
          .select({
            id: users.id,
            username: users.username,
            email: users.email,
            customerId: users.customerId,
            customerName: users.customerName,
            role: users.role,
            isActive: users.isActive,
            reportCount: users.reportCount,
            maxReports: users.maxReports,
            demoPermissions: users.demoPermissions,
            createdAt: users.createdAt,
            lastLogin: users.lastLogin,
          })
          .from(users)
          .orderBy(users.createdAt);

        const userStats = allUsers.map((user) => ({
          ...user,
          reportsRemaining: user.maxReports - user.reportCount,
          isLimitReached: user.reportCount >= user.maxReports,
        }));

        res.json({
          users: userStats,
          totalUsers: userStats.length,
          activeUsers: userStats.filter((u) => u.isActive).length,
          usersAtLimit: userStats.filter((u) => u.isLimitReached).length,
        });
      } catch (error) {
        console.error("Error fetching admin user data:", error);
        res.status(500).json({ error: "Failed to fetch user data" });
      }
    }
  );

  app.patch(
    "/api/admin/users/:userId",
    requireAuth,
    requireRole([UserRole.SYSTEM_ADMIN, UserRole.DEVELOPER]),
    async (req, res) => {
      try {
        const { userId } = req.params;
        const {
          maxReports,
          reportCount,
          isActive,
          role,
          demoPermissions,
          customerId,
        } = req.body;

        const updateData: any = {};
        if (typeof maxReports === "number") updateData.maxReports = maxReports;
        if (typeof reportCount === "number")
          updateData.reportCount = reportCount;
        if (typeof isActive === "boolean") updateData.isActive = isActive;
        if (typeof role === "string") updateData.role = role;
        if (demoPermissions !== undefined)
          updateData.demoPermissions = demoPermissions;
        if (typeof customerId === "string") updateData.customerId = customerId;

        await db
          .update(users)
          .set(updateData)
          .where(eq(users.id, parseInt(userId, 10)));

        res.json({ message: "User updated successfully" });
      } catch (error) {
        console.error("Error updating user:", error);
        res.status(500).json({ error: "Failed to update user" });
      }
    }
  );

  app.post("/api/admin/bootstrap", async (req, res) => {
    try {
      const { adminEmail, adminPassword } = req.body;

      if (adminEmail !== "eric@thriveiep.com") {
        return res.status(403).json({
          error: "This endpoint is only for creating the initial admin user",
        });
      }

      const [existingAdmin] = await db
        .select()
        .from(users)
        .where(eq(users.email, adminEmail));

      if (existingAdmin) {
        return res.status(409).json({ error: "Admin user already exists" });
      }

      const hashedPassword = await hashPassword(adminPassword);
      const registrationToken = generateRegistrationToken();

      const [adminUser] = await db
        .insert(users)
        .values({
          username: "eric",
          password: hashedPassword,
          email: adminEmail,
          customerId: "system",
          customerName: "System Administrator",
          role: "system_admin",
          isActive: true,
          registrationToken,
          reportCount: 0,
          maxReports: 999,
        })
        .returning({
          id: users.id,
          username: users.username,
          email: users.email,
          role: users.role,
        });

      console.log(
        `🔧 ADMIN USER CREATED:
        Username: ${adminUser.username}
        Email: ${adminUser.email}
        Role: ${adminUser.role}
        ID: ${adminUser.id}
        Registration Token: ${registrationToken}
      `
      );

      res.status(201).json({
        message: "Admin user created successfully",
        user: adminUser,
      });
    } catch (error) {
      console.error("Error creating admin user:", error);
      res.status(500).json({ error: "Failed to create admin user" });
    }
  });
}
