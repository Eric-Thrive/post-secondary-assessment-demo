# Design Document

## Overview

This design document outlines the technical approach for wiring up the existing K12ReportViewer (built per the k12-report-viewer spec) to display K-12 reports for NEW reports going forward, and implementing a secret presentation mode for authentication bypass during demonstrations.

The K12ReportViewer already exists with a modular, design-system-based architecture. This implementation focuses on:

1. Connecting the existing viewer to K12ReportGenerator (replacing BaseReportGenerator)
2. Parsing markdown reports on-the-fly into the structure expected by the viewer
3. Maintaining backward compatibility (markdown storage, compact view PDF, editing)
4. Adding presentation mode authentication bypass

**Key Design Decision:** Reports will continue to be stored as markdown in the database. We will parse markdown into structured data at render time, not at generation time. This maintains compatibility with existing editing functionality and the compact view PDF.

## Architecture

### Component Relationships

1. **K12ReportGenerator** → Entry point, fetches assessment data, replaces BaseReportGenerator
2. **K12ReportViewer** → Main viewer component with sidebar navigation (already built)
3. **MarkdownParser** → Transforms markdown into structured data for viewer
4. **Section Content Components** → Already built, display parsed data
5. **K12ReviewEditReports** → Existing editing page (unchanged)
6. **Presentation Mode** → Secret URL-based authentication bypass

### Key Design Principles

- **Backward Compatibility**: Keep markdown as source of truth
- **Minimal Changes**: Leverage existing K12ReportViewer (already built)
- **Parse at Render**: Transform markdown → structured data when displaying
- **Maintain Editing**: Keep existing markdown-based editing functionality

## Components and Interfaces

### 1. K12ReportViewer Component (Already Built)

**Purpose**: Main viewer component with sidebar navigation and section-based display.

**Location**: `apps/web/src/components/k12/K12ReportViewer.tsx`

**Status**: ✅ Already implemented per k12-report-viewer spec

**What it expects**: Structured data (not markdown)

**What we need to do**: Parse markdown and pass structured data to it

### 2. Markdown Parser Utility (New)

**Purpose**: Parse markdown reports into structured data for K12ReportViewer.

**Location**: `apps/web/src/utils/k12ReportParser.ts`

**Key Functions**:

```typescript
// Main parser - converts markdown to structured report data
function parseK12Report(markdown: string): K12ReportData;

// Extract case information from markdown
function extractCaseInfo(markdown: string): CaseInfo;

// Parse strengths section (3 categories: language, social, reasoning)
function parseStrengths(markdown: string): Strength[];

// Parse challenges section
function parseChallenges(markdown: string): Challenge[];

// Parse support strategies
function parseStrategies(markdown: string): Strategy[];

// Parse student overview
function parseOverview(markdown: string): Overview;
```

**Parsing Strategy**:

- Use regex to find section headers (`## Section Name`)
- Extract content between headers
- Parse lists and tables within sections
- Handle missing sections with defaults
- Return structured objects that match K12ReportViewer's expected format

### 3. Updated K12ReportGenerator (Main Change)

**Location**: `apps/web/src/components/K12ReportGenerator.tsx`

**Changes**:

```typescript
import { parseK12Report } from "@/utils/k12ReportParser";
import K12ReportViewer from "@/components/k12/K12ReportViewer";

// Before: Uses BaseReportGenerator
// return <BaseReportGenerator config={MODULE_CONFIGS.k12} />;

// After: Parse markdown and use K12ReportViewer
const parsedData = parseK12Report(markdownReport);

return (
  <div>
    <AppNavigation />
    <K12ReportViewer
      reportData={parsedData}
      caseId={currentCase.case_id || currentCase.id}
      initialSection="case-info"
    />
  </div>
);
```

**Key Point**: This is the main integration point - parse markdown and pass to existing viewer.

### 4. Section Content Components (Already Built)

**Status**: ✅ Already implemented per k12-report-viewer spec

**Location**: `apps/web/src/components/k12/content/`

**Components**:

- CaseInformationContent
- DocumentsReviewedContent
- StudentOverviewContent
- SupportStrategiesContent
- StudentStrengthsContent
- StudentChallengesContent
- ReportCompleteContent

**What we need to do**: Pass parsed data to these components

### 5. Editing Integration (No Changes Needed)

**Current Approach**: Navigate to existing K12ReviewEditReports page

**Flow**:

1. User clicks "Review" button in sidebar
2. Navigate to `/k12-review-edit/:caseId`
3. Existing markdown editor loads
4. User edits markdown directly
5. Save updates markdown in database
6. Return to viewer, which re-parses updated markdown

**Why this works**: Markdown remains the source of truth, so existing editing functionality continues to work without changes.

### 6. Presentation Mode Implementation

**Backend**: `apps/server/auth.ts`

**New Middleware**:

```typescript
export const presentationModeAuth = async (req, res, next) => {
  const token = req.query.p;
  if (token && token === process.env.PRESENTATION_MODE_TOKEN) {
    // Create read-only session
    req.session.userId = -1; // Special presentation user
    req.session.presentationMode = true;
    console.log(`🎭 Presentation mode access from ${req.ip}`);
  }
  next();
};
```

**Frontend**: Check for `?p=<token>` parameter on app load

**Environment Variable**: `PRESENTATION_MODE_TOKEN` (64-character random string)

## Data Models

### Parsed Report Data Structure

```typescript
interface ParsedReportData {
  caseInfo: {
    studentName: string;
    grade?: string;
    assessmentDate: string;
    caseId: string;
  };
  studentOverview: string;
  keyStrategies: string[];
  strengths: {
    spokenLanguage: { whatYouSee: string[]; whatToDo: string[] };
    socialInteraction: { whatYouSee: string[]; whatToDo: string[] };
    reasoning: { whatYouSee: string[]; whatToDo: string[] };
  };
  challenges: Array<{
    challenge: string;
    whatYouSee: string;
    whatToDo: string[];
  }>;
}
```

## Error Handling

- **Markdown Parsing**: Graceful degradation with fallback to original markdown display
- **Missing Sections**: Provide default content
- **Presentation Mode**: Silent failure - redirect to login without revealing feature
- **Edit Save Failures**: Show error and preserve user's edits

## Testing Strategy

### Unit Tests

- Markdown parser with various report formats
- Component rendering and navigation
- Presentation mode token validation

### Integration Tests

- End-to-end report display flow
- Presentation mode authentication
- Backward compatibility with existing reports

## Security Considerations

### Presentation Mode

- Cryptographically secure token (64+ characters)
- Read-only access enforced at API level
- Audit logging with IP and timestamp
- 2-hour session timeout
- No visual indicators in UI

### Data Security

- Sanitize all parsed content
- Validate user permissions for edits
- Prevent XSS and injection attacks

## Performance Considerations

- Parse markdown on-demand with memoization
- Lazy load section components
- Cache parsed results in component state
- Minimize API calls

## Migration Strategy

1. **Phase 1**: Implement alongside existing display with feature flag
2. **Phase 2**: Gradual rollout to K-12 module users
3. **Phase 3**: Make default and remove old code

**Rollback Plan**: Keep old display code for 2 releases with feature flag

## Dependencies

Uses existing dependencies:

- react-markdown
- remark-gfm
- lucide-react
- express-session
- crypto
