import { UserRole, ModuleType } from "@/types/unified-auth";

// Route configuration for unified login and dashboard
export interface RouteConfig {
  path: string;
  component: string;
  requiresAuth: boolean;
  allowedRoles?: UserRole[];
  allowedModules?: ModuleType[];
  redirectOnUnauthorized?: string;
}

// Unified authentication routes
export const AUTH_ROUTES = {
  LOGIN: "/login",
  DASHBOARD: "/dashboard",
  LOGOUT: "/logout",
  RESET_PASSWORD: "/reset-password",
} as const;

// Module-specific routes
export const MODULE_ROUTES = {
  K12: {
    HOME: "/k12",
    ASSESSMENT: "/new-k12-assessment",
    REPORTS: "/k12-reports",
    REVIEW_EDIT: "/k12-review-edit",
  },
  POST_SECONDARY: {
    HOME: "/post-secondary",
    ASSESSMENT: "/new-post-secondary-assessment",
    REPORTS: "/post-secondary-reports",
    REVIEW_EDIT: "/post-secondary-review-edit",
  },
  TUTORING: {
    HOME: "/tutoring",
    ASSESSMENT: "/new-tutoring-assessment",
    REPORTS: "/tutoring-reports",
    REVIEW_EDIT: "/tutoring-review-edit",
  },
} as const;

// Admin routes
export const ADMIN_ROUTES = {
  DASHBOARD: "/admin/dashboard",
  USERS: "/admin/users",
  ORGANIZATIONS: "/admin/organizations",
  PERFORMANCE: "/admin/performance",
  PROMPTS: "/prompts",
} as const;

// Route configuration array
export const ROUTE_CONFIGS: RouteConfig[] = [
  // Authentication routes
  {
    path: AUTH_ROUTES.LOGIN,
    component: "UnifiedLoginPage",
    requiresAuth: false,
  },
  {
    path: AUTH_ROUTES.DASHBOARD,
    component: "ModuleDashboard",
    requiresAuth: true,
  },

  // Module routes
  {
    path: MODULE_ROUTES.K12.HOME,
    component: "K12HomePage",
    requiresAuth: true,
    allowedModules: [ModuleType.K12],
  },
  {
    path: MODULE_ROUTES.POST_SECONDARY.HOME,
    component: "PostSecondaryHomePage",
    requiresAuth: true,
    allowedModules: [ModuleType.POST_SECONDARY],
  },
  {
    path: MODULE_ROUTES.TUTORING.HOME,
    component: "TutoringHomePage",
    requiresAuth: true,
    allowedModules: [ModuleType.TUTORING],
  },

  // Admin routes
  {
    path: ADMIN_ROUTES.DASHBOARD,
    component: "AdminDashboard",
    requiresAuth: true,
    allowedRoles: [UserRole.DEVELOPER, UserRole.SYSTEM_ADMIN],
  },
  {
    path: ADMIN_ROUTES.USERS,
    component: "UserManagementPage",
    requiresAuth: true,
    allowedRoles: [
      UserRole.DEVELOPER,
      UserRole.SYSTEM_ADMIN,
      UserRole.ORG_ADMIN,
    ],
  },
];

// Helper functions for route management
export const getModuleHomeRoute = (moduleType: ModuleType): string => {
  switch (moduleType) {
    case ModuleType.K12:
      return MODULE_ROUTES.K12.HOME;
    case ModuleType.POST_SECONDARY:
      return MODULE_ROUTES.POST_SECONDARY.HOME;
    case ModuleType.TUTORING:
      return MODULE_ROUTES.TUTORING.HOME;
    default:
      return MODULE_ROUTES.POST_SECONDARY.HOME;
  }
};

export const getModuleAssessmentRoute = (moduleType: ModuleType): string => {
  switch (moduleType) {
    case ModuleType.K12:
      return MODULE_ROUTES.K12.ASSESSMENT;
    case ModuleType.POST_SECONDARY:
      return MODULE_ROUTES.POST_SECONDARY.ASSESSMENT;
    case ModuleType.TUTORING:
      return MODULE_ROUTES.TUTORING.ASSESSMENT;
    default:
      return MODULE_ROUTES.POST_SECONDARY.ASSESSMENT;
  }
};

export const getModuleReportsRoute = (moduleType: ModuleType): string => {
  switch (moduleType) {
    case ModuleType.K12:
      return MODULE_ROUTES.K12.REPORTS;
    case ModuleType.POST_SECONDARY:
      return MODULE_ROUTES.POST_SECONDARY.REPORTS;
    case ModuleType.TUTORING:
      return MODULE_ROUTES.TUTORING.REPORTS;
    default:
      return MODULE_ROUTES.POST_SECONDARY.REPORTS;
  }
};
