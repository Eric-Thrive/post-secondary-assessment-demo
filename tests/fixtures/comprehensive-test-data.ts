/**
 * Comprehensive test data fixtures for RBAC system validation
 * Extends existing test data with additional scenarios for thorough testing
 */

import { UserRole, ModuleType } from "../../packages/db/schema";

export interface ExtendedTestUser {
  username: string;
  email: string;
  password: string;
  role: UserRole;
  assignedModules: ModuleType[];
  organizationId?: string;
  maxReports: number;
  reportCount: number;
  description: string;
  testScenarios: string[];
}

export interface ExtendedTestOrganization {
  id: string;
  name: string;
  customerId: string;
  assignedModules: ModuleType[];
  maxUsers: number;
  isActive: boolean;
  description: string;
  testScenarios: string[];
}

export interface ExtendedTestAssessmentCase {
  caseId: string;
  displayName: string;
  moduleType: ModuleType;
  customerId: string;
  status: string;
  gradeBand?: string;
  description: string;
  testScenarios: string[];
}

// Additional test organizations for edge cases and boundary testing
export const extendedTestOrganizations: ExtendedTestOrganization[] = [
  {
    id: "org-boundary-test-1",
    name: "Boundary Test Organization 1",
    customerId: "boundary-test-1",
    assignedModules: [ModuleType.K12, ModuleType.POST_SECONDARY],
    maxUsers: 1, // Test single user limit
    isActive: true,
    description: "Organization with minimal user limit for boundary testing",
    testScenarios: [
      "Single user organization limit",
      "Module access boundary testing",
      "User limit enforcement",
    ],
  },
  {
    id: "org-boundary-test-2",
    name: "Boundary Test Organization 2",
    customerId: "boundary-test-2",
    assignedModules: [ModuleType.TUTORING],
    maxUsers: 100, // Test high user limit
    isActive: true,
    description: "Organization with high user limit for scalability testing",
    testScenarios: [
      "High user count organization",
      "Single module restriction testing",
      "Scalability validation",
    ],
  },
  {
    id: "org-mixed-permissions",
    name: "Mixed Permissions Organization",
    customerId: "mixed-permissions",
    assignedModules: [ModuleType.K12, ModuleType.TUTORING],
    maxUsers: 20,
    isActive: true,
    description:
      "Organization with mixed module assignments for complex permission testing",
    testScenarios: [
      "Mixed module access patterns",
      "Complex permission boundaries",
      "Cross-module data isolation",
    ],
  },
  {
    id: "org-recently-deactivated",
    name: "Recently Deactivated Organization",
    customerId: "recently-deactivated",
    assignedModules: [ModuleType.POST_SECONDARY],
    maxUsers: 15,
    isActive: false,
    description:
      "Recently deactivated organization for testing inactive state handling",
    testScenarios: [
      "Inactive organization access",
      "Deactivation impact on users",
      "Data retention for inactive orgs",
    ],
  },
];

// Additional test users for comprehensive role and permission testing
export const extendedTestUsers: ExtendedTestUser[] = [
  // Edge case developers
  {
    username: "test-developer-edge-case",
    email: "developer-edge@test.com",
    password: "TestPassword123!",
    role: UserRole.DEVELOPER,
    assignedModules: [
      ModuleType.K12,
      ModuleType.POST_SECONDARY,
      ModuleType.TUTORING,
    ],
    maxReports: -1,
    reportCount: 999, // High report count for testing
    description: "Developer with high report count for edge case testing",
    testScenarios: [
      "High report count handling",
      "Full system access validation",
      "Performance with large datasets",
    ],
  },

  // Boundary testing admins
  {
    username: "test-admin-boundary",
    email: "admin-boundary@test.com",
    password: "TestPassword123!",
    role: UserRole.ADMIN,
    assignedModules: [
      ModuleType.K12,
      ModuleType.POST_SECONDARY,
      ModuleType.TUTORING,
    ],
    maxReports: -1,
    reportCount: 0, // New admin with no reports
    description: "New admin user for testing initial state permissions",
    testScenarios: [
      "New admin permissions",
      "Zero report count handling",
      "Initial access validation",
    ],
  },

  // Complex org admin scenarios
  {
    username: "test-org-admin-boundary-1",
    email: "orgadmin-boundary-1@test.com",
    password: "TestPassword123!",
    role: UserRole.ORG_ADMIN,
    assignedModules: [ModuleType.K12, ModuleType.POST_SECONDARY],
    organizationId: "org-boundary-test-1",
    maxReports: -1,
    reportCount: 50, // Moderate report count
    description: "Org admin in single-user organization for boundary testing",
    testScenarios: [
      "Single user organization management",
      "Boundary organization permissions",
      "Limited scope validation",
    ],
  },
  {
    username: "test-org-admin-mixed",
    email: "orgadmin-mixed@test.com",
    password: "TestPassword123!",
    role: UserRole.ORG_ADMIN,
    assignedModules: [ModuleType.K12, ModuleType.TUTORING],
    organizationId: "org-mixed-permissions",
    maxReports: -1,
    reportCount: 25,
    description: "Org admin with mixed module permissions for complex testing",
    testScenarios: [
      "Mixed module administration",
      "Complex permission boundaries",
      "Cross-module user management",
    ],
  },
  {
    username: "test-org-admin-inactive",
    email: "orgadmin-inactive@test.com",
    password: "TestPassword123!",
    role: UserRole.ORG_ADMIN,
    assignedModules: [ModuleType.POST_SECONDARY],
    organizationId: "org-recently-deactivated",
    maxReports: -1,
    reportCount: 10,
    description:
      "Org admin in deactivated organization for testing inactive state",
    testScenarios: [
      "Inactive organization access",
      "Deactivated org admin permissions",
      "Data access in inactive state",
    ],
  },

  // Edge case customers
  {
    username: "test-customer-boundary-single",
    email: "customer-boundary-single@test.com",
    password: "TestPassword123!",
    role: UserRole.CUSTOMER,
    assignedModules: [ModuleType.K12],
    organizationId: "org-boundary-test-1",
    maxReports: -1,
    reportCount: 0,
    description: "Single customer in boundary test organization",
    testScenarios: [
      "Single user in organization",
      "Isolated customer permissions",
      "Boundary organization access",
    ],
  },
  {
    username: "test-customer-high-usage",
    email: "customer-high-usage@test.com",
    password: "TestPassword123!",
    role: UserRole.CUSTOMER,
    assignedModules: [ModuleType.TUTORING],
    organizationId: "org-boundary-test-2",
    maxReports: -1,
    reportCount: 500, // Very high usage customer
    description: "High-usage customer for performance and scalability testing",
    testScenarios: [
      "High report count customer",
      "Performance with heavy usage",
      "Scalability validation",
    ],
  },
  {
    username: "test-customer-mixed-modules",
    email: "customer-mixed@test.com",
    password: "TestPassword123!",
    role: UserRole.CUSTOMER,
    assignedModules: [ModuleType.K12, ModuleType.TUTORING],
    organizationId: "org-mixed-permissions",
    maxReports: -1,
    reportCount: 15,
    description:
      "Customer with mixed module access for complex permission testing",
    testScenarios: [
      "Mixed module customer access",
      "Complex permission validation",
      "Cross-module data access",
    ],
  },

  // Comprehensive demo user scenarios
  {
    username: "test-demo-zero-reports",
    email: "demo-zero@test.com",
    password: "TestPassword123!",
    role: UserRole.DEMO,
    assignedModules: [ModuleType.POST_SECONDARY],
    maxReports: 5,
    reportCount: 0,
    description: "Brand new demo user with zero reports for onboarding testing",
    testScenarios: [
      "New demo user onboarding",
      "Zero report state handling",
      "Initial demo experience",
    ],
  },
  {
    username: "test-demo-one-report",
    email: "demo-one@test.com",
    password: "TestPassword123!",
    role: UserRole.DEMO,
    assignedModules: [ModuleType.K12],
    maxReports: 5,
    reportCount: 1,
    description: "Demo user with single report for early usage testing",
    testScenarios: [
      "Early demo usage",
      "Single report experience",
      "Progressive demo journey",
    ],
  },
  {
    username: "test-demo-mid-usage",
    email: "demo-mid@test.com",
    password: "TestPassword123!",
    role: UserRole.DEMO,
    assignedModules: [ModuleType.TUTORING],
    maxReports: 5,
    reportCount: 3,
    description: "Demo user with moderate usage for mid-journey testing",
    testScenarios: [
      "Mid-journey demo experience",
      "Moderate usage patterns",
      "Engagement tracking",
    ],
  },
  {
    username: "test-demo-pre-limit",
    email: "demo-pre-limit@test.com",
    password: "TestPassword123!",
    role: UserRole.DEMO,
    assignedModules: [ModuleType.POST_SECONDARY],
    maxReports: 5,
    reportCount: 4,
    description: "Demo user at 4 reports for upgrade prompt testing",
    testScenarios: [
      "Pre-limit upgrade prompting",
      "4-report upgrade experience",
      "Conversion optimization",
    ],
  },
  {
    username: "test-demo-exactly-at-limit",
    email: "demo-exact-limit@test.com",
    password: "TestPassword123!",
    role: UserRole.DEMO,
    assignedModules: [ModuleType.K12],
    maxReports: 5,
    reportCount: 5,
    description: "Demo user exactly at limit for boundary testing",
    testScenarios: [
      "Exact limit boundary testing",
      "Limit enforcement validation",
      "Post-limit user experience",
    ],
  },
  {
    username: "test-demo-k12-focused",
    email: "demo-k12-focused@test.com",
    password: "TestPassword123!",
    role: UserRole.DEMO,
    assignedModules: [ModuleType.K12],
    maxReports: 5,
    reportCount: 2,
    description: "Demo user focused on K12 module for module-specific testing",
    testScenarios: [
      "K12-specific demo experience",
      "Module-focused usage patterns",
      "K12 demo conversion",
    ],
  },
  {
    username: "test-demo-tutoring-focused",
    email: "demo-tutoring-focused@test.com",
    password: "TestPassword123!",
    role: UserRole.DEMO,
    assignedModules: [ModuleType.TUTORING],
    maxReports: 5,
    reportCount: 3,
    description: "Demo user focused on tutoring module for specialized testing",
    testScenarios: [
      "Tutoring-specific demo experience",
      "Specialized module usage",
      "Tutoring demo conversion",
    ],
  },
];

// Additional assessment cases for comprehensive testing
export const extendedTestAssessmentCases: ExtendedTestAssessmentCase[] = [
  // Boundary organization cases
  {
    caseId: "test-case-boundary-1-k12",
    displayName: "Boundary Org K12 Assessment",
    moduleType: ModuleType.K12,
    customerId: "boundary-test-1",
    status: "completed",
    gradeBand: "elementary",
    description: "Assessment case in single-user boundary organization",
    testScenarios: [
      "Single user organization data access",
      "Boundary organization isolation",
      "Minimal organization functionality",
    ],
  },
  {
    caseId: "test-case-boundary-2-tutoring",
    displayName: "High-Scale Tutoring Assessment",
    moduleType: ModuleType.TUTORING,
    customerId: "boundary-test-2",
    status: "in_progress",
    description: "Assessment case in high-capacity organization",
    testScenarios: [
      "High-capacity organization handling",
      "Scalability validation",
      "Performance under load",
    ],
  },

  // Mixed permissions cases
  {
    caseId: "test-case-mixed-k12-1",
    displayName: "Mixed Org K12 Assessment 1",
    moduleType: ModuleType.K12,
    customerId: "mixed-permissions",
    status: "completed",
    gradeBand: "middle",
    description: "K12 assessment in mixed-module organization",
    testScenarios: [
      "Mixed module organization access",
      "K12 data in multi-module org",
      "Cross-module isolation",
    ],
  },
  {
    caseId: "test-case-mixed-tutoring-1",
    displayName: "Mixed Org Tutoring Assessment 1",
    moduleType: ModuleType.TUTORING,
    customerId: "mixed-permissions",
    status: "pending",
    description: "Tutoring assessment in mixed-module organization",
    testScenarios: [
      "Tutoring data in mixed org",
      "Module-specific access control",
      "Complex permission validation",
    ],
  },

  // Inactive organization cases
  {
    caseId: "test-case-inactive-postsec-1",
    displayName: "Inactive Org Post-Secondary Assessment",
    moduleType: ModuleType.POST_SECONDARY,
    customerId: "recently-deactivated",
    status: "completed",
    description: "Assessment case in deactivated organization",
    testScenarios: [
      "Inactive organization data access",
      "Deactivated org data retention",
      "Historical data availability",
    ],
  },

  // Demo-specific cases for various modules
  {
    caseId: "test-case-demo-k12-elementary",
    displayName: "Demo K12 Elementary Assessment",
    moduleType: ModuleType.K12,
    customerId: "demo-org",
    status: "completed",
    gradeBand: "elementary",
    description: "Demo assessment case for K12 elementary testing",
    testScenarios: [
      "Demo K12 experience",
      "Elementary grade band demo",
      "K12 demo functionality",
    ],
  },
  {
    caseId: "test-case-demo-k12-middle",
    displayName: "Demo K12 Middle School Assessment",
    moduleType: ModuleType.K12,
    customerId: "demo-org",
    status: "in_progress",
    gradeBand: "middle",
    description: "Demo assessment case for K12 middle school testing",
    testScenarios: [
      "Middle school demo experience",
      "K12 grade band variation",
      "Progressive demo complexity",
    ],
  },
  {
    caseId: "test-case-demo-tutoring-1",
    displayName: "Demo Tutoring Assessment 1",
    moduleType: ModuleType.TUTORING,
    customerId: "demo-org",
    status: "completed",
    description: "Demo assessment case for tutoring module testing",
    testScenarios: [
      "Tutoring demo experience",
      "Specialized module demo",
      "Tutoring-specific functionality",
    ],
  },
  {
    caseId: "test-case-demo-tutoring-2",
    displayName: "Demo Tutoring Assessment 2",
    moduleType: ModuleType.TUTORING,
    customerId: "demo-org",
    status: "pending",
    description: "Second demo tutoring case for progression testing",
    testScenarios: [
      "Multiple tutoring demos",
      "Demo progression tracking",
      "Tutoring engagement patterns",
    ],
  },
  {
    caseId: "test-case-demo-postsec-advanced",
    displayName: "Demo Post-Secondary Advanced Assessment",
    moduleType: ModuleType.POST_SECONDARY,
    customerId: "demo-org",
    status: "completed",
    description: "Advanced demo case for post-secondary testing",
    testScenarios: [
      "Advanced demo functionality",
      "Post-secondary complexity",
      "Comprehensive demo experience",
    ],
  },
];

// Test scenario definitions for systematic validation
export const testScenarioDefinitions = {
  // User role scenarios
  userRoleScenarios: [
    "Developer full system access validation",
    "Admin restricted prompt editing",
    "Org admin organization-scoped permissions",
    "Customer limited organization access",
    "Demo user report limit enforcement",
  ],

  // Module access scenarios
  moduleAccessScenarios: [
    "Module switching permission boundaries",
    "Single module restriction enforcement",
    "Multi-module access validation",
    "Cross-module data isolation",
    "Module-specific functionality access",
  ],

  // Organization scenarios
  organizationScenarios: [
    "Multi-tenant data isolation",
    "Organization user limit enforcement",
    "Inactive organization handling",
    "Organization-scoped user management",
    "Cross-organization access prevention",
  ],

  // Demo system scenarios
  demoSystemScenarios: [
    "Demo user onboarding flow",
    "Report limit progression (0->1->3->4->5)",
    "Upgrade prompt at 4 reports",
    "Report creation blocking at limit",
    "Demo data isolation from organizations",
  ],

  // Permission boundary scenarios
  permissionBoundaryScenarios: [
    "Role-based permission enforcement",
    "Resource access control validation",
    "Action-specific permission checking",
    "Context-aware permission evaluation",
    "Permission inheritance and overrides",
  ],

  // Data isolation scenarios
  dataIsolationScenarios: [
    "Customer-based data segregation",
    "Organization-level data access",
    "Demo user data isolation",
    "Cross-tenant access prevention",
    "Historical data access control",
  ],
};

// Helper functions for test data management
export const testDataHelpers = {
  /**
   * Get all users for a specific role
   */
  getUsersByRole: (role: UserRole): ExtendedTestUser[] => {
    return extendedTestUsers.filter((user) => user.role === role);
  },

  /**
   * Get all users for a specific organization
   */
  getUsersByOrganization: (organizationId: string): ExtendedTestUser[] => {
    return extendedTestUsers.filter(
      (user) => user.organizationId === organizationId
    );
  },

  /**
   * Get all assessment cases for a specific customer
   */
  getCasesByCustomer: (customerId: string): ExtendedTestAssessmentCase[] => {
    return extendedTestAssessmentCases.filter(
      (case_) => case_.customerId === customerId
    );
  },

  /**
   * Get all assessment cases for a specific module
   */
  getCasesByModule: (moduleType: ModuleType): ExtendedTestAssessmentCase[] => {
    return extendedTestAssessmentCases.filter(
      (case_) => case_.moduleType === moduleType
    );
  },

  /**
   * Get demo users by report count range
   */
  getDemoUsersByReportRange: (min: number, max: number): ExtendedTestUser[] => {
    return extendedTestUsers.filter(
      (user) =>
        user.role === UserRole.DEMO &&
        user.reportCount >= min &&
        user.reportCount <= max
    );
  },

  /**
   * Get organizations by module assignment
   */
  getOrganizationsByModule: (
    moduleType: ModuleType
  ): ExtendedTestOrganization[] => {
    return extendedTestOrganizations.filter((org) =>
      org.assignedModules.includes(moduleType)
    );
  },
};
