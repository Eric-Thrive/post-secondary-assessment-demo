// Core permission system exports
export * from "./types";
export * from "./rbac-permission-gate";

// Permission gate exports
export * from "./gates/module-gate";
export * from "./gates/admin-gate";
export * from "./gates/report-gate";
export * from "./gates/user-management-gate";
export * from "./gates/system-config-gate";

// Convenience re-exports
export { rbacPermissionGate } from "./rbac-permission-gate";
export { ModuleGate } from "./gates/module-gate";
export { AdminGate } from "./gates/admin-gate";
export { ReportGate } from "./gates/report-gate";
export { UserManagementGate } from "./gates/user-management-gate";
export { SystemConfigGate } from "./gates/system-config-gate";
