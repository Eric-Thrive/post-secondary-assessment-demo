# Responsive Design Test Checklist

This document provides a comprehensive checklist for testing responsive behavior across all breakpoints for the K-12 Report Viewer design system components.

## Test Environment Setup

### Required Breakpoints

- **Mobile Small**: 320px width
- **Mobile**: 768px width (breakpoint)
- **Tablet**: 1024px width
- **Desktop**: 1200px width
- **Large Desktop**: 1920px width

### Testing Tools

- Chrome DevTools Device Toolbar
- Firefox Responsive Design Mode
- Actual mobile devices (iOS/Android)
- Actual tablet devices

## Component Testing Checklist

### 1. ThriveReportLayout

#### Mobile (<768px)

- [ ] Sidebar is hidden by default (translated off-screen)
- [ ] Hamburger menu button is visible in header
- [ ] Clicking hamburger opens sidebar with overlay
- [ ] Clicking overlay closes sidebar
- [ ] Pressing Escape key closes sidebar
- [ ] Main content takes full width
- [ ] No horizontal scroll
- [ ] Content padding is 16px (px-4)

#### Tablet (768px - 1199px)

- [ ] Sidebar is visible and sticky
- [ ] Hamburger menu is hidden
- [ ] Main content has proper offset for sidebar
- [ ] Content padding is 24px (px-6)
- [ ] No horizontal scroll

#### Desktop (1200px+)

- [ ] Sidebar is visible and sticky
- [ ] Main content has proper offset for sidebar
- [ ] Content padding is 32px (px-8)
- [ ] No horizontal scroll
- [ ] Layout is balanced and readable

### 2. ThriveReportSidebar

#### All Breakpoints

- [ ] Logo scales appropriately (max-height: 40px mobile, 48px desktop)
- [ ] Navigation buttons have minimum 44px height
- [ ] Navigation buttons are fully clickable/tappable
- [ ] Utility buttons have minimum 44px height
- [ ] Text is readable at all sizes
- [ ] Icons are properly sized (20px mobile, 24px desktop)
- [ ] Scrollable when content exceeds viewport height

### 3. ThriveReportHeader

#### Mobile (<768px)

- [ ] Logo is visible and scaled (max-height: 40px)
- [ ] Title is hidden (hidden md:block)
- [ ] Hamburger button is visible
- [ ] Hamburger button has minimum 44px touch target
- [ ] Header height is 80px
- [ ] Padding is 16px (px-4)

#### Tablet/Desktop (768px+)

- [ ] Logo is visible and scaled (max-height: 48px)
- [ ] Title is visible
- [ ] Title font size is appropriate (text-lg md:text-xl)
- [ ] Hamburger button is hidden
- [ ] Header height is 80px
- [ ] Padding is 24px tablet, 32px desktop

### 4. NavigationButton

#### All Breakpoints

- [ ] Minimum height is 44px
- [ ] Icon circle is 40px mobile, 48px desktop
- [ ] Icon size is 20px mobile, 24px desktop
- [ ] Text is readable
- [ ] Hover states work properly
- [ ] Focus indicators are visible
- [ ] Active state is clearly visible

### 5. ThriveReportCard

#### Mobile (<768px)

- [ ] Padding is 16px (p-4)
- [ ] Border radius is consistent
- [ ] Shadow is visible
- [ ] Content is readable
- [ ] No overflow

#### Tablet/Desktop (768px+)

- [ ] Padding is 24px (p-6)
- [ ] Border radius is consistent
- [ ] Shadow is visible
- [ ] Content is readable
- [ ] No overflow

### 6. InfoCard

#### Mobile (<768px)

- [ ] Grid layout is single column (grid-cols-1)
- [ ] Labels and values stack vertically
- [ ] Font size is 14px (text-sm)
- [ ] Gap is 12px (gap-3)
- [ ] All content is readable

#### Tablet/Desktop (768px+)

- [ ] Grid layout is two columns (grid-cols-[auto_1fr])
- [ ] Labels have minimum width of 160px
- [ ] Font size is 16px (text-base)
- [ ] Gap is 16px (gap-4)
- [ ] All content is readable

### 7. DocumentCard

#### Mobile (<768px)

- [ ] Icon circle is 40px (w-10 h-10)
- [ ] Icon size is 20px (w-5 h-5)
- [ ] Title font size is 16px (text-base)
- [ ] Metadata font size is 12px (text-xs)
- [ ] Metadata wraps properly (flex-wrap)
- [ ] Gap is 16px (gap-4)
- [ ] Left padding is 16px (pl-4)
- [ ] All content is readable

#### Tablet/Desktop (768px+)

- [ ] Icon circle is 48px (w-12 h-12)
- [ ] Icon size is 24px (w-6 h-6)
- [ ] Title font size is 18px (text-lg)
- [ ] Metadata font size is 14px (text-sm)
- [ ] Gap is 24px (gap-6)
- [ ] Left padding is 24px (pl-6)
- [ ] All content is readable

### 8. ThematicAccordion

#### Mobile (<768px)

- [ ] Trigger has minimum 44px height
- [ ] Trigger padding is 16px (p-4)
- [ ] Icon circle is 40px (w-10 h-10)
- [ ] Icon size is 20px (w-5 h-5)
- [ ] Title font size is 18px (text-lg)
- [ ] Content padding is 16px (p-4)
- [ ] Content font size is 16px (text-base)
- [ ] Gap is 12px (gap-3)
- [ ] Chevron is visible and rotates
- [ ] Animation is smooth (300ms)

#### Tablet/Desktop (768px+)

- [ ] Trigger padding is 24px (p-6)
- [ ] Icon circle is 48px (w-12 h-12)
- [ ] Icon size is 24px (w-6 h-6)
- [ ] Title font size is 24px (text-2xl)
- [ ] Content padding is 24px (p-6)
- [ ] Content font size is 20px (text-xl)
- [ ] Gap is 16px (gap-4)
- [ ] Chevron is visible and rotates
- [ ] Animation is smooth (300ms)

### 9. StrategyAccordion

#### Mobile (<768px)

- [ ] Trigger has minimum 44px height
- [ ] Trigger padding is 16px (p-4)
- [ ] Icon circle is 40px (w-10 h-10)
- [ ] Icon size is 20px (w-5 h-5)
- [ ] Title font size is 16px (text-base)
- [ ] Content padding is 16px (p-4)
- [ ] Content font size is 14px (text-sm)
- [ ] Gap is 12px (gap-3)

#### Tablet/Desktop (768px+)

- [ ] Trigger padding is 24px (p-6)
- [ ] Icon circle is 48px (w-12 h-12)
- [ ] Icon size is 24px (w-6 h-6)
- [ ] Title font size is 20px (text-xl)
- [ ] Content padding is 24px (p-6)
- [ ] Content font size is 16px (text-base)
- [ ] Gap is 16px (gap-4)

### 10. StrengthAccordion & ChallengeAccordion

#### Mobile (<768px)

- [ ] Trigger has minimum 44px height
- [ ] Trigger padding is 16px (p-4)
- [ ] Title font size is 16px (text-base)
- [ ] Content padding is 16px (p-4)
- [ ] Section headings are 16px (text-base)
- [ ] List items are 14px (text-sm)
- [ ] Check/X icons are 16px (w-4 h-4)
- [ ] Gap is 8px (gap-2)
- [ ] Margins are 16px (mb-4)

#### Tablet/Desktop (768px+)

- [ ] Trigger padding is 24px (p-6)
- [ ] Title font size is 20px (text-xl)
- [ ] Content padding is 24px (p-6)
- [ ] Section headings are 18px (text-lg)
- [ ] List items are 16px (text-base)
- [ ] Check/X icons are 20px (w-5 h-5)
- [ ] Gap is 8px (gap-2)
- [ ] Margins are 24px (mb-6)

### 11. BottomNavigation

#### Mobile (<768px)

- [ ] Button has minimum 44px height
- [ ] Button padding is 20px horizontal (px-5)
- [ ] Button font size is 14px (text-sm)
- [ ] Icon size is 16px (w-4 h-4)
- [ ] Top margin is 32px (mt-8)
- [ ] Top padding is 24px (pt-6)

#### Tablet/Desktop (768px+)

- [ ] Button has minimum 44px height
- [ ] Button padding is 24px horizontal (px-6)
- [ ] Button font size is 16px (text-base)
- [ ] Icon size is 20px (w-5 h-5)
- [ ] Top margin is 48px (mt-12)
- [ ] Top padding is 32px (pt-8)

## Typography Verification

### Mobile Font Sizes (<768px)

- [ ] H1: 28px (scaled from 32px)
- [ ] H2: 20px (scaled from 24px)
- [ ] H3: 18px (scaled from 20px)
- [ ] H4: 16px (scaled from 18px)
- [ ] Body Large: 15px (scaled from 16px)
- [ ] Body: 14px (unchanged)
- [ ] Small: 12px (unchanged)

### Desktop Font Sizes (768px+)

- [ ] H1: 32px
- [ ] H2: 24px
- [ ] H3: 20px
- [ ] H4: 18px
- [ ] Body Large: 16px
- [ ] Body: 14px
- [ ] Small: 12px

## Touch Target Verification

### All Interactive Elements

- [ ] Navigation buttons: ≥44px height
- [ ] Utility buttons: ≥44px height
- [ ] Accordion triggers: ≥44px height
- [ ] Bottom navigation button: ≥44px height
- [ ] Hamburger menu button: ≥44px touch area
- [ ] All buttons have adequate spacing between them

## Accessibility Testing

### Keyboard Navigation

- [ ] Tab order is logical at all breakpoints
- [ ] Focus indicators are visible at all breakpoints
- [ ] Escape key closes mobile sidebar
- [ ] Enter/Space activates all buttons

### Screen Reader Testing

- [ ] Sidebar state changes are announced
- [ ] Section changes are announced
- [ ] Accordion state changes are announced
- [ ] All interactive elements have proper labels

## Visual Regression Testing

### Layout Integrity

- [ ] No horizontal scroll at any breakpoint
- [ ] No content overflow at any breakpoint
- [ ] Proper spacing maintained at all breakpoints
- [ ] Consistent visual hierarchy at all breakpoints

### Color Contrast

- [ ] All text meets WCAG 2.1 AA standards (4.5:1 for body, 3:1 for large)
- [ ] Interactive elements have 3:1 contrast minimum
- [ ] Focus indicators are clearly visible

## Performance Testing

### Load Time

- [ ] Initial load < 1 second on 3G
- [ ] No layout shift during load
- [ ] Images load progressively

### Interaction Performance

- [ ] Sidebar animation is smooth (60fps)
- [ ] Accordion animation is smooth (60fps)
- [ ] Hover states respond immediately
- [ ] No janky scrolling

## Cross-Browser Testing

### Chrome

- [ ] All breakpoints work correctly
- [ ] Animations are smooth
- [ ] Touch targets work on touch devices

### Firefox

- [ ] All breakpoints work correctly
- [ ] Animations are smooth
- [ ] Touch targets work on touch devices

### Safari (iOS)

- [ ] All breakpoints work correctly
- [ ] Animations are smooth
- [ ] Touch targets work properly
- [ ] No viewport zoom issues

### Edge

- [ ] All breakpoints work correctly
- [ ] Animations are smooth
- [ ] Touch targets work on touch devices

## Device Testing

### iPhone (375px - 428px)

- [ ] Layout is readable and functional
- [ ] Touch targets are easily tappable
- [ ] No horizontal scroll
- [ ] Sidebar overlay works correctly

### iPad (768px - 1024px)

- [ ] Layout transitions properly at 768px
- [ ] Sidebar is visible and functional
- [ ] Touch targets are easily tappable
- [ ] No horizontal scroll

### Android Phone (360px - 412px)

- [ ] Layout is readable and functional
- [ ] Touch targets are easily tappable
- [ ] No horizontal scroll
- [ ] Sidebar overlay works correctly

### Android Tablet (800px - 1280px)

- [ ] Layout transitions properly at 768px
- [ ] Sidebar is visible and functional
- [ ] Touch targets are easily tappable
- [ ] No horizontal scroll

## Test Results Summary

### Date Tested: [YYYY-MM-DD]

### Tested By: [Name]

### Browser/Device: [Details]

#### Issues Found:

1. [Issue description]
2. [Issue description]

#### Recommendations:

1. [Recommendation]
2. [Recommendation]

---

## Notes

- All measurements are in pixels unless otherwise specified
- Tailwind CSS classes are provided in parentheses for reference
- Test at each breakpoint by resizing browser window slowly
- Use Chrome DevTools Device Toolbar for precise width testing
- Test on actual devices when possible for touch interaction verification
