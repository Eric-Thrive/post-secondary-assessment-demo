
import React, { createContext, useContext, useState, useEffect } from 'react';
import { environments } from '@shared/environment';
import { useEnvironment } from './EnvironmentContext';

export type ModuleType = 'post_secondary' | 'k12' | 'tutoring';

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
    console.log(`ModuleProvider useEffect - Environment: ${currentEnvironment}, Locked: ${isModuleLocked}, Demo: ${isDemoMode}`);
    
    // Force module alignment for demo environments (critical fix)
    if (currentEnvironment === 'post-secondary-demo') {
      console.log('FORCING post_secondary module for post-secondary demo');
      const currentSavedModule = localStorage.getItem('activeModule');
      if (currentSavedModule !== 'post_secondary') {
        console.log(`Correcting module from ${currentSavedModule} to post_secondary`);
        localStorage.setItem('activeModule', 'post_secondary');
        // Force immediate page reload to clear all cached component state
        setTimeout(() => window.location.reload(), 100);
        return;
      }
      setActiveModuleState('post_secondary');
      return;
    }
    
    if (currentEnvironment === 'k12-demo') {
      console.log('FORCING k12 module for k12 demo');
      const currentSavedModule = localStorage.getItem('activeModule');
      if (currentSavedModule !== 'k12') {
        console.log(`Correcting module from ${currentSavedModule} to k12`);
        localStorage.setItem('activeModule', 'k12');
        // Force immediate page reload to clear all cached component state
        setTimeout(() => window.location.reload(), 100);
        return;
      }
      setActiveModuleState('k12');
      return;
    }
    
    if (currentEnvironment === 'tutoring-demo') {
      console.log('FORCING tutoring module for tutoring demo');
      const currentSavedModule = localStorage.getItem('activeModule');
      if (currentSavedModule !== 'tutoring') {
        console.log(`Correcting module from ${currentSavedModule} to tutoring`);
        localStorage.setItem('activeModule', 'tutoring');
        // Force immediate page reload to clear all cached component state
        setTimeout(() => window.location.reload(), 100);
        return;
      }
      setActiveModuleState('tutoring');
      return;
    }
    
    // If in demo mode with locked module, use that and save it
    if (isModuleLocked && currentEnvConfig?.lockedModule) {
      console.log(`Setting locked module: ${currentEnvConfig.lockedModule}`);
      setActiveModuleState(currentEnvConfig.lockedModule);
      localStorage.setItem('activeModule', currentEnvConfig.lockedModule);
      return;
    }

    // Otherwise, load from localStorage or use default
    const savedModule = localStorage.getItem('activeModule') as ModuleType;
    if (savedModule && (savedModule === 'post_secondary' || savedModule === 'k12' || savedModule === 'tutoring')) {
      console.log(`Loading saved module: ${savedModule}`);
      setActiveModuleState(savedModule);
    } else {
      console.log('No saved module, using default: post_secondary');
      setActiveModuleState('post_secondary');
      localStorage.setItem('activeModule', 'post_secondary');
    }
  }, [currentEnvironment, isModuleLocked, currentEnvConfig]);

  const setActiveModule = (module: ModuleType) => {
    // Don't allow module switching if locked
    if (isModuleLocked) {
      console.log('Module switching disabled in demo mode');
      return;
    }
    
    setActiveModuleState(module);
    localStorage.setItem('activeModule', module);
    console.log('Active module changed to:', module);
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
