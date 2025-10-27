/**
 * Simplified database configuration for RBAC system
 * All environments use the same Neon database (DATABASE_URL)
 * Role-based access control replaces environment-based restrictions
 */

export interface DatabaseConfig {
  url: string;
  name: string;
  description: string;
}

/**
 * Get database configuration
 * All app environments use the same Neon database
 */
export function getDatabaseConfig(): DatabaseConfig {
  const databaseUrl = process.env.DATABASE_URL || "";
  const nodeEnv = process.env.NODE_ENV || "production";

  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL environment variable is required. " +
        "Please set it to your Neon database connection string."
    );
  }

  // Simple logging for debugging
  console.log(`📊 Database Connection:`);
  console.log(`  - Node Environment: ${nodeEnv}`);
  console.log(`  - Database: Neon PostgreSQL (shared)`);

  return {
    url: databaseUrl,
    name: "Neon PostgreSQL",
    description: `Shared database for all environments`,
  };
}

/**
 * Get database URL directly
 */
export function getDatabaseUrl(): string {
  return process.env.DATABASE_URL || "";
}

/**
 * Check if running in development mode
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === "development";
}

/**
 * Check if running in production mode
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

/**
 * Check if running in demo mode
 * In the RBAC system, demo mode is determined by user roles, not environment
 * This function is kept for backwards compatibility and always returns false
 */
export function isDemoEnvironment(): boolean {
  return false;
}

/**
 * Check if running in read-only mode
 * In the RBAC system, read-only access is determined by user roles, not environment
 * This function is kept for backwards compatibility and always returns false
 */
export function isReadOnlyEnvironment(): boolean {
  return false;
}

/**
 * Check if running in controlled access mode
 * For backwards compatibility - returns false since we use RBAC
 */
export function isControlledAccessMode(): boolean {
  return false;
}

/**
 * Get secure connection string
 * Since all environments use same DB, just return the URL
 */
export function getSecureConnectionString(config: DatabaseConfig): string {
  return config.url;
}

/**
 * Assert write permissions
 * In the RBAC system, write permissions are handled by role-based middleware
 * This function is kept for backwards compatibility and does nothing
 */
export function assertWritePermissions(operation: string): void {
  // No-op in RBAC system - permissions handled by role-based middleware
}

/**
 * Get safe database connection info for logging (without credentials)
 */
export function getDatabaseConnectionInfo(): {
  name: string;
  description: string;
  environment: string;
  appEnvironment: string;
  isDemoEnvironment: boolean;
  isDemo: boolean; // Alias for compatibility
} {
  const nodeEnv = process.env.NODE_ENV || "production";

  return {
    name: "Neon PostgreSQL",
    description: `Shared database for all environments`,
    environment: nodeEnv,
    appEnvironment: "production", // Simplified to single environment
    isDemoEnvironment: false, // RBAC system handles demo users via roles
    isDemo: false, // Add alias for backwards compatibility
  };
}
