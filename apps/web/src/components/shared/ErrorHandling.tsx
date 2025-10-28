import React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  RefreshCw,
  Wifi,
  WifiOff,
  Lock,
  Clock,
  Shield,
  ExternalLink,
  HelpCircle,
  ArrowRight,
  CreditCard,
  Mail,
  Phone,
} from "lucide-react";

// Authentication Error Types
export interface AuthenticationError {
  type:
    | "invalid_credentials"
    | "account_locked"
    | "session_expired"
    | "rate_limited"
    | "server_error";
  message: string;
  details?: string;
  retryAfter?: number;
  attemptsRemaining?: number;
}

// Authorization Error Types
export interface AuthorizationError {
  type:
    | "insufficient_permissions"
    | "module_access_denied"
    | "demo_limitation"
    | "subscription_required";
  message: string;
  requiredRole?: string;
  currentRole?: string;
  upgradeOptions?: UpgradeOption[];
}

// Network Error Types
export interface NetworkError {
  type: "offline" | "timeout" | "server_unavailable" | "connection_lost";
  message: string;
  isOnline: boolean;
  lastSuccessfulConnection?: Date;
}

export interface UpgradeOption {
  title: string;
  description: string;
  action: () => void;
  variant?: "default" | "outline" | "secondary";
  icon?: React.ComponentType<{ className?: string }>;
}

// Authentication Error Handler Component
interface AuthenticationErrorProps {
  error: AuthenticationError;
  onRetry?: () => void;
  onForgotPassword?: () => void;
  onContactSupport?: () => void;
  onDismiss?: () => void;
}

export const AuthenticationErrorHandler: React.FC<AuthenticationErrorProps> = ({
  error,
  onRetry,
  onForgotPassword,
  onContactSupport,
  onDismiss,
}) => {
  const getErrorContent = () => {
    switch (error.type) {
      case "invalid_credentials":
        return {
          title: "Invalid Login Credentials",
          description: "The username or password you entered is incorrect.",
          guidance:
            "Please check your credentials and try again. If you've forgotten your password, use the reset option below.",
          icon: Lock,
          actions: [
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
            ...(onForgotPassword
              ? [
                  {
                    label: "Reset Password",
                    action: onForgotPassword,
                    variant: "outline" as const,
                  },
                ]
              : []),
          ],
        };

      case "account_locked":
        return {
          title: "Account Temporarily Locked",
          description:
            "Your account has been locked due to multiple failed login attempts.",
          guidance: `Please wait ${
            error.retryAfter ? Math.ceil(error.retryAfter / 60) : 15
          } minutes before trying again, or contact support for immediate assistance.`,
          icon: Shield,
          actions: [
            ...(onContactSupport
              ? [
                  {
                    label: "Contact Support",
                    action: onContactSupport,
                    variant: "default" as const,
                    icon: HelpCircle,
                  },
                ]
              : []),
          ],
        };

      case "session_expired":
        return {
          title: "Session Expired",
          description: "Your login session has expired for security reasons.",
          guidance: "Please sign in again to continue using the platform.",
          icon: Clock,
          actions: [
            ...(onRetry
              ? [
                  {
                    label: "Sign In Again",
                    action: onRetry,
                    variant: "default" as const,
                    icon: RefreshCw,
                  },
                ]
              : []),
          ],
        };

      case "rate_limited":
        return {
          title: "Too Many Attempts",
          description: "You've made too many login attempts in a short period.",
          guidance: `Please wait ${
            error.retryAfter ? Math.ceil(error.retryAfter / 60) : 15
          } minutes before trying again.`,
          icon: AlertTriangle,
          actions: [],
        };

      case "server_error":
        return {
          title: "Authentication Service Unavailable",
          description:
            "We're experiencing technical difficulties with our login system.",
          guidance:
            "Please try again in a few minutes. If the problem persists, contact support.",
          icon: AlertTriangle,
          actions: [
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
            ...(onContactSupport
              ? [
                  {
                    label: "Contact Support",
                    action: onContactSupport,
                    variant: "outline" as const,
                    icon: HelpCircle,
                  },
                ]
              : []),
          ],
        };

      default:
        return {
          title: "Authentication Error",
          description: error.message,
          guidance:
            "Please try again or contact support if the problem persists.",
          icon: AlertTriangle,
          actions: [
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
          ],
        };
    }
  };

  const content = getErrorContent();
  const ErrorIcon = content.icon;

  return (
    <Alert variant="destructive" className="mb-4">
      <ErrorIcon className="h-4 w-4" />
      <AlertTitle className="flex items-center gap-2">
        {content.title}
        {error.attemptsRemaining && error.attemptsRemaining > 0 && (
          <Badge variant="outline" className="text-xs">
            {error.attemptsRemaining} attempts remaining
          </Badge>
        )}
      </AlertTitle>
      <AlertDescription className="mt-2 space-y-3">
        <p>{content.description}</p>
        <p className="text-sm text-muted-foreground">{content.guidance}</p>

        {content.actions.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {content.actions.map((action, index) => (
              <Button
                key={index}
                variant={action.variant}
                size="sm"
                onClick={action.action}
                className="flex items-center gap-2"
              >
                {action.icon && <action.icon className="h-4 w-4" />}
                {action.label}
              </Button>
            ))}
            {onDismiss && (
              <Button variant="ghost" size="sm" onClick={onDismiss}>
                Dismiss
              </Button>
            )}
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
};

// Authorization Error Handler Component
interface AuthorizationErrorProps {
  error: AuthorizationError;
  onDismiss?: () => void;
  onContactAdmin?: () => void;
}

export const AuthorizationErrorHandler: React.FC<AuthorizationErrorProps> = ({
  error,
  onDismiss,
  onContactAdmin,
}) => {
  const getErrorContent = () => {
    switch (error.type) {
      case "insufficient_permissions":
        return {
          title: "Access Denied",
          description: `You don't have permission to access this feature.`,
          guidance: `Your current role (${error.currentRole}) doesn't include access to this functionality. Contact your administrator to request additional permissions.`,
          icon: Lock,
          showUpgrade: false,
        };

      case "module_access_denied":
        return {
          title: "Module Access Required",
          description: "You don't have access to this module.",
          guidance:
            "This module is not included in your current subscription. Contact your administrator or upgrade your plan to access this feature.",
          icon: Shield,
          showUpgrade: true,
        };

      case "demo_limitation":
        return {
          title: "Demo Account Limitation",
          description: "This feature is not available in demo mode.",
          guidance:
            "You're currently using a demo account with limited functionality. Upgrade to a full account to access all features.",
          icon: AlertTriangle,
          showUpgrade: true,
        };

      case "subscription_required":
        return {
          title: "Subscription Required",
          description: "This feature requires an active subscription.",
          guidance:
            "Your current plan doesn't include access to this premium feature. Upgrade your subscription to continue.",
          icon: CreditCard,
          showUpgrade: true,
        };

      default:
        return {
          title: "Authorization Error",
          description: error.message,
          guidance: "Please contact your administrator for assistance.",
          icon: Lock,
          showUpgrade: false,
        };
    }
  };

  const content = getErrorContent();
  const ErrorIcon = content.icon;

  return (
    <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950 dark:border-amber-800">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
          <ErrorIcon className="h-5 w-5" />
          {content.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-amber-700 dark:text-amber-300">
          <p className="font-medium">{content.description}</p>
          <p className="mt-2 text-sm">{content.guidance}</p>
        </div>

        {error.requiredRole && error.currentRole && (
          <div className="flex items-center gap-2 text-sm">
            <Badge variant="outline">{error.currentRole}</Badge>
            <ArrowRight className="h-4 w-4" />
            <Badge variant="default">{error.requiredRole}</Badge>
          </div>
        )}

        {content.showUpgrade &&
          error.upgradeOptions &&
          error.upgradeOptions.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                Upgrade Options:
              </p>
              <div className="flex flex-wrap gap-2">
                {error.upgradeOptions.map((option, index) => (
                  <Button
                    key={index}
                    variant={option.variant || "default"}
                    size="sm"
                    onClick={option.action}
                    className="flex items-center gap-2"
                  >
                    {option.icon && <option.icon className="h-4 w-4" />}
                    {option.title}
                  </Button>
                ))}
              </div>
            </div>
          )}

        <div className="flex flex-wrap gap-2 pt-2 border-t border-amber-200 dark:border-amber-800">
          {onContactAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={onContactAdmin}
              className="flex items-center gap-2"
            >
              <Mail className="h-4 w-4" />
              Contact Administrator
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.open("/help/permissions", "_blank")}
            className="text-amber-600 hover:text-amber-700 dark:text-amber-400"
          >
            <HelpCircle className="h-4 w-4 mr-1" />
            Learn More
          </Button>
          {onDismiss && (
            <Button variant="ghost" size="sm" onClick={onDismiss}>
              Dismiss
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Network Error Handler Component
interface NetworkErrorProps {
  error: NetworkError;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export const NetworkErrorHandler: React.FC<NetworkErrorProps> = ({
  error,
  onRetry,
  onDismiss,
}) => {
  const getErrorContent = () => {
    switch (error.type) {
      case "offline":
        return {
          title: "You're Offline",
          description: "No internet connection detected.",
          guidance:
            "Please check your internet connection and try again. Some features may be limited while offline.",
          icon: WifiOff,
          color: "red",
        };

      case "timeout":
        return {
          title: "Request Timeout",
          description: "The request took too long to complete.",
          guidance:
            "This usually happens with slow connections or large files. Please try again.",
          icon: Clock,
          color: "amber",
        };

      case "server_unavailable":
        return {
          title: "Server Unavailable",
          description: "Unable to connect to our servers.",
          guidance:
            "Our servers may be temporarily unavailable. Please try again in a few minutes.",
          icon: AlertTriangle,
          color: "red",
        };

      case "connection_lost":
        return {
          title: "Connection Lost",
          description: "Your connection to the server was interrupted.",
          guidance: "Please check your internet connection and try again.",
          icon: Wifi,
          color: "amber",
        };

      default:
        return {
          title: "Network Error",
          description: error.message,
          guidance: "Please check your connection and try again.",
          icon: WifiOff,
          color: "red",
        };
    }
  };

  const content = getErrorContent();
  const ErrorIcon = content.icon;

  return (
    <Alert
      variant={content.color === "red" ? "destructive" : "default"}
      className="mb-4"
    >
      <ErrorIcon className="h-4 w-4" />
      <AlertTitle className="flex items-center gap-2">
        {content.title}
        <div className="flex items-center gap-1">
          <div
            className={`w-2 h-2 rounded-full ${
              error.isOnline ? "bg-green-500" : "bg-red-500"
            }`}
          />
          <span className="text-xs text-muted-foreground">
            {error.isOnline ? "Online" : "Offline"}
          </span>
        </div>
      </AlertTitle>
      <AlertDescription className="mt-2 space-y-3">
        <p>{content.description}</p>
        <p className="text-sm text-muted-foreground">{content.guidance}</p>

        {error.lastSuccessfulConnection && (
          <p className="text-xs text-muted-foreground">
            Last successful connection:{" "}
            {error.lastSuccessfulConnection.toLocaleString()}
          </p>
        )}

        <div className="flex flex-wrap gap-2 pt-2">
          {onRetry && (
            <Button
              variant="default"
              size="sm"
              onClick={onRetry}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open("https://www.google.com", "_blank")}
            className="flex items-center gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            Test Connection
          </Button>
          {onDismiss && (
            <Button variant="ghost" size="sm" onClick={onDismiss}>
              Dismiss
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
};

// Offline Indicator Component
interface OfflineIndicatorProps {
  isOnline: boolean;
  className?: string;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  isOnline,
  className = "",
}) => {
  if (isOnline) return null;

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 bg-red-600 text-white text-center py-2 text-sm ${className}`}
    >
      <div className="flex items-center justify-center gap-2">
        <WifiOff className="h-4 w-4" />
        You're currently offline. Some features may be limited.
      </div>
    </div>
  );
};

// Hook for online/offline detection
export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);
  const [lastOnline, setLastOnline] = React.useState<Date | null>(
    navigator.onLine ? new Date() : null
  );

  React.useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setLastOnline(new Date());
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return { isOnline, lastOnline };
};

// Contact Support Helper
export const ContactSupportActions = {
  email: () =>
    window.open(
      "mailto:support@thrive-assessment.com?subject=Login%20Support%20Request",
      "_blank"
    ),
  phone: () => window.open("tel:+1-800-THRIVE-1", "_blank"),
  help: () => window.open("/help", "_blank"),
};

// Default upgrade options for demo users
export const DefaultUpgradeOptions: UpgradeOption[] = [
  {
    title: "Contact Sales",
    description: "Speak with our team about upgrading",
    action: () =>
      window.open(
        "mailto:sales@thrive-assessment.com?subject=Upgrade%20Request",
        "_blank"
      ),
    variant: "default",
    icon: Mail,
  },
  {
    title: "View Plans",
    description: "See available subscription options",
    action: () => window.open("/pricing", "_blank"),
    variant: "outline",
    icon: ExternalLink,
  },
  {
    title: "Call Us",
    description: "Speak with our sales team",
    action: () => window.open("tel:+1-800-THRIVE-1", "_blank"),
    variant: "outline",
    icon: Phone,
  },
];
