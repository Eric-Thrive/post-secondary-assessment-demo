import { Router } from "express";
import { requireAuth } from "../auth";
import { AdminGate } from "../permissions/gates/admin-gate";
import { performanceMonitor } from "../middleware/performance-monitoring";
import { OptimizedPromptService } from "../services/optimized-prompt-service";
import { OptimizedQueries } from "../services/optimized-queries";

const router = Router();

/**
 * Get system performance metrics
 * Only accessible to Developer and Admin roles
 */
router.get(
  "/metrics",
  requireAuth,
  AdminGate.requireAnalyticsAccess(),
  async (req, res) => {
    try {
      const performanceId = (req as any).performanceId;

      // Get performance monitor statistics
      const monitorStats = performanceMonitor.getStats();

      // Get prompt cache statistics
      const cacheStats = OptimizedPromptService.getCacheStats();

      // Get system metrics from database
      const systemMetrics = await OptimizedQueries.getSystemMetrics();

      // Get organization statistics
      const orgStats = await OptimizedQueries.getOrganizationStats();

      // Memory usage
      const memoryUsage = process.memoryUsage();

      res.json({
        performance: {
          totalRequests: monitorStats.totalRequests,
          averageResponseTime: Math.round(monitorStats.averageResponseTime),
          averageDbQueries:
            Math.round(monitorStats.averageDbQueries * 100) / 100,
          errorRate: Math.round(monitorStats.errorRate * 10000) / 100, // Percentage with 2 decimals
          slowRequestsCount: monitorStats.slowRequests.length,
        },
        cache: {
          hitRate: Math.round(cacheStats.hitRate * 10000) / 100, // Percentage with 2 decimals
          size: cacheStats.size,
          memoryUsage: Math.round(cacheStats.memoryUsage / 1024), // KB
        },
        system: systemMetrics,
        organizations: orgStats,
        memory: {
          heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
          heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
          external: Math.round(memoryUsage.external / 1024 / 1024), // MB
          rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error fetching performance metrics:", error);
      res.status(500).json({
        error: "Failed to fetch performance metrics",
        code: "METRICS_ERROR",
      });
    }
  }
);

/**
 * Get slow requests for debugging
 * Only accessible to Developer and Admin roles
 */
router.get(
  "/slow-requests",
  requireAuth,
  AdminGate.requireAnalyticsAccess(),
  async (req, res) => {
    try {
      const stats = performanceMonitor.getStats();

      res.json({
        slowRequests: stats.slowRequests.map((request) => ({
          requestId: request.requestId,
          endpoint: request.endpoint,
          method: request.method,
          duration: request.duration,
          dbQueries: request.dbQueries,
          cacheHits: request.cacheHits,
          cacheMisses: request.cacheMisses,
          userRole: request.userRole,
          organizationId: request.organizationId,
          startTime: new Date(request.startTime).toISOString(),
          errors: request.errors,
        })),
        totalSlowRequests: stats.slowRequests.length,
      });
    } catch (error) {
      console.error("Error fetching slow requests:", error);
      res.status(500).json({
        error: "Failed to fetch slow requests",
        code: "SLOW_REQUESTS_ERROR",
      });
    }
  }
);

/**
 * Warm up prompt cache
 * Only accessible to Developer and Admin roles
 */
router.post(
  "/cache/warmup",
  requireAuth,
  AdminGate.requireAnalyticsAccess(),
  async (req, res) => {
    try {
      await OptimizedPromptService.warmUpCache();

      const cacheStats = OptimizedPromptService.getCacheStats();

      res.json({
        message: "Cache warmed up successfully",
        cacheStats: {
          size: cacheStats.size,
          hitRate: Math.round(cacheStats.hitRate * 10000) / 100,
          memoryUsage: Math.round(cacheStats.memoryUsage / 1024), // KB
        },
      });
    } catch (error) {
      console.error("Error warming up cache:", error);
      res.status(500).json({
        error: "Failed to warm up cache",
        code: "CACHE_WARMUP_ERROR",
      });
    }
  }
);

/**
 * Clear prompt cache
 * Only accessible to Developer role
 */
router.post(
  "/cache/clear",
  requireAuth,
  AdminGate.requireAnalyticsAccess(),
  async (req, res) => {
    try {
      // Only allow developers to clear cache
      if (req.user?.role !== "developer") {
        return res.status(403).json({
          error: "Only developers can clear the cache",
          code: "INSUFFICIENT_PERMISSIONS",
        });
      }

      OptimizedPromptService.clearCache();

      res.json({
        message: "Cache cleared successfully",
      });
    } catch (error) {
      console.error("Error clearing cache:", error);
      res.status(500).json({
        error: "Failed to clear cache",
        code: "CACHE_CLEAR_ERROR",
      });
    }
  }
);

/**
 * Get database query optimization suggestions
 * Only accessible to Developer role
 */
router.get(
  "/optimization-suggestions",
  requireAuth,
  AdminGate.requireAnalyticsAccess(),
  async (req, res) => {
    try {
      // Only allow developers to see optimization suggestions
      if (req.user?.role !== "developer") {
        return res.status(403).json({
          error: "Only developers can view optimization suggestions",
          code: "INSUFFICIENT_PERMISSIONS",
        });
      }

      const stats = performanceMonitor.getStats();
      const suggestions: string[] = [];

      // Analyze performance and provide suggestions
      if (stats.averageResponseTime > 500) {
        suggestions.push(
          "Average response time is high. Consider adding more database indexes."
        );
      }

      if (stats.averageDbQueries > 5) {
        suggestions.push(
          "High number of database queries per request. Consider query optimization or caching."
        );
      }

      const cacheStats = OptimizedPromptService.getCacheStats();
      if (cacheStats.hitRate < 0.8) {
        suggestions.push(
          "Cache hit rate is low. Consider warming up the cache or increasing cache TTL."
        );
      }

      if (stats.errorRate > 0.05) {
        suggestions.push(
          "Error rate is high. Check application logs for recurring issues."
        );
      }

      if (suggestions.length === 0) {
        suggestions.push(
          "System performance looks good! No immediate optimizations needed."
        );
      }

      res.json({
        suggestions,
        metrics: {
          averageResponseTime: stats.averageResponseTime,
          averageDbQueries: stats.averageDbQueries,
          cacheHitRate: cacheStats.hitRate,
          errorRate: stats.errorRate,
        },
      });
    } catch (error) {
      console.error("Error generating optimization suggestions:", error);
      res.status(500).json({
        error: "Failed to generate optimization suggestions",
        code: "OPTIMIZATION_SUGGESTIONS_ERROR",
      });
    }
  }
);

export default router;
