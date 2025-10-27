import { useState, useCallback, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useUnifiedRouting } from "./useUnifiedRouting";
import {
  AuthenticatedUser,
  LoginCredentials,
  ModuleAccess,
  ModuleType,
  UserRole,
} from "@/types/unified-auth";
import { getAccessibleModules, hasAnyRole } from "@/utils/routing";
import { adaptLegacyUser, isLegacyUser } from "@/utils/auth-adapter";

export const useUnifiedAuth = () => {
  const {
    user: legacyUser,
    login,
    logout,
    isLoading,
    isAuthenticated,
  } = useAuth();
  const { handlePostLoginNavigation } = useUnifiedRouting();
  const [authError, setAuthError] = useState<string | null>(null);

  // Convert legacy user to AuthenticatedUser format
  const user = useMemo((): AuthenticatedUser | null => {
    if (!legacyUser) return null;
    if (isLegacyUser(legacyUser)) {
      return adaptLegacyUser(legacyUser);
    }
    return legacyUser as AuthenticatedUser;
  }, [legacyUser]);

  // Enhanced login with unified routing
  const unifiedLogin = useCallback(
    async (credentials: LoginCredentials): Promise<boolean> => {
      setAuthError(null);

      try {
        const success = await login(
          credentials.username,
          credentials.password,
          credentials.environment
        );

        if (success) {
          // Handle post-login navigation
          setTimeout(() => {
            handlePostLoginNavigation();
          }, 100);
        }

        return success;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Login failed";
        setAuthError(errorMessage);
        return false;
      }
    },
    [login, handlePostLoginNavigation]
  );

  // Enhanced logout with cleanup
  const unifiedLogout = useCallback(async (): Promise<void> => {
    try {
      await logout();
      setAuthError(null);
    } catch (error) {
      console.error("Logout error:", error);
    }
  }, [logout]);

  // Get user's accessible modules
  const getUserModules = useCallback((): ModuleAccess[] => {
    if (!user) return [];
    return getAccessibleModules(user);
  }, [user]);

  // Check if user has admin privileges
  const isAdmin = useCallback((): boolean => {
    if (!user) return false;
    return hasAnyRole(user, [
      UserRole.DEVELOPER,
      UserRole.SYSTEM_ADMIN,
      UserRole.ORG_ADMIN,
    ]);
  }, [user]);

  // Check if user is in demo mode
  const isDemoUser = useCallback((): boolean => {
    if (!user) return false;
    return user.role === UserRole.DEMO;
  }, [user]);

  // Get user's default module
  const getDefaultModule = useCallback((): ModuleType | null => {
    if (!user) return null;

    const modules = getUserModules();
    if (modules.length === 0) return null;

    // Return user's preferred module or first available
    const userPrefs = user.preferences;
    if (userPrefs?.defaultModule) {
      const preferredModule = modules.find(
        (m) => m.moduleType === userPrefs.defaultModule
      );
      if (preferredModule) return preferredModule.moduleType;
    }

    return modules[0].moduleType;
  }, [user, getUserModules]);

  // Clear authentication error
  const clearAuthError = useCallback(() => {
    setAuthError(null);
  }, []);

  return {
    // Auth state
    user,
    isLoading,
    isAuthenticated,
    authError,

    // Auth actions
    login: unifiedLogin,
    logout: unifiedLogout,
    clearAuthError,

    // User info helpers
    getUserModules,
    isAdmin,
    isDemoUser,
    getDefaultModule,

    // User properties (computed)
    userRole: user?.role || null,
    userName: user?.username || null,
    userEmail: user?.email || null,
  };
};
