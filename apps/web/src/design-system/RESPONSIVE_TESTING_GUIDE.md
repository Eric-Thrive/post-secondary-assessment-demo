# Responsive Design Testing Guide

## Quick Start Testing

### Using Browser DevTools

1. **Open Chrome DevTools**

   - Press `F12` or `Cmd+Option+I` (Mac) / `Ctrl+Shift+I` (Windows)
   - Click the device toolbar icon or press `Cmd+Shift+M` (Mac) / `Ctrl+Shift+M` (Windows)

2. **Test at Required Breakpoints**

   ```
   320px  - Mobile Small (iPhone SE)
   768px  - Tablet Breakpoint (iPad Mini)
   1024px - Tablet Large (iPad Pro)
   1200px - Desktop
   1920px - Large Desktop
   ```

3. **Verify Key Behaviors**
   - Sidebar collapses below 768px
   - Hamburger menu appears below 768px
   - Typography scales appropriately
   - Touch targets are minimum 44x44px
   - No horizontal scroll at any width

## Manual Testing Steps

### Step 1: Test Sidebar Behavior

**At 320px - 767px (Mobile)**

1. Navigate to K-12 Report Viewer
2. Verify sidebar is hidden (off-screen)
3. Verify hamburger menu button is visible in header
4. Click hamburger button
5. Verify sidebar slides in from left
6. Verify dark overlay appears behind sidebar
7. Click overlay
8. Verify sidebar closes
9. Open sidebar again
10. Press Escape key
11. Verify sidebar closes

**At 768px+ (Tablet/Desktop)**

1. Resize window to 768px width
2. Verify sidebar is visible and sticky
3. Verify hamburger menu is hidden
4. Verify sidebar stays visible when scrolling

### Step 2: Test Typography Scaling

**At 320px - 767px (Mobile)**

1. Open any report section
2. Measure font sizes using DevTools:
   - H1 should be ~28px
   - H2 should be ~20px
   - H3 should be ~18px
   - H4 should be ~16px
   - Body should be 14px
3. Verify text is readable and not cramped

**At 768px+ (Desktop)**

1. Resize window to 768px or larger
2. Measure font sizes:
   - H1 should be 32px
   - H2 should be 24px
   - H3 should be 20px
   - H4 should be 18px
   - Body should be 14px
3. Verify text hierarchy is clear

### Step 3: Test Touch Targets

**On Mobile Device or Touch Simulator**

1. Enable touch simulation in DevTools
2. Navigate through all sections
3. Verify all buttons are easily tappable:
   - Navigation buttons
   - Utility buttons
   - Accordion triggers
   - Bottom navigation buttons
4. Measure touch targets (should be ≥44x44px)
5. Verify adequate spacing between interactive elements

### Step 4: Test Card Components

**At 320px (Mobile Small)**

1. View InfoCard
   - Verify labels and values stack vertically
   - Verify padding is 16px
   - Verify text is readable
2. View DocumentCard
   - Verify icon is 40px circle
   - Verify content wraps properly
   - Verify no overflow
3. View Accordion components
   - Verify headers are 44px+ height
   - Verify icons are 40px circles
   - Verify content is readable

**At 768px+ (Desktop)**

1. View InfoCard
   - Verify labels and values are side-by-side
   - Verify padding is 24px
   - Verify labels have 160px min-width
2. View DocumentCard
   - Verify icon is 48px circle
   - Verify proper spacing
   - Verify no overflow
3. View Accordion components
   - Verify headers are 44px+ height
   - Verify icons are 48px circles
   - Verify content is readable

### Step 5: Test Horizontal Scroll

**At Each Breakpoint**

1. Set viewport to exact width:
   - 320px
   - 768px
   - 1024px
   - 1200px
   - 1920px
2. Scroll through entire page
3. Verify no horizontal scrollbar appears
4. Verify all content fits within viewport
5. Check for any overflow issues

### Step 6: Test Animations

**Sidebar Animation**

1. At mobile width, open/close sidebar multiple times
2. Verify smooth 300ms transition
3. Verify no jank or stuttering
4. Verify overlay fades in/out smoothly

**Accordion Animation**

1. Expand/collapse accordion items
2. Verify smooth 300ms transition
3. Verify chevron rotates smoothly
4. Verify content slides in/out smoothly

### Step 7: Test Keyboard Navigation

**At All Breakpoints**

1. Press Tab to navigate through page
2. Verify focus indicators are visible
3. Verify tab order is logical
4. Press Enter/Space on buttons
5. Verify buttons activate correctly
6. At mobile, press Escape with sidebar open
7. Verify sidebar closes

## Automated Testing Commands

### Run Visual Regression Tests

```bash
npm run test:visual
```

### Run Accessibility Tests

```bash
npm run test:a11y
```

### Run Responsive Tests

```bash
npm run test:responsive
```

## Common Issues and Solutions

### Issue: Horizontal Scroll on Mobile

**Solution**: Check for:

- Fixed width elements
- Padding/margin causing overflow
- Images without max-width
- Long unbreakable text

### Issue: Touch Targets Too Small

**Solution**:

- Add `minHeight: "44px"` to button styles
- Increase padding on interactive elements
- Add more spacing between buttons

### Issue: Text Too Small on Mobile

**Solution**:

- Verify mobile font sizes are applied
- Check Tailwind responsive classes (text-sm md:text-base)
- Ensure useResponsiveTypography hook is used

### Issue: Sidebar Not Collapsing

**Solution**:

- Check breakpoint in ThriveReportLayout (768px)
- Verify Tailwind classes: `md:translate-x-0`
- Check hamburger button visibility: `md:hidden`

### Issue: Layout Shift on Load

**Solution**:

- Add explicit heights to images
- Use skeleton loaders
- Preload critical fonts

## Testing Checklist Summary

Quick checklist for each breakpoint:

- [ ] 320px: Sidebar hidden, hamburger visible, text readable, no scroll
- [ ] 768px: Sidebar visible, hamburger hidden, layout transitions
- [ ] 1024px: Proper spacing, readable text, balanced layout
- [ ] 1200px: Optimal desktop layout, proper margins
- [ ] 1920px: Content centered, no excessive whitespace

## Reporting Issues

When reporting responsive issues, include:

1. Breakpoint width (e.g., "At 375px...")
2. Browser and version
3. Device (if testing on actual device)
4. Screenshot or video
5. Steps to reproduce
6. Expected vs actual behavior

## Next Steps

After completing manual testing:

1. Document any issues found
2. Create tickets for fixes needed
3. Re-test after fixes are applied
4. Update this guide with any new findings
5. Share results with team

---

**Last Updated**: [Current Date]
**Tested By**: [Your Name]
**Status**: Ready for Testing
