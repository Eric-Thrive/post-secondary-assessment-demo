import React, { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { unifiedRoutingService } from "@/services/routing/unified-routing-service";
import { useUnifiedAuth } from "@/hooks/useUnifiedAuth";

/**
 * Route migration component that handles backward compatibility
 * during the transition from module-specific to unified routing
 */
export const RouteMigration: React.FC = () => {
  const location = useLocation();
  const { user } = useUnifiedAuth();

  useEffect(() => {
    // Log route migration for debugging
    if (unifiedRoutingService.isLegacyRoute(location.pathname)) {
      console.log(`🔄 Migrating legacy route: ${location.pathname}`);
    }
  }, [location.pathname]);

  // Check if current route needs migration
  const redirectPath = unifiedRoutingService.handleLegacyRouteRedirect(
    location.pathname
  );

  if (redirectPath) {
    return <Navigate to={redirectPath} replace />;
  }

  // No migration needed
  return null;
};

/**
 * Higher-order component that wraps routes with migration logic
 */
export const withRouteMigration = <P extends object>(
  Component: React.ComponentType<P>
): React.FC<P> => {
  return (props: P) => {
    const location = useLocation();
    const redirectPath = unifiedRoutingService.handleLegacyRouteRedirect(
      location.pathname
    );

    if (redirectPath) {
      return <Navigate to={redirectPath} replace />;
    }

    return <Component {...props} />;
  };
};

/**
 * Legacy route redirect component for specific legacy routes
 */
export const LegacyRouteRedirect: React.FC<{
  legacyPath: string;
  newPath: string;
  preserveQuery?: boolean;
}> = ({ legacyPath, newPath, preserveQuery = false }) => {
  const location = useLocation();

  if (location.pathname === legacyPath) {
    const finalPath = preserveQuery
      ? `${newPath}${location.search}${location.hash}`
      : newPath;

    return <Navigate to={finalPath} replace />;
  }

  return null;
};

/**
 * Demo route migration component that handles demo-specific routing
 */
export const DemoRouteMigration: React.FC = () => {
  const location = useLocation();
  const { user } = useUnifiedAuth();

  // Handle demo login page redirects
  const demoRouteMap: Record<string, string> = {
    "/post-secondary-demo-login": "/login?demo=post-secondary",
    "/k12-demo-login": "/login?demo=k12",
    "/tutoring-demo-login": "/login?demo=tutoring",
  };

  const redirectPath = demoRouteMap[location.pathname];

  if (redirectPath) {
    return <Navigate to={redirectPath} replace />;
  }

  return null;
};
