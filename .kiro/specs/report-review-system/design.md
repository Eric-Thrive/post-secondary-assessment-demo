# Report Review & Commenting System - Design Document

## Overview

The Report Review & Commenting System provides asynchronous collaborative review capabilities for educational assessment reports across all modules (k12, post-secondary, tutoring). The system enables human reviewer feedback, track changes workflow, and structured approval processes while maintaining complete audit trails for compliance.

**Current Scope:**

- Human-generated comments and suggestions
- Track changes workflow (insert/delete/replace)
- Review stage management and approval
- Complete audit trail for compliance
- Multi-module support (k12, post-secondary, tutoring)

**Future Features (Roadmap):**

- AI-generated quality comments will be generated externally and passed to the review system
- The review system will display, manage, and allow resolution of AI comments
- AI comment rules and configuration (table structure prepared)

**Key Design Principles:**

- **Asynchronous**: No real-time collaboration complexity - all interactions are stateful
- **Module-agnostic**: Consistent functionality across all assessment types
- **Audit-first**: Complete immutable history of all actions for compliance
- **Additive**: Extends existing versioning without disrupting current workflows
- **Secure**: Maintains existing customer isolation and RBAC patterns

## Architecture

### High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React)                          │
├──────────────────┬──────────────────┬──────────────────────┤
│  Report Editor   │  Comment Panel   │  Review Dashboard    │
│  - Markdown view │  - Thread view   │  - Workflow stages   │
│  - Track changes │  - AI/Human      │  - Approval actions  │
│  - Anchor points │  - Filters       │  - Audit reports     │
└──────────────────┴──────────────────┴──────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                   API Layer (Express)                        │
├──────────────────┬──────────────────┬──────────────────────┤
│  Comments API    │  Suggestions API │  Reviews API         │
│  CRUD + threads  │  Accept/Reject   │  Workflow + Audit    │
│  AI generation   │  Track changes   │  Stage transitions   │
└──────────────────┴──────────────────┴──────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                Database (Neon PostgreSQL)                    │
├──────────────────┬──────────────────┬──────────────────────┤
│ report_comments  │ report_suggestions│ report_reviews       │
│ (AI + Human)     │ (Track Changes)  │ (Workflow + Metrics) │
│                  │                  │                      │
│ ai_comment_rules │ audit_trail      │ assessmentCases      │
│ (Configurable)   │ (Compliance)     │ (Extended)           │
└──────────────────┴──────────────────┴──────────────────────┘
```

### Data Flow Architecture

```
Report Generation → Human Reviewer → View Report → Add Comments/Suggestions
                                                            ↓
Team Lead → Review Suggestions → Accept/Reject → Update Report
                                                            ↓
Final Approval → Create Finalized Version → Audit Trail → Archive

Future: AI System → Generate Comments in Markdown → Review System Displays/Manages
```

## Components and Interfaces

### Database Schema Design

#### Core Tables

**1. report_comments**

- **Purpose**: Store all comments (AI and human) with threading support
- **Key Features**:
  - Thread grouping via `thread_id`
  - Anchor positioning for precise location tracking
  - Priority levels for triage
  - Status tracking (open/resolved/dismissed)
  - Module-aware for filtering

```sql
CREATE TABLE report_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_case_id UUID NOT NULL REFERENCES assessment_cases(id) ON DELETE CASCADE,

  -- Comment metadata
  comment_type TEXT NOT NULL CHECK (comment_type IN ('ai_review', 'human_review', 'general')),
  author_id INTEGER REFERENCES users(id), -- NULL for AI
  author_name TEXT NOT NULL,

  -- Content
  content TEXT NOT NULL,
  markdown_content TEXT, -- Rich formatting

  -- Position anchoring
  anchor_type TEXT NOT NULL CHECK (anchor_type IN ('section', 'paragraph', 'line', 'selection')),
  anchor_id TEXT, -- Section key
  anchor_text TEXT, -- Context snippet
  anchor_position JSONB, -- Precise coordinates

  -- Threading
  parent_comment_id UUID REFERENCES report_comments(id) ON DELETE CASCADE,
  thread_id UUID NOT NULL,

  -- Status and priority
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'dismissed')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),

  -- Categorization
  tags JSONB DEFAULT '[]'::jsonb,
  module_type TEXT NOT NULL, -- k12, post_secondary, tutoring

  -- Resolution tracking
  resolved_at TIMESTAMPTZ,
  resolved_by_user_id INTEGER REFERENCES users(id),
  resolved_note TEXT,

  -- Multi-tenancy
  customer_id TEXT NOT NULL,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**2. report_suggestions**

- **Purpose**: Track changes system (insert/delete/replace operations)
- **Key Features**:
  - Links to related AI comments
  - Stores original and suggested text
  - Position tracking for accurate application
  - Approval workflow with rationale

```sql
CREATE TABLE report_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_case_id UUID NOT NULL REFERENCES assessment_cases(id) ON DELETE CASCADE,

  -- Suggestion metadata
  suggestion_type TEXT NOT NULL CHECK (suggestion_type IN ('insert', 'delete', 'replace')),
  author_id INTEGER NOT NULL REFERENCES users(id),
  author_name TEXT NOT NULL,

  -- Relationship to comments
  related_comment_id UUID REFERENCES report_comments(id),

  -- Change details
  section_key TEXT NOT NULL,
  original_text TEXT, -- For delete/replace
  suggested_text TEXT, -- For insert/replace
  change_reason TEXT,

  -- Position tracking
  position JSONB NOT NULL, -- {start: number, end: number, line: number}

  -- Review workflow
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  reviewed_by_user_id INTEGER REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  review_note TEXT,

  -- Module context
  module_type TEXT NOT NULL,

  -- Multi-tenancy
  customer_id TEXT NOT NULL,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**3. report_reviews**

- **Purpose**: Workflow state management and metrics tracking
- **Key Features**:
  - Stage progression tracking
  - Real-time metrics via triggers
  - Approval decision recording
  - Module-specific workflow support

**4. ai_comment_rules** _(Future Feature)_

- **Purpose**: Configuration for future AI comment generation
- **Key Features**:
  - Module-specific rules (for future implementation)
  - JSON-based trigger conditions (for future implementation)
  - Template-based comment generation (for future implementation)
  - Enable/disable controls (for future implementation)
- **Current Status**: Table structure prepared but not actively used

#### Extended Tables

**5. assessmentCases (extended)**

- **New Fields**:
  - `review_enabled BOOLEAN DEFAULT TRUE`
  - `current_review_stage TEXT DEFAULT 'draft'`
  - `last_reviewed_at TIMESTAMPTZ`
  - `last_reviewed_by_user_id INTEGER`

**6. audit_trail (new)**

- **Purpose**: Immutable audit log for compliance
- **Key Features**:
  - Action type classification
  - Before/after state capture
  - User and timestamp tracking
  - Export functionality

### API Interface Design

#### RESTful Endpoint Structure

**Base Pattern**: `/api/assessment-cases/:caseId/review/*`

**Comments API**

```typescript
// Get comments with filtering
GET /api/assessment-cases/:caseId/comments
Query: status, commentType, moduleType, priority

// Create comment
POST /api/assessment-cases/:caseId/comments
Body: CommentCreateRequest

// Reply to comment
POST /api/assessment-cases/:caseId/comments/:commentId/replies
Body: CommentReplyRequest

// Resolve comment
PATCH /api/assessment-cases/:caseId/comments/:commentId/resolve
Body: CommentResolveRequest

// Get comment thread
GET /api/assessment-cases/:caseId/comments/:threadId/thread
```

**Suggestions API**

```typescript
// Get suggestions
GET /api/assessment-cases/:caseId/suggestions
Query: status, authorId, sectionKey

// Create suggestion
POST /api/assessment-cases/:caseId/suggestions
Body: SuggestionCreateRequest

// Accept suggestion
POST /api/assessment-cases/:caseId/suggestions/:suggestionId/accept
Body: SuggestionReviewRequest

// Reject suggestion
POST /api/assessment-cases/:caseId/suggestions/:suggestionId/reject
Body: SuggestionReviewRequest

// Batch operations
POST /api/assessment-cases/:caseId/suggestions/batch
Body: BatchSuggestionRequest
```

**Review Workflow API**

```typescript
// Get review status
GET /api/assessment-cases/:caseId/review

// Update review stage
PATCH /api/assessment-cases/:caseId/review/stage
Body: ReviewStageUpdateRequest

// Approve report
POST /api/assessment-cases/:caseId/review/approve
Body: ReviewApprovalRequest

// Request changes
POST /api/assessment-cases/:caseId/review/request-changes
Body: ReviewChangeRequest

// Get audit trail
GET /api/assessment-cases/:caseId/review/audit
Query: startDate, endDate, actionType
```

**AI Comment Integration API** _(Future Feature)_

```typescript
// Endpoint for external AI systems to submit comments
POST /api/assessment-cases/:caseId/comments/ai-generated
Body: AICommentSubmissionRequest

// This endpoint will be used by future AI systems to submit
// pre-generated comments that the review system will display and manage
```

#### Data Transfer Objects

```typescript
interface CommentCreateRequest {
  commentType: "human_review" | "general";
  content: string;
  anchorType: "section" | "paragraph" | "line" | "selection";
  anchorId?: string;
  anchorText?: string;
  anchorPosition?: AnchorPosition;
  priority?: "low" | "medium" | "high" | "critical";
  tags?: string[];
}

interface SuggestionCreateRequest {
  suggestionType: "insert" | "delete" | "replace";
  sectionKey: string;
  originalText?: string;
  suggestedText?: string;
  changeReason?: string;
  relatedCommentId?: string;
  position: TextPosition;
}

interface ReviewApprovalRequest {
  reviewNotes?: string;
  createFinalizedVersion: boolean;
  notifyStakeholders?: boolean;
}

interface AuditTrailEntry {
  id: string;
  actionType: string;
  entityType: string;
  entityId: string;
  userId: number;
  userName: string;
  beforeState?: any;
  afterState?: any;
  timestamp: string;
  moduleType: string;
  customerId: string;
}
```

### Frontend Component Architecture

#### Component Hierarchy

```
ReportReviewView
├── ReviewHeader
│   ├── ReviewStageIndicator
│   ├── ReviewMetrics
│   └── ReviewActions
├── ReviewContent (2-column layout)
│   ├── MarkdownEditor (70% width)
│   │   ├── MarkdownRenderer
│   │   ├── TrackChangesOverlay
│   │   ├── CommentAnchors
│   │   └── SuggestionHighlights
│   └── ReviewSidebar (30% width)
│       ├── CommentPanel
│       │   ├── CommentFilters
│       │   ├── CommentThreadList
│       │   └── CommentForm
│       ├── SuggestionPanel
│       │   ├── SuggestionFilters
│       │   ├── SuggestionList
│       │   └── SuggestionActions
│       └── ReviewPanel
│           ├── WorkflowControls
│           ├── AuditTrail
│           └── ExportOptions
└── ReviewFooter
    ├── SaveStatus
    ├── ReviewProgress
    └── NavigationControls
```

#### Key Component Specifications

**CommentThread Component**

```typescript
interface CommentThreadProps {
  threadId: string;
  comments: Comment[];
  onReply: (commentId: string, content: string) => void;
  onResolve: (commentId: string, note?: string) => void;
  onEdit: (commentId: string, content: string) => void;
  canModerate: boolean;
  moduleType: ModuleType;
}
```

**SuggestionItem Component**

```typescript
interface SuggestionItemProps {
  suggestion: Suggestion;
  onAccept: (suggestionId: string, note?: string) => void;
  onReject: (suggestionId: string, note: string) => void;
  onPreview: (suggestionId: string) => void;
  canReview: boolean;
  showDiff: boolean;
}
```

**TrackChangesOverlay Component**

```typescript
interface TrackChangesOverlayProps {
  suggestions: Suggestion[];
  onSuggestionClick: (suggestionId: string) => void;
  onTextSelect: (selection: TextSelection) => void;
  highlightMode: "all" | "pending" | "accepted" | "rejected";
}
```

## Data Models

### Core Domain Models

```typescript
// Comment domain model
interface Comment {
  id: string;
  assessmentCaseId: string;
  commentType: "ai_review" | "human_review" | "general";
  authorId?: number;
  authorName: string;
  content: string;
  markdownContent?: string;

  // Anchoring
  anchorType: "section" | "paragraph" | "line" | "selection";
  anchorId?: string;
  anchorText?: string;
  anchorPosition?: AnchorPosition;

  // Threading
  parentCommentId?: string;
  threadId: string;
  replies?: Comment[];

  // Status
  status: "open" | "resolved" | "dismissed";
  priority: "low" | "medium" | "high" | "critical";
  tags: string[];

  // Resolution
  resolvedAt?: string;
  resolvedByUserId?: number;
  resolvedNote?: string;

  // Context
  moduleType: ModuleType;
  customerId: string;

  // Audit
  createdAt: string;
  lastUpdated: string;
}

// Suggestion domain model
interface Suggestion {
  id: string;
  assessmentCaseId: string;
  suggestionType: "insert" | "delete" | "replace";
  authorId: number;
  authorName: string;

  // Relationship
  relatedCommentId?: string;
  relatedComment?: Comment;

  // Change details
  sectionKey: string;
  originalText?: string;
  suggestedText?: string;
  changeReason?: string;
  position: TextPosition;

  // Review
  status: "pending" | "accepted" | "rejected";
  reviewedByUserId?: number;
  reviewedAt?: string;
  reviewNote?: string;

  // Context
  moduleType: ModuleType;
  customerId: string;

  // Audit
  createdAt: string;
  lastUpdated: string;
}

// Review workflow model
interface ReviewWorkflow {
  id: string;
  assessmentCaseId: string;
  reviewStage:
    | "draft"
    | "ai_review"
    | "peer_review"
    | "final_review"
    | "approved";
  reviewerUserId?: number;
  reviewerName?: string;

  // Status
  approvalStatus?: "approved" | "rejected" | "needs_changes";
  reviewNotes?: string;

  // Metrics
  totalComments: number;
  unresolvedComments: number;
  totalSuggestions: number;
  pendingSuggestions: number;

  // Breakdown
  aiComments: number;
  aiCommentsResolved: number;
  humanSuggestions: number;
  aiRelatedSuggestions: number;

  // Context
  moduleType: ModuleType;
  customerId: string;

  // Audit
  createdAt: string;
  completedAt?: string;
  lastUpdated: string;
}
```

### Supporting Models

```typescript
interface AnchorPosition {
  start: number;
  end: number;
  sectionKey: string;
  line?: number;
  column?: number;
}

interface TextPosition {
  start: number;
  end: number;
  line: number;
  sectionKey: string;
}

interface AICommentRule {
  id: string;
  ruleKey: string;
  ruleName: string;
  triggerCondition: TriggerCondition;
  commentTemplate: string;
  priority: "low" | "medium" | "high" | "critical";
  tags: string[];
  isActive: boolean;
  moduleType: ModuleType;
}

interface TriggerCondition {
  type:
    | "confidence_threshold"
    | "missing_field"
    | "text_length"
    | "text_pattern";
  threshold?: number;
  field?: string;
  minLength?: number;
  pattern?: string;
  section?: string;
}
```

## Error Handling

### Error Classification

**1. Validation Errors (400)**

- Invalid comment content
- Missing required fields
- Invalid anchor positions
- Malformed suggestion data

**2. Authorization Errors (403)**

- Insufficient permissions for action
- Customer isolation violations
- Module access restrictions
- Review stage transition violations

**3. Not Found Errors (404)**

- Comment/suggestion not found
- Assessment case not found
- Thread not found
- Invalid anchor references

**4. Conflict Errors (409)**

- Concurrent modification conflicts
- Invalid workflow state transitions
- Suggestion position conflicts
- Review stage violations

**5. System Errors (500)**

- Database connection failures
- AI service unavailable
- Audit trail write failures
- External service timeouts

### Error Response Format

```typescript
interface ErrorResponse {
  error: string;
  code: string;
  details?: any;
  timestamp: string;
  requestId: string;
  moduleType?: ModuleType;
  demo?: boolean; // For demo-specific messaging
}

// Example error responses
{
  "error": "Cannot accept suggestion in current review stage",
  "code": "INVALID_WORKFLOW_STATE",
  "details": {
    "currentStage": "draft",
    "requiredStage": "peer_review",
    "suggestionId": "uuid-123"
  },
  "timestamp": "2025-10-28T15:30:00Z",
  "requestId": "req-456"
}
```

## Testing Strategy

### Unit Testing

**Backend Testing**

- Storage layer methods with customer isolation
- AI comment rule evaluation logic
- Suggestion application algorithms
- Workflow state transition validation
- Audit trail generation

**Frontend Testing**

- Comment thread rendering and interaction
- Suggestion diff visualization
- Review workflow controls
- Filter and search functionality
- Anchor position calculations

### Integration Testing

**API Integration**

- End-to-end comment workflows
- Suggestion acceptance with report updates
- Review stage transitions
- Multi-user collaboration scenarios
- Customer isolation enforcement

**Database Integration**

- Foreign key constraint validation
- Trigger-based metric updates
- Cascade deletion behavior
- Index performance verification
- Audit trail completeness

### User Acceptance Testing

**Workflow Testing**

- Complete review cycle (draft → approved)
- AI comment generation and resolution
- Multi-reviewer collaboration
- Suggestion conflict resolution
- Audit trail export and review

**Module-Specific Testing**

- K12 report review workflows
- Post-secondary report review workflows
- Tutoring report review workflows
- Module-specific AI comment rules
- Cross-module consistency verification

### Performance Testing

**Load Testing**

- Comment loading with 100+ comments per case
- Suggestion processing with large text changes
- Concurrent user review scenarios
- Database query performance under load
- Audit trail query performance

**Scalability Testing**

- Multi-tenant isolation under load
- Large comment thread performance
- Bulk suggestion operations
- Export functionality with large datasets
- Real-time metric calculation performance

---

## Implementation Notes

### Phase 1: Database and Core API (Weeks 1-2)

- Apply database migration
- Implement storage layer extensions
- Create core CRUD APIs
- Add customer isolation enforcement
- Implement basic audit trail

### Phase 2: Future AI Integration Preparation (Week 3) _(Optional - Future Feature)_

- Prepare AI comment ingestion endpoint
- Create AI comment display differentiation
- Design AI comment resolution workflows
- Prepare rule management interface structure
- Document AI comment integration patterns

**Note**: This phase can be skipped for initial implementation as AI comments are a future roadmap feature.

### Phase 3: Frontend Foundation (Week 4)

- Create React hooks for data fetching
- Build basic comment components
- Implement comment threading
- Add filtering and search
- Create suggestion list interface

### Phase 4: Track Changes UI (Week 5)

- Implement visual diff rendering
- Add suggestion creation interface
- Build accept/reject workflows
- Create position tracking system
- Add conflict resolution handling

### Phase 5: Review Workflow (Week 6)

- Implement stage transition controls
- Add approval/rejection interfaces
- Create review dashboard
- Build audit trail viewer
- Add export functionality

### Phase 6: Testing and Polish (Week 7)

- Comprehensive testing across all modules
- Performance optimization
- Security audit
- Documentation completion
- Production deployment preparation

This design provides a comprehensive foundation for implementing the review system while maintaining alignment with existing architecture patterns and ensuring scalability across all assessment modules.
