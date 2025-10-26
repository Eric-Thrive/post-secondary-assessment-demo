import type { Express } from "express";
import "../types";
import { db } from "../db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import {
  generateRegistrationToken,
  generateResetToken,
  hashPassword,
  hashResetToken,
  isResetTokenValid,
  requireAuth,
  requireRole,
  sendRegistrationNotification,
  verifyPassword,
} from "../auth";
import { DEMO_CUSTOMER_ID } from "@shared/constants/environments";
import { isReadOnlyEnvironment } from "../config/database";
import {
  normalizeDemoPermissions,
  resolvePostLoginRedirect,
} from "../config/loginRedirects";

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

  app.post("/api/auth/register", async (req, res) => {
    try {
      const { username, password, email, customerId, customerName, role } = req.body;

      if (!username || !password || !email) {
        return res
          .status(400)
          .json({ error: "Username, password, and email are required" });
      }

      const trimmedUsername = username.trim();
      const trimmedEmail = email.trim();

      if (!trimmedUsername) {
        return res
          .status(400)
          .json({ error: "Username cannot be empty or contain only whitespace" });
      }

      if (!trimmedEmail) {
        return res
          .status(400)
          .json({ error: "Email cannot be empty or contain only whitespace" });
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

      let assignedCustomerId = customerId || "system";
      let assignedRole = role || "tutor";
      const environment = req.headers["x-environment"] || process.env.APP_ENVIRONMENT;

      let demoPermissions = {};
      if (environment && typeof environment === "string" && environment.includes("demo")) {
        assignedCustomerId = DEMO_CUSTOMER_ID;
        assignedRole = "tutor";

        if (environment.includes("post-secondary-demo")) {
          demoPermissions = { "post-secondary-demo": true };
        } else if (environment.includes("k12-demo")) {
          demoPermissions = { "k12-demo": true };
        } else if (environment.includes("tutoring-demo")) {
          demoPermissions = { "tutoring-demo": true };
        } else {
          demoPermissions = { "post-secondary-demo": true };
        }
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
          isActive: true,
          registrationToken,
          reportCount: 0,
          maxReports: 5,
          demoPermissions,
        })
        .returning({
          id: users.id,
          username: users.username,
          email: users.email,
          customerId: users.customerId,
          customerName: users.customerName,
          role: users.role,
          registrationToken: users.registrationToken,
        });

      await sendRegistrationNotification({
        username: newUser.username,
        email: newUser.email || "",
        customerId: newUser.customerId,
        role: newUser.role,
        registrationToken: newUser.registrationToken || "",
        environment: typeof environment === "string" ? environment : "unknown",
      });

      res.status(201).json({
        message: "User created successfully",
        user: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          customerId: newUser.customerId,
          customerName: newUser.customerName,
          role: newUser.role,
        },
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
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

      const parsedDemoPermissions = normalizeDemoPermissions(user.demoPermissions);

      // Set userId for auth middleware
      req.session.userId = user.id;

      // Also set user object for backwards compatibility
      req.session.user = {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        customerId: user.customerId,
        customerName: user.customerName,
        demoPermissions: parsedDemoPermissions,
      };

      if (!isReadOnlyEnvironment()) {
        await db
          .update(users)
          .set({ lastLogin: new Date() })
          .where(eq(users.id, user.id));
      } else {
        console.log('ℹ️ Skipping lastLogin update in read-only environment');
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
    res.json({
      user: req.user,
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
          console.error("Failed to send forgot username email - delivery error");
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
        return res.status(400).json({ error: "Token and new password are required" });
      }

      const hashedToken = hashResetToken(token);

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.resetToken, hashedToken));

      if (!user || !user.isActive) {
        return res.status(400).json({ error: "Invalid or expired reset token" });
      }

      if (!isResetTokenValid(user.resetTokenExpiry)) {
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
    requireRole(["system_admin"]),
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
    requireRole(["system_admin"]),
    async (req, res) => {
      try {
        const { userId } = req.params;
        const { maxReports, reportCount, isActive, role, demoPermissions } = req.body;

        const updateData: any = {};
        if (typeof maxReports === "number") updateData.maxReports = maxReports;
        if (typeof reportCount === "number") updateData.reportCount = reportCount;
        if (typeof isActive === "boolean") updateData.isActive = isActive;
        if (typeof role === "string") updateData.role = role;
        if (demoPermissions !== undefined) updateData.demoPermissions = demoPermissions;

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
