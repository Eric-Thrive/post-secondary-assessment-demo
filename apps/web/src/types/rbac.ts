// Re-export types from shared schema for frontend use
export { UserRole, ModuleType } from "@shared/schema";

// Additional frontend-specific types
export interface ModuleInfo {
  type: ModuleType;
  name: string;
  description: string;
  icon: string;
  color: string;
}

export interface ModuleSwitchError {
  code: string;
  message: string;
  details?: any;
}
