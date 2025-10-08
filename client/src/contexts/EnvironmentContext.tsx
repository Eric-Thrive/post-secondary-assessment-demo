import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { EnvironmentType, environments } from '@shared/environment';
import { useToast } from '@/hooks/use-toast';

interface EnvironmentContextType {
  currentEnvironment: EnvironmentType;
  setEnvironment: (env: EnvironmentType) => Promise<void>;
  isLoading: boolean;
  availableEnvironments: typeof environments;
  isCustomerMode: boolean; // True when environment is forced/locked for customers
  isDeveloperMode: boolean; // True when full environment switching is allowed
}

const EnvironmentContext = createContext<EnvironmentContextType | undefined>(undefined);

const ENVIRONMENT_KEY = 'app-environment';

interface EnvironmentProviderProps {
  children: ReactNode;
  forcedEnvironment?: EnvironmentType; // For customer-facing locked URLs
}

export function EnvironmentProvider({ children, forcedEnvironment }: EnvironmentProviderProps) {
  const [currentEnvironment, setCurrentEnvironment] = useState<EnvironmentType>(
    forcedEnvironment || 'replit-prod'
  );
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  // Determine if we're in customer or developer mode
  const isCustomerMode = !!forcedEnvironment;
  const isDeveloperMode = !forcedEnvironment;

  // Load saved environment on mount (unless forced for customer mode)
  useEffect(() => {
    if (forcedEnvironment) {
      // Customer mode: Force the environment and lock the module
      console.log(`EnvironmentProvider: Customer mode - forcing environment: ${forcedEnvironment}`);
      localStorage.setItem(ENVIRONMENT_KEY, forcedEnvironment);
      
      // Lock module for demo environments
      if (forcedEnvironment === 'post-secondary-demo') {
        localStorage.setItem('activeModule', 'post_secondary');
      } else if (forcedEnvironment === 'k12-demo') {
        localStorage.setItem('activeModule', 'k12');
      } else if (forcedEnvironment === 'tutoring-demo' || forcedEnvironment === 'tutoring') {
        localStorage.setItem('activeModule', 'tutoring');
      }
      return;
    }
    
    // Developer mode: Load from localStorage
    const saved = localStorage.getItem(ENVIRONMENT_KEY);
    const validEnvironments = ['production', 'development', 'replit-prod', 'replit-dev', 
                              'post-secondary-demo', 'k12-demo', 'tutoring-demo', 'tutoring',
                              'post-secondary-dev', 'k12-dev', 'tutoring-dev'];
                              
    if (saved && validEnvironments.includes(saved)) {
      console.log(`EnvironmentProvider: Developer mode - loading saved environment: ${saved}`);
      setCurrentEnvironment(saved as EnvironmentType);
      
      // Ensure module consistency for demo modes
      if (saved === 'post-secondary-demo' || saved === 'post-secondary-dev') {
        const currentModule = localStorage.getItem('activeModule');
        if (currentModule !== 'post_secondary') {
          console.log('EnvironmentProvider: Fixing module for post-secondary');
          localStorage.setItem('activeModule', 'post_secondary');
        }
      } else if (saved === 'k12-demo' || saved === 'k12-dev') {
        const currentModule = localStorage.getItem('activeModule');
        if (currentModule !== 'k12') {
          console.log('EnvironmentProvider: Fixing module for k12');
          localStorage.setItem('activeModule', 'k12');
        }
      } else if (saved === 'tutoring-demo' || saved === 'tutoring-dev' || saved === 'tutoring') {
        const currentModule = localStorage.getItem('activeModule');
        if (currentModule !== 'tutoring') {
          console.log('EnvironmentProvider: Fixing module for tutoring');
          localStorage.setItem('activeModule', 'tutoring');
        }
      }
    } else {
      console.log('EnvironmentProvider: No saved environment, using default: replit-prod');
    }
  }, [forcedEnvironment]);

  const setEnvironment = async (env: EnvironmentType) => {
    if (env === currentEnvironment) return;
    
    // Block environment switching in customer mode
    if (isCustomerMode) {
      console.log('Environment switching is disabled in customer mode');
      return;
    }
    
    setIsLoading(true);
    try {
      // In developer mode, try to notify backend but don't fail if it's blocked
      if (isDeveloperMode) {
        try {
          const response = await fetch('/api/environment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ environment: env })
          });
          
          if (!response.ok) {
            console.log(`Backend environment switch failed (${response.status}), continuing with client-only switch`);
          }
        } catch (fetchError) {
          // Ignore backend errors in developer mode
          console.log('Backend environment notification failed, continuing with client-only switch:', fetchError);
        }
      }

      // Always update localStorage and state regardless of backend response
      localStorage.setItem(ENVIRONMENT_KEY, env);
      
      // Update module settings for environment-specific modes
      if (env === 'post-secondary-demo' || env === 'post-secondary-dev') {
        localStorage.setItem('activeModule', 'post_secondary');
      } else if (env === 'k12-demo' || env === 'k12-dev') {
        localStorage.setItem('activeModule', 'k12');
      } else if (env === 'tutoring-demo' || env === 'tutoring-dev' || env === 'tutoring') {
        localStorage.setItem('activeModule', 'tutoring');
      }
      
      setCurrentEnvironment(env);
      
      toast({
        title: "Environment Switched",
        description: `Now using ${environments.find(e => e.id === env)?.name}`,
      });

      // Reload to ensure all data is from new environment
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      // This should rarely happen now since we handle backend errors above
      console.error('Unexpected error switching environment:', error);
      toast({
        title: "Warning",
        description: "Environment switch may be incomplete. Refreshing page...",
        variant: "destructive",
      });
      
      // Still reload to apply the change
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <EnvironmentContext.Provider 
      value={{ 
        currentEnvironment, 
        setEnvironment, 
        isLoading,
        availableEnvironments: environments,
        isCustomerMode,
        isDeveloperMode
      }}
    >
      {children}
    </EnvironmentContext.Provider>
  );
}

export function useEnvironment() {
  const context = useContext(EnvironmentContext);
  if (!context) {
    throw new Error('useEnvironment must be used within EnvironmentProvider');
  }
  return context;
}