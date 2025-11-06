# K-12 Accordion Action Item Ordering Fix

## Issue

In both Strengths and Challenges accordions, the "What to Do" items were displayed in mixed order (do/don't items intermixed). The user requested that:

1. All "do" items (with checkmarks) should appear first
2. All "don't" items (with X marks) should appear below the "do" items
3. The X marks should be red in color

## Solution

Updated both `StrengthAccordion` and `ChallengeAccordion` components to:

1. Filter and display "do" items first with green checkmarks
2. Filter and display "don't" items below with red X marks
3. Use explicit red color (`#dc2626`) for the X marks instead of theme error color

## Changes Made

### 1. StrengthAccordion.tsx

**Before:** Mixed order display of action items

```tsx
{strength.whatToDo.map((item, idx) => (
  // Mixed do/don't items
))}
```

**After:** Separated display with proper ordering

```tsx
{/* Display "do" items first */}
{strength.whatToDo
  .filter((item) => item.type === "do")
  .map((item, idx) => (
    // Green checkmarks
  ))}

{/* Display "don't" items below */}
{strength.whatToDo
  .filter((item) => item.type === "dont")
  .map((item, idx) => (
    // Red X marks
  ))}
```

### 2. ChallengeAccordion.tsx

**Applied identical changes** to maintain consistency between both accordion types.

## Visual Changes

### Before

- ✅ Do item 1
- ❌ Don't item 1
- ✅ Do item 2
- ❌ Don't item 2

### After

- ✅ Do item 1
- ✅ Do item 2
- ❌ Don't item 1 (now red)
- ❌ Don't item 2 (now red)

## Technical Details

- **Filtering:** Used `.filter()` to separate items by type
- **Ordering:** "do" items rendered first, "don't" items second
- **Styling:** Red color `#dc2626` for X marks (more vibrant than theme error color)
- **Keys:** Updated to use `do-${idx}` and `dont-${idx}` to avoid key conflicts

## Impact

- ✅ Improved visual hierarchy and readability
- ✅ Clear separation between positive and negative recommendations
- ✅ Consistent behavior across both Strengths and Challenges sections
- ✅ Better user experience with logical grouping of action items
- ✅ Maintains all existing functionality and accessibility features

## Files Modified

1. **`apps/web/src/design-system/components/content/StrengthAccordion.tsx`**

   - Updated "What to Do" section rendering logic
   - Added filtering and ordering for action items
   - Applied red color to X marks

2. **`apps/web/src/design-system/components/content/ChallengeAccordion.tsx`**
   - Applied identical changes for consistency
   - Maintained same visual hierarchy as StrengthAccordion
