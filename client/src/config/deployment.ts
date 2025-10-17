// Deployment configuration
// This file determines which environment the app should default to based on deployment context

export function getDefaultEnvironment(): string {
  // Check for explicit environment configuration
  const envConfig = (window as any).__ENV_CONFIG__;
  if (envConfig?.defaultEnvironment) {
    return envConfig.defaultEnvironment;
  }
  
  // Check URL parameters for environment override
  const params = new URLSearchParams(window.location.search);
  const envParam = params.get('env');
  if (envParam) {
    return envParam;
  }
  
  // Check hostname patterns for specific deployments
  const hostname = window.location.hostname;
  
  // Specific pattern matching for dev deployments
  // This can be customized based on your deployment naming convention
  if (hostname.includes('post-secondary') && (hostname.includes('dev') || hostname.includes('assessment'))) {
    return 'post-secondary-dev';
  }
  
  // Default to production
  return 'replit-prod';
}

export function shouldForceEnvironment(): boolean {
  // Check if we're on a specific demo route
  const pathname = window.location.pathname;
  const isDemoRoute = pathname.startsWith('/post-secondary-demo') ||
                     pathname.startsWith('/k12-demo') ||
                     pathname.startsWith('/tutoring-demo');
  
  // Only force environment for specific deployments and not on demo routes
  const hostname = window.location.hostname;
  const isSpecificDeployment = hostname.includes('post-secondary') && 
                               (hostname.includes('dev') || hostname.includes('assessment'));
  
  return isSpecificDeployment && !isDemoRoute;
}