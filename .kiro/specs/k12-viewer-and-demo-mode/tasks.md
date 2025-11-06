# Implementation Plan

- [ ] 1. Create markdown parser utility

  - [x] 1.1 Create k12ReportParser.ts utility file

    - Create `apps/web/src/utils/k12ReportParser.ts`
    - Define TypeScript interfaces for parsed data structures
    - Implement main `parseK12Report(markdown: string)` function
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 1.2 Implement case information extraction

    - Extract student name from report header or content
    - Extract grade, school year, tutor/case manager from markdown
    - Extract assessment dates (created, last updated)
    - Handle missing case information with defaults
    - _Requirements: 2.1_

  - [x] 1.3 Implement strengths parsing

    - Parse strengths section from markdown using regex patterns
    - Organize into three categories: Spoken Language, Social Interaction, Reasoning
    - Extract "What You See" and "What to Do" items for each strength
    - Handle different markdown formats (bullets, numbered lists, tables)
    - _Requirements: 2.2_

  - [x] 1.4 Implement challenges parsing

    - Parse challenges section from markdown
    - Extract challenge name, "What You See", and "What to Do" items
    - Handle table format and list format challenges
    - Parse do/don't items with appropriate indicators
    - _Requirements: 2.3_

  - [x] 1.5 Implement support strategies parsing

    - Parse key support strategies section
    - Extract strategy names and descriptions
    - Handle both list and paragraph formats
    - _Requirements: 2.4_

  - [x] 1.6 Implement student overview parsing
    - Parse student overview section
    - Extract "At a Glance" summary
    - Parse subsections (Academic & Learning Profile, Challenges & Diagnosis, Social-Emotional & Supports)
    - _Requirements: 2.5_

- [x] 2. Update K12ReportGenerator component

  - [x] 2.1 Import K12ReportViewer and parser

    - Add import for K12ReportViewer from `@/components/k12/K12ReportViewer`
    - Using parseK12ReportSimple (correct for current table-based format)
    - Fixed cache issue: Added PARSER_VERSION to cache key to prevent stale cache
    - _Requirements: 1.1, 1.2_

  - [x] 2.2 Implement markdown parsing and data passing

    - Parse markdownReport using parseK12Report utility
    - Pass parsed data to K12ReportViewer component
    - Handle parsing errors with fallback to BaseReportGenerator
    - Pass case ID and initial section to K12ReportViewer
    - _Requirements: 1.1, 1.2, 1.3_

  - [x] 2.3 Add error handling and fallback
    - Wrap parsing in try-catch block
    - Log parsing errors for debugging
    - Fall back to BaseReportGenerator if parsing fails
    - Display user-friendly error message if needed
    - _Requirements: 1.4, 1.5_

- [x] 3. Implement presentation mode authentication

  - [x] 3.1 Create presentation mode middleware

    - Add presentationModeAuth middleware to `apps/server/auth.ts`
    - Check for `p` query parameter containing presentation token
    - Validate token against PRESENTATION_MODE_TOKEN environment variable
    - Create temporary read-only session for valid tokens
    - _Requirements: 3.1, 3.2, 3.4_

  - [x] 3.2 Add presentation mode logging

    - Log presentation mode access with IP address and timestamp
    - Include security audit information
    - Log invalid token attempts (without revealing the feature exists)
    - _Requirements: 3.5_

  - [x] 3.3 Apply presentation mode middleware to routes

    - Add presentationModeAuth middleware to authentication routes
    - Ensure it runs before requireAuth middleware
    - Test with valid and invalid tokens
    - _Requirements: 3.1, 3.4_

  - [x] 3.4 Implement frontend presentation mode detection

    - Check for `p` query parameter on app load
    - Store presentation token in session storage (not localStorage)
    - Remove token from URL after processing to hide it
    - Automatically authenticate with backend using token
    - _Requirements: 3.1, 3.3_

  - [x] 3.5 Generate and document presentation token
    - Generate cryptographically secure 64-character token
    - Add PRESENTATION_MODE_TOKEN to environment variables
    - Document token usage and security considerations
    - Test token validation and session creation
    - _Requirements: 3.2, 3.4_

- [x] 4. Test integration and compatibility

  - [x] 4.1 Test K12ReportViewer with parsed data

    - Test with various K-12 markdown report formats
    - Verify all sections display correctly in the viewer
    - Test navigation between sections
    - Verify case information displays properly
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [x] 4.2 Test backward compatibility

    - Verify compact view PDF generation still works
    - Test existing K12ReviewEditReports editing functionality
    - Ensure markdown storage and retrieval unchanged
    - Test fallback to BaseReportGenerator on parsing errors
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [x] 4.3 Test presentation mode functionality

    - Test valid presentation token access
    - Test invalid token handling (silent redirect to login)
    - Verify read-only access restrictions
    - Test session timeout and cleanup
    - Verify no visual indicators of presentation mode
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 4.4 Test editing workflow integration
    - Test "Review" button navigation to K12ReviewEditReports
    - Edit markdown content and save changes
    - Return to K12ReportViewer and verify updated content displays
    - Test that parsed data reflects markdown changes
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 5. Performance and error handling

  - [x] 5.1 Optimize markdown parsing performance

    - Add memoization to parseK12Report function
    - Cache parsed results in component state
    - Avoid re-parsing on every render
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [x] 5.2 Add comprehensive error handling

    - Handle malformed markdown gracefully
    - Provide default content for missing sections
    - Log parsing errors without breaking the UI
    - Show user-friendly error messages when appropriate
    - _Requirements: 2.5, 4.4_

  - [x] 5.3 Add loading states and transitions
    - Show loading indicator while parsing large reports
    - Add smooth transitions between sections
    - Handle slow network requests gracefully
    - _Requirements: 1.3, 1.5_

- [x] 6. Documentation and cleanup

  - [x] 6.1 Document parser utility

    - Add JSDoc comments to all parser functions
    - Document expected markdown format and structure
    - Provide examples of input and output data
    - Document error handling and fallback behavior
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 6.2 Document presentation mode setup

    - Document environment variable setup
    - Provide security guidelines for token management
    - Document URL format and usage instructions
    - Add troubleshooting guide for common issues
    - _Requirements: 3.1, 3.2, 3.4, 3.5_

  - [x] 6.3 Update component documentation
    - Document K12ReportGenerator changes
    - Update integration examples and usage
    - Document fallback behavior and error handling
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

---

## Task Summary

**Total Tasks**: 6 main tasks with 21 subtasks
**Estimated Time**: 1-2 weeks

### Key Implementation Points:

1. **Parser First**: Build and test the markdown parser before integrating with K12ReportViewer
2. **Gradual Integration**: Update K12ReportGenerator incrementally with fallback to BaseReportGenerator
3. **Security Focus**: Implement presentation mode with proper security measures and logging
4. **Compatibility Testing**: Ensure all existing functionality (compact view, editing) continues to work
5. **Error Handling**: Graceful degradation when parsing fails or data is malformed

### Success Criteria:

- ✅ K12ReportViewer displays parsed markdown reports correctly
- ✅ All existing functionality (compact view PDF, editing) continues to work
- ✅ Presentation mode provides secure authentication bypass
- ✅ Parser handles various markdown formats gracefully
- ✅ Performance is acceptable for typical report sizes
- ✅ Error handling prevents UI breaks on malformed data

### Dependencies:

- K12ReportViewer component (already built)
- Existing K12ReviewEditReports editing functionality
- Current markdown report generation and storage
- Authentication system for presentation mode integration
  c
