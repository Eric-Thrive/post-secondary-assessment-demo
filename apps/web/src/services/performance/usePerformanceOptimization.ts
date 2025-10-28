import { useEffect, useCallback } from "react";
import { useUnifiedAuth } from "@/hooks/useUnifiedAuth";
import { lazyLoadingService } from "./lazy-loading-service";
import { cachingService } from "./caching-service";
import { bundleOptimizationService } from "./bundle-optimization";
import { performanceMonitoringService } from "./performance-monitoring";

/**
 * Performance optimization hook that manages lazy loading, caching, and bundle optimization
 * based on user context and application state
 */
export const usePerformanceOptimization = () => {
  const { user, isAuthenticated } = useUnifiedAuth();

  // Initialize performance optimizations when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      initializeOptimizations();
    }
  }, [isAuthenticated, user]);

  // Initialize all performance optimizations
  const initializeOptimizations = useCallback(async () => {
    if (!user) return;

    const startTime = Date.now();

    try {
      // Warm up cache with user data
      await cachingService.warmUpUserCache(user);

      // Preload critical assets based on user access
      const moduleTypes = user.moduleAccess.map((access) => access.moduleType);
      await bundleOptimizationService.preloadCriticalAssets(
        user.role,
        moduleTypes
      );

      // Preload user's accessible modules
      await lazyLoadingService.preloadUserModules(moduleTypes);

      // Optimize asset loading
      bundleOptimizationService.optimizeAssetLoading();

      // Track initialization performance
      performanceMonitoringService.trackAuthenticationPerformance(
        startTime,
        true,
        user
      );

      console.log("⚡ Performance optimizations initialized");
    } catch (error) {
      console.warn("Failed to initialize performance optimizations:", error);
      performanceMonitoringService.trackAuthenticationPerformance(
        startTime,
        false
      );
    }
  }, [user]);

  // Preload module assets when user navigates
  const preloadModuleAssets = useCallback(
    async (moduleType: string) => {
      if (!user) return;

      const startTime = Date.now();

      try {
        await lazyLoadingService.preloadModuleAssets(moduleType as any);
        await bundleOptimizationService.optimizeModuleBundle(moduleType as any);

        performanceMonitoringService.trackModuleLoadingPerformance(
          moduleType as any,
          startTime
        );
      } catch (error) {
        console.warn(`Failed to preload assets for ${moduleType}:`, error);
      }
    },
    [user]
  );

  // Track navigation performance
  const trackNavigation = useCallback((fromRoute: string, toRoute: string) => {
    const startTime = Date.now();

    // Use requestIdleCallback to track after navigation completes
    if ("requestIdleCallback" in window) {
      requestIdleCallback(() => {
        performanceMonitoringService.trackNavigationPerformance(
          fromRoute,
          toRoute,
          startTime
        );
      });
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(() => {
        performanceMonitoringService.trackNavigationPerformance(
          fromRoute,
          toRoute,
          startTime
        );
      }, 0);
    }
  }, []);

  // Track API performance
  const trackApiCall = useCallback(
    (endpoint: string, method: string, startTime: number, success: boolean) => {
      performanceMonitoringService.trackApiPerformance(
        endpoint,
        method,
        startTime,
        success
      );
    },
    []
  );

  // Get performance metrics
  const getPerformanceMetrics = useCallback(() => {
    return {
      monitoring: performanceMonitoringService.getPerformanceSummary(),
      caching: cachingService.getCacheStats(),
      lazyLoading: lazyLoadingService.getLoadingStats(),
      bundleOptimization: bundleOptimizationService.getPerformanceMetrics(),
    };
  }, []);

  // Clear performance data
  const clearPerformanceData = useCallback(() => {
    cachingService.clearAll();
    lazyLoadingService.clearCache();
    bundleOptimizationService.clearOptimizationCache();
    performanceMonitoringService.clearMetrics();
  }, []);

  // Invalidate user-specific cache
  const invalidateUserCache = useCallback(() => {
    if (user) {
      cachingService.invalidateUserCache(user.id);
    }
  }, [user]);

  // Optimize for specific module
  const optimizeForModule = useCallback(
    async (moduleType: string) => {
      if (!user) return;

      try {
        await preloadModuleAssets(moduleType);

        // Cache module-specific data
        const cachedData = cachingService.getCachedModuleData(
          moduleType,
          user.id
        );
        if (!cachedData) {
          // Trigger module data loading
          console.log(`Loading data for ${moduleType} module`);
        }
      } catch (error) {
        console.warn(`Failed to optimize for ${moduleType} module:`, error);
      }
    },
    [user, preloadModuleAssets]
  );

  return {
    // Optimization actions
    preloadModuleAssets,
    optimizeForModule,
    invalidateUserCache,
    clearPerformanceData,

    // Performance tracking
    trackNavigation,
    trackApiCall,
    getPerformanceMetrics,

    // Performance state
    isOptimized: isAuthenticated && !!user,
    userModules: user?.moduleAccess.map((access) => access.moduleType) || [],
  };
};
