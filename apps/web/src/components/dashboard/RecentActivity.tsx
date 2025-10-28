import React from "react";
import { RecentActivityProps } from "./types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ModuleType } from "@/types/unified-auth";
import { getModuleColor } from "@/config/modules";
import {
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  School,
  GraduationCap,
  Users,
  ArrowRight,
} from "lucide-react";

/**
 * RecentActivity - Display recent user activities and quick access
 *
 * Features:
 * - Recent reports and assessments
 * - Module-specific activity indicators
 * - Quick resume functionality
 * - Status-based styling
 */
export const RecentActivity: React.FC<RecentActivityProps> = ({
  activities,
  onActivityClick,
}) => {
  // Get module icon
  const getModuleIcon = (moduleType: ModuleType) => {
    switch (moduleType) {
      case ModuleType.K12:
        return School;
      case ModuleType.POST_SECONDARY:
        return GraduationCap;
      case ModuleType.TUTORING:
        return Users;
      default:
        return FileText;
    }
  };

  // Get status icon and styling
  const getStatusInfo = (status: string) => {
    switch (status) {
      case "completed":
        return {
          icon: CheckCircle,
          color: "text-green-600",
          bgColor: "bg-green-50",
          borderColor: "border-green-200",
        };
      case "in_progress":
        return {
          icon: Clock,
          color: "text-yellow-600",
          bgColor: "bg-yellow-50",
          borderColor: "border-yellow-200",
        };
      case "draft":
        return {
          icon: AlertCircle,
          color: "text-blue-600",
          bgColor: "bg-blue-50",
          borderColor: "border-blue-200",
        };
      default:
        return {
          icon: FileText,
          color: "text-gray-600",
          bgColor: "bg-gray-50",
          borderColor: "border-gray-200",
        };
    }
  };

  // Format timestamp
  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) {
      return "Just now";
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours}h ago`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return `${days}d ago`;
    }
  };

  // Handle activity click
  const handleActivityClick = (activity: any) => {
    if (onActivityClick) {
      onActivityClick(activity);
    } else if (activity.route) {
      window.location.href = activity.route;
    }
  };

  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Clock className="w-8 h-8 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No recent activity</p>
            <p className="text-gray-400 text-xs mt-1">
              Your recent reports and assessments will appear here.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900">
            Recent Activity
          </CardTitle>
          <Button variant="ghost" size="sm" className="text-xs text-gray-500">
            View All
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-3">
          {activities.slice(0, 5).map((activity) => {
            const ModuleIcon = getModuleIcon(activity.moduleType);
            const statusInfo = getStatusInfo(activity.status);
            const StatusIcon = statusInfo.icon;
            const moduleColor = getModuleColor(activity.moduleType);

            return (
              <div
                key={activity.id}
                className="group cursor-pointer p-3 rounded-lg border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all duration-200"
                onClick={() => handleActivityClick(activity)}
              >
                <div className="flex items-start space-x-3">
                  {/* Module Icon */}
                  <div
                    className="p-2 rounded-lg flex-shrink-0"
                    style={{
                      backgroundColor: `${moduleColor}15`,
                      color: moduleColor,
                    }}
                  >
                    <ModuleIcon className="w-4 h-4" />
                  </div>

                  {/* Activity Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 text-sm line-clamp-1 group-hover:text-gray-700">
                          {activity.title}
                        </h4>

                        <div className="flex items-center space-x-2 mt-1">
                          {/* Status Badge */}
                          <Badge
                            variant="outline"
                            className={`text-xs ${statusInfo.color} ${statusInfo.bgColor} ${statusInfo.borderColor}`}
                          >
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {activity.status.replace("_", " ")}
                          </Badge>

                          {/* Timestamp */}
                          <span className="text-xs text-gray-500">
                            {formatTimestamp(activity.timestamp)}
                          </span>
                        </div>
                      </div>

                      {/* Arrow Icon */}
                      <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all duration-200 flex-shrink-0 ml-2" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        {activities.some((a) => a.status === "draft") && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <Button
              variant="outline"
              size="sm"
              className="w-full text-sm"
              onClick={() => {
                const draftActivity = activities.find(
                  (a) => a.status === "draft"
                );
                if (draftActivity) {
                  handleActivityClick(draftActivity);
                }
              }}
            >
              <Clock className="w-4 h-4 mr-2" />
              Resume Draft Work
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentActivity;
