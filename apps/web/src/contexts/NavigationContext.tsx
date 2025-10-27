import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { NavigationState } from "@/types/unified-auth";

interface NavigationContextType {
  navigationState: NavigationState;
  setCurrentPath: (path: string) => void;
  setRedirectAfterLogin: (path?: string) => void;
  setModuleContext: (context?: string) => void;
  clearRedirect: () => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(
  undefined
);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [navigationState, setNavigationState] = useState<NavigationState>({
    currentPath: window.location.pathname,
  });

  // Update current path when location changes
  useEffect(() => {
    const handleLocationChange = () => {
      setNavigationState((prev) => ({
        ...prev,
        previousPath: prev.currentPath,
        currentPath: window.location.pathname,
      }));
    };

    // Listen for browser navigation
    window.addEventListener("popstate", handleLocationChange);

    return () => {
      window.removeEventListener("popstate", handleLocationChange);
    };
  }, []);

  const setCurrentPath = (path: string) => {
    setNavigationState((prev) => ({
      ...prev,
      previousPath: prev.currentPath,
      currentPath: path,
    }));
  };

  const setRedirectAfterLogin = (path?: string) => {
    setNavigationState((prev) => ({
      ...prev,
      redirectAfterLogin: path,
    }));
  };

  const setModuleContext = (context?: string) => {
    setNavigationState((prev) => ({
      ...prev,
      moduleContext: context,
    }));
  };

  const clearRedirect = () => {
    setNavigationState((prev) => ({
      ...prev,
      redirectAfterLogin: undefined,
    }));
  };

  const value = {
    navigationState,
    setCurrentPath,
    setRedirectAfterLogin,
    setModuleContext,
    clearRedirect,
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
