# K-12 Multi-Row Table Parser Fix

## Issue

The "don't" items (with red X marks) were not showing up in the Strengths and Challenges sections. The root cause was that the parser wasn't handling multi-row table entries correctly.

## Root Cause

The markdown table format has multiple rows for each strength/challenge:

```markdown
| **Visual-Spatial Skills** | Excels with diagrams | ✔ Use visuals, diagrams |
| | | ✘ Avoid only text-based |
```

The first row has the title and a "do" item, while the second row has empty cells and a "don't" item. The original parser treated each row as a separate strength, so the "don't" items were being discarded because they had no title.

## Solution

Updated both `parseStrengthsFromTable()` and `parseChallengesFromTable()` functions to:

1. **Track current item**: Maintain a `currentStrength` or `currentChallenge` variable
2. **Detect new items**: When a row has a title, save the previous item and start a new one
3. **Handle continuation rows**: When a row has empty title cell, add data to the current item
4. **Accumulate action items**: Collect all "do" and "don't" items across multiple rows

## Changes Made

### parseStrengthsFromTable()

**Before:**

- Each table row created a new strength
- Continuation rows with empty title cells were ignored
- "Don't" items in continuation rows were lost

**After:**

```typescript
let currentStrength: Partial<Strength> | null = null;

for (const line of lines) {
  // ... parse cells ...

  if (strengthTitle) {
    // Save previous strength
    if (currentStrength && currentStrength.title) {
      strengths.push(currentStrength);
    }
    // Start new strength
    currentStrength = { title, whatYouSee: [], whatToDo: [] };
  } else if (currentStrength) {
    // Continuation row - add to current strength
    currentStrength.whatToDo.push(...);
  }
}
```

### parseChallengesFromTable()

Applied identical logic to handle multi-row challenge entries.

## How It Works Now

1. **First row with title**: Creates new strength/challenge
   - Parses title, whatYouSee, and first whatToDo item
2. **Continuation rows (empty title)**: Adds to current item

   - Appends additional whatYouSee items
   - Appends additional whatToDo items (including "don't" items)

3. **Symbol detection**: Correctly identifies ✔/✓ as "do" and ✘/✗ as "dont"

4. **Final save**: Saves the last item after loop completes

## Example Parsing

**Input:**

```markdown
| **Visual-Spatial Skills** | Excels with diagrams | ✔ Use visuals |
| | | ✘ Avoid text-only |
```

**Output:**

```javascript
{
  title: "Visual-Spatial Skills",
  whatYouSee: ["Excels with diagrams"],
  whatToDo: [
    { type: "do", text: "Use visuals" },
    { type: "dont", text: "Avoid text-only" }
  ]
}
```

## Display Order

The accordion components now display:

1. All "do" items with green checkmarks (✔)
2. All "don't" items with red X marks (✘) below them

The red color is explicitly set to `#dc2626` for visibility.

## Files Modified

1. **`apps/web/src/utils/k12ReportParserSimple.ts`**

   - Updated `parseStrengthsFromTable()` to handle multi-row entries
   - Updated `parseChallengesFromTable()` to handle multi-row entries

2. **`apps/web/src/design-system/components/content/StrengthAccordion.tsx`**

   - Already updated to filter and display "do" items first
   - Already updated to display "don't" items below with red X marks

3. **`apps/web/src/design-system/components/content/ChallengeAccordion.tsx`**
   - Already updated with same filtering logic

## Result

- ✅ "Don't" items now appear in the UI
- ✅ Red X marks are visible
- ✅ Items are properly grouped by strength/challenge
- ✅ "Do" items appear first, "don't" items below
- ✅ Multi-row table format is correctly parsed
