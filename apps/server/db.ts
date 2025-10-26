import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";
import { getDatabaseConfig, getSecureConnectionString, isReadOnlyEnvironment, isDemoEnvironment } from './config/database';

const { Pool } = pg;

// Get database configuration based on current environment
const dbConfig = getDatabaseConfig();
const databaseUrl = getSecureConnectionString(dbConfig);

if (!databaseUrl) {
  throw new Error(
    `DATABASE_URL must be set for environment: ${process.env.APP_ENVIRONMENT}. Did you forget to provision a database?`,
  );
}

const isReadOnly = isReadOnlyEnvironment();
const isDemo = isDemoEnvironment();

console.log(`🔒 Database Security Configuration:`);
console.log(`   Environment: ${process.env.APP_ENVIRONMENT || 'production'}`);
console.log(`   Database: ${dbConfig.name}`);
console.log(`   Read-Only: ${isReadOnly}`);
console.log(`   Demo Environment: ${isDemo}`);

// Create pool configuration with read-only enforcement for demo environments
const poolConfig = {
  connectionString: databaseUrl,
  max: 20, // Increased from 10 for better concurrency
  min: 2, // Keep minimum connections alive
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000, // Reduced from 10000 for faster failures
  statement_timeout: 60000, // Increased from 30000 for AI operations
  query_timeout: 60000,
  // Add connection lifecycle management
  maxUses: 7500, // Recycle connections periodically
  allowExitOnIdle: true, // Allow process to exit cleanly
};

// Use standard PostgreSQL pool
export let pool = new Pool(poolConfig);

// REMOVED: Connection-level read-only enforcement
// Demo environments now use selective middleware to protect system configs
// Demo users can use full app functionality (create assessments, edit reports)
// See: apps/server/middleware/demoWriteGuard.ts
if (isReadOnly) {
  console.log(`🔒 DEMO MODE: Selective protection via middleware`);
  console.log(`   ✅ Allowed: User auth, assessments, reports (full functionality)`);
  console.log(`   ❌ Blocked: System configs (prompts, AI settings, lookup tables)`);
}

export let db = drizzle(pool, { schema });

// Function to reinitialize database connection when environment changes
export async function reinitializeDatabase() {
  const newDbConfig = getDatabaseConfig();
  const newDatabaseUrl = getSecureConnectionString(newDbConfig);
  const newIsReadOnly = isReadOnlyEnvironment();
  const newIsDemo = isDemoEnvironment();
  
  // Close existing pool
  if (pool) {
    try {
      await pool.end();
    } catch (error) {
      console.error('Failed to close existing database pool during reinitialize:', error);
    }
  }
  
  // Create new pool configuration
  const newPoolConfig = {
    connectionString: newDatabaseUrl,
    max: 20, // Increased from 10 for better concurrency
    min: 2, // Keep minimum connections alive
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000, // Reduced from 10000 for faster failures
    statement_timeout: 60000, // Increased from 30000 for AI operations
    query_timeout: 60000,
    // Add connection lifecycle management
    maxUses: 7500, // Recycle connections periodically
    allowExitOnIdle: true, // Allow process to exit cleanly
  };
  
  // Create new pool with updated database URL
  pool = new Pool(newPoolConfig);

  // REMOVED: Connection-level read-only enforcement
  // Demo environments now use selective middleware to protect system configs
  if (newIsReadOnly) {
    console.log(`🔒 DEMO MODE: Selective protection via middleware`);
    console.log(`   ✅ Allowed: User auth, assessments, reports (full functionality)`);
    console.log(`   ❌ Blocked: System configs (prompts, AI settings, lookup tables)`);
  }

  db = drizzle(pool, { schema });

  console.log(`🔒 Database reinitialized for environment: ${process.env.APP_ENVIRONMENT}`);
  console.log(`   Database: ${newDbConfig.name}`);
  console.log(`   Read-Only: ${newIsReadOnly}`);
  console.log(`   Demo Environment: ${newIsDemo}`);
}
