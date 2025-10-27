/**
 * Simple test script to verify the permission system is working
 * This can be run manually to test the RBAC implementation
 */

import { rbacPermissionGate } from "./rbac-permission-gate";
import { UserRole, ModuleType, ResourceType, ActionType } from "./types";

// Mock user objects for testing
const testUsers: Express.User[] = [
  {
    id: 1,
    username: "developer",
    role: UserRole.DEVELOPER,
    assignedModules: [
      ModuleType.K12,
      ModuleType.POST_SECONDARY,
      ModuleType.TUTORING,
    ],
    customerId: "test-org",
    reportCount: 0,
    maxReports: -1,
    isActive: true,
    demoPermissions: {},
  },
  {
    id: 2,
    username: "admin",
    role: UserRole.ADMIN,
    assignedModules: [
      ModuleType.K12,
      ModuleType.POST_SECONDARY,
      ModuleType.TUTORING,
    ],
    customerId: "test-org",
    reportCount: 0,
    maxReports: -1,
    isActive: true,
    demoPermissions: {},
  },
  {
    id: 3,
    username: "org_admin",
    role: UserRole.ORG_ADMIN,
    assignedModules: [ModuleType.POST_SECONDARY],
    organizationId: "org-123",
    customerId: "test-org",
    reportCount: 0,
    maxReports: -1,
    isActive: true,
    demoPermissions: {},
  },
  {
    id: 4,
    username: "customer",
    role: UserRole.CUSTOMER,
    assignedModules: [ModuleType.POST_SECONDARY],
    organizationId: "org-123",
    customerId: "test-org",
    reportCount: 0,
    maxReports: -1,
    isActive: true,
    demoPermissions: {},
  },
  {
    id: 5,
    username: "demo",
    role: UserRole.DEMO,
    assignedModules: [ModuleType.POST_SECONDARY],
    customerId: "demo-org",
    reportCount: 3,
    maxReports: 5,
    isActive: true,
    demoPermissions: {},
  },
];

async function testPermissions() {
  console.log("🧪 Testing RBAC Permission System\n");

  for (const user of testUsers) {
    console.log(`👤 Testing permissions for ${user.username} (${user.role}):`);

    // Test module access
    const canSwitchModules = await rbacPermissionGate.checkAccess(
      user,
      ResourceType.MODULES,
      ActionType.SWITCH
    );
    console.log(`  📱 Can switch modules: ${canSwitchModules}`);

    // Test admin access
    const canAccessAdmin = await rbacPermissionGate.checkAccess(
      user,
      ResourceType.ADMIN,
      ActionType.VIEW
    );
    console.log(`  🔧 Can access admin: ${canAccessAdmin}`);

    // Test report creation
    const canCreateReports = await rbacPermissionGate.checkAccess(
      user,
      ResourceType.REPORTS,
      ActionType.CREATE,
      { currentReportCount: user.reportCount }
    );
    console.log(`  📄 Can create reports: ${canCreateReports}`);

    // Test prompt editing
    const canEditPrompts = await rbacPermissionGate.checkAccess(
      user,
      ResourceType.PROMPTS,
      ActionType.EDIT
    );
    console.log(`  ✏️  Can edit prompts: ${canEditPrompts}`);

    // Test user management
    const canManageUsers = await rbacPermissionGate.checkAccess(
      user,
      ResourceType.USERS,
      ActionType.MANAGE
    );
    console.log(`  👥 Can manage users: ${canManageUsers}`);

    // Get full permissions summary
    const permissions = rbacPermissionGate.getUserPermissions(
      user.role,
      user.assignedModules,
      user.maxReports
    );
    console.log(`  📊 Module access: [${permissions.moduleAccess.join(", ")}]`);
    console.log(`  📈 Report limit: ${permissions.reportLimit || "unlimited"}`);
    console.log("");
  }

  console.log("✅ Permission system test completed!");
}

// Export for manual testing
export { testPermissions };

// Uncomment to run the test
// testPermissions().catch(console.error);
