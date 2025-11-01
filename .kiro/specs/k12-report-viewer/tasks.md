# Implementation Plan

## Phase 0: Design System Foundation

- [ ] 1. Create design token system

  - [x] 1.1 Create design-system directory structure

    - Create `apps/web/src/design-system/` directory
    - Create subdirectories: `tokens/`, `themes/`, `components/`
    - Set up index files for clean imports
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [x] 1.2 Define color tokens

    - Create `tokens/colors.ts` with K-12 Sunwashed palette
    - Add neutral colors (white, grays)
    - Add semantic colors (success, error, warning, info)
    - Export all color values
    - _Requirements: 1.1_

  - [x] 1.3 Define spacing tokens

    - Create `tokens/spacing.ts` with 4px base unit scale
    - Define xs, sm, md, lg, xl, xxl, xxxl values
    - Export spacing object
    - _Requirements: 1.2_

  - [x] 1.4 Define typography tokens

    - Create `tokens/typography.ts` with font families, sizes, weights, line heights
    - Match post-secondary typography hierarchy (H1: 32px, H2: 24px, H3: 20px, H4: 18px)
    - Export typography object
    - _Requirements: 1.3, 4.2_

  - [x] 1.5 Define shadow and border-radius tokens

    - Create `tokens/shadows.ts` with shadow depths (sm, md, lg, xl, xxl)
    - Create border-radius values (sm, md, lg, xl, full)
    - Export shadow and borderRadius objects
    - _Requirements: 1.4_

  - [x] 1.6 Create theme objects

    - Create `themes/k12Theme.ts` combining tokens for K-12 Teacher Guides
    - Create `themes/tutoringTheme.ts` for Tutoring Tutor Guides (same structure, can share most values)
    - Export theme objects
    - _Requirements: 1.5, 3.1_

  - [x] 1.7 Set up TypeScript interfaces
    - Create `components/types.ts` with ReportConfig, ReportSection, Theme interfaces
    - Define all component prop interfaces
    - Export all types
    - _Requirements: 3.2, 3.3_

- [ ] 2. Build reusable layout components

  - [x] 2.1 Create ThriveReportLayout component

    - Create `components/layout/ThriveReportLayout.tsx`
    - Accept config, currentSection, onSectionChange, theme, children props
    - Implement overall page structure with sidebar and content area
    - Use design tokens for all styling (zero inline hardcoded values)
    - Add responsive behavior (sidebar collapses on mobile)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 16.1, 16.2_

  - [x] 2.2 Create ThriveReportSidebar component

    - Create `components/layout/ThriveReportSidebar.tsx`
    - Accept sections, utilityButtons, currentSection, onSectionChange, theme, logo, reportTitle props
    - Implement fixed sidebar with navigation buttons for sections
    - Implement utility buttons section (Review, New Report, Home) below section navigation
    - Use design tokens for border, background, spacing
    - Add ARIA labels and keyboard navigation support
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 5.1, 5.2, 5.3, 5.4, 5.5, 6.1, 6.2, 6.3, 6.4, 14.1, 14.2, 14.3_

  - [x] 2.3 Create ThriveReportHeader component

    - Create `components/layout/ThriveReportHeader.tsx`
    - Accept logo, title, theme, actions props
    - Implement sticky header with gradient background using theme colors
    - Add logo button and action buttons (print, etc.)
    - Use design tokens for gradient, spacing, typography
    - _Requirements: 2.1, 2.2, 4.1, 4.2, 4.3, 4.4_

  - [x] 2.4 Create ThriveReportSection component

    - Create `components/layout/ThriveReportSection.tsx`
    - Accept section, isActive, theme, children props
    - Implement section wrapper with background gradient from theme
    - Add smooth transitions when switching sections
    - Use design tokens for padding, spacing, background
    - _Requirements: 2.3, 2.4, 4.1, 4.3_

  - [x] 2.5 Create NavigationButton component

    - Create `components/navigation/NavigationButton.tsx`
    - Accept section, isActive, theme, onClick props
    - Implement button with active/inactive states using theme
    - Add icon rendering (custom or Lucide icons)
    - Use design tokens for colors, spacing, borders
    - Add keyboard accessibility (Enter/Space) and focus indicators
    - _Requirements: 5.4, 5.5, 13.1, 13.2, 13.3_

  - [x] 2.6 Create BottomNavigation component
    - Create `components/navigation/BottomNavigation.tsx`
    - Accept nextLabel, onNext, theme props
    - Implement "Next Section" / "Complete Report" buttons
    - Use design tokens for button styling
    - _Requirements: 6.5, 7.5, 8.6, 9.5, 10.6, 11.6_

- [x] 3. Build reusable card components

  - [x] 3.1 Create ThriveReportCard component

    - Create `components/cards/ThriveReportCard.tsx`
    - Accept children, theme, variant, className props
    - Implement default, highlighted, and bordered variants
    - Use design tokens for border, shadow, borderRadius, padding, background
    - Ensure zero inline hardcoded styling values
    - _Requirements: 4.1, 4.3, 4.4, 15.1, 16.1, 16.2_

  - [x] 3.2 Create InfoCard component

    - Create `components/cards/InfoCard.tsx`
    - Accept data (Record<string, string>), theme props
    - Implement semantic HTML with `<dl>`, `<dt>`, `<dd>` elements
    - Use ThriveReportCard as wrapper
    - Use design tokens for typography, colors, spacing
    - _Requirements: 6.3, 6.4, 16.1, 16.2_

  - [x] 3.3 Create DocumentCard component

    - Create `components/cards/DocumentCard.tsx`
    - Accept title, author, date, keyFindings, theme props
    - Implement colored left border using theme.colors.accent
    - Add icon circle with theme-based background
    - Use ThriveReportCard as wrapper
    - Use design tokens for all styling
    - _Requirements: 7.2, 7.3, 7.4, 16.1, 16.2_

- [x] 4. Build reusable accordion components

  - [x] 4.1 Create ThematicAccordion component

    - Create `components/content/ThematicAccordion.tsx`
    - Accept sections (with title, icon, color, bgColor, content), theme props
    - Implement Radix UI Accordion with single-item behavior
    - Use design tokens for colors, spacing, typography
    - Add smooth expand/collapse animations (300ms)
    - Add icon rotation on expand/collapse
    - _Requirements: 8.3, 8.4, 8.5, 15.2, 15.3_

  - [x] 4.2 Create StrategyAccordion component

    - Create `components/content/StrategyAccordion.tsx`
    - Accept strategies (with strategy, description, icon), theme props
    - Implement Radix UI Accordion with single-item behavior
    - Use theme colors for icon circles and backgrounds
    - Use design tokens for all styling
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 15.2, 15.3_

  - [x] 4.3 Create StrengthAccordion component

    - Create `components/content/StrengthAccordion.tsx`
    - Accept strengths (with title, color, bgColor, whatYouSee, whatToDo), theme props
    - Implement Radix UI Accordion with single-item behavior
    - Add Check/X icons for do/don't items using semantic colors
    - Use design tokens for color-coded styling
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 15.2, 15.3_

  - [x] 4.4 Create ChallengeAccordion component
    - Create `components/content/ChallengeAccordion.tsx`
    - Accept challenges (with challenge, whatYouSee, whatToDo), theme props
    - Implement Radix UI Accordion with single-item behavior
    - Add Check/X icons for do/don't items
    - Use design tokens for styling
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 15.2, 15.3_

## Phase 1: K-12 Application Layer

- [x] 5. Create K-12 configuration and main component

  - [x] 5.1 Create k12Config.ts

    - Create `apps/web/src/components/k12/k12Config.ts`
    - Define K-12 section configuration with IDs, titles, icons
    - Define utility buttons (Review, New Report, Home) with routes
    - Import k12Theme from design system
    - Export k12Config object
    - _Requirements: 3.1, 3.2, 3.3, 5.2, 6.1, 6.2, 6.5_

  - [x] 5.2 Create section registry

    - Define sectionRegistry mapping section IDs to content components
    - Export registry for use in K12ReportViewer
    - _Requirements: 3.2_

  - [x] 5.3 Create K12ReportViewer main component
    - Create `apps/web/src/components/k12/K12ReportViewer.tsx`
    - Import ThriveReportLayout and other design system components
    - Import k12Config and sectionRegistry
    - Implement section state management
    - Render layout with config-driven sections
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 15.1, 15.5_

- [x] 6. Build K-12 content components

  - [x] 6.1 Create CaseInformationContent component

    - Create `apps/web/src/components/k12/content/CaseInformationContent.tsx`
    - Use InfoCard from design system
    - Use BottomNavigation from design system
    - Display student name, grade, school year, tutor, dates
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [x] 6.2 Create DocumentsReviewedContent component

    - Create `apps/web/src/components/k12/content/DocumentsReviewedContent.tsx`
    - Use DocumentCard from design system for each document
    - Use BottomNavigation from design system
    - Display list of reviewed documents
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [x] 6.3 Create StudentOverviewContent component

    - Create `apps/web/src/components/k12/content/StudentOverviewContent.tsx`
    - Use ThriveReportCard for "At a Glance" summary
    - Use ThematicAccordion from design system for three subsections
    - Use BottomNavigation from design system
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

  - [x] 6.4 Create SupportStrategiesContent component

    - Create `apps/web/src/components/k12/content/SupportStrategiesContent.tsx`
    - Use StrategyAccordion from design system
    - Use BottomNavigation from design system
    - Display key support strategies
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

  - [x] 6.5 Create StudentStrengthsContent component

    - Create `apps/web/src/components/k12/content/StudentStrengthsContent.tsx`
    - Use StrengthAccordion from design system
    - Use BottomNavigation from design system
    - Display student strengths with "What You See" and "What to Do"
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_

  - [x] 6.6 Create StudentChallengesContent component

    - Create `apps/web/src/components/k12/content/StudentChallengesContent.tsx`
    - Use ChallengeAccordion from design system
    - Use BottomNavigation from design system
    - Display student challenges with "What You See" and "What to Do"
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6_

  - [x] 6.7 Create ReportCompleteContent component
    - Create `apps/web/src/components/k12/content/ReportCompleteContent.tsx`
    - Add PDF download button
    - Add "Back to Cover" button
    - Display completion message
    - _Requirements: 12.1, 12.5_

- [x] 5. Build Student Overview section

  - [x] 5.1 Create AtAGlanceCard component

    - Implement summary card with Yellow background
    - Add Sparkles icon
    - Display overview text with proper typography
    - _Requirements: 5.1_

  - [x] 5.2 Create ThematicAccordion component

    - Implement Radix UI Accordion with single-item behavior
    - Add themed icons and colors for each subsection
    - Implement smooth expand/collapse animations
    - Add hover states with background color changes
    - _Requirements: 5.2, 5.3, 5.4, 5.5_

  - [x] 5.3 Implement StudentOverviewSection
    - Create section card with Blue gradient background
    - Render AtAGlanceCard
    - Render ThematicAccordion with three subsections
    - Add "Next Section" navigation button
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [x] 6. Build Key Support Strategies section

  - [x] 6.1 Create StrategyAccordion component

    - Implement Radix UI Accordion with single-item behavior
    - Add strategy icons in Orange circles
    - Display strategy name and description
    - Apply Orange theme styling
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [x] 6.2 Implement KeySupportStrategiesSection
    - Create section card with Orange gradient background
    - Render StrategyAccordion with all strategies
    - Add "Next Section" navigation button
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

- [x] 7. Build Student's Strengths section

  - [x] 7.1 Create StrengthAccordion component

    - Implement Radix UI Accordion with single-item behavior
    - Add color-coded headers (blue/green/orange)
    - Display "What You See" list with bullet points
    - Display "What to Do" list with Check/X icons
    - Apply themed background colors
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [x] 7.2 Implement StudentStrengthsSection
    - Create section card with Blue gradient background
    - Render StrengthAccordion with all strengths
    - Add "Next Section" navigation button
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

- [x] 8. Build Student's Challenges section

  - [x] 8.1 Create ChallengeAccordion component

    - Implement Radix UI Accordion with single-item behavior
    - Add AlertTriangle icons in Orange circles
    - Display "What You See" list with bullet points
    - Display "What to Do" list with Check/X icons
    - Apply Orange/Yellow theme styling
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [x] 8.2 Implement StudentChallengesSection
    - Create section card with Orange gradient background
    - Render ChallengeAccordion with all challenges
    - Add "Complete Report" navigation button
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

- [x] 7. Implement PDF generation functionality

  - [x] 7.1 Create PDFReport component

    - Create `apps/web/src/components/k12/PDFReport.tsx`
    - Design condensed single-page layout with all report data
    - Use design tokens for spacing, typography, colors
    - Apply neurodiverse-friendly spacing and clear hierarchy
    - Ensure all sections fit on A4 page
    - _Requirements: 12.2, 12.3_

  - [x] 7.2 Create PDFDownloadButton component
    - Create `apps/web/src/components/k12/PDFDownloadButton.tsx`
    - Implement PDF generation using html2canvas and jsPDF
    - Add loading state with spinner
    - Generate filename: "Teacher*Guide*[StudentName]\_[Date].pdf"
    - Handle PDF generation errors gracefully
    - _Requirements: 12.1, 12.2, 12.3, 12.4_

- [x] 8. Verify accessibility compliance

  - [x] 8.1 Verify ARIA labels and roles

    - Check all design system components have proper ARIA labels
    - Verify navigation has aria-label="Report sections navigation"
    - Verify accordions have proper aria-expanded and aria-controls
    - Verify buttons have descriptive aria-labels
    - _Requirements: 13.3, 13.4_

  - [x] 8.2 Test keyboard navigation

    - Test Tab order through all interactive elements
    - Test Enter/Space on all buttons and accordions
    - Verify visible focus indicators on all interactive elements
    - Test skip-to-main-content link
    - _Requirements: 13.1, 13.2_

  - [x] 8.3 Test screen reader compatibility

    - Test with NVDA or JAWS screen reader
    - Verify section changes are announced
    - Verify accordion state changes are announced

    - Verify all icons have descriptive labels
    - _Requirements: 13.3, 13.5_

- [ ] 9. Implement and test responsive design

  - [x] 9.1 Add responsive behavior to layout components

    - Update ThriveReportLayout to collapse sidebar on mobile (<768px)
    - Update ThriveReportSidebar to use hamburger menu on mobile
    - Adjust typography sizes for mobile (scale down 10-15%)
    - Ensure all touch targets are minimum 44x44px
    - _Requirements: 14.1, 14.2, 14.3_

  - [x] 9.2 Test responsive behavior across breakpoints
    - Test at 320px, 768px, 1024px, 1200px, 1920px
    - Verify no horizontal scroll at any breakpoint
    - Verify all cards and accordions are readable and functional
    - Test on actual mobile and tablet devices
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

- [x] 10. Verify design system consistency

  - [x] 10.1 Verify zero inline hardcoded styles

    - Audit all components for inline style={{}} with hardcoded values
    - Ensure all colors reference design tokens
    - Ensure all spacing references design tokens
    - Ensure all typography references design tokens
    - _Requirements: 16.1, 16.2, 16.3, 16.5_

  - [x] 10.2 Verify typography hierarchy matches post-secondary

    - Check H1 is 32px Bold
    - Check H2 is 24px Semibold
    - Check H3 is 20px Semibold
    - Check H4 is 18px Medium
    - _Requirements: 4.2, 15.3_

  - [x] 10.3 Verify visual consistency with post-secondary
    - Compare card styling (borders, shadows, spacing)
    - Compare button hover states
    - Compare accordion animations (300ms smooth)
    - Verify K-12 Sunwashed palette is preserved
    - _Requirements: 4.1, 4.3, 4.4, 4.5, 15.3_

- [-] 11. Testing and quality assurance (Optional)

  - [ ] 11.1 Write unit tests for design system components

    - Test ThriveReportLayout rendering
    - Test ThriveReportSidebar navigation interactions
    - Test NavigationButton active/inactive states
    - Test accordion expand/collapse behavior
    - Test single-item accordion constraint
    - _Requirements: All_

  - [ ] 11.2 Write unit tests for K-12 content components

    - Test CaseInformationContent rendering
    - Test DocumentsReviewedContent with multiple documents
    - Test StudentOverviewContent accordion behavior
    - Test PDF generation logic
    - _Requirements: All_

  - [ ] 11.3 Perform accessibility testing

    - Run axe-core accessibility checks on all components
    - Test keyboard-only navigation through entire report
    - Test with NVDA or JAWS screen reader
    - Verify color contrast ratios meet WCAG 2.1 AA
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 15.4_

  - [ ] 11.4 Conduct visual regression testing

    - Compare K-12 report with post-secondary styling
    - Verify typography hierarchy matches design spec
    - Check spacing consistency across all sections

    - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [-] 12. Documentation and handoff

  - [x] 12.1 Document design system components

    - Create README.md in `apps/web/src/design-system/`
    - Document all component props and usage examples
    - Document design token structure and how to add new tokens
    - Document theme structure and how to create new themes
    - _Requirements: 15.5_

  - [ ] 12.2 Document K-12 implementation

    - Create README.md in `apps/web/src/components/k12/`
    - Document k12Config structure
    - Document section registry pattern
    - Provide examples of how to add new sections
    - _Requirements: 3.5, 15.5_

  - [ ] 12.3 Create Tutoring implementation guide

    - Document how to create tutoringConfig (reuse K-12 sections)
    - Document how to apply tutoring theme
    - Provide step-by-step guide for building Tutoring Tutor Guide
    - Emphasize code reuse (95%+ shared with K-12)
    - _Requirements: 15.1, 15.5_

  - [ ] 12.4 Document differences from post-secondary
    - Note K-12/Tutoring-specific design decisions
    - Document shared section structure between K-12 and Tutoring
    - Add troubleshooting guide for common issues
    - _Requirements: 4.5, 15.5_

---

## Task Summary

**Total Tasks**: 12 main tasks (with subtasks)
**Optional Tasks**: Task 11 (Testing) - marked with \* to indicate optional

### Phase Breakdown:

**Phase 0: Design System Foundation** (Tasks 1-4)

- Build reusable design tokens, themes, layout components, card components, and accordion components
- These components will be used by K-12, Tutoring, and eventually Post-Secondary
- Estimated time: 2-3 weeks

**Phase 1: K-12 Application Layer** (Tasks 5-7)

- Build K-12-specific configuration and content components
- Implement PDF generation
- Estimated time: 2-3 weeks

**Phase 2: Verification & Documentation** (Tasks 8-12)

- Verify accessibility, responsive design, and design system consistency
- Optional: Write tests
- Document design system and implementation
- Estimated time: 1-2 weeks

### Key Differences from Original Tasks:

1. **Design System First**: Tasks 1-4 build reusable components before K-12-specific code
2. **Zero Inline Styles**: All tasks emphasize using design tokens, not hardcoded values
3. **Config-Driven**: K-12 sections defined in configuration, not hardcoded in components
4. **Tutoring Reuse**: Documentation includes guide for building Tutoring with 95%+ code reuse
5. **Modularity Focus**: Every task considers reusability across report types

### Success Criteria:

- ✅ All styling uses design tokens (zero inline hardcoded values)
- ✅ K-12 Teacher Guide matches Figma mockup
- ✅ Design system components work for both K-12 and Tutoring
- ✅ Config-driven section system allows adding/removing sections without code changes
- ✅ Full keyboard navigation and screen reader support
- ✅ Responsive design works on mobile, tablet, and desktop
- ✅ PDF generation works for K-12 Teacher Guide
- ✅ Documentation enables easy creation of Tutoring Tutor Guide

### Next Steps After Completion:

1. **Build Tutoring Tutor Guide** (1 week) - Reuse K-12 components with tutoring theme
2. **Refactor Post-Secondary** (3-4 weeks) - Migrate to design system, reduce from 2110 lines to ~300 lines
3. **Add New Report Types** - Easy to add IEP reports, progress reports, etc. using design system
