import React from "react";
import { AdminQuickActionsProps } from "./types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserRole } from "@/types/unified-auth";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Settings,
  BarChart3,
  Shield,
  Database,
  FileText,
  ArrowRight,
} from "lucide-react";
import { THRIVE_COLORS } from "@/config/modules";

/**
 * AdminQuickActions - Quick access panel for administrative functions
 *
 * Features:
 * - Role-based feature visibility
 * - Quick access to admin dashboards
 * - System monitoring shortcuts
 * - User management links
 */
export const AdminQuickActions: React.FC<AdminQuickActionsProps> = ({
  user,
  features,
}) => {
  const navigate = useNavigate();

  // Get icon for admin feature
  const getFeatureIcon = (featureId: string) => {
    switch (featureId) {
      case "all-users":
        return Users;
      case "user-management":
        return Users;
      case "organization-management":
        return Shield;
      case "admin-dashboard":
        return BarChart3;
      case "system-settings":
        return Settings;
      case "performance-dashboard":
        return BarChart3;
      case "database-admin":
        return Database;
      case "prompt-management":
        return FileText;
      default:
        return Settings;
    }
  };

  // Filter features based on user role
  const accessibleFeatures = features.filter((feature) =>
    feature.requiredRole.includes(user.role)
  );

  // Handle feature click
  const handleFeatureClick = (route: string) => {
    navigate(route);
  };

  if (accessibleFeatures.length === 0) {
    return null;
  }

  return (
    <Card className="bg-gradient-to-r from-slate-50 to-slate-100 border-slate-200">
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-2">
          <div
            className="p-2 rounded-lg"
            style={{
              backgroundColor: `${THRIVE_COLORS.NAVY}15`,
              color: THRIVE_COLORS.NAVY,
            }}
          >
            <Shield className="w-5 h-5" />
          </div>
          <CardTitle className="text-lg font-semibold text-gray-900">
            Admin Quick Actions
          </CardTitle>
        </div>
        <p className="text-sm text-gray-600">
          Manage system settings, users, and monitor platform performance.
        </p>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {accessibleFeatures.map((feature) => {
            const IconComponent = getFeatureIcon(feature.id);

            return (
              <Button
                key={feature.id}
                variant="ghost"
                className="h-auto p-4 justify-start text-left hover:bg-white hover:shadow-sm transition-all duration-200 group"
                onClick={() => handleFeatureClick(feature.route)}
              >
                <div className="flex items-start space-x-3 w-full">
                  <div
                    className="p-2 rounded-lg flex-shrink-0 group-hover:scale-110 transition-transform duration-200"
                    style={{
                      backgroundColor: `${THRIVE_COLORS.NAVY}10`,
                      color: THRIVE_COLORS.NAVY,
                    }}
                  >
                    <IconComponent className="w-4 h-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900 text-sm">
                        {feature.title}
                      </h4>
                      <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all duration-200 flex-shrink-0" />
                    </div>
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </Button>
            );
          })}
        </div>

        {/* System Status Indicators (for developers/system admins) */}
        {[UserRole.DEVELOPER, UserRole.SYSTEM_ADMIN].includes(user.role) && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">System Status</span>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-gray-600 text-xs">API Online</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-gray-600 text-xs">
                    Database Connected
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                  <span className="text-gray-600 text-xs">Queue: 3 jobs</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminQuickActions;
