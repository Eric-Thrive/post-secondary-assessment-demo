/**
 * Demo Write Guard Middleware
 *
 * Implements selective read-only mode for demo environments.
 * Demo users can create assessments and edit reports (full user experience),
 * but cannot modify system-level configurations (prompts, AI config, lookup tables).
 *
 * This allows demos to be fully functional while protecting system data.
 */

import { Request, Response, NextFunction } from 'express';
import { isReadOnlyEnvironment } from '../config/database';

/**
 * Tables that are allowed to be written to in demo mode
 * Demo users can use the full application functionality
 */
const ALLOWED_WRITE_TABLES = new Set([
  'users',              // User registration and profile updates
  'sessions',           // Session management
  'assessment_cases',   // Assessment creation and updates (ALLOWED for demo users)
  'report_versions',    // Report editing and versioning (ALLOWED for demo users)
]);

/**
 * Tables that are blocked from writes in demo mode
 * These contain system-level configurations that should not be modified
 */
const BLOCKED_WRITE_TABLES = new Set([
  'prompt_sections',                    // AI prompts (system-level)
  'ai_config',                          // AI configuration (system-level)
  'observation_templates',              // Lookup tables
  'barrier_glossary',                   // Lookup tables
  'inference_triggers',                 // Lookup tables
  'support_lookup',                     // Lookup tables
  'caution_lookup',                     // Lookup tables
  'item_master',                        // Lookup tables
  'post_secondary_accommodations',      // Lookup tables
  'post_secondary_barrier_mappings',    // Lookup tables
]);

/**
 * Routes that are allowed in demo mode even if they perform writes
 * Includes authentication and core application functionality
 */
const ALLOWED_ROUTES = new Set([
  '/api/auth/register',
  '/api/auth/login',
  '/api/auth/logout',
  '/api/auth/reset-password-request',
  '/api/auth/reset-password',
  '/api/auth/forgot-username',
  '/api/auth/me',
]);

/**
 * Check if a write operation should be blocked in demo mode
 */
export function shouldBlockWrite(tableName: string): boolean {
  // If not in demo mode, allow all writes
  if (!isReadOnlyEnvironment()) {
    return false;
  }

  // If table is explicitly allowed, don't block
  if (ALLOWED_WRITE_TABLES.has(tableName)) {
    return false;
  }

  // If table is explicitly blocked, block it
  if (BLOCKED_WRITE_TABLES.has(tableName)) {
    return true;
  }

  // Default: block writes to unknown tables in demo mode
  return true;
}

/**
 * Middleware to enforce selective read-only mode in demo environments
 *
 * This middleware intercepts routes that perform write operations and blocks
 * them if they're not in the allowed list. This allows authentication routes
 * to work while preventing modification of application data.
 */
export function demoWriteGuard(req: Request, res: Response, next: NextFunction) {
  // If not in demo mode, allow everything
  if (!isReadOnlyEnvironment()) {
    return next();
  }

  // Check if this route is explicitly allowed
  if (ALLOWED_ROUTES.has(req.path)) {
    console.log(`🟢 DEMO: Allowing write operation: ${req.method} ${req.path}`);
    return next();
  }

  // Block write operations to system-level protected routes only
  const isWriteOperation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);

  if (isWriteOperation) {
    // Check if this is a system-level route that should be blocked
    // Note: Assessment and analysis routes are NOT blocked - demo users can use full functionality
    const protectedRoutePatterns = [
      /^\/api\/prompts/,                    // Block prompt modifications
      /^\/api\/admin/,                      // Block admin operations
      /^\/api\/config\/(?!environment)/,    // Block config changes (except reading environment)
    ];

    const isProtectedRoute = protectedRoutePatterns.some(pattern => pattern.test(req.path));

    if (isProtectedRoute) {
      console.log(`🔴 DEMO: Blocking system-level write operation: ${req.method} ${req.path}`);
      return res.status(403).json({
        error: 'System configuration changes are not allowed in demo mode',
        message: 'Demo users cannot modify system-level configurations (prompts, AI settings, lookup tables).',
        isDemo: true,
      });
    }
  }

  // Allow all other operations (including GET requests)
  next();
}

/**
 * Assert that a database write operation is allowed
 * Used by storage layer to check before executing writes
 */
export function assertDemoWriteAllowed(tableName: string, operation: string): void {
  if (shouldBlockWrite(tableName)) {
    throw new Error(
      `DEMO MODE: Write operation "${operation}" to table "${tableName}" is not allowed. ` +
      `Demo users can create assessments and edit reports, but cannot modify system configurations.`
    );
  }
}
