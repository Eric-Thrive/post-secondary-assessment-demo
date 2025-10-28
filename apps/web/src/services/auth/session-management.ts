import { AuthenticatedUser, UserPreferences } from "@/types/unified-auth";

/**
 * Session management service for unified authentication system
 * Handles session storage, preferences, and state management
 */
export class SessionManagement {
  private static instance: SessionManagement;
  private readonly SESSION_KEY = "unified-auth-session";
  private readonly PREFERENCES_KEY = "unified-auth-preferences";
  private readonly NAVIGATION_KEY = "unified-auth-navigation";

  private constructor() {}

  public static getInstance(): SessionManagement {
    if (!SessionManagement.instance) {
      SessionManagement.instance = new SessionManagement();
    }
    return SessionManagement.instance;
  }

  /**
   * Store user session data locally (for offline access)
   */
  storeUserSession(user: AuthenticatedUser): void {
    try {
      const sessionData = {
        id: user.id,
        username: user.username,
        role: user.role,
        moduleAccess: user.moduleAccess,
        lastLogin: user.lastLogin,
        timestamp: new Date().toISOString(),
      };

      sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(sessionData));
    } catch (error) {
      console.warn("Failed to store session data:", error);
    }
  }

  /**
   * Retrieve stored session data
   */
  getStoredSession(): Partial<AuthenticatedUser> | null {
    try {
      const sessionData = sessionStorage.getItem(this.SESSION_KEY);
      if (!sessionData) return null;

      const parsed = JSON.parse(sessionData);

      // Check if session is still valid (within 24 hours)
      const timestamp = new Date(parsed.timestamp);
      const now = new Date();
      const hoursDiff =
        (now.getTime() - timestamp.getTime()) / (1000 * 60 * 60);

      if (hoursDiff > 24) {
        this.clearStoredSession();
        return null;
      }

      return parsed;
    } catch (error) {
      console.warn("Failed to retrieve session data:", error);
      return null;
    }
  }

  /**
   * Clear stored session data
   */
  clearStoredSession(): void {
    try {
      sessionStorage.removeItem(this.SESSION_KEY);
      sessionStorage.removeItem(this.NAVIGATION_KEY);
    } catch (error) {
      console.warn("Failed to clear session data:", error);
    }
  }

  /**
   * Store user preferences
   */
  storeUserPreferences(preferences: UserPreferences): void {
    try {
      localStorage.setItem(this.PREFERENCES_KEY, JSON.stringify(preferences));
    } catch (error) {
      console.warn("Failed to store user preferences:", error);
    }
  }

  /**
   * Retrieve user preferences
   */
  getUserPreferences(): UserPreferences | null {
    try {
      const prefsData = localStorage.getItem(this.PREFERENCES_KEY);
      if (!prefsData) return null;

      return JSON.parse(prefsData);
    } catch (error) {
      console.warn("Failed to retrieve user preferences:", error);
      return null;
    }
  }

  /**
   * Update specific preference
   */
  updatePreference<K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ): void {
    try {
      const currentPrefs =
        this.getUserPreferences() || this.getDefaultPreferences();
      const updatedPrefs = { ...currentPrefs, [key]: value };
      this.storeUserPreferences(updatedPrefs);
    } catch (error) {
      console.warn("Failed to update preference:", error);
    }
  }

  /**
   * Get default user preferences
   */
  getDefaultPreferences(): UserPreferences {
    return {
      dashboardLayout: "grid",
      theme: "light",
      notifications: {
        email: true,
        browser: true,
        reportComplete: true,
        systemUpdates: false,
      },
    };
  }

  /**
   * Store navigation state for post-login redirect
   */
  storeNavigationState(state: {
    redirectAfterLogin?: string;
    moduleContext?: string;
    previousPath?: string;
  }): void {
    try {
      sessionStorage.setItem(this.NAVIGATION_KEY, JSON.stringify(state));
    } catch (error) {
      console.warn("Failed to store navigation state:", error);
    }
  }

  /**
   * Retrieve and clear navigation state
   */
  getAndClearNavigationState(): {
    redirectAfterLogin?: string;
    moduleContext?: string;
    previousPath?: string;
  } | null {
    try {
      const navData = sessionStorage.getItem(this.NAVIGATION_KEY);
      if (!navData) return null;

      const parsed = JSON.parse(navData);
      sessionStorage.removeItem(this.NAVIGATION_KEY);

      return parsed;
    } catch (error) {
      console.warn("Failed to retrieve navigation state:", error);
      return null;
    }
  }

  /**
   * Check if user has valid session
   */
  hasValidSession(): boolean {
    const sessionData = this.getStoredSession();
    return sessionData !== null;
  }

  /**
   * Get session expiry time
   */
  getSessionExpiry(): Date | null {
    try {
      const sessionData = sessionStorage.getItem(this.SESSION_KEY);
      if (!sessionData) return null;

      const parsed = JSON.parse(sessionData);
      const timestamp = new Date(parsed.timestamp);

      // Session expires after 24 hours
      return new Date(timestamp.getTime() + 24 * 60 * 60 * 1000);
    } catch (error) {
      return null;
    }
  }

  /**
   * Extend session expiry
   */
  extendSession(): void {
    try {
      const sessionData = sessionStorage.getItem(this.SESSION_KEY);
      if (!sessionData) return;

      const parsed = JSON.parse(sessionData);
      parsed.timestamp = new Date().toISOString();

      sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(parsed));
    } catch (error) {
      console.warn("Failed to extend session:", error);
    }
  }

  /**
   * Clear all stored data (for logout)
   */
  clearAllData(): void {
    this.clearStoredSession();
    try {
      localStorage.removeItem(this.PREFERENCES_KEY);
      localStorage.removeItem("app-environment-override");
    } catch (error) {
      console.warn("Failed to clear all data:", error);
    }
  }

  /**
   * Migrate legacy session data if needed
   */
  migrateLegacySession(): void {
    // This method can be used to migrate any legacy session data
    // to the new unified format during the transition period
    try {
      // Check for any legacy session keys and migrate them
      const legacyKeys = ["legacy-auth-token", "user-session", "auth-state"];

      legacyKeys.forEach((key) => {
        const legacyData = localStorage.getItem(key);
        if (legacyData) {
          console.log(`Migrating legacy session data from ${key}`);
          // Migration logic would go here
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn("Failed to migrate legacy session:", error);
    }
  }
}

// Export singleton instance
export const sessionManagement = SessionManagement.getInstance();
