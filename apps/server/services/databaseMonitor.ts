import { performanceMonitor } from "./performanceMonitor";
import { db, pool } from "../db";
import { sql } from "drizzle-orm";

export interface DatabaseQueryMetrics {
  query: string;
  duration: number;
  endpoint?: string;
  userId?: number;
  customerId?: string;
  success: boolean;
  errorMessage?: string;
  rowCount?: number;
}

/**
 * Database query monitoring wrapper
 */
export class DatabaseMonitor {
  /**
   * Monitor a database query execution
   */
  static async monitorQuery<T>(
    queryFn: () => Promise<T>,
    context: {
      queryName: string;
      endpoint?: string;
      userId?: number;
      customerId?: string;
    }
  ): Promise<T> {
    const startTime = Date.now();

    try {
      const result = await queryFn();
      const duration = Date.now() - startTime;

      // Record successful query metrics
      await performanceMonitor.recordMetric({
        metricType: "database_query",
        endpoint: context.endpoint || context.queryName,
        duration,
        userId: context.userId,
        customerId: context.customerId,
        metadata: {
          queryName: context.queryName,
          success: true,
          rowCount: Array.isArray(result) ? result.length : 1,
        },
      });

      // Log slow queries
      if (duration > 1000) {
        console.warn(
          `🐌 Slow query detected: ${context.queryName} took ${duration}ms`
        );
      }

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      // Record failed query metrics
      await performanceMonitor.recordMetric({
        metricType: "database_query",
        endpoint: context.endpoint || context.queryName,
        duration,
        userId: context.userId,
        customerId: context.customerId,
        errorMessage:
          error instanceof Error ? error.message : "Unknown database error",
        metadata: {
          queryName: context.queryName,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        },
      });

      throw error;
    }
  }

  /**
   * Get database connection pool statistics
   */
  static async getConnectionPoolStats(): Promise<{
    totalConnections: number;
    idleConnections: number;
    waitingClients: number;
  }> {
    return {
      totalConnections: pool.totalCount,
      idleConnections: pool.idleCount,
      waitingClients: pool.waitingCount,
    };
  }

  /**
   * Get database performance statistics
   */
  static async getDatabaseStats(): Promise<{
    activeConnections: number;
    maxConnections: number;
    databaseSize: string;
    slowQueries: Array<{
      query: string;
      avgDuration: number;
      callCount: number;
    }>;
  }> {
    try {
      // Get active connections
      const activeConnectionsResult = await db.execute(
        sql`SELECT count(*) as active_connections FROM pg_stat_activity WHERE state = 'active'`
      );
      const activeConnections = Number(
        activeConnectionsResult[0]?.active_connections || 0
      );

      // Get max connections
      const maxConnectionsResult = await db.execute(sql`SHOW max_connections`);
      const maxConnections = Number(
        maxConnectionsResult[0]?.max_connections || 0
      );

      // Get database size
      const dbSizeResult = await db.execute(
        sql`SELECT pg_size_pretty(pg_database_size(current_database())) as database_size`
      );
      const databaseSize = String(dbSizeResult[0]?.database_size || "0 bytes");

      // Get slow queries from our performance metrics
      const slowQueries = await performanceMonitor.getSlowQueries(1000, 24);

      return {
        activeConnections,
        maxConnections,
        databaseSize,
        slowQueries,
      };
    } catch (error) {
      console.error("Failed to get database stats:", error);
      return {
        activeConnections: 0,
        maxConnections: 0,
        databaseSize: "0 bytes",
        slowQueries: [],
      };
    }
  }

  /**
   * Analyze query performance and provide optimization recommendations
   */
  static async analyzeQueryPerformance(hours: number = 24): Promise<{
    recommendations: Array<{
      type: "index" | "query_optimization" | "connection_pool" | "general";
      priority: "high" | "medium" | "low";
      description: string;
      impact: string;
      solution: string;
    }>;
    summary: {
      totalQueries: number;
      avgDuration: number;
      slowQueries: number;
      errorRate: number;
    };
  }> {
    const recommendations: Array<{
      type: "index" | "query_optimization" | "connection_pool" | "general";
      priority: "high" | "medium" | "low";
      description: string;
      impact: string;
      solution: string;
    }> = [];

    try {
      // Get slow queries
      const slowQueries = await performanceMonitor.getSlowQueries(500, hours);
      const connectionStats = await this.getConnectionPoolStats();

      // Analyze slow queries
      if (slowQueries.length > 0) {
        const avgSlowQueryDuration =
          slowQueries.reduce((sum, q) => sum + q.avgDuration, 0) /
          slowQueries.length;

        if (avgSlowQueryDuration > 5000) {
          recommendations.push({
            type: "query_optimization",
            priority: "high",
            description: `${slowQueries.length} queries averaging ${Math.round(
              avgSlowQueryDuration
            )}ms`,
            impact: "High response times affecting user experience",
            solution:
              "Review and optimize slow queries, consider adding indexes or query restructuring",
          });
        }

        // Check for specific query patterns that might need indexes
        const frequentSlowQueries = slowQueries.filter((q) => q.count > 10);
        if (frequentSlowQueries.length > 0) {
          recommendations.push({
            type: "index",
            priority: "high",
            description: `${frequentSlowQueries.length} frequently executed slow queries detected`,
            impact:
              "Repeated slow queries causing cumulative performance degradation",
            solution: "Add database indexes for frequently queried columns",
          });
        }
      }

      // Analyze connection pool
      const connectionUtilization = connectionStats.totalConnections / 20; // Assuming max 20 connections
      if (connectionUtilization > 0.8) {
        recommendations.push({
          type: "connection_pool",
          priority: "medium",
          description: `High connection pool utilization: ${Math.round(
            connectionUtilization * 100
          )}%`,
          impact: "Potential connection bottlenecks during peak usage",
          solution:
            "Consider increasing connection pool size or optimizing connection usage",
        });
      }

      // General recommendations based on query patterns
      if (slowQueries.length === 0) {
        recommendations.push({
          type: "general",
          priority: "low",
          description: "Database performance is optimal",
          impact: "No immediate performance concerns",
          solution:
            "Continue monitoring and maintain current optimization practices",
        });
      }

      // Calculate summary statistics
      const totalQueries = slowQueries.reduce((sum, q) => sum + q.count, 0);
      const avgDuration =
        slowQueries.length > 0
          ? slowQueries.reduce((sum, q) => sum + q.avgDuration, 0) /
            slowQueries.length
          : 0;

      return {
        recommendations,
        summary: {
          totalQueries,
          avgDuration: Math.round(avgDuration),
          slowQueries: slowQueries.length,
          errorRate: 0, // Would need to track query errors separately
        },
      };
    } catch (error) {
      console.error("Failed to analyze query performance:", error);
      return {
        recommendations: [
          {
            type: "general",
            priority: "high",
            description: "Failed to analyze database performance",
            impact: "Unable to provide performance insights",
            solution: "Check database connectivity and monitoring system",
          },
        ],
        summary: {
          totalQueries: 0,
          avgDuration: 0,
          slowQueries: 0,
          errorRate: 0,
        },
      };
    }
  }

  /**
   * Get real-time database health metrics
   */
  static async getHealthMetrics(): Promise<{
    status: "healthy" | "warning" | "critical";
    metrics: {
      connectionPool: {
        total: number;
        idle: number;
        waiting: number;
        utilization: number;
      };
      performance: {
        avgQueryTime: number;
        slowQueries: number;
        activeConnections: number;
      };
      storage: {
        databaseSize: string;
        connectionLimit: number;
      };
    };
    alerts: string[];
  }> {
    try {
      const connectionStats = await this.getConnectionPoolStats();
      const dbStats = await this.getDatabaseStats();
      const slowQueries = await performanceMonitor.getSlowQueries(1000, 1); // Last hour

      const utilization = connectionStats.totalConnections / 20; // Assuming max 20
      const avgQueryTime =
        slowQueries.length > 0
          ? slowQueries.reduce((sum, q) => sum + q.avgDuration, 0) /
            slowQueries.length
          : 0;

      const alerts: string[] = [];
      let status: "healthy" | "warning" | "critical" = "healthy";

      // Check for alerts
      if (utilization > 0.9) {
        alerts.push("High connection pool utilization");
        status = "critical";
      } else if (utilization > 0.7) {
        alerts.push("Moderate connection pool utilization");
        if (status === "healthy") status = "warning";
      }

      if (avgQueryTime > 5000) {
        alerts.push("High average query response time");
        status = "critical";
      } else if (avgQueryTime > 2000) {
        alerts.push("Elevated query response times");
        if (status === "healthy") status = "warning";
      }

      if (slowQueries.length > 5) {
        alerts.push(
          `${slowQueries.length} slow queries detected in the last hour`
        );
        if (status === "healthy") status = "warning";
      }

      return {
        status,
        metrics: {
          connectionPool: {
            total: connectionStats.totalConnections,
            idle: connectionStats.idleConnections,
            waiting: connectionStats.waitingClients,
            utilization: Math.round(utilization * 100) / 100,
          },
          performance: {
            avgQueryTime: Math.round(avgQueryTime),
            slowQueries: slowQueries.length,
            activeConnections: dbStats.activeConnections,
          },
          storage: {
            databaseSize: dbStats.databaseSize,
            connectionLimit: dbStats.maxConnections,
          },
        },
        alerts,
      };
    } catch (error) {
      console.error("Failed to get database health metrics:", error);
      return {
        status: "critical",
        metrics: {
          connectionPool: { total: 0, idle: 0, waiting: 0, utilization: 0 },
          performance: {
            avgQueryTime: 0,
            slowQueries: 0,
            activeConnections: 0,
          },
          storage: { databaseSize: "0 bytes", connectionLimit: 0 },
        },
        alerts: ["Failed to retrieve database health metrics"],
      };
    }
  }
}
