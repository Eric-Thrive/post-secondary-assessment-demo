# K-12 Teacher Guide Components

This directory contains the K-12 Teacher Guide report viewer implementation, built using the THRIVE design system.

## Architecture

The K-12 implementation follows a **config-driven, modular architecture** that separates concerns:

1. **Configuration** (`k12Config.ts`) - Defines sections, navigation, and theme
2. **Section Registry** (`sectionRegistry.tsx`) - Maps section IDs to content components
3. **Main Viewer** (`K12ReportViewer.tsx`) - Orchestrates layout and navigation
4. **Content Components** (`content/`) - Section-specific content rendering

## Key Features

- ✅ **Config-Driven**: Add/remove/reorder sections by editing configuration
- ✅ **Lazy Loading**: Section content components are loaded on-demand
- ✅ **Design System Integration**: Uses reusable layout components from `@/design-system`
- ✅ **Type-Safe**: Full TypeScript support with proper type definitions
- ✅ **Responsive**: Mobile-friendly with collapsible sidebar
- ✅ **Accessible**: Keyboard navigation and screen reader support

## File Structure

```
k12/
├── K12ReportViewer.tsx       # Main viewer component
├── k12Config.ts               # Section configuration and theme
├── sectionRegistry.tsx        # Maps section IDs to components
├── index.ts                   # Public exports
├── content/                   # Section content components
│   ├── CaseInformationContent.tsx
│   ├── DocumentsReviewedContent.tsx
│   ├── StudentOverviewContent.tsx
│   ├── SupportStrategiesContent.tsx
│   ├── StudentStrengthsContent.tsx
│   ├── StudentChallengesContent.tsx
│   └── ReportCompleteContent.tsx
└── README.md                  # This file
```

## Usage

### Basic Usage

```tsx
import { K12ReportViewer } from "@/components/k12";

function MyPage() {
  return (
    <K12ReportViewer
      initialSection="case-info"
      reportData={myReportData}
      caseId="123"
    />
  );
}
```

### With Section Change Callback

```tsx
<K12ReportViewer
  initialSection="overview"
  reportData={reportData}
  caseId="456"
  onSectionChange={(sectionId) => {
    console.log("Navigated to:", sectionId);
    // Track analytics, update URL, etc.
  }}
/>
```

## Configuration

### Adding a New Section

1. Add section to `k12Config.ts`:

```typescript
sections: [
  // ... existing sections
  {
    id: "new-section",
    title: "New Section",
    icon: MyIcon,
  },
];
```

2. Create content component in `content/`:

```typescript
// content/NewSectionContent.tsx
import React from "react";
import type { SectionContentProps } from "../sectionRegistry";

const NewSectionContent: React.FC<SectionContentProps> = ({
  theme,
  onNext,
  reportData,
}) => {
  return <div>New section content</div>;
};

export default NewSectionContent;
```

3. Register in `sectionRegistry.tsx`:

```typescript
const NewSectionContent = React.lazy(
  () => import("./content/NewSectionContent")
);

export const sectionRegistry = {
  // ... existing sections
  "new-section": NewSectionContent,
};
```

### Customizing Theme

The K-12 theme is defined in `@/design-system/themes/k12Theme.ts`. To customize:

```typescript
// k12Config.ts
import { k12Theme } from "@/design-system/themes/k12Theme";

export const k12Config: ReportConfig = {
  // ... other config
  theme: {
    ...k12Theme,
    colors: {
      ...k12Theme.colors,
      primary: "#custom-color", // Override specific colors
    },
  },
};
```

## Design System Integration

This implementation uses the following design system components:

- `ThriveReportLayout` - Overall page structure
- `ThriveReportSidebar` - Navigation sidebar
- `ThriveReportHeader` - Fixed header
- `ThriveReportSection` - Section wrapper
- `ThriveReportCard` - Content cards (used in content components)
- Design tokens for colors, spacing, typography, shadows

All styling uses design tokens - **zero inline hardcoded values**.

## Content Components (Task 6)

The content components in `content/` are currently **placeholders**. They will be properly implemented in **Task 6** with:

- InfoCard for case information
- DocumentCard for reviewed documents
- ThematicAccordion for student overview
- StrategyAccordion for support strategies
- StrengthAccordion for student strengths
- ChallengeAccordion for student challenges
- PDF download functionality

## Navigation Helpers

The configuration exports helper functions for navigation:

```typescript
import {
  getNextSection,
  getPreviousSection,
  isValidK12Section,
} from "@/components/k12";

// Get next section
const next = getNextSection("case-info"); // Returns "documents"

// Get previous section
const prev = getPreviousSection("documents"); // Returns "case-info"

// Validate section ID
if (isValidK12Section(sectionId)) {
  // Safe to use
}
```

## Type Definitions

```typescript
// Section ID type
type K12SectionId =
  | "case-info"
  | "documents"
  | "overview"
  | "strategies"
  | "strengths"
  | "challenges"
  | "complete";

// Content component props
interface SectionContentProps {
  theme: Theme;
  onNext?: () => void;
  reportData?: any;
}

// Viewer props
interface K12ReportViewerProps {
  initialSection?: K12SectionId;
  reportData?: any;
  caseId?: string;
  onSectionChange?: (sectionId: K12SectionId) => void;
}
```

## Demo Page

A demo page is available at `apps/web/src/pages/K12ReportViewerDemo.tsx`. To use it:

1. Add route to your router:

```typescript
<Route path="/k12-report-viewer-demo" element={<K12ReportViewerDemo />} />
```

2. Navigate to `/k12-report-viewer-demo` in your browser

## Next Steps

1. **Task 6**: Implement content components with real functionality
2. **Task 7**: Add PDF generation
3. **Task 8**: Verify accessibility compliance
4. **Task 9**: Test responsive design
5. **Task 10**: Verify design system consistency

## Reusability

This architecture is designed for **95%+ code reuse** across report types:

- **Tutoring Tutor Guide**: Reuse all components, just change theme and config
- **Post-Secondary**: Refactor to use same design system components
- **Future Reports**: Easy to add new report types using the same pattern

## Related Documentation

- Design System: `apps/web/src/design-system/README.md` (to be created)
- Requirements: `.kiro/specs/k12-report-viewer/requirements.md`
- Design: `.kiro/specs/k12-report-viewer/design.md`
- Tasks: `.kiro/specs/k12-report-viewer/tasks.md`
