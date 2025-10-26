import { Router } from "express";
import { performanceMonitor } from "../services/performanceMonitor";
import { AICostTracker, AI_COST_THRESHOLDS } from "../services/aiMonitor";
import { DatabaseMonitor } from "../services/databaseMonitor";
import { z } from "zod";

const router = Router();

// Schema for query parameters
const endpointStatsSchema = z.object({
  endpoint: z.string(),
  hours: z.coerce.number().min(1).max(168).default(24), // Max 1 week
});

const slowQueriesSchema = z.object({
  threshold: z.coerce.number().min(100).default(1000), // Min 100ms
  hours: z.coerce.number().min(1).max(168).default(24), // Max 1 week
});

/**
 * GET /api/performance/endpoint-stats
 * Get performance statistics for a specific endpoint
 */
router.get("/endpoint-stats", async (req, res) => {
  try {
    const { endpoint, hours } = endpointStatsSchema.parse(req.query);

    const stats = await performanceMonitor.getEndpointStats(endpoint, hours);

    res.json({
      success: true,
      data: {
        endpoint,
        timeframe: `${hours} hours`,
        ...stats,
      },
    });
  } catch (error) {
    console.error("Error getting endpoint stats:", error);
    res.status(400).json({
      success: false,
      message:
        error instanceof z.ZodError
          ? "Invalid query parameters"
          : "Failed to get endpoint statistics",
      error: error instanceof z.ZodError ? error.errors : undefined,
    });
  }
});

/**
 * GET /api/performance/slow-queries
 * Get slow database queries
 */
router.get("/slow-queries", async (req, res) => {
  try {
    const { threshold, hours } = slowQueriesSchema.parse(req.query);

    const slowQueries = await performanceMonitor.getSlowQueries(
      threshold,
      hours
    );

    res.json({
      success: true,
      data: {
        timeframe: `${hours} hours`,
        threshold: `${threshold}ms`,
        queries: slowQueries,
      },
    });
  } catch (error) {
    console.error("Error getting slow queries:", error);
    res.status(400).json({
      success: false,
      message:
        error instanceof z.ZodError
          ? "Invalid query parameters"
          : "Failed to get slow queries",
      error: error instanceof z.ZodError ? error.errors : undefined,
    });
  }
});

/**
 * GET /api/performance/health
 * Get overall performance health metrics
 */
router.get("/health", async (req, res) => {
  try {
    // Get stats for common endpoints
    const commonEndpoints = [
      "/api/auth/login",
      "/api/assessment-cases",
      "/api/analysis",
    ];
    const endpointStats = await Promise.all(
      commonEndpoints.map(async (endpoint) => {
        const stats = await performanceMonitor.getEndpointStats(endpoint, 1); // Last hour
        return {
          endpoint,
          ...stats,
        };
      })
    );

    // Get slow queries
    const slowQueries = await performanceMonitor.getSlowQueries(1000, 1); // Last hour, >1s

    res.json({
      success: true,
      data: {
        timestamp: new Date().toISOString(),
        endpoints: endpointStats,
        slowQueries: slowQueries.slice(0, 10), // Top 10 slow queries
        alerts: {
          highErrorRate:
            endpointStats.filter((e) => e.errorRate > 5).length > 0,
          slowResponses:
            endpointStats.filter((e) => e.p95Duration > 5000).length > 0,
          slowQueries: slowQueries.length > 0,
        },
      },
    });
  } catch (error) {
    console.error("Error getting performance health:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get performance health metrics",
    });
  }
});

/**
 * GET /api/performance/ai-costs
 * Get AI processing costs by module and pathway
 */
router.get("/ai-costs", async (req, res) => {
  try {
    const hours = z.coerce
      .number()
      .min(1)
      .max(168)
      .default(24)
      .parse(req.query.hours);

    const costs = await AICostTracker.getCostsByModule(hours);

    res.json({
      success: true,
      data: {
        timeframe: `${hours} hours`,
        costs,
        thresholds: AI_COST_THRESHOLDS,
      },
    });
  } catch (error) {
    console.error("Error getting AI costs:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get AI costs",
    });
  }
});

/**
 * GET /api/performance/ai-trends
 * Get AI cost trends over time
 */
router.get("/ai-trends", async (req, res) => {
  try {
    const days = z.coerce
      .number()
      .min(1)
      .max(30)
      .default(7)
      .parse(req.query.days);

    const trends = await AICostTracker.getCostTrends(days);

    res.json({
      success: true,
      data: {
        timeframe: `${days} days`,
        trends,
      },
    });
  } catch (error) {
    console.error("Error getting AI trends:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get AI trends",
    });
  }
});

/**
 * GET /api/performance/ai-alerts
 * Check AI cost threshold alerts
 */
router.get("/ai-alerts", async (req, res) => {
  try {
    const thresholds = await AICostTracker.checkCostThresholds();

    res.json({
      success: true,
      data: {
        ...thresholds,
        thresholds: AI_COST_THRESHOLDS,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error checking AI alerts:", error);
    res.status(500).json({
      success: false,
      message: "Failed to check AI alerts",
    });
  }
});

/**
 * GET /api/performance/database-health
 * Get real-time database health metrics
 */
router.get("/database-health", async (req, res) => {
  try {
    const health = await DatabaseMonitor.getHealthMetrics();

    res.json({
      success: true,
      data: health,
    });
  } catch (error) {
    console.error("Error getting database health:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get database health metrics",
    });
  }
});

/**
 * GET /api/performance/database-stats
 * Get detailed database performance statistics
 */
router.get("/database-stats", async (req, res) => {
  try {
    const stats = await DatabaseMonitor.getDatabaseStats();
    const connectionStats = await DatabaseMonitor.getConnectionPoolStats();

    res.json({
      success: true,
      data: {
        ...stats,
        connectionPool: connectionStats,
      },
    });
  } catch (error) {
    console.error("Error getting database stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get database statistics",
    });
  }
});

/**
 * GET /api/performance/query-analysis
 * Get query performance analysis and optimization recommendations
 */
router.get("/query-analysis", async (req, res) => {
  try {
    const hours = z.coerce
      .number()
      .min(1)
      .max(168)
      .default(24)
      .parse(req.query.hours);

    const analysis = await DatabaseMonitor.analyzeQueryPerformance(hours);

    res.json({
      success: true,
      data: {
        timeframe: `${hours} hours`,
        ...analysis,
      },
    });
  } catch (error) {
    console.error("Error analyzing query performance:", error);
    res.status(500).json({
      success: false,
      message: "Failed to analyze query performance",
    });
  }
});

export { router as performanceRoutes };
