import React from "react";
import { ModuleCardProps } from "./types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getModuleColor } from "@/config/modules";
import { cn } from "@/lib/utils";
import {
  GraduationCap,
  School,
  Users,
  Lock,
  ArrowRight,
  FileText,
  Clock,
} from "lucide-react";

/**
 * ModuleCard - Reusable card component for displaying module information
 *
 * Features:
 * - THRIVE visual identity with module-specific colors
 * - Module-specific branding and icons
 * - Access status indicators
 * - Stats display (report counts, etc.)
 * - Hover states and animations
 * - Accessibility features
 */
export const ModuleCard: React.FC<ModuleCardProps> = ({
  module,
  accessLevel,
  stats,
  onClick,
  disabled = false,
}) => {
  // Get module-specific icon
  const getModuleIcon = (iconName: string) => {
    switch (iconName) {
      case "School":
        return School;
      case "GraduationCap":
        return GraduationCap;
      case "Users":
        return Users;
      default:
        return FileText;
    }
  };

  const IconComponent = getModuleIcon(module.icon);
  const moduleColor = getModuleColor(module.name as any);

  // Determine card state styling
  const isRestricted = accessLevel === "restricted";
  const isUnavailable = accessLevel === "unavailable";
  const isDisabled = disabled || isUnavailable;

  // Handle click with accessibility
  const handleClick = () => {
    if (!isDisabled) {
      onClick();
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if ((event.key === "Enter" || event.key === " ") && !isDisabled) {
      event.preventDefault();
      onClick();
    }
  };

  return (
    <Card
      className={cn(
        "relative overflow-hidden transition-all duration-200 cursor-pointer group",
        "hover:shadow-lg hover:-translate-y-1",
        "focus-within:ring-2 focus-within:ring-offset-2",
        isDisabled &&
          "opacity-60 cursor-not-allowed hover:shadow-sm hover:translate-y-0",
        !isDisabled && "hover:shadow-lg"
      )}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={isDisabled ? -1 : 0}
      role="button"
      aria-label={`Access ${module.displayName} module`}
      aria-disabled={isDisabled}
    >
      {/* Color accent bar */}
      <div
        className="absolute top-0 left-0 right-0 h-1"
        style={{ backgroundColor: moduleColor }}
      />

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            {/* Module Icon */}
            <div
              className={cn(
                "p-2 rounded-lg transition-colors",
                !isDisabled &&
                  "group-hover:scale-110 transition-transform duration-200"
              )}
              style={{
                backgroundColor: `${moduleColor}15`,
                color: moduleColor,
              }}
            >
              <IconComponent className="w-6 h-6" />
            </div>

            <div>
              <CardTitle className="text-lg font-semibold text-gray-900">
                {module.displayName}
              </CardTitle>

              {/* Access Level Badge */}
              <div className="flex items-center space-x-2 mt-1">
                {isRestricted && (
                  <Badge variant="outline" className="text-xs">
                    <Lock className="w-3 h-3 mr-1" />
                    Limited Access
                  </Badge>
                )}
                {isUnavailable && (
                  <Badge variant="destructive" className="text-xs">
                    <Lock className="w-3 h-3 mr-1" />
                    Unavailable
                  </Badge>
                )}
                {accessLevel === "full" && (
                  <Badge
                    className="text-xs"
                    style={{
                      backgroundColor: `${moduleColor}20`,
                      color: moduleColor,
                      borderColor: moduleColor,
                    }}
                  >
                    Full Access
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Arrow Icon */}
          {!isDisabled && (
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all duration-200" />
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Module Description */}
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {module.description}
        </p>

        {/* Module Features */}
        <div className="mb-4">
          <div className="flex flex-wrap gap-1">
            {module.features.slice(0, 2).map((feature, index) => (
              <span
                key={index}
                className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
              >
                {feature}
              </span>
            ))}
            {module.features.length > 2 && (
              <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                +{module.features.length - 2} more
              </span>
            )}
          </div>
        </div>

        {/* Stats Display */}
        {stats && (
          <div className="flex items-center justify-between text-sm text-gray-500 pt-3 border-t border-gray-100">
            <div className="flex items-center space-x-1">
              <FileText className="w-4 h-4" />
              <span>{stats.totalReports} reports</span>
            </div>
            {stats.draftReports > 0 && (
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>{stats.draftReports} drafts</span>
              </div>
            )}
          </div>
        )}

        {/* Restricted Access Message */}
        {isRestricted && (
          <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
            Some features may be limited. Contact your administrator for full
            access.
          </div>
        )}

        {/* Unavailable Message */}
        {isUnavailable && (
          <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-800">
            This module is not available for your account. Contact support for
            access.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ModuleCard;
