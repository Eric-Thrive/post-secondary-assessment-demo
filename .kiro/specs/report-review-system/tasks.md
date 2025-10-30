# Implementation Plan

Convert the feature design into a series of prompts for a code-generation LLM that will implement each step with incremental progress. Make sure that each prompt builds on the previous prompts, and ends with wiring things together. There should be no hanging or orphaned code that isn't integrated into a previous step. Focus ONLY on tasks that involve writing, modifying, or testing code.

- [ ] 1. Database Foundation and Schema Setup

  - Apply database migration to create review system tables
  - Extend existing schema exports to include review tables
  - Verify customer isolation and foreign key constraints work correctly
  - _Requirements: 5.1, 5.2, 5.3, 7.1, 7.2_

- [ ] 2. Storage Layer Extension

  - [ ] 2.1 Extend storage.ts with comment CRUD methods

    - Add getComments method with filtering (status, commentType, moduleType)
    - Add addComment method with customer isolation enforcement
    - Add resolveComment method with audit trail
    - _Requirements: 2.1, 2.2, 5.1, 10.1_

  - [ ] 2.2 Extend storage.ts with suggestion CRUD methods

    - Add getSuggestions method with filtering capabilities
    - Add addSuggestion method linking to comments when applicable
    - Add acceptSuggestion and rejectSuggestion methods
    - _Requirements: 3.1, 3.2, 3.5, 10.2_

  - [ ] 2.3 Extend storage.ts with review workflow methods
    - Add getReviewStatus method returning workflow state and metrics
    - Add updateReviewStage method with validation
    - Add approveReport method creating finalized versions
    - _Requirements: 4.1, 4.2, 4.4, 7.3_

- [ ] 3. API Routes Implementation

  - [ ] 3.1 Create assessment-review-routes.ts for comments API

    - Implement GET /api/assessment-cases/:caseId/comments with filtering
    - Implement POST /api/assessment-cases/:caseId/comments with validation
    - Implement POST /api/assessment-cases/:caseId/comments/:commentId/replies
    - Implement PATCH /api/assessment-cases/:caseId/comments/:commentId/resolve
    - _Requirements: 2.1, 2.2, 2.3, 6.1, 6.2_

  - [ ] 3.2 Add suggestions API endpoints to assessment-review-routes.ts

    - Implement GET /api/assessment-cases/:caseId/suggestions with filtering
    - Implement POST /api/assessment-cases/:caseId/suggestions with position tracking
    - Implement POST /api/assessment-cases/:caseId/suggestions/:suggestionId/accept
    - Implement POST /api/assessment-cases/:caseId/suggestions/:suggestionId/reject
    - _Requirements: 3.1, 3.2, 3.5, 6.3_

  - [ ] 3.3 Add review workflow API endpoints to assessment-review-routes.ts

    - Implement GET /api/assessment-cases/:caseId/review for status
    - Implement PATCH /api/assessment-cases/:caseId/review/stage for transitions
    - Implement POST /api/assessment-cases/:caseId/review/approve
    - Implement POST /api/assessment-cases/:caseId/review/request-changes
    - _Requirements: 4.1, 4.2, 4.4, 6.3_

  - [ ] 3.4 Register review routes in main routes index
    - Import and register assessment-review-routes in apps/server/routes/index.ts
    - Ensure proper middleware order (auth, customer access, RBAC)
    - Test route registration and middleware enforcement
    - _Requirements: 6.1, 6.2, 6.4_

- [ ] 4. React Hooks for Data Management

  - [ ] 4.1 Create useReportComments hook

    - Implement React Query hook for fetching comments with filters
    - Add mutation hooks for adding, replying, and resolving comments
    - Include proper query invalidation and optimistic updates
    - _Requirements: 2.1, 2.2, 2.3, 12.1_

  - [ ] 4.2 Create useReportSuggestions hook

    - Implement React Query hook for fetching suggestions with filters
    - Add mutation hooks for creating, accepting, and rejecting suggestions
    - Handle suggestion status updates and report content changes
    - _Requirements: 3.1, 3.2, 3.5, 12.2_

  - [ ] 4.3 Create useReviewWorkflow hook
    - Implement hook for fetching review status and metrics
    - Add mutations for stage transitions and approval actions
    - Include validation for workflow state changes
    - _Requirements: 4.1, 4.2, 4.4, 12.3_

- [ ] 5. Core UI Components

  - [ ] 5.1 Create CommentThread component

    - Build component displaying comment with replies in threaded view
    - Add reply functionality with form validation
    - Include resolve/dismiss actions with proper permissions
    - Style with shadcn/ui components for consistency
    - _Requirements: 2.2, 2.3, 12.1, 12.2_

  - [ ] 5.2 Create CommentSidebar component

    - Build sidebar container with comment filtering options
    - Display comment threads grouped by section/anchor
    - Add new comment creation form
    - Include comment count badges and status indicators
    - _Requirements: 12.1, 12.2, 12.3, 12.4_

  - [ ] 5.3 Create SuggestionItem component

    - Build component showing suggestion with original/suggested text diff
    - Add accept/reject buttons with permission checks
    - Include visual indicators for suggestion status
    - Show change reason and related comment links
    - _Requirements: 3.1, 3.2, 3.5, 12.4, 12.5_

  - [ ] 5.4 Create SuggestionPanel component
    - Build panel listing all suggestions with filtering
    - Group suggestions by section and status
    - Add batch accept/reject functionality for admins
    - Include suggestion creation interface
    - _Requirements: 3.1, 3.2, 3.5, 6.3, 12.4_

- [ ] 6. Review Workflow Interface

  - [ ] 6.1 Create ReviewToolbar component

    - Build toolbar showing current review stage and progress
    - Add stage transition buttons with validation
    - Display metrics (unresolved comments, pending suggestions)
    - Include approve/reject actions for team leads
    - _Requirements: 4.1, 4.2, 4.4, 6.3, 12.5_

  - [ ] 6.2 Create ReviewSummary modal component

    - Build modal displaying comprehensive review status
    - Show breakdown of comments by type and status
    - List blocking issues preventing approval
    - Include audit trail summary view
    - _Requirements: 4.4, 10.1, 10.2, 12.5_

  - [ ] 6.3 Create AuditTrail component
    - Build component displaying chronological audit history
    - Filter by action type, user, and date range
    - Include export functionality for compliance reporting
    - Show before/after states for content changes
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ] 7. Markdown Editor Integration

  - [ ] 7.1 Create MarkdownEditorWithReview component

    - Extend existing markdown editor with comment anchors
    - Add visual indicators for sections with comments
    - Include text selection handlers for creating comments/suggestions
    - Integrate with existing markdown rendering pipeline
    - _Requirements: 2.1, 3.1, 12.2, 12.3_

  - [ ] 7.2 Implement TrackChangesOverlay component

    - Build overlay showing visual diff of pending suggestions
    - Highlight insertions (green), deletions (red), replacements (yellow)
    - Add click handlers for suggestion details and actions
    - Integrate with suggestion status updates
    - _Requirements: 3.1, 3.2, 12.4, 12.5_

  - [ ] 7.3 Add anchor positioning system
    - Implement system to track comment positions in markdown
    - Handle dynamic content changes and position updates
    - Store and retrieve anchor coordinates accurately
    - Support section, paragraph, line, and selection anchors
    - _Requirements: 2.1, 2.4, 12.2, 12.3_

- [ ] 8. Main Review Interface

  - [ ] 8.1 Create ReportReviewView component

    - Build main review page with 2-column layout (editor + sidebar)
    - Integrate MarkdownEditorWithReview and CommentSidebar
    - Add ReviewToolbar and workflow controls
    - Include navigation and breadcrumb components
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

  - [ ] 8.2 Add review routing and navigation

    - Create route /reports/:caseId/review for review interface
    - Add "Review" button to existing report viewers
    - Include proper route guards and permission checks
    - Integrate with existing navigation patterns
    - _Requirements: 6.1, 6.2, 11.1, 11.3_

  - [ ] 8.3 Integrate with existing report viewers
    - Add review status indicators to FigmaEnhancedReportViewer
    - Show comment counts and review stage in report lists
    - Include quick access to review interface
    - Maintain backward compatibility with existing workflows
    - _Requirements: 7.3, 7.4, 11.1, 11.3_

- [ ] 9. Multi-Module Support Implementation

  - [ ] 9.1 Add module-specific review configurations

    - Implement module type filtering in all components
    - Add module-specific validation rules
    - Include module context in all API calls
    - Test review functionality across k12, post-secondary, and tutoring modules
    - _Requirements: 11.1, 11.2, 11.3, 11.4_

  - [ ] 9.2 Create module-agnostic review workflows
    - Ensure consistent review stages across all modules
    - Implement unified permission model for all module types
    - Add module type indicators in review interfaces
    - Test workflow transitions for each module type
    - _Requirements: 11.1, 11.3, 11.5_

- [ ] 10. Testing and Quality Assurance

  - [ ] 10.1 Write API endpoint tests

    - Create comprehensive test suite for all review API endpoints
    - Test customer isolation enforcement across all operations
    - Verify RBAC permissions for different user roles
    - Include error handling and edge case testing
    - _Requirements: 5.1, 5.2, 6.1, 6.2, 6.3, 6.4_

  - [ ] 10.2 Write React component tests

    - Create unit tests for all review UI components
    - Test comment threading and suggestion workflows
    - Verify proper state management and data flow
    - Include accessibility testing for review interfaces
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

  - [ ] 10.3 Perform integration testing

    - Test complete review workflows end-to-end
    - Verify integration with existing versioning system
    - Test multi-user collaboration scenarios
    - Validate audit trail completeness and accuracy
    - _Requirements: 7.1, 7.2, 7.3, 10.1, 10.2, 10.3_

  - [ ]\* 10.4 Performance testing and optimization
    - Test comment loading performance with large datasets
    - Optimize database queries and add pagination where needed
    - Verify responsive performance across different devices
    - Test concurrent user scenarios and data consistency
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [ ] 11. Documentation and Deployment Preparation

  - [ ] 11.1 Update system documentation

    - Document new API endpoints and data models
    - Update user guides with review system workflows
    - Create admin documentation for review management
    - Include troubleshooting guides for common issues
    - _Requirements: 10.5, 11.1, 11.3_

  - [ ] 11.2 Prepare production deployment

    - Verify database migration safety on production data
    - Test review system with existing production workflows
    - Prepare rollback procedures and monitoring
    - Create deployment checklist and validation steps
    - _Requirements: 7.1, 7.2, 7.4, 7.5_

  - [ ]\* 11.3 Create user training materials
    - Develop user guides for review workflows
    - Create video tutorials for complex features
    - Prepare admin training for review management
    - Document best practices for collaborative review
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_
