import { Pool } from 'pg';
import { neon, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

// Configure Neon for serverless if needed
neonConfig.webSocketConstructor = ws;

export type DatabaseProvider = 'replit' | 'neon' | 'local';

interface DatabaseConfig {
  provider: DatabaseProvider;
  connectionString: string;
  ssl?: boolean;
}

export class DatabaseConnectionManager {
  private static instance: DatabaseConnectionManager;
  private pool: Pool | null = null;
  private config: DatabaseConfig;

  private constructor() {
    this.config = this.loadConfig();
  }

  static getInstance(): DatabaseConnectionManager {
    if (!DatabaseConnectionManager.instance) {
      DatabaseConnectionManager.instance = new DatabaseConnectionManager();
    }
    return DatabaseConnectionManager.instance;
  }

  private loadConfig(): DatabaseConfig {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is required');
    }

    // Detect provider from URL
    let provider: DatabaseProvider = 'local';
    if (databaseUrl.includes('neon.tech')) {
      provider = 'neon';
    } else if (databaseUrl.includes('replit') || process.env.REPL_ID) {
      provider = 'replit';
    }

    return {
      provider,
      connectionString: databaseUrl,
      ssl: provider === 'neon'
    };
  }

  getPool(): Pool {
    if (!this.pool) {
      this.pool = new Pool({
        connectionString: this.config.connectionString,
        ssl: this.config.ssl ? { rejectUnauthorized: false } : false,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      });

      console.log(`Database connected via ${this.config.provider} provider`);
    }
    return this.pool;
  }

  async disconnect(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }
  }

  getProvider(): DatabaseProvider {
    return this.config.provider;
  }

  // For Neon serverless functions (edge runtime)
  getNeonClient() {
    if (this.config.provider !== 'neon') {
      throw new Error('Neon client is only available for Neon provider');
    }
    return neon(this.config.connectionString);
  }
}