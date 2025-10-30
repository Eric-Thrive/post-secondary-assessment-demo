import React from "react";
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { ModuleDashboardProps } from "./types";
import WelcomeHeader from "./WelcomeHeader";
import ModuleCard from "./ModuleCard";
import AdminQuickActions from "./AdminQuickActions";
import RecentActivity from "./RecentActivity";
import { getModuleConfig } from "@/config/modules";
import { UserRole, ModuleType } from "@/types/unified-auth";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import ThriveLogo from "@/assets/primary logo O-W png_1760911234604.png";

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
  const navigate = useNavigate();
  const { logout } = useAuth();

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
    const moduleConfig = getModuleConfig(moduleType as ModuleType);
    if (moduleConfig) {
      navigate(moduleConfig.route);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Navigation */}
      <header className="border-b bg-white/90 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <img src={ThriveLogo} alt="THRIVE" className="h-9 w-auto" />
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">
                Thrive Assessment Platform
              </p>
              <h1 className="text-lg font-semibold text-slate-800">
                Unified Dashboard
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-slate-800">
                {user.name}
              </p>
              <p className="text-xs text-slate-500 capitalize">
                {user.role.replace("_", " ")}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-slate-200 text-slate-600 hover:bg-slate-100"
              onClick={logout}
              data-testid="button-dashboard-logout"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Welcome Header */}
        <WelcomeHeader
          user={user}
          onSettingsClick={() => navigate("/admin/dashboard")}
        />

        {/* Admin Quick Actions */}
        {isAdmin && adminFeatures.length > 0 && (
          <AdminQuickActions user={user} features={adminFeatures} />
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Module Cards Section */}
          <div className="lg:col-span-8 space-y-6">
            <section>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-semibold text-slate-900">
                    Your Modules
                  </h2>
                  <p className="text-slate-600">
                    Choose a workspace to begin working with assessments and reports.
                  </p>
                </div>
              </div>

              {/* Responsive Module Grid */}
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
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
                <div className="mt-8 rounded-lg border border-dashed border-slate-200 bg-white p-10 text-center">
                  <h3 className="text-lg font-semibold text-slate-900">
                    No modules available
                  </h3>
                  <p className="text-slate-500 mt-2">
                    Contact your administrator to request module access.
                  </p>
                </div>
              )}
            </section>

            {/* Recent Activity */}
            {recentActivity.length > 0 && (
              <section>
                <RecentActivity activities={recentActivity} />
              </section>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-3">
                Need Help?
              </h3>
              <p className="text-slate-600 text-sm mb-4">
                Explore guides or reach out to the THRIVE team for assistance.
              </p>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start border-slate-200 text-slate-700 hover:bg-slate-100"
                  onClick={() => window.open("https://docs.thriveiep.com", "_blank")}
                >
                  View Documentation
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-blue-600 hover:text-blue-700"
                  onClick={() =>
                    (window.location.href =
                      "mailto:support@thriveiep.com?subject=THRIVE Support Request")
                  }
                >
                  Contact Support
                </Button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <h3 className="text-sm font-semibold text-slate-900 mb-2">
                Platform Status
              </h3>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-center justify-between">
                  <span>Assessments API</span>
                  <span className="flex items-center gap-2 text-emerald-600">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Operational
                  </span>
                </li>
                <li className="flex items-center justify-between">
                  <span>Queue Processing</span>
                  <span className="flex items-center gap-2 text-amber-600">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    Healthy
                  </span>
                </li>
                <li className="flex items-center justify-between">
                  <span>Database</span>
                  <span className="flex items-center gap-2 text-emerald-600">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Online
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModuleDashboard;
