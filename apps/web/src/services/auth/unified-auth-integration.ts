import {
  AuthenticatedUser,
  LoginCredentials,
  ModuleType,
  UserRole,
} from "@/types/unified-auth";
import { adaptLegacyUser, isLegacyUser } from "@/utils/auth-adapter";
import { sessionManagement } from "./session-management";

/**
 * Integration service that connects the unified auth system with the existing backend
 * This service handles the translation between legacy and new authentication systems
 */
export class UnifiedAuthIntegration {
  private static instance: UnifiedAuthIntegration;

  private constructor() {}

  public static getInstance(): UnifiedAuthIntegration {
    if (!UnifiedAuthIntegration.instance) {
      UnifiedAuthIntegration.instance = new UnifiedAuthIntegration();
    }
    return UnifiedAuthIntegration.instance;
  }

  /**
   * Authenticate user with the existing backend system
   */
  async authenticate(credentials: LoginCredentials): Promise<{
    success: boolean;
    user?: AuthenticatedUser;
    error?: string;
    redirectUrl?: string;
  }> {
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      // Add environment header if provided (for demo-specific authentication)
      if (credentials.environment) {
        headers["x-environment"] = credentials.environment;
      }

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({
          username: credentials.username,
          password: credentials.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Convert legacy user format to unified format
        const unifiedUser = this.convertToUnifiedUser(data.user);

        // Store session data
        sessionManagement.storeUserSession(unifiedUser);

        return {
          success: true,
          user: unifiedUser,
          redirectUrl: data.redirectUrl,
        };
      } else {
        return {
          success: false,
          error: data.error || "Invalid credentials",
        };
      }
    } catch (error) {
      return {
        success: false,
        error: "Failed to connect to server. Please try again.",
      };
    }
  }

  /**
   * Check current authentication status
   */
  async checkAuthStatus(): Promise<{
    isAuthenticated: boolean;
    user?: AuthenticatedUser;
  }> {
    try {
      const response = await fetch("/api/auth/me", {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        const unifiedUser = this.convertToUnifiedUser(data.user);

        return {
          isAuthenticated: true,
          user: unifiedUser,
        };
      }

      return { isAuthenticated: false };
    } catch (error) {
      console.error("Auth status check failed:", error);
      return { isAuthenticated: false };
    }
  }

  /**
   * Logout user from the existing backend system
   */
  async logout(): Promise<{ success: boolean; error?: string }> {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      // Clear any client-side auth state
      sessionManagement.clearAllData();

      return { success: true };
    } catch (error) {
      console.error("Logout error:", error);
      // Still clear client-side state even if request fails
      sessionManagement.clearAllData();
      return { success: true }; // Don't fail logout on network errors
    }
  }

  /**
   * Register new user with the existing backend system
   */
  async register(
    username: string,
    password: string,
    email: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          username,
          password,
          email,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true };
      } else {
        return {
          success: false,
          error: data.error || "Failed to create account",
        };
      }
    } catch (error) {
      return {
        success: false,
        error: "Failed to connect to server. Please try again.",
      };
    }
  }

  /**
   * Convert legacy user format to unified AuthenticatedUser format
   */
  private convertToUnifiedUser(legacyUser: any): AuthenticatedUser {
    if (isLegacyUser(legacyUser)) {
      return adaptLegacyUser(legacyUser);
    }

    // If already in unified format, return as-is
    return legacyUser as AuthenticatedUser;
  }

  /**
   * Get user's module access permissions from backend
   */
  async getUserModuleAccess(userId: string): Promise<{
    success: boolean;
    moduleAccess?: ModuleType[];
    error?: string;
  }> {
    try {
      const response = await fetch(`/api/auth/user/${userId}/modules`, {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          moduleAccess: data.modules || [],
        };
      }

      return {
        success: false,
        error: "Failed to fetch module access",
      };
    } catch (error) {
      return {
        success: false,
        error: "Failed to connect to server",
      };
    }
  }

  /**
   * Update user preferences in the backend
   */
  async updateUserPreferences(
    userId: string,
    preferences: Partial<AuthenticatedUser["preferences"]>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`/api/auth/user/${userId}/preferences`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(preferences),
      });

      if (response.ok) {
        return { success: true };
      }

      const data = await response.json();
      return {
        success: false,
        error: data.error || "Failed to update preferences",
      };
    } catch (error) {
      return {
        success: false,
        error: "Failed to connect to server",
      };
    }
  }

  /**
   * Check if user has permission for specific action
   */
  async checkPermission(
    userId: string,
    action: string,
    resource: string,
    moduleType?: ModuleType
  ): Promise<{ hasPermission: boolean; error?: string }> {
    try {
      const params = new URLSearchParams({
        action,
        resource,
        ...(moduleType && { module: moduleType }),
      });

      const response = await fetch(
        `/api/auth/user/${userId}/permissions?${params}`,
        {
          credentials: "include",
        }
      );

      if (response.ok) {
        const data = await response.json();
        return { hasPermission: data.hasPermission };
      }

      return { hasPermission: false, error: "Permission check failed" };
    } catch (error) {
      return { hasPermission: false, error: "Failed to check permissions" };
    }
  }

  /**
   * Enable system admin environment override
   */
  enableAdminOverride(user: AuthenticatedUser): void {
    if (
      user.role === UserRole.SYSTEM_ADMIN ||
      user.role === UserRole.DEVELOPER
    ) {
      localStorage.setItem("app-environment-override", "true");
      if (localStorage.getItem("app-debug-logging") === "true") {
        console.log("🔓 Admin environment override enabled for", user.username);
      }
    }
  }

  /**
   * Disable system admin environment override
   */
  disableAdminOverride(): void {
    localStorage.removeItem("app-environment-override");
  }

  /**
   * Check if admin override is enabled
   */
  isAdminOverrideEnabled(): boolean {
    return localStorage.getItem("app-environment-override") === "true";
  }
}

// Export singleton instance
export const unifiedAuthIntegration = UnifiedAuthIntegration.getInstance();
