import React from "react";
import { ModuleDashboardProps } from "./types";
import WelcomeHeader from "./WelcomeHeader";
import ModuleCard from "./ModuleCard";
import AdminQuickActions from "./AdminQuickActions";
import RecentActivity from "./RecentActivity";
import { getModuleConfig } from "@/config/modules";
import { UserRole } from "@/types/unified-auth";

/**
 * ModuleDashboard - Main dashboard component for multi-module users
 *
 * Features:
 * - Responsive grid layout for module cards
 * - Dynamic module filtering based on user permissions
 * - Welcome header with personalized greeting
 * - Admin quick actions for privileged users
 * - Recent activity display
 */
export const ModuleDashboard: React.FC<ModuleDashboardProps> = ({
  user,
  availableModules,
  recentActivity = [],
  adminFeatures = [],
}) => {
  // Filter modules based on user access
  const accessibleModules = availableModules.filter(
    (moduleAccess) => moduleAccess.accessLevel !== "unavailable"
  );

  // Check if user has admin privileges
  const isAdmin = [
    UserRole.DEVELOPER,
    UserRole.SYSTEM_ADMIN,
    UserRole.ORG_ADMIN,
  ].includes(user.role);

  // Handle module card click
  const handleModuleClick = (moduleType: string) => {
    const moduleConfig = getModuleConfig(moduleType as any);
    if (moduleConfig) {
      window.location.href = moduleConfig.route;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Welcome Header */}
        <WelcomeHeader user={user} />

        {/* Admin Quick Actions */}
        {isAdmin && adminFeatures.length > 0 && (
          <div className="mb-8">
            <AdminQuickActions user={user} features={adminFeatures} />
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Module Cards Section */}
          <div className="lg:col-span-2">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                Your Modules
              </h2>
              <p className="text-gray-600">
                Select a module to begin working with assessments and reports.
              </p>
            </div>

            {/* Responsive Module Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {accessibleModules.map((moduleAccess) => {
                const moduleConfig = getModuleConfig(moduleAccess.moduleType);
                return (
                  <ModuleCard
                    key={moduleConfig.id}
                    module={moduleConfig}
                    accessLevel={moduleAccess.accessLevel}
                    onClick={() => handleModuleClick(moduleAccess.moduleType)}
                    disabled={moduleAccess.accessLevel === "restricted"}
                  />
                );
              })}
            </div>

            {/* Empty State */}
            {accessibleModules.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No modules available
                </h3>
                <p className="text-gray-500 mb-4">
                  Contact your administrator to request access to modules.
                </p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Recent Activity */}
            {recentActivity.length > 0 && (
              <div className="mb-8">
                <RecentActivity activities={recentActivity} />
              </div>
            )}

            {/* Help & Support Card */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Need Help?
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                Get support or learn more about using the THRIVE platform.
              </p>
              <div className="space-y-2">
                <a
                  href="/help"
                  className="block text-sm text-blue-600 hover:text-blue-800 transition-colors"
                >
                  View Documentation
                </a>
                <a
                  href="/support"
                  className="block text-sm text-blue-600 hover:text-blue-800 transition-colors"
                >
                  Contact Support
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModuleDashboard;
