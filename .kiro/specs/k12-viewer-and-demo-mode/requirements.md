# Requirements Document

## Introduction

This feature wires up the existing K12ReportViewer (built per the k12-report-viewer spec) to display K-12 assessment reports for NEW reports going forward, and provides a presentation mode that bypasses authentication using a secret URL. The K12ReportViewer provides a modern, modular interface with section-based navigation and enhanced formatting. The system will continue to store reports as markdown in the database, parsing them on-the-fly to populate the viewer components.

## Glossary

- **K12ReportViewer**: A React component that displays K-12 assessment reports using a config-driven, modular architecture with section-based navigation
- **BaseReportGenerator**: The current component that renders reports as markdown
- **Presentation Mode**: A secret URL-based authentication bypass that allows access to the system without login credentials for presentation purposes
- **Compact View Report**: The existing markdown-based report format that needs to be displayed in the new viewer
- **Assessment Case**: A student assessment record containing analysis results and report data
- **Section Registry**: A configuration system that maps report sections to their display components
- **Structured Report Data**: Report content organized as typed objects (sections, strengths, challenges) rather than raw markdown

## Requirements

### Requirement 1

**User Story:** As a user viewing K-12 reports, I want to see NEW reports in the enhanced viewer format, so that I can navigate sections easily and have a better reading experience

#### Acceptance Criteria

1. WHEN a user navigates to a K-12 report, THE System SHALL display the report using the K12ReportViewer component
2. WHEN the K12ReportViewer loads, THE System SHALL parse markdown report data into structured format for display
3. WHEN a report section is selected, THE System SHALL display the corresponding section content
4. WHEN multiple assessment cases exist, THE System SHALL provide a case selection interface
5. WHILE viewing a report, THE System SHALL maintain navigation state and allow switching between sections

### Requirement 2

**User Story:** As a developer, I want to parse markdown reports into structured data on-the-fly, so that the K12ReportViewer can display them without changing the database format

#### Acceptance Criteria

1. THE System SHALL extract case information from markdown reports
2. THE System SHALL parse strengths sections into structured arrays with "What You See" and "What to Do" items
3. THE System SHALL parse challenges sections into structured arrays with "What You See" and "What to Do" items
4. THE System SHALL parse support strategies into structured objects
5. THE System SHALL handle missing or malformed sections gracefully with default content

### Requirement 3

**User Story:** As a presenter demonstrating the system, I want to access the application via a secret URL without logging in, so that I can quickly show features during presentations

#### Acceptance Criteria

1. WHEN a user navigates to a URL with a secret presentation token, THE System SHALL grant access without requiring authentication
2. THE System SHALL restrict presentation mode access to read-only operations
3. THE System SHALL NOT display any visual indicator of presentation mode to maintain secrecy
4. WHEN the presentation token is invalid, THE System SHALL redirect to the login page without revealing the feature exists
5. THE System SHALL log presentation mode access for security auditing

### Requirement 4

**User Story:** As a developer, I want to maintain backward compatibility with existing functionality, so that nothing breaks when we switch to the new viewer

#### Acceptance Criteria

1. THE System SHALL continue to store reports as markdown in the database
2. THE System SHALL maintain the existing compact view PDF generation functionality
3. THE System SHALL maintain all existing report generation functionality
4. THE System SHALL preserve report metadata and timestamps
5. THE System SHALL continue to support the existing markdown-based editing functionality

### Requirement 5

**User Story:** As a user, I want to edit reports, so that I can make corrections and updates to assessment content

#### Acceptance Criteria

1. WHEN a user clicks the "Review" button in the sidebar, THE System SHALL navigate to the existing K-12 Review & Edit page
2. THE System SHALL pass the current case ID to the Review & Edit page
3. THE Review & Edit page SHALL continue to use the existing markdown-based editing functionality
4. WHEN a user returns from editing, THE System SHALL refresh the report display with updated content
5. THE System SHALL display the Review button only when the user has edit permissions

### Requirement 6

**User Story:** As a user, I want section content to load quickly, so that I can navigate through reports without delays

#### Acceptance Criteria

1. WHEN a section is first accessed, THE System SHALL load it within 500 milliseconds
2. THE System SHALL cache loaded sections for the current session
3. THE System SHALL display a loading indicator while sections are being fetched
4. WHEN network errors occur, THE System SHALL display an error message with retry option
5. THE System SHALL preload the next likely section based on navigation patterns
