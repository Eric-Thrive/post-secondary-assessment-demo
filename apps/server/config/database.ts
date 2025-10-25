/**
 * Simplified database configuration
 * All environments use the same Neon database (DATABASE_URL)
 * APP_ENVIRONMENT determines application behavior (demo vs dev vs prod)
 */

import { isDemoEnvironment as checkIsDemoEnvironment, isReadOnlyEnvironment as checkIsReadOnlyEnvironment } from '@shared/constants/environments';

export interface DatabaseConfig {
  url: string;
  name: string;
  description: string;
  isDemoEnvironment?: boolean;
}

/**
 * Get database configuration
 * All app environments use the same Neon database
 */
export function getDatabaseConfig(): DatabaseConfig {
  const databaseUrl = process.env.DATABASE_URL || '';
  const appEnv = process.env.APP_ENVIRONMENT || 'production';
  const nodeEnv = process.env.NODE_ENV || 'production';

  if (!databaseUrl) {
    throw new Error(
      'DATABASE_URL environment variable is required. ' +
      'Please set it to your Neon database connection string.'
    );
  }

  // Check if this is a demo environment using centralized utility
  const isDemoEnv = checkIsDemoEnvironment(appEnv);

  // Simple logging for debugging
  console.log(`📊 Database Connection:`);
  console.log(`  - App Environment: ${appEnv}`);
  console.log(`  - Node Environment: ${nodeEnv}`);
  console.log(`  - Is Demo: ${isDemoEnv}`);
  console.log(`  - Database: Neon PostgreSQL (shared)`);

  return {
    url: databaseUrl,
    name: 'Neon PostgreSQL',
    description: `Shared database for all environments (${appEnv} mode)`,
    isDemoEnvironment: isDemoEnv
  };
}

/**
 * Get database URL directly
 */
export function getDatabaseUrl(): string {
  return process.env.DATABASE_URL || '';
}

/**
 * Check if running in demo mode
 * Uses centralized environment utility
 */
export function isDemoEnvironment(): boolean {
  return checkIsDemoEnvironment(process.env.APP_ENVIRONMENT);
}

/**
 * Check if running in development mode
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

/**
 * Check if running in production mode
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Check if running in read-only mode
 * Demo environments are read-only
 * Uses centralized environment utility
 */
export function isReadOnlyEnvironment(): boolean {
  return checkIsReadOnlyEnvironment(process.env.APP_ENVIRONMENT);
}

/**
 * Check if running in controlled access mode
 * For backwards compatibility - returns false since we use simple demo mode
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
 * Throws error if in demo mode (read-only)
 */
export function assertWritePermissions(operation: string): void {
  if (isReadOnlyEnvironment()) {
    const appEnv = process.env.APP_ENVIRONMENT || 'production';
    throw new Error(
      `SECURITY: Write operation "${operation}" blocked in demo mode (${appEnv}). ` +
      `Demo environments are read-only.`
    );
  }
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
  const nodeEnv = process.env.NODE_ENV || 'production';
  const appEnv = process.env.APP_ENVIRONMENT || 'production';
  const isDemo = isDemoEnvironment();

  return {
    name: 'Neon PostgreSQL',
    description: `Shared database for all environments`,
    environment: nodeEnv,
    appEnvironment: appEnv,
    isDemoEnvironment: isDemo,
    isDemo: isDemo // Add alias for backwards compatibility
  };
}
