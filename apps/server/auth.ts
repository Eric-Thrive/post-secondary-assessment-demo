import session from "express-session";
import connectPg from "connect-pg-simple";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { Request, Response, NextFunction } from "express";
import { db } from "./db";
import { users } from "@shared/schema";
import { eq, sql } from "drizzle-orm";

// Import RBAC types
import { UserRole, ModuleType } from "@shared/schema";
import { OptimizedQueries } from "./services/optimized-queries";
import { trackDbQuery } from "./middleware/performance-monitoring";

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface User {
      id: number;
      username: string;
      role: UserRole;
      assignedModules: ModuleType[];
      organizationId?: string;
      customerId: string; // Legacy field for backward compatibility
      customerName?: string;
      reportCount: number;
      maxReports: number;
      isActive: boolean;
      demoPermissions?: Record<string, boolean>; // Legacy field
    }

    interface Request {
      user?: User;
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

// Password utilities
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

export const verifyPassword = async (
  password: string,
  hash: string
): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};

// Password reset utilities
export const generateResetToken = (): string => {
  return crypto.randomBytes(32).toString("hex");
};

export const hashResetToken = (token: string): string => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

export const generateRegistrationToken = (): string => {
  return crypto.randomBytes(16).toString("hex");
};

export const isResetTokenValid = (expiry: Date | null): boolean => {
  if (!expiry) return false;
  return new Date() < expiry;
};

// Report count utilities - enhanced for demo sandbox system
export const checkReportLimit = async (
  userId: number
): Promise<{
  canCreate: boolean;
  currentCount: number;
  maxReports: number;
  isNearLimit?: boolean;
  shouldShowUpgradePrompt?: boolean;
}> => {
  // Import demo sandbox service
  const { DemoSandboxService } = await import("./services/demo-sandbox");

  // Get current user role to determine if they're a demo user
  const [user] = await db
    .select({
      role: users.role,
      reportCount: users.reportCount,
      maxReports: users.maxReports,
    })
    .from(users)
    .where(eq(users.id, userId));

  if (!user) {
    throw new Error("User not found");
  }

  // Use demo sandbox service for demo users
  if (user.role === UserRole.DEMO) {
    const demoCheck = await DemoSandboxService.checkDemoReportLimit(userId);
    return {
      canCreate: demoCheck.canCreate,
      currentCount: demoCheck.currentCount,
      maxReports: demoCheck.maxReports,
      isNearLimit: demoCheck.isNearLimit,
      shouldShowUpgradePrompt: demoCheck.shouldShowUpgradePrompt,
    };
  }

  // For non-demo users, use existing logic
  const canCreate =
    user.maxReports === -1 || user.reportCount < user.maxReports;

  return {
    canCreate,
    currentCount: user.reportCount,
    maxReports: user.maxReports,
  };
};

export const incrementReportCount = async (userId: number): Promise<void> => {
  // Import demo sandbox service
  const { DemoSandboxService } = await import("./services/demo-sandbox");

  // Get user role to determine if they're a demo user
  const [user] = await db
    .select({
      role: users.role,
    })
    .from(users)
    .where(eq(users.id, userId));

  if (!user) {
    throw new Error("User not found");
  }

  // Use demo sandbox service for demo users (includes validation)
  if (user.role === UserRole.DEMO) {
    await DemoSandboxService.incrementDemoReportCount(userId);
    return;
  }

  // For non-demo users, use existing logic
  await db
    .update(users)
    .set({ reportCount: sql`report_count + 1` })
    .where(eq(users.id, userId));
};

// Email notification utility
export const sendRegistrationNotification = async (userDetails: {
  username: string;
  email: string;
  customerId: string;
  role: string;
  registrationToken: string;
  environment: string;
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
   - Customer ID: ${userDetails.customerId}
   - Role: ${userDetails.role}
   - Environment: ${userDetails.environment}

🎟️ Registration Token: ${userDetails.registrationToken}

⏰ Registered at: ${new Date().toLocaleString()}

This notification should be sent to eric@thriveiep.com
    `,
  };

  // TODO: Integrate with actual email service (SendGrid, etc.)
  console.log("📧 EMAIL NOTIFICATION QUEUED FOR eric@thriveiep.com:");
  console.log(notification.message);

  // In a production system, this would call an email service
  // await emailService.send(notification);
};

// Authentication middleware - updated to fully support RBAC system
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

    // Transform and populate req.user with role and assignedModules
    req.user = {
      id: user.id,
      username: user.username,
      role: userRole,
      assignedModules: (user.assignedModules as ModuleType[]) || [
        ModuleType.POST_SECONDARY,
      ],
      organizationId: user.organizationId || undefined,
      customerId: user.customerId,
      customerName: user.customerName || undefined,
      reportCount: user.reportCount,
      maxReports: user.maxReports,
      isActive: user.isActive,
      demoPermissions: (user.demoPermissions as Record<string, boolean>) || {},
    };

    // Update session data to include organizationId and role information
    req.session.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: userRole,
      assignedModules: (user.assignedModules as ModuleType[]) || [
        ModuleType.POST_SECONDARY,
      ],
      organizationId: user.organizationId,
      customerId: user.customerId,
      customerName: user.customerName,
      demoPermissions: (user.demoPermissions as Record<string, boolean>) || {},
    };

    // Add organization-based data filtering for multi-tenant isolation
    if (user.organizationId) {
      req.organizationFilter = user.organizationId;
      console.log(
        `🔒 Organization filter set: ${req.organizationFilter} for user ${user.username}`
      );
    } else {
      // Fallback to legacy customerId for backward compatibility during migration
      req.customerFilter = user.customerId;
      console.log(
        `🔒 Legacy customer filter set: ${req.customerFilter} for user ${user.username}`
      );
    }

    console.log(
      `✅ User authenticated: ${
        user.username
      } (${userRole}) with modules: ${JSON.stringify(req.user.assignedModules)}`
    );
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(500).json({ error: "Authentication error" });
  }
};

// Role-based access control using UserRole enum - updated for RBAC system
export const requireRole = (allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      console.log(`🚨 requireRole: No user in request`);
      return res.status(401).json({ error: "Authentication required" });
    }

    // Validate that user role is a valid UserRole enum value
    const validRoles = Object.values(UserRole);
    if (!validRoles.includes(req.user.role)) {
      console.error(
        `🚨 requireRole: Invalid user role: ${req.user.role} for user ${req.user.username}`
      );
      return res.status(500).json({ error: "Invalid user role configuration" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      console.log(
        `🚨 requireRole: User ${req.user.username} (${
          req.user.role
        }) denied access. Required roles: ${allowedRoles.join(", ")}`
      );
      return res.status(403).json({
        error: "Insufficient permissions",
        message: `Access denied. Required roles: ${allowedRoles.join(", ")}`,
        requiredRoles: allowedRoles,
        currentRole: req.user.role,
      });
    }

    console.log(
      `✅ requireRole: User ${req.user.username} (${req.user.role}) granted access`
    );
    next();
  };
};

// Organization isolation middleware - ensures users only see their organization's data
export const requireOrganizationAccess = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.log(`🔐 requireOrganizationAccess middleware called`);
  console.log(`👤 req.user exists:`, !!req.user);

  if (!req.user) {
    console.log(`🚨 No user in request - returning 401`);
    return res.status(401).json({ error: "Authentication required" });
  }

  console.log(`👤 User details:`, {
    id: req.user.id,
    username: req.user.username,
    organizationId: req.user.organizationId,
    customerId: req.user.customerId, // Legacy field
    role: req.user.role,
  });

  // System admins and developers can access any organization's data
  if (
    req.user.role === UserRole.SYSTEM_ADMIN ||
    req.user.role === UserRole.DEVELOPER
  ) {
    console.log(`🔓 User is ${req.user.role} - bypassing organization filter`);
    return next();
  }

  // Add organization filter to request for use in queries
  if (req.user.organizationId) {
    req.organizationFilter = req.user.organizationId;
    console.log(
      `🔒 Setting req.organizationFilter to: "${req.organizationFilter}"`
    );
  } else {
    // Fallback to legacy customerId for backward compatibility during migration
    req.customerFilter = req.user.customerId;
    console.log(
      `🔒 Fallback: Setting req.customerFilter to: "${req.customerFilter}"`
    );
  }

  next();
};

// Updated customer access middleware - now uses organizationId with legacy fallback
export const requireCustomerAccess = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.log(`🔐 requireCustomerAccess middleware called (updated for RBAC)`);
  console.log(`👤 req.user exists:`, !!req.user);

  if (!req.user) {
    console.log(`🚨 No user in request - returning 401`);
    return res.status(401).json({ error: "Authentication required" });
  }

  console.log(`👤 User details:`, {
    id: req.user.id,
    username: req.user.username,
    organizationId: req.user.organizationId,
    customerId: req.user.customerId, // Legacy field
    role: req.user.role,
  });

  // System admins and developers can access any organization's data
  if (
    req.user.role === UserRole.SYSTEM_ADMIN ||
    req.user.role === UserRole.DEVELOPER
  ) {
    console.log(
      `🔓 User is ${req.user.role} - bypassing organization/customer filter`
    );
    return next();
  }

  // Implement organization-based data isolation for reports and user management
  if (req.user.organizationId) {
    // Use organizationId for new multi-tenant system
    req.organizationFilter = req.user.organizationId;
    console.log(
      `🔒 Setting req.organizationFilter to: "${req.organizationFilter}"`
    );
  } else {
    // Fallback to legacy customerId for backward compatibility during migration
    req.customerFilter = req.user.customerId;
    console.log(
      `🔒 Fallback: Setting req.customerFilter to: "${req.customerFilter}"`
    );
  }

  next();
};

// Organization membership validation for shared resources - enhanced for RBAC
export const requireOrganizationMembership = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.log(`🔐 requireOrganizationMembership middleware called`);

  if (!req.user) {
    console.log(`🚨 No user in request - returning 401`);
    return res.status(401).json({ error: "Authentication required" });
  }

  // System admins and developers can access any organization's resources
  if (
    req.user.role === UserRole.SYSTEM_ADMIN ||
    req.user.role === UserRole.DEVELOPER
  ) {
    console.log(
      `🔓 User is ${req.user.role} - bypassing organization membership check`
    );
    return next();
  }

  // Validate organization membership for shared resources
  if (!req.user.organizationId) {
    console.log(`🚨 User ${req.user.username} has no organization membership`);

    // For backward compatibility during migration, allow users with customerId
    if (req.user.customerId && req.user.customerId !== "system") {
      console.log(
        `🔄 Allowing access via legacy customerId: ${req.user.customerId}`
      );
      req.customerFilter = req.user.customerId;
      return next();
    }

    return res.status(403).json({
      error: "Organization membership required",
      message: "You must belong to an organization to access shared resources",
      code: "NO_ORGANIZATION_MEMBERSHIP",
    });
  }

  // Set organization filter for data isolation
  req.organizationFilter = req.user.organizationId;
  console.log(
    `✅ User ${req.user.username} has organization membership: ${req.user.organizationId}`
  );
  next();
};

// Demo permission validation middleware - REMOVED
// This functionality is now handled by role-based access control using UserRole.DEMO
// Demo users are identified by their role and have built-in limitations (5 reports max)
// No need for environment-specific demo permissions

// Extend Request type for customer filter and organization-based filtering
declare global {
  namespace Express {
    interface Request {
      customerFilter?: string; // Legacy field for backward compatibility
      organizationFilter?: string; // New organization-based filtering
      // Removed demo-related fields as they're replaced by role-based system
    }
  }
}

// Extend session data type
declare module "express-session" {
  interface SessionData {
    userId: number;
    user?: {
      id: number;
      username: string;
      email?: string | null;
      role: UserRole;
      assignedModules: ModuleType[];
      organizationId?: string | null;
      customerId?: string | null; // Legacy field for backward compatibility
      customerName?: string | null;
      demoPermissions?: Record<string, boolean>; // Legacy field
    };
  }
}
