import {
  NavigationState,
  UserPreferences,
  ModuleType,
  AuthenticatedUser,
} from "@/types/unified-auth";

/**
 * Navigation state manager for handling complex navigation scenarios
 * and user preference management
 */
export class NavigationStateManager {
  private static readonly STORAGE_KEYS = {
    NAVIGATION_STATE: "thrive_navigation_state",
    USER_PREFERENCES: "thrive_user_preferences",
    NAVIGATION_HISTORY: "thrive_navigation_history",
    MODULE_CONTEXT: "thrive_module_context",
    REDIRECT_CONTEXT: "thrive_redirect_context",
  };

  /**
   * Saves navigation state to persistent storage
   */
  static saveNavigationState(state: NavigationState): void {
    try {
      localStorage.setItem(
        this.STORAGE_KEYS.NAVIGATION_STATE,
        JSON.stringify(state)
      );
    } catch (error) {
      console.warn("Failed to save navigation state:", error);
    }
  }

  /**
   * Loads navigation state from persistent storage
   */
  static loadNavigationState(): NavigationState | null {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEYS.NAVIGATION_STATE);
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.warn("Failed to load navigation state:", error);
      return null;
    }
  }

  /**
   * Saves user preferences with validation
   */
  static saveUserPreferences(
    preferences: Partial<UserPreferences>,
    userId?: string
  ): void {
    try {
      const existing = this.loadUserPreferences(userId);
      const updated: UserPreferences = {
        dashboardLayout: "grid",
        theme: "auto",
        notifications: {
          email: true,
          browser: true,
          reportComplete: true,
          systemUpdates: false,
        },
        ...existing,
        ...preferences,
      };

      const storageKey = userId
        ? `${this.STORAGE_KEYS.USER_PREFERENCES}_${userId}`
        : this.STORAGE_KEYS.USER_PREFERENCES;

      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch (error) {
      console.warn("Failed to save user preferences:", error);
    }
  }

  /**
   * Loads user preferences from storage
   */
  static loadUserPreferences(userId?: string): UserPreferences | null {
    try {
      const storageKey = userId
        ? `${this.STORAGE_KEYS.USER_PREFERENCES}_${userId}`
        : this.STORAGE_KEYS.USER_PREFERENCES;

      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.warn("Failed to load user preferences:", error);
      return null;
    }
  }

  /**
   * Manages redirect context for post-login navigation
   */
  static setRedirectContext(context: {
    intendedPath: string;
    moduleType?: ModuleType;
    preserveQuery?: boolean;
    timestamp: Date;
  }): void {
    try {
      localStorage.setItem(
        this.STORAGE_KEYS.REDIRECT_CONTEXT,
        JSON.stringify(context)
      );
    } catch (error) {
      console.warn("Failed to save redirect context:", error);
    }
  }

  /**
   * Retrieves and clears redirect context
   */
  static getAndClearRedirectContext(): {
    intendedPath: string;
    moduleType?: ModuleType;
    preserveQuery?: boolean;
    timestamp: Date;
  } | null {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEYS.REDIRECT_CONTEXT);
      if (saved) {
        localStorage.removeItem(this.STORAGE_KEYS.REDIRECT_CONTEXT);
        const context = JSON.parse(saved);
        return {
          ...context,
          timestamp: new Date(context.timestamp),
        };
      }
      return null;
    } catch (error) {
      console.warn("Failed to load redirect context:", error);
      return null;
    }
  }

  /**
   * Manages module context for maintaining state across navigation
   */
  static setModuleContext(moduleType: ModuleType, context: any): void {
    try {
      const existing = this.getModuleContexts();
      existing[moduleType] = {
        ...context,
        timestamp: new Date().toISOString(),
      };

      localStorage.setItem(
        this.STORAGE_KEYS.MODULE_CONTEXT,
        JSON.stringify(existing)
      );
    } catch (error) {
      console.warn("Failed to save module context:", error);
    }
  }

  /**
   * Retrieves module context
   */
  static getModuleContext(moduleType: ModuleType): any | null {
    try {
      const contexts = this.getModuleContexts();
      return contexts[moduleType] || null;
    } catch (error) {
      console.warn("Failed to load module context:", error);
      return null;
    }
  }

  /**
   * Gets all module contexts
   */
  static getModuleContexts(): Record<ModuleType, any> {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEYS.MODULE_CONTEXT);
      return saved ? JSON.parse(saved) : {};
    } catch (error) {
      console.warn("Failed to load module contexts:", error);
      return {};
    }
  }

  /**
   * Clears module context for a specific module
   */
  static clearModuleContext(moduleType: ModuleType): void {
    try {
      const existing = this.getModuleContexts();
      delete existing[moduleType];

      localStorage.setItem(
        this.STORAGE_KEYS.MODULE_CONTEXT,
        JSON.stringify(existing)
      );
    } catch (error) {
      console.warn("Failed to clear module context:", error);
    }
  }

  /**
   * Determines if a redirect is still valid (not expired)
   */
  static isRedirectValid(
    redirectContext: { timestamp: Date },
    maxAgeMinutes: number = 30
  ): boolean {
    const now = new Date();
    const age = now.getTime() - redirectContext.timestamp.getTime();
    const maxAge = maxAgeMinutes * 60 * 1000; // Convert to milliseconds

    return age <= maxAge;
  }

  /**
   * Creates a navigation breadcrumb trail
   */
  static createBreadcrumbTrail(
    currentPath: string,
    user: AuthenticatedUser
  ): Array<{
    label: string;
    path?: string;
    active: boolean;
    moduleType?: ModuleType;
  }> {
    const breadcrumbs = [];

    // Parse the current path to determine context
    const pathSegments = currentPath.split("/").filter(Boolean);

    // Add dashboard if user has multiple modules
    const hasMultipleModules = user.moduleAccess.length > 1;
    if (hasMultipleModules) {
      breadcrumbs.push({
        label: "Dashboard",
        path: "/dashboard",
        active: currentPath === "/dashboard",
      });
    }

    // Add module-specific breadcrumbs
    if (pathSegments.length > 0) {
      const moduleSegment = pathSegments[0];
      let moduleType: ModuleType | undefined;
      let moduleLabel: string;

      switch (moduleSegment) {
        case "k12":
          moduleType = ModuleType.K12;
          moduleLabel = "K-12 Module";
          break;
        case "post-secondary":
          moduleType = ModuleType.POST_SECONDARY;
          moduleLabel = "Post-Secondary Module";
          break;
        case "tutoring":
          moduleType = ModuleType.TUTORING;
          moduleLabel = "Tutoring Module";
          break;
        default:
          moduleLabel = "Module";
      }

      if (moduleType) {
        breadcrumbs.push({
          label: moduleLabel,
          path: `/${moduleSegment}`,
          active: pathSegments.length === 1,
          moduleType,
        });

        // Add sub-page breadcrumbs
        if (pathSegments.length > 1) {
          const subPage = pathSegments[1];
          let subLabel: string;

          switch (subPage) {
            case "assessment":
            case "new-assessment":
              subLabel = "New Assessment";
              break;
            case "reports":
              subLabel = "Reports";
              break;
            case "review-edit":
              subLabel = "Review & Edit";
              break;
            default:
              subLabel = subPage.charAt(0).toUpperCase() + subPage.slice(1);
          }

          breadcrumbs.push({
            label: subLabel,
            active: true,
            moduleType,
          });
        }
      }
    }

    return breadcrumbs;
  }

  /**
   * Clears all navigation data (useful for logout)
   */
  static clearAllNavigationData(): void {
    try {
      Object.values(this.STORAGE_KEYS).forEach((key) => {
        localStorage.removeItem(key);
      });
    } catch (error) {
      console.warn("Failed to clear navigation data:", error);
    }
  }

  /**
   * Migrates old navigation data to new format
   */
  static migrateNavigationData(): void {
    try {
      // Check for old format data and migrate if necessary
      const oldKeys = [
        "navigation_state",
        "user_preferences",
        "module_context",
      ];

      oldKeys.forEach((oldKey) => {
        const oldData = localStorage.getItem(oldKey);
        if (oldData) {
          // Migrate to new key format
          const newKey = `thrive_${oldKey}`;
          localStorage.setItem(newKey, oldData);
          localStorage.removeItem(oldKey);
        }
      });
    } catch (error) {
      console.warn("Failed to migrate navigation data:", error);
    }
  }

  /**
   * Gets navigation analytics data
   */
  static getNavigationAnalytics(): {
    totalNavigations: number;
    mostVisitedPaths: Array<{ path: string; count: number }>;
    averageSessionDuration: number;
    moduleUsage: Record<ModuleType, number>;
  } {
    try {
      // This would typically integrate with an analytics service
      // For now, return basic data from localStorage
      const history = localStorage.getItem(
        this.STORAGE_KEYS.NAVIGATION_HISTORY
      );
      const historyData = history ? JSON.parse(history) : [];

      const pathCounts: Record<string, number> = {};
      const moduleCounts: Record<ModuleType, number> = {
        [ModuleType.K12]: 0,
        [ModuleType.POST_SECONDARY]: 0,
        [ModuleType.TUTORING]: 0,
      };

      historyData.forEach((item: any) => {
        pathCounts[item.path] = (pathCounts[item.path] || 0) + 1;

        // Count module usage
        if (item.path.includes("/k12")) {
          moduleCounts[ModuleType.K12]++;
        } else if (item.path.includes("/post-secondary")) {
          moduleCounts[ModuleType.POST_SECONDARY]++;
        } else if (item.path.includes("/tutoring")) {
          moduleCounts[ModuleType.TUTORING]++;
        }
      });

      const mostVisitedPaths = Object.entries(pathCounts)
        .map(([path, count]) => ({ path, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      return {
        totalNavigations: historyData.length,
        mostVisitedPaths,
        averageSessionDuration: 0, // Would need session tracking
        moduleUsage: moduleCounts,
      };
    } catch (error) {
      console.warn("Failed to get navigation analytics:", error);
      return {
        totalNavigations: 0,
        mostVisitedPaths: [],
        averageSessionDuration: 0,
        moduleUsage: {
          [ModuleType.K12]: 0,
          [ModuleType.POST_SECONDARY]: 0,
          [ModuleType.TUTORING]: 0,
        },
      };
    }
  }
}
