import { lazy, ComponentType } from "react";
import { ModuleType } from "@/types/unified-auth";

/**
 * Lazy loading service for module-specific components and assets
 * Implements code splitting and dynamic imports for better performance
 */
export class LazyLoadingService {
  private static instance: LazyLoadingService;
  private loadedModules = new Set<ModuleType>();
  private componentCache = new Map<string, ComponentType<any>>();

  private constructor() {}

  public static getInstance(): LazyLoadingService {
    if (!LazyLoadingService.instance) {
      LazyLoadingService.instance = new LazyLoadingService();
    }
    return LazyLoadingService.instance;
  }

  /**
   * Lazy load module-specific components
   */
  getModuleComponents(moduleType: ModuleType) {
    const cacheKey = `module-${moduleType}`;

    if (this.componentCache.has(cacheKey)) {
      return this.componentCache.get(cacheKey);
    }

    let components: Record<string, ComponentType<any>>;

    switch (moduleType) {
      case ModuleType.K12:
        components = {
          HomePage: lazy(() => import("@/pages/K12HomePage")),
          AssessmentPage: lazy(() => import("@/pages/NewK12AssessmentPage")),
          ComplexAssessmentPage: lazy(
            () => import("@/pages/NewK12ComplexAssessmentPage")
          ),
          ReportsPage: lazy(() => import("@/pages/K12ReportsPage")),
          ReviewEditPage: lazy(() => import("@/pages/K12ReviewEditPage")),
          ReportGenerator: lazy(
            () => import("@/components/K12ReportGenerator")
          ),
        };
        break;

      case ModuleType.POST_SECONDARY:
        components = {
          HomePage: lazy(() => import("@/pages/PostSecondaryHomePage")),
          AssessmentPage: lazy(
            () => import("@/pages/NewPostSecondaryAssessmentPage")
          ),
          ReportsPage: lazy(() => import("@/pages/PostSecondaryReportsPage")),
          ReviewEditPage: lazy(
            () => import("@/pages/PostSecondaryReviewEditPage")
          ),
          ReportGenerator: lazy(
            () => import("@/components/PostSecondaryReportGenerator")
          ),
        };
        break;

      case ModuleType.TUTORING:
        components = {
          HomePage: lazy(() => import("@/pages/TutoringHomePage")),
          AssessmentPage: lazy(
            () => import("@/pages/NewTutoringAssessmentPage")
          ),
          ReportsPage: lazy(() => import("@/pages/TutoringReportsPage")),
          ReviewEditPage: lazy(() => import("@/pages/TutoringReviewEditPage")),
          ReportGenerator: lazy(
            () => import("@/components/TutoringReportGenerator")
          ),
        };
        break;

      default:
        components = {};
    }

    this.componentCache.set(cacheKey, components as any);
    return components;
  }

  /**
   * Preload module assets when user has access
   */
  async preloadModuleAssets(moduleType: ModuleType): Promise<void> {
    if (this.loadedModules.has(moduleType)) {
      return; // Already loaded
    }

    try {
      // Preload critical module components
      const components = this.getModuleComponents(moduleType);

      // Preload the most commonly used components
      const criticalComponents = ["HomePage", "ReportsPage"];

      await Promise.all(
        criticalComponents.map(async (componentName) => {
          if (components[componentName]) {
            // Trigger the lazy loading
            await (components[componentName] as any)();
          }
        })
      );

      this.loadedModules.add(moduleType);
      console.log(`✅ Preloaded assets for ${moduleType} module`);
    } catch (error) {
      console.warn(`Failed to preload assets for ${moduleType}:`, error);
    }
  }

  /**
   * Preload multiple modules based on user access
   */
  async preloadUserModules(moduleTypes: ModuleType[]): Promise<void> {
    const preloadPromises = moduleTypes.map((moduleType) =>
      this.preloadModuleAssets(moduleType)
    );

    await Promise.allSettled(preloadPromises);
  }

  /**
   * Get lazy-loaded admin components
   */
  getAdminComponents() {
    const cacheKey = "admin-components";

    if (this.componentCache.has(cacheKey)) {
      return this.componentCache.get(cacheKey);
    }

    const components = {
      AdminDashboard: lazy(() => import("@/pages/AdminDashboard")),
      UserManagementPage: lazy(() => import("@/pages/UserManagementPage")),
      OrganizationManagementPage: lazy(
        () => import("@/pages/OrganizationManagementPage")
      ),
      PerformanceDashboard: lazy(() => import("@/pages/PerformanceDashboard")),
      PromptsPage: lazy(() => import("@/pages/PromptsPage")),
    };

    this.componentCache.set(cacheKey, components as any);
    return components;
  }

  /**
   * Get lazy-loaded shared components
   */
  getSharedComponents() {
    const cacheKey = "shared-components";

    if (this.componentCache.has(cacheKey)) {
      return this.componentCache.get(cacheKey);
    }

    const components = {
      ModuleDashboard: lazy(
        () => import("@/components/dashboard/ModuleDashboard")
      ),
      WelcomeDashboard: lazy(() => import("@/pages/WelcomeDashboard")),
      SharedReport: lazy(() => import("@/pages/SharedReport")),
    };

    this.componentCache.set(cacheKey, components as any);
    return components;
  }

  /**
   * Clear component cache (useful for development)
   */
  clearCache(): void {
    this.componentCache.clear();
    this.loadedModules.clear();
  }

  /**
   * Get loading statistics
   */
  getLoadingStats() {
    return {
      loadedModules: Array.from(this.loadedModules),
      cachedComponents: this.componentCache.size,
    };
  }

  /**
   * Preload critical assets on app initialization
   */
  async preloadCriticalAssets(): Promise<void> {
    try {
      // Preload shared components that are likely to be used
      const sharedComponents = this.getSharedComponents();

      // Preload the most critical shared component
      if (sharedComponents.ModuleDashboard) {
        await (sharedComponents.ModuleDashboard as any)();
      }

      console.log("✅ Preloaded critical shared assets");
    } catch (error) {
      console.warn("Failed to preload critical assets:", error);
    }
  }
}

// Export singleton instance
export const lazyLoadingService = LazyLoadingService.getInstance();
