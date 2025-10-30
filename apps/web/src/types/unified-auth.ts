import { UserRole, ModuleType } from "../../../../packages/db/schema";

// Re-export database types for consistency
export { UserRole, ModuleType };

// User Authentication Types
export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  username: string;
  role: UserRole;
  organizationId?: string;
  moduleAccess: ModuleAccess[];
  preferences: UserPreferences;
  lastLogin: Date | null;
  demoExpiry?: Date;
}

export interface ModuleAccess {
  moduleType: ModuleType;
  accessLevel: "full" | "restricted";
  permissions: Permission[];
}

export interface Permission {
  action: string;
  resource: string;
  granted: boolean;
}

// Module Information Types
export interface ModuleInfo {
  id: string;
  name: string;
  displayName: string;
  description: string;
  icon: string;
  color: ThemeColor;
  route: string;
  features: string[];
}

export interface ModuleStats {
  totalReports: number;
  draftReports: number;
  recentActivity: Date;
}

export type ThemeColor = "navy" | "sky-blue" | "orange" | "yellow";

// Navigation State Types
export interface NavigationState {
  currentPath: string;
  previousPath?: string;
  redirectAfterLogin?: string;
  moduleContext?: string;
}

export interface UserPreferences {
  defaultModule?: string;
  dashboardLayout: "grid" | "list";
  theme: "light" | "dark" | "auto";
  notifications: NotificationSettings;
}

export interface NotificationSettings {
  email: boolean;
  browser: boolean;
  reportComplete: boolean;
  systemUpdates: boolean;
}

// Recent Activity Types
export interface RecentActivity {
  id: string;
  type: "report" | "assessment" | "module_access";
  title: string;
  moduleType: ModuleType;
  timestamp: Date;
  status: "draft" | "completed" | "in_progress";
  route?: string;
}

// Admin Feature Types
export interface AdminFeature {
  id: string;
  title: string;
  description: string;
  icon: string;
  route: string;
  requiredRole: UserRole[];
}

// Authentication Flow Types
export interface AuthenticationFlowProps {
  onAuthSuccess: (user: AuthenticatedUser) => void;
  redirectPath?: string;
  theme?: "light" | "dark";
}

export interface LoginCredentials {
  username: string;
  password: string;
  environment?: string;
}

// Route Protection Types
export interface RouteProtectionConfig {
  requiresAuth: boolean;
  allowedRoles?: UserRole[];
  allowedModules?: ModuleType[];
  redirectOnUnauthorized?: string;
}
