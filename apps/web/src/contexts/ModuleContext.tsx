import React, { createContext, useContext, useState, useEffect } from "react";
import { type ModuleType } from "@shared/constants/environments";
import { useUnifiedAuth } from "@/hooks/useUnifiedAuth";
import { ModuleType as UnifiedModuleType } from "@/types/unified-auth";

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

  // Simplified version without useUnifiedAuth dependency for testing
  const isDemoMode = false;
  const isModuleLocked = false;

  const setActiveModule = (module: ModuleType) => {
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
