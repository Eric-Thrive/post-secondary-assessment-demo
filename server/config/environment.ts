export interface EnvironmentConfig {
  isDevelopment: boolean;
  isProduction: boolean;
  aiPipelineMode: 'simple' | 'complex';
  useSimplePathway: boolean;
  useLookupTables: boolean;
  database: {
    provider: 'neon';
    url: string;
  };
  openai: {
    apiKey: string;
  };
}

export function getEnvironmentConfig(): EnvironmentConfig {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const isDevelopment = nodeEnv === 'development';
  const isProduction = nodeEnv === 'production';
  
  // Determine AI pipeline mode
  const aiPipelineMode = (process.env.AI_PIPELINE_MODE || 'simple') as 'simple' | 'complex';
  
  // Feature flags
  const useSimplePathway = process.env.USE_SIMPLE_PATHWAY === 'true';
  const useLookupTables = process.env.USE_LOOKUP_TABLES === 'true';
  
  // Database configuration
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required');
  }
  
  // Always use neon provider for Replit PostgreSQL
  const databaseProvider = 'neon' as const;
  
  const config: EnvironmentConfig = {
    isDevelopment,
    isProduction,
    aiPipelineMode,
    useSimplePathway,
    useLookupTables,
    database: {
      provider: databaseProvider,
      url: databaseUrl
    },
    openai: {
      apiKey: process.env.OPENAI_API_KEY || ''
    }
  };
  
  
  return config;
}

// Export singleton instance
export const envConfig = getEnvironmentConfig();