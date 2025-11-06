# K-12 Parser Table Format Update

## Overview

Updated the K-12 report parser (`k12ReportParserSimple.ts`) to properly handle the new markdown format with table-based strengths and challenges sections, and improved key support strategies parsing.

## Changes Made

### 1. Enhanced Key Support Strategies Parsing

**File:** `apps/web/src/utils/k12ReportParserSimple.ts`

**Issue:** The parser wasn't correctly handling the bullet-point format with bold labels like:

```markdown
**Use strengths:** visual-spatial thinker, creative problem-solver
**Support challenges:** reading fluency, retrieving words
```

**Solution:** Updated `parseStrategiesTable()` function to:

- Parse bold labels (`**Label:**`) as strategy titles
- Handle multi-line descriptions
- Combine related labels into comprehensive strategy descriptions

### 2. Added Table Format Support for Strengths

**New Function:** `parseStrengthsFromTable()`

**Purpose:** Parse table-format strengths sections like:

```markdown
| Strength                  | What You See         | What to Do        |
| ------------------------- | -------------------- | ----------------- |
| **Visual-Spatial Skills** | Excels with diagrams | ✔ Use visuals     |
|                           |                      | ✘ Avoid text-only |
```

**Features:**

- Extracts strength titles from first column
- Parses "What You See" observations
- Handles do/don't action items with ✔/✘ symbols
- Maintains color palette for visual consistency

### 3. Added Table Format Support for Challenges

**New Function:** `parseChallengesFromTable()`

**Purpose:** Parse table-format challenges sections with same structure as strengths

**Features:**

- Extracts challenge titles from first column
- Parses "What You See" observations
- Handles do/don't action items with ✔/✘ symbols
- Maintains proper ActionItem typing

### 4. Updated Main Parsing Functions

**Modified Functions:**

- `parseStrengthsSection()` - Now checks for table format first, falls back to bullet points
- `parseChallengesSection()` - Now checks for table format first, falls back to bullet points
- `parseStrategiesTable()` - Enhanced to handle bold label format

### 5. Fixed Regex Compatibility

**Issue:** Used ES2018 regex flags (`/s`) that weren't compatible with older TypeScript targets

**Solution:** Replaced `/s` flag with `[\s\S]*?` pattern for cross-compatibility

## New Format Support

The parser now correctly handles this markdown format:

```markdown
## Key Support Strategies

**Use strengths:** visual-spatial thinker, creative problem-solver
**Support challenges:** reading fluency, retrieving words
**Small changes go far:** give extra time, use graphic organizers
**Don't underestimate her:** With the right support, Charlotte's creativity will shine

## Strengths

| Strength                  | What You See         | What to Do                           |
| ------------------------- | -------------------- | ------------------------------------ |
| **Visual-Spatial Skills** | Excels with diagrams | ✔ Use visuals, diagrams              |
|                           |                      | ✘ Avoid only text-based explanations |

## Challenges / Areas of Need

| Challenge           | What You See                                | What to Do                                |
| ------------------- | ------------------------------------------- | ----------------------------------------- |
| **Reading Fluency** | Reads slowly, struggles with word retrieval | ✔ Give extra time, use audio books        |
|                     |                                             | ✘ Don't rush or call on her to read aloud |
```

## Testing

- ✅ Section extraction works correctly
- ✅ Key strategies parse into proper Strategy objects
- ✅ Table-format strengths parse with colors and action items
- ✅ Table-format challenges parse with proper ActionItem typing
- ✅ Backward compatibility maintained for existing formats
- ✅ No TypeScript compilation errors
- ✅ All dependent components still work correctly

## Impact

### Key Support Strategies Section

- Now populates properly from markdown instead of showing sample data
- Displays parsed strategies in the StrategyAccordion component

### Strengths and Challenges Sections

- Now format as accordion components with real parsed data
- Properly display "What You See" observations
- Show do/don't action items with appropriate icons
- Maintain visual consistency with color coding

## Files Modified

1. **`apps/web/src/utils/k12ReportParserSimple.ts`**
   - Enhanced `parseStrategiesTable()` function
   - Enhanced `parseStrengthsSection()` function
   - Enhanced `parseChallengesSection()` function
   - Added `parseStrengthsFromTable()` function
   - Added `parseChallengesFromTable()` function
   - Fixed regex compatibility issues

## Backward Compatibility

The parser maintains full backward compatibility:

- Still handles bullet-point formats for strengths/challenges
- Still handles existing strategy formats
- Falls back gracefully when table format isn't detected

## Next Steps

The parser is now ready to handle the new markdown format. The K12ReportViewer component will automatically use the parsed data instead of sample data, providing a much more accurate representation of the actual report content.
