# K-12 Report Viewer: Modularity Strategy

## Problem Statement

The current post-secondary report (`FigmaEnhancedReportViewer.tsx`) has significant maintainability issues:

1. **Inline Styles Everywhere**: 2000+ lines with hundreds of inline `style={{}}` objects
2. **Hardcoded Values**: Colors, spacing, and dimensions scattered throughout
3. **Monolithic Component**: Single 2110-line file with deeply nested JSX
4. **Brittle CSS**: Changes break easily due to tight coupling
5. **No Reusability**: Cannot easily adapt for K-12 or Tutoring reports

## Solution: Build K-12 with Modularity First

Instead of replicating the post-secondary complexity, we'll build the K-12 report viewer as a **modular, config-driven system** that can serve as the foundation for all report types.

---

## Architecture Principles

### 1. **Config-Driven Sections**

Each report type defines its sections via configuration:

```typescript
// Report configuration interface
interface ReportConfig {
  sections: ReportSection[];
  branding: BrandingConfig;
  colors: ColorPalette;
}

interface ReportSection {
  id: string;
  title: string;
  icon: string | React.ComponentType;
  width?: string;
  subsections?: ReportSection[];
}

// K-12 Configuration
const k12Config: ReportConfig = {
  sections: [
    {
      id: "case-info",
      title: "Case Information",
      icon: StudentIcon,
      width: "1200px",
    },
    {
      id: "documents",
      title: "Documents Reviewed",
      icon: DocumentIcon,
      width: "800px",
    },
    {
      id: "overview",
      title: "Student Overview",
      icon: OverviewIcon,
      width: "1000px",
    },
    {
      id: "strategies",
      title: "Key Support Strategies",
      icon: StrategiesIcon,
      width: "1000px",
    },
    { id: "strengths", title: "Student Strengths", icon: Star, width: "900px" },
    {
      id: "challenges",
      title: "Student Challenges",
      icon: AlertTriangle,
      width: "900px",
    },
  ],
  branding: thriveK12Branding,
  colors: k12SunwashedPalette,
};

// Post-Secondary Configuration (future refactor)
const postSecondaryConfig: ReportConfig = {
  sections: [
    {
      id: "student-info",
      title: "Student Information",
      icon: StudentHeaderIcon,
      width: "1200px",
    },
    {
      id: "documents",
      title: "Documents Reviewed",
      icon: DocumentReviewHeaderIcon,
      width: "800px",
    },
    {
      id: "functional-impact",
      title: "Functional Impact",
      icon: FunctionalImpactHeaderIcon,
      width: "1000px",
    },
    {
      id: "accommodations",
      title: "Accommodations",
      icon: AccommodationsHeaderIcon,
      width: "1000px",
      subsections: [], // Dynamically populated from content
    },
  ],
  branding: thrivePostSecondaryBranding,
  colors: postSecondaryPalette,
};
```

### 2. **Design Token System**

All styling values centralized in design tokens:

```typescript
// apps/web/src/design-system/tokens/colors.ts
export const k12Colors = {
  navyBlue: "#1297D2",
  skyBlue: "#96D7E1",
  orange: "#F89E54",
  yellow: "#FDE677",
};

// apps/web/src/design-system/tokens/spacing.ts
export const spacing = {
  xs: "4px",
  sm: "8px",
  md: "16px",
  lg: "24px",
  xl: "32px",
  xxl: "48px",
};

// apps/web/src/design-system/tokens/typography.ts
export const typography = {
  h1: { size: "32px", weight: 700, family: "Avenir" },
  h2: { size: "24px", weight: 600, family: "Avenir" },
  h3: { size: "20px", weight: 600, family: "Avenir" },
  h4: { size: "18px", weight: 500, family: "Avenir" },
  body: { size: "14px", weight: 400, family: "Montserrat" },
};
```

### 3. **Reusable Component Library**

Extract shared components that work across all report types:

```
apps/web/src/components/design-system/
├── layout/
│   ├── ThriveReportLayout.tsx       // Main layout wrapper
│   ├── ThriveReportSidebar.tsx      // Left navigation
│   ├── ThriveReportHeader.tsx       // Top header with logo
│   └── ThriveReportSection.tsx      // Section container
├── cards/
│   ├── ThriveReportCard.tsx         // White card with shadow
│   ├── InfoCard.tsx                 // Label-value pairs
│   └── DocumentCard.tsx             // Document display
├── navigation/
│   ├── NavigationButton.tsx         // Sidebar nav button
│   └── BottomNavigation.tsx         // Next/Previous buttons
├── content/
│   ├── ThematicAccordion.tsx        // Colored accordion sections
│   ├── StrategyAccordion.tsx        // Support strategies
│   ├── StrengthAccordion.tsx        // Student strengths
│   └── ChallengeAccordion.tsx       // Student challenges
└── types.ts                         // Shared TypeScript interfaces
```

### 4. **Pluggable Content Components**

Each section type is a pluggable component:

```typescript
// Section registry maps section IDs to components
const sectionComponents = {
  "case-info": CaseInformationContent,
  documents: DocumentsReviewedContent,
  overview: StudentOverviewContent,
  strategies: SupportStrategiesContent,
  strengths: StudentStrengthsContent,
  challenges: StudentChallengesContent,
  "functional-impact": FunctionalImpactContent,
  accommodations: AccommodationsContent,
};

// Main report viewer uses config + registry
<ThriveReportLayout config={k12Config}>
  {config.sections.map((section) => {
    const ContentComponent = sectionComponents[section.id];
    return (
      <ThriveReportSection
        key={section.id}
        section={section}
        isActive={currentSection === section.id}
      >
        <ContentComponent data={reportData[section.id]} />
      </ThriveReportSection>
    );
  })}
</ThriveReportLayout>;
```

### 5. **CSS-in-JS with Tailwind + Design Tokens**

Use Tailwind classes with design token overrides:

```typescript
// Instead of inline styles:
<div style={{
  backgroundColor: "#96D7E1",
  padding: "24px",
  borderRadius: "12px"
}}>

// Use Tailwind + tokens:
<div className="bg-sky-blue p-lg rounded-xl">

// Or styled components for complex cases:
const SectionCard = styled.div`
  background: ${props => props.theme.colors.background};
  padding: ${props => props.theme.spacing.lg};
  border-radius: ${props => props.theme.borderRadius.xl};
  box-shadow: ${props => props.theme.shadows.xl};
`;
```

---

## Implementation Strategy

### Phase 1: Build Design System Foundation (Week 1-2)

**Tasks:**

1. Create design token files (colors, spacing, typography, shadows)
2. Build core layout components (ThriveReportLayout, Sidebar, Header, Section)
3. Build reusable card components (ThriveReportCard, InfoCard, DocumentCard)
4. Build navigation components (NavigationButton, BottomNavigation)
5. Create TypeScript interfaces for all configs and data structures

**Deliverables:**

- `apps/web/src/design-system/` directory with all tokens and components
- Storybook documentation for each component (optional)
- Unit tests for core components

### Phase 2: Build K-12 Content Components (Week 3-4)

**Tasks:**

1. Create K-12 config file with section definitions
2. Build K-12-specific content components (CaseInformationContent, etc.)
3. Build accordion components (ThematicAccordion, StrategyAccordion, etc.)
4. Implement PDF generation for K-12 report
5. Add accessibility features (keyboard nav, ARIA labels, focus management)

**Deliverables:**

- Fully functional K-12 report viewer
- PDF export functionality
- Accessibility compliance (WCAG 2.1 AA)

### Phase 3: Extract Tutoring Report (Week 5)

**Tasks:**

1. Create tutoring config file
2. Build tutoring-specific content components
3. Reuse design system components (no duplication)
4. Test across all three report types

**Deliverables:**

- Tutoring report viewer using shared design system
- Proof that system is truly modular

### Phase 4: Refactor Post-Secondary (Week 6-8)

**Tasks:**

1. Create post-secondary config file
2. Gradually migrate FigmaEnhancedReportViewer to use design system
3. Extract post-secondary-specific components
4. Comprehensive visual regression testing
5. Feature flag for safe rollout

**Deliverables:**

- Post-secondary report using shared design system
- Reduced code from 2110 lines to ~300 lines
- All three report types using same foundation

---

## Benefits of This Approach

### ✅ **Modularity**

- Add new sections by updating config (no code changes)
- Swap out content components without touching layout
- Easy to create new report types (IEP, Progress Reports, etc.)

### ✅ **Maintainability**

- Change colors once in tokens, applies everywhere
- Fix a bug in ThriveReportCard, all reports benefit
- Clear separation of concerns (layout vs content vs styling)

### ✅ **Reusability**

- 80%+ code shared across report types
- Design system components work for any THRIVE report
- Easy to white-label for different institutions

### ✅ **Testability**

- Small, focused components are easy to test
- Config-driven means less conditional logic
- Visual regression tests catch styling issues

### ✅ **Developer Experience**

- New developers can understand structure quickly
- Changes are predictable and safe
- No more "change one thing, break everything"

### ✅ **Zero Risk to Post-Secondary**

- Build K-12 completely separately
- Prove the system works before touching post-secondary
- Feature flag allows instant rollback if needed

---

## File Structure

```
apps/web/src/
├── components/
│   ├── design-system/              # Shared design system
│   │   ├── layout/
│   │   ├── cards/
│   │   ├── navigation/
│   │   ├── content/
│   │   └── types.ts
│   ├── k12/                        # K-12 specific components
│   │   ├── K12ReportViewer.tsx
│   │   ├── k12Config.ts
│   │   └── content/
│   │       ├── CaseInformationContent.tsx
│   │       ├── DocumentsReviewedContent.tsx
│   │       ├── StudentOverviewContent.tsx
│   │       ├── SupportStrategiesContent.tsx
│   │       ├── StudentStrengthsContent.tsx
│   │       └── StudentChallengesContent.tsx
│   ├── tutoring/                   # Tutoring specific components
│   │   ├── TutoringReportViewer.tsx
│   │   ├── tutoringConfig.ts
│   │   └── content/
│   └── FigmaEnhancedReportViewer.tsx  # Existing (to be refactored later)
└── design-system/
    ├── tokens/
    │   ├── colors.ts
    │   ├── spacing.ts
    │   ├── typography.ts
    │   ├── shadows.ts
    │   └── index.ts
    └── themes/
        ├── k12Theme.ts
        ├── postSecondaryTheme.ts
        └── tutoringTheme.ts
```

---

## Success Criteria

### Must Have

- [ ] K-12 report matches Figma mockup exactly
- [ ] All components use design tokens (zero inline styles with hardcoded values)
- [ ] Config-driven section system works
- [ ] PDF generation works for K-12
- [ ] Full keyboard navigation and screen reader support
- [ ] Zero impact on existing post-secondary report

### Should Have

- [ ] Tutoring report implemented using same system
- [ ] Storybook documentation for design system components
- [ ] Visual regression tests for all report types
- [ ] Performance: <1 second load time for any report

### Nice to Have

- [ ] Post-secondary refactored to use design system
- [ ] Theme editor for admins (change colors per module)
- [ ] Print-optimized layouts
- [ ] Export to Word/Excel

---

## Next Steps

1. **Review this strategy** - Does this approach address your concerns about modularity?
2. **Update k12-report-viewer spec** - Revise requirements/design/tasks to reflect this modular approach
3. **Start Phase 1** - Build the design system foundation first
4. **Iterate** - Get feedback after each phase before proceeding

---

## Questions for You

1. **Does this modular approach feel right?** Will it give you the flexibility you need?
2. **Should we update the k12-report-viewer spec now?** Or create a new "design-system" spec first?
3. **Timeline concerns?** Is 8 weeks reasonable, or do you need faster delivery?
4. **Any specific modularity requirements** I haven't addressed? (e.g., custom branding per institution, theme switching, etc.)
