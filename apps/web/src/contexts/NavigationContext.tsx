import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import {
  NavigationState,
  ModuleType,
  UserPreferences,
} from "@/types/unified-auth";

interface NavigationHistory {
  path: string;
  timestamp: Date;
  moduleContext?: string;
}

interface NavigationContextType {
  navigationState: NavigationState;
  navigationHistory: NavigationHistory[];
  setCurrentPath: (path: string) => void;
  setRedirectAfterLogin: (path?: string) => void;
  setModuleContext: (context?: string) => void;
  clearRedirect: () => void;
  addToHistory: (path: string, moduleContext?: string) => void;
  getRecentPaths: (limit?: number) => NavigationHistory[];
  canGoBack: () => boolean;
  getPreviousPath: () => string | undefined;
  saveUserPreferences: (preferences: Partial<UserPreferences>) => void;
  getUserPreferences: () => UserPreferences | null;
  clearNavigationData: () => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(
  undefined
);

const NAVIGATION_STORAGE_KEY = "thrive_navigation_state";
const USER_PREFERENCES_KEY = "thrive_user_preferences";
const NAVIGATION_HISTORY_KEY = "thrive_navigation_history";
const MAX_HISTORY_ITEMS = 50;

export function NavigationProvider({ children }: { children: ReactNode }) {
  // Initialize state from localStorage if available
  const [navigationState, setNavigationState] = useState<NavigationState>(
    () => {
      try {
        const saved = localStorage.getItem(NAVIGATION_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          return {
            ...parsed,
            currentPath: window.location.pathname, // Always use current path
          };
        }
      } catch (error) {
        console.warn(
          "Failed to load navigation state from localStorage:",
          error
        );
      }
      return {
        currentPath: window.location.pathname,
      };
    }
  );

  // Initialize navigation history
  const [navigationHistory, setNavigationHistory] = useState<
    NavigationHistory[]
  >(() => {
    try {
      const saved = localStorage.getItem(NAVIGATION_HISTORY_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp),
        }));
      }
    } catch (error) {
      console.warn(
        "Failed to load navigation history from localStorage:",
        error
      );
    }
    return [];
  });

  // Save navigation state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(
        NAVIGATION_STORAGE_KEY,
        JSON.stringify(navigationState)
      );
    } catch (error) {
      console.warn("Failed to save navigation state to localStorage:", error);
    }
  }, [navigationState]);

  // Save navigation history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(
        NAVIGATION_HISTORY_KEY,
        JSON.stringify(navigationHistory)
      );
    } catch (error) {
      console.warn("Failed to save navigation history to localStorage:", error);
    }
  }, [navigationHistory]);

  // Update current path when location changes
  useEffect(() => {
    const handleLocationChange = () => {
      const newPath = window.location.pathname;
      setNavigationState((prev) => ({
        ...prev,
        previousPath: prev.currentPath,
        currentPath: newPath,
      }));

      // Add to history
      addToHistory(newPath);
    };

    // Listen for browser navigation
    window.addEventListener("popstate", handleLocationChange);

    return () => {
      window.removeEventListener("popstate", handleLocationChange);
    };
  }, []);

  const setCurrentPath = useCallback((path: string) => {
    setNavigationState((prev) => ({
      ...prev,
      previousPath: prev.currentPath,
      currentPath: path,
    }));

    // Add to history
    addToHistory(path);
  }, []);

  const setRedirectAfterLogin = useCallback((path?: string) => {
    setNavigationState((prev) => ({
      ...prev,
      redirectAfterLogin: path,
    }));
  }, []);

  const setModuleContext = useCallback((context?: string) => {
    setNavigationState((prev) => ({
      ...prev,
      moduleContext: context,
    }));
  }, []);

  const clearRedirect = useCallback(() => {
    setNavigationState((prev) => ({
      ...prev,
      redirectAfterLogin: undefined,
    }));
  }, []);

  const addToHistory = useCallback((path: string, moduleContext?: string) => {
    const historyItem: NavigationHistory = {
      path,
      timestamp: new Date(),
      moduleContext,
    };

    setNavigationHistory((prev) => {
      // Don't add duplicate consecutive entries
      if (prev.length > 0 && prev[prev.length - 1].path === path) {
        return prev;
      }

      const newHistory = [...prev, historyItem];

      // Keep only the most recent items
      if (newHistory.length > MAX_HISTORY_ITEMS) {
        return newHistory.slice(-MAX_HISTORY_ITEMS);
      }

      return newHistory;
    });
  }, []);

  const getRecentPaths = useCallback(
    (limit: number = 10): NavigationHistory[] => {
      return navigationHistory.slice(-limit).reverse(); // Most recent first
    },
    [navigationHistory]
  );

  const canGoBack = useCallback((): boolean => {
    return navigationHistory.length > 1;
  }, [navigationHistory]);

  const getPreviousPath = useCallback((): string | undefined => {
    if (navigationHistory.length < 2) {
      return undefined;
    }
    return navigationHistory[navigationHistory.length - 2].path;
  }, [navigationHistory]);

  const saveUserPreferences = useCallback(
    (preferences: Partial<UserPreferences>) => {
      try {
        const existing = getUserPreferences() || {
          dashboardLayout: "grid" as const,
          theme: "auto" as const,
          notifications: {
            email: true,
            browser: true,
            reportComplete: true,
            systemUpdates: false,
          },
        };

        const updated = { ...existing, ...preferences };
        localStorage.setItem(USER_PREFERENCES_KEY, JSON.stringify(updated));
      } catch (error) {
        console.warn("Failed to save user preferences:", error);
      }
    },
    []
  );

  const getUserPreferences = useCallback((): UserPreferences | null => {
    try {
      const saved = localStorage.getItem(USER_PREFERENCES_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.warn("Failed to load user preferences:", error);
      return null;
    }
  }, []);

  const clearNavigationData = useCallback(() => {
    try {
      localStorage.removeItem(NAVIGATION_STORAGE_KEY);
      localStorage.removeItem(NAVIGATION_HISTORY_KEY);
      localStorage.removeItem(USER_PREFERENCES_KEY);

      setNavigationState({
        currentPath: window.location.pathname,
      });
      setNavigationHistory([]);
    } catch (error) {
      console.warn("Failed to clear navigation data:", error);
    }
  }, []);

  const value = {
    navigationState,
    navigationHistory,
    setCurrentPath,
    setRedirectAfterLogin,
    setModuleContext,
    clearRedirect,
    addToHistory,
    getRecentPaths,
    canGoBack,
    getPreviousPath,
    saveUserPreferences,
    getUserPreferences,
    clearNavigationData,
  };

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error("useNavigation must be used within a NavigationProvider");
  }
  return context;
}
