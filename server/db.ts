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

// Add session-level read-only enforcement for demo environments
if (isReadOnly) {
  pool.on('connect', async (client) => {
    try {
      console.log(`🔒 SECURITY: Setting session to read-only mode...`);
      await client.query('SET default_transaction_read_only = on');
      await client.query('SET transaction_read_only = on');
      console.log(`✅ SECURITY: Session successfully configured as read-only`);
    } catch (error) {
      console.error(`🚨 SECURITY ERROR: Failed to set read-only mode:`, error);
      throw new Error(`Failed to enforce read-only mode: ${error}`);
    }
  });
}

export let db = drizzle(pool, { schema });

// Verify read-only enforcement on startup
if (isReadOnly) {
  verifyReadOnlyMode().catch(error => {
    console.error('🚨 CRITICAL SECURITY FAILURE: Read-only verification failed:', error);
    process.exit(1);
  });
}

/**
 * Verify that read-only mode is properly enforced
 */
async function verifyReadOnlyMode(): Promise<void> {
  console.log('🔍 SECURITY: Verifying read-only enforcement...');
  
  try {
    const client = await pool.connect();
    try {
      // Check if default_transaction_read_only is enabled
      const result = await client.query('SHOW default_transaction_read_only');
      const readOnlyStatus = result.rows[0]?.default_transaction_read_only;
      
      if (readOnlyStatus !== 'on') {
        throw new Error(`Expected read-only mode 'on', but got '${readOnlyStatus}'`);
      }
      
      console.log('✅ SECURITY: Read-only mode verification successful');
      console.log(`   default_transaction_read_only: ${readOnlyStatus}`);
      
      // Additional test: Try a write operation to ensure it fails
      try {
        await client.query('CREATE TEMP TABLE security_test_table (id int)');
        console.log('⚠️  WARNING: Temporary table creation succeeded - this may be expected in some read-only configs');
      } catch (writeError) {
        console.log('✅ SECURITY: Write operations properly blocked - temp table creation failed as expected');
      }
      
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('🚨 CRITICAL: Read-only verification failed:', error);
    throw error;
  }
}

// Function to reinitialize database connection when environment changes
export function reinitializeDatabase() {
  const newDbConfig = getDatabaseConfig();
  const newDatabaseUrl = getSecureConnectionString(newDbConfig);
  const newIsReadOnly = isReadOnlyEnvironment();
  const newIsDemo = isDemoEnvironment();
  
  // Close existing pool
  if (pool) {
    pool.end();
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
  
  // Add session-level read-only enforcement for demo environments
  if (newIsReadOnly) {
    pool.on('connect', async (client) => {
      try {
        console.log(`🔒 SECURITY: Setting session to read-only mode...`);
        await client.query('SET default_transaction_read_only = on');
        await client.query('SET transaction_read_only = on');
        console.log(`✅ SECURITY: Session successfully configured as read-only`);
      } catch (error) {
        console.error(`🚨 SECURITY ERROR: Failed to set read-only mode:`, error);
        throw new Error(`Failed to enforce read-only mode: ${error}`);
      }
    });
  }
  
  db = drizzle(pool, { schema });
  
  console.log(`🔒 Database reinitialized for environment: ${process.env.APP_ENVIRONMENT}`);
  console.log(`   Database: ${newDbConfig.name}`);
  console.log(`   Read-Only: ${newIsReadOnly}`);
  console.log(`   Demo Environment: ${newIsDemo}`);
  
  // Verify read-only enforcement after reinitialize
  if (newIsReadOnly) {
    verifyReadOnlyMode().catch(error => {
      console.error('🚨 CRITICAL SECURITY FAILURE: Read-only verification failed after reinitialize:', error);
      process.exit(1);
    });
  }
}
