# Requirements Document

## Introduction

This specification defines a comprehensive simplification of the AI-powered educational accessibility platform by replacing the complex multi-environment architecture with a streamlined role-based access control (RBAC) system. The current system uses 11 different environment types to control module access and permissions, creating significant complexity in the codebase. This redesign eliminates environment switching entirely, replacing it with five user roles (Developer, Admin, Org Admin, Customer, Demo) that provide clear permission boundaries while maintaining all essential functionality. The platform will continue to support three modules (K-12, Post-Secondary, Tutoring) with simplified access control based on user roles and organizational membership.

## Glossary

- **RBAC_System**: The role-based access control system that replaces environment-based permissions
- **User_Role**: The permission level assigned to each user (Developer, Admin, Org Admin, Customer, Demo)
- **Module_Assignment**: The module(s) a user has access to (K-12, Post-Secondary, Tutoring)
- **Organization**: A multi-tenant entity representing a customer organization with multiple users
- **Org_Admin_Role**: A user role that manages users and reports within their organization
- **Demo_Sandbox**: An isolated workspace for demo users with a 5-report limit and auto-cleanup
- **Prompt_Management**: The system for managing AI prompts through Git version control instead of database editing
- **Permission_Gate**: Access control logic that checks user roles before allowing actions
- **Module_Switcher**: UI component allowing privileged users to switch between modules
- **Admin_Dashboard**: Administrative interface accessible to Developer and Admin roles
- **Assessment_Platform**: The complete AI-powered educational accessibility platform system
- **Multi_Tenant_System**: The organizational hierarchy supporting multiple customer organizations

## Requirements

### Requirement 1

**User Story:** As a platform architect, I want to replace the 11-environment system with role-based access control, so that the codebase is simpler and more maintainable.

#### Acceptance Criteria

1. WHEN the RBAC_System is implemented, THE Assessment_Platform SHALL support exactly five User_Role types: Developer, Admin, Org Admin, Customer, and Demo
2. WHEN a user authenticates, THE RBAC_System SHALL assign exactly one User_Role to each user account
3. WHEN permission checks occur, THE Assessment_Platform SHALL use User_Role instead of environment type to determine access
4. WHEN the migration is complete, THE Assessment_Platform SHALL remove all environment switching logic and components
5. WHILE the system operates, THE Assessment_Platform SHALL maintain all existing functionality through role-based permissions

### Requirement 2

**User Story:** As a developer, I want full system access including prompt editing and admin dashboards, so that I can manage and maintain the platform effectively.

#### Acceptance Criteria

1. WHEN a user has Developer role, THE Assessment_Platform SHALL grant access to all three modules with switching capability
2. WHEN a Developer accesses the system, THE Assessment_Platform SHALL display admin dashboards with full analytics and monitoring
3. WHEN a Developer needs to modify prompts, THE Prompt_Management SHALL allow editing prompts through Git version control and deployment
4. WHEN a Developer accesses database tables, THE Assessment_Platform SHALL provide table viewing and editing capabilities
5. WHILE a Developer is authenticated, THE Assessment_Platform SHALL log all administrative actions with user attribution

### Requirement 3

**User Story:** As an admin, I want access to admin dashboards and the ability to switch modules, so that I can support customers across all modules and monitor system health.

#### Acceptance Criteria

1. WHEN a user has Admin role, THE Assessment_Platform SHALL grant access to all three modules with switching capability
2. WHEN an Admin accesses the system, THE Assessment_Platform SHALL display admin dashboards with analytics and system monitoring
3. WHEN an Admin needs to support customers, THE Assessment_Platform SHALL allow viewing customer reports across all modules
4. WHEN an Admin accesses the system, THE Assessment_Platform SHALL restrict prompt editing and table editing capabilities
5. WHILE an Admin performs actions, THE Assessment_Platform SHALL log all administrative activities with timestamps

### Requirement 4

**User Story:** As an organization administrator, I want to manage users within my organization and view organizational reports, so that I can oversee my team's assessment activities.

#### Acceptance Criteria

1. WHEN a user has Org Admin role, THE Assessment_Platform SHALL grant access to manage users within their Organization
2. WHEN an Org Admin views reports, THE Assessment_Platform SHALL display all reports created by users in their Organization
3. WHEN an Org Admin manages users, THE Assessment_Platform SHALL allow adding, removing, and modifying user accounts within their Organization
4. WHEN an Org Admin accesses the system, THE Assessment_Platform SHALL restrict access to only their assigned module
5. WHILE an Org Admin operates, THE Assessment_Platform SHALL enforce data isolation preventing access to other organizations

### Requirement 5

**User Story:** As a customer user, I want to create and manage my own assessment reports within my assigned module, so that I can perform my assessment work efficiently.

#### Acceptance Criteria

1. WHEN a user has Customer role, THE Assessment_Platform SHALL grant access to create, view, and edit their own reports
2. WHEN a Customer accesses the system, THE Assessment_Platform SHALL restrict access to only their assigned Module_Assignment
3. WHEN a Customer views reports, THE Assessment_Platform SHALL display only reports they created or have been shared with them
4. WHEN a Customer belongs to an Organization, THE Assessment_Platform SHALL enforce data isolation within their Organization
5. WHILE a Customer operates, THE Assessment_Platform SHALL prevent access to admin dashboards and system configuration

### Requirement 6

**User Story:** As a demo user, I want to try the platform with a sandbox environment and limited reports, so that I can evaluate the system before purchasing.

#### Acceptance Criteria

1. WHEN a user has Demo role, THE Demo_Sandbox SHALL provide an isolated workspace with a maximum of 5 reports
2. WHEN a Demo user creates their 6th report, THE Assessment_Platform SHALL prevent creation and display an upgrade prompt
3. WHEN a Demo user accesses the system, THE Assessment_Platform SHALL restrict access to only their assigned Module_Assignment
4. WHEN a Demo user's sandbox expires, THE Assessment_Platform SHALL automatically clean up demo data after a defined retention period
5. WHILE a Demo user operates, THE Assessment_Platform SHALL clearly indicate demo mode status in the user interface
### Requirement 7

**User Story:** As a developer, I want AI prompts managed through Git version control, so that prompt changes are reviewed, versioned, and can be rolled back if needed.

#### Acceptance Criteria

1. WHEN prompts are modified, THE Prompt_Management SHALL store prompt files in the Git repository
2. WHEN prompt changes are deployed, THE Assessment_Platform SHALL load prompts from the codebase during application startup
3. WHEN prompt changes are needed, THE Prompt_Management SHALL require code review and approval through pull requests
4. WHEN prompt issues occur, THE Prompt_Management SHALL allow rollback to previous versions through Git history
5. WHILE the system operates, THE Assessment_Platform SHALL maintain separate prompts for each module (K-12, Post-Secondary, Tutoring)

### Requirement 8

**User Story:** As a platform architect, I want module access controlled by user role and assignment, so that users see only the modules they have permission to access.

#### Acceptance Criteria

1. WHEN a user has Developer or Admin role, THE Module_Switcher SHALL allow switching between all three modules
2. WHEN a user has Org Admin, Customer, or Demo role, THE Assessment_Platform SHALL restrict access to their assigned Module_Assignment
3. WHEN a user accesses the system, THE Assessment_Platform SHALL display only the modules they have permission to access
4. WHEN module assignment changes, THE Assessment_Platform SHALL update user access without requiring environment switching
5. WHILE users operate, THE Assessment_Platform SHALL enforce module restrictions through Permission_Gate checks

### Requirement 9

**User Story:** As a system administrator, I want organizations to support multiple users with shared access, so that customer teams can collaborate on assessments.

#### Acceptance Criteria

1. WHEN an Organization is created, THE Multi_Tenant_System SHALL support multiple user accounts within the Organization
2. WHEN users belong to the same Organization, THE Assessment_Platform SHALL allow report sharing and collaboration
3. WHEN an Org Admin manages the Organization, THE Multi_Tenant_System SHALL enforce data isolation from other organizations
4. WHEN users access reports, THE Assessment_Platform SHALL display reports created by any user in their Organization
5. WHILE the system operates, THE Multi_Tenant_System SHALL maintain strict data boundaries between organizations

### Requirement 10

**User Story:** As a platform architect, I want to remove all environment switching code and components, so that the codebase is simpler and easier to maintain.

#### Acceptance Criteria

1. WHEN the migration is complete, THE Assessment_Platform SHALL remove the EnvironmentContext and all environment switching logic
2. WHEN the migration is complete, THE Assessment_Platform SHALL remove the EnvironmentSwitcher component and related UI elements
3. WHEN the migration is complete, THE Assessment_Platform SHALL remove all 11 environment type definitions and use a single production environment
4. WHEN the migration is complete, THE Assessment_Platform SHALL remove environment-based module locking and forced environment logic
5. WHILE the system operates, THE Assessment_Platform SHALL use only role-based Permission_Gate checks for access control
