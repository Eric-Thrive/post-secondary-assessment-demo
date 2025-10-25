import session from 'express-session';
import connectPg from 'connect-pg-simple';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { db } from './db';
import { users } from '@shared/schema';
import { eq, sql } from 'drizzle-orm';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        username: string;
        customerId: string;
        customerName: string | null;
        role: string;
        demoPermissions?: any;
      };
    }
  }
}

// Initialize PostgreSQL session store
const PgSession = connectPg(session);

const sessionStore = new PgSession({
  conString: process.env.DATABASE_URL,
  tableName: 'sessions',
  createTableIfMissing: false, // We already created the table
  pruneSessionInterval: 60, // Clean up old sessions every 60 seconds
  ttl: 7 * 24 * 60 * 60, // 7 days in seconds
});

export const sessionConfig = session({
  store: sessionStore,
  secret: process.env.SESSION_SECRET || 'default-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  rolling: true, // Reset session expiration on activity
  cookie: {
    secure: process.env.NODE_ENV === 'production', // Enable in production with HTTPS
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    sameSite: 'lax', // CSRF protection
  },
});

// Password utilities
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};

// Password reset utilities
export const generateResetToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

export const hashResetToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

export const generateRegistrationToken = (): string => {
  return crypto.randomBytes(16).toString('hex');
};

export const isResetTokenValid = (expiry: Date | null): boolean => {
  if (!expiry) return false;
  return new Date() < expiry;
};

// Report count utilities
export const checkReportLimit = async (userId: number): Promise<{ canCreate: boolean; currentCount: number; maxReports: number }> => {
  // Get current user report count
  const [user] = await db
    .select({
      reportCount: users.reportCount,
      maxReports: users.maxReports,
    })
    .from(users)
    .where(eq(users.id, userId));

  if (!user) {
    throw new Error('User not found');
  }

  const canCreate = user.reportCount < user.maxReports;
  
  return {
    canCreate,
    currentCount: user.reportCount,
    maxReports: user.maxReports
  };
};

export const incrementReportCount = async (userId: number): Promise<void> => {
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
    to: 'eric@thriveiep.com',
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
    `
  };

  // TODO: Integrate with actual email service (SendGrid, etc.)
  console.log('📧 EMAIL NOTIFICATION QUEUED FOR eric@thriveiep.com:');
  console.log(notification.message);
  
  // In a production system, this would call an email service
  // await emailService.send(notification);
};

// Authentication middleware
export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    // Get user details from database
    const [user] = await db
      .select({
        id: users.id,
        username: users.username,
        customerId: users.customerId,
        customerName: users.customerName,
        role: users.role,
        isActive: users.isActive,
        demoPermissions: users.demoPermissions,
      })
      .from(users)
      .where(eq(users.id, req.session.userId));

    if (!user || !user.isActive) {
      delete req.session.userId;
      return res.status(401).json({ error: 'User not found or inactive' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Authentication error' });
  }
};

// Role-based access control
export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

// Customer isolation middleware - ensures users only see their own data
export const requireCustomerAccess = (req: Request, res: Response, next: NextFunction) => {
  console.log(`🔐 requireCustomerAccess middleware called`);
  console.log(`👤 req.user exists:`, !!req.user);
  
  if (!req.user) {
    console.log(`🚨 No user in request - returning 401`);
    return res.status(401).json({ error: 'Authentication required' });
  }

  console.log(`👤 User details:`, {
    id: req.user.id,
    username: req.user.username,
    customerId: req.user.customerId,
    role: req.user.role
  });

  // System admins can access any customer's data
  if (req.user.role === 'system_admin') {
    console.log(`🔓 User is system_admin - bypassing customer filter`);
    return next();
  }

  // Add customer filter to request for use in queries
  req.customerFilter = req.user.customerId;
  console.log(`🔒 Setting req.customerFilter to: "${req.customerFilter}"`);
  next();
};

// Demo permission validation middleware
export const requireDemoAccess = (demoEnvironment: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    console.log(`🔐 requireDemoAccess middleware called for: ${demoEnvironment}`);
    console.log(`👤 req.user exists:`, !!req.user);
    
    if (!req.user) {
      console.log(`🚨 No user in request - returning 401`);
      return res.status(401).json({ error: 'Authentication required' });
    }

    // System admins can access any demo environment
    if (req.user.role === 'system_admin') {
      console.log(`🔓 User is system_admin - bypassing demo access check`);
      return next();
    }

    // Check if user has permission for this demo environment
    const demoPermissions = req.user.demoPermissions || {};
    const hasPermission = demoPermissions[demoEnvironment] === true;

    console.log(`🔍 Demo permissions for user ${req.user.username}:`, demoPermissions);
    console.log(`📋 Checking access to: ${demoEnvironment}, has permission: ${hasPermission}`);

    if (!hasPermission) {
      console.log(`🚨 User ${req.user.username} denied access to ${demoEnvironment}`);
      return res.status(403).json({ 
        error: 'Demo access denied', 
        message: `You do not have permission to access ${demoEnvironment}` 
      });
    }

    req.currentDemoEnvironment = demoEnvironment;
    console.log(`✅ User ${req.user.username} granted access to ${demoEnvironment}`);
    next();
  };
};

// Extend Request type for customer filter
declare global {
  namespace Express {
    interface Request {
      customerFilter?: string;
      isDemoOperation?: boolean;
      enforceDemoCustomer?: boolean;
      currentDemoEnvironment?: string;
    }
  }
}

// Extend session data type
declare module 'express-session' {
  interface SessionData {
    userId: number;
    user?: {
      id: number;
      username: string;
      email?: string | null;
      role?: string | null;
      customerId?: string | null;
      customerName?: string | null;
      demoPermissions?: Record<string, unknown> | null;
    };
  }
}
