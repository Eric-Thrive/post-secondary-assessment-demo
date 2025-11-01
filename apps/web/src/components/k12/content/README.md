# K-12 Content Components

This directory contains the content components for the K-12 Teacher Guide Report Viewer. Each component corresponds to a section in the report and uses design system components for consistent styling.

## Implemented Components

### 1. CaseInformationContent

**File:** `CaseInformationContent.tsx`  
**Requirements:** 7.1, 7.2, 7.3, 7.4, 7.5

Displays case information using `InfoCard` from the design system. Shows:

- Student name
- Grade level
- School year
- Tutor/case manager
- Date created
- Last updated

### 2. DocumentsReviewedContent

**File:** `DocumentsReviewedContent.tsx`  
**Requirements:** 8.1, 8.2, 8.3, 8.4, 8.5

Displays list of reviewed documents using `DocumentCard` from the design system. Each document shows:

- Title
- Author
- Date
- Key findings

### 3. StudentOverviewContent

**File:** `StudentOverviewContent.tsx`  
**Requirements:** 9.1, 9.2, 9.3, 9.4, 9.5, 9.6

Displays student overview with:

- "At a Glance" summary card with Sparkles icon
- Three expandable subsections using `ThematicAccordion`:
  - Academic & Learning Profile
  - Challenges & Diagnosis
  - Social-Emotional & Supports

### 4. SupportStrategiesContent

**File:** `SupportStrategiesContent.tsx`  
**Requirements:** 10.1, 10.2, 10.3, 10.4, 10.5, 10.6

Displays key support strategies using `StrategyAccordion` from the design system. Each strategy includes:

- Strategy name with icon
- Detailed description
- Orange theme styling

Sample strategies include:

- Extended Time & Chunking
- Visual Supports & Graphic Organizers
- Explicit Task Instructions
- Movement & Sensory Breaks
- Positive Reinforcement & Self-Monitoring
- Collaborative Learning Opportunities

### 5. StudentStrengthsContent

**File:** `StudentStrengthsContent.tsx`  
**Requirements:** 11.1, 11.2, 11.3, 11.4, 11.5, 11.6

Displays student strengths using `StrengthAccordion` from the design system. Each strength includes:

- Color-coded header (blue/green/orange)
- "What You See" observations (bullet list)
- "What to Do" recommendations with Check/X icons

Sample strengths include:

- Verbal Expression & Communication
- Creative Problem-Solving
- Social Awareness & Empathy

### 6. StudentChallengesContent

**File:** `StudentChallengesContent.tsx`  
**Requirements:** 12.1, 12.2, 12.3, 12.4, 12.5, 12.6

Displays student challenges using `ChallengeAccordion` from the design system. Each challenge includes:

- AlertTriangle icon in orange circle
- "What You See" observations (bullet list)
- "What to Do" recommendations with Check/X icons
- Yellow/orange theme styling

Sample challenges include:

- Working Memory & Multi-Step Tasks
- Processing Speed & Time Pressure
- Written Expression & Organization
- Sustained Attention & Focus

### 7. ReportCompleteContent

**File:** `ReportCompleteContent.tsx`  
**Requirements:** 13.1, 13.5

Displays completion screen with:

- Success icon (CheckCircle)
- Completion message
- Download PDF button (placeholder - will be implemented in Task 7)
- Back to Cover button

## Design System Components Used

All content components use the following design system components:

- `InfoCard` - For case information display
- `DocumentCard` - For document listings
- `ThriveReportCard` - For card containers
- `ThematicAccordion` - For themed expandable sections
- `StrategyAccordion` - For support strategies
- `StrengthAccordion` - For student strengths
- `ChallengeAccordion` - For student challenges
- `BottomNavigation` - For section navigation

## Sample Data

Each component includes sample data that demonstrates the expected structure. In production, this data will be passed via the `reportData` prop from the parent `K12ReportViewer` component.

## Props Interface

All content components receive `SectionContentProps`:

```typescript
interface SectionContentProps {
  theme: Theme;
  onNext?: () => void;
  reportData?: any; // Typed as ReportData in production
}
```

## Next Steps

- Task 7: Implement PDF generation functionality for ReportCompleteContent
- Connect components to real data from backend API
- Add loading states for data fetching
- Implement error handling for missing data

## Notes

- All styling uses design tokens (no inline hardcoded values)
- All components are fully keyboard accessible
- All accordions use single-item expansion behavior
- Sample data provides realistic examples for each section
