import { db } from "../db";
import {
  performanceMetrics,
  type InsertPerformanceMetric,
} from "../../../packages/db/schema";
import { and, eq, gte, desc, avg, count, max } from "drizzle-orm";
import { Request, Response, NextFunction } from "express";

export interface PerformanceMetricData {
  metricType: "api_response" | "ai_processing" | "database_query";
  endpoint?: string;
  method?: string;
  statusCode?: number;
  duration: number;
  tokenUsage?: number;
  cost?: string;
  environment?: string;
  userId?: number;
  customerId?: string;
  moduleType?: string;
  pathwayType?: string;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

class PerformanceMonitorService {
  private metricsBuffer: InsertPerformanceMetric[] = [];
  private bufferSize = 100;
  private flushInterval = 30000; // 30 seconds
  private flushTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.startPeriodicFlush();
  }

  /**
   * Record a performance metric
   */
  async recordMetric(data: PerformanceMetricData): Promise<void> {
    const metric: InsertPerformanceMetric = {
      metricType: data.metricType,
      endpoint: data.endpoint,
      method: data.method,
      statusCode: data.statusCode,
      duration: data.duration,
      tokenUsage: data.tokenUsage,
      cost: data.cost,
      environment:
        data.environment || process.env.APP_ENVIRONMENT || "production",
      userId: data.userId,
      customerId: data.customerId,
      moduleType: data.moduleType,
      pathwayType: data.pathwayType,
      errorMessage: data.errorMessage,
      metadata: data.metadata,
    };

    this.metricsBuffer.push(metric);

    // Flush if buffer is full
    if (this.metricsBuffer.length >= this.bufferSize) {
      await this.flushMetrics();
    }
  }

  /**
   * Flush metrics buffer to database
   */
  private async flushMetrics(): Promise<void> {
    if (this.metricsBuffer.length === 0) return;

    try {
      const metricsToFlush = [...this.metricsBuffer];
      this.metricsBuffer = [];

      await db.insert(performanceMetrics).values(metricsToFlush);
      console.log(
        `Flushed ${metricsToFlush.length} performance metrics to database`
      );
    } catch (error) {
      console.error("Failed to flush performance metrics:", error);
      // Re-add metrics to buffer for retry
      this.metricsBuffer.unshift(...this.metricsBuffer);
    }
  }

  /**
   * Start periodic flush timer
   */
  private startPeriodicFlush(): void {
    this.flushTimer = setInterval(async () => {
      await this.flushMetrics();
    }, this.flushInterval);
  }

  /**
   * Stop periodic flush and flush remaining metrics
   */
  async shutdown(): Promise<void> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    await this.flushMetrics();
  }

  /**
   * Get performance statistics for an endpoint
   */
  async getEndpointStats(
    endpoint: string,
    hours: number = 24
  ): Promise<{
    count: number;
    avgDuration: number;
    p50Duration: number;
    p95Duration: number;
    p99Duration: number;
    errorRate: number;
  }> {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    const metrics = await db
      .select()
      .from(performanceMetrics)
      .where(
        and(
          eq(performanceMetrics.endpoint, endpoint),
          eq(performanceMetrics.metricType, "api_response"),
          gte(performanceMetrics.timestamp, since)
        )
      )
      .orderBy(performanceMetrics.duration);

    if (metrics.length === 0) {
      return {
        count: 0,
        avgDuration: 0,
        p50Duration: 0,
        p95Duration: 0,
        p99Duration: 0,
        errorRate: 0,
      };
    }

    const durations = metrics.map((m) => m.duration);
    const errorCount = metrics.filter(
      (m) => m.statusCode && m.statusCode >= 400
    ).length;

    return {
      count: metrics.length,
      avgDuration: Math.round(
        durations.reduce((a, b) => a + b, 0) / durations.length
      ),
      p50Duration: this.percentile(durations, 0.5),
      p95Duration: this.percentile(durations, 0.95),
      p99Duration: this.percentile(durations, 0.99),
      errorRate: Math.round((errorCount / metrics.length) * 100 * 100) / 100, // Round to 2 decimal places
    };
  }

  /**
   * Calculate percentile from sorted array
   */
  private percentile(sortedArray: number[], p: number): number {
    const index = Math.ceil(sortedArray.length * p) - 1;
    return sortedArray[Math.max(0, index)];
  }

  /**
   * Get slow queries (database performance metrics)
   */
  async getSlowQueries(
    thresholdMs: number = 1000,
    hours: number = 24
  ): Promise<
    Array<{
      endpoint: string;
      avgDuration: number;
      count: number;
      maxDuration: number;
    }>
  > {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    const slowQueries = await db
      .select({
        endpoint: performanceMetrics.endpoint,
        avgDuration: avg(performanceMetrics.duration),
        count: count(),
        maxDuration: max(performanceMetrics.duration),
      })
      .from(performanceMetrics)
      .where(
        and(
          eq(performanceMetrics.metricType, "database_query"),
          gte(performanceMetrics.duration, thresholdMs),
          gte(performanceMetrics.timestamp, since)
        )
      )
      .groupBy(performanceMetrics.endpoint)
      .orderBy(desc(avg(performanceMetrics.duration)));

    return slowQueries.map((q) => ({
      endpoint: q.endpoint || "unknown",
      avgDuration: Math.round(Number(q.avgDuration)),
      count: Number(q.count),
      maxDuration: Number(q.maxDuration),
    }));
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitorService();

/**
 * Express middleware to track API response times
 */
export function apiResponseTimeMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const startTime = Date.now();
  const originalSend = res.send;

  // Override res.send to capture when response is sent
  res.send = function (body: any) {
    const duration = Date.now() - startTime;

    // Record the metric asynchronously
    performanceMonitor
      .recordMetric({
        metricType: "api_response",
        endpoint: req.path,
        method: req.method,
        statusCode: res.statusCode,
        duration,
        userId: (req as any).user?.id,
        customerId: (req as any).user?.customerId,
        moduleType: extractModuleType(req.path),
        pathwayType: extractPathwayType(req.body),
        errorMessage: res.statusCode >= 400 ? body?.message : undefined,
        metadata: {
          userAgent: req.get("User-Agent"),
          contentLength: body ? JSON.stringify(body).length : 0,
        },
      })
      .catch((error) => {
        console.error("Failed to record API response metric:", error);
      });

    return originalSend.call(this, body);
  };

  next();
}

/**
 * Extract module type from request path
 */
function extractModuleType(path: string): string | undefined {
  if (path.includes("/k12")) return "k12";
  if (path.includes("/post-secondary") || path.includes("/post_secondary"))
    return "post_secondary";
  if (path.includes("/tutoring")) return "tutoring";
  return undefined;
}

/**
 * Extract pathway type from request body
 */
function extractPathwayType(body: any): string | undefined {
  if (body?.pathwayType) return body.pathwayType;
  if (body?.pathway) return body.pathway;
  return undefined;
}

// Graceful shutdown handler
process.on("SIGTERM", async () => {
  console.log("Shutting down performance monitor...");
  await performanceMonitor.shutdown();
});

process.on("SIGINT", async () => {
  console.log("Shutting down performance monitor...");
  await performanceMonitor.shutdown();
});
