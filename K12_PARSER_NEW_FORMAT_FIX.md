# K-12 Parser Fix for New Report Format

## Date

November 1, 2025

## Problem

The simple parser wasn't working with the new Student Support Report format that uses:

- `---` as section delimiters instead of just `##` headers
- `## Challenges / Areas of Need` instead of just `## Challenges`
- `**Label:** description` format for strategies (colon inside bold markers)

## Changes Made

### 1. Fixed `extractSection()` function

**File:** `apps/web/src/utils/k12ReportParserSimple.ts`

**Issue:** Regex only looked for `##` or end of file, missing `---` delimiters

**Fix:**

```typescript
// OLD
const regex = new RegExp(`${header}([\\s\\S]*?)(?=##|$)`, "i");

// NEW
const escapedHeader = header.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const regex = new RegExp(
  `${escapedHeader}[^\\n]*([\\s\\S]*?)(?=##|---|$)`,
  "i"
);
```

**Benefits:**

- Handles `---` section delimiters
- Matches headers with suffixes like "## Challenges / Areas of Need"
- Properly escapes special regex characters in headers

### 2. Fixed `parseStrategies()` function

**File:** `apps/web/src/utils/k12ReportParserSimple.ts`

**Issue:**

- Regex removed one `*` from `**Label:**` format
- Didn't match colon inside bold markers

**Fix:**

```typescript
// OLD
const cleaned = line.replace(/^[-*]\s*/, "").trim();
const boldMatch = cleaned.match(/^\*\*(.+?)\*\*\s*:\s*(.+)$/);

// NEW
const cleaned = line
  .replace(/^[-]\s*/, "")
  .replace(/^\*\s+/, "")
  .trim();
const boldMatch = cleaned.match(/\*\*(.+?):\*\*\s*(.+)$/);
```

**Benefits:**

- Preserves `**` markers when removing list bullets
- Correctly matches `**Label:**` format (colon inside markers)
- Extracts strategy names and descriptions properly

## Testing

All sections now parse correctly:

- ✅ Student Overview
- ✅ Key Support Strategies (4 strategies parsed)
- ✅ Strengths table
- ✅ Challenges / Areas of Need table

## Format Compatibility

The parser now handles:

- Headers with optional suffixes
- `---` section delimiters
- `**Label:** description` strategy format
- Multi-row table entries with continuation rows
