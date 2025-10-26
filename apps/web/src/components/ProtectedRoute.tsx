import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useEnvironment } from '@/contexts/EnvironmentContext';
import LoginForm, { type LoginVariant } from './LoginForm';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const { currentEnvironment } = useEnvironment();

  const resolveLoginVariant = (): LoginVariant => {
    if (!currentEnvironment) {
      return 'post-secondary';
    }

    if (currentEnvironment.startsWith('k12')) {
      return 'k12';
    }

    if (currentEnvironment.startsWith('tutoring')) {
      return 'tutor';
    }

    return 'post-secondary';
  };

  const loginVariant = resolveLoginVariant();

  // Require authentication for all demo environments, dev environments, and tutoring production
  const requiresAuth = currentEnvironment === 'tutoring' || 
                      currentEnvironment === 'post-secondary-demo' ||
                      currentEnvironment === 'post-secondary-dev' ||
                      currentEnvironment === 'k12-demo' ||
                      currentEnvironment === 'tutoring-demo';

  // Show loading spinner while checking auth status
  if (requiresAuth && isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // If auth is required but user is not authenticated, show login form
  if (requiresAuth && !isAuthenticated) {
    return <LoginForm variant={loginVariant} />;
  }

  // Otherwise, render the protected content
  return <>{children}</>;
};

export default ProtectedRoute;
