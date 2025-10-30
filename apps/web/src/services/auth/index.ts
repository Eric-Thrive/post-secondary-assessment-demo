// Authentication Services - Main Export
export { unifiedAuthIntegration } from "./unified-auth-integration";
export { sessionManagement } from "./session-management";
export { RoleBasedAccessControl } from "./roleBasedAccessControl";
export { ModuleAccessValidator } from "./moduleAccessValidator";

// Re-export types for convenience
export type {
  AuthenticatedUser,
  LoginCredentials,
  ModuleAccess,
  UserPreferences,
} from "@/types/unified-auth";
