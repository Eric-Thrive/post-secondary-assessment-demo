import { AuthenticatedUser, ModuleType } from "@/types/unified-auth";

/**
 * Performance monitoring service for tracking and optimizing application performance
 * Monitors loading times, user interactions, and system resource usage
 */
export class PerformanceMonitoringService {
  private static instance: PerformanceMonitoringService;
  private metrics = new Map<string, PerformanceMetric[]>();
  private observers: PerformanceObserver[] = [];
  private startTime = Date.now();

  private constructor() {
    this.initializeObservers();
  }

  public static getInstance(): PerformanceMonitoringService {
    if (!PerformanceMonitoringService.instance) {
      PerformanceMonitoringService.instance =
        new PerformanceMonitoringService();
    }
    return PerformanceMonitoringService.instance;
  }

  /**
   * Initialize performance observers
   */
  private initializeObservers(): void {
    try {
      // Observe navigation timing
      const navObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordMetric("navigation", {
            name: entry.name,
            duration: entry.duration,
            startTime: entry.startTime,
            type: entry.entryType,
            timestamp: Date.now(),
          });
        }
      });
      navObserver.observe({ entryTypes: ["navigation"] });
      this.observers.push(navObserver);

      // Observe resource loading
      const resourceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordMetric("resource", {
            name: entry.name,
            duration: entry.duration,
            startTime: entry.startTime,
            type: entry.entryType,
            timestamp: Date.now(),
          });
        }
      });
      resourceObserver.observe({ entryTypes: ["resource"] });
      this.observers.push(resourceObserver);

      // Observe paint timing
      const paintObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordMetric("paint", {
            name: entry.name,
            duration: entry.duration,
            startTime: entry.startTime,
            type: entry.entryType,
            timestamp: Date.now(),
          });
        }
      });
      paintObserver.observe({ entryTypes: ["paint"] });
      this.observers.push(paintObserver);

      // Observe largest contentful paint
      const lcpObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordMetric("lcp", {
            name: "largest-contentful-paint",
            duration: entry.startTime,
            startTime: entry.startTime,
            type: entry.entryType,
            timestamp: Date.now(),
          });
        }
      });
      lcpObserver.observe({ entryTypes: ["largest-contentful-paint"] });
      this.observers.push(lcpObserver);
    } catch (error) {
      console.warn("Failed to initialize performance observers:", error);
    }
  }

  /**
   * Record a custom performance metric
   */
  recordMetric(category: string, metric: PerformanceMetric): void {
    if (!this.metrics.has(category)) {
      this.metrics.set(category, []);
    }

    const categoryMetrics = this.metrics.get(category)!;
    categoryMetrics.push(metric);

    // Keep only the last 100 metrics per category to prevent memory leaks
    if (categoryMetrics.length > 100) {
      categoryMetrics.shift();
    }
  }

  /**
   * Track authentication performance
   */
  trackAuthenticationPerformance(
    startTime: number,
    success: boolean,
    user?: AuthenticatedUser
  ): void {
    const duration = Date.now() - startTime;

    this.recordMetric("authentication", {
      name: "login-attempt",
      duration,
      startTime,
      type: "custom",
      timestamp: Date.now(),
      metadata: {
        success,
        userRole: user?.role,
        moduleCount: user?.moduleAccess.length,
      },
    });
  }

  /**
   * Track module loading performance
   */
  trackModuleLoadingPerformance(
    moduleType: ModuleType,
    startTime: number
  ): void {
    const duration = Date.now() - startTime;

    this.recordMetric("module-loading", {
      name: `${moduleType}-module-load`,
      duration,
      startTime,
      type: "custom",
      timestamp: Date.now(),
      metadata: {
        moduleType,
      },
    });
  }

  /**
   * Track route navigation performance
   */
  trackNavigationPerformance(
    fromRoute: string,
    toRoute: string,
    startTime: number
  ): void {
    const duration = Date.now() - startTime;

    this.recordMetric("navigation", {
      name: "route-navigation",
      duration,
      startTime,
      type: "custom",
      timestamp: Date.now(),
      metadata: {
        fromRoute,
        toRoute,
      },
    });
  }

  /**
   * Track API request performance
   */
  trackApiPerformance(
    endpoint: string,
    method: string,
    startTime: number,
    success: boolean
  ): void {
    const duration = Date.now() - startTime;

    this.recordMetric("api", {
      name: `${method}-${endpoint}`,
      duration,
      startTime,
      type: "custom",
      timestamp: Date.now(),
      metadata: {
        endpoint,
        method,
        success,
      },
    });
  }

  /**
   * Track component render performance
   */
  trackComponentRender(componentName: string, renderTime: number): void {
    this.recordMetric("component-render", {
      name: componentName,
      duration: renderTime,
      startTime: Date.now() - renderTime,
      type: "custom",
      timestamp: Date.now(),
    });
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(): PerformanceSummary {
    const summary: PerformanceSummary = {
      uptime: Date.now() - this.startTime,
      categories: {},
      webVitals: this.getWebVitals(),
      memoryUsage: this.getMemoryUsage(),
    };

    for (const [category, metrics] of this.metrics.entries()) {
      const durations = metrics.map((m) => m.duration).filter((d) => d > 0);

      if (durations.length > 0) {
        summary.categories[category] = {
          count: metrics.length,
          averageDuration:
            durations.reduce((a, b) => a + b, 0) / durations.length,
          minDuration: Math.min(...durations),
          maxDuration: Math.max(...durations),
          recentMetrics: metrics.slice(-5),
        };
      }
    }

    return summary;
  }

  /**
   * Get Web Vitals metrics
   */
  private getWebVitals(): WebVitals {
    const navigation = performance.getEntriesByType(
      "navigation"
    )[0] as PerformanceNavigationTiming;
    const paintEntries = performance.getEntriesByType("paint");

    const fcp = paintEntries.find(
      (entry) => entry.name === "first-contentful-paint"
    );
    const lcpMetrics = this.metrics.get("lcp") || [];
    const latestLcp = lcpMetrics[lcpMetrics.length - 1];

    return {
      firstContentfulPaint: fcp?.startTime || null,
      largestContentfulPaint: latestLcp?.duration || null,
      cumulativeLayoutShift: this.getCumulativeLayoutShift(),
      firstInputDelay: this.getFirstInputDelay(),
      timeToInteractive: navigation
        ? navigation.domInteractive - navigation.navigationStart
        : null,
    };
  }

  /**
   * Get Cumulative Layout Shift
   */
  private getCumulativeLayoutShift(): number {
    let clsValue = 0;

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        }
      });
      observer.observe({ entryTypes: ["layout-shift"] });
    } catch (error) {
      // Layout shift not supported
    }

    return clsValue;
  }

  /**
   * Get First Input Delay
   */
  private getFirstInputDelay(): number | null {
    let fidValue: number | null = null;

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          fidValue = entry.processingStart - entry.startTime;
        }
      });
      observer.observe({ entryTypes: ["first-input"] });
    } catch (error) {
      // First input delay not supported
    }

    return fidValue;
  }

  /**
   * Get memory usage information
   */
  private getMemoryUsage(): MemoryUsage | null {
    if ("memory" in performance) {
      const memory = (performance as any).memory;
      return {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
      };
    }
    return null;
  }

  /**
   * Get slow operations (duration > threshold)
   */
  getSlowOperations(thresholdMs: number = 1000): PerformanceMetric[] {
    const slowOps: PerformanceMetric[] = [];

    for (const metrics of this.metrics.values()) {
      for (const metric of metrics) {
        if (metric.duration > thresholdMs) {
          slowOps.push(metric);
        }
      }
    }

    return slowOps.sort((a, b) => b.duration - a.duration);
  }

  /**
   * Export performance data for analysis
   */
  exportPerformanceData(): string {
    const data = {
      summary: this.getPerformanceSummary(),
      slowOperations: this.getSlowOperations(),
      timestamp: new Date().toISOString(),
    };

    return JSON.stringify(data, null, 2);
  }

  /**
   * Clear performance metrics
   */
  clearMetrics(): void {
    this.metrics.clear();
    console.log("🗑️ Cleared performance metrics");
  }

  /**
   * Cleanup observers
   */
  cleanup(): void {
    this.observers.forEach((observer) => observer.disconnect());
    this.observers = [];
    this.clearMetrics();
  }
}

// Interfaces
interface PerformanceMetric {
  name: string;
  duration: number;
  startTime: number;
  type: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

interface PerformanceSummary {
  uptime: number;
  categories: Record<
    string,
    {
      count: number;
      averageDuration: number;
      minDuration: number;
      maxDuration: number;
      recentMetrics: PerformanceMetric[];
    }
  >;
  webVitals: WebVitals;
  memoryUsage: MemoryUsage | null;
}

interface WebVitals {
  firstContentfulPaint: number | null;
  largestContentfulPaint: number | null;
  cumulativeLayoutShift: number;
  firstInputDelay: number | null;
  timeToInteractive: number | null;
}

interface MemoryUsage {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

// Export singleton instance
export const performanceMonitoringService =
  PerformanceMonitoringService.getInstance();
