import React from "react";
import { cn } from "@/lib/utils";
import { ModuleType, moduleColors } from "./DesignSystem";

// Responsive breakpoints
export const breakpoints = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
} as const;

// Grid system
interface ResponsiveGridProps {
  children: React.ReactNode;
  cols?: {
    default?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  cols = { default: 1, md: 2, lg: 3 },
  gap = "md",
  className,
}) => {
  const gapClasses = {
    sm: "gap-2",
    md: "gap-4",
    lg: "gap-6",
    xl: "gap-8",
  };

  const getColClasses = () => {
    const classes = ["grid"];

    if (cols.default) classes.push(`grid-cols-${cols.default}`);
    if (cols.sm) classes.push(`sm:grid-cols-${cols.sm}`);
    if (cols.md) classes.push(`md:grid-cols-${cols.md}`);
    if (cols.lg) classes.push(`lg:grid-cols-${cols.lg}`);
    if (cols.xl) classes.push(`xl:grid-cols-${cols.xl}`);

    return classes.join(" ");
  };

  return (
    <div className={cn(getColClasses(), gapClasses[gap], className)}>
      {children}
    </div>
  );
};

// Responsive container with module-aware styling
interface ResponsiveContainerProps {
  moduleType?: ModuleType;
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  padding?: "none" | "sm" | "md" | "lg" | "xl";
  centerContent?: boolean;
  className?: string;
}

export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  moduleType,
  children,
  maxWidth = "lg",
  padding = "md",
  centerContent = true,
  className,
}) => {
  const maxWidthClasses = {
    sm: "max-w-sm",
    md: "max-w-2xl",
    lg: "max-w-4xl",
    xl: "max-w-6xl",
    "2xl": "max-w-7xl",
    full: "max-w-full",
  };

  const paddingClasses = {
    none: "",
    sm: "px-4 py-2",
    md: "px-6 py-4",
    lg: "px-8 py-6",
    xl: "px-12 py-8",
  };

  const colors = moduleType ? moduleColors[moduleType] : null;

  return (
    <div
      className={cn(
        "w-full",
        centerContent && "mx-auto",
        maxWidthClasses[maxWidth],
        paddingClasses[padding],
        colors?.background,
        className
      )}
    >
      {children}
    </div>
  );
};

// Responsive sidebar layout
interface ResponsiveSidebarLayoutProps {
  moduleType: ModuleType;
  sidebar: React.ReactNode;
  main: React.ReactNode;
  sidebarWidth?: "sm" | "md" | "lg";
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  className?: string;
}

export const ResponsiveSidebarLayout: React.FC<
  ResponsiveSidebarLayoutProps
> = ({
  moduleType,
  sidebar,
  main,
  sidebarWidth = "md",
  collapsible = true,
  defaultCollapsed = false,
  className,
}) => {
  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed);
  const colors = moduleColors[moduleType];

  const sidebarWidthClasses = {
    sm: isCollapsed ? "w-16" : "w-48",
    md: isCollapsed ? "w-16" : "w-64",
    lg: isCollapsed ? "w-16" : "w-80",
  };

  return (
    <div className={cn("flex min-h-screen", className)}>
      {/* Sidebar */}
      <div
        className={cn(
          "transition-all duration-300 ease-in-out",
          sidebarWidthClasses[sidebarWidth],
          "hidden lg:block",
          colors.background,
          colors.border,
          "border-r"
        )}
      >
        <div className="sticky top-0 h-screen overflow-y-auto">
          {collapsible && (
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className={cn("w-full p-2 text-left", colors.hover, colors.text)}
            >
              {isCollapsed ? "→" : "←"}
            </button>
          )}
          <div className={cn(isCollapsed && "px-2")}>{sidebar}</div>
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      <div className="lg:hidden">
        {/* Mobile menu button and overlay would go here */}
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto">{main}</div>
      </div>
    </div>
  );
};

// Responsive card layout
interface ResponsiveCardLayoutProps {
  moduleType: ModuleType;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  variant?: "default" | "outlined" | "elevated";
  fullHeight?: boolean;
  className?: string;
}

export const ResponsiveCardLayout: React.FC<ResponsiveCardLayoutProps> = ({
  moduleType,
  title,
  subtitle,
  actions,
  children,
  variant = "default",
  fullHeight = false,
  className,
}) => {
  const colors = moduleColors[moduleType];

  const variantClasses = {
    default: "bg-white border border-gray-200",
    outlined: `bg-white border-2 ${colors.border}`,
    elevated: "bg-white shadow-lg border border-gray-100",
  };

  return (
    <div
      className={cn(
        "rounded-lg overflow-hidden",
        variantClasses[variant],
        fullHeight && "h-full flex flex-col",
        className
      )}
    >
      {(title || subtitle || actions) && (
        <div
          className={cn(
            "px-4 py-3 sm:px-6 sm:py-4 border-b",
            colors.border,
            "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
          )}
        >
          <div>
            {title && (
              <h2 className={cn("text-lg font-semibold", colors.text)}>
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
            )}
          </div>
          {actions && (
            <div className="flex items-center space-x-2 flex-shrink-0">
              {actions}
            </div>
          )}
        </div>
      )}

      <div className={cn("p-4 sm:p-6", fullHeight && "flex-1 overflow-y-auto")}>
        {children}
      </div>
    </div>
  );
};

// Responsive form layout
interface ResponsiveFormLayoutProps {
  moduleType: ModuleType;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export const ResponsiveFormLayout: React.FC<ResponsiveFormLayoutProps> = ({
  moduleType,
  title,
  subtitle,
  children,
  actions,
  maxWidth = "md",
  className,
}) => {
  const colors = moduleColors[moduleType];

  const maxWidthClasses = {
    sm: "max-w-md",
    md: "max-w-2xl",
    lg: "max-w-4xl",
    xl: "max-w-6xl",
  };

  return (
    <div className={cn("min-h-screen", colors.background)}>
      <div
        className={cn(
          "mx-auto px-4 py-8 sm:px-6 lg:px-8",
          maxWidthClasses[maxWidth]
        )}
      >
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Header */}
          <div
            className={cn(
              "px-6 py-4 border-b",
              colors.border,
              colors.background
            )}
          >
            <h1 className={cn("text-2xl font-bold", colors.text)}>{title}</h1>
            {subtitle && <p className="text-gray-600 mt-1">{subtitle}</p>}
          </div>

          {/* Form content */}
          <div className={cn("p-6 space-y-6", className)}>{children}</div>

          {/* Actions */}
          {actions && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <div className="flex justify-end space-x-3">{actions}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Responsive table layout
interface ResponsiveTableLayoutProps {
  moduleType: ModuleType;
  children: React.ReactNode;
  className?: string;
}

export const ResponsiveTableLayout: React.FC<ResponsiveTableLayoutProps> = ({
  moduleType,
  children,
  className,
}) => {
  const colors = moduleColors[moduleType];

  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border",
        colors.border,
        className
      )}
    >
      <div className="overflow-x-auto">
        <div className="min-w-full">{children}</div>
      </div>
    </div>
  );
};
