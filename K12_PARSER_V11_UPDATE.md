# K-12 Parser Update for v11 Template

## Problem

The K-12 reports weren't loading any data - case info was empty, strengths/challenges showed no content, and strategies were missing. The simple parser was designed for an older markdown format that no longer matched the actual reports.

## Root Cause: Template Format Changed

The v11 template update (`scripts/update-k12-demo-template-v11.ts`) changed the markdown structure:

### Old Format (What Parser Expected)

```markdown
Student Name: Charlotte
Grade: 5th Grade

## Strengths

| **Title**<br>Description | ✔ Do this<br>✔ Do that | ✘ Don't<br>✘ Don't |
```

### New v11 Format (What Reports Actually Have)

```markdown
## Strengths

| **Verbal Expression** | Strong vocabulary and articulation | |
| | ✔ Encourage discussions | ✘ Don't rush responses |
| | ✔ Ask open-ended questions | ✘ Don't interrupt |
```

**Key Differences:**

1. **No inline case info fields** - Removed `Student Name:`, `Grade:` headers
2. **Two-row table entries** - First row has title + description, second row has actions
3. **Empty leading cells** - Continuation rows start with empty `|` to indicate they belong to previous entry
4. **No `<br>` separators** - Actions are on separate rows instead of `<br>` delimited
5. **Plain bullet strategies** - Format: `- **Name:** description` instead of complex parsing

## The Fix

Codex completely rewrote `parseK12ReportSimple.ts` to handle the v11 format:

### 1. Multi-Row Table Parsing

```typescript
// Detects continuation rows (empty first cell)
const isContinuationRow = cells[0].length === 0;

if (!isContinuationRow) {
  // Start new entry
  const { title, descriptions } = extractTitleAndPrimaryDescriptions(cells[0]);
  currentItem = { title, whatYouSee: descriptions, whatToDo: [] };
} else if (currentItem) {
  // Add to current entry
  addActionItems(currentItem.whatToDo, cells[1]);
  addActionItems(currentItem.whatToDo, cells[2]);
}
```

### 2. Action Detection

```typescript
function isActionCell(text: string): boolean {
  return /^[✔✓✘✗✖✕•-]/.test(text.trim());
}

function addActionItems(target: ActionItem[], cell?: string): void {
  const items = splitMultilineText(cell);
  items.forEach((item) => {
    const type = /^[✘✗✖✕-]/.test(item) ? "dont" : "do";
    const text = item.replace(/^[✔✓✅✘✗✖✕+\-•\s]+/, "").trim();
    target.push({ type, text });
  });
}
```

### 3. Strategy Parsing

```typescript
function parseStrategies(content: string): Strategy[] {
  // Handles: - **Name:** description
  const boldMatch = cleaned.match(/^\*\*(.+?)\*\*:?\s*(.+)$/);
  if (boldMatch) {
    strategies.push({
      strategy: boldMatch[1].trim(),
      description: boldMatch[2].trim(),
      icon: "Lightbulb",
    });
  }
}
```

### 4. Backward Compatibility

The parser still handles old `<br>` format:

```typescript
function normalizeCell(cell: string): string {
  return cell
    .replace(/<br\s*\/?>/gi, "\n") // Convert <br> to newlines
    .replace(/&nbsp;/gi, " ")
    .trim();
}
```

### 5. Color Palette for Strengths

```typescript
const strengthPalette = [
  { color: "#2563eb", bgColor: "#dbeafe" }, // Blue
  { color: "#047857", bgColor: "#d1fae5" }, // Green
  { color: "#7c3aed", bgColor: "#ede9fe" }, // Purple
  { color: "#db2777", bgColor: "#fce7f3" }, // Pink
];
```

## Cache Invalidation

Updated `K12ReportGenerator.tsx` to invalidate stale cache:

```typescript
// Changed from "simple-v2" to force re-parse
const PARSER_VERSION = "simple-v3-v11-template";
```

This ensures:

- Old cached empty data is discarded
- Parser runs with new logic
- Fresh data populates the viewer

## What Now Works

✅ **Strengths Section**

- Parses two-row entries correctly
- Extracts title from `**bold**` text
- Captures descriptions from second column
- Collects ✔ do actions and ✘ don't actions
- Auto-assigns colors from palette

✅ **Challenges Section**

- Same two-row parsing logic
- Groups actions by challenge
- Handles continuation rows

✅ **Key Support Strategies**

- Parses `- **Name:** description` format
- Strips markdown formatting
- Creates clean strategy objects

✅ **Backward Compatible**

- Still handles old `<br>` format
- Converts `<br>` to newlines automatically
- Works with both old and new reports

## Testing

Codex ran tests with:

1. **Legacy Charlotte sample** - Confirmed old format still parses
2. **Synthetic v11 report** - Verified new format populates all sections

## Next Steps

1. **Reload the page** - Cache will invalidate due to version bump
2. **Check console logs** - Should see:
   ```
   📄 Parsing K-12 report (simple parser)
   ✅ Parsed: X strengths, Y challenges
   ```
3. **Verify data display** - All sections should show actual content

## Files Changed

- ✅ `apps/web/src/utils/k12ReportParserSimple.ts` - Complete rewrite by Codex
- ✅ `apps/web/src/components/K12ReportGenerator.tsx` - Bumped PARSER_VERSION to "simple-v3-v11-template"

## Related Documentation

- `K12_PARSER_CACHE_FIX.md` - Previous cache issue fix
- `K12_REPORT_PARSER_FIX.md` - Earlier parser fix attempt
- `scripts/update-k12-demo-template-v11.ts` - Template changes that caused this
