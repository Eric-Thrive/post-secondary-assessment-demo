import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import "./types"; // Import custom type definitions for Express Request extensions
import { storage } from "./storage";
// Removed ObjectStorageService import - no longer needed
import { registerNoCacheRoutes } from "./no-cache-routes";
import { LocalAIService, type AIAnalysisRequest } from "./ai-service";
import { aiJSONService } from "./ai-json-service";
import crypto from "crypto";
import { db } from "./db";
import { itemMaster, users, insertUserSchema, assessmentCases } from "@shared/schema";
import { eq, desc, and } from "drizzle-orm";
import { sessionConfig, requireAuth, requireRole, requireCustomerAccess, hashPassword, verifyPassword, generateResetToken, hashResetToken, generateRegistrationToken, isResetTokenValid, sendRegistrationNotification, checkReportLimit, incrementReportCount } from "./auth";
import { isReadOnlyEnvironment, isControlledAccessMode, assertWritePermissions, getDatabaseConnectionInfo, isDemoEnvironment } from "./config/database";

/**
 * SECURITY: Strict demo operation allowlist with explicit endpoint and method restrictions
 * Only allows specific operations needed for demo analysis workflows
 * CRITICAL: No wildcards - every operation must be explicitly enumerated
 */
function isDemoOperationAllowed(method: string, path: string): boolean {
  // Define explicit allowed operations with HTTP method restrictions
  // Note: path comes without /api prefix from the middleware
  const allowedOperations = [
    // Essential authentication and status endpoints for demo functionality
    { method: 'GET', path: '/auth/me' },
    { method: 'POST', path: '/auth/login' },
    { method: 'POST', path: '/auth/logout' },
    { method: 'POST', path: '/auth/register' },
    { method: 'POST', path: '/auth/reset-password-request' },
    { method: 'POST', path: '/auth/reset-password' },
    { method: 'POST', path: '/auth/forgot-username' },
    
    // Environment configuration endpoint
    { method: 'GET', path: '/config/environment' },
    
    // Demo analysis endpoints
    { method: 'POST', path: '/demo-analyze-assessment' },
    { method: 'GET', path: '/demo-assessment-cases' },
    
    // Assessment case creation (POST only for demo cases)
    { method: 'POST', path: '/assessment-cases' },
    { method: 'GET', path: '/assessment-cases' },
    
    // Specific case operations (explicit case IDs only)
    { method: 'GET', path: /^\/assessment-cases\/[\w-]+$/ },
    { method: 'PATCH', path: /^\/assessment-cases\/[\w-]+$/ },
    { method: 'PATCH', path: /^\/assessment-cases\/[\w-]+\/finalize$/ },
    { method: 'POST', path: /^\/assessment-cases\/[\w-]+\/switch-version$/ },
    
    // K12 demo editing (specific operations only)
    { method: 'POST', path: '/k12-assessment-cases/edit' },
    { method: 'POST', path: '/k12-assessment-cases/approve-change' },
    { method: 'POST', path: '/api/k12-assessment-cases/reject-change' },
    
    // Demo sharing (GET only)
    { method: 'GET', path: /^\/api\/shared\/[\w-]+$/ },
    { method: 'POST', path: /^\/api\/reports\/[\w-]+\/share$/ },
    
    // Demo case specific operations (no wildcards)
    { method: 'GET', path: /^\/api\/demo-assessment-cases\/[\w-]+$/ },
    { method: 'PATCH', path: /^\/api\/demo-assessment-cases\/[\w-]+$/ },
    
    // Configuration and lookup endpoints needed for demo functionality
    { method: 'GET', path: '/api/ai-config' },
    { method: 'GET', path: '/api/prompts' },
    { method: 'GET', path: '/api/lookup-tables' },
    { method: 'GET', path: '/api/mapping-configurations' },
    
    // Admin endpoints (for system administrators)
    { method: 'GET', path: '/api/admin/users' },
    { method: 'PATCH', path: /^\/api\/admin\/users\/\d+$/ },
  ];

  // Check if the operation is explicitly allowed
  const isAllowed = allowedOperations.some(op => {
    const methodMatches = op.method === method;
    const pathMatches = typeof op.path === 'string' 
      ? op.path === path
      : op.path.test(path);
    return methodMatches && pathMatches;
  });

  // SECURITY LOG: Always log denied operations for audit trail
  if (!isAllowed) {
    console.warn(`🚨 DEMO OPERATION DENIED: ${method} ${path}`, {
      reason: 'Not in explicit allowlist',
      timestamp: new Date().toISOString()
    });
  }

  return isAllowed;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Object Storage route removed - no longer needed since assets are local

  // Set up session middleware
  app.use(sessionConfig);

  // Debug middleware to see if routes are being registered
  app.use('/api', (req, res, next) => {
    console.log(`API Route hit: ${req.method} ${req.originalUrl}`);
    next();
  });

  // SECURITY MIDDLEWARE: Combined demo operation detection and customer isolation enforcement
  app.use('/api', (req, res, next) => {
    const writeOperations = ['POST', 'PUT', 'PATCH', 'DELETE'];
    const isWriteOperation = writeOperations.includes(req.method);
    
    // STEP 1: Determine if this is a demo operation (MUST happen first)
    const isDemo = isDemoEnvironment();
    // Strip /api prefix from path for allowlist check (paths in allowlist don't include /api)
    const pathWithoutApi = req.path.replace('/api', '');
    const isDemoOpAllowed = isDemo && isDemoOperationAllowed(req.method, pathWithoutApi);
    
    // STEP 2: Set demo operation flags BEFORE isolation checks
    if (isWriteOperation && isReadOnlyEnvironment() && isDemoOpAllowed) {
      req.isDemoOperation = true;
      req.enforceDemoCustomer = true;
    }
    
    // STEP 3: CRITICAL demo customer isolation enforcement (now req.isDemoOperation is set)
    if (req.isDemoOperation) {
      // CRITICAL: Enforce demo customer isolation
      const validateDemoAccess = (data: any): boolean => {
        if (!data) return true; // Allow empty data
        
        // Check for customerId in request body
        if (data.customerId && data.customerId !== 'demo-customer') {
          return false;
        }
        
        // Check for nested customer data
        if (data.customer && data.customer.id !== 'demo-customer') {
          return false;
        }
        
        // Check for assessment case customer references
        if (data.assessmentCase && data.assessmentCase.customerId && 
            data.assessmentCase.customerId !== 'demo-customer') {
          return false;
        }
        
        return true;
      };
      
      // Validate request body for demo isolation
      if (req.body && !validateDemoAccess(req.body)) {
        console.error(`🚨 DEMO ISOLATION VIOLATION: Non-demo customer data in request`, {
          operation: `${req.method} ${req.path}`,
          customerData: req.body.customerId || req.body.customer?.id,
          timestamp: new Date().toISOString(),
          reason: 'Demo operations must only access demo-customer data'
        });
        
        return res.status(403).json({
          error: 'SECURITY VIOLATION: Demo operations are restricted to demo customer data only',
          code: 'DEMO_CUSTOMER_ISOLATION_VIOLATION'
        });
      }
      
      // Force demo customer for assessment case operations
      if (req.body && (req.path.includes('/assessment-cases') || req.path.includes('/demo-assessment-cases'))) {
        if (req.method === 'POST' || req.method === 'PATCH') {
          req.body.customerId = 'demo-customer';
          if (req.body.customer) {
            req.body.customer.id = 'demo-customer';
          }
        }
      }
    }
    
    // STEP 4: Write operation validation with environment checks
    if (isWriteOperation && isReadOnlyEnvironment()) {
      const connInfo = getDatabaseConnectionInfo();
      const isControlledAccess = isControlledAccessMode();
      
      // SECURITY: Enhanced validation for demo operations
      if (isDemoOpAllowed) {
        
        // CONTROLLED ACCESS MODE: Allow demo operations on shared databases with enhanced security
        if (isControlledAccess) {
          console.log(`🔒 CONTROLLED ACCESS: Demo operation approved under enhanced security mode`, {
            operation: `${req.method} ${req.path}`,
            environment: connInfo.environment,
            isDemo: connInfo.isDemo,
            timestamp: new Date().toISOString(),
            reason: 'Controlled access mode with strict customer isolation',
            securityMeasures: [
              'Customer isolation enforced (demo-customer only)',
              'Operation allowlist active',
              'Audit logging enabled',
              'Application-level security validation'
            ]
          });
        } else {
          // LEGACY VALIDATION: For non-controlled access mode, apply strict validation
          if (connInfo.environment !== 'demo' && !connInfo.isDemo) {
            console.error(`🚨 CRITICAL SECURITY VIOLATION: Demo operation attempted on non-demo environment`, {
              environment: connInfo.environment,
              isDemo: connInfo.isDemo,
              operation: `${req.method} ${req.path}`,
              timestamp: new Date().toISOString(),
              reason: 'Demo operation on production environment blocked'
            });
            
            return res.status(503).json({
              error: 'SECURITY VIOLATION: Demo operations cannot be performed on production environments',
              environment: connInfo.environment,
              code: 'DEMO_ON_PRODUCTION_BLOCKED'
            });
          }
          
          // SECURITY: Check for production database host patterns (only for non-controlled access)
          const dbUrl = process.env.DATABASE_URL || '';
          const productionHostPatterns = ['ep-', 'prod', 'production', 'live', 'main'];
          const isProdHost = productionHostPatterns.some(pattern => dbUrl.toLowerCase().includes(pattern));
          
          if (isProdHost && !process.env.POST_SECONDARY_DEMO_DATABASE_URL) {
            console.error(`🚨 CRITICAL SECURITY VIOLATION: Demo operation on production database host`, {
              operation: `${req.method} ${req.path}`,
              hostPattern: 'Production database detected',
              timestamp: new Date().toISOString(),
              reason: 'Demo operations blocked on production database'
            });
            
            return res.status(503).json({
              error: 'SECURITY VIOLATION: Demo operations require isolated demo database',
              code: 'DEMO_REQUIRES_ISOLATED_DB'
            });
          }
        }
        
        // LOG ALLOWED DEMO OPERATION for security auditing
        console.log(`🎯 DEMO OPERATION ALLOWED: ${req.method} ${req.path}`, {
          environment: connInfo.environment,
          isDemo: connInfo.isDemo,
          operation: `${req.method} ${req.path}`,
          timestamp: new Date().toISOString(),
          userAgent: req.get('User-Agent'),
          ip: req.ip,
          reason: 'Demo analysis workflow operation - security validated',
          demoCustomerEnforced: req.enforceDemoCustomer
        });
        
        // Continue with the request after all security checks pass
        return next();
      }
      
      // Block all other write operations in read-only environments
      console.error(`🚨 SECURITY VIOLATION: ${req.method} ${req.path} blocked in read-only environment`, {
        environment: connInfo.environment,
        isDemo: connInfo.isDemo,
        operation: `${req.method} ${req.path}`,
        timestamp: new Date().toISOString(),
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        reason: isDemo ? 'Operation not in demo allowlist' : 'Read-only environment'
      });
      
      return res.status(403).json({
        error: isDemo 
          ? 'SECURITY VIOLATION: This operation is not permitted in demo environments'
          : 'SECURITY VIOLATION: Write operations are not permitted in read-only environments',
        environment: connInfo.environment,
        operation: `${req.method} ${req.path}`,
        reason: isDemo 
          ? 'Only specific demo analysis operations are allowed for security and data integrity'
          : 'Demo environments are read-only for security and data integrity'
      });
    }
    
    next();
  });

  // Debug middleware to check request body before auth routes (sensitive data sanitized)
  app.use('/api/auth', (req, res, next) => {
    console.log('🔍 Auth middleware - Request received:', {
      method: req.method,
      url: req.url,
      hasBody: !!req.body && Object.keys(req.body).length > 0
    });
    next();
  });

  // Authentication routes
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { username, password, email, customerId, customerName, role } = req.body;
      
      // Validate required fields
      if (!username || !password || !email) {
        return res.status(400).json({ error: 'Username, password, and email are required' });
      }

      // Normalize username and email by trimming whitespace
      const trimmedUsername = username.trim();
      const trimmedEmail = email.trim();

      // Validate that username is not empty after trimming
      if (!trimmedUsername) {
        return res.status(400).json({ error: 'Username cannot be empty or contain only whitespace' });
      }

      // Validate that email is not empty after trimming
      if (!trimmedEmail) {
        return res.status(400).json({ error: 'Email cannot be empty or contain only whitespace' });
      }

      // Validate password security requirements
      if (password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters long' });
      }
      
      if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
        return res.status(400).json({ error: 'Password must contain at least one uppercase letter, one lowercase letter, and one number' });
      }

      // Check if user already exists by username or email (using trimmed values)
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.username, trimmedUsername));

      if (existingUser) {
        return res.status(409).json({ error: 'Username already exists' });
      }

      const [existingEmail] = await db
        .select()
        .from(users)
        .where(eq(users.email, trimmedEmail));

      if (existingEmail) {
        return res.status(409).json({ error: 'Email already exists' });
      }

      // Hash password
      const hashedPassword = await hashPassword(password);

      // Generate registration token for admin notification
      const registrationToken = generateRegistrationToken();

      // Determine customer ID based on environment
      let assignedCustomerId = customerId || 'system';
      let assignedRole = role || 'tutor';

      // For demo environments, assign demo-customer and specific demo permissions
      const environment = req.headers['x-environment'] || process.env.APP_ENVIRONMENT;
      let demoPermissions = {};
      
      if (environment && environment.includes('demo')) {
        assignedCustomerId = 'demo-customer';
        assignedRole = 'tutor'; // Demo users are always tutors
        
        // Assign demo permissions based on the specific environment
        if (environment.includes('post-secondary-demo')) {
          demoPermissions = { 'post-secondary-demo': true };
        } else if (environment.includes('k12-demo')) {
          demoPermissions = { 'k12-demo': true };
        } else if (environment.includes('tutoring-demo')) {
          demoPermissions = { 'tutoring-demo': true };
        } else {
          // Default to post-secondary for generic demo environment
          demoPermissions = { 'post-secondary-demo': true };
        }
      }

      // Create user with normalized (trimmed) username and email
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

      // Send notification to eric@thriveiep.com
      await sendRegistrationNotification({
        username: newUser.username,
        email: newUser.email || '',
        customerId: newUser.customerId,
        role: newUser.role,
        registrationToken: newUser.registrationToken || '',
        environment: typeof environment === 'string' ? environment : 'unknown'
      });

      res.status(201).json({ 
        message: 'User created successfully',
        user: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          customerId: newUser.customerId,
          customerName: newUser.customerName,
          role: newUser.role,
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Registration failed' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
      }

      // Normalize username by trimming whitespace
      const trimmedUsername = username.trim();
      
      console.log(`🔐 Login attempt for username: "${trimmedUsername}"`);
      
      // Find user
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.username, trimmedUsername));

      if (!user) {
        console.log(`❌ User "${trimmedUsername}" not found in database`);
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      if (!user.isActive) {
        console.log(`❌ User "${trimmedUsername}" is not active`);
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      console.log(`✓ User "${trimmedUsername}" found and active`);

      // Verify password
      const isValidPassword = await verifyPassword(password, user.password);
      
      if (!isValidPassword) {
        console.log(`❌ Password verification failed for user "${trimmedUsername}"`);
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      console.log(`✅ Login successful for user "${trimmedUsername}"`);

      // Update last login
      await db
        .update(users)
        .set({ lastLogin: new Date() })
        .where(eq(users.id, user.id));

      // Set session
      req.session.userId = user.id;

      res.json({
        message: 'Login successful',
        user: {
          id: user.id,
          username: user.username,
          customerId: user.customerId,
          customerName: user.customerName,
          role: user.role,
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error('Logout error:', err);
        return res.status(500).json({ error: 'Logout failed' });
      }
      
      res.clearCookie('connect.sid');
      res.json({ message: 'Logout successful' });
    });
  });

  app.get('/api/auth/me', requireAuth, async (req, res) => {
    try {
      // Get full user details including report count and demo permissions
      const [userDetails] = await db
        .select({
          id: users.id,
          username: users.username,
          email: users.email,
          customerId: users.customerId,
          customerName: users.customerName,
          role: users.role,
          reportCount: users.reportCount,
          maxReports: users.maxReports,
          demoPermissions: users.demoPermissions,
        })
        .from(users)
        .where(eq(users.id, req.user!.id));

      res.json({ 
        user: {
          ...req.user,
          reportCount: userDetails?.reportCount || 0,
          maxReports: userDetails?.maxReports || 5,
          reportsRemaining: (userDetails?.maxReports || 5) - (userDetails?.reportCount || 0),
          demoPermissions: userDetails?.demoPermissions || {}
        }
      });
    } catch (error) {
      console.error('Error getting user details:', error);
      res.json({ user: req.user });
    }
  });

  // Password reset request
  app.post('/api/auth/reset-password-request', async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }

      // Find user by email
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email));

      if (!user || !user.isActive) {
        // Don't reveal if email exists for security
        return res.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
      }

      // Generate reset token (keep raw token for email, hash for storage)
      const resetToken = generateResetToken();
      const hashedResetToken = hashResetToken(resetToken);
      const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Update user with hashed reset token
      await db
        .update(users)
        .set({ 
          resetToken: hashedResetToken,
          resetTokenExpiry 
        })
        .where(eq(users.id, user.id));

      // Send email with reset token using SendGrid integration
      try {
        const { sendEmail, generatePasswordResetEmail } = await import('./services/sendgrid');
        const resetUrl = `${req.protocol}://${req.get('host')}/reset-password?token=${resetToken}`;
        const emailParams = generatePasswordResetEmail(resetToken, email, resetUrl);
        
        const emailSent = await sendEmail(emailParams);
        if (!emailSent) {
          console.error('Failed to send password reset email to:', email);
        } else {
          console.log(`Password reset email sent successfully to: ${email}`);
        }
      } catch (emailError) {
        console.error('Error sending password reset email:', emailError);
        // Continue execution - don't fail the request if email fails
      }
      
      res.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
    } catch (error) {
      console.error('Password reset request error:', error);
      res.status(500).json({ error: 'Password reset request failed' });
    }
  });

  // Forgot username request
  app.post('/api/auth/forgot-username', async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }

      // Find user(s) by email
      const usersWithEmail = await db
        .select({
          username: users.username,
          email: users.email,
          isActive: users.isActive
        })
        .from(users)
        .where(eq(users.email, email));

      // Filter active users only
      const activeUsers = usersWithEmail.filter(user => user.isActive);

      if (activeUsers.length === 0) {
        // Don't reveal if email exists for security
        return res.json({ message: 'If an account with that email exists, your username information has been sent.' });
      }

      // Send email with username(s) using SendGrid integration
      try {
        const { sendEmail, generateForgotUsernameEmail } = await import('./services/sendgrid');
        const usernames = activeUsers.map(user => user.username);
        const emailParams = generateForgotUsernameEmail(email, usernames);
        
        const emailSent = await sendEmail(emailParams);
        if (!emailSent) {
          console.error('Failed to send forgot username email - delivery error');
        } else {
          console.log('Forgot username email sent successfully');
        }
      } catch (emailError) {
        console.error('Error sending forgot username email:', emailError);
        // Continue execution - don't fail the request if email fails
      }
      
      res.json({ message: 'If an account with that email exists, your username information has been sent.' });
    } catch (error) {
      console.error('Forgot username request error:', error);
      res.status(500).json({ error: 'Forgot username request failed' });
    }
  });

  // Admin endpoints for eric@thriveiep.com
  app.get('/api/admin/users', requireAuth, requireRole(['system_admin']), async (req, res) => {
    try {
      // Only allow system admins to view all users
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

      const userStats = allUsers.map(user => ({
        ...user,
        reportsRemaining: user.maxReports - user.reportCount,
        isLimitReached: user.reportCount >= user.maxReports,
      }));

      res.json({
        users: userStats,
        totalUsers: userStats.length,
        activeUsers: userStats.filter(u => u.isActive).length,
        usersAtLimit: userStats.filter(u => u.isLimitReached).length,
      });
    } catch (error) {
      console.error('Error fetching admin user data:', error);
      res.status(500).json({ error: 'Failed to fetch user data' });
    }
  });

  app.patch('/api/admin/users/:userId', requireAuth, requireRole(['system_admin']), async (req, res) => {
    try {
      const { userId } = req.params;
      const { maxReports, reportCount, isActive, role, demoPermissions } = req.body;

      const updateData: any = {};
      if (typeof maxReports === 'number') updateData.maxReports = maxReports;
      if (typeof reportCount === 'number') updateData.reportCount = reportCount;
      if (typeof isActive === 'boolean') updateData.isActive = isActive;
      if (typeof role === 'string') updateData.role = role;
      if (demoPermissions !== undefined) updateData.demoPermissions = demoPermissions;

      await db
        .update(users)
        .set(updateData)
        .where(eq(users.id, parseInt(userId)));

      res.json({ message: 'User updated successfully' });
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ error: 'Failed to update user' });
    }
  });

  // Bootstrap admin user (one-time use)
  app.post('/api/admin/bootstrap', async (req, res) => {
    try {
      const { adminEmail, adminPassword } = req.body;

      if (adminEmail !== 'eric@thriveiep.com') {
        return res.status(403).json({ error: 'This endpoint is only for creating the initial admin user' });
      }

      // Check if admin already exists
      const [existingAdmin] = await db
        .select()
        .from(users)
        .where(eq(users.email, adminEmail));

      if (existingAdmin) {
        return res.status(409).json({ error: 'Admin user already exists' });
      }

      // Create the admin user
      const hashedPassword = await hashPassword(adminPassword);
      const registrationToken = generateRegistrationToken();

      const [adminUser] = await db
        .insert(users)
        .values({
          username: 'eric',
          password: hashedPassword,
          email: adminEmail,
          customerId: 'system',
          customerName: 'System Administrator',
          role: 'system_admin',
          isActive: true,
          registrationToken,
          reportCount: 0,
          maxReports: 999, // Unlimited for admin
        })
        .returning({
          id: users.id,
          username: users.username,
          email: users.email,
          role: users.role,
        });

      console.log(`🔧 ADMIN USER CREATED:
        Username: ${adminUser.username}
        Email: ${adminUser.email}
        Role: ${adminUser.role}
        ID: ${adminUser.id}
        Registration Token: ${registrationToken}
      `);

      res.status(201).json({ 
        message: 'Admin user created successfully',
        user: adminUser
      });
    } catch (error) {
      console.error('Error creating admin user:', error);
      res.status(500).json({ error: 'Failed to create admin user' });
    }
  });

  // Password reset confirmation
  app.post('/api/auth/reset-password', async (req, res) => {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return res.status(400).json({ error: 'Token and new password are required' });
      }

      // Hash the provided token to match against stored hash
      const hashedToken = hashResetToken(token);

      // Find user by hashed reset token
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.resetToken, hashedToken));

      if (!user || !user.isActive) {
        return res.status(400).json({ error: 'Invalid or expired reset token' });
      }

      // Check if token is still valid
      if (!isResetTokenValid(user.resetTokenExpiry)) {
        // Clear expired token
        await db
          .update(users)
          .set({ 
            resetToken: null,
            resetTokenExpiry: null 
          })
          .where(eq(users.id, user.id));
        
        return res.status(400).json({ error: 'Reset token has expired' });
      }

      // Hash new password
      const hashedPassword = await hashPassword(newPassword);

      // Update password and clear reset token (prevent replay attacks)
      await db
        .update(users)
        .set({ 
          password: hashedPassword,
          resetToken: null,
          resetTokenExpiry: null 
        })
        .where(eq(users.id, user.id));

      res.json({ message: 'Password has been reset successfully' });
    } catch (error) {
      console.error('Password reset error:', error);
      res.status(500).json({ error: 'Password reset failed' });
    }
  });

  // Test Database connection
  app.get("/api/test-connection", async (req, res) => {
    try {
      const config = await storage.getAiConfig();
      res.json({
        success: true,
        connected: true,
        hasConfig: !!config,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('Connection test failed:', error);
      res.status(500).json({
        success: false,
        connected: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Public health check/preview test page (no authentication required)
  app.get("/api/health", async (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Server Health Check</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gradient-to-br from-green-50 to-emerald-100 min-h-screen p-8">
    <div class="max-w-3xl mx-auto">
        <div class="bg-white rounded-lg shadow-2xl p-8">
            <h1 class="text-4xl font-bold text-green-600 mb-4">
                ✅ Server is Running!
            </h1>
            <p class="text-gray-700 text-lg mb-6">
                Educational Accessibility Platform - Preview Test
            </p>
            <div class="bg-green-50 border-l-4 border-green-500 p-4 mb-6">
                <p class="text-green-800 font-semibold">Status: Online</p>
                <p class="text-green-700">Time: ${new Date().toLocaleString()}</p>
                <p class="text-green-700">Port: ${process.env.PORT || 5000}</p>
            </div>
            <div class="space-y-4">
                <p class="text-gray-600">To access the full application:</p>
                <ol class="list-decimal list-inside text-gray-700 space-y-2">
                    <li>Navigate to <a href="/" class="text-blue-600 hover:underline">the home page</a></li>
                    <li>Login with your credentials</li>
                    <li>Start creating accessibility reports!</li>
                </ol>
            </div>
        </div>
    </div>
</body>
</html>
    `);
  });

  // Public shared report route (no authentication required)
  app.get("/api/shared/:shareToken", async (req, res) => {
    try {
      const { shareToken } = req.params;
      console.log(`Fetching shared report with token: ${shareToken}`);
      
      // Get the shared report from storage
      const sharedReport = await storage.getSharedReport(shareToken);
      
      if (!sharedReport) {
        return res.status(404).json({ error: 'Shared report not found or sharing has been disabled' });
      }
      
      // Return the shared report data
      res.json({
        success: true,
        ...sharedReport
      });
    } catch (error: any) {
      console.error('Error fetching shared report:', error);
      res.status(500).json({ error: 'Failed to fetch shared report' });
    }
  });

  // API route to enable sharing for a report
  app.post("/api/reports/:caseId/share", requireAuth, requireCustomerAccess, async (req, res) => {
    try {
      const { caseId } = req.params;
      console.log(`Enabling sharing for case: ${caseId}`);
      
      // Enable sharing and get the share token
      const shareToken = await storage.enableReportSharing(caseId, req.user?.customerId);
      
      if (!shareToken) {
        return res.status(404).json({ error: 'Report not found' });
      }
      
      // Generate the shareable URL
      const shareUrl = `${req.protocol}://${req.get('host')}/shared/${shareToken}`;
      
      res.json({
        success: true,
        shareToken,
        shareUrl,
        message: 'Report sharing enabled successfully'
      });
    } catch (error: any) {
      console.error('Error enabling report sharing:', error);
      res.status(500).json({ error: 'Failed to enable report sharing' });
    }
  });

  // API route to disable sharing for a report
  app.delete("/api/reports/:caseId/share", requireAuth, requireCustomerAccess, async (req, res) => {
    try {
      const { caseId } = req.params;
      console.log(`Disabling sharing for case: ${caseId}`);
      
      // Disable sharing
      const success = await storage.disableReportSharing(caseId, req.user?.customerId);
      
      if (!success) {
        return res.status(404).json({ error: 'Report not found' });
      }
      
      res.json({
        success: true,
        message: 'Report sharing disabled successfully'
      });
    } catch (error: any) {
      console.error('Error disabling report sharing:', error);
      res.status(500).json({ error: 'Failed to disable report sharing' });
    }
  });

  // Demo Assessment Cases - requires authentication to ensure user isolation
  app.get("/api/demo-assessment-cases/:moduleType", requireAuth, async (req, res) => {
    try {
      const { moduleType } = req.params;
      const userId = req.user?.id;
      
      // In demo mode, userId is MANDATORY for security
      if (!userId || typeof userId !== 'number') {
        console.error(`Demo security violation: Missing or invalid userId. User object:`, req.user);
        return res.status(403).json({ 
          error: 'Authentication required - invalid user session',
          demo: true
        });
      }
      
      console.log(`Demo API Route hit: GET /demo-assessment-cases/${moduleType}`);
      console.log(`Fetching demo assessment cases for module: ${moduleType}, user: ${userId}`);
      
      // Get demo cases filtered by the current user's ID
      // This ensures users only see their own assessment cases
      const cases = await storage.getAssessmentCases(moduleType, 'demo-customer', userId);
      
      console.log(`Found ${cases.length} demo ${moduleType} cases for user ${userId}`);
      res.json(cases || []);
    } catch (error: any) {
      console.error(`Error fetching demo assessment cases for ${req.params.moduleType}:`, error);
      res.status(500).json({ 
        error: 'Failed to fetch demo assessment cases',
        demo: true
      });
    }
  });

  // Assessment Cases - now with customer isolation (NO CACHE)
  app.get("/api/assessment-cases/:moduleType", requireAuth, requireCustomerAccess, async (req, res) => {
    try {
      const { moduleType } = req.params;
      console.log(`API Route hit: GET /assessment-cases/${moduleType}`);
      console.log(`🔍 Route Handler - req.customerFilter: "${req.customerFilter}"`);
      console.log(`🔍 Route Handler - req.user.customerId: "${req.user?.customerId}"`);
      console.log(`Fetching assessment cases for module: ${moduleType}, customer: ${req.customerFilter}`);
      
      // Add cache-busting headers to force fresh queries
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'ETag': `${Date.now()}-${Math.random()}`
      });
      
      // Use customer filter for data isolation - FRESH QUERY EVERY TIME
      const cases = await storage.getAssessmentCases(moduleType, req.customerFilter);
      console.log(`Found ${cases.length} cases for module ${moduleType}, customer ${req.customerFilter}`);
      res.json(cases);
    } catch (error: any) {
      console.error('Error fetching assessment cases:', error);
      res.json([]);
    }
  });


  // Assessment creation endpoint - now with customer isolation and report limiting
  app.post("/api/assessment-cases", requireAuth, requireCustomerAccess, async (req, res) => {
    try {
      console.log('Creating new assessment case:', req.body);
      
      // Check if user is system admin (no report limits for admins)
      const isAdmin = req.user?.role === 'system_admin';
      
      if (!isAdmin) {
        // Check report limit before creating case (but don't increment yet)
        const reportCheck = await checkReportLimit(req.user!.id);
        
        if (!reportCheck.canCreate) {
          return res.status(403).json({ 
            error: 'Report limit exceeded',
            message: `You have reached your maximum of ${reportCheck.maxReports} reports. Current count: ${reportCheck.currentCount}`,
            currentCount: reportCheck.currentCount,
            maxReports: reportCheck.maxReports
          });
        }
      }
      
      // Add customer isolation and user tracking to the case
      const caseData = {
        ...req.body,
        customerId: req.user?.customerId,
        createdByUserId: req.user?.id,
      };
      
      // Create assessment case first
      const newCase = await storage.createAssessmentCase(caseData);
      console.log('Assessment case created successfully:', newCase.id);
      
      // Only increment report count after successful case creation
      if (!isAdmin) {
        await incrementReportCount(req.user!.id);
        console.log(`Report count incremented for user ${req.user!.id}`);
      }
      
      res.json(newCase);
    } catch (error: any) {
      console.error('Error creating assessment case:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Demo analysis endpoint - for public demo mode (no authentication required)
  app.post("/api/demo-analyze-assessment", async (req, res) => {
    try {
      console.log('=== DEMO ANALYSIS REQUEST (No Auth Required) ===');
      
      // SAFETY GUARD: Check for proper demo environment configuration
      const currentEnv = process.env.APP_ENVIRONMENT || 'production';
      const hasProperDemoSetup = currentEnv.includes('demo') && process.env.POST_SECONDARY_DEMO_DATABASE_URL;
      
      // WORKAROUND: Allow demo if POST_SECONDARY_DEMO_DATABASE_URL is set (even if APP_ENVIRONMENT is wrong)
      // This handles the case where APP_ENVIRONMENT secret can't be edited but demo database is configured
      const hasWorkaroundDemoSetup = process.env.POST_SECONDARY_DEMO_DATABASE_URL && process.env.POST_SECONDARY_DEMO_DATABASE_URL.length > 0;
      
      // NEW: Allow controlled access mode for demo environments (enhanced security with customer isolation)
      const hasControlledAccessSetup = currentEnv.includes('demo') && isControlledAccessMode();
      
      if (!hasProperDemoSetup && !hasWorkaroundDemoSetup && !hasControlledAccessSetup) {
        console.error('🚨 SECURITY ERROR: Demo endpoint accessed without proper demo database configuration');
        console.error(`   APP_ENVIRONMENT: ${currentEnv}`);
        console.error(`   POST_SECONDARY_DEMO_DATABASE_URL: ${process.env.POST_SECONDARY_DEMO_DATABASE_URL ? 'SET' : 'MISSING'}`);
        console.error(`   CONTROLLED_ACCESS_MODE: ${isControlledAccessMode() ? 'ENABLED' : 'DISABLED'}`);
        console.error('   Risk: Demo operations may write to production database');
        
        return res.status(503).json({
          error: 'Demo environment not properly configured',
          details: 'Demo operations require proper environment isolation to prevent production data corruption',
          requiredVars: ['APP_ENVIRONMENT=post-secondary-demo', 'POST_SECONDARY_DEMO_DATABASE_URL OR controlled access mode'],
          currentEnv: currentEnv
        });
      }
      
      // Log the configuration being used
      if (hasControlledAccessSetup) {
        console.log('🔒 Using controlled access mode for demo analysis');
        console.log(`   APP_ENVIRONMENT: ${currentEnv} ✅`);
        console.log(`   CONTROLLED_ACCESS_MODE: ENABLED ✅`);
        console.log(`   CUSTOMER_ISOLATION: demo-customer only ✅`);
      } else if (hasWorkaroundDemoSetup && !hasProperDemoSetup) {
        console.log('⚠️  Using demo workaround mode - POST_SECONDARY_DEMO_DATABASE_URL is set but APP_ENVIRONMENT needs fixing');
        console.log(`   APP_ENVIRONMENT: ${currentEnv} (should be 'post-secondary-demo')`);
        console.log(`   POST_SECONDARY_DEMO_DATABASE_URL: SET ✅`);
      } else if (hasProperDemoSetup) {
        console.log('✅ Using proper demo setup with isolated database');
        console.log(`   APP_ENVIRONMENT: ${currentEnv} ✅`);
        console.log(`   POST_SECONDARY_DEMO_DATABASE_URL: SET ✅`);
      }
      
      const moduleType = req.body.moduleType || 'post_secondary';
      const pathway = req.body.pathway || 'simple'; // Extract pathway from request body
      const caseId = req.body.caseId || `demo-${Date.now()}`;
      const documents = req.body.documents || req.body.documentContents || [];
      const studentGrade = req.body.studentGrade;
      const uniqueId = req.body.uniqueId;
      const programMajor = req.body.programMajor;
      const reportAuthor = req.body.reportAuthor;
      
      console.log(`Demo Module type: ${moduleType}`);
      console.log(`Demo Pathway: ${pathway}`);
      console.log(`Demo Case ID: ${caseId}`);
      console.log(`Demo Documents: ${documents.length}`);
      
      // Check if this is the tutoring module - use JSON-first approach
      if (moduleType === 'tutoring') {
        console.log('🧩 Using JSON-first pipeline for tutoring module demo with QC scoring');
        
        // Use the tutoring JSON service for strict schema enforcement
        const documentContents = documents.map((doc: any) => doc.content || doc).filter(Boolean);
        const result = await aiJSONService.generateJSONReport(
          documentContents,
          moduleType,
          uniqueId,
          studentGrade
        );
        
        return res.json({ 
          success: true, 
          markdown_report: result.markdownReport,
          structured_data: result.jsonReport
        });
      } else {
        console.log(`🚀 Using ${pathway} pathway for demo analysis`);
        
        // Handle post_secondary and k12 modules in demo mode
        if (moduleType === 'post_secondary' || moduleType === 'k12') {
          console.log(`Processing ${moduleType} module in demo mode...`);
          
          // Use requested pathway for demo analysis
          const documentContents = documents.map((doc: any) => doc.content || doc).filter(Boolean);
          
          const aiService = new LocalAIService();
          const result = await aiService.processAnalysis({
            caseId,
            moduleType,
            pathway,
            documents: documentContents.map((content: string, index: number) => ({
              filename: `document_${index + 1}.txt`,
              content: content
            })),
            uniqueId,
            programMajor,
            reportAuthor,
            studentGrade
          });
          
          // Save the demo analysis result to database so reports page can find it
          console.log('💾 Saving demo analysis result to database...');
          
          // Capture user ID from session if user is logged in
          const userId = req.session?.userId;
          console.log(`🔑 Demo analysis - User ID from session: ${userId || 'none (anonymous)'}`);
          
          const caseData = {
            id: caseId,
            moduleType: moduleType, // Fixed: camelCase
            pathway: pathway,
            displayName: uniqueId?.trim() || documents[0]?.filename || (moduleType === 'k12' ? 'K-12 Analysis' : 'Post-Secondary Analysis'), // Fixed: Use displayName for UI display
            studentGrade: studentGrade, // Already camelCase
            reportData: result.markdown_report, // Fixed: Use reportData (maps to report_data in DB)
            status: result.status || 'completed',
            createdAt: new Date().toISOString(), // Fixed: camelCase
            analysisDate: result.analysis_date || new Date().toISOString(), // Fixed: camelCase
            itemMasterData: JSON.stringify(result.item_master_data || []), // Fixed: camelCase
            customerId: 'demo-customer', // Fixed: camelCase - Special demo customer ID
            createdByUserId: userId, // Link to logged-in user if available
            environment: 'post-secondary-demo', // More specific environment
            // Add the missing new fields
            uniqueId: uniqueId?.trim() || null,
            programMajor: programMajor?.trim() || null,
            reportAuthor: reportAuthor?.trim() || null,
            // Add the missing document names - ensure array format
            documentNames: documents.map((d: any) => d.filename || d.name || `document_${documents.indexOf(d) + 1}.txt`).filter(Boolean)
          };
          
          try {
            await storage.createAssessmentCase(caseData);
            console.log('✅ Demo assessment case created successfully:', caseId);
          } catch (dbError: any) {
            console.warn('⚠️  Failed to save demo case to database:', dbError.message);
            // Continue anyway - analysis succeeded even if database save failed
          }
          
          return res.json({ 
            success: true, 
            markdown_report: result.markdown_report,
            analysis_result: result.markdown_report,
            case_id: caseId
          });
        }
      }
      
      // If we reach here, unsupported module type
      return res.json({ 
        error: `Demo mode does not support ${moduleType} module`,
        supported_modules: ["tutoring", "post_secondary", "k12"]
      });
      
    } catch (error: any) {
      console.error('Demo analysis error:', error);
      res.status(500).json({ 
        error: error.message || 'Demo analysis failed',
        demo: true
      });
    }
  });

  // Analysis endpoint - dual pathway routing (simple/complex) with authentication
  app.post("/api/analyze-assessment", requireAuth, requireCustomerAccess, async (req, res) => {
    try {
      const moduleType = req.body.moduleType || 'post_secondary';
      const pathway = req.body.pathway || 'simple'; // New: pathway selection
      const caseId = req.body.caseId || `analysis-${Date.now()}`;
      const documents = req.body.documents || req.body.documentContents || [];
      const studentGrade = req.body.studentGrade;
      const uniqueId = req.body.uniqueId;
      const programMajor = req.body.programMajor;
      const reportAuthor = req.body.reportAuthor;
      
      console.log('=== DUAL PATHWAY ANALYSIS REQUEST ===');
      console.log(`Module type: ${moduleType}`);
      console.log(`Pathway: ${pathway}`);
      console.log(`Case ID: ${caseId}`);
      console.log(`Documents: ${documents.length}`);
      
      // Tutoring module always uses simple pathway (JSON-first approach)
      if (moduleType === 'tutoring') {
        console.log('🧩 Using JSON-first pipeline for tutoring module (simple-only)');
      } else if (pathway === 'complex' && (moduleType === 'k12' || moduleType === 'post_secondary')) {
        console.log('🔬 Using complex pathway with function calling and lookup tables');
        
        // Route to complex pathway using LocalAIService
        const aiService = new LocalAIService();
        const analysisRequest: AIAnalysisRequest = {
          caseId,
          moduleType: moduleType as 'k12' | 'post_secondary',
          pathway: 'complex',
          documents,
          uniqueId,
          programMajor,
          reportAuthor,
          studentGrade
        };
        
        const result = await aiService.processAnalysis(analysisRequest);
        return res.json(result);
      } else {
        console.log('🚀 Using simple pathway with direct OpenAI analysis');
      }
      
      // Check if request is from demo environment (frontend can pass this)
      const requestEnv = req.body.environment || req.headers['x-environment'] || process.env.APP_ENVIRONMENT || 'replit-prod';
      const currentEnv = requestEnv;
      const promptModuleType = (currentEnv === 'post-secondary-demo') ? 'post_secondary' : moduleType;
      
      console.log(`🔄 Environment: ${currentEnv}, Module: ${moduleType}, Prompt Module: ${promptModuleType}`);
      
      // Get report format template from database (not system prompts)
      const reportFormatPrompts = await storage.getPromptSections(promptModuleType, 'report_format');
      
      // Use demo-specific template if in demo environment
      const isDemoEnv = currentEnv === 'post-secondary-demo' || currentEnv === 'k12-demo';
      const templateKey = isDemoEnv ? 
        `markdown_report_template_${promptModuleType}_demo` : 
        `markdown_report_template_${promptModuleType}`;
      
      const templateSection = reportFormatPrompts.find(p => p.section_key === templateKey);
      
      // Fallback to regular template if demo template not found
      let template = templateSection?.content || '';
      if (!template && isDemoEnv) {
        const fallbackSection = reportFormatPrompts.find(p => p.section_key === `markdown_report_template_${promptModuleType}`);
        if (fallbackSection) {
          console.log(`⚠️  Demo template not found, using fallback: ${fallbackSection.section_key}`);
          template = fallbackSection.content;
        }
      }
      
      console.log(`📋 Template loaded from database (report_format type): ${template.length} characters`);
      console.log(`📋 Template preview: ${template.substring(0, 100)}...`);
      
      // Also load system prompts separately for later use
      const systemPrompts = await storage.getPromptSections(promptModuleType, 'system');
      
      // Use demo-specific system prompt if in demo environment
      const systemPromptKey = isDemoEnv ? 
        `system_instructions_${promptModuleType}_demo` : 
        `system_instructions_${promptModuleType}`;
      
      let systemInstructions = systemPrompts.find(p => p.section_key === systemPromptKey);
      
      // Fallback to regular system prompt if demo prompt not found
      if (!systemInstructions && isDemoEnv) {
        systemInstructions = systemPrompts.find(p => p.section_key === `system_instructions_${promptModuleType}`);
        if (systemInstructions) {
          console.log(`⚠️  Demo system prompt not found, using fallback: ${systemInstructions.section_key}`);
        }
      }
      
      console.log(`📋 System prompt loaded: ${systemInstructions?.content?.length || 0} characters`);
      
      // Check if we got a valid template from database
      if (!template || template.length === 0) {
        console.error(`❌ No template found for prompt module type: ${promptModuleType}`);
        return res.status(500).json({ 
          error: `No report template found for module type: ${promptModuleType}. Please ensure templates are configured in the database.` 
        });
      }
      
      console.log(`✅ Using database template for ${promptModuleType}: ${template.length} characters`);
      console.log(`📋 Template preview: ${template.substring(0, 200)}...`);
      
      // Build analysis prompt - just provide documents and template
      const analysisPrompt = `DOCUMENTS TO ANALYZE:
${documents.map((doc: any, index: number) => `
Document ${index + 1}: ${doc.filename}
Content: ${doc.content}
`).join('\n')}

${studentGrade ? `Student Grade: ${studentGrade}\n` : ''}

Please analyze these documents and create a report following this exact template:

${template}`;

      // Call OpenAI directly with simple approach using environment variable
      const OpenAI = (await import('openai')).default;
      const apiKey = process.env.OPENAI_API_KEY;
      
      if (!apiKey) {
        console.error('❌ OPENAI_API_KEY environment variable not found');
        return res.status(500).json({ 
          error: 'OpenAI API key not configured. Please check environment variables.' 
        });
      }
      
      console.log('✅ Using OPENAI_API_KEY from environment in routes.ts');
      
      const openai = new OpenAI({ 
        apiKey: apiKey
      });
      
      // Build system prompt - require database system instructions
      if (!systemInstructions?.content) {
        console.error(`❌ No system instructions found for prompt module type: ${promptModuleType}`);
        return res.status(500).json({ 
          error: `No system instructions found for module type: ${promptModuleType}. Please ensure system_instructions_${promptModuleType} exists in the database.` 
        });
      }
      
      // Handle tutoring module with JSON-first approach
      if (moduleType === 'tutoring') {
        console.log('🧩 Processing tutoring module with JSON-first pipeline...');
        
        try {
          // Convert documents to simple string array for JSON service
          const documentStrings = documents.map((doc: any) => `${doc.filename}:\n${doc.content}`);
          
          // Generate JSON report with QC metadata
          const { jsonReport, markdownReport } = await aiJSONService.generateJSONReport(
            documentStrings,
            moduleType,
            uniqueId,
            studentGrade
          );
          
          console.log('✅ JSON report generated successfully');
          if (moduleType === 'tutoring') {
            console.log(`📊 Tutoring schema enforced: strict format with comprehensive sections`);
          } else {
            console.log(`📊 QC Summary: Avg Confidence: ${(jsonReport as any).overallQC.averageConfidence}, Uncertainties: ${(jsonReport as any).overallQC.totalUncertainties}`);
          }
          
          // Create assessment case with both JSON and markdown data
          const generatedId = crypto.randomUUID();
          console.log('🆔 Generated UUID:', generatedId);
          
          const assessmentCase = {
            id: generatedId,
            case_id: caseId,
            display_name: `Tutoring Analysis - ${uniqueId || 'Student'}`,
            module_type: moduleType,
            status: 'completed',
            created_date: new Date().toISOString(),
            last_updated: new Date().toISOString(),
            unique_id: uniqueId,
            program_major: programMajor,
            report_author: reportAuthor,
            student_grade: studentGrade,
            report_data: markdownReport,
            reportDataJson: jsonReport,
            qcMetadata: moduleType === 'tutoring' ? {
              schema_enforced: true,
              schema_version: (jsonReport as any).meta?.schema_version || '1.0.0',
              strict_structure: true,
              generatedAt: new Date().toISOString()
            } : {
              averageConfidence: (jsonReport as any).overallQC.averageConfidence,
              totalUncertainties: (jsonReport as any).overallQC.totalUncertainties,
              recommendsReview: (jsonReport as any).overallQC.recommendsReview,
              generatedAt: new Date().toISOString()
            },
            customerId: req.user?.customerId,
            createdByUserId: req.user?.id
          };
          
          // Save to database
          const savedCase = await storage.createAssessmentCase(assessmentCase);
          
          return res.json({
            success: true,
            analysis_date: new Date().toISOString(),
            status: 'completed',
            markdown_report: markdownReport,
            json_report: jsonReport,
            qc_metadata: assessmentCase.qcMetadata,
            case_id: savedCase.id || caseId,
            module_type: moduleType
          });
          
        } catch (error) {
          console.error('❌ Tutoring module analysis failed:', error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error in tutoring analysis';
          return res.status(500).json({
            success: false,
            error: errorMessage,
            status: 'failed'
          });
        }
      }
      
      // Continue with existing logic for other modules
      // Use system prompt directly from database without modifications
      const systemPromptContent = systemInstructions.content;

      const response = await openai.chat.completions.create({
        model: 'gpt-4.1', // using GPT-4.1 for better instruction following
        messages: [
          {
            role: 'system',
            content: systemPromptContent
          },
          {
            role: 'user',
            content: analysisPrompt
          }
        ],
        max_tokens: 4500,
        temperature: 0.1
      });

      let markdownReport = response.choices[0].message.content || '';
      
      console.log('🔍 Validating template adherence...');
      console.log(`📄 Original report preview (first 200 chars): ${markdownReport.substring(0, 200)}`);
      
      // Validate template adherence - check for common template violations
      const templateViolations = [];
      
      // Only validate post-secondary reports
      if (moduleType === 'post_secondary') {
        // Check for any combined sections (case-insensitive and comprehensive)
        const combinedSectionPatterns = [
          /functional barriers and required accommodations/i,
          /summary of functional barriers and required/i,
          /summary of functional barriers and accommodations/i,
          /barriers and accommodations/i,
          /functional barriers & accommodations/i,
          /functional barriers & required accommodations/i,
          /barriers & accommodations/i,
          /functional limitations and accommodations/i,
          /impairments and accommodations/i
        ];
        
        combinedSectionPatterns.forEach((pattern, index) => {
          if (markdownReport && pattern.test(markdownReport)) {
            templateViolations.push(`Combined section pattern ${index + 1} detected: ${pattern.source}`);
          }
        });
        
        // Check for wrong section headings
        const wrongHeadingPatterns = [
          /## summary of functional barriers/i,
          /### summary of functional barriers/i,
          /## functional barriers/i,
          /## barriers and accommodations/i,
          /## disability accommodation report:/i  // should not have colon and name
        ];
        
        wrongHeadingPatterns.forEach((pattern, index) => {
          if (markdownReport && pattern.test(markdownReport)) {
            templateViolations.push(`Wrong heading pattern ${index + 1} detected: ${pattern.source}`);
          }
        });
      }
      
      // Check for required section headings (only for post-secondary)
      if (moduleType === 'post_secondary' && markdownReport) {
        if (!markdownReport.includes('## 2. Functional Impact Summary')) {
          templateViolations.push('Missing required Section 2 heading');
        }
        
        if (!markdownReport.includes('## 3. Accommodation & Support Plan')) {
          templateViolations.push('Missing required Section 3 heading');
        }
      }
      
      console.log(`🔍 Template violations found: ${templateViolations.length}`);
      console.log('🔍 Template violations:', templateViolations);
      
      // If template violations detected, regenerate with stronger enforcement (post-secondary only)
      if (templateViolations.length > 0 && moduleType === 'post_secondary') {
        console.log('⚠️ Template violations detected:', templateViolations);
        console.log('🔄 Regenerating with stronger template enforcement...');
        
        const fixedResponse = await openai.chat.completions.create({
          model: 'gpt-4.1',
          messages: [
            {
              role: 'system',
              content: `You are a disability services specialist. The previous response violated the template structure. You MUST fix this by following the EXACT template below.

CRITICAL ERRORS TO AVOID:
- DO NOT create sections like "Functional Barriers and Required Accommodations"
- DO NOT combine barriers and accommodations in the same section
- DO NOT skip any required fields in the template

You MUST follow this EXACT template structure:

${template}

IMPORTANT REQUIREMENTS:
1. Section 2 must list ONLY barriers with evidence - NO accommodations
2. Section 3 must include ALL subsections (3.1, 3.2, 3.3, 3.4) with proper accommodation format
3. Each accommodation MUST include: Name, Barriers Addressed, Evidence Base, and Implementation Notes
4. If no accommodations for a subsection, write "**None at this time.**"

Follow the template EXACTLY as shown above.`
            },
            {
              role: 'user',
              content: `Fix this report to follow the correct template structure:\n\n${markdownReport}\n\nRemember: Section 2 is ONLY barriers, Section 3 is ONLY accommodations. Keep them completely separate.`
            }
          ],
          max_tokens: 4500,
          temperature: 0.1
        });
        
        markdownReport = fixedResponse.choices[0].message.content || markdownReport;
        console.log('✅ Template enforcement correction applied');
        console.log(`📄 Fixed report preview (first 200 chars): ${markdownReport.substring(0, 200)}`);
      } else {
        console.log('✅ No template violations detected, proceeding with original report');
      }
      
      // Demo Mode Enhancement: Flag functional impairment 3 for review in demo mode only
      if (currentEnv === 'post-secondary-demo' && moduleType === 'post_secondary') {
        console.log('🔍 Demo Mode: Adding review flag to functional impairment 3...');
        
        // Parse the markdown report to find functional barriers
        const barrierPattern = /\*\*(\d+):\*\*\s*([^*]+?)(?=Evidence:|$)/g;
        let match;
        let barrierCount = 0;
        let modifiedReport = markdownReport || '';
        
        // Find barrier 3 and add review flag
        while ((match = barrierPattern.exec(markdownReport)) !== null) {
          const barrierNumber = parseInt(match[1]);
          if (barrierNumber === 3) {
            console.log('✅ Found functional barrier 3, adding review flag...');
            
            // Add review flag marker to barrier 3
            const flaggedBarrierText = `**3:** ${match[2].trim()} *(Flagged for Review - Demo Mode)*`;
            modifiedReport = modifiedReport.replace(match[0], flaggedBarrierText);
            
            console.log('📝 Barrier 3 flagged for review in demo mode');
            break;
          }
        }
        
        markdownReport = modifiedReport;
      }

      // Create result structure
      const result = {
        status: 'completed',
        analysis_date: new Date().toISOString(),
        markdown_report: markdownReport,
        module_type: moduleType,
        item_master_data: [], // Simple pathway - no structured data
        processing_method: 'simple_pathway',
        template_used: template.length > 0,
        template_violations: templateViolations,
        demo_flags: currentEnv === 'post-secondary-demo' ? ['functional_barrier_3_flagged'] : []
      };
      
      console.log('✅ Simple analysis completed successfully');
      console.log(`- Status: ${result.status}`);
      console.log(`- Report Length: ${result.markdown_report?.length || 0} chars`);
      console.log(`- Processing Method: ${result.processing_method}`);
      console.log(`- Template Used: ${result.template_used}`);
      
      // Save the analysis result to the database
      try {
        console.log('💾 Saving analysis result to database...');
        
        // Create the assessment case if it doesn't exist
        const caseData = {
          case_id: caseId,
          display_name: uniqueId || documents[0]?.filename || (moduleType === 'k12' ? 'K-12 Analysis' : 'Post-Secondary Analysis'),
          module_type: moduleType,
          grade_band: studentGrade,
          status: 'completed',
          documentNames: documents.map((d: any) => d.filename || d.name || `document_${documents.indexOf(d) + 1}.txt`).filter(Boolean)
        };
        
        // Simplified save approach - create case with report data in one operation
        console.log('Creating assessment case with report data...');
        
        // Create backup when first generating report
        const reportDataWithBackup = {
          ...result,
          backup_report: result.markdown_report || result,
          is_edited: false
        };

        const caseWithReport = {
          id: crypto.randomUUID(),
          case_id: caseId,
          display_name: uniqueId || caseData.display_name,
          module_type: moduleType,
          status: 'completed',
          grade_band: studentGrade,
          documentNames: documents.map((d: any) => d.filename || d.name || `document_${documents.indexOf(d) + 1}.txt`).filter(Boolean),
          report_data: reportDataWithBackup,
          // Add the missing new fields
          unique_id: uniqueId?.trim() || null,
          program_major: programMajor?.trim() || null,
          report_author: reportAuthor?.trim() || null
        };
        
        // Use direct SQL to create case with report data in one transaction
        const createdId = await createAssessmentCaseDirectly(caseWithReport);
        
        if (createdId) {
          console.log('✅ Assessment case created with report data:', createdId);
        } else {
          console.log('⚠️ Failed to save assessment case, but analysis completed');
        }
        
        console.log('✅ Analysis result saved to database successfully');
      } catch (dbError) {
        console.error('⚠️ Failed to save to database:', dbError);
        // Continue anyway - the analysis is complete
      }
      
      res.json(result);
      
    } catch (error: any) {
      console.error('❌ Simple analysis failed:', error);
      res.status(500).json({ 
        status: 'error',
        error: error.message,
        analysis_date: new Date().toISOString(),
        processing_method: 'simple_pathway'
      });
    }
  });

  // NEW: K-12 Complex Analysis Route
  app.post('/api/analyze-assessment-k12', async (req: Request, res: Response) => {
    console.log('🎯 K-12 Complex Analysis endpoint called');
    
    const { caseId, documents, studentGrade, uniqueId, programMajor, reportAuthor } = req.body;
    
    // This is a K-12-specific endpoint, no need to check moduleType

    try {
      // Use the AI service which implements the complex three-step workflow
      const aiService = new LocalAIService();
      
      const analysisRequest: AIAnalysisRequest = {
        caseId,
        moduleType: 'k12',
        documents,
        uniqueId,
        programMajor,
        reportAuthor,
        studentGrade
      };

      console.log('🔄 Processing K-12 analysis with complex workflow...');
      
      // Create the assessment case FIRST before running analysis
      const caseData = {
        id: caseId,
        case_id: caseId,
        display_name: uniqueId || documents[0]?.filename || 'K-12 Analysis',
        module_type: 'k12',
        status: 'processing',
        grade_band: studentGrade,
        documentNames: documents.map((d: any) => d.filename || d.name || `document_${documents.indexOf(d) + 1}.txt`).filter(Boolean),
        report_data: null
      };
      
      const createdCaseId = await createAssessmentCaseDirectly(caseData);
      
      if (!createdCaseId) {
        console.error('Failed to create assessment case');
        return res.status(500).json({ error: 'Failed to create assessment case' });
      }
      
      console.log('✅ Assessment case created:', createdCaseId);
      
      // Now run the analysis with the case already created
      // This will use function calling and the three-step process:
      // 1. Technical Weakness Identification
      // 2. Canonical Key Resolution
      // 3. Item Master Population
      const result = await aiService.processAnalysis(analysisRequest);

      // For K-12, we should generate the markdown report FROM the database item master data
      if (result.status === 'completed') {
        console.log('📝 Generating K-12 report from database item master data...');
        
        // Get the K-12 report template
        const reportTemplates = await storage.getPromptSections('k12', 'report_format');
        const k12Template = reportTemplates.find(p => 
          p.section_key === 'markdown_report_template_k12'
        );

        // Get item master data from database after AI processing
        const itemMasterData = await db.select()
          .from(itemMaster)
          .where(eq(itemMaster.assessmentCaseId, caseId));
        
        console.log(`🗄️ Retrieved ${itemMasterData.length} item master records from database for report generation`);

        // Generate markdown from actual database item master data
        const markdownReport = await generateK12ReportFromItemMaster(
          itemMasterData,
          k12Template?.content || '',
          studentGrade
        );

        result.markdown_report = markdownReport;
      }

      // Update the assessment case with the completed report
      // Create backup when first generating report
      const reportDataWithBackup = {
        ...result,
        backup_report: result.markdown_report || result,
        is_edited: false
      };

      await storage.updateAssessmentCase(caseId, {
        status: 'completed',
        report_data: reportDataWithBackup
      });
      
      // Now save the item master data to the database
      if (result.item_master_data && result.item_master_data.length > 0) {
        console.log(`💾 Saving ${result.item_master_data.length} item master entries to database...`);
        
        try {
          await saveItemMasterDataToDatabase(result.item_master_data, caseId, studentGrade);
          console.log('✅ Item master data saved to database');
        } catch (dbError) {
          console.error('⚠️ Failed to save item master data to database:', dbError);
          // Continue anyway - the analysis is complete
        }
      }

      console.log('✅ K-12 complex analysis completed');
      return res.json(result);

    } catch (error: any) {
      console.error('❌ K-12 complex analysis failed:', error);
      return res.status(500).json({ 
        error: 'K-12 analysis failed', 
        details: error.message 
      });
    }
  });

  // Get all assessment cases
  app.get("/api/assessment-cases", async (req, res) => {
    try {
      const moduleType = req.query.moduleType as string;
      if (moduleType) {
        const cases = await storage.getAssessmentCases(moduleType);
        res.json(cases);
      } else {
        // Get all cases if no module type specified
        const postSecondaryCases = await storage.getAssessmentCases('post_secondary');
        const k12Cases = await storage.getAssessmentCases('k12');
        res.json([...postSecondaryCases, ...k12Cases]);
      }
    } catch (error: any) {
      console.error('Error fetching assessment cases:', error);
      res.json([]);
    }
  });

  // Version Management Routes
  app.post("/api/assessment-cases/:id/finalize", async (req, res) => {
    try {
      const { id } = req.params;
      const { content, changesSummary } = req.body;
      
      console.log(`Finalizing report for case: ${id}`);
      const result = await storage.finalizeReport(id, content, changesSummary || []);
      
      res.json({ 
        success: true, 
        version: result.report_data?.currentVersion,
        finalized: true 
      });
    } catch (error: any) {
      console.error('Error finalizing report:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/assessment-cases/:id/versions", async (req, res) => {
    try {
      const { id } = req.params;
      
      console.log(`Getting versions for case: ${id}`);
      const versions = await storage.getReportVersions(id);
      
      // Debug: Log the actual versions data structure
      console.log('🔍 DEBUG: Versions response structure:', {
        hasVersions: !!versions,
        versionsType: typeof versions,
        versionsKeys: versions ? Object.keys(versions) : 'none',
        currentVersion: versions?.currentVersion,
        versionsArray: versions?.versions,
        versionsArrayLength: versions?.versions?.length || 0,
        isFinalized: versions?.isFinalized,
        firstVersionSample: versions?.versions?.[0]
      });
      
      res.json(versions);
    } catch (error: any) {
      console.error('Error getting report versions:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/assessment-cases/:id/switch-version", async (req, res) => {
    try {
      const { id } = req.params;
      const { version } = req.body;
      
      console.log(`Switching to version ${version} for case: ${id}`);
      const result = await storage.switchToVersion(id, version);
      
      const content = result.report_data?.markdown_report || '';
      console.log(`📄 Returning content for version ${version}: ${content.substring(0, 100)}...`);
      
      res.json({ 
        success: true, 
        currentVersion: version,
        content: content
      });
    } catch (error: any) {
      console.error('Error switching version:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // K12-specific change approval endpoints
  app.post("/api/k12-assessment-cases/approve-change", async (req, res) => {
    try {
      const { caseId, changeId, action } = req.body;
      console.log(`K12: Approving change ${changeId} for case: ${caseId}`);
      
      // Get existing case - for K12 we know it should be in the k12 module
      const k12Cases = await storage.getAssessmentCases('k12');
      const existingCase = k12Cases.find(c => c.id === caseId);
      
      if (!existingCase) {
        console.log(`❌ K12 Case ${caseId} not found`);
        return res.status(404).json({ error: "K12 assessment case not found" });
      }

      const editChanges = existingCase.report_data?.edit_changes || [];
      
      // Debug: Log the actual report_data structure
      console.log(`📊 Debug report_data structure for case ${caseId}:`, {
        hasReportData: !!existingCase.report_data,
        reportDataKeys: existingCase.report_data ? Object.keys(existingCase.report_data) : [],
        editChangesType: typeof existingCase.report_data?.edit_changes,
        editChangesLength: editChanges.length,
        editChangesContent: editChanges.slice(0, 2), // Show first 2 changes for debugging
        lookingForChangeId: changeId
      });

      const changeToApprove = editChanges.find((change: any) => change.id === changeId);
      
      if (!changeToApprove) {
        console.log(`❌ Change ${changeId} not found in ${editChanges.length} available changes`);
        console.log(`📋 Available change IDs:`, editChanges.map((c: any) => c.id));
        return res.status(404).json({ error: "Change not found" });
      }

      // Update the change status to 'approved'
      const updatedChanges = editChanges.map((change: any) => 
        change.id === changeId ? { ...change, status: 'approved' } : change
      );

      // Update report data with approved status
      const updatedReportData = {
        ...(existingCase.report_data || {}),
        edit_changes: updatedChanges,
        last_updated: new Date().toISOString()
      };

      // Update the case using direct SQL
      const { pool } = await import('./db');
      await pool.query(
        `UPDATE assessment_cases 
         SET report_data = $1, last_updated = NOW() 
         WHERE id = $2`,
        [JSON.stringify(updatedReportData), caseId]
      );

      console.log(`✅ K12 change ${changeId} approved successfully`);
      res.json({ 
        success: true, 
        message: "Change approved successfully"
      });
    } catch (error) {
      console.error("Error approving K12 change:", error);
      res.status(500).json({ error: "Failed to approve change" });
    }
  });

  app.post("/api/k12-assessment-cases/reject-change", async (req, res) => {
    try {
      const { caseId, changeId, action } = req.body;
      console.log(`K12: Rejecting change ${changeId} for case: ${caseId}`);
      
      // Get existing case - for K12 we know it should be in the k12 module
      const k12Cases = await storage.getAssessmentCases('k12');
      const existingCase = k12Cases.find(c => c.id === caseId);
      
      if (!existingCase) {
        console.log(`❌ K12 Case ${caseId} not found`);
        return res.status(404).json({ error: "K12 assessment case not found" });
      }

      const editChanges = existingCase.report_data?.edit_changes || [];
      const changeToReject = editChanges.find((change: any) => change.id === changeId);
      
      if (!changeToReject) {
        console.log(`❌ Change ${changeId} not found in ${editChanges.length} available changes`);
        return res.status(404).json({ error: "Change not found" });
      }

      // Update the change status to 'rejected'
      const updatedChanges = editChanges.map((change: any) => 
        change.id === changeId ? { ...change, status: 'rejected' } : change
      );

      // Update report data with rejected status
      const updatedReportData = {
        ...(existingCase.report_data || {}),
        edit_changes: updatedChanges,
        last_updated: new Date().toISOString()
      };

      // Update the case using direct SQL
      const { pool } = await import('./db');
      await pool.query(
        `UPDATE assessment_cases 
         SET report_data = $1, last_updated = NOW() 
         WHERE id = $2`,
        [JSON.stringify(updatedReportData), caseId]
      );

      console.log(`✅ K12 change ${changeId} rejected successfully`);
      res.json({ 
        success: true, 
        message: "Change rejected successfully"
      });
    } catch (error) {
      console.error("Error rejecting K12 change:", error);
      res.status(500).json({ error: "Failed to reject change" });
    }
  });

  // K12-specific edit endpoint (routes to generic edit logic)
  app.post("/api/k12-assessment-cases/edit", async (req, res) => {
    console.log("📝 K12-specific edit endpoint called, routing to generic edit logic");
    
    // Route to the generic edit endpoint logic
    const { caseId, changes, status, reportContent, createBackup } = req.body;
    console.log(`💾 K12 Edit - Updating assessment case: ${caseId}`, {
      hasChanges: !!changes,
      changesCount: changes?.length || 0,
      hasReportContent: !!reportContent,
      reportContentLength: reportContent?.length || 0,
      createBackup
    });
    
    try {
      // Get existing case - for K12 we know it should be in the k12 module
      const k12Cases = await storage.getAssessmentCases('k12');
      const existingCase = k12Cases.find(c => c.id === caseId);
      
      if (!existingCase) {
        console.log(`❌ K12 Case ${caseId} not found`);
        return res.status(404).json({ error: "K12 assessment case not found" });
      }

      console.log(`📋 K12 Existing case data:`, {
        hasReportData: !!existingCase.report_data,
        hasMarkdownReport: !!existingCase.report_data?.markdown_report,
        hasBackupReport: !!existingCase.report_data?.backup_report,
        isEdited: existingCase.report_data?.is_edited
      });

      // Create backup if it doesn't exist and we're creating one
      const originalContent = existingCase.report_data?.markdown_report;
      const backupContent = existingCase.report_data?.backup_report || originalContent;
      
      const updatedReportData = {
        ...(existingCase.report_data || {}),
        markdown_report: reportContent || originalContent,
        backup_report: backupContent,
        last_edited: new Date().toISOString(),
        edit_changes: changes,
        is_edited: true
      };

      console.log(`💾 K12 Updated report data:`, {
        hasMarkdownReport: !!updatedReportData.markdown_report,
        markdownLength: updatedReportData.markdown_report?.length || 0,
        hasBackupReport: !!updatedReportData.backup_report,
        backupLength: updatedReportData.backup_report?.length || 0,
        isEdited: updatedReportData.is_edited,
        changesCount: updatedReportData.edit_changes?.length || 0
      });

      // Update the case using direct SQL
      const { pool } = await import('./db');
      await pool.query(
        `UPDATE assessment_cases 
         SET report_data = $1, last_updated = NOW() 
         WHERE id = $2`,
        [JSON.stringify(updatedReportData), caseId]
      );

      console.log(`✅ K12 changes saved successfully`);
      res.json({ success: true, message: "K12 changes saved successfully" });
    } catch (error) {
      console.error("Error updating K12 assessment case:", error);
      res.status(500).json({ error: "Failed to update K12 assessment case" });
    }
  });

  // Get assessment reports from database
  app.get('/api/assessment-reports/:moduleType', async (req: Request, res: Response) => {
    const { moduleType } = req.params;
    console.log(`API Route hit: GET /assessment-reports/${moduleType}`);
    
    try {
      // Use direct database query instead of Database
      const reports = await db
        .select()
        .from(assessmentCases)
        .where(and(
          eq(assessmentCases.moduleType, moduleType),
          eq(assessmentCases.status, 'completed')
        ))
        .orderBy(desc(assessmentCases.createdDate))
        .limit(10);
      
      console.log(`Found ${reports.length} reports for module ${moduleType}`);
      res.json(reports);
    } catch (error) {
      console.error('Error fetching assessment reports:', error);
      res.status(500).json({ error: 'Failed to fetch assessment reports' });
    }
  });

  // Case-specific item master data endpoint
  app.get("/api/case-item-master/:caseId/:moduleType", async (req, res) => {
    try {
      const { caseId, moduleType } = req.params;
      console.log(`Fetching item master data for case: ${caseId}, module: ${moduleType}`);
      
      // Query item master data from database for this specific case
      const itemMasterData = await storage.getItemMasterData?.(caseId, moduleType) || [];
      
      console.log(`Found ${itemMasterData.length} item master records for case ${caseId}`);
      res.json(itemMasterData);
    } catch (error: any) {
      console.error('Error fetching case item master data:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Post-secondary item master endpoint
  app.get("/api/post-secondary-item-master", async (req, res) => {
    try {
      const itemMasterData = await storage.getPostSecondaryItemMaster?.() || [];
      console.log(`Found ${itemMasterData.length} post-secondary item master records`);
      res.json(itemMasterData);
    } catch (error: any) {
      console.error('Error fetching post-secondary item master data:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Prompt Sections - Direct database query with proper transformation
  app.get("/api/prompt-sections", async (req, res) => {
    try {
      const moduleType = req.query.moduleType as string || 'post_secondary';
      const promptType = req.query.promptType as string | undefined;
      console.log(`DEBUG: Fetching prompt sections from database for: ${moduleType}, type: ${promptType || 'all'}`);
      
      const sections = await storage.getPromptSections(moduleType, promptType);
      console.log(`DEBUG: Found ${sections.length} prompt sections in database`);
      
      if (sections.length === 0) {
        console.log(`DEBUG: No sections found, returning empty array`);
        res.json([]);
        return;
      }
      
      // Transform database results to match frontend expectations
      const transformedSections = sections.map((section: any, index: number) => ({
        id: String(index + 1),
        section_key: section.section_key,
        section_name: section.section_name || `${section.section_key.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}`,
        content: section.content,
        version: section.version || '1.0',
        module_type: section.module_type,
        prompt_type: section.prompt_type,
        created_at: section.created_at,
        last_updated: section.last_updated
      }));
      
      console.log(`DEBUG: Returning ${transformedSections.length} prompt sections for ${moduleType}`);
      console.log(`DEBUG: Section keys: ${transformedSections.map(s => s.section_key).join(', ')}`);
      res.json(transformedSections);
    } catch (error: any) {
      console.error(`ERROR: Failed to fetch prompt sections for ${req.query.moduleType}:`, error);
      res.status(500).json({ error: error.message });
    }
  });

  // Prompt Sections - Path parameter format for backward compatibility
  app.get("/api/prompt-sections/:moduleType", async (req, res) => {
    try {
      const { moduleType } = req.params;
      console.log(`DEBUG: Fetching prompt sections from database for: ${moduleType}`);
      
      const sections = await storage.getPromptSections(moduleType);
      console.log(`DEBUG: Found ${sections.length} prompt sections in database`);
      
      if (sections.length === 0) {
        console.log(`DEBUG: No sections found, returning empty array`);
        res.json([]);
        return;
      }
      
      // Transform database results to match frontend expectations
      const transformedSections = sections.map((section: any, index: number) => ({
        id: String(index + 1),
        section_key: section.section_key,
        section_name: section.section_name || `${section.section_key.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}`,
        content: section.content,
        version: section.version || '1.0',
        module_type: section.module_type,
        created_at: section.created_at,
        last_updated: section.last_updated
      }));
      
      console.log(`DEBUG: Returning ${transformedSections.length} prompt sections for ${moduleType}`);
      console.log(`DEBUG: Section keys: ${transformedSections.map(s => s.section_key).join(', ')}`);
      
      // Add cache-busting headers to ensure frontend gets fresh data
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'ETag': `"${Date.now()}"` // Force fresh response
      });
      
      res.json(transformedSections);
    } catch (error: any) {
      console.error(`ERROR: Failed to fetch prompt sections for ${req.params.moduleType}:`, error);
      res.status(500).json({ error: error.message });
    }
  });

  // Update prompt section
  app.patch("/api/prompt-sections/:sectionKey", async (req, res) => {
    try {
      const { sectionKey } = req.params;
      const { content, promptType } = req.body;
      console.log(`Updating prompt section: ${sectionKey}, type: ${promptType || 'not specified'}`);
      const section = await storage.updatePromptSection(sectionKey, content, promptType);
      res.json(section);
    } catch (error: any) {
      console.error('Error updating prompt section:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Save prompt section (PUT for create/update)
  app.put("/api/prompt-sections/:sectionKey", async (req, res) => {
    try {
      const { sectionKey } = req.params;
      const { content, module_type, execution_order, is_system_prompt } = req.body;
      console.log(`Saving prompt section: ${sectionKey}, module: ${module_type || 'post_secondary'}`);
      
      // Use updatePromptSection for now - it handles both create and update
      const section = await storage.updatePromptSection(sectionKey, content);
      res.json(section);
    } catch (error: any) {
      console.error('Error saving prompt section:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Add missing API endpoints
  app.get("/api/lookup-tables/:moduleType", async (req, res) => {
    try {
      const { moduleType } = req.params;
      const tables = await storage.getLookupTables(moduleType);
      res.json(tables);
    } catch (error: any) {
      console.error('Error fetching lookup tables:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/ai-config", async (req, res) => {
    try {
      const config = await storage.getAiConfig();
      res.json(config);
    } catch (error: any) {
      console.error('Error fetching AI config:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/barrier-glossary/:moduleType", async (req, res) => {
    try {
      const { moduleType } = req.params;
      const glossary = await storage.getBarrierGlossary(moduleType);
      res.json(glossary);
    } catch (error: any) {
      console.error('Error fetching barrier glossary:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/inference-triggers/:moduleType", async (req, res) => {
    try {
      const { moduleType } = req.params;
      const triggers = await storage.getInferenceTriggers(moduleType);
      res.json(triggers);
    } catch (error: any) {
      console.error('Error fetching inference triggers:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/plain-language-mappings/:moduleType", async (req, res) => {
    try {
      const { moduleType } = req.params;
      const mappings = await storage.getPlainLanguageMappings(moduleType);
      res.json(mappings);
    } catch (error: any) {
      console.error('Error fetching plain language mappings:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/mapping-configurations/:moduleType", async (req, res) => {
    try {
      const { moduleType } = req.params;
      const configurations = await storage.getMappingConfigurations(moduleType);
      res.json(configurations);
    } catch (error: any) {
      console.error('Error fetching mapping configurations:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Environment switching endpoint
  app.get("/api/environment", async (req, res) => {
    try {
      const currentEnv = process.env.APP_ENVIRONMENT || 'replit-prod';
      console.log(`🌍 Current environment: ${currentEnv}`);
      res.json({ environment: currentEnv });
    } catch (error: any) {
      console.error('Error getting environment:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/environment", async (req, res) => {
    try {
      const { environment } = req.body;
      
      if (!['replit-prod', 'replit-dev', 'post-secondary-demo', 'k12-demo', 'tutoring-demo', 'tutoring'].includes(environment)) {
        return res.status(400).json({ error: 'Invalid environment' });
      }
      
      // Update the environment variable
      process.env.APP_ENVIRONMENT = environment;
      
      // Map demo environments to their respective databases
      let dbEnvironment = environment;
      if (environment === 'post-secondary-demo') {
        dbEnvironment = 'replit-prod';
      } else if (environment === 'k12-demo') {
        dbEnvironment = 'k12-demo'; // K-12 demo gets its own database
      } else if (environment === 'tutoring-demo') {
        dbEnvironment = 'replit-prod'; // Tutoring demo uses main database
      } else if (environment === 'tutoring') {
        dbEnvironment = 'replit-prod'; // Tutoring production uses main database
      }
      
      // Reinitialize storage with new environment
      const { reinitializeStorage } = await import('./storage');
      await reinitializeStorage(dbEnvironment);
      
      // Reinitialize database connection for environment-specific databases
      const { reinitializeDatabase } = await import('./db');
      reinitializeDatabase();
      
      res.json({ 
        success: true, 
        environment,
        message: `Switched to ${environment} environment`
      });
    } catch (error: any) {
      console.error('Error switching environment:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Update assessment case report content
  app.post("/api/assessment-cases/edit", async (req, res) => {
    try {
      const { caseId, changes, status, reportContent, createBackup } = req.body;
      console.log(`💾 Updating assessment case: ${caseId}`, {
        hasChanges: !!changes,
        changesCount: changes?.length || 0,
        hasReportContent: !!reportContent,
        reportContentLength: reportContent?.length || 0,
        createBackup
      });
      
      // Get existing case - check both module types to find the case
      const postSecondaryCases = await storage.getAssessmentCases('post_secondary');
      const k12Cases = await storage.getAssessmentCases('k12');
      const allCases = [...postSecondaryCases, ...k12Cases];
      const existingCase = allCases.find(c => c.id === caseId);
      
      console.log(`🔍 Looking for case ${caseId} in ${allCases.length} total cases`);
      
      if (!existingCase) {
        console.log(`❌ Case ${caseId} not found in ${allCases.length} cases`);
        return res.status(404).json({ error: "Assessment case not found" });
      }

      console.log(`📋 Existing case data:`, {
        hasReportData: !!existingCase.report_data,
        hasMarkdownReport: !!existingCase.report_data?.markdown_report,
        hasBackupReport: !!existingCase.report_data?.backup_report,
        isEdited: existingCase.report_data?.is_edited
      });

      // Create backup if it doesn't exist and we're creating one
      const originalContent = existingCase.report_data?.markdown_report;
      const backupContent = existingCase.report_data?.backup_report || originalContent;
      
      const updatedReportData = {
        ...(existingCase.report_data || {}),
        markdown_report: reportContent || originalContent,
        backup_report: backupContent,
        last_edited: new Date().toISOString(),
        edit_changes: changes,
        is_edited: true
      };

      console.log(`💾 Updated report data:`, {
        hasMarkdownReport: !!updatedReportData.markdown_report,
        markdownLength: updatedReportData.markdown_report?.length || 0,
        hasBackupReport: !!updatedReportData.backup_report,
        backupLength: updatedReportData.backup_report?.length || 0,
        isEdited: updatedReportData.is_edited
      });

      // Update the case using direct SQL
      const { pool } = await import('./db');
      await pool.query(
        `UPDATE assessment_cases 
         SET report_data = $1, last_updated = NOW() 
         WHERE id = $2`,
        [JSON.stringify(updatedReportData), caseId]
      );

      res.json({ success: true, message: "Changes saved successfully" });
    } catch (error) {
      console.error("Error updating assessment case:", error);
      res.status(500).json({ error: "Failed to update assessment case" });
    }
  });

  // Restore assessment case to original backup
  app.post("/api/assessment-cases/restore", async (req, res) => {
    try {
      const { caseId } = req.body;
      console.log(`Restoring assessment case to backup: ${caseId}`);
      
      // Get existing case - check both module types to find the case
      const postSecondaryCases = await storage.getAssessmentCases('post_secondary');
      const k12Cases = await storage.getAssessmentCases('k12');
      const allCases = [...postSecondaryCases, ...k12Cases];
      const existingCase = allCases.find(c => c.id === caseId);
      
      console.log(`🔍 Looking for case ${caseId} in ${allCases.length} total cases`);
      
      if (!existingCase) {
        console.log(`❌ Case ${caseId} not found in ${allCases.length} cases`);
        return res.status(404).json({ error: "Assessment case not found" });
      }

      if (!existingCase.report_data?.backup_report) {
        return res.status(400).json({ error: "No backup available for this report" });
      }

      // Restore from backup
      const restoredReportData = {
        ...(existingCase.report_data || {}),
        markdown_report: existingCase.report_data.backup_report,
        last_restored: new Date().toISOString(),
        is_edited: false,
        edit_changes: []
      };

      // Update the case using direct SQL
      const { pool } = await import('./db');
      await pool.query(
        `UPDATE assessment_cases 
         SET report_data = $1, last_updated = NOW() 
         WHERE id = $2`,
        [JSON.stringify(restoredReportData), caseId]
      );

      res.json({ success: true, message: "Report restored to original version" });
    } catch (error) {
      console.error("Error restoring assessment case:", error);
      res.status(500).json({ error: "Failed to restore assessment case" });
    }
  });

  app.post("/api/assessment-cases/revert-change", async (req, res) => {
    try {
      const { caseId, changeId } = req.body;
      console.log(`🔄 Reverting specific change ${changeId} for case: ${caseId}`);
      
      // Get existing case - check both module types to find the case
      const postSecondaryCases = await storage.getAssessmentCases('post_secondary');
      const k12Cases = await storage.getAssessmentCases('k12');
      const allCases = [...postSecondaryCases, ...k12Cases];
      const existingCase = allCases.find(c => c.id === caseId);
      
      if (!existingCase) {
        console.log(`❌ Case ${caseId} not found`);
        return res.status(404).json({ error: "Assessment case not found" });
      }

      const editChanges = existingCase.report_data?.edit_changes || [];
      console.log(`📋 Available changes in case:`, {
        totalChanges: editChanges.length,
        changeIds: editChanges.map((c: any) => c.id),
        lookingFor: changeId
      });
      
      const changeToRevert = editChanges.find((change: any) => change.id === changeId);
      
      if (!changeToRevert) {
        console.log(`❌ Change ${changeId} not found in ${editChanges.length} available changes`);
        return res.status(404).json({ 
          error: "Change not found",
          availableChanges: editChanges.map((c: any) => ({
            id: c.id,
            type: c.type,
            timestamp: c.timestamp
          }))
        });
      }

      if (!changeToRevert.oldContent) {
        return res.status(400).json({ error: "Cannot revert change - no previous content available" });
      }

      console.log(`📝 Reverting change in section: ${changeToRevert.sectionId}`);
      
      // Get current content and apply reversion
      let currentContent = existingCase.report_data?.markdown_report || '';
      
      // Replace the new content with the old content
      if (changeToRevert.newContent && changeToRevert.oldContent) {
        // Find and replace the new content with the old content
        const newContentLines = changeToRevert.newContent.split('\n');
        const oldContentLines = changeToRevert.oldContent.split('\n');
        
        // Try to find a unique section to replace
        // This is a simplified approach - in a real system you'd want more sophisticated diff/patch logic
        if (currentContent.includes(changeToRevert.newContent)) {
          currentContent = currentContent.replace(changeToRevert.newContent, changeToRevert.oldContent);
        } else {
          // Fallback: try line-by-line replacement for partial matches
          for (let i = 0; i < newContentLines.length && i < oldContentLines.length; i++) {
            if (newContentLines[i].trim() && currentContent.includes(newContentLines[i])) {
              currentContent = currentContent.replace(newContentLines[i], oldContentLines[i]);
            }
          }
        }
      }

      // Remove the reverted change from edit_changes array
      const updatedChanges = editChanges.filter((change: any) => change.id !== changeId);
      
      // Add a reversion record
      const reversionRecord = {
        id: Date.now().toString(),
        type: 'revert',
        timestamp: new Date().toISOString(),
        sectionId: changeToRevert.sectionId,
        sectionTitle: changeToRevert.sectionTitle,
        revertedChangeId: changeId,
        user: 'system'
      };
      
      updatedChanges.push(reversionRecord);

      // Update report data
      const updatedReportData = {
        ...(existingCase.report_data || {}),
        markdown_report: currentContent,
        last_edited: new Date().toISOString(),
        edit_changes: updatedChanges,
        is_edited: updatedChanges.filter((c: any) => c.type !== 'revert').length > 0
      };

      console.log(`💾 Updated report data:`, {
        hasMarkdownReport: !!updatedReportData.markdown_report,
        markdownLength: updatedReportData.markdown_report?.length || 0,
        changesCount: updatedChanges.length,
        isEdited: updatedReportData.is_edited
      });

      // Update the case using direct SQL
      const { pool } = await import('./db');
      await pool.query(
        `UPDATE assessment_cases 
         SET report_data = $1, last_updated = NOW() 
         WHERE id = $2`,
        [JSON.stringify(updatedReportData), caseId]
      );

      res.json({ 
        success: true, 
        message: "Change reverted successfully",
        remainingChanges: updatedChanges.length
      });
    } catch (error) {
      console.error("Error reverting change:", error);
      res.status(500).json({ error: "Failed to revert change" });
    }
  });

  // Environment configuration endpoint
  app.get('/api/config/environment', (req: Request, res: Response) => {
    console.log(`🌍 Environment config requested`);
    const currentEnv = process.env.APP_ENVIRONMENT || process.env.NODE_ENV || 'production';
    const normalized = currentEnv.toLowerCase().replace(/_/g, '-').trim();
    
    // Determine if this should be a locked environment
    const lockedEnvironments = ['post-secondary-demo', 'k12-demo', 'tutoring-demo', 'post-secondary-dev'];
    const isLocked = lockedEnvironments.includes(normalized);
    
    res.json({ 
      environment: normalized,
      rawEnvironment: currentEnv,
      isLocked,
      module: normalized.includes('post-secondary') ? 'post_secondary' : 
              normalized.includes('k12') ? 'k12' : 
              normalized.includes('tutoring') ? 'tutoring' : null
    });
  });

  // Register no-cache routes only (alternative routes disabled to use simple pathway)
  registerNoCacheRoutes(app);

  const server = createServer(app);
  return server;
}

// Helper function to validate item master data fields
function validateItemMasterFields(item: any): {
  isValid: boolean;
  missingFields: string[];
  warnings: string[];
} {
  const requiredFields = ['canonical_key', 'evidence_basis'];
  const recommendedFields = [
    'item_label', 
    'parent_friendly_label', 
    'classroom_observation', 
    'support_1', 
    'support_2', 
    'caution_note'
  ];
  
  const missingRequired = requiredFields.filter(field => !item[field]);
  const missingRecommended = recommendedFields.filter(field => !item[field]);
  
  return {
    isValid: missingRequired.length === 0,
    missingFields: missingRequired,
    warnings: missingRecommended
  };
}

// Helper function to generate K-12 report from item master data
async function generateK12ReportFromItemMaster(
  itemMasterData: any[],
  template: string,
  studentGrade: string
): Promise<string> {
  console.log('📝 Generating K-12 report from item master data...');
  console.log(`- Item count: ${itemMasterData.length}`);
  console.log(`- Grade: ${studentGrade}`);
  console.log(`- Template length: ${template.length}`);
  
  // Validate item master data
  const validationResults = itemMasterData.map(item => ({
    item,
    validation: validateItemMasterFields(item)
  }));
  
  const invalidItems = validationResults.filter(r => !r.validation.isValid);
  if (invalidItems.length > 0) {
    console.warn('⚠️ Some items have missing required fields:');
    invalidItems.forEach(({ item, validation }) => {
      console.warn(`  - ${item.canonical_key || 'Unknown'}: missing ${validation.missingFields.join(', ')}`);
    });
  }

  // If we have a template from the database, use it with proper data population
  if (template && template.length > 0) {
    console.log('✅ Using database template for K-12 report generation');
    
    // Parse the template and populate with actual data
    let populatedTemplate = template;
    
    // Replace basic placeholders
    populatedTemplate = populatedTemplate.replace(/\[Date\]/g, new Date().toLocaleDateString());
    populatedTemplate = populatedTemplate.replace(/\[Grade Level\]/g, studentGrade);
    populatedTemplate = populatedTemplate.replace(/\[Grade\]/g, studentGrade);
    populatedTemplate = populatedTemplate.replace(/\[Total Count\]/g, itemMasterData.length.toString());
    populatedTemplate = populatedTemplate.replace(/\[Total count\]/g, itemMasterData.length.toString());
    
    // Count items by quality control status
    const validatedItems = itemMasterData.filter(item => 
      item.resolution_method === 'exact_match' || item.validation_status === 'validated'
    );
    const reviewItems = itemMasterData.filter(item => 
      item.validation_status === 'partial_inference' || item.resolution_method === 'ai_resolved' || item.validation_status === 'full_inference'
    );
    const flaggedItems = itemMasterData.filter(item => 
      item.validation_status === 'flagged'
    );
    
    populatedTemplate = populatedTemplate.replace(/\[Validated Count\]/g, validatedItems.length.toString());
    populatedTemplate = populatedTemplate.replace(/\[Validated count\]/g, validatedItems.length.toString());
    populatedTemplate = populatedTemplate.replace(/\[Review Count\]/g, reviewItems.length.toString());
    populatedTemplate = populatedTemplate.replace(/\[Review count\]/g, reviewItems.length.toString());
    populatedTemplate = populatedTemplate.replace(/\[Flagged Count\]/g, flaggedItems.length.toString());
    populatedTemplate = populatedTemplate.replace(/\[Flagged count\]/g, flaggedItems.length.toString());
    
    // Generate detailed findings sections
    const generateFindingSection = (items: any[]) => {
      if (items.length === 0) return 'No items in this category.';
      
      return items.map((item, index) => {
        // Helper function to mark inferred fields
        const markInferredField = (value: string, isInferred: boolean) => {
          if (isInferred && value && value !== 'Assessment data indicates this area of need') {
            return `${value} *(AI-generated)*`;
          }
          return value;
        };

        // Determine if fields are inferred based on validation status
        const isInferred = item.validation_status === 'partial_inference' || item.validation_status === 'full_inference';
        
        return `#### ${index + 1}. ${item.canonical_key || item.item_label || 'Unknown Item'}

**Evidence:** ${item.evidence_basis || item.evidence || 'Assessment data indicates this area of need'}

**Teacher-Friendly Description:** ${markInferredField(item.item_label || item.description || 'Support needed in this area', isInferred)}

**Parent-Friendly Explanation:** ${markInferredField(item.parent_friendly_label || item.plain_language_label || 'This area may require additional support', isInferred)}

**Observable Behaviors:** ${markInferredField(item.classroom_observation || item.observation || 'Monitor for signs of difficulty in this area', isInferred)}

**Primary Support Strategy:** ${markInferredField(item.support_1 || item.primary_support || 'Provide additional support and scaffolding', isInferred)}

**Secondary Support Strategy:** ${markInferredField(item.support_2 || item.secondary_support || 'Consider alternative approaches if needed', isInferred)}

**Implementation Caution:** ${markInferredField(item.caution_note || item.implementation_notes || 'Monitor effectiveness and adjust as needed', isInferred)}

**Quality Control:**
- Status: ${item.validation_status || 'validated'}
- Grade Band: ${item.grade_band || studentGrade}
- Mapping Method: ${item.resolution_method || 'database_lookup'}
- Inference Level: ${item.inference_level || 'database'}

---`;
      }).join('\n');
    };
    
    // Replace the dynamic content sections - using exact placeholder text
    console.log('🔄 Replacing template placeholders...');
    console.log(`- Validated items count: ${validatedItems.length}`);
    console.log(`- Review items count: ${reviewItems.length}`);
    console.log(`- Flagged items count: ${flaggedItems.length}`);
    
    // Check if placeholders exist in template
    const hasValidatedPlaceholder = populatedTemplate.includes('[For each validated finding');
    const hasReviewPlaceholder = populatedTemplate.includes('[Same format as validated findings, but with qc_flag');
    console.log(`- Has validated placeholder: ${hasValidatedPlaceholder}`);
    console.log(`- Has review placeholder: ${hasReviewPlaceholder}`);
    
    // Replace exact text as it appears in template
    const beforeLength = populatedTemplate.length;
    
    // First replacement - validated findings
    const validatedContent = generateFindingSection(validatedItems);
    console.log(`- Generated validated content: ${validatedContent.length} chars`);
    
    // Replace new template placeholders that match the current template
    populatedTemplate = populatedTemplate.replace(/\[FOR_EACH_VALIDATED_FINDING\]/g, validatedContent);
    populatedTemplate = populatedTemplate.replace(/\[VALIDATED_ITEMS_CONTENT\]/g, validatedContent);
    
    // Check if replacement happened
    const afterValidated = populatedTemplate.length;
    console.log(`- After validated replacement: ${beforeLength} -> ${afterValidated} chars`);
    
    // Second replacement - review findings
    const reviewContent = generateFindingSection(reviewItems);
    console.log(`- Generated review content: ${reviewContent.length} chars`);
    
    // Replace review placeholders
    populatedTemplate = populatedTemplate.replace(/\[FOR_EACH_REVIEW_FINDING\]/g, reviewContent);
    populatedTemplate = populatedTemplate.replace(/\[REVIEW_ITEMS_CONTENT\]/g, reviewContent);
    
    // Third replacement - flagged findings
    const flaggedContent = generateFindingSection(flaggedItems);
    console.log(`- Generated flagged content: ${flaggedContent.length} chars`);
    
    // Try different placeholder formats for flagged items
    if (populatedTemplate.includes("[Same format as validated findings, but with qc_flag = 'flagged']")) {
      populatedTemplate = populatedTemplate.replace(
        "[Same format as validated findings, but with qc_flag = 'flagged']",
        flaggedContent
      );
    } else if (populatedTemplate.includes("[Same format as validated findings, but with qc_flag = ''flagged'']")) {
      // Handle template with double quotes
      populatedTemplate = populatedTemplate.replace(
        "[Same format as validated findings, but with qc_flag = ''flagged'']",
        flaggedContent
      );
    } else if (populatedTemplate.includes("[Same format as validated findings")) {
      // Handle variations - find all matches and replace the second one
      const flaggedMatches = populatedTemplate.match(/\[Same format as validated findings[^\]]*\]/g);
      if (flaggedMatches && flaggedMatches.length > 1) {
        // Replace the second occurrence (after review items)
        const firstOccurrence = flaggedMatches[0];
        const secondOccurrenceIndex = populatedTemplate.lastIndexOf(flaggedMatches[flaggedMatches.length - 1]);
        populatedTemplate = populatedTemplate.substring(0, secondOccurrenceIndex) + 
                           flaggedContent + 
                           populatedTemplate.substring(secondOccurrenceIndex + flaggedMatches[flaggedMatches.length - 1].length);
      }
    }
    
    const finalLength = populatedTemplate.length;
    console.log(`- Final template length: ${finalLength} chars (${finalLength - beforeLength} chars added)`);
    
    // COMPREHENSIVE TEMPLATE REPLACEMENT TEST
    console.log('🔍 COMPREHENSIVE TEMPLATE REPLACEMENT TEST:');
    console.log(`- Original template length: ${template.length}`);
    console.log(`- Original template contains [FOR_EACH_VALIDATED_FINDING]: ${template.includes('[FOR_EACH_VALIDATED_FINDING]')}`);
    console.log(`- Original template contains [FOR_EACH_REVIEW_FINDING]: ${template.includes('[FOR_EACH_REVIEW_FINDING]')}`);
    console.log(`- Original template contains [VALIDATED_ITEMS_CONTENT]: ${template.includes('[VALIDATED_ITEMS_CONTENT]')}`);
    console.log(`- Original template contains [REVIEW_ITEMS_CONTENT]: ${template.includes('[REVIEW_ITEMS_CONTENT]')}`);
    console.log(`- Original template contains [FLAGGED_ITEMS_CONTENT]: ${template.includes('[FLAGGED_ITEMS_CONTENT]')}`);
    
    // Show data categorization
    console.log('📊 DATA CATEGORIZATION:');
    console.log(`- Total items: ${itemMasterData.length}`);
    console.log(`- Validated items: ${validatedItems.length}`);
    console.log(`- Review items: ${reviewItems.length}`);
    console.log(`- Flagged items: ${flaggedItems.length}`);
    
    // Show actual item data being processed
    console.log('📋 ITEM MASTER DATA DETAILS:');
    itemMasterData.forEach((item, index) => {
      console.log(`  ${index + 1}. Key: ${item.canonical_key}`);
      console.log(`     Label: "${item.item_label}"`);
      console.log(`     Status: ${item.validation_status}`);
      console.log(`     Evidence: ${item.evidence_basis?.substring(0, 50)}...`);
    });
    
    // Show replacement results
    console.log('🔄 REPLACEMENT RESULTS:');
    console.log(`- Final template length: ${populatedTemplate.length}`);
    console.log(`- Length change: ${populatedTemplate.length - template.length} chars`);
    console.log(`- Still contains [FOR_EACH_VALIDATED_FINDING]: ${populatedTemplate.includes('[FOR_EACH_VALIDATED_FINDING]')}`);
    console.log(`- Still contains [VALIDATED_ITEMS_CONTENT]: ${populatedTemplate.includes('[VALIDATED_ITEMS_CONTENT]')}`);
    console.log(`- Final template preview: ${populatedTemplate.substring(0, 300)}...`);
    
    // Replace other dynamic content
    const mappingMethods = Array.from(new Set(itemMasterData.map(item => item.resolution_method || 'database_lookup')));
    populatedTemplate = populatedTemplate.replace(
      /\[List of unique mapping methods used\]/g,
      mappingMethods.join(', ')
    );
    
    // Add inference legend
    const inferredItemCount = itemMasterData.filter(item => 
      item.validation_status === 'partial_inference' || item.validation_status === 'full_inference'
    ).length;
    
    const inferenceNote = inferredItemCount > 0 
      ? `\n\n**Field Inference Legend:**\n- Fields marked with *(AI-generated)* were created through cascade inference when database lookups returned incomplete data\n- ${inferredItemCount} out of ${itemMasterData.length} items contain AI-generated fields\n- All AI-generated content is based on established educational best practices and psychoeducational assessment principles`
      : '';
    
    populatedTemplate = populatedTemplate.replace(
      /---\n\n## Implementation Recommendations/,
      `${inferenceNote}\n\n---\n\n## Implementation Recommendations`
    );
    
    populatedTemplate = populatedTemplate.replace(
      /\[Grade-specific developmental factors\]/g,
      `Developmentally appropriate for grade ${studentGrade} students`
    );
    
    populatedTemplate = populatedTemplate.replace(
      /\[Grade-specific considerations for implementation\]/g,
      `Consider developmental stage and academic expectations for grade ${studentGrade}`
    );
    
    populatedTemplate = populatedTemplate.replace(
      /\[Core academic areas requiring support\]/g,
      itemMasterData.map(item => item.academic_domain || 'General academic support').join(', ')
    );
    
    populatedTemplate = populatedTemplate.replace(
      /\[Behavioral and social factors\]/g,
      itemMasterData.filter(item => item.domain === 'social' || item.domain === 'behavioral')
        .map(item => item.description).join(', ') || 'No significant concerns noted'
    );
    
    return populatedTemplate;
  } else {
    console.log('⚠️ No template found, using fallback K-12 format');
    
    // Fallback to basic K-12 format if no template
    return `# K-12 Educational Assessment Analysis Report

**Analysis Date:** ${new Date().toLocaleDateString()}
**Student Grade:** ${studentGrade}
**Total Findings:** ${itemMasterData.length}

---

## Student Strengths and Support Needs

${itemMasterData.map((item, index) => `### ${index + 1}. ${item.canonical_key || item.item_label}

**Evidence:** ${item.evidence_basis || item.evidence || 'Assessment data indicates this area of need'}

**Description:** ${item.item_label || item.description || 'Support needed in this area'}

**Support Strategies:** ${item.support_1 || item.primary_support || 'Provide additional support and scaffolding'}

---`).join('\n')}

## Implementation Recommendations

### For Teachers
- Implement the identified support strategies in classroom settings
- Monitor student progress and adjust supports as needed
- Coordinate with educational team for comprehensive support

### For Parents
- Work with school team to understand your child's needs
- Implement complementary strategies at home
- Maintain regular communication with teachers

---

*This report was generated using the K-12 Educational Assessment Analysis System.*`;
  }
}

// Helper function to save report data directly using SQL
async function saveReportDataDirectly(caseId: string, reportData: any): Promise<boolean> {
  try {
    const { pool } = await import('./db');
    
    // First check if the case exists
    const checkResult = await pool.query(
      'SELECT id FROM assessment_cases WHERE id = $1',
      [caseId]
    );
    
    if (checkResult.rows.length === 0) {
      console.log('Case does not exist, cannot update report data');
      return false;
    }
    
    // Update the existing case with report data
    await pool.query(
      'UPDATE assessment_cases SET report_data = $1, last_updated = NOW() WHERE id = $2',
      [JSON.stringify(reportData), caseId]
    );
    
    console.log('Report data updated successfully for case:', caseId);
    return true;
  } catch (error) {
    console.error('Direct SQL update failed:', error);
    return false;
  }
}

// Helper function to create assessment case directly using SQL
// Helper function to save item master data to database
async function saveItemMasterDataToDatabase(itemMasterData: any[], assessmentCaseId: string, gradeBand: string): Promise<void> {
  console.log('📊 Saving K-12 item master data with cascade inference fields...');
  
  for (const item of itemMasterData) {
    try {
      // Item data now includes cascade inference fields
      const itemData = {
        assessment_case_id: assessmentCaseId,
        canonical_key: item.canonical_key,
        item_label: item.item_label, // Populated by cascade inference
        grade_band: item.grade_band || gradeBand,
        parent_friendly_label: item.parent_friendly_label, // Populated by cascade inference
        classroom_observation: item.classroom_observation, // Populated by cascade inference
        support_1: item.support_1, // Populated by cascade inference
        support_2: item.support_2, // Populated by cascade inference
        caution_note: item.caution_note, // Populated by cascade inference
        evidence_basis: item.evidence_basis || item.evidence,
        validation_status: item.validation_status || 'validated',
        inference_level: item.inference_level || 'none',
        qc_flag: item.qc_flag || 'validated',
        source: item.source || 'ai_analysis',
        module_type: 'k12'
      };

      // Use raw SQL to insert the item master data with all cascade fields
      const { pool } = await import('./db');
      await pool.query(`
        INSERT INTO item_master (
          assessment_case_id, canonical_key, item_label, grade_band, 
          parent_friendly_label, classroom_observation, support_1, support_2, 
          caution_note, evidence_basis, validation_status, inference_level,
          qc_flag, source, module_type
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
        )
      `, [
        assessmentCaseId,
        itemData.canonical_key,
        itemData.item_label,
        itemData.grade_band,
        itemData.parent_friendly_label,
        itemData.classroom_observation,
        itemData.support_1,
        itemData.support_2,
        itemData.caution_note,
        itemData.evidence_basis,
        itemData.validation_status,
        itemData.inference_level,
        itemData.qc_flag,
        itemData.source,
        itemData.module_type
      ]);

      console.log(`✅ Saved K-12 item master with ${itemData.inference_level} inference: ${itemData.canonical_key}`);
    } catch (error) {
      console.error(`❌ Failed to save item master entry ${item.canonical_key}:`, error);
    }
  }
}

async function createAssessmentCaseDirectly(caseData: any): Promise<string | null> {
  try {
    const { pool } = await import('./db');
    
    const result = await pool.query(
      `INSERT INTO assessment_cases (
        id, case_id, display_name, module_type, status, report_data, created_date, last_updated
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW()) 
      RETURNING id`,
      [
        caseData.id,
        caseData.case_id || caseData.id, // Use case_id if provided, otherwise use id
        caseData.display_name,
        caseData.module_type,
        caseData.status,
        JSON.stringify(caseData.report_data)
      ]
    );
    
    console.log('✅ Assessment case created via direct SQL:', result.rows[0].id);
    return result.rows[0].id;
  } catch (error) {
    console.error('Direct SQL insert failed:', error);
    return null;
  }
}