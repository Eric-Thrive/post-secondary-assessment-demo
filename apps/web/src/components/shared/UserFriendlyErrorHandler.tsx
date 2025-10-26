import React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertTriangle,
  RefreshCw,
  HelpCircle,
  ExternalLink,
  Wifi,
  Lock,
  Clock,
  HardDrive,
} from "lucide-react";

export interface ErrorInfo {
  title: string;
  description: string;
  actionableGuidance: string;
  actions?: ErrorAction[];
  type:
    | "network"
    | "permission"
    | "timeout"
    | "storage"
    | "validation"
    | "server"
    | "unknown";
}

export interface ErrorAction {
  label: string;
  action: () => void;
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  icon?: React.ComponentType<{ className?: string }>;
}

interface UserFriendlyErrorHandlerProps {
  error: Error | string | null;
  context?: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  customActions?: ErrorAction[];
  showDetails?: boolean;
}

export const UserFriendlyErrorHandler: React.FC<
  UserFriendlyErrorHandlerProps
> = ({
  error,
  context = "operation",
  onRetry,
  onDismiss,
  customActions = [],
  showDetails = false,
}) => {
  if (!error) return null;

  const errorMessage = typeof error === "string" ? error : error.message;
  const errorInfo = analyzeError(errorMessage, context);

  const defaultActions: ErrorAction[] = [
    ...(onRetry
      ? [
          {
            label: "Try Again",
            action: onRetry,
            variant: "default" as const,
            icon: RefreshCw,
          },
        ]
      : []),
    ...(onDismiss
      ? [
          {
            label: "Dismiss",
            action: onDismiss,
            variant: "outline" as const,
          },
        ]
      : []),
  ];

  const allActions = [...customActions, ...defaultActions];

  const getErrorIcon = (type: ErrorInfo["type"]) => {
    switch (type) {
      case "network":
        return Wifi;
      case "permission":
        return Lock;
      case "timeout":
        return Clock;
      case "storage":
        return HardDrive;
      default:
        return AlertTriangle;
    }
  };

  const ErrorIcon = getErrorIcon(errorInfo.type);

  return (
    <Card className="border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-red-800 dark:text-red-200">
          <ErrorIcon className="h-5 w-5" />
          {errorInfo.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-red-700 dark:text-red-300">
          <p className="font-medium">{errorInfo.description}</p>
          <p className="mt-2 text-sm">{errorInfo.actionableGuidance}</p>
        </div>

        {showDetails && (
          <Alert>
            <HelpCircle className="h-4 w-4" />
            <AlertTitle>Technical Details</AlertTitle>
            <AlertDescription className="font-mono text-xs">
              {errorMessage}
            </AlertDescription>
          </Alert>
        )}

        {allActions.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {allActions.map((action, index) => (
              <Button
                key={index}
                variant={action.variant || "default"}
                size="sm"
                onClick={action.action}
                className="flex items-center gap-2"
              >
                {action.icon && <action.icon className="h-4 w-4" />}
                {action.label}
              </Button>
            ))}
          </div>
        )}

        {/* Common help actions */}
        <div className="flex items-center gap-4 pt-2 border-t border-red-200 dark:border-red-800">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.location.reload()}
            className="text-red-600 hover:text-red-700 dark:text-red-400"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh Page
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.open("/help", "_blank")}
            className="text-red-600 hover:text-red-700 dark:text-red-400"
          >
            <ExternalLink className="h-4 w-4 mr-1" />
            Get Help
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export const analyzeError = (
  errorMessage: string,
  context: string
): ErrorInfo => {
  const message = errorMessage.toLowerCase();

  if (
    message.includes("network") ||
    message.includes("fetch") ||
    message.includes("connection")
  ) {
    return {
      title: "Connection Problem",
      description: `Unable to connect to the server during ${context}.`,
      actionableGuidance:
        "Please check your internet connection and try again. If the problem persists, the server may be temporarily unavailable.",
      type: "network",
      actions: [
        {
          label: "Check Connection",
          action: () => window.open("https://www.google.com", "_blank"),
          variant: "outline",
          icon: ExternalLink,
        },
      ],
    };
  }

  if (
    message.includes("permission") ||
    message.includes("access") ||
    message.includes("unauthorized") ||
    message.includes("forbidden")
  ) {
    return {
      title: "Access Denied",
      description: `You don't have permission to perform this ${context}.`,
      actionableGuidance:
        "Please contact your administrator for access, or try logging out and back in to refresh your permissions.",
      type: "permission",
    };
  }

  if (message.includes("timeout") || message.includes("took too long")) {
    return {
      title: "Request Timeout",
      description: `The ${context} took too long to complete.`,
      actionableGuidance:
        "This usually happens with large files or slow connections. Try again with a smaller file or check your internet speed.",
      type: "timeout",
    };
  }

  if (
    message.includes("storage") ||
    message.includes("quota") ||
    message.includes("disk") ||
    message.includes("space")
  ) {
    return {
      title: "Storage Full",
      description: `Not enough storage space to complete the ${context}.`,
      actionableGuidance:
        "Please free up some disk space by deleting unnecessary files, or contact your administrator to increase your storage quota.",
      type: "storage",
    };
  }

  if (
    message.includes("validation") ||
    message.includes("invalid") ||
    message.includes("required")
  ) {
    return {
      title: "Invalid Input",
      description: `The information provided for ${context} is not valid.`,
      actionableGuidance:
        "Please check that all required fields are filled out correctly and try again.",
      type: "validation",
    };
  }

  if (
    message.includes("server") ||
    message.includes("internal") ||
    message.includes("500")
  ) {
    return {
      title: "Server Error",
      description: `A server error occurred during ${context}.`,
      actionableGuidance:
        "This is a temporary issue on our end. Please try again in a few minutes. If the problem continues, contact support.",
      type: "server",
    };
  }

  // Default case
  return {
    title: "Something Went Wrong",
    description: `An unexpected error occurred during ${context}.`,
    actionableGuidance:
      "Please try again. If the problem persists, try refreshing the page or contact support for assistance.",
    type: "unknown",
  };
};

// Hook for using the error handler
export const useUserFriendlyError = () => {
  const showError = (error: Error | string, context: string = "operation") => {
    return analyzeError(
      typeof error === "string" ? error : error.message,
      context
    );
  };

  return { showError, analyzeError };
};
