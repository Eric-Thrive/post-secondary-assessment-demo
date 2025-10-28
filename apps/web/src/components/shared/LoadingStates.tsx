import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Shield,
  BookOpen,
  GraduationCap,
  Users,
  FileText,
  Clock,
  CheckCircle,
  ArrowRight,
  RefreshCw,
} from "lucide-react";

// Authentication Loading States
interface AuthLoadingProps {
  stage:
    | "authenticating"
    | "loading_profile"
    | "checking_permissions"
    | "redirecting";
  message?: string;
}

export const AuthenticationLoading: React.FC<AuthLoadingProps> = ({
  stage,
  message,
}) => {
  const getStageInfo = () => {
    switch (stage) {
      case "authenticating":
        return {
          title: "Signing you in...",
          description: "Verifying your credentials",
          icon: Shield,
          progress: 25,
        };
      case "loading_profile":
        return {
          title: "Loading your profile...",
          description: "Retrieving your account information",
          icon: Users,
          progress: 50,
        };
      case "checking_permissions":
        return {
          title: "Checking permissions...",
          description: "Determining your module access",
          icon: CheckCircle,
          progress: 75,
        };
      case "redirecting":
        return {
          title: "Almost ready...",
          description: "Taking you to your dashboard",
          icon: ArrowRight,
          progress: 100,
        };
      default:
        return {
          title: "Loading...",
          description: "Please wait",
          icon: Loader2,
          progress: 0,
        };
    }
  };

  const stageInfo = getStageInfo();
  const StageIcon = stageInfo.icon;

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6">
      <div className="relative">
        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
          <StageIcon className="h-8 w-8 text-blue-600 dark:text-blue-400 animate-pulse" />
        </div>
        <div className="absolute -inset-2 border-2 border-blue-200 dark:border-blue-800 rounded-full animate-spin" />
      </div>

      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {stageInfo.title}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {message || stageInfo.description}
        </p>
      </div>

      <div className="w-64 space-y-2">
        <Progress value={stageInfo.progress} className="h-2" />
        <p className="text-xs text-center text-gray-500">
          {stageInfo.progress}% complete
        </p>
      </div>
    </div>
  );
};

// Module Dashboard Loading Skeleton
export const ModuleDashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Welcome Header Skeleton */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
      </div>

      {/* Module Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="relative overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Skeleton className="h-12 w-12 rounded-lg" />
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex space-x-4">
                  <div className="text-center">
                    <Skeleton className="h-6 w-8 mx-auto mb-1" />
                    <Skeleton className="h-3 w-12" />
                  </div>
                  <div className="text-center">
                    <Skeleton className="h-6 w-8 mx-auto mb-1" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
                <Skeleton className="h-9 w-20" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity Skeleton */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-16" />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center space-x-3 p-3 rounded-lg border"
            >
              <Skeleton className="h-8 w-8 rounded" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

// Module Loading States
interface ModuleLoadingProps {
  moduleName: string;
  stage: "initializing" | "loading_data" | "preparing_interface" | "ready";
  progress?: number;
}

export const ModuleLoading: React.FC<ModuleLoadingProps> = ({
  moduleName,
  stage,
  progress,
}) => {
  const getModuleIcon = (name: string) => {
    switch (name.toLowerCase()) {
      case "k-12":
      case "k12":
        return BookOpen;
      case "post-secondary":
      case "postsecondary":
        return GraduationCap;
      case "tutoring":
        return Users;
      default:
        return FileText;
    }
  };

  const getStageInfo = () => {
    switch (stage) {
      case "initializing":
        return {
          title: `Initializing ${moduleName}...`,
          description: "Setting up the module environment",
          progress: progress || 25,
        };
      case "loading_data":
        return {
          title: `Loading ${moduleName} data...`,
          description: "Retrieving your reports and settings",
          progress: progress || 50,
        };
      case "preparing_interface":
        return {
          title: `Preparing interface...`,
          description: "Getting everything ready for you",
          progress: progress || 75,
        };
      case "ready":
        return {
          title: `${moduleName} is ready!`,
          description: "Redirecting you now",
          progress: progress || 100,
        };
      default:
        return {
          title: `Loading ${moduleName}...`,
          description: "Please wait",
          progress: progress || 0,
        };
    }
  };

  const ModuleIcon = getModuleIcon(moduleName);
  const stageInfo = getStageInfo();

  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] space-y-6">
      <div className="relative">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 rounded-xl flex items-center justify-center">
          <ModuleIcon className="h-10 w-10 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl opacity-20 animate-pulse" />
      </div>

      <div className="text-center space-y-2">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          {stageInfo.title}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {stageInfo.description}
        </p>
      </div>

      <div className="w-80 space-y-2">
        <Progress value={stageInfo.progress} className="h-3" />
        <p className="text-xs text-center text-gray-500">
          {stageInfo.progress}% complete
        </p>
      </div>
    </div>
  );
};

// Empty States
interface EmptyStateProps {
  type:
    | "no_modules"
    | "no_reports"
    | "no_activity"
    | "no_permissions"
    | "demo_expired";
  title?: string;
  description?: string;
  actions?: Array<{
    label: string;
    action: () => void;
    variant?: "default" | "outline" | "secondary";
    icon?: React.ComponentType<{ className?: string }>;
  }>;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  type,
  title,
  description,
  actions = [],
}) => {
  const getEmptyStateContent = () => {
    switch (type) {
      case "no_modules":
        return {
          title: title || "No Modules Available",
          description:
            description ||
            "You don't have access to any modules yet. Contact your administrator to get started.",
          icon: Shield,
          defaultActions: [
            {
              label: "Contact Administrator",
              action: () =>
                window.open(
                  "mailto:admin@thrive-assessment.com?subject=Module%20Access%20Request",
                  "_blank"
                ),
              variant: "default" as const,
              icon: Users,
            },
            {
              label: "Learn More",
              action: () => window.open("/help/getting-started", "_blank"),
              variant: "outline" as const,
              icon: BookOpen,
            },
          ],
        };

      case "no_reports":
        return {
          title: title || "No Reports Yet",
          description:
            description ||
            "You haven't created any reports yet. Start by creating your first assessment report.",
          icon: FileText,
          defaultActions: [
            {
              label: "Create Report",
              action: () => (window.location.href = "/new-assessment"),
              variant: "default" as const,
              icon: FileText,
            },
            {
              label: "View Examples",
              action: () => window.open("/help/examples", "_blank"),
              variant: "outline" as const,
              icon: BookOpen,
            },
          ],
        };

      case "no_activity":
        return {
          title: title || "No Recent Activity",
          description:
            description ||
            "Your recent activity will appear here once you start using the platform.",
          icon: Clock,
          defaultActions: [
            {
              label: "Get Started",
              action: () => (window.location.href = "/dashboard"),
              variant: "default" as const,
              icon: ArrowRight,
            },
          ],
        };

      case "no_permissions":
        return {
          title: title || "Access Restricted",
          description:
            description ||
            "You don't have permission to view this content. Contact your administrator for access.",
          icon: Shield,
          defaultActions: [
            {
              label: "Request Access",
              action: () =>
                window.open(
                  "mailto:admin@thrive-assessment.com?subject=Access%20Request",
                  "_blank"
                ),
              variant: "default" as const,
              icon: Users,
            },
          ],
        };

      case "demo_expired":
        return {
          title: title || "Demo Period Expired",
          description:
            description ||
            "Your demo access has expired. Upgrade to a full account to continue using the platform.",
          icon: Clock,
          defaultActions: [
            {
              label: "Upgrade Now",
              action: () => window.open("/upgrade", "_blank"),
              variant: "default" as const,
              icon: ArrowRight,
            },
            {
              label: "Contact Sales",
              action: () =>
                window.open(
                  "mailto:sales@thrive-assessment.com?subject=Upgrade%20Request",
                  "_blank"
                ),
              variant: "outline" as const,
              icon: Users,
            },
          ],
        };

      default:
        return {
          title: title || "Nothing Here",
          description: description || "There's nothing to show right now.",
          icon: FileText,
          defaultActions: [],
        };
    }
  };

  const content = getEmptyStateContent();
  const EmptyIcon = content.icon;
  const allActions = actions.length > 0 ? actions : content.defaultActions;

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-6 p-8">
      <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
        <EmptyIcon className="h-12 w-12 text-gray-400 dark:text-gray-600" />
      </div>

      <div className="space-y-2 max-w-md">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          {content.title}
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          {content.description}
        </p>
      </div>

      {allActions.length > 0 && (
        <div className="flex flex-wrap gap-3 justify-center">
          {allActions.map((action, index) => (
            <Button
              key={index}
              variant={action.variant || "default"}
              onClick={action.action}
              className="flex items-center gap-2"
            >
              {action.icon && <action.icon className="h-4 w-4" />}
              {action.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
};

// Progress Indicator for Multi-step Processes
interface ProgressIndicatorProps {
  steps: Array<{
    label: string;
    status: "pending" | "current" | "completed" | "error";
  }>;
  className?: string;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  steps,
  className = "",
}) => {
  return (
    <div className={`space-y-4 ${className}`}>
      {steps.map((step, index) => (
        <div key={index} className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            {step.status === "completed" && (
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
            )}
            {step.status === "current" && (
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <Loader2 className="h-5 w-5 text-white animate-spin" />
              </div>
            )}
            {step.status === "pending" && (
              <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                <div className="w-3 h-3 bg-gray-500 dark:bg-gray-400 rounded-full" />
              </div>
            )}
            {step.status === "error" && (
              <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                <RefreshCw className="h-5 w-5 text-white" />
              </div>
            )}
          </div>
          <div className="flex-1">
            <p
              className={`text-sm font-medium ${
                step.status === "current"
                  ? "text-blue-600 dark:text-blue-400"
                  : step.status === "completed"
                  ? "text-green-600 dark:text-green-400"
                  : step.status === "error"
                  ? "text-red-600 dark:text-red-400"
                  : "text-gray-500 dark:text-gray-400"
              }`}
            >
              {step.label}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

// Loading Overlay for existing content
interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
  children: React.ReactNode;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isLoading,
  message = "Loading...",
  children,
}) => {
  return (
    <div className="relative">
      {children}
      {isLoading && (
        <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="flex flex-col items-center space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {message}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
