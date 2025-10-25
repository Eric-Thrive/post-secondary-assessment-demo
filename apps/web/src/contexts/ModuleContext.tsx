
import React, { createContext, useContext, useState, useEffect } from 'react';
import { environments } from '@shared/environment';
import { useEnvironment } from './EnvironmentContext';
import { getModuleForEnvironment, type ModuleType, type EnvironmentType } from '@shared/constants/environments';

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
    throw new Error('useModule must be used within a ModuleProvider');
  }
  return context;
};

interface ModuleProviderProps {
  children: React.ReactNode;
}

export const ModuleProvider: React.FC<ModuleProviderProps> = ({ children }) => {
  const [activeModule, setActiveModuleState] = useState<ModuleType>('post_secondary');
  
  // Use EnvironmentContext to get the correct current environment (respects forcedEnvironment)
  const { currentEnvironment } = useEnvironment();
  const currentEnvConfig = environments.find(env => env.id === currentEnvironment);
  const isDemoMode = currentEnvConfig?.demoMode || false;
  const isModuleLocked = !!currentEnvConfig?.lockedModule;

  // Load saved module preference from localStorage with better error handling
  useEffect(() => {
    const debugLogging = localStorage.getItem('app-debug-logging') === 'true';
    if (debugLogging) {
      console.log(`ModuleProvider useEffect - Environment: ${currentEnvironment}, Locked: ${isModuleLocked}, Demo: ${isDemoMode}`);
    }

    // Check if admin override is enabled
    const overrideEnabled = localStorage.getItem('app-environment-override') === 'true';

    // Use centralized utility to get the locked module for this environment
    const lockedModule = getModuleForEnvironment(currentEnvironment as EnvironmentType);

    // If environment has a locked module, enforce it (unless override is active)
    if (lockedModule && !overrideEnabled) {
      if (debugLogging) {
        console.log(`FORCING ${lockedModule} module for ${currentEnvironment}`);
      }
      const currentSavedModule = localStorage.getItem('activeModule');

      // Only update if module doesn't match
      if (currentSavedModule !== lockedModule) {
        if (debugLogging) {
          console.log(`Correcting module from ${currentSavedModule} to ${lockedModule}`);
        }
        localStorage.setItem('activeModule', lockedModule);
        setActiveModuleState(lockedModule);
        // Note: Removed full page reload - state update is sufficient
        // Components will re-render when activeModule state changes
      } else {
        setActiveModuleState(lockedModule);
      }
      return;
    }

    // Admin override active or no locked module - allow free switching
    if (overrideEnabled && lockedModule && debugLogging) {
      console.log(`🔓 Admin override active - module switching enabled despite ${currentEnvironment} lock`);
    }

    // If in demo mode with locked module (fallback to currentEnvConfig), use that and save it (unless override)
    if (isModuleLocked && currentEnvConfig?.lockedModule && !overrideEnabled) {
      if (debugLogging) {
        console.log(`Setting locked module: ${currentEnvConfig.lockedModule}`);
      }
      setActiveModuleState(currentEnvConfig.lockedModule);
      localStorage.setItem('activeModule', currentEnvConfig.lockedModule);
      return;
    }

    // Otherwise, load from localStorage or use default
    const savedModule = localStorage.getItem('activeModule') as ModuleType;
    if (savedModule && (savedModule === 'post_secondary' || savedModule === 'k12' || savedModule === 'tutoring')) {
      if (debugLogging) {
        console.log(`Loading saved module: ${savedModule}`);
      }
      setActiveModuleState(savedModule);
    } else {
      if (debugLogging) {
        console.log('No saved module, using default: post_secondary');
      }
      setActiveModuleState('post_secondary');
      localStorage.setItem('activeModule', 'post_secondary');
    }
  }, [currentEnvironment, isModuleLocked, currentEnvConfig]);

  const setActiveModule = (module: ModuleType) => {
    // Check if admin override is enabled
    const overrideEnabled = localStorage.getItem('app-environment-override') === 'true';
    const debugLogging = localStorage.getItem('app-debug-logging') === 'true';

    // Don't allow module switching if locked (unless admin override)
    if (isModuleLocked && !overrideEnabled) {
      if (debugLogging) {
        console.log('Module switching disabled in demo mode');
      }
      return;
    }

    setActiveModuleState(module);
    localStorage.setItem('activeModule', module);
    if (debugLogging) {
      console.log('Active module changed to:', module);
    }
  };

  const value = {
    activeModule,
    setActiveModule,
    isPostSecondary: activeModule === 'post_secondary',
    isK12: activeModule === 'k12',
    isTutoring: activeModule === 'tutoring',
    isDemoMode,
    isModuleLocked
  };

  return (
    <ModuleContext.Provider value={value}>
      {children}
    </ModuleContext.Provider>
  );
};
