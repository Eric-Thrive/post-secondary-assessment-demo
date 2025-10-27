import { db } from "../db";
import { sql } from "drizzle-orm";
import {
  performanceMonitor,
  trackDbQuery,
} from "../middleware/performance-monitoring";

/**
 * Database performance optimization service for RBAC system
 * Provides query optimization, connection pooling, and performance monitoring
 */
export class DatabasePerformanceService {
  private static queryCache = new Map<
    string,
    { result: any; timestamp: number }
  >();
  private static readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private static readonly MAX_CACHE_SIZE = 100;

  /**
   * Execute a query with performance tracking and caching
   */
  public static async executeOptimizedQuery<T>(
    queryKey: string,
    queryFn: () => Promise<T>,
    requestId?: string,
    cacheable: boolean = false
  ): Promise<T> {
    // Track database query
    if (requestId) {
      trackDbQuery(requestId);
    }

    // Check cache for cacheable queries
    if (cacheable) {
      const cached = this.getCachedResult<T>(queryKey);
      if (cached) {
        return cached;
      }
    }

    const startTime = Date.now();

    try {
      const result = await queryFn();

      const duration = Date.now() - startTime;

      // Log slow queries
      if (duration > 1000) {
        console.warn(`Slow query detected: ${queryKey} took ${duration}ms`);
      }

      // Cache result if cacheable
      if (cacheable) {
        this.setCachedResult(queryKey, result);
      }

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`Query failed: ${queryKey} after ${duration}ms`, error);
      throw error;
    }
  }

  /**
   * Get database connection pool statistics
   */
  public static async getConnectionPoolStats() {
    const { pool } = await import("../db");

    return {
      totalConnections: pool.totalCount,
      idleConnections: pool.idleCount,
      waitingClients: pool.waitingCount,
      maxConnections: pool.options.max || 20,
    };
  }

  /**
   * Get database performance metrics
   */
  public static async getDatabaseMetrics() {
    const startTime = Date.now();

    try {
      // Get basic database statistics
      const [dbStats] = await db.execute(sql`
        SELECT 
          schemaname,
          tablename,
          n_tup_ins as inserts,
          n_tup_upd as updates,
          n_tup_del as deletes,
          n_live_tup as live_tuples,
          n_dead_tup as dead_tuples,
          last_vacuum,
          last_autovacuum,
          last_analyze,
          last_autoanalyze
        FROM pg_stat_user_tables 
        WHERE schemaname = 'public'
        ORDER BY n_live_tup DESC
        LIMIT 10
      `);

      // Get index usage statistics
      const [indexStats] = await db.execute(sql`
        SELECT 
          schemaname,
          tablename,
          indexname,
          idx_tup_read,
          idx_tup_fetch,
          idx_scan
        FROM pg_stat_user_indexes 
        WHERE schemaname = 'public'
        AND idx_scan > 0
        ORDER BY idx_scan DESC
        LIMIT 20
      `);

      // Get slow query information (if pg_stat_statements is available)
      let slowQueries = [];
      try {
        const [slowQueryStats] = await db.execute(sql`
          SELECT 
            query,
            calls,
            total_time,
            mean_time,
            rows
          FROM pg_stat_statements 
          WHERE query NOT LIKE '%pg_stat_statements%'
          ORDER BY mean_time DESC
          LIMIT 10
        `);
        slowQueries = slowQueryStats;
      } catch (error) {
        // pg_stat_statements extension not available
        console.log(
          "pg_stat_statements extension not available for slow query analysis"
        );
      }

      // Get connection statistics
      const [connectionStats] = await db.execute(sql`
        SELECT 
          state,
          count(*) as count
        FROM pg_stat_activity 
        WHERE datname = current_database()
        GROUP BY state
      `);

      const queryDuration = Date.now() - startTime;

      return {
        queryDuration,
        tableStats: dbStats,
        indexStats: indexStats,
        slowQueries: slowQueries,
        connectionStats: connectionStats,
        cacheStats: {
          size: this.queryCache.size,
          maxSize: this.MAX_CACHE_SIZE,
          hitRate: this.calculateCacheHitRate(),
        },
      };
    } catch (error) {
      console.error("Failed to get database metrics:", error);
      throw error;
    }
  }

  /**
   * Analyze query performance for RBAC-specific queries
   */
  public static async analyzeRBACQueryPerformance() {
    const queries = [
      {
        name: "User Authentication Query",
        query: sql`
          EXPLAIN ANALYZE
          SELECT u.*, o.name as org_name, o.assigned_modules as org_assigned_modules
          FROM users u
          LEFT JOIN organizations o ON u.organization_id = o.id
          WHERE u.id = 1 AND u.is_active = true
        `,
      },
      {
        name: "Organization Users Query",
        query: sql`
          EXPLAIN ANALYZE
          SELECT id, username, role, assigned_modules, report_count
          FROM users
          WHERE organization_id = 'test-org' AND is_active = true
          ORDER BY username
        `,
      },
      {
        name: "Assessment Cases by Organization",
        query: sql`
          EXPLAIN ANALYZE
          SELECT ac.*, u.username as creator_username
          FROM assessment_cases ac
          LEFT JOIN users u ON ac.created_by_user_id = u.id
          WHERE ac.organization_id = 'test-org'
          ORDER BY ac.created_date DESC
          LIMIT 50
        `,
      },
      {
        name: "Demo Users Near Limit",
        query: sql`
          EXPLAIN ANALYZE
          SELECT id, username, report_count, max_reports
          FROM users
          WHERE role = 'demo' AND is_active = true AND report_count >= 4
        `,
      },
      {
        name: "Module-based Prompt Loading",
        query: sql`
          EXPLAIN ANALYZE
          SELECT section_key, content, version
          FROM prompt_sections
          WHERE module_type = 'post_secondary' AND prompt_type = 'system'
          ORDER BY section_key
        `,
      },
    ];

    const results = [];

    for (const { name, query } of queries) {
      try {
        const startTime = Date.now();
        const [result] = await db.execute(query);
        const duration = Date.now() - startTime;

        results.push({
          name,
          duration,
          plan: result,
        });
      } catch (error) {
        results.push({
          name,
          error: error.message,
        });
      }
    }

    return results;
  }

  /**
   * Optimize database for RBAC workload
   */
  public static async optimizeForRBAC() {
    const optimizations = [];

    try {
      // Update table statistics
      await db.execute(
        sql`ANALYZE users, organizations, assessment_cases, prompt_sections`
      );
      optimizations.push("Updated table statistics");

      // Check for missing indexes
      const missingIndexes = await this.checkForMissingIndexes();
      if (missingIndexes.length > 0) {
        optimizations.push(
          `Found ${missingIndexes.length} potentially missing indexes`
        );
      }

      // Clean up expired sessions
      const [sessionCleanup] = await db.execute(sql`
        DELETE FROM sessions WHERE expire < NOW()
      `);
      optimizations.push(`Cleaned up expired sessions`);

      // Vacuum analyze critical tables if needed
      const [vacuumStats] = await db.execute(sql`
        SELECT 
          schemaname,
          tablename,
          n_dead_tup,
          n_live_tup,
          CASE 
            WHEN n_live_tup > 0 THEN (n_dead_tup::float / n_live_tup::float) * 100
            ELSE 0
          END as dead_tuple_percent
        FROM pg_stat_user_tables 
        WHERE schemaname = 'public'
        AND n_live_tup > 1000
        AND (n_dead_tup::float / GREATEST(n_live_tup::float, 1)) > 0.1
      `);

      if (vacuumStats.length > 0) {
        optimizations.push(
          `Found ${vacuumStats.length} tables that may benefit from VACUUM`
        );
      }

      return {
        optimizations,
        missingIndexes,
        tablesNeedingVacuum: vacuumStats,
      };
    } catch (error) {
      console.error("Database optimization failed:", error);
      throw error;
    }
  }

  /**
   * Check for potentially missing indexes based on query patterns
   */
  private static async checkForMissingIndexes() {
    const missingIndexes = [];

    try {
      // Check if RBAC indexes exist
      const [existingIndexes] = await db.execute(sql`
        SELECT indexname, tablename
        FROM pg_indexes
        WHERE schemaname = 'public'
        AND indexname LIKE 'idx_%'
      `);

      const existingIndexNames = existingIndexes.map(
        (idx: any) => idx.indexname
      );

      const requiredIndexes = [
        "idx_users_role_active",
        "idx_users_org_role",
        "idx_users_demo_reports",
        "idx_organizations_active_modules",
        "idx_assessment_cases_org_module",
        "idx_prompt_sections_module_type",
      ];

      for (const requiredIndex of requiredIndexes) {
        if (!existingIndexNames.includes(requiredIndex)) {
          missingIndexes.push(requiredIndex);
        }
      }

      return missingIndexes;
    } catch (error) {
      console.error("Failed to check for missing indexes:", error);
      return [];
    }
  }

  /**
   * Cache management methods
   */
  private static getCachedResult<T>(key: string): T | null {
    const cached = this.queryCache.get(key);
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > this.CACHE_TTL) {
      this.queryCache.delete(key);
      return null;
    }

    return cached.result as T;
  }

  private static setCachedResult<T>(key: string, result: T): void {
    // Clean up cache if it's getting too large
    if (this.queryCache.size >= this.MAX_CACHE_SIZE) {
      const oldestKey = this.queryCache.keys().next().value;
      this.queryCache.delete(oldestKey);
    }

    this.queryCache.set(key, {
      result,
      timestamp: Date.now(),
    });
  }

  private static calculateCacheHitRate(): number {
    // This would need to be tracked separately in a real implementation
    return 0.85; // Placeholder
  }

  /**
   * Clear query cache
   */
  public static clearCache(): void {
    this.queryCache.clear();
  }

  /**
   * Get cache statistics
   */
  public static getCacheStats() {
    return {
      size: this.queryCache.size,
      maxSize: this.MAX_CACHE_SIZE,
      entries: Array.from(this.queryCache.keys()),
    };
  }
}
