import { ModuleType, UserRole } from "@/types/unified-auth";

/**
 * Bundle optimization service for managing code splitting and asset loading
 * Implements intelligent bundling strategies based on user access patterns
 */
export class BundleOptimizationService {
  private static instance: BundleOptimizationService;
  private loadedChunks = new Set<string>();
  private preloadedAssets = new Set<string>();

  private constructor() {}

  public static getInstance(): BundleOptimizationService {
    if (!BundleOptimizationService.instance) {
      BundleOptimizationService.instance = new BundleOptimizationService();
    }
    return BundleOptimizationService.instance;
  }

  /**
   * Preload critical assets based on user role and module access
   */
  async preloadCriticalAssets(
    userRole: UserRole,
    moduleAccess: ModuleType[]
  ): Promise<void> {
    const criticalAssets = this.getCriticalAssets(userRole, moduleAccess);

    const preloadPromises = criticalAssets.map((asset) =>
      this.preloadAsset(asset)
    );
    await Promise.allSettled(preloadPromises);
  }

  /**
   * Get critical assets based on user context
   */
  private getCriticalAssets(
    userRole: UserRole,
    moduleAccess: ModuleType[]
  ): string[] {
    const assets: string[] = [];

    // Always preload core UI components
    assets.push("/assets/core-ui.js");

    // Preload module-specific assets
    moduleAccess.forEach((moduleType) => {
      switch (moduleType) {
        case ModuleType.K12:
          assets.push("/assets/k12-module.js", "/assets/k12-styles.css");
          break;
        case ModuleType.POST_SECONDARY:
          assets.push(
            "/assets/post-secondary-module.js",
            "/assets/post-secondary-styles.css"
          );
          break;
        case ModuleType.TUTORING:
          assets.push(
            "/assets/tutoring-module.js",
            "/assets/tutoring-styles.css"
          );
          break;
      }
    });

    // Preload admin assets for privileged users
    if (this.isAdminUser(userRole)) {
      assets.push("/assets/admin-module.js", "/assets/admin-styles.css");
    }

    return assets;
  }

  /**
   * Preload a specific asset
   */
  private async preloadAsset(assetPath: string): Promise<void> {
    if (this.preloadedAssets.has(assetPath)) {
      return; // Already preloaded
    }

    try {
      const link = document.createElement("link");
      link.rel = "preload";

      if (assetPath.endsWith(".js")) {
        link.as = "script";
      } else if (assetPath.endsWith(".css")) {
        link.as = "style";
      } else {
        link.as = "fetch";
        link.crossOrigin = "anonymous";
      }

      link.href = assetPath;
      document.head.appendChild(link);

      this.preloadedAssets.add(assetPath);
      console.log(`📦 Preloaded asset: ${assetPath}`);
    } catch (error) {
      console.warn(`Failed to preload asset ${assetPath}:`, error);
    }
  }

  /**
   * Optimize bundle loading for specific module
   */
  async optimizeModuleBundle(moduleType: ModuleType): Promise<void> {
    const chunkKey = `module-${moduleType}`;

    if (this.loadedChunks.has(chunkKey)) {
      return; // Already optimized
    }

    try {
      // Prefetch module-specific chunks
      await this.prefetchModuleChunks(moduleType);

      // Preload module-specific CSS
      await this.preloadModuleStyles(moduleType);

      this.loadedChunks.add(chunkKey);
      console.log(`⚡ Optimized bundle for ${moduleType} module`);
    } catch (error) {
      console.warn(`Failed to optimize bundle for ${moduleType}:`, error);
    }
  }

  /**
   * Prefetch module-specific JavaScript chunks
   */
  private async prefetchModuleChunks(moduleType: ModuleType): Promise<void> {
    const chunks = this.getModuleChunks(moduleType);

    const prefetchPromises = chunks.map((chunk) => {
      return new Promise<void>((resolve, reject) => {
        const link = document.createElement("link");
        link.rel = "prefetch";
        link.href = chunk;
        link.onload = () => resolve();
        link.onerror = () => reject(new Error(`Failed to prefetch ${chunk}`));
        document.head.appendChild(link);
      });
    });

    await Promise.allSettled(prefetchPromises);
  }

  /**
   * Preload module-specific CSS
   */
  private async preloadModuleStyles(moduleType: ModuleType): Promise<void> {
    const styles = this.getModuleStyles(moduleType);

    const preloadPromises = styles.map((style) => this.preloadAsset(style));
    await Promise.allSettled(preloadPromises);
  }

  /**
   * Get JavaScript chunks for a specific module
   */
  private getModuleChunks(moduleType: ModuleType): string[] {
    const baseChunks = ["/assets/shared-components.js"];

    switch (moduleType) {
      case ModuleType.K12:
        return [
          ...baseChunks,
          "/assets/k12-assessment.js",
          "/assets/k12-reports.js",
          "/assets/k12-components.js",
        ];
      case ModuleType.POST_SECONDARY:
        return [
          ...baseChunks,
          "/assets/post-secondary-assessment.js",
          "/assets/post-secondary-reports.js",
          "/assets/post-secondary-components.js",
        ];
      case ModuleType.TUTORING:
        return [
          ...baseChunks,
          "/assets/tutoring-assessment.js",
          "/assets/tutoring-reports.js",
          "/assets/tutoring-components.js",
        ];
      default:
        return baseChunks;
    }
  }

  /**
   * Get CSS files for a specific module
   */
  private getModuleStyles(moduleType: ModuleType): string[] {
    const baseStyles = ["/assets/shared-styles.css"];

    switch (moduleType) {
      case ModuleType.K12:
        return [...baseStyles, "/assets/k12-theme.css"];
      case ModuleType.POST_SECONDARY:
        return [...baseStyles, "/assets/post-secondary-theme.css"];
      case ModuleType.TUTORING:
        return [...baseStyles, "/assets/tutoring-theme.css"];
      default:
        return baseStyles;
    }
  }

  /**
   * Check if user has admin privileges
   */
  private isAdminUser(userRole: UserRole): boolean {
    return [
      UserRole.DEVELOPER,
      UserRole.SYSTEM_ADMIN,
      UserRole.ORG_ADMIN,
    ].includes(userRole);
  }

  /**
   * Optimize images and assets loading
   */
  optimizeAssetLoading(): void {
    // Add loading="lazy" to images
    const images = document.querySelectorAll("img:not([loading])");
    images.forEach((img) => {
      img.setAttribute("loading", "lazy");
    });

    // Optimize font loading
    this.optimizeFontLoading();

    // Add resource hints for external resources
    this.addResourceHints();
  }

  /**
   * Optimize font loading with font-display: swap
   */
  private optimizeFontLoading(): void {
    const style = document.createElement("style");
    style.textContent = `
      @font-face {
        font-family: 'Inter';
        font-display: swap;
      }
      @font-face {
        font-family: 'Roboto';
        font-display: swap;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Add resource hints for better performance
   */
  private addResourceHints(): void {
    const hints = [
      { rel: "dns-prefetch", href: "//fonts.googleapis.com" },
      { rel: "dns-prefetch", href: "//fonts.gstatic.com" },
      { rel: "preconnect", href: "https://api.openai.com" },
    ];

    hints.forEach((hint) => {
      const link = document.createElement("link");
      link.rel = hint.rel;
      link.href = hint.href;
      if (hint.rel === "preconnect") {
        link.crossOrigin = "anonymous";
      }
      document.head.appendChild(link);
    });
  }

  /**
   * Monitor and report bundle performance
   */
  getPerformanceMetrics() {
    const navigation = performance.getEntriesByType(
      "navigation"
    )[0] as PerformanceNavigationTiming;

    return {
      loadedChunks: Array.from(this.loadedChunks),
      preloadedAssets: Array.from(this.preloadedAssets),
      domContentLoaded:
        navigation?.domContentLoadedEventEnd -
        navigation?.domContentLoadedEventStart,
      loadComplete: navigation?.loadEventEnd - navigation?.loadEventStart,
      firstContentfulPaint: this.getFirstContentfulPaint(),
      largestContentfulPaint: this.getLargestContentfulPaint(),
    };
  }

  /**
   * Get First Contentful Paint metric
   */
  private getFirstContentfulPaint(): number | null {
    const fcpEntry = performance.getEntriesByName("first-contentful-paint")[0];
    return fcpEntry ? fcpEntry.startTime : null;
  }

  /**
   * Get Largest Contentful Paint metric
   */
  private getLargestContentfulPaint(): number | null {
    return new Promise((resolve) => {
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        resolve(lastEntry ? lastEntry.startTime : null);
      }).observe({ entryTypes: ["largest-contentful-paint"] });
    }) as any;
  }

  /**
   * Clear optimization cache
   */
  clearOptimizationCache(): void {
    this.loadedChunks.clear();
    this.preloadedAssets.clear();
    console.log("🗑️ Cleared bundle optimization cache");
  }
}

// Export singleton instance
export const bundleOptimizationService =
  BundleOptimizationService.getInstance();
