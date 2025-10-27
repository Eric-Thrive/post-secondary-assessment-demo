import React, { createContext, useContext, useState, useEffect } from "react";
import { type ModuleType } from "@shared/constants/environments";

// Re-export for backward compatibility
export type { ModuleType };

interface ModuleContextType {
  activeModule: ModuleType;
  setActiveModule: (module: ModuleType) => void;
  isPostSecondary: boolean;
  isK12: boolean;
  isTutoring: boolean;
  isDemoMode: boolean;
  isModuleLocked: boolean;
}

const ModuleContext = createContext<ModuleContextType | undefined>(undefined);

export const useModule = () => {
  const context = useContext(ModuleContext);
  if (context === undefined) {
    throw new Error("useModule must be used within a ModuleProvider");
  }
  return context;
};

interface ModuleProviderProps {
  children: React.ReactNode;
}

export const ModuleProvider: React.FC<ModuleProviderProps> = ({ children }) => {
  const [activeModule, setActiveModuleState] =
    useState<ModuleType>("post_secondary");

  // In the simplified RBAC system, demo mode and module locking will be handled by user roles
  // For now, we'll set these to false since environment-based logic is removed
  const isDemoMode = false;
  const isModuleLocked = false;

  // Load saved module preference from localStorage
  useEffect(() => {
    const savedModule = localStorage.getItem("activeModule") as ModuleType;
    if (
      savedModule &&
      (savedModule === "post_secondary" ||
        savedModule === "k12" ||
        savedModule === "tutoring")
    ) {
      setActiveModuleState(savedModule);
    } else {
      setActiveModuleState("post_secondary");
      localStorage.setItem("activeModule", "post_secondary");
    }
  }, []);

  const setActiveModule = (module: ModuleType) => {
    // In the simplified system, allow module switching (role-based restrictions will be handled elsewhere)
    setActiveModuleState(module);
    localStorage.setItem("activeModule", module);
  };

  const value = {
    activeModule,
    setActiveModule,
    isPostSecondary: activeModule === "post_secondary",
    isK12: activeModule === "k12",
    isTutoring: activeModule === "tutoring",
    isDemoMode,
    isModuleLocked,
  };

  return (
    <ModuleContext.Provider value={value}>{children}</ModuleContext.Provider>
  );
};
