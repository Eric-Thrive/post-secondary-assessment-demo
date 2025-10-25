import type { Express } from "express";
import { createServer, type Server } from "http";
import "../types";
import { sessionConfig } from "../auth";
import { registerNoCacheRoutes } from "../no-cache-routes";
import { isReadOnlyEnvironment, isControlledAccessMode, getDatabaseConnectionInfo, isDemoEnvironment } from "../config/database";
import { DEMO_CUSTOMER_ID } from "@shared/constants/environments";
import { registerAuthRoutes, registerAdminRoutes } from "./auth-routes";
import { registerStatusRoutes } from "./status-routes";
import { registerAssessmentCaseRoutes } from "./assessment-case-routes";
import { registerAnalysisRoutes } from "./analysis-routes";
import { registerConfigRoutes } from "./config-routes";
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
    { method: 'POST', path: '/k12-assessment-cases/reject-change' },
    
    // Demo sharing (GET only)
    { method: 'GET', path: /^\/shared\/[\w-]+$/ },
    { method: 'POST', path: /^\/reports\/[\w-]+\/share$/ },
    
    // Demo case specific operations (no wildcards)
    { method: 'GET', path: /^\/demo-assessment-cases\/[\w-]+$/ },
    { method: 'PATCH', path: /^\/demo-assessment-cases\/[\w-]+$/ },
    
    // Configuration and lookup endpoints needed for demo functionality
    { method: 'GET', path: '/ai-config' },
    { method: 'GET', path: '/prompts' },
    { method: 'GET', path: '/lookup-tables' },
    { method: 'GET', path: '/mapping-configurations' },
    
    // Admin endpoints (for system administrators)
    { method: 'GET', path: '/admin/users' },
    { method: 'PATCH', path: /^\/admin\/users\/\d+$/ },
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
        if (data.customerId && data.customerId !== DEMO_CUSTOMER_ID) {
          return false;
        }

        // Check for nested customer data
        if (data.customer && data.customer.id !== DEMO_CUSTOMER_ID) {
          return false;
        }

        // Check for assessment case customer references
        if (data.assessmentCase && data.assessmentCase.customerId &&
            data.assessmentCase.customerId !== DEMO_CUSTOMER_ID) {
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
          reason: `Demo operations must only access ${DEMO_CUSTOMER_ID} data`
        });
        
        return res.status(403).json({
          error: 'SECURITY VIOLATION: Demo operations are restricted to demo customer data only',
          code: 'DEMO_CUSTOMER_ISOLATION_VIOLATION'
        });
      }
      
      // Force demo customer for assessment case operations
      if (req.body && (req.path.includes('/assessment-cases') || req.path.includes('/demo-assessment-cases'))) {
        if (req.method === 'POST' || req.method === 'PATCH') {
          req.body.customerId = DEMO_CUSTOMER_ID;
          if (req.body.customer) {
            req.body.customer.id = DEMO_CUSTOMER_ID;
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
              `Customer isolation enforced (${DEMO_CUSTOMER_ID} only)`,
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
  // Register feature-specific route modules
  registerAuthRoutes(app);
  registerAdminRoutes(app);
  registerStatusRoutes(app);
  registerAssessmentCaseRoutes(app);
  registerAnalysisRoutes(app);
  registerConfigRoutes(app);

  // Legacy cache-busting/preview routes
  registerNoCacheRoutes(app);

  const server = createServer(app);
  return server;
}
