import React, { useEffect } from "react";
import { usePerformanceOptimization } from "@/services/performance";
import { useLocation } from "react-router-dom";

/**
 * Performance wrapper component that initializes and manages performance optimizations
 */
export const PerformanceWrapper: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { trackNavigation, isOptimized } = usePerformanceOptimization();
  const location = useLocation();
  const previousLocation = React.useRef(location.pathname);

  // Track navigation changes
  useEffect(() => {
    if (previousLocation.current !== location.pathname) {
      trackNavigation(previousLocation.current, location.pathname);
      previousLocation.current = location.pathname;
    }
  }, [location.pathname, trackNavigation]);

  // Add performance monitoring to the document
  useEffect(() => {
    if (isOptimized) {
      // Add performance mark for route changes
      performance.mark(`route-${location.pathname}-start`);

      return () => {
        performance.mark(`route-${location.pathname}-end`);
        performance.measure(
          `route-${location.pathname}`,
          `route-${location.pathname}-start`,
          `route-${location.pathname}-end`
        );
      };
    }
  }, [location.pathname, isOptimized]);

  return <>{children}</>;
};
