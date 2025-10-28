import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Accessibility,
  Eye,
  EyeOff,
  Type,
  Contrast,
  MousePointer,
  Keyboard,
  Volume2,
  VolumeX,
  Settings,
  RotateCcw,
  Check,
} from "lucide-react";

// Accessibility Context
interface AccessibilitySettings {
  highContrast: boolean;
  largeText: boolean;
  reducedMotion: boolean;
  screenReaderMode: boolean;
  keyboardNavigation: boolean;
  focusIndicators: boolean;
  soundEnabled: boolean;
  fontSize: "small" | "medium" | "large" | "extra-large";
  colorScheme: "auto" | "light" | "dark" | "high-contrast";
}

const defaultSettings: AccessibilitySettings = {
  highContrast: false,
  largeText: false,
  reducedMotion: false,
  screenReaderMode: false,
  keyboardNavigation: true,
  focusIndicators: true,
  soundEnabled: true,
  fontSize: "medium",
  colorScheme: "auto",
};

const AccessibilityContext = React.createContext<{
  settings: AccessibilitySettings;
  updateSetting: <K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K]
  ) => void;
  resetSettings: () => void;
}>({
  settings: defaultSettings,
  updateSetting: () => {},
  resetSettings: () => {},
});

// Accessibility Provider
interface AccessibilityProviderProps {
  children: React.ReactNode;
}

export const AccessibilityProvider: React.FC<AccessibilityProviderProps> = ({
  children,
}) => {
  const [settings, setSettings] = useState<AccessibilitySettings>(() => {
    const saved = localStorage.getItem("accessibility-settings");
    return saved
      ? { ...defaultSettings, ...JSON.parse(saved) }
      : defaultSettings;
  });

  const updateSetting = <K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K]
  ) => {
    setSettings((prev) => {
      const newSettings = { ...prev, [key]: value };
      localStorage.setItem(
        "accessibility-settings",
        JSON.stringify(newSettings)
      );
      return newSettings;
    });
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    localStorage.removeItem("accessibility-settings");
  };

  // Apply settings to document
  useEffect(() => {
    const root = document.documentElement;

    // High contrast
    if (settings.highContrast) {
      root.classList.add("high-contrast");
    } else {
      root.classList.remove("high-contrast");
    }

    // Large text
    if (settings.largeText) {
      root.classList.add("large-text");
    } else {
      root.classList.remove("large-text");
    }

    // Reduced motion
    if (settings.reducedMotion) {
      root.classList.add("reduce-motion");
    } else {
      root.classList.remove("reduce-motion");
    }

    // Font size
    root.classList.remove(
      "font-small",
      "font-medium",
      "font-large",
      "font-extra-large"
    );
    root.classList.add(`font-${settings.fontSize}`);

    // Color scheme
    if (settings.colorScheme !== "auto") {
      root.classList.remove("light", "dark", "high-contrast-theme");
      if (settings.colorScheme === "high-contrast") {
        root.classList.add("high-contrast-theme");
      } else {
        root.classList.add(settings.colorScheme);
      }
    }

    // Focus indicators
    if (settings.focusIndicators) {
      root.classList.add("enhanced-focus");
    } else {
      root.classList.remove("enhanced-focus");
    }
  }, [settings]);

  return (
    <AccessibilityContext.Provider
      value={{ settings, updateSetting, resetSettings }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
};

// Hook to use accessibility settings
export const useAccessibility = () => {
  const context = React.useContext(AccessibilityContext);
  if (!context) {
    throw new Error(
      "useAccessibility must be used within AccessibilityProvider"
    );
  }
  return context;
};

// Accessibility Menu Component
export const AccessibilityMenu: React.FC = () => {
  const { settings, updateSetting, resetSettings } = useAccessibility();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
          aria-label="Accessibility settings"
        >
          <Accessibility className="h-4 w-4" />
          <span className="sr-only">Accessibility Settings</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Accessibility className="h-4 w-4" />
          Accessibility Settings
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => updateSetting("highContrast", !settings.highContrast)}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <Contrast className="h-4 w-4" />
            High Contrast
          </div>
          {settings.highContrast && <Check className="h-4 w-4" />}
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => updateSetting("largeText", !settings.largeText)}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <Type className="h-4 w-4" />
            Large Text
          </div>
          {settings.largeText && <Check className="h-4 w-4" />}
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() =>
            updateSetting("reducedMotion", !settings.reducedMotion)
          }
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <MousePointer className="h-4 w-4" />
            Reduce Motion
          </div>
          {settings.reducedMotion && <Check className="h-4 w-4" />}
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() =>
            updateSetting("keyboardNavigation", !settings.keyboardNavigation)
          }
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <Keyboard className="h-4 w-4" />
            Keyboard Navigation
          </div>
          {settings.keyboardNavigation && <Check className="h-4 w-4" />}
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => updateSetting("soundEnabled", !settings.soundEnabled)}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            {settings.soundEnabled ? (
              <Volume2 className="h-4 w-4" />
            ) : (
              <VolumeX className="h-4 w-4" />
            )}
            Sound Feedback
          </div>
          {settings.soundEnabled && <Check className="h-4 w-4" />}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={resetSettings}
          className="flex items-center gap-2 text-red-600 dark:text-red-400"
        >
          <RotateCcw className="h-4 w-4" />
          Reset to Defaults
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// Skip Navigation Links
export const SkipNavigation: React.FC = () => {
  return (
    <div className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50">
      <a
        href="#main-content"
        className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        Skip to main content
      </a>
    </div>
  );
};

// Focus Trap Component
interface FocusTrapProps {
  children: React.ReactNode;
  active: boolean;
  restoreFocus?: boolean;
}

export const FocusTrap: React.FC<FocusTrapProps> = ({
  children,
  active,
  restoreFocus = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!active) return;

    previousActiveElement.current = document.activeElement as HTMLElement;

    const container = containerRef.current;
    if (!container) return;

    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[
      focusableElements.length - 1
    ] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    document.addEventListener("keydown", handleTabKey);
    firstElement?.focus();

    return () => {
      document.removeEventListener("keydown", handleTabKey);
      if (restoreFocus && previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [active, restoreFocus]);

  return <div ref={containerRef}>{children}</div>;
};

// Screen Reader Announcements
interface ScreenReaderAnnouncementProps {
  message: string;
  priority?: "polite" | "assertive";
}

export const ScreenReaderAnnouncement: React.FC<
  ScreenReaderAnnouncementProps
> = ({ message, priority = "polite" }) => {
  return (
    <div
      role="status"
      aria-live={priority}
      aria-atomic="true"
      className="sr-only"
    >
      {message}
    </div>
  );
};

// Keyboard Navigation Helper
export const useKeyboardNavigation = () => {
  const { settings } = useAccessibility();

  const handleKeyDown = (
    e: KeyboardEvent,
    actions: Record<string, () => void>
  ) => {
    if (!settings.keyboardNavigation) return;

    const key = e.key.toLowerCase();
    if (actions[key]) {
      e.preventDefault();
      actions[key]();
    }
  };

  return { handleKeyDown };
};

// Enhanced Button with Accessibility Features
interface AccessibleButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: "default" | "outline" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  loadingText?: string;
  tooltip?: string;
  shortcut?: string;
}

export const AccessibleButton: React.FC<AccessibleButtonProps> = ({
  children,
  variant = "default",
  size = "md",
  loading = false,
  loadingText = "Loading...",
  tooltip,
  shortcut,
  disabled,
  onClick,
  ...props
}) => {
  const { settings } = useAccessibility();
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (settings.soundEnabled) {
      // Play click sound (would need actual audio implementation)
      console.log("Click sound");
    }
    onClick?.(e);
  };

  const buttonContent = (
    <Button
      ref={buttonRef}
      variant={variant}
      size={size}
      disabled={disabled || loading}
      onClick={handleClick}
      aria-describedby={tooltip ? `${props.id}-tooltip` : undefined}
      {...props}
    >
      {loading ? loadingText : children}
      {shortcut && (
        <Badge variant="outline" className="ml-2 text-xs">
          {shortcut}
        </Badge>
      )}
    </Button>
  );

  if (tooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{buttonContent}</TooltipTrigger>
          <TooltipContent id={`${props.id}-tooltip`}>
            <p>{tooltip}</p>
            {shortcut && (
              <p className="text-xs text-muted-foreground">
                Shortcut: {shortcut}
              </p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return buttonContent;
};

// Accessible Form Field
interface AccessibleFormFieldProps {
  label: string;
  id: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}

export const AccessibleFormField: React.FC<AccessibleFormFieldProps> = ({
  label,
  id,
  error,
  hint,
  required = false,
  children,
}) => {
  const errorId = error ? `${id}-error` : undefined;
  const hintId = hint ? `${id}-hint` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(" ");

  return (
    <div className="space-y-2">
      <label
        htmlFor={id}
        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        {label}
        {required && (
          <span className="text-red-500 ml-1" aria-label="required">
            *
          </span>
        )}
      </label>

      {hint && (
        <p id={hintId} className="text-sm text-muted-foreground">
          {hint}
        </p>
      )}

      {React.cloneElement(children as React.ReactElement, {
        id,
        "aria-describedby": describedBy || undefined,
        "aria-invalid": error ? "true" : undefined,
        required,
      })}

      {error && (
        <p
          id={errorId}
          className="text-sm text-red-600 dark:text-red-400"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
};

// Accessible Card Component
interface AccessibleCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  selected?: boolean;
  className?: string;
}

export const AccessibleCard: React.FC<AccessibleCardProps> = ({
  title,
  description,
  children,
  onClick,
  disabled = false,
  selected = false,
  className = "",
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const { settings } = useAccessibility();

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!settings.keyboardNavigation) return;

    if ((e.key === "Enter" || e.key === " ") && onClick && !disabled) {
      e.preventDefault();
      onClick();
    }
  };

  const handleClick = () => {
    if (settings.soundEnabled && onClick) {
      // Play click sound
      console.log("Card click sound");
    }
    onClick?.();
  };

  return (
    <Card
      ref={cardRef}
      className={`
        ${onClick ? "cursor-pointer hover:shadow-md transition-shadow" : ""}
        ${selected ? "ring-2 ring-blue-500" : ""}
        ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        ${className}
      `}
      onClick={disabled ? undefined : handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={onClick && !disabled ? 0 : undefined}
      role={onClick ? "button" : undefined}
      aria-pressed={onClick && selected ? "true" : undefined}
      aria-disabled={disabled}
      aria-describedby={description ? `${title}-description` : undefined}
    >
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {title}
          {selected && (
            <Badge variant="default" className="ml-2">
              Selected
            </Badge>
          )}
        </CardTitle>
        {description && (
          <p
            id={`${title}-description`}
            className="text-sm text-muted-foreground"
          >
            {description}
          </p>
        )}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
};

// Live Region for Dynamic Content Updates
interface LiveRegionProps {
  children: React.ReactNode;
  priority?: "polite" | "assertive";
  atomic?: boolean;
}

export const LiveRegion: React.FC<LiveRegionProps> = ({
  children,
  priority = "polite",
  atomic = true,
}) => {
  return (
    <div
      role="region"
      aria-live={priority}
      aria-atomic={atomic}
      className="sr-only"
    >
      {children}
    </div>
  );
};

// CSS for accessibility features (to be added to global styles)
export const accessibilityStyles = `
  /* High contrast mode */
  .high-contrast {
    --background: #000000;
    --foreground: #ffffff;
    --primary: #ffffff;
    --primary-foreground: #000000;
    --secondary: #333333;
    --secondary-foreground: #ffffff;
    --muted: #333333;
    --muted-foreground: #ffffff;
    --accent: #ffffff;
    --accent-foreground: #000000;
    --destructive: #ff0000;
    --destructive-foreground: #ffffff;
    --border: #ffffff;
    --input: #333333;
    --ring: #ffffff;
  }

  /* Large text */
  .large-text {
    font-size: 1.125rem;
    line-height: 1.75rem;
  }

  /* Reduced motion */
  .reduce-motion * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }

  /* Enhanced focus indicators */
  .enhanced-focus *:focus {
    outline: 3px solid #2563eb;
    outline-offset: 2px;
  }

  /* Font size classes */
  .font-small { font-size: 0.875rem; }
  .font-medium { font-size: 1rem; }
  .font-large { font-size: 1.125rem; }
  .font-extra-large { font-size: 1.25rem; }

  /* Screen reader only content */
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  .sr-only:focus {
    position: static;
    width: auto;
    height: auto;
    padding: inherit;
    margin: inherit;
    overflow: visible;
    clip: auto;
    white-space: normal;
  }
`;
