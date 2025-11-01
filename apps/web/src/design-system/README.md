# THRIVE Design System

A modular, token-based design system for building consistent, accessible report viewers across all THRIVE products.

## Overview

The THRIVE Design System provides design tokens, themes, and reusable components for K-12 Teacher Guides, Tutoring Tutor Guides, and Post-Secondary Accommodation Reports.

**Key Principles:**
- Zero Inline Styles: All styling uses design tokens
- Config-Driven: Report structure defined in configuration
- Reusable: 95%+ code reuse across report types
- Accessible: WCAG 2.1 AA compliant
- Responsive: Mobile, tablet, and desktop support
- Type-Safe: Full TypeScript support

## Quick Start

```tsx
import { ThriveReportLayout, ThriveReportCard, k12Theme } from "@/design-system";

function MyReport() {
  return (
    <ThriveReportLayout config={myConfig} currentSection="section-1" 
                        onSectionChange={handleSectionChange} theme={k12Theme}>
      <ThriveReportCard theme={k12Theme}>
        <h2>My Content</h2>
        <p>Report content goes here</p>
      </ThriveReportCard>
    </ThriveReportLayout>
  );
}
```

## Directory Structure

```
design-system/
├── tokens/          # Design tokens (colors, spacing, typography, shadows)
├── themes/          # Theme objects (k12Theme, tutoringTheme)
├── components/      # Reusable components (layout, cards, navigation, content)
├── hooks/           # Custom React hooks
└── README.md        # This file
```

## Design Tokens

Design tokens define all styling values in one place.

### Colors (tokens/colors.ts)

```typescript
import { colors } from "@/design-system/tokens";

// K-12 Sunwashed Palette
colors.navyBlue;    // "#1297D2"
colors.skyBlue;     // "#96D7E1"
colors.orange;      // "#F89E54"
colors.yellow;      // "#FDE677"

// Neutral Colors
colors.white, colors.gray50, colors.gray100, colors.gray200
colors.gray600, colors.gray700, colors.gray800, colors.gray900

// Semantic Colors
colors.success, colors.error, colors.warning, colors.info
```

### Spacing (tokens/spacing.ts)

Based on 4px base unit:

```typescript
import { spacing } from "@/design-system/tokens";

spacing.xs;     // "4px"
spacing.sm;     // "8px"
spacing.md;     // "16px"
spacing.lg;     // "24px"
spacing.xl;     // "32px"
spacing.xxl;    // "48px"
spacing.xxxl;   // "64px"
```

### Typography (tokens/typography.ts)

```typescript
import { typography } from "@/design-system/tokens";

// Font Families
typography.fontFamilies.primary;    // "Avenir, Avenir Next, ..."
typography.fontFamilies.secondary;  // "Montserrat, ..."

// Font Sizes (matches post-secondary hierarchy)
typography.fontSizes.h1;         // "32px"
typography.fontSizes.h2;         // "24px"
typography.fontSizes.h3;         // "20px"
typography.fontSizes.h4;         // "18px"
typography.fontSizes.bodyLarge;  // "16px"
typography.fontSizes.body;       // "14px"
typography.fontSizes.small;      // "12px"

// Font Weights
typography.fontWeights.regular;    // 400
typography.fontWeights.medium;     // 500
typography.fontWeights.semibold;   // 600
typography.fontWeights.bold;       // 700
typography.fontWeights.extrabold;  // 800
typography.fontWeights.heavy;      // 900
```

### Shadows & Border Radius (tokens/shadows.ts)

```typescript
import { shadows, borderRadius } from "@/design-system/tokens";

// Shadows
shadows.sm, shadows.md, shadows.lg, shadows.xl, shadows.xxl

// Border Radius
borderRadius.sm, borderRadius.md, borderRadius.lg, borderRadius.xl, borderRadius.full
```

### Adding New Tokens

1. Add token to appropriate file in `tokens/`
2. Export from `tokens/index.ts`
3. Use in components

```typescript
import { colors } from "@/design-system/tokens";
<div style={{ color: colors.newColor }}>Content</div>
```

## Themes

Themes combine design tokens for specific report types.

### K-12 Theme (themes/k12Theme.ts)

```typescript
import { k12Theme } from "@/design-system/themes";

<ThriveReportLayout theme={k12Theme}>
  {/* Content */}
</ThriveReportLayout>
```

Theme structure includes colors, spacing, typography, shadows, borderRadius, and navigation styles.

### Tutoring Theme (themes/tutoringTheme.ts)

Same structure as K-12 theme, customizable with different colors.

### Creating a New Theme

1. Create theme file in `themes/`
2. Export from `themes/index.ts`
3. Use in your report configuration

## Components

### Layout Components

#### ThriveReportLayout
Main layout wrapper providing overall page structure.

**Props:** config, currentSection, onSectionChange, theme, children

**Features:**
- Fixed sidebar navigation
- Responsive layout (sidebar collapses on mobile)
- Background gradient based on current section
- Semantic HTML5 structure

#### ThriveReportSidebar
Fixed left sidebar for section navigation.

**Props:** sections, utilityButtons, currentSection, onSectionChange, theme, logo, reportTitle

**Features:**
- Section navigation buttons
- Utility buttons (Review, New Report, Home)
- Active section highlighting
- Keyboard accessible with ARIA labels

#### ThriveReportHeader
Sticky header with logo, title, and action buttons.

#### ThriveReportSection
Wrapper for section content with consistent styling.

### Card Components

#### ThriveReportCard
Generic card container with consistent styling.

**Variants:** default, highlighted, bordered

#### InfoCard
Display label-value pairs using semantic HTML (dl, dt, dd).

#### DocumentCard
Display reviewed document information with colored left border and icon.

### Navigation Components

#### NavigationButton
Individual navigation button in sidebar with active/inactive states.

**Features:**
- Icon rendering
- Keyboard accessible (Enter/Space)
- Focus indicators
- ARIA labels

#### BottomNavigation
"Next Section" / "Complete Report" buttons.

### Content Components

#### ThematicAccordion
Expandable sections with themed colors (Student Overview).

**Features:**
- Single-item expansion
- Smooth animation (300ms)
- Icon rotation on expand/collapse

#### StrategyAccordion
Expandable support strategy cards.

#### StrengthAccordion
Expandable strength cards with "What You See" and "What to Do".

**Features:**
- Color-coded headers
- Check/X icons for do/don't items

#### ChallengeAccordion
Expandable challenge cards with "What You See" and "What to Do".

## Type Definitions

Core types defined in `components/types.ts`:

- ReportConfig: Report configuration structure
- ReportSection: Section definition
- UtilityButton: Utility button definition
- Theme: Theme structure
- SectionContentProps: Props for content components

## Accessibility

All components follow WCAG 2.1 AA standards:

**Keyboard Navigation:**
- Tab: Navigate through interactive elements
- Enter/Space: Activate buttons and accordions
- Escape: Close modals/dialogs

**Screen Reader Support:**
- Proper ARIA labels and roles
- Semantic HTML structure
- Landmark regions
- State announcements

**Color Contrast:**
- Body text: 4.5:1 minimum
- Large text: 3:1 minimum
- Interactive elements: 3:1 minimum

## Responsive Design

**Breakpoints:**
- Mobile: 0px - 767px
- Tablet: 768px - 1199px
- Desktop: 1200px+

**Layout Adaptations:**
- Desktop: Fixed sidebar (320px), full-width cards
- Tablet: Collapsible sidebar, single column
- Mobile: Hamburger menu, stacked layout, 44x44px touch targets

## Best Practices

### 1. Always Use Design Tokens

❌ Don't: `<div style={{ color: "#1297D2", padding: "16px" }}>Content</div>`

✅ Do: 
```tsx
import { colors, spacing } from "@/design-system/tokens";
<div style={{ color: colors.navyBlue, padding: spacing.md }}>Content</div>
```

### 2. Use Theme Props

Pass theme prop to all design system components.

### 3. Compose Components

Use design system components instead of custom divs.

### 4. Use Semantic HTML

Use proper HTML elements (button, nav, main, etc.) instead of divs.

## Testing

### Unit Tests

```tsx
import { render, screen } from "@testing-library/react";
import { ThriveReportCard } from "@/design-system";
import { k12Theme } from "@/design-system/themes";

test("renders card with content", () => {
  render(
    <ThriveReportCard theme={k12Theme}>
      <p>Test content</p>
    </ThriveReportCard>
  );
  expect(screen.getByText("Test content")).toBeInTheDocument();
});
```

### Accessibility Tests

Use axe-core for automated accessibility testing.

## Migration Guide

### From Inline Styles to Design System

Replace inline styles with design system components and tokens.

**Before:**
```tsx
<div style={{ backgroundColor: "#1297D2", padding: "16px", borderRadius: "8px" }}>
  Content
</div>
```

**After:**
```tsx
import { ThriveReportCard } from "@/design-system";
import { k12Theme } from "@/design-system/themes";

<ThriveReportCard theme={k12Theme}>Content</ThriveReportCard>
```

## Troubleshooting

**Theme not applying:** Ensure theme prop is passed to components.

**Tokens not found:** Check import path: `import { colors } from "@/design-system/tokens";`

**Responsive layout not working:** Ensure viewport meta tag is set in HTML.

## Related Documentation

- K-12 Implementation: `apps/web/src/components/k12/README.md`
- Requirements: `.kiro/specs/k12-report-viewer/requirements.md`
- Design: `.kiro/specs/k12-report-viewer/design.md`
- Tasks: `.kiro/specs/k12-report-viewer/tasks.md`

## Contributing

When adding new components:
1. Create component in appropriate subdirectory
2. Add TypeScript interfaces to `types.ts`
3. Export from subdirectory `index.ts`
4. Export from main `index.ts`
5. Add usage examples to this README
6. Write unit tests
7. Run accessibility checks

---

**Last Updated:** October 31, 2025  
**Version:** 1.0.0  
**Maintainer:** THRIVE Development Team
