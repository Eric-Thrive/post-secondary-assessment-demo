// Shared Environment Detection Utility
// Provides consistent environment normalization across the application

/**
 * Normalize environment string to standard format
 * Handles various formats like "post_secondary_demo", "post-secondary-demo", etc.
 */
export function normalizeEnvironment(env: string | undefined): string {
  if (!env) return 'production';
  
  // Convert to lowercase and replace underscores with hyphens
  return env.toLowerCase()
    .replace(/_/g, '-')
    .trim();
}

/**
 * Check if the current environment is a demo environment
 * Supports multiple environment variable formats and normalization
 */
export function isDemoEnvironment(): boolean {
  // Check multiple possible environment variables
  const envVars = [
    process.env.NODE_ENV,
    process.env.POST_SECONDARY_DEMO,
    process.env.DEMO_MODE,
    process.env.ENVIRONMENT
  ];
  
  // Check if any environment variable indicates demo mode
  for (const envVar of envVars) {
    if (!envVar) continue;
    
    const normalized = normalizeEnvironment(envVar);
    
    // Check for demo indicators
    if (normalized.includes('demo') || 
        normalized === 'post-secondary-demo' ||
        normalized === 'true' || // For POST_SECONDARY_DEMO=true
        normalized === 'yes') {
      return true;
    }
  }
  
  // Also check if specific demo flag is set
  if (process.env.POST_SECONDARY_DEMO === 'true' || 
      process.env.POST_SECONDARY_DEMO === '1') {
    return true;
  }
  
  return false;
}

/**
 * Get the specific module type from the environment
 */
export function getModuleFromEnvironment(): string {
  const env = normalizeEnvironment(process.env.NODE_ENV);
  
  if (env.includes('post-secondary')) {
    return 'post_secondary';
  } else if (env.includes('k12')) {
    return 'k12';
  } else if (env.includes('tutoring')) {
    return 'tutoring';
  }
  
  // Default to production/general
  return 'general';
}

/**
 * Check if environment matches a specific pattern
 */
export function isEnvironment(pattern: string): boolean {
  const currentEnv = normalizeEnvironment(process.env.NODE_ENV);
  const normalizedPattern = normalizeEnvironment(pattern);
  
  return currentEnv === normalizedPattern || currentEnv.includes(normalizedPattern);
}

// Export environment status for logging
export function getEnvironmentStatus(): {
  raw: string | undefined;
  normalized: string;
  isDemo: boolean;
  module: string;
} {
  const raw = process.env.NODE_ENV;
  const normalized = normalizeEnvironment(raw);
  const isDemo = isDemoEnvironment();
  const module = getModuleFromEnvironment();
  
  return {
    raw,
    normalized,
    isDemo,
    module
  };
}

export default {
  normalizeEnvironment,
  isDemoEnvironment,
  getModuleFromEnvironment,
  isEnvironment,
  getEnvironmentStatus
};