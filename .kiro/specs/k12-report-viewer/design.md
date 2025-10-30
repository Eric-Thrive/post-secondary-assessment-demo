# Design Document

## Overview

This design document outlines the technical approach for implementing the K-12 Tutor Guide Report Viewer by adapting the existing Figma mockup to align with the post-secondary accommodation report design system. The implementation will maintain the K-12 report's existing section structure and content while applying consistent visual styling, component patterns, and interaction behaviors from the post-secondary design specification.

The K-12 Report Viewer will be built using React with TypeScript, leveraging Radix UI components for accessibility and the existing component library patterns from the post-secondary report. The design preserves the K-12 Sunwashed color palette while incorporating post-secondary design system patterns for professional consistency.

## Architecture

### Technology Stack

- **Framework**: React 18.3+ with TypeScript
- **Build Tool**: Vite 6.3+
- **UI Components**: Radix UI (Accordion, Card, Button, Dialog, Scroll Area)
- **Styling**: Tailwind CSS with custom design tokens
- **Icons**: Lucide React + custom SVG assets
- **PDF Generation**: html2canvas + jsPDF
- **State Management**: React useState for section navigation and accordion state

### Component Hierarchy

```
App
├── SkipToMainContent (accessibility)
├── NavigationSidebar
│   ├── Logo & Title
│   └── NavigationItems[]
│       └── NavigationButton
├── Header (sticky)
│   ├── Logo Button
│   └── Report Title
└── MainContent
    ├── CaseInformationSection
    │   └── InfoCard
    ├── DocumentsReviewedSection
    │   └── DocumentCard[]
    ├── StudentOverviewSection
    │   ├── AtAGlanceCard
    │   └── ThematicAccordion
    │       └── AccordionItem[]
    ├── KeySupportStrategiesSection
    │   └── StrategyAccordion
    │       └── AccordionItem[]
    ├── StudentStrengthsSection
    │   └── StrengthAccordion
    │       └── AccordionItem[]
    ├── StudentChallengesSection
    │   └── ChallengeAccordion
    │       └── AccordionItem[]
    ├── ReportCompleteSection
    │   ├── PDFDownloadButton
    │   └── BackToCoverButton
    └── HiddenPDFReport (for generation)
```

### Design System Integration

The K-12 Report Viewer will integrate with the post-secondary design system through:

1. **Shared Typography Scale**: Adopt H1-H4 hierarchy (32px/24px/20px/18px) with consistent font weights
2. **Spacing System**: Use consistent padding/margin tokens (4px base unit)
3. **Border & Shadow Tokens**: Apply standardized border-radius (8px/12px) and shadow depths
4. **Component Patterns**: Reuse Radix UI accordion, card, and button patterns
5. **Accessibility Standards**: Maintain WCAG 2.1 AA compliance with proper ARIA labels and keyboard navigation

## Components and Interfaces

### Core Components

#### 1. NavigationSidebar

**Purpose**: Fixed left sidebar for section navigation

**Props**:

```typescript
interface NavigationSidebarProps {
  currentSection: string;
  onSectionChange: (sectionId: string) => void;
  sections: NavigationSection[];
}

interface NavigationSection {
  id: string;
  label: string;
  icon: "custom" | LucideIcon;
  customIcon?: string;
}
```

**Styling**:

- Fixed position, left: 0, width: 320px (80rem)
- White background with Sky Blue border (#96D7E1)
- Active section: Yellow background (#FDE677) with Orange border (#F89E54)
- Inactive sections: Gray background with hover states

**Accessibility**:

- `role="navigation"` with `aria-label="Report sections navigation"`
- `aria-current="page"` on active section
- Keyboard navigable with visible focus indicators

#### 2. SectionCard

**Purpose**: Container for each report section with consistent styling

**Props**:

```typescript
interface SectionCardProps {
  children: React.ReactNode;
  backgroundGradient?: string;
  className?: string;
}
```

**Styling**:

- Border: 2px solid gray-200
- Shadow: 2xl (large shadow depth)
- Border radius: 12px (xl)
- Padding: 32px (8rem)
- Background: Optional gradient overlay with 90% opacity

#### 3. InfoCard

**Purpose**: Display case information in label-value pairs

**Props**:

```typescript
interface InfoCardProps {
  data: Record<string, string>;
}
```

**Styling**:

- White background with 95% opacity
- Sky Blue border (#96D7E1), 2px
- Shadow: xl
- Uses `<dl>` semantic structure
- Label: Bold, min-width 160px
- Value: Regular weight, gray-700

#### 4. DocumentCard

**Purpose**: Display reviewed document information

**Props**:

```typescript
interface DocumentCardProps {
  title: string;
  author: string;
  date: string;
  keyFindings: string;
}
```

**Styling**:

- White background with 95% opacity
- Orange left border (#F89E54), 4px
- Icon circle: Orange background (#fed7aa)
- FileText icon in Orange (#F89E54)

#### 5. ThematicAccordion

**Purpose**: Expandable sections with themed colors (Student Overview)

**Props**:

```typescript
interface ThematicAccordionProps {
  sections: ThematicSection[];
}

interface ThematicSection {
  title: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  content: string;
}
```

**Behavior**:

- Single-item expansion: `type="single"` with `collapsible`
- Smooth animation: 300ms
- Hover state: Background changes to section bgColor
- Icon rotation on expand/collapse

**Styling**:

- Each section has themed color and background
- Icon circle with themed background
- Header: 24px (2xl) bold text in theme color
- Content: 20px (xl) regular text with relaxed leading

#### 6. StrategyAccordion

**Purpose**: Expandable support strategy cards

**Props**:

```typescript
interface StrategyAccordionProps {
  strategies: Strategy[];
}

interface Strategy {
  strategy: string;
  description: string;
  icon: LucideIcon;
}
```

**Behavior**:

- Single-item expansion
- Orange theme throughout
- Icon in orange circle

#### 7. StrengthAccordion

**Purpose**: Expandable strength cards with "What You See" and "What to Do" sections

**Props**:

```typescript
interface StrengthAccordionProps {
  strengths: Strength[];
}

interface Strength {
  title: string;
  color: string;
  bgColor: string;
  whatYouSee: string[];
  whatToDo: ActionItem[];
}

interface ActionItem {
  text: string;
  type: "do" | "dont";
}
```

**Behavior**:

- Single-item expansion
- Color-coded by strength (blue/green/orange)
- Check/X icons for do/don't items

**Styling**:

- Header background: Strength bgColor
- Check icon: Green (#16a34a)
- X icon: Red (#dc2626)

#### 8. ChallengeAccordion

**Purpose**: Expandable challenge cards with "What You See" and "What to Do" sections

**Props**:

```typescript
interface ChallengeAccordionProps {
  challenges: Challenge[];
}

interface Challenge {
  challenge: string;
  whatYouSee: string[];
  whatToDo: ActionItem[];
}
```

**Behavior**:

- Single-item expansion
- Orange/yellow theme
- Alternating row backgrounds

#### 9. PDFDownloadButton

**Purpose**: Generate and download PDF version of report

**Props**:

```typescript
interface PDFDownloadButtonProps {
  studentName: string;
}
```

**Behavior**:

- Renders hidden PDFReport component
- Uses html2canvas to capture layout
- Generates PDF with jsPDF
- Downloads as "Tutor*Guide*[StudentName]\_[Date].pdf"

**Styling**:

- Navy Blue background (#1297D2)
- White text
- Loading state with spinner

## Data Models

### Report Data Structure

```typescript
interface TutorGuideReport {
  caseInfo: CaseInformation;
  documentsReviewed: Document[];
  studentOverview: StudentOverview;
  supportStrategies: Strategy[];
  studentStrengths: Strength[];
  studentChallenges: Challenge[];
}

interface CaseInformation {
  studentName: string;
  grade: string;
  schoolYear: string;
  tutor: string;
  dateCreated: string;
  lastUpdated: string;
}

interface Document {
  title: string;
  author: string;
  date: string;
  keyFindings: string;
}

interface StudentOverview {
  atAGlance: string;
  sections: ThematicSection[];
}

interface Strategy {
  strategy: string;
  description: string;
  icon: LucideIcon;
}

interface Strength {
  title: string;
  color: string;
  bgColor: string;
  whatYouSee: string[];
  whatToDo: ActionItem[];
}

interface Challenge {
  challenge: string;
  whatYouSee: string[];
  whatToDo: ActionItem[];
}

interface ActionItem {
  text: string;
  type: "do" | "dont";
}
```

### Navigation State

```typescript
type SectionId =
  | "cover"
  | "section1"
  | "section2"
  | "section3"
  | "section4"
  | "section5"
  | "complete";

interface NavigationState {
  currentSection: SectionId;
  setCurrentSection: (id: SectionId) => void;
}
```

## Design Tokens

### Color Palette

#### K-12 Sunwashed Palette (Primary Branding)

```typescript
const k12Colors = {
  navyBlue: "#1297D2",
  skyBlue: "#96D7E1",
  orange: "#F89E54",
  yellow: "#FDE677",
};
```

#### Post-Secondary Status Colors (For Future Use)

```typescript
const statusColors = {
  validated: "#10B981", // Green
  needsReview: "#F59E0B", // Amber
  flagged: "#EF4444", // Red
};
```

#### Neutral Colors

```typescript
const neutralColors = {
  gray50: "#F8FAFC",
  gray100: "#F1F5F9",
  gray200: "#E2E8F0",
  gray600: "#475569",
  gray700: "#334155",
  gray800: "#1E293B",
  gray900: "#0F172A",
  white: "#FFFFFF",
};
```

#### Semantic Colors

```typescript
const semanticColors = {
  success: "#16a34a",
  error: "#dc2626",
  warning: "#F89E54",
  info: "#1297D2",
};
```

### Typography

#### Font Families

```css
--font-primary: "Avenir", system-ui, sans-serif;
--font-secondary: "Montserrat", system-ui, sans-serif;
```

#### Font Sizes (Post-Secondary Alignment)

```css
--text-4xl: 32px; /* H1 - Report Title */
--text-3xl: 24px; /* H2 - Section Headers */
--text-2xl: 20px; /* H3 - Subsection Headers */
--text-xl: 18px; /* H4 - Card Headers */
--text-lg: 16px; /* Body Large */
--text-base: 14px; /* Body Regular */
--text-sm: 12px; /* Body Small */
```

#### Font Weights

```css
--font-heavy: 900; /* Extra Bold */
--font-extra-bold: 800; /* Bold */
--font-bold: 700;
--font-semibold: 600;
--font-medium: 500;
--font-regular: 400;
```

### Spacing

```css
--spacing-1: 4px;
--spacing-2: 8px;
--spacing-3: 12px;
--spacing-4: 16px;
--spacing-6: 24px;
--spacing-8: 32px;
--spacing-12: 48px;
--spacing-16: 64px;
```

### Borders & Shadows

```css
--border-radius-lg: 8px;
--border-radius-xl: 12px;
--border-radius-2xl: 16px;
--border-radius-full: 9999px;

--border-width-default: 1px;
--border-width-medium: 2px;
--border-width-thick: 4px;

--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
--shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
```

## Error Handling

### PDF Generation Errors

**Scenario**: PDF generation fails due to canvas rendering issues

**Handling**:

```typescript
try {
  const canvas = await html2canvas(element);
  const pdf = new jsPDF();
  // ... PDF generation logic
} catch (error) {
  console.error("PDF generation failed:", error);
  // Show user-friendly error message
  alert("Unable to generate PDF. Please try again or contact support.");
}
```

### Navigation Errors

**Scenario**: Invalid section ID provided

**Handling**:

```typescript
const handleSectionChange = (sectionId: string) => {
  const validSections = [
    "cover",
    "section1",
    "section2",
    "section3",
    "section4",
    "section5",
    "complete",
  ];

  if (!validSections.includes(sectionId)) {
    console.warn(`Invalid section ID: ${sectionId}`);
    setCurrentSection("cover"); // Default to cover
    return;
  }

  setCurrentSection(sectionId as SectionId);
};
```

### Data Loading Errors

**Scenario**: Report data is missing or malformed

**Handling**:

```typescript
const validateReportData = (data: unknown): data is TutorGuideReport => {
  // Type guard to validate data structure
  return (
    data !== null &&
    typeof data === 'object' &&
    'caseInfo' in data &&
    'documentsReviewed' in data &&
    // ... additional checks
  );
};

// In component
if (!validateReportData(reportData)) {
  return <ErrorState message="Unable to load report data" />;
}
```

## Testing Strategy

### Unit Tests

**Focus**: Individual component rendering and behavior

**Tools**: Vitest + React Testing Library

**Test Cases**:

1. NavigationSidebar renders all sections correctly
2. NavigationSidebar highlights active section
3. InfoCard displays label-value pairs correctly
4. DocumentCard renders all document fields
5. Accordion components expand/collapse on click
6. Single-item accordion behavior (only one open at a time)
7. PDFDownloadButton triggers PDF generation

**Example Test**:

```typescript
describe("NavigationSidebar", () => {
  it("highlights the active section", () => {
    render(
      <NavigationSidebar
        currentSection="section1"
        onSectionChange={jest.fn()}
        sections={mockSections}
      />
    );

    const activeButton = screen.getByRole("button", { current: "page" });
    expect(activeButton).toHaveStyle({ backgroundColor: "#FDE677" });
  });
});
```

### Integration Tests

**Focus**: Section navigation and data flow

**Test Cases**:

1. Clicking navigation item changes displayed section
2. "Next Section" buttons navigate correctly
3. Accordion state persists within section
4. PDF generation includes all report data

### Accessibility Tests

**Focus**: WCAG 2.1 AA compliance

**Tools**: axe-core + manual keyboard testing

**Test Cases**:

1. All interactive elements are keyboard accessible
2. Focus indicators are visible
3. ARIA labels are present and correct
4. Color contrast meets 4.5:1 ratio
5. Screen reader announces section changes
6. Skip to main content link works

### Visual Regression Tests

**Focus**: Design consistency with post-secondary report

**Tools**: Percy or Chromatic

**Test Cases**:

1. Typography matches post-secondary scale
2. Spacing is consistent across sections
3. Card styling matches design tokens
4. Accordion animations are smooth
5. Responsive layouts work at all breakpoints

## Responsive Design

### Breakpoints

```css
--breakpoint-mobile: 0px;
--breakpoint-tablet: 768px;
--breakpoint-desktop: 1200px;
```

### Layout Adaptations

#### Desktop (1200px+)

- Fixed sidebar navigation (320px width)
- Main content offset by sidebar width
- Full-width cards with generous padding
- Two-column layouts where appropriate

#### Tablet (768px - 1199px)

- Collapsible sidebar navigation
- Single column layout
- Reduced padding
- Full-width cards

#### Mobile (<768px)

- Hamburger menu for navigation
- Stacked single column
- Minimum touch target size: 44x44px
- Reduced font sizes (scale down 10-15%)
- Simplified card layouts

### Responsive Typography

```css
@media (max-width: 768px) {
  --text-4xl: 28px; /* H1 */
  --text-3xl: 20px; /* H2 */
  --text-2xl: 18px; /* H3 */
  --text-xl: 16px; /* H4 */
}
```

## Accessibility Features

### Keyboard Navigation

- Tab order: Skip link → Navigation → Main content → Buttons → Accordions
- Enter/Space: Activate buttons and accordion triggers
- Arrow keys: Navigate within accordion groups (optional enhancement)
- Escape: Close modals/dialogs

### Screen Reader Support

```typescript
// Navigation item
<button
  aria-current={isActive ? 'page' : undefined}
  aria-label={`Navigate to ${section.label}`}
>
  {section.label}
</button>

// Accordion
<Accordion.Trigger
  aria-expanded={isExpanded}
  aria-controls={`content-${id}`}
>
  {title}
</Accordion.Trigger>

// Section
<main
  id="main-content"
  tabIndex={-1}
  role="main"
  aria-label="Report content"
>
```

### Focus Management

```typescript
const handleSkipToMain = () => {
  const mainContent = document.getElementById("main-content");
  if (mainContent) {
    mainContent.focus();
    mainContent.scrollIntoView({ behavior: "smooth" });
  }
};
```

### Color Contrast

All text meets WCAG 2.1 AA standards:

- Body text (14px): 4.5:1 minimum
- Large text (18px+): 3:1 minimum
- Interactive elements: 3:1 minimum

## Performance Considerations

### Code Splitting

```typescript
// Lazy load PDF components
const PDFReport = lazy(() => import("./components/PDFReport"));
const PDFDownloadButton = lazy(() => import("./components/PDFDownloadButton"));
```

### Memoization

```typescript
// Memoize expensive computations
const sortedDocuments = useMemo(
  () => documents.sort((a, b) => new Date(b.date) - new Date(a.date)),
  [documents]
);

// Memoize callbacks
const handleSectionChange = useCallback((sectionId: string) => {
  setCurrentSection(sectionId as SectionId);
}, []);
```

### Image Optimization

- Use WebP format for custom icons with PNG fallback
- Lazy load images below the fold
- Provide appropriate alt text for all images

### Bundle Size

- Target: < 500KB initial bundle
- Use tree-shaking for unused Radix UI components
- Minimize Tailwind CSS output with PurgeCSS

## Implementation Notes

### Existing Code Reuse

The K-12 Report Viewer will adapt the existing Figma mockup code located at `.figma/k12-figma-design/src/App.tsx`. Key modifications:

1. **Typography Updates**: Apply post-secondary font sizes and weights
2. **Spacing Adjustments**: Use consistent padding/margin tokens
3. **Border & Shadow Refinement**: Apply standardized border-radius and shadow depths
4. **Component Extraction**: Break monolithic App.tsx into reusable components
5. **Type Safety**: Add TypeScript interfaces for all data structures

### Design System Alignment

To align with post-secondary design:

1. Review post-secondary component library
2. Extract shared design tokens (colors, spacing, typography)
3. Create K-12-specific token overrides for Sunwashed palette
4. Document differences between K-12 and post-secondary styling

### Future Enhancements

1. **Data Integration**: Connect to backend API for dynamic report data
2. **Print Optimization**: Enhance PDF layout for multi-page reports
3. **Filtering**: Add ability to filter/search within long sections
4. **Annotations**: Allow users to add notes to report sections
5. **Export Options**: Add Word/Excel export in addition to PDF

## Related Files

- Figma Mockup: `.figma/k12-figma-design/`
- Post-Secondary Design Spec: `.figma/post-secondary-report-design.md`
- Requirements: `.kiro/specs/k12-report-viewer/requirements.md`
