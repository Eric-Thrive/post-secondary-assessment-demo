# Design Document

## Overview

This design document outlines the technical approach for implementing a modular, config-driven K-12 Teacher Guide Report Viewer that serves as the foundation for a unified THRIVE report design system. The implementation prioritizes reusability, maintainability, and modularity by building a design token system and reusable component library that can be shared across all THRIVE report types (K-12 Teacher Guides, Tutoring Tutor Guides, Post-Secondary Accommodation Reports).

The K-12 Report Viewer will be built using React with TypeScript, leveraging design tokens for all styling values, reusable layout components, and a config-driven section system. This approach eliminates the inline style and hardcoded value issues present in the current post-secondary report implementation, making it easy to add new report types, modify styling globally, and maintain consistency across the product.

**Key Architectural Principles:**

- **Design Tokens First**: All colors, spacing, typography, and shadows defined in centralized token files
- **Config-Driven Sections**: Report structure defined in configuration objects, not hardcoded in components
- **Reusable Components**: Layout and content components that work across all report types
- **Zero Inline Styles**: All styling via Tailwind CSS classes or styled-components referencing tokens
- **Pluggable Content**: Section components can be swapped or reused without touching layout code

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

**Design System Layer** (Reusable across all report types):

```
apps/web/src/design-system/
├── tokens/
│   ├── colors.ts
│   ├── spacing.ts
│   ├── typography.ts
│   ├── shadows.ts
│   └── index.ts
├── themes/
│   ├── k12Theme.ts
│   ├── tutoringTheme.ts
│   └── postSecondaryTheme.ts
└── components/
    ├── layout/
    │   ├── ThriveReportLayout.tsx
    │   ├── ThriveReportSidebar.tsx
    │   ├── ThriveReportHeader.tsx
    │   └── ThriveReportSection.tsx
    ├── cards/
    │   ├── ThriveReportCard.tsx
    │   ├── InfoCard.tsx
    │   └── DocumentCard.tsx
    ├── navigation/
    │   ├── NavigationButton.tsx
    │   └── BottomNavigation.tsx
    ├── content/
    │   ├── ThematicAccordion.tsx
    │   ├── StrategyAccordion.tsx
    │   ├── StrengthAccordion.tsx
    │   └── ChallengeAccordion.tsx
    └── types.ts
```

**K-12 Application Layer** (K-12-specific implementation):

```
apps/web/src/components/k12/
├── K12ReportViewer.tsx (main component)
├── k12Config.ts (section configuration)
└── content/
    ├── CaseInformationContent.tsx
    ├── DocumentsReviewedContent.tsx
    ├── StudentOverviewContent.tsx
    ├── SupportStrategiesContent.tsx
    ├── StudentStrengthsContent.tsx
    ├── StudentChallengesContent.tsx
    └── ReportCompleteContent.tsx
```

**Component Tree at Runtime**:

```
K12ReportViewer
├── ThriveReportLayout (design system)
│   ├── ThriveReportSidebar (design system)
│   │   └── NavigationButton[] (design system)
│   ├── ThriveReportHeader (design system)
│   └── ThriveReportSection[] (design system)
│       └── [Content Components] (K-12 specific)
│           ├── CaseInformationContent
│           ├── DocumentsReviewedContent
│           ├── StudentOverviewContent
│           ├── SupportStrategiesContent
│           ├── StudentStrengthsContent
│           ├── StudentChallengesContent
│           └── ReportCompleteContent
```

### Design System Architecture

The design system is built in three layers:

**Layer 1: Design Tokens** (Primitive values)

- Colors, spacing, typography, shadows, border-radius
- No business logic, just raw values
- Example: `colors.navyBlue = "#1297D2"`

**Layer 2: Themes** (Token combinations for specific contexts)

- Combine tokens into semantic themes for each report type
- Example: `k12Theme = { primary: colors.navyBlue, spacing: spacing, ... }`

**Layer 3: Components** (UI building blocks)

- Layout components (structure and positioning)
- Card components (content containers)
- Navigation components (user interaction)
- Content components (section-specific rendering)

### Config-Driven Section System

Reports are defined via configuration objects:

```typescript
interface ReportConfig {
  reportTitle: string;
  sections: ReportSection[];
  utilityButtons?: UtilityButton[];
  theme: Theme;
}

interface UtilityButton {
  id: string;
  title: string;
  icon: React.ComponentType;
  route: string;
}

interface ReportSection {
  id: string;
  title: string;
  icon: React.ComponentType | string;
  width?: string;
  subsections?: ReportSection[];
}

// K-12 Configuration
const k12Config: ReportConfig = {
  reportTitle: "Teacher Guide",
  sections: [
    { id: "case-info", title: "Case Information", icon: StudentIcon },
    { id: "documents", title: "Documents Reviewed", icon: DocumentIcon },
    { id: "overview", title: "Student Overview", icon: OverviewIcon },
    { id: "strategies", title: "Key Support Strategies", icon: StrategiesIcon },
    { id: "strengths", title: "Student's Strengths", icon: Star },
    { id: "challenges", title: "Student's Challenges", icon: AlertTriangle },
    { id: "complete", title: "Report Complete", icon: CheckCircle },
  ],
  utilityButtons: [
    { id: "review", title: "Review", icon: Edit, route: "/k12-review-edit" },
    {
      id: "new-report",
      title: "New Report",
      icon: Plus,
      route: "/new-k12-assessment",
    },
    { id: "home", title: "Home", icon: Home, route: "/" },
  ],
  theme: k12Theme,
};
```

Section IDs map to content components via a registry:

```typescript
const sectionRegistry = {
  "case-info": CaseInformationContent,
  documents: DocumentsReviewedContent,
  overview: StudentOverviewContent,
  strategies: SupportStrategiesContent,
  strengths: StudentStrengthsContent,
  challenges: StudentChallengesContent,
  complete: ReportCompleteContent,
};
```

## Design Tokens

### Token Structure

All design tokens are defined in `apps/web/src/design-system/tokens/`:

**colors.ts**:

```typescript
export const colors = {
  // K-12 Sunwashed Palette
  navyBlue: "#1297D2",
  skyBlue: "#96D7E1",
  orange: "#F89E54",
  yellow: "#FDE677",

  // Neutral colors
  white: "#FFFFFF",
  gray50: "#F8FAFC",
  gray100: "#F1F5F9",
  gray200: "#E2E8F0",
  gray600: "#475569",
  gray700: "#334155",
  gray800: "#1E293B",
  gray900: "#0F172A",

  // Semantic colors
  success: "#16a34a",
  error: "#dc2626",
  warning: "#F89E54",
  info: "#1297D2",
};
```

**spacing.ts**:

```typescript
export const spacing = {
  xs: "4px",
  sm: "8px",
  md: "16px",
  lg: "24px",
  xl: "32px",
  xxl: "48px",
  xxxl: "64px",
};
```

**typography.ts**:

```typescript
export const typography = {
  fontFamilies: {
    primary:
      '"Avenir", "Avenir Next", -apple-system, BlinkMacSystemFont, sans-serif',
    secondary: '"Montserrat", -apple-system, BlinkMacSystemFont, sans-serif',
  },
  fontSizes: {
    h1: "32px",
    h2: "24px",
    h3: "20px",
    h4: "18px",
    bodyLarge: "16px",
    body: "14px",
    small: "12px",
  },
  fontWeights: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
    heavy: 900,
  },
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
};
```

**shadows.ts**:

```typescript
export const shadows = {
  sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
  md: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
  lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
  xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
  xxl: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
};

export const borderRadius = {
  sm: "4px",
  md: "8px",
  lg: "12px",
  xl: "16px",
  full: "9999px",
};
```

### Theme Objects

Themes combine tokens for specific report types:

**k12Theme.ts**:

```typescript
import { colors, spacing, typography, shadows, borderRadius } from "../tokens";

export const k12Theme = {
  name: "K-12 Teacher Guide",
  colors: {
    primary: colors.navyBlue,
    secondary: colors.skyBlue,
    accent: colors.orange,
    highlight: colors.yellow,
    ...colors,
  },
  spacing,
  typography,
  shadows,
  borderRadius,
  // K-12-specific overrides
  navigation: {
    activeBackground: colors.yellow,
    activeBorder: colors.orange,
    inactiveBackground: colors.gray100,
  },
};
```

**tutoringTheme.ts**:

```typescript
// Same structure as k12Theme, different color values
export const tutoringTheme = {
  name: "Tutoring Tutor Guide",
  colors: {
    primary: colors.navyBlue,
    secondary: colors.skyBlue,
    accent: colors.orange,
    highlight: colors.yellow,
    ...colors,
  },
  spacing,
  typography,
  shadows,
  borderRadius,
  // Tutoring-specific overrides (if any)
  navigation: {
    activeBackground: colors.yellow,
    activeBorder: colors.orange,
    inactiveBackground: colors.gray100,
  },
};
```

## Components and Interfaces

### Design System Components (Reusable)

These components live in `apps/web/src/design-system/components/` and are used by all report types.

#### 1. ThriveReportLayout

**Location**: `apps/web/src/design-system/components/layout/ThriveReportLayout.tsx`

**Purpose**: Main layout wrapper that provides the overall page structure with sidebar and content area

**Props**:

```typescript
interface ThriveReportLayoutProps {
  config: ReportConfig;
  currentSection: string;
  onSectionChange: (sectionId: string) => void;
  theme: Theme;
  children: React.ReactNode;
}
```

**Styling**: Uses design tokens exclusively, no inline styles

- Background gradient based on current section (from theme)
- Responsive layout (sidebar collapses on mobile)
- Fixed header and sidebar positioning

**Accessibility**:

- Semantic HTML5 structure (`<header>`, `<nav>`, `<main>`)
- Skip to main content link
- Proper landmark regions

---

#### 2. ThriveReportSidebar

**Location**: `apps/web/src/design-system/components/layout/ThriveReportSidebar.tsx`

**Purpose**: Fixed left sidebar for section navigation and utility buttons, reusable across all report types

**Props**:

```typescript
interface ThriveReportSidebarProps {
  sections: ReportSection[];
  utilityButtons?: UtilityButton[];
  currentSection: string;
  onSectionChange: (sectionId: string) => void;
  theme: Theme;
  logo?: string;
  reportTitle?: string;
}
```

**Styling**: Uses Tailwind classes + design tokens

```typescript
// Example usage
<div className="fixed left-0 top-0 h-screen w-80 bg-white shadow-xl">
  <div style={{ borderRight: `2px solid ${theme.colors.secondary}` }}>
    {sections.map((section) => (
      <NavigationButton
        key={section.id}
        section={section}
        isActive={currentSection === section.id}
        theme={theme}
        onClick={() => onSectionChange(section.id)}
      />
    ))}
  </div>
</div>
```

**Accessibility**:

- `role="navigation"` with `aria-label="Report sections navigation"`
- Keyboard navigable with Tab/Enter
- Visible focus indicators

---

#### 3. ThriveReportHeader

**Location**: `apps/web/src/design-system/components/layout/ThriveReportHeader.tsx`

**Purpose**: Sticky header with logo, title, and action buttons

**Props**:

```typescript
interface ThriveReportHeaderProps {
  logo: string;
  title: string;
  theme: Theme;
  actions?: React.ReactNode; // Print button, etc.
}
```

**Styling**: Uses design tokens for gradient background

```typescript
<header style={{
  background: `linear-gradient(to right, ${theme.colors.primary}, ${theme.colors.secondary})`
}}>
```

---

#### 4. ThriveReportSection

**Location**: `apps/web/src/design-system/components/layout/ThriveReportSection.tsx`

**Purpose**: Wrapper for section content with consistent styling and background

**Props**:

```typescript
interface ThriveReportSectionProps {
  section: ReportSection;
  isActive: boolean;
  theme: Theme;
  children: React.ReactNode;
}
```

**Styling**: Uses design tokens for background gradients

- Applies section-specific background gradient from theme
- Consistent padding and spacing
- Smooth transitions when switching sections

---

#### 5. NavigationButton

**Location**: `apps/web/src/design-system/components/navigation/NavigationButton.tsx`

**Purpose**: Individual navigation button in sidebar

**Props**:

```typescript
interface NavigationButtonProps {
  section: ReportSection;
  isActive: boolean;
  theme: Theme;
  onClick: () => void;
}
```

**Styling**: Uses design tokens for active/inactive states

```typescript
const buttonStyle = isActive
  ? {
      backgroundColor: theme.navigation.activeBackground,
      borderColor: theme.navigation.activeBorder,
      color: theme.colors.gray900,
    }
  : {
      backgroundColor: theme.navigation.inactiveBackground,
      borderColor: theme.colors.gray200,
      color: theme.colors.gray600,
    };
```

**Accessibility**:

- `aria-current="page"` when active
- Keyboard accessible with Enter/Space
- Visible focus ring

---

### Card Components (Reusable)

#### 6. ThriveReportCard

**Location**: `apps/web/src/design-system/components/cards/ThriveReportCard.tsx`

**Purpose**: Generic card container with consistent styling, reusable across all report types

**Props**:

```typescript
interface ThriveReportCardProps {
  children: React.ReactNode;
  theme: Theme;
  variant?: "default" | "highlighted" | "bordered";
  className?: string;
}
```

**Styling**: Uses design tokens exclusively

```typescript
const cardStyles = {
  border: `2px solid ${theme.colors.gray200}`,
  boxShadow: theme.shadows.xxl,
  borderRadius: theme.borderRadius.lg,
  padding: theme.spacing.xl,
  backgroundColor: theme.colors.white,
};
```

**Variants**:

- `default`: White background, gray border
- `highlighted`: Colored background based on theme
- `bordered`: Thicker colored border

---

#### 7. InfoCard

**Location**: `apps/web/src/design-system/components/cards/InfoCard.tsx`

**Purpose**: Display label-value pairs (case information, metadata, etc.)

**Props**:

```typescript
interface InfoCardProps {
  data: Record<string, string>;
  theme: Theme;
}
```

**Styling**: Uses design tokens + semantic HTML

```typescript
<ThriveReportCard theme={theme} variant="bordered">
  <dl>
    {Object.entries(data).map(([label, value]) => (
      <>
        <dt
          style={{
            fontWeight: theme.typography.fontWeights.bold,
            minWidth: "160px",
          }}
        >
          {label}
        </dt>
        <dd
          style={{
            color: theme.colors.gray700,
          }}
        >
          {value}
        </dd>
      </>
    ))}
  </dl>
</ThriveReportCard>
```

**Accessibility**: Uses semantic `<dl>`, `<dt>`, `<dd>` elements

---

#### 8. DocumentCard

**Location**: `apps/web/src/design-system/components/cards/DocumentCard.tsx`

**Purpose**: Display reviewed document information

**Props**:

```typescript
interface DocumentCardProps {
  title: string;
  author: string;
  date: string;
  keyFindings: string;
  theme: Theme;
}
```

**Styling**: Uses design tokens for colored left border

```typescript
<ThriveReportCard theme={theme}>
  <div style={{ borderLeft: `4px solid ${theme.colors.accent}` }}>
    <div
      style={{
        backgroundColor: `${theme.colors.accent}20`, // 20% opacity
        borderRadius: theme.borderRadius.full,
      }}
    >
      <FileText style={{ color: theme.colors.accent }} />
    </div>
    {/* Document content */}
  </div>
</ThriveReportCard>
```

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

---

## Design Document Update Summary

**Status**: Partially updated to reflect modular architecture (January 2025)

**What's Been Updated**:

- ✅ Overview section - Now emphasizes modularity, design tokens, and config-driven approach
- ✅ Architecture section - Added design system layer structure and config-driven section system
- ✅ Design Tokens section - Complete token structure for colors, spacing, typography, shadows
- ✅ Theme Objects section - K-12 and Tutoring theme definitions
- ✅ Layout Components - ThriveReportLayout, ThriveReportSidebar, ThriveReportHeader, ThriveReportSection, NavigationButton
- ✅ Card Components - ThriveReportCard, InfoCard, DocumentCard

**What Needs Updating** (retained from original design for reference):

- Accordion components (ThematicAccordion, StrategyAccordion, StrengthAccordion, ChallengeAccordion)
- K-12 Content Components (CaseInformationContent, DocumentsReviewedContent, etc.)
- PDF generation components
- Data models
- Error handling
- Testing strategy
- Responsive design details
- Accessibility features
- Performance considerations

**Key Architectural Changes**:

1. **No More Inline Styles**: All styling via design tokens or Tailwind classes
2. **Config-Driven**: Sections defined in configuration objects, not hardcoded
3. **Reusable Components**: Design system components work across K-12, Tutoring, and future report types
4. **Theme-Based**: Each report type has its own theme that combines design tokens
5. **Modular Structure**: Clear separation between design system (reusable) and application (K-12-specific) layers

**Next Steps**:

- Update remaining component descriptions to use design tokens
- Update Data Models section to include ReportConfig and Theme interfaces
- Update tasks.md to reflect design system foundation phase
- Create implementation examples showing how Tutoring reuses K-12 components
