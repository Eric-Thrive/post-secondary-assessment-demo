import {
  AuthenticatedUser,
  ModuleInfo,
  ModuleStats,
  RecentActivity,
  AdminFeature,
  ModuleAccess,
} from "@/types/unified-auth";

// Dashboard component specific types
export interface ModuleDashboardProps {
  user: AuthenticatedUser;
  availableModules: ModuleAccess[];
  recentActivity?: RecentActivity[];
  adminFeatures?: AdminFeature[];
}

export interface ModuleCardProps {
  module: ModuleInfo;
  accessLevel: "full" | "restricted" | "unavailable";
  stats?: ModuleStats;
  onClick: () => void;
  disabled?: boolean;
}

export interface WelcomeHeaderProps {
  user: AuthenticatedUser;
  onSettingsClick?: () => void;
}

export interface AdminQuickActionsProps {
  user: AuthenticatedUser;
  features: AdminFeature[];
}

export interface RecentActivityProps {
  activities: RecentActivity[];
  onActivityClick?: (activity: RecentActivity) => void;
}

// Re-export commonly used types
export type {
  AuthenticatedUser,
  ModuleInfo,
  ModuleStats,
  RecentActivity,
  AdminFeature,
  ModuleAccess,
};
