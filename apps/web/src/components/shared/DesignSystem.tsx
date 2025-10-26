import React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";

// Module-specific color schemes
export const moduleColors = {
  k12: {
    primary: "#3B82F6", // Blue
    secondary: "#93C5FD",
    accent: "#1E40AF",
    background: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-900",
    hover: "hover:bg-blue-100",
  },
  "post-secondary": {
    primary: "#8B5CF6", // Purple
    secondary: "#C4B5FD",
    accent: "#6D28D9",
    background: "bg-purple-50",
    border: "border-purple-200",
    text: "text-purple-900",
    hover: "hover:bg-purple-100",
  },
  tutoring: {
    primary: "#10B981", // Green
    secondary: "#A7F3D0",
    accent: "#047857",
    background: "bg-green-50",
    border: "border-green-200",
    text: "text-green-900",
    hover: "hover:bg-green-100",
  },
} as const;

export type ModuleType = keyof typeof moduleColors;

// Consistent spacing system
export const spacing = {
  xs: "p-2",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
  xl: "p-12",
} as const;

// Consistent typography
export const typography = {
  h1: "text-3xl font-bold",
  h2: "text-2xl font-semibold",
  h3: "text-xl font-medium",
  h4: "text-lg font-medium",
  body: "text-base",
  small: "text-sm",
  xs: "text-xs",
} as const;

// Module-specific card component
interface ModuleCardProps {
  moduleType: ModuleType;
  title?: string;
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "outlined" | "filled";
}

export const ModuleCard: React.FC<ModuleCardProps> = ({
  moduleType,
  title,
  children,
  className,
  variant = "default",
}) => {
  const colors = moduleColors[moduleType];

  const variantClasses = {
    default: "bg-white border-gray-200",
    outlined: `bg-white ${colors.border}`,
    filled: `${colors.background} ${colors.border}`,
  };

  return (
    <Card className={cn(variantClasses[variant], className)}>
      {title && (
        <CardHeader>
          <CardTitle className={colors.text}>{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent>{children}</CardContent>
    </Card>
  );
};

// Module-specific button component
interface ModuleButtonProps {
  moduleType: ModuleType;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "outline";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  className?: string;
}

export const ModuleButton: React.FC<ModuleButtonProps> = ({
  moduleType,
  children,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  onClick,
  className,
}) => {
  const colors = moduleColors[moduleType];

  const variantClasses = {
    primary: `bg-[${colors.primary}] hover:bg-[${colors.accent}] text-white`,
    secondary: `bg-[${colors.secondary}] hover:bg-[${colors.primary}] text-[${colors.accent}]`,
    outline: `border-[${colors.primary}] text-[${colors.primary}] hover:bg-[${colors.primary}] hover:text-white`,
  };

  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
  };

  return (
    <Button
      variant={variant === "outline" ? "outline" : "default"}
      size={size}
      disabled={disabled || loading}
      onClick={onClick}
      className={cn(
        variantClasses[variant],
        sizeClasses[size],
        loading && "cursor-not-allowed",
        className
      )}
    >
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children}
    </Button>
  );
};

// Module-specific badge component
interface ModuleBadgeProps {
  moduleType: ModuleType;
  children: React.ReactNode;
  variant?: "default" | "secondary" | "outline";
  className?: string;
}

export const ModuleBadge: React.FC<ModuleBadgeProps> = ({
  moduleType,
  children,
  variant = "default",
  className,
}) => {
  const colors = moduleColors[moduleType];

  const variantClasses = {
    default: `bg-[${colors.primary}] text-white`,
    secondary: `bg-[${colors.secondary}] text-[${colors.accent}]`,
    outline: `border-[${colors.primary}] text-[${colors.primary}]`,
  };

  return (
    <Badge
      variant={variant === "outline" ? "outline" : "default"}
      className={cn(variantClasses[variant], className)}
    >
      {children}
    </Badge>
  );
};

// Progress indicator with module colors
interface ModuleProgressProps {
  moduleType: ModuleType;
  value: number;
  max?: number;
  label?: string;
  showPercentage?: boolean;
  className?: string;
}

export const ModuleProgress: React.FC<ModuleProgressProps> = ({
  moduleType,
  value,
  max = 100,
  label,
  showPercentage = true,
  className,
}) => {
  const colors = moduleColors[moduleType];
  const percentage = Math.round((value / max) * 100);

  return (
    <div className={cn("space-y-2", className)}>
      {(label || showPercentage) && (
        <div className="flex justify-between items-center">
          {label && <span className="text-sm font-medium">{label}</span>}
          {showPercentage && (
            <span className={cn("text-sm", colors.text)}>{percentage}%</span>
          )}
        </div>
      )}
      <Progress
        value={percentage}
        className={cn("h-2", `[&>div]:bg-[${colors.primary}]`)}
      />
    </div>
  );
};

// Responsive container component
interface ResponsiveContainerProps {
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  padding?: keyof typeof spacing;
  className?: string;
}

export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  maxWidth = "lg",
  padding = "md",
  className,
}) => {
  const maxWidthClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-4xl",
    xl: "max-w-6xl",
    "2xl": "max-w-7xl",
    full: "max-w-full",
  };

  return (
    <div
      className={cn(
        "mx-auto w-full",
        maxWidthClasses[maxWidth],
        spacing[padding],
        className
      )}
    >
      {children}
    </div>
  );
};

// Module header component
interface ModuleHeaderProps {
  moduleType: ModuleType;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
}

export const ModuleHeader: React.FC<ModuleHeaderProps> = ({
  moduleType,
  title,
  subtitle,
  actions,
  className,
}) => {
  const colors = moduleColors[moduleType];

  return (
    <div
      className={cn(
        "flex items-center justify-between py-6 border-b",
        colors.border,
        className
      )}
    >
      <div>
        <h1 className={cn(typography.h1, colors.text)}>{title}</h1>
        {subtitle && (
          <p className={cn(typography.body, "text-gray-600 mt-1")}>
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center space-x-3">{actions}</div>}
    </div>
  );
};

// Status indicator component
interface StatusIndicatorProps {
  status: "pending" | "processing" | "completed" | "error";
  moduleType: ModuleType;
  label?: string;
  showIcon?: boolean;
  className?: string;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  moduleType,
  label,
  showIcon = true,
  className,
}) => {
  const colors = moduleColors[moduleType];

  const statusConfig = {
    pending: {
      color: "text-gray-500",
      bg: "bg-gray-100",
      icon: "⏳",
    },
    processing: {
      color: colors.text,
      bg: colors.background,
      icon: "⚡",
    },
    completed: {
      color: "text-green-700",
      bg: "bg-green-100",
      icon: "✅",
    },
    error: {
      color: "text-red-700",
      bg: "bg-red-100",
      icon: "❌",
    },
  };

  const config = statusConfig[status];

  return (
    <div
      className={cn(
        "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
        config.color,
        config.bg,
        className
      )}
    >
      {showIcon && <span className="mr-1">{config.icon}</span>}
      {label || status.charAt(0).toUpperCase() + status.slice(1)}
    </div>
  );
};

// Form section component for consistent form layouts
interface FormSectionProps {
  moduleType: ModuleType;
  title: string;
  description?: string;
  children: React.ReactNode;
  required?: boolean;
  className?: string;
}

export const FormSection: React.FC<FormSectionProps> = ({
  moduleType,
  title,
  description,
  children,
  required = false,
  className,
}) => {
  const colors = moduleColors[moduleType];

  return (
    <div className={cn("space-y-4", className)}>
      <div className={cn("pb-2 border-b", colors.border)}>
        <h3 className={cn(typography.h3, colors.text)}>
          {title}
          {required && <span className="text-red-500 ml-1">*</span>}
        </h3>
        {description && (
          <p className={cn(typography.small, "text-gray-600 mt-1")}>
            {description}
          </p>
        )}
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
};
