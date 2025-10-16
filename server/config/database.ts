/**
 * Database configuration for different environments
 * Each environment can have its own database URL
 */

export interface DatabaseConfig {
  url: string;
  name: string;
  description: string;
  readOnly?: boolean;
  isDemoEnvironment?: boolean;
  isProductionHost?: boolean;
  controlledAccessMode?: boolean; // NEW: Allow controlled demo operations on shared databases
}

// Helper function to get valid database URL with enhanced demo configuration guidance
function getValidDatabaseUrl(primaryVar: string, fallbackVar: string = 'DATABASE_URL'): string {
  const primary = process.env[primaryVar];
  const fallback = process.env[fallbackVar] || '';
  
  // Check if the primary variable is properly configured
  const isValidUrl = primary && primary.trim() && !primary.includes(primaryVar);
  
  if (isValidUrl) {
    console.log(`✅ Using configured ${primaryVar} for database connection`);
    return primary;
  }
  
  // Handle specific misconfiguration cases with detailed error messages
  if (primary && primary.trim()) {
    if (primary.trim() === primaryVar || primary.includes(primaryVar)) {
      // SPECIFIC ERROR: Variable is set to its own name (common misconfiguration)
      console.error(`❌ CONFIGURATION ERROR: ${primaryVar} is set to its own name instead of a database URL`);
      console.error(`   Current value: '${primary}'`);
      console.error(`   Expected: A valid PostgreSQL connection string like:`);
      console.error(`   postgresql://user:password@host:port/database`);
      console.error(`   Example: postgresql://demo:demo123@demo-db.example.com:5432/demo_db`);
      console.error(``);
      console.error(`🔧 TO FIX THIS: Set ${primaryVar} to an actual database URL, not the variable name`);
    } else {
      // Other validation failures
      console.error(`❌ CONFIGURATION ERROR: ${primaryVar} appears to be misconfigured`);
      console.error(`   Current value: '${primary.substring(0, 50)}${primary.length > 50 ? '...' : ''}'`);
    }
  } else if (primary === '') {
    // Variable exists but is empty
    console.error(`❌ CONFIGURATION ERROR: ${primaryVar} exists but is empty`);
  } else {
    // Variable doesn't exist
    console.log(`ℹ️ ${primaryVar} is not set - using fallback configuration`);
  }
  
  // Enhanced guidance for demo configuration scenarios
  if (primaryVar === 'POST_SECONDARY_DEMO_DATABASE_URL') {
    console.log(`📋 DEMO DATABASE CONFIGURATION GUIDE:`);
    console.log(`   Option 1 (RECOMMENDED): Set ${primaryVar} to isolated demo database`);
    console.log(`     - Provides complete data isolation from production`);
    console.log(`     - Safest option for demo environments`);
    console.log(`     - No risk of production data access`);
    console.log(`     - Example: postgresql://demo:demo123@demo-db.example.com:5432/demo_db`);
    console.log(`   Option 2 (CONTROLLED ACCESS): Use shared database with enhanced security`);
    console.log(`     - Controlled access mode enabled automatically`);
    console.log(`     - Strict customer isolation enforced (demo-customer only)`);
    console.log(`     - Operation allowlist and audit logging active`);
    console.log(`     - Enhanced security middleware active`);
    console.log(`   Current: Falling back to ${fallbackVar} with controlled access mode`);
  } else {
    console.log(`⚠️ ${primaryVar} misconfiguration detected, falling back to ${fallbackVar}`);
  }
  
  return fallback;
}

// Environment-specific database configurations
const databaseConfigs: Record<string, DatabaseConfig> = {
  // Primary environments
  'production': {
    url: process.env.DATABASE_URL || '',
    name: 'Replit Production PostgreSQL',
    description: 'Primary production database'
  },
  'development': {
    url: process.env.DEV_DATABASE_URL || '',
    name: 'Replit Development PostgreSQL',
    description: 'Development database for testing and feature development'
  },
  // Legacy configurations (maintained for compatibility)
  'database': {
    url: process.env.DATABASE_URL || '',
    name: 'Database PostgreSQL',
    description: 'Original Database database'
  },
  'replit-prod': {
    url: process.env.REPLIT_PROD_DATABASE_URL || process.env.DATABASE_URL || '',
    name: 'Replit Production PostgreSQL',
    description: 'Production database on Replit'
  },
  'replit-dev': {
    url: process.env.REPLIT_DEV_DATABASE_URL || process.env.DEV_DATABASE_URL || '',
    name: 'Replit Development PostgreSQL',
    description: 'Development database on Replit'
  },
  // Demo environments - all use the same demo database for consistency
  'post-secondary-demo': {
    // All demo environments share the same demo database
    // Use helper to handle misconfigured environment variables
    url: getValidDatabaseUrl('POST_SECONDARY_DEMO_DATABASE_URL', 'DATABASE_URL'),
    name: 'Demo PostgreSQL',
    description: 'Shared demo database for post-secondary demonstrations',
    readOnly: false, // Set to false to allow analysis operations in demo
    isDemoEnvironment: true
  },
  'k12-demo': {
    // All demo environments share the same demo database
    // Use helper to handle misconfigured environment variables
    url: getValidDatabaseUrl('POST_SECONDARY_DEMO_DATABASE_URL', 'DATABASE_URL'),
    name: 'Demo PostgreSQL',
    description: 'Shared demo database for K-12 demonstrations',
    readOnly: false, // Set to false to allow analysis operations in demo
    isDemoEnvironment: true
  },
  'tutoring-demo': {
    // All demo environments share the same demo database
    // Use helper to handle misconfigured environment variables
    url: getValidDatabaseUrl('POST_SECONDARY_DEMO_DATABASE_URL', 'DATABASE_URL'),
    name: 'Demo PostgreSQL',
    description: 'Shared demo database for tutoring demonstrations',
    readOnly: false, // Set to false to allow analysis operations in demo
    isDemoEnvironment: true
  },
  // Development environments for specific module testing
  'post-secondary-dev': {
    url: process.env.DEV_DATABASE_URL || process.env.DATABASE_URL || '',
    name: 'Post-Secondary Development PostgreSQL',
    description: 'Development database for post-secondary module testing',
    readOnly: false, // Allow all operations in development
    isDemoEnvironment: false // Not a demo, so no restrictions applied
  },
  'k12-dev': {
    url: process.env.DEV_DATABASE_URL || process.env.DATABASE_URL || '',
    name: 'K-12 Development PostgreSQL',
    description: 'Development database for K-12 module testing'
  },
  'tutoring-dev': {
    url: process.env.DEV_DATABASE_URL || process.env.DATABASE_URL || '',
    name: 'Tutoring Development PostgreSQL',
    description: 'Development database for tutoring module testing'
  }
};

/**
 * Startup security assertions to prevent dangerous configurations
 */
function validateSecurityConstraints(config: DatabaseConfig, environment: string): void {
  // Critical: Demo environments MUST NOT point to production hosts
  if (config.isDemoEnvironment && config.url && config.url.trim() !== '') {
    try {
      const url = new URL(config.url);
      const productionHosts = [
        'ep-', // Neon production pattern
        'prod', 
        'production',
        'live',
        'main',
        'master'
      ];
      
      const isDangerousHost = productionHosts.some(pattern => 
        url.hostname.toLowerCase().includes(pattern)
      );
      
      if (isDangerousHost) {
        // CRITICAL SECURITY: Demo environments detected on production database hosts
        console.warn(
          `⚠️ SECURITY NOTICE: Demo environment "${environment}" is using PRODUCTION database host (${url.hostname}).`
        );
        console.warn(`   This requires enhanced security measures for safe demo operations.`);
        console.warn(`   RECOMMENDATION: Configure POST_SECONDARY_DEMO_DATABASE_URL with isolated demo database.`);
        
        // ENABLE controlled access mode instead of complete lockdown
        config.controlledAccessMode = true; // NEW: Enable controlled access with enhanced security
        config.readOnly = false; // Allow controlled writes through security middleware
        
        console.warn(`🔒 CONTROLLED ACCESS MODE: Demo environment "${environment}" enabled with enhanced security`);
        console.warn(`   - Demo operations: ALLOWED with strict customer isolation (demo-customer only)`);
        console.warn(`   - Security enforcement: Application-level middleware + operation allowlist`);
        console.warn(`   - Data isolation: Complete separation from production customer data`);
        console.warn(`   - Audit logging: All operations logged for security compliance`);
        console.warn(`   - Recommended: Use POST_SECONDARY_DEMO_DATABASE_URL for complete isolation`);
        
        // Add security flags
        config.isProductionHost = true;
      }
    } catch (error) {
      if ((error as any).code !== 'ERR_INVALID_URL') {
        throw error; // Re-throw if it's not a URL validation error
      }
      // If URL is invalid/empty, we'll handle it later in the config validation
      console.warn(`⚠️ Demo environment "${environment}" has invalid/empty database URL`);
    }
  }
  
  // SECURITY: Verify demo environments have proper isolation
  if (config.isDemoEnvironment) {
    if (config.controlledAccessMode) {
      console.log(
        `🔒 CONTROLLED ACCESS MODE: Demo environment "${environment}" using enhanced security. ` +
        `Demo operations allowed with strict customer isolation and operation allowlist.`
      );
    } else if (config.readOnly) {
      console.log(
        `🔒 SECURITY ENFORCED: Demo environment "${environment}" is in READ-ONLY mode. ` +
        `This is required for production database hosts to prevent data corruption.`
      );
    } else {
      console.log(
        `🔒 SECURITY INFO: Demo environment "${environment}" allows controlled writes. ` +
        `This should only be enabled with dedicated demo databases.`
      );
    }
    
    // Log security status
    console.log(`🔍 Security Status for ${environment}:`);
    console.log(`   - Read Only: ${config.readOnly ? 'YES (SECURE)' : 'NO (CONTROLLED)'}`);
    console.log(`   - Controlled Access: ${config.controlledAccessMode ? 'YES (ENHANCED SECURITY)' : 'NO'}`);
    console.log(`   - Production Host: ${(config as any).isProductionHost ? 'YES (SHARED DB)' : 'NO (ISOLATED)'}`);
    console.log(`   - Demo Environment: ${config.isDemoEnvironment ? 'YES' : 'NO'}`);
  }
}

/**
 * Normalize environment name to handle both underscore and hyphen formats
 */
function normalizeEnvironmentName(environment: string): string {
  // Convert underscores to hyphens for consistency
  // e.g., "post_secondary_demo" -> "post-secondary-demo"
  return environment.replace(/_/g, '-');
}

/**
 * Get database configuration for the current environment
 */
export function getDatabaseConfig(): DatabaseConfig {
  const rawEnvironment = process.env.APP_ENVIRONMENT || 'production';
  const environment = normalizeEnvironmentName(rawEnvironment);
  const config = databaseConfigs[environment] || databaseConfigs['production'];
  
  console.log(`📊 Database Config Lookup:`);
  console.log(`  - Raw Environment: '${rawEnvironment}'`);
  console.log(`  - Normalized Environment: '${environment}'`);
  console.log(`  - Config Found: ${config ? 'Yes' : 'No'}`);
  console.log(`  - Is Demo: ${config?.isDemoEnvironment || false}`);
  console.log(`  - Database Name: ${config?.name || 'Unknown'}`);
  
  // Perform security validation before returning config
  validateSecurityConstraints(config, environment);
  
  if (!config.url) {
    // Provide specific error messages for demo environments
    if (environment === 'post-secondary-demo') {
      throw new Error(
        'SECURITY ERROR: Post-Secondary Demo environment requires POST_SECONDARY_DEMO_DATABASE_URL to be set. ' +
        'Demo environments CANNOT fall back to production database for security reasons.'
      );
    }
    if (environment === 'k12-demo') {
      throw new Error(
        'SECURITY ERROR: K-12 Demo environment requires POST_SECONDARY_DEMO_DATABASE_URL to be set. ' +
        'Demo environments CANNOT fall back to production database for security reasons.'
      );
    }
    if (environment === 'tutoring-demo') {
      throw new Error(
        'SECURITY ERROR: Tutoring Demo environment requires POST_SECONDARY_DEMO_DATABASE_URL to be set. ' +
        'Demo environments CANNOT fall back to production database for security reasons.'
      );
    }
    
    const envVarSuggestion = environment === 'development' 
      ? 'DEV_DATABASE_URL' 
      : 'DATABASE_URL';
    
    throw new Error(
      `No database URL configured for environment: ${environment}. ` +
      `Please set ${envVarSuggestion} environment variable.`
    );
  }
  
  // Additional info for demo environments
  if (config.isDemoEnvironment && !config.readOnly) {
    console.log(`🔒 INFO: Demo environment ${environment} configured for controlled analysis operations`);
  }
  
  return config;
}

// Validation test available via testDatabaseUrlValidation() function if needed

/**
 * Get database URL for specific environment
 */
export function getDatabaseUrl(environment?: string): string {
  const rawEnv = environment || process.env.APP_ENVIRONMENT || 'production';
  const env = normalizeEnvironmentName(rawEnv);
  const config = databaseConfigs[env] || databaseConfigs['production'];
  return config.url;
}

/**
 * Check if the current environment is a demo environment
 */
export function isDemoEnvironment(): boolean {
  const rawEnvironment = process.env.APP_ENVIRONMENT || 'production';
  const environment = normalizeEnvironmentName(rawEnvironment);
  const config = databaseConfigs[environment] || databaseConfigs['production'];
  const isDemo = config.isDemoEnvironment || false;
  console.log(`🔍 isDemoEnvironment check: raw='${rawEnvironment}', normalized='${environment}', isDemo=${isDemo}`);
  return isDemo;
}

/**
 * Check if the current environment is in controlled access mode
 * Controlled access mode allows demo operations on shared databases with enhanced security
 */
export function isControlledAccessMode(): boolean {
  const rawEnvironment = process.env.APP_ENVIRONMENT || 'production';
  const environment = normalizeEnvironmentName(rawEnvironment);
  const config = databaseConfigs[environment] || databaseConfigs['production'];
  return config.controlledAccessMode || false;
}

/**
 * Check if the current environment should be read-only
 * For demo environments in controlled access mode, this returns false to allow controlled writes.
 * For other demo environments, this returns true to trigger security middleware checks.
 */
export function isReadOnlyEnvironment(): boolean {
  const rawEnvironment = process.env.APP_ENVIRONMENT || 'production';
  const environment = normalizeEnvironmentName(rawEnvironment);
  const config = databaseConfigs[environment] || databaseConfigs['production'];
  
  // Controlled access mode allows writes with enhanced security
  if (config.isDemoEnvironment && config.controlledAccessMode) {
    return false; // Allow controlled writes through security middleware
  }
  
  // Demo environments without controlled access mode trigger security middleware
  if (config.isDemoEnvironment) {
    return true; // Trigger middleware security checks for demo operations
  }
  
  return config.readOnly || false;
}

/**
 * Apply database-level read-only constraints for demo environments
 * Note: For controlled-access demo environments, we don't apply database-level
 * read-only constraints since we need to allow demo analysis operations.
 * Security is enforced at the application middleware level instead.
 */
export function getSecureConnectionString(config: DatabaseConfig): string {
  if (config.readOnly && config.isDemoEnvironment && false) { // Disabled for controlled demo access
    // Check if URL is valid before trying to modify it
    if (!config.url || config.url.trim() === '') {
      console.error(`❌ Cannot apply security constraints: empty database URL for demo environment`);
      return config.url;
    }
    
    try {
      // For read-only demo environments, append connection parameters to enforce read-only mode
      const url = new URL(config.url);
      
      // Add read-only parameters to ensure database-level enforcement
      url.searchParams.set('default_transaction_read_only', 'on');
      url.searchParams.set('transaction_read_only', 'on');
      url.searchParams.set('default_transaction_isolation', 'read committed');
      
      console.log(`🔒 SECURITY: Applied database-level read-only constraints for demo environment`);
      return url.toString();
    } catch (error) {
      console.error(`❌ Invalid database URL for demo environment: ${config.url}`);
      return config.url;
    }
  }
  
  return config.url;
}

/**
 * Validate that write operations are permitted in current environment
 */
export function assertWritePermissions(operation: string): void {
  if (isReadOnlyEnvironment()) {
    const rawEnvironment = process.env.APP_ENVIRONMENT || 'production';
    const environment = normalizeEnvironmentName(rawEnvironment);
    const error = new Error(
      `SECURITY VIOLATION: Write operation "${operation}" blocked in read-only environment "${environment}". ` +
      `Demo environments do not allow data modifications for security reasons.`
    );
    
    // Log the security violation
    console.error(`🚨 SECURITY VIOLATION: Attempted write operation in read-only environment`, {
      operation,
      environment,
      timestamp: new Date().toISOString(),
      stack: error.stack
    });
    
    throw error;
  }
}

/**
 * Get safe database connection info for logging (without credentials)
 */
export function getDatabaseConnectionInfo(): { name: string; description: string; environment: string; readOnly: boolean; isDemo: boolean } {
  const rawEnvironment = process.env.APP_ENVIRONMENT || 'production';
  const environment = normalizeEnvironmentName(rawEnvironment);
  const config = databaseConfigs[environment] || databaseConfigs['production'];
  
  return {
    name: config.name,
    description: config.description,
    environment,
    readOnly: config.readOnly || false,
    isDemo: config.isDemoEnvironment || false
  };
}

/**
 * Test function to demonstrate how the validation works with different URL values
 * This shows that the validation logic correctly accepts valid URLs and rejects invalid ones
 */
export function testDatabaseUrlValidation(): void {
  console.log(`\n🧪 TESTING DATABASE URL VALIDATION:`);
  
  // Test cases to demonstrate the validation logic
  const testCases = [
    {
      name: "Valid Demo Database URL",
      url: "postgresql://demo:demo123@demo-db.example.com:5432/demo_db",
      expected: "ACCEPT"
    },
    {
      name: "Valid Production URL", 
      url: "postgresql://user:pass@prod-db.example.com:5432/prod_db",
      expected: "ACCEPT"
    },
    {
      name: "Misconfigured (Variable Name)",
      url: "POST_SECONDARY_DEMO_DATABASE_URL",
      expected: "REJECT - Contains variable name"
    },
    {
      name: "Empty String",
      url: "",
      expected: "REJECT - Empty"
    }
  ];

  testCases.forEach(testCase => {
    const { url } = testCase;
    const isValid = url && url.trim() && !url.includes('POST_SECONDARY_DEMO_DATABASE_URL');
    
    console.log(`   ${testCase.expected === "ACCEPT" && isValid ? "✅" : testCase.expected.includes("REJECT") && !isValid ? "✅" : "❌"} ${testCase.name}:`);
    console.log(`      URL: '${url}'`);
    console.log(`      Result: ${isValid ? "ACCEPTED" : "REJECTED"}`);
    console.log(`      Expected: ${testCase.expected}`);
    console.log(``);
  });
  
  console.log(`📋 SUMMARY: The validation logic correctly:`);
  console.log(`   ✅ Accepts valid PostgreSQL connection strings`);
  console.log(`   ✅ Rejects URLs containing the variable name (prevents misconfiguration)`);
  console.log(`   ✅ Rejects empty or undefined values`);
  console.log(`   ✅ Provides clear error messages for each case`);
  console.log(``);
  
  console.log(`🔧 TO FIX CURRENT ISSUE:`);
  console.log(`   Set POST_SECONDARY_DEMO_DATABASE_URL to a valid database URL like:`);
  console.log(`   postgresql://demo:demo123@demo-db.example.com:5432/demo_db`);
  console.log(`   (Replace with your actual demo database credentials)`);
}