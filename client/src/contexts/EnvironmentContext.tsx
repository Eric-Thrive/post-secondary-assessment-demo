import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { EnvironmentType, environments } from '@shared/environment';
import { useToast } from '@/hooks/use-toast';

interface EnvironmentContextType {
  currentEnvironment: EnvironmentType;
  setEnvironment: (env: EnvironmentType) => Promise<void>;
  isLoading: boolean;
  availableEnvironments: typeof environments;
}

const EnvironmentContext = createContext<EnvironmentContextType | undefined>(undefined);

const ENVIRONMENT_KEY = 'app-environment';

export function EnvironmentProvider({ children }: { children: ReactNode }) {
  const [currentEnvironment, setCurrentEnvironment] = useState<EnvironmentType>('replit-prod');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Load saved environment on mount
  useEffect(() => {
    const saved = localStorage.getItem(ENVIRONMENT_KEY);
    if (saved && ['replit-prod', 'replit-dev', 'post-secondary-demo', 'k12-demo', 'tutoring-demo', 'tutoring'].includes(saved)) {
      console.log(`EnvironmentProvider: Loading saved environment: ${saved}`);
      setCurrentEnvironment(saved as EnvironmentType);
      
      // Ensure module consistency for demo modes
      if (saved === 'post-secondary-demo') {
        const currentModule = localStorage.getItem('activeModule');
        if (currentModule !== 'post_secondary') {
          console.log('EnvironmentProvider: Fixing module for post-secondary demo');
          localStorage.setItem('activeModule', 'post_secondary');
        }
      } else if (saved === 'k12-demo') {
        const currentModule = localStorage.getItem('activeModule');
        if (currentModule !== 'k12') {
          console.log('EnvironmentProvider: Fixing module for k12 demo');
          localStorage.setItem('activeModule', 'k12');
        }
      } else if (saved === 'tutoring-demo') {
        const currentModule = localStorage.getItem('activeModule');
        if (currentModule !== 'tutoring') {
          console.log('EnvironmentProvider: Fixing module for tutoring demo');
          localStorage.setItem('activeModule', 'tutoring');
        }
      }
    } else {
      console.log('EnvironmentProvider: No saved environment, using default: replit-prod');
    }
  }, []);

  const setEnvironment = async (env: EnvironmentType) => {
    if (env === currentEnvironment) return;
    
    setIsLoading(true);
    try {
      // Notify the server about environment change
      const response = await fetch('/api/environment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ environment: env })
      });

      if (!response.ok) {
        throw new Error('Failed to switch environment');
      }

      // Save to localStorage first
      localStorage.setItem(ENVIRONMENT_KEY, env);
      
      // Clear any conflicting module settings for demo modes
      if (env === 'post-secondary-demo') {
        localStorage.setItem('activeModule', 'post_secondary');
      } else if (env === 'k12-demo') {
        localStorage.setItem('activeModule', 'k12');
      } else if (env === 'tutoring-demo') {
        localStorage.setItem('activeModule', 'tutoring');
      } else if (env === 'tutoring') {
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
      toast({
        title: "Error",
        description: "Failed to switch environment. Please try again.",
        variant: "destructive",
      });
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
        availableEnvironments: environments 
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