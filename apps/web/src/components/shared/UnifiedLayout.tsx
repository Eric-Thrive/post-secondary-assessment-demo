import React from "react";
import { UnifiedNavigation } from "./UnifiedNavigation";
import { useLocation } from "react-router-dom";

interface UnifiedLayoutProps {
  children: React.ReactNode;
  variant?: "sidebar" | "header" | "none";
  className?: string;
}

export const UnifiedLayout: React.FC<UnifiedLayoutProps> = ({
  children,
  variant = "sidebar",
  className = "",
}) => {
  const location = useLocation();

  // Determine if we should show navigation based on the current route
  const shouldShowNavigation = () => {
    // Don't show navigation on login pages or demo landing pages
    const noNavRoutes = [
      "/login/",
      "/post-secondary-demo-login",
      "/k12-demo-login",
      "/tutoring-demo-login",
      "/reset-password",
      "/shared/", // Shared report pages
    ];

    return !noNavRoutes.some((route) => location.pathname.includes(route));
  };

  // Check if we're on the home screen (root paths)
  const isHomeScreen = () => {
    const homeRoutes = [
      "/",
      "/post-secondary-demo",
      "/k12-demo",
      "/tutoring-demo",
      "/post-secondary-dev",
    ];

    return homeRoutes.some(
      (route) =>
        location.pathname === route ||
        (route !== "/" && location.pathname === route + "/")
    );
  };

  // Check if we're on a new assessment page (should also hide sidebar)
  const isNewAssessmentPage = () => {
    const assessmentRoutes = [
      "/new-k12-assessment",
      "/new-post-secondary-assessment",
      "/new-tutoring-assessment",
    ];

    return assessmentRoutes.some((route) => location.pathname === route);
  };

  // Don't show navigation on certain pages, home screen, or new assessment pages
  if (
    !shouldShowNavigation() ||
    variant === "none" ||
    isHomeScreen() ||
    isNewAssessmentPage()
  ) {
    return <div className={className}>{children}</div>;
  }

  if (variant === "header") {
    return (
      <div className={`min-h-screen bg-gray-50 ${className}`}>
        <UnifiedNavigation variant="header" />
        <main className="pt-0">{children}</main>
      </div>
    );
  }

  // Sidebar layout (default)
  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      <UnifiedNavigation variant="sidebar" />

      {/* Main content area with sidebar offset */}
      <main className="lg:ml-80 min-h-screen">
        <div className="p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
};
