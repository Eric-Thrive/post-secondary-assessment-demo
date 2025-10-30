import session from "express-session";
import connectPg from "connect-pg-simple";
import * as bcrypt from "bcryptjs";
import crypto from "crypto";
import { Request, Response, NextFunction } from "express";
import { db } from "./db";
import { users, organizations } from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";
import { UserRole, ModuleType } from "@shared/schema";
import { OptimizedQueries } from "./services/optimized-queries";
import { trackDbQuery } from "./middleware/performance-monitoring";
import { ModuleAssignmentService } from "./services/module-assignment-service";

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface User {
      id: number;
      username: string;
      role: UserRole;
      assignedModules: ModuleType[];
      organizationId?: string;
      organizationName?: string;
      customerId: string; // Legacy field for backward compatibility
      customerName?: string;
      reportCount: number;
      maxReports: number;
      isActive: boolean;
      lastLogin: Date | null;
      demoPermissions?: Record<string, boolean>; // Legacy field
    }

    interface Request {
      user?: User;
      organizationFilter?: string;
      customerFilter?: string; // Legacy support
    }
  }
}

// Initialize PostgreSQL session store
const PgSession = connectPg(session);

const sessionStore = new PgSession({
  conString: process.env.DATABASE_URL,
  tableName: "sessions",
  createTableIfMissing: false, // We already created the table
  pruneSessionInterval: 60, // Clean up old sessions every 60 seconds
  ttl: 7 * 24 * 60 * 60, // 7 days in seconds
});

const sanitizeDomain = (value: string | undefined): string | undefined => {
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const normalizeSameSite = (
  value: string | undefined
): session.CookieOptions["sameSite"] => {
  if (!value) return "lax";
  const normalized = value.trim().toLowerCase();
  if (
    normalized === "strict" ||
    normalized === "lax" ||
    normalized === "none"
  ) {
    return normalized;
  }
  return "lax";
};

const sessionCookieDomain = sanitizeDomain(process.env.SESSION_COOKIE_DOMAIN);
const sessionCookieSameSite = normalizeSameSite(
  process.env.SESSION_COOKIE_SAMESITE
);

const cookieConfig: session.CookieOptions = {
  secure: process.env.NODE_ENV === "production", // Enable in production with HTTPS
  httpOnly: true,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  sameSite: sessionCookieSameSite, // CSRF protection
};

if (sessionCookieDomain) {
  cookieConfig.domain = sessionCookieDomain;
}

export const sessionConfig = session({
  store: sessionStore,
  secret: process.env.SESSION_SECRET || "default-secret-change-in-production",
  resave: false,
  saveUninitialized: false,
  rolling: true, // Reset session expiration on activity
  cookie: cookieConfig,
});

// Password hashing utilities
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

export const verifyPassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  return await bcrypt.compare(password, hashedPassword);
};

// Registration token generation
export const generateRegistrationToken = (): string => {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
};

// Email notification utility
export const sendRegistrationNotification = async (userDetails: {
  username: string;
  email: string;
  organizationId?: string;
  role: string;
  registrationToken: string;
}): Promise<void> => {
  const notification = {
    to: "eric@thriveiep.com",
    subject: `New User Registration - ${userDetails.username}`,
    timestamp: new Date().toISOString(),
    userDetails,
    message: `
🔔 NEW USER REGISTRATION ALERT

A new user has registered for the assessment system:

👤 User Details:
   - Username: ${userDetails.username}
   - Email: ${userDetails.email}
   - Organization: ${userDetails.organizationId || "None"}
   - Role: ${userDetails.role}
   - System: RBAC-based access control

🎟️ Registration Token: ${userDetails.registrationToken}

⏰ Registered at: ${new Date().toLocaleString()}

This notification should be sent to eric@thriveiep.com
    `,
  };

  // TODO: Integrate with actual email service (SendGrid, etc.)
  console.log("📧 EMAIL NOTIFICATION QUEUED FOR eric@thriveiep.com:");
  console.log(notification.message);
};

// Authentication middleware
export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Authentication required" });
  }

  try {
    // Get user details from database with organization data using optimized query
    const performanceId = (req as any).performanceId;
    if (performanceId) {
      trackDbQuery(performanceId);
    }

    const userResults = await OptimizedQueries.getUserWithOrganization(
      req.session.userId
    );
    const user = userResults[0];

    if (!user || !user.isActive) {
      delete req.session.userId;
      return res.status(401).json({ error: "User not found or inactive" });
    }

    // Validate role enum value
    const validRoles = Object.values(UserRole);
    const userRole = user.role as UserRole;
    if (!validRoles.includes(userRole)) {
      console.error(`Invalid user role: ${user.role} for user ${user.id}`);
      return res.status(500).json({ error: "Invalid user role configuration" });
    }

    // Create temporary user object for module assignment service
    const tempUser = {
      id: user.id,
      username: user.username,
      role: userRole,
      assignedModules: (user.assignedModules as ModuleType[]) || [
        ModuleType.POST_SECONDARY,
      ],
      organizationId: user.organizationId || undefined,
      organizationName: user.orgName || undefined,
      reportCount: user.reportCount,
      maxReports: user.maxReports,
      isActive: user.isActive,
    };

    // Get proper module assignments using the service (handles system admin privileges)
    const assignedModules = await ModuleAssignmentService.getAssignedModules(
      tempUser as Express.User
    );

    // Set user in request
    req.user = {
      ...tempUser,
      assignedModules,
      lastLogin: user.lastLogin,
      customerId: user.customerId || "unknown", // Add missing customerId field
    };

    // Add organization-based data filtering for multi-tenant isolation
    if (user.organizationId) {
      req.organizationFilter = user.organizationId;
      console.log(
        `🔒 Organization filter set: ${req.organizationFilter} for user ${user.username}`
      );
    }

    console.log(
      `✅ User authenticated: ${
        req.user?.username
      } (${userRole}) with modules: ${JSON.stringify(
        req.user?.assignedModules
      )}`
    );

    next();
  } catch (error: any) {
    console.error("Authentication error:", error);
    res.status(500).json({ error: "Authentication failed" });
  }
};

// Role-based authorization middleware
export const requireRole = (allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: "Insufficient permissions",
        required: allowedRoles,
        current: req.user.role,
      });
    }

    next();
  };
};

// Organization-based access control - replaces legacy customer access
export const requireCustomerAccess = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.log(`🔐 Organization access control middleware`);

  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }

  // System admins and developers can access any organization's data
  if (
    req.user.role === UserRole.SYSTEM_ADMIN ||
    req.user.role === UserRole.DEVELOPER
  ) {
    console.log(
      `✅ System admin/developer access granted for user: ${req.user.username}`
    );
    return next();
  }

  // Set organization filter for data isolation
  if (req.user.organizationId) {
    req.organizationFilter = req.user.organizationId;
    console.log(`🔒 Organization filter set: ${req.organizationFilter}`);
  }

  next();
};

// Organization membership validation for shared resources
export const requireOrganizationMembership = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.log(`🔐 Organization membership validation`);

  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }

  // System admins and developers can access any organization's resources
  if (
    req.user.role === UserRole.SYSTEM_ADMIN ||
    req.user.role === UserRole.DEVELOPER
  ) {
    console.log(`✅ System admin/developer access granted`);
    return next();
  }

  // Validate organization membership
  if (!req.user.organizationId) {
    return res.status(403).json({
      error: "Organization membership required",
    });
  }

  req.organizationFilter = req.user.organizationId;
  next();
};

// Organization access validation
export const requireOrganizationAccess = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.log(`🔐 Organization access validation`);

  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }

  // System admins and developers can access any organization
  if (
    req.user.role === UserRole.SYSTEM_ADMIN ||
    req.user.role === UserRole.DEVELOPER
  ) {
    return next();
  }

  // Set organization filter
  if (req.user.organizationId) {
    req.organizationFilter = req.user.organizationId;
  }

  next();
};

// Password reset utilities
export const generateResetToken = (): string => {
  return crypto.randomBytes(32).toString("hex");
};

export const hashResetToken = (token: string): string => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

export const isResetTokenValid = (
  token: string,
  hashedToken: string,
  expiresAt: Date
): boolean => {
  const hashedInputToken = hashResetToken(token);
  return hashedInputToken === hashedToken && new Date() < expiresAt;
};

// Report count utilities - simplified for RBAC system
export const checkReportLimit = async (
  userId: number
): Promise<{
  canCreateReport: boolean;
  currentCount: number;
  maxReports: number;
  isDemo: boolean;
}> => {
  const userResults = await OptimizedQueries.getUserWithOrganization(userId);
  const user = userResults[0];

  if (!user) {
    throw new Error("User not found");
  }

  const isDemo = user.role === UserRole.DEMO;
  const maxReports = isDemo ? 5 : -1; // Demo users get 5 reports, others unlimited
  const canCreateReport = !isDemo || user.reportCount < maxReports;

  return {
    canCreateReport,
    currentCount: user.reportCount,
    maxReports,
    isDemo,
  };
};

export const incrementReportCount = async (userId: number): Promise<void> => {
  await db
    .update(users)
    .set({
      reportCount: sql`report_count + 1`,
    })
    .where(eq(users.id, userId));
};
