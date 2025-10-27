import { Request, Response, NextFunction } from "express";
import { promptCache } from "../services/prompt-cache";

/**
 * Performance monitoring middleware for RBAC system
 * Tracks query performance and cache hit rates
 */
export interface PerformanceMetrics {
  requestId: string;
  endpoint: string;
  method: string;
  userId?: number;
  userRole?: string;
  organizationId?: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  dbQueries: number;
  cacheHits: number;
  cacheMisses: number;
  memoryUsage: number;
  errors?: string[];
}

class PerformanceMonitor {
  private metrics = new Map<string, PerformanceMetrics>();
  private readonly MAX_METRICS_HISTORY = 1000;

  /**
   * Start performance tracking for a request
   */
  public startTracking(req: Request): string {
    const requestId = this.generateRequestId();
    const startTime = Date.now();

    const metrics: PerformanceMetrics = {
      requestId,
      endpoint: req.path,
      method: req.method,
      userId: req.user?.id,
      userRole: req.user?.role,
      organizationId: req.user?.organizationId,
      startTime,
      dbQueries: 0,
      cacheHits: 0,
      cacheMisses: 0,
      memoryUsage: process.memoryUsage().heapUsed,
    };

    this.metrics.set(requestId, metrics);
    this.cleanupOldMetrics();

    return requestId;
  }

  /**
   * End performance tracking for a request
   */
  public endTracking(
    requestId: string,
    errors?: string[]
  ): PerformanceMetrics | null {
    const metrics = this.metrics.get(requestId);
    if (!metrics) return null;

    const endTime = Date.now();
    metrics.endTime = endTime;
    metrics.duration = endTime - metrics.startTime;
    metrics.errors = errors;

    return metrics;
  }

  /**
   * Track database query execution
   */
  public trackDbQuery(requestId: string): void {
    const metrics = this.metrics.get(requestId);
    if (metrics) {
      metrics.dbQueries++;
    }
  }

  /**
   * Track cache hit
   */
  public trackCacheHit(requestId: string): void {
    const metrics = this.metrics.get(requestId);
    if (metrics) {
      metrics.cacheHits++;
    }
  }

  /**
   * Track cache miss
   */
  public trackCacheMiss(requestId: string): void {
    const metrics = this.metrics.get(requestId);
    if (metrics) {
      metrics.cacheMisses++;
    }
  }

  /**
   * Get performance statistics
   */
  public getStats(): {
    totalRequests: number;
    averageResponseTime: number;
    averageDbQueries: number;
    cacheHitRate: number;
    slowRequests: PerformanceMetrics[];
    errorRate: number;
  } {
    const allMetrics = Array.from(this.metrics.values()).filter(
      (m) => m.duration !== undefined
    );

    if (allMetrics.length === 0) {
      return {
        totalRequests: 0,
        averageResponseTime: 0,
        averageDbQueries: 0,
        cacheHitRate: 0,
        slowRequests: [],
        errorRate: 0,
      };
    }

    const totalRequests = allMetrics.length;
    const averageResponseTime =
      allMetrics.reduce((sum, m) => sum + (m.duration || 0), 0) / totalRequests;
    const averageDbQueries =
      allMetrics.reduce((sum, m) => sum + m.dbQueries, 0) / totalRequests;

    const totalCacheRequests = allMetrics.reduce(
      (sum, m) => sum + m.cacheHits + m.cacheMisses,
      0
    );
    const totalCacheHits = allMetrics.reduce((sum, m) => sum + m.cacheHits, 0);
    const cacheHitRate =
      totalCacheRequests > 0 ? totalCacheHits / totalCacheRequests : 0;

    const slowRequests = allMetrics
      .filter((m) => (m.duration || 0) > 1000) // Requests slower than 1 second
      .sort((a, b) => (b.duration || 0) - (a.duration || 0))
      .slice(0, 10);

    const errorRequests = allMetrics.filter(
      (m) => m.errors && m.errors.length > 0
    );
    const errorRate = errorRequests.length / totalRequests;

    return {
      totalRequests,
      averageResponseTime,
      averageDbQueries,
      cacheHitRate,
      slowRequests,
      errorRate,
    };
  }

  /**
   * Get metrics for a specific request
   */
  public getMetrics(requestId: string): PerformanceMetrics | null {
    return this.metrics.get(requestId) || null;
  }

  /**
   * Clean up old metrics to prevent memory leaks
   */
  private cleanupOldMetrics(): void {
    if (this.metrics.size <= this.MAX_METRICS_HISTORY) return;

    const entries = Array.from(this.metrics.entries()).sort(
      ([, a], [, b]) => a.startTime - b.startTime
    );

    const entriesToRemove = entries.slice(
      0,
      this.metrics.size - this.MAX_METRICS_HISTORY
    );

    for (const [requestId] of entriesToRemove) {
      this.metrics.delete(requestId);
    }
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * Express middleware for performance monitoring
 */
export const performanceMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const requestId = performanceMonitor.startTracking(req);

  // Add request ID to request object for tracking
  (req as any).performanceId = requestId;

  // Track response completion
  const originalSend = res.send;
  res.send = function (data) {
    const errors: string[] = [];

    if (res.statusCode >= 400) {
      errors.push(`HTTP ${res.statusCode}`);
    }

    const metrics = performanceMonitor.endTracking(
      requestId,
      errors.length > 0 ? errors : undefined
    );

    // Log slow requests
    if (metrics && metrics.duration && metrics.duration > 1000) {
      console.warn(
        `Slow request detected: ${req.method} ${req.path} took ${metrics.duration}ms`
      );
    }

    return originalSend.call(this, data);
  };

  next();
};

/**
 * Database query tracking decorator
 */
export const trackDbQuery = (requestId?: string) => {
  if (requestId) {
    performanceMonitor.trackDbQuery(requestId);
  }
};

/**
 * Cache tracking helpers
 */
export const trackCacheHit = (requestId?: string) => {
  if (requestId) {
    performanceMonitor.trackCacheHit(requestId);
    promptCache.trackHit();
  }
};

export const trackCacheMiss = (requestId?: string) => {
  if (requestId) {
    performanceMonitor.trackCacheMiss(requestId);
    promptCache.trackMiss();
  }
};
