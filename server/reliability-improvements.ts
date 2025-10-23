import { Request, Response, NextFunction } from 'express';
import { pool } from './db';

/**
 * Request timeout middleware - prevents hanging requests
 */
export function requestTimeout(timeoutMs: number = 120000) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Skip timeout for long-running AI operations (handle separately)
    if (req.path.includes('/analyze-assessment') ||
        req.path.includes('/demo-analyze') ||
        req.path.includes('/ai/analyze')) {
      return next();
    }

    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        console.error(`Request timeout: ${req.method} ${req.path}`);
        res.status(504).json({
          error: 'Request timeout',
          message: 'The server took too long to respond'
        });
      }
    }, timeoutMs);

    res.on('finish', () => clearTimeout(timeout));
    res.on('close', () => clearTimeout(timeout));

    next();
  };
}

/**
 * Graceful shutdown handler
 */
export function setupGracefulShutdown(server: any) {
  let isShuttingDown = false;

  const shutdown = async (signal: string) => {
    if (isShuttingDown) return;
    isShuttingDown = true;

    console.log(`\n${signal} received. Starting graceful shutdown...`);

    // Stop accepting new connections
    server.close(() => {
      console.log('HTTP server closed');
    });

    // Close database pool
    try {
      await pool.end();
      console.log('Database pool closed');
    } catch (error) {
      console.error('Error closing database pool:', error);
    }

    // Give pending requests time to complete
    setTimeout(() => {
      console.log('Forcing shutdown');
      process.exit(isShuttingDown ? 0 : 1);
    }, 10000); // 10 second grace period
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // Handle uncaught errors
  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    shutdown('UNCAUGHT_EXCEPTION');
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  });
}

/**
 * Database health check middleware
 */
export async function healthCheck(req: Request, res: Response) {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();

    res.status(200).json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Conditional logging - reduces overhead in production
 */
export function createLogger(isDevelopment: boolean) {
  return {
    debug: (...args: any[]) => {
      if (isDevelopment) console.log('[DEBUG]', ...args);
    },
    info: (...args: any[]) => {
      console.log('[INFO]', ...args);
    },
    warn: (...args: any[]) => {
      console.warn('[WARN]', ...args);
    },
    error: (...args: any[]) => {
      console.error('[ERROR]', ...args);
    }
  };
}
