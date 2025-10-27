# Implementation Plan

- [x] 1. Set up database schema and core RBAC foundation

  - Create organizations table with proper relationships and constraints
  - Update users table to include role, assignedModules, and organizationId fields
  - Create database migration scripts for schema changes
  - Add proper indexes for performance optimization
  - _Requirements: 1.1, 1.2, 1.3, 9.1, 9.2_

- [x] 1.1 Create organizations table and migration

  - Write Drizzle schema for organizations table with id, name, customerId, assignedModules, maxUsers, isActive fields
  - Create migration script to add organizations table
  - Add foreign key constraints and indexes
  - _Requirements: 9.1, 9.2, 9.3_

- [x] 1.2 Update users table schema for RBAC

  - Add role field with UserRole enum values (developer, admin, org_admin, customer, demo)
  - Add assignedModules JSONB field for module access control
  - Add organizationId field to replace customerId for multi-tenancy
  - Update maxReports field logic for demo users (5 reports) vs unlimited for others
  - _Requirements: 1.1, 1.2, 6.1, 6.2_

- [x] 1.3 Create data migration script for existing users

  - Map existing customerId values to new organizations
  - Assign appropriate roles based on existing user data patterns
  - Set default module assignments based on current usage
  - Preserve existing report counts and user data
  - _Requirements: 1.5, 9.4_

- [x] 2. Implement core permission gate system

  - Create PermissionGate interface and RBACPermissionGate implementation
  - Build role-based permission checking logic
  - Implement middleware for enforcing access control
  - Create permission evaluation functions for different resources and actions
  - _Requirements: 1.3, 8.5_

- [x] 2.1 Create permission gate interfaces and enums

  - Define UserRole enum with developer, admin, org_admin, customer, demo values
  - Create ModuleType enum for k12, post_secondary, tutoring modules
  - Write PermissionGate interface with checkAccess and enforceAccess methods
  - Define UserPermissions interface with all permission flags
  - _Requirements: 1.1, 8.1, 8.2_

- [x] 2.2 Implement RBACPermissionGate class

  - Write getUserPermissions method that returns permissions based on user role
  - Implement evaluatePermission method for resource and action checking
  - Create enforceAccess middleware function for Express routes
  - Add comprehensive error handling for permission denied scenarios
  - _Requirements: 1.3, 2.1, 3.1, 4.1, 5.1_

- [x] 2.3 Create specific permission gate types

  - Implement ModuleGate for controlling access to K-12, Post-Secondary, and Tutoring modules
  - Create AdminGate for admin dashboard and system monitoring access
  - Build ReportGate for report creation, viewing, and editing permissions
  - Implement UserManagementGate for user creation and organization management
  - Create SystemConfigGate for prompts, AI config, and lookup table access
  - _Requirements: 2.2, 2.3, 3.2, 4.2, 5.2, 8.3, 8.4_

- [x] 2.4 Write unit tests for permission gate system

  - Test role-based access control logic for all user roles
  - Verify permission checking for different resources and actions
  - Test middleware enforcement with various permission scenarios
  - Create test cases for permission denied and access granted flows
  - _Requirements: 1.3, 2.1, 3.1, 4.1, 5.1_

- [x] 3. Update authentication system to use roles

  - Modify requireAuth middleware to load user role and organization data
  - Replace requireRole middleware to work with new UserRole enum
  - Update requireCustomerAccess to use organizationId instead of customerId
  - Remove demo permission validation middleware (replaced by role-based system)
  - _Requirements: 1.2, 1.3, 4.5, 5.5_

- [x] 3.1 Update authentication middleware

  - Modify requireAuth to populate req.user with role and assignedModules
  - Update user session data to include organizationId and role information
  - Replace role checking logic to use new UserRole enum values
  - Add organization-based data filtering for multi-tenant isolation
  - _Requirements: 1.2, 4.5, 9.5_

- [x] 3.2 Replace customer access control with organization-based filtering

  - Update requireCustomerAccess middleware to use organizationId
  - Implement organization-based data isolation for reports and user management
  - Remove demo permission validation middleware (replaced by role-based checks)
  - Add organization membership validation for shared resources
  - _Requirements: 4.4, 5.4, 9.3, 9.4, 9.5_

- [x] 4. Implement module access control system

  - Create module assignment logic based on user roles and organization settings
  - Build module switcher component for privileged users (Developer, Admin)
  - Update all module-specific routes with appropriate permission gates
  - Replace environment-based module locking with role-based access control
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 4.1 Create module assignment and switching logic

  - Implement getAssignedModules function based on user role and organization
  - Create canSwitchModules function for Developer and Admin roles
  - Build module validation logic to ensure users access only assigned modules
  - Add module assignment updates when user roles or organization settings change
  - _Requirements: 8.1, 8.2, 8.3_

- [x] 4.2 Build module switcher component for frontend

  - Create ModuleSwitcher React component with available modules display
  - Implement module switching functionality for privileged users
  - Add module access restrictions for Org Admin, Customer, and Demo users
  - Create UI indicators showing current module and switching capabilities
  - _Requirements: 2.1, 3.1, 8.1, 8.2_

- [x] 4.3 Update routes with module-based permission gates

  - Add ModuleGate middleware to all module-specific API routes
  - Update assessment case routes to check module access permissions
  - Modify report management routes with proper module access control
  - Add module validation to AI service and prompt loading routes
  - _Requirements: 8.3, 8.4, 8.5_

- [ ] 5. Implement demo sandbox system

  - Create demo user report limit enforcement (5 reports maximum)
  - Build report count tracking and limit checking logic
  - Implement upgrade prompts when approaching demo limits
  - Add demo data cleanup and retention management
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 5.1 Create demo report limit enforcement

  - Update report creation logic to check demo user limits (5 reports max)
  - Implement report count increment when demo users create assessments
  - Add limit checking before allowing new report creation
  - Create upgrade prompt display when demo users reach 4th report
  - _Requirements: 6.1, 6.2, 6.5_

- [x] 5.2 Build demo data cleanup system

  - Create automated cleanup job for expired demo user data
  - Implement demo user expiration date tracking (30 days retention)
  - Add warning notifications before demo data cleanup
  - Create data export options for demo users before cleanup
  - _Requirements: 6.4_

- [ ] 6. Create Git-based prompt management system

  - Migrate existing prompts from database to file system
  - Create prompt file structure for each module (K-12, Post-Secondary, Tutoring)
  - Implement prompt loading system that reads from files instead of database
  - Update AI service to use file-based prompts with proper version control
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 6.1 Create prompt file structure and migrate existing prompts

  - Create /prompts directory with subdirectories for k12, post-secondary, tutoring
  - Export existing prompts from prompt_sections table to markdown files
  - Organize prompts by module, type (system/report_format), and pathway (simple/complex)
  - Create prompt file naming convention and directory structure
  - _Requirements: 7.1, 7.5_

- [ ] 6.2 Implement file-based prompt loading system

  - Create PromptManager class with loadPromptsFromFiles method
  - Implement getPrompt method that retrieves prompts by module, type, and pathway
  - Add prompt file validation and error handling for missing files
  - Create prompt caching system for performance optimization
  - _Requirements: 7.2, 7.5_

- [ ] 6.3 Update AI service to use file-based prompts

  - Modify AI service initialization to load prompts from files
  - Update prompt retrieval logic throughout the AI processing pipeline
  - Remove database-based prompt loading from AI handlers
  - Add prompt version tracking and validation
  - _Requirements: 7.2, 7.5_

- [x] 7. Update user management and admin interfaces

  - Create organization management interface for admin users
  - Build user role assignment and module access management
  - Update admin dashboards to work with role-based permissions
  - Implement organization-based user filtering and management
  - _Requirements: 2.2, 3.2, 4.2, 9.1, 9.3_

- [x] 7.1 Create organization management interface

  - Build admin interface for creating and managing organizations
  - Implement organization user assignment and role management
  - Add organization module assignment and user limit configuration
  - Create organization status management (active/inactive)
  - _Requirements: 9.1, 9.2, 9.3_

- [x] 7.2 Update admin dashboards for role-based access

  - Modify admin dashboard to show role-appropriate information
  - Update analytics and monitoring displays based on user permissions
  - Add organization-filtered views for Org Admin users
  - Remove environment-specific dashboard elements
  - _Requirements: 2.2, 3.2_

- [x] 7.3 Implement user role and module assignment management

  - Create interface for assigning and changing user roles
  - Build module assignment management for users and organizations
  - Add user permission preview showing what access each role provides
  - Implement bulk user management operations for organizations
  - _Requirements: 4.2, 8.4, 9.3_

- [x] 8. Remove environment switching system

  - Delete EnvironmentContext and all environment switching logic
  - Remove EnvironmentSwitcher component and related UI elements
  - Delete all 11 environment type definitions and configuration
  - Remove environment-based module locking and forced environment logic
  - Clean up database configuration and environment selection code
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 8.1 Remove environment switching components and logic

  - Delete EnvironmentContext and environment state management
  - Remove EnvironmentSwitcher React component and related UI
  - Clean up environment-based routing and navigation logic
  - Remove environment selection from user interface
  - _Requirements: 10.1, 10.2_

- [x] 8.2 Delete environment type definitions and configurations

  - Remove all 11 environment type definitions from packages/db/environment.ts
  - Delete environment-based database configuration logic
  - Remove environment-specific connection string management
  - Clean up environment-based feature flags and settings
  - _Requirements: 10.3, 10.5_

- [x] 8.3 Remove environment-based module locking

  - Delete module locking logic based on environment types
  - Remove forced environment switching for module access
  - Clean up environment-based demo mode and read-only enforcement
  - Remove environment-specific middleware and route protection
  - _Requirements: 10.4, 10.5_

- [x] 9. Comprehensive testing and validation

  - Create test users for each role type with appropriate permissions
  - Test module switching and access control across all user roles
  - Validate organization-based data isolation and multi-tenancy
  - Test demo user limits, cleanup, and upgrade flows
  - Verify all environment-related code has been removed
  - _Requirements: 1.5, 2.5, 3.5, 4.5, 5.5, 6.5, 7.5, 8.5, 9.5, 10.5_

- [x] 9.1 Create comprehensive test data and user scenarios

  - Create test users for Developer, Admin, Org Admin, Customer, and Demo roles
  - Set up test organizations with different module assignments and user limits
  - Create test assessment cases and reports for multi-tenant validation
  - Build test scenarios for module switching and permission boundaries
  - _Requirements: 1.5, 2.5, 3.5, 4.5, 5.5_

- [x] 9.2 Write integration tests for RBAC system

  - Test complete authentication flow with role assignment and permissions
  - Validate module access control across different user roles and organizations
  - Test report creation, sharing, and access control with organization isolation
  - Verify admin dashboard functionality for different permission levels
  - Test demo user journey from signup to report limit and cleanup
  - _Requirements: 6.5, 7.5, 8.5, 9.5, 10.5_

- [x] 9.3 Validate data migration and backward compatibility

  - Verify existing users are properly migrated to new role system
  - Test that existing reports and assessment cases remain accessible
  - Validate organization assignment and data isolation for migrated users
  - Ensure no data loss during environment system removal
  - _Requirements: 1.5, 9.4, 9.5_

- [-] 10. Performance optimization and security validation

  - Optimize database queries for role-based filtering and organization isolation
  - Validate permission boundary enforcement and security controls
  - Test system performance with RBAC middleware and permission checks
  - Conduct security audit of role-based access control implementation
  - _Requirements: 1.5, 4.5, 5.5, 9.5_

- [x] 10.1 Optimize database performance for RBAC system

  - Add proper indexes for role-based queries and organization filtering
  - Optimize permission checking queries and middleware performance
  - Test database performance with multi-tenant data isolation

  - _Requirements: 1.5, 9.5_

- [x] 10.2 Conduct security validation and audit
  - Validate permission boundary enforcement prevents unauthorized access
  - Test organization data isolation and multi-tenant security
  - Verify demo user limitations and data cleanup security
  - Audit role-based access control for potential security vulnerabilities
  - _Requirements: 4.5, 5.5, 9.5_
