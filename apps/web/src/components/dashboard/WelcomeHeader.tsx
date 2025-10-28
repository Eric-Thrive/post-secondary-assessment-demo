import React from "react";
import { WelcomeHeaderProps } from "./types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserRole } from "@/types/unified-auth";
import { Settings, Crown, Shield, Users, Code } from "lucide-react";
import { THRIVE_COLORS } from "@/config/modules";

/**
 * WelcomeHeader - Personalized header component for the dashboard
 *
 * Features:
 * - User role-based messaging and styling
 * - Demo status indicators
 * - Settings access
 * - Professional THRIVE branding
 */
export const WelcomeHeader: React.FC<WelcomeHeaderProps> = ({
  user,
  onSettingsClick,
}) => {
  // Get role-specific styling and messaging
  const getRoleInfo = (role: UserRole) => {
    switch (role) {
      case UserRole.DEVELOPER:
        return {
          icon: Code,
          label: "Developer",
          color: THRIVE_COLORS.NAVY,
          greeting: "Welcome back, Developer",
          description:
            "You have full system access and development privileges.",
        };
      case UserRole.SYSTEM_ADMIN:
        return {
          icon: Crown,
          label: "System Admin",
          color: THRIVE_COLORS.ORANGE,
          greeting: "Welcome back, Administrator",
          description: "Manage users, organizations, and system settings.",
        };
      case UserRole.ORG_ADMIN:
        return {
          icon: Shield,
          label: "Organization Admin",
          color: THRIVE_COLORS.SKY_BLUE,
          greeting: "Welcome back",
          description: "Manage your organization's users and settings.",
        };
      case UserRole.CUSTOMER:
        return {
          icon: Users,
          label: "User",
          color: THRIVE_COLORS.NAVY,
          greeting: "Welcome back",
          description: "Access your assessment tools and reports.",
        };
      case UserRole.DEMO:
        return {
          icon: Users,
          label: "Demo User",
          color: THRIVE_COLORS.YELLOW,
          greeting: "Welcome to THRIVE",
          description: "Explore our platform features in demo mode.",
        };
      default:
        return {
          icon: Users,
          label: "User",
          color: THRIVE_COLORS.NAVY,
          greeting: "Welcome back",
          description: "Access your assessment tools and reports.",
        };
    }
  };

  const roleInfo = getRoleInfo(user.role);
  const RoleIcon = roleInfo.icon;
  const isDemoUser = user.role === UserRole.DEMO;

  // Format last login date
  const formatLastLogin = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) {
      return "Just now";
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border mb-8">
      <div className="p-6">
        <div className="flex items-center justify-between">
          {/* Left side - Welcome content */}
          <div className="flex items-center space-x-4">
            {/* User Avatar/Icon */}
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ backgroundColor: `${roleInfo.color}15` }}
            >
              <RoleIcon className="w-6 h-6" style={{ color: roleInfo.color }} />
            </div>

            {/* Welcome Text */}
            <div>
              <div className="flex items-center space-x-3 mb-1">
                <h1 className="text-2xl font-bold text-gray-900">
                  {roleInfo.greeting}, {user.name}
                </h1>

                {/* Role Badge */}
                <Badge
                  variant="outline"
                  className="text-xs"
                  style={{
                    borderColor: roleInfo.color,
                    color: roleInfo.color,
                  }}
                >
                  <RoleIcon className="w-3 h-3 mr-1" />
                  {roleInfo.label}
                </Badge>

                {/* Demo Badge */}
                {isDemoUser && user.demoExpiry && (
                  <Badge variant="secondary" className="text-xs">
                    Demo expires{" "}
                    {new Date(user.demoExpiry).toLocaleDateString()}
                  </Badge>
                )}
              </div>

              <p className="text-gray-600 text-sm">{roleInfo.description}</p>

              {/* Last login info */}
              <p className="text-gray-400 text-xs mt-1">
                Last login: {formatLastLogin(user.lastLogin)}
              </p>
            </div>
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center space-x-3">
            {/* Demo upgrade prompt */}
            {isDemoUser && (
              <Button
                variant="outline"
                size="sm"
                className="border-orange-200 text-orange-700 hover:bg-orange-50"
              >
                Upgrade Account
              </Button>
            )}

            {/* Settings button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onSettingsClick}
              className="text-gray-600 hover:text-gray-900"
            >
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>

        {/* Organization info for org admins */}
        {user.organizationId && user.role === UserRole.ORG_ADMIN && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center text-sm text-gray-600">
              <Shield className="w-4 h-4 mr-2" />
              Managing organization:{" "}
              <span className="font-medium ml-1">{user.organizationId}</span>
            </div>
          </div>
        )}

        {/* Demo warning for demo users */}
        {isDemoUser && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <div className="w-5 h-5 rounded-full bg-yellow-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs font-bold">!</span>
              </div>
              <div>
                <p className="text-sm text-yellow-800 font-medium">
                  Demo Mode Active
                </p>
                <p className="text-xs text-yellow-700 mt-1">
                  You're exploring THRIVE in demo mode. Some features may be
                  limited. Contact us to upgrade to a full account.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WelcomeHeader;
