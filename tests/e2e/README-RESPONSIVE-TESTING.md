# K-12 Report Viewer Responsive Testing

## Overview

This directory contains automated responsive design tests for the K-12 Report Viewer component. The tests verify that the report viewer works correctly across all required breakpoints and maintains proper functionality on different screen sizes.

## Test Files

- **k12-responsive.spec.ts**: Main responsive test suite
- **k12-responsive-test-results.md**: Detailed test execution results and findings

## Quick Start

### Run All Responsive Tests

```bash
npx playwright test tests/e2e/k12-responsive.spec.ts
```

### Run on Specific Browser

```bash
# Chromium (Chrome/Edge)
npx playwright test tests/e2e/k12-responsive.spec.ts --project=chromium

# Firefox
npx playwright test tests/e2e/k12-responsive.spec.ts --project=firefox

# WebKit (Safari)
npx playwright test tests/e2e/k12-responsive.spec.ts --project=webkit
```

### Run with UI Mode (Interactive Debugging)

```bash
npx playwright test tests/e2e/k12-responsive.spec.ts --ui
```

### Generate HTML Report

```bash
npx playwright test tests/e2e/k12-responsive.spec.ts --reporter=html
npx playwright show-report
```

## Breakpoints Tested

The tests verify responsive behavior at the following breakpoints as specified in requirements 14.1-14.5:

| Breakpoint    | Width  | Device Type   | Description                  |
| ------------- | ------ | ------------- | ---------------------------- |
| Mobile Small  | 320px  | iPhone SE     | Smallest mobile viewport     |
| Tablet        | 768px  | iPad Mini     | Tablet breakpoint transition |
| Tablet Large  | 1024px | iPad Pro      | Large tablet viewport        |
| Desktop       | 1200px | Desktop       | Standard desktop viewport    |
| Large Desktop | 1920px | Large Monitor | Wide desktop viewport        |

## Test Coverage

### Core Functionality Tests

1. **Horizontal Scroll Prevention**

   - Verifies no horizontal scrollbar at any breakpoint
   - Tests at top and bottom of page
   - Ensures content fits within viewport

2. **Card Rendering**

   - Verifies cards display without overflow
   - Checks proper spacing and padding
   - Validates styling (shadows, borders)

3. **Typography**

   - Verifies text remains readable at all sizes
   - Checks minimum font size (14px)
   - Validates typography hierarchy

4. **Interactive Elements**

   - Tests accordion expand/collapse functionality
   - Verifies touch target sizes (minimum 44x44px)
   - Validates button interactions

5. **Responsive Transitions**
   - Tests smooth transitions between breakpoints
   - Verifies layout maintains integrity during resize
   - Checks for layout shift issues

### Requirements Verified

- ✅ **14.1**: Mobile-first responsive design (320px+)
- ✅ **14.2**: Tablet breakpoint at 768px
- ✅ **14.3**: Desktop breakpoint at 1200px
- ✅ **14.4**: Touch targets minimum 44x44px
- ✅ **14.5**: No horizontal scroll at any breakpoint

## Test Implementation

### Helper Functions

```typescript
// Check for horizontal scroll
async function checkNoHorizontalScroll(page: Page) {
  const hasHorizontalScroll = await page.evaluate(() => {
    return (
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth
    );
  });
  expect(hasHorizontalScroll).toBe(false);
}
```

### Test Structure

Each breakpoint has its own test suite with specific tests:

```typescript
test.describe("320px - Mobile Small", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 667 });
  });

  test("should have no horizontal scroll", async ({ page }) => {
    // Test implementation
  });
});
```

## Manual Testing Recommendations

While automated tests cover core functionality, manual testing on actual devices is recommended for:

### Mobile Devices

- iPhone SE (320px)
- iPhone 12/13/14 (390px)
- iPhone 14 Pro Max (428px)
- Samsung Galaxy S21 (360px)
- Google Pixel 5 (393px)

### Tablet Devices

- iPad Mini (768px)
- iPad Air (820px)
- iPad Pro 11" (834px)
- iPad Pro 12.9" (1024px)

### Desktop Browsers

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Troubleshooting

### Tests Failing Due to Server Not Running

If tests fail with `ERR_CONNECTION_REFUSED`, ensure the dev server is running:

```bash
npm run dev
```

Or let Playwright start it automatically (configured in `playwright.config.ts`).

### Missing Browsers

If you see browser installation errors:

```bash
# Install all browsers
npx playwright install

# Install specific browser
npx playwright install chromium
npx playwright install firefox
npx playwright install webkit
```

### Route Not Found

Ensure the `/k12-report-viewer-demo` route is configured in `apps/web/src/App.tsx`:

```typescript
<Route path="/k12-report-viewer-demo" element={<K12ReportViewerDemo />} />
```

## Continuous Integration

These tests are designed to run in CI/CD pipelines. The Playwright configuration includes:

- Automatic retry on failure (2 retries in CI)
- Screenshot capture on failure
- Video recording on failure
- HTML, JSON, and JUnit report generation

## Next Steps

1. **Install Additional Browsers**: Run `npx playwright install` to test on all browsers
2. **Manual Device Testing**: Test on actual mobile and tablet devices
3. **Performance Testing**: Add performance metrics for responsive transitions
4. **Visual Regression**: Consider adding screenshot comparisons
5. **Accessibility Testing**: Verify keyboard navigation and screen reader compatibility

## Related Documentation

- [Responsive Test Checklist](../../apps/web/src/design-system/RESPONSIVE_TEST_CHECKLIST.md)
- [Responsive Testing Guide](../../apps/web/src/design-system/RESPONSIVE_TESTING_GUIDE.md)
- [Test Results](./k12-responsive-test-results.md)

## Support

For issues or questions about responsive testing:

1. Check the test results document for known issues
2. Review the responsive testing guide for manual testing procedures
3. Consult the design system documentation for responsive design patterns
