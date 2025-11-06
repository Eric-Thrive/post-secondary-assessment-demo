# K-12 Parser Cache Issue - Resolution

## Problem

The K-12 report viewer was showing blank content (headers but no data) even though:

- Markdown report exists (8,485 characters)
- Parser code looks correct
- No parser logs (📄, 📊) appearing in console

## Root Cause: Stale Cache in Development

The issue was **cache persistence across Fast Refresh**:

1. Initial parse may have returned empty/incorrect data
2. Component state cache stored the empty result
3. Fast Refresh in development preserved the cache state
4. Subsequent renders used cached empty data
5. Parser never ran again (hence no logs)
6. `useMemo` short-circuited at the cache check

From Codex analysis:

> "apps/web/src/components/K12ReportGenerator.tsx:397-407 short-circuits the memo whenever parsedDataCache matches the current case + markdown hash. In dev, Fast Refresh preserves that state, so after your first (empty) parse you keep returning the cached object and never reach the parseK12ReportSimple call—hence no 📄 logs and the viewer keeps rendering the stale empty arrays."

## The Actual Markdown Format

The reports use **simple table format**, not "Validated Findings":

```markdown
## Strengths

| **Title**<br>Description                   | ✔ Do this<br>✔ Do that  | ✘ Don't<br>✘ Don't     |
| ------------------------------------------ | ----------------------- | ---------------------- |
| **Verbal Expression**<br>Strong vocabulary | ✔ Encourage discussions | ✘ Don't rush responses |
```

This means:

- ✅ `parseK12ReportSimple` is the CORRECT parser for this format
- ❌ `parseK12Report` expects "Validated Findings" format (different structure)

## Solution: Parser Version in Cache Key

Added a `parserVersion` field to the cache key to invalidate stale cache:

### Changes Made

**File: `apps/web/src/components/K12ReportGenerator.tsx`**

```typescript
// 1. Added parser version constant
const PARSER_VERSION = "simple-v2";

// 2. Updated cache structure
const [parsedDataCache, setParsedDataCache] = useState<{
  caseId: string;
  markdownHash: string;
  parserVersion: string; // NEW: Invalidates cache when parser changes
  data: K12ReportData;
} | null>(null);

// 3. Cache check validates parser version
if (
  parsedDataCache &&
  parsedDataCache.caseId === currentCaseId &&
  parsedDataCache.markdownHash === markdownHash &&
  parsedDataCache.parserVersion === PARSER_VERSION && // NEW
  retryCount === 0
) {
  console.log("🚀 Using component-cached parsed data");
  return parsedDataCache.data;
}

// 4. Added cache miss debugging
if (parsedDataCache) {
  console.log("❌ Cache miss reason:");
  console.log("   Case ID match:", parsedDataCache.caseId === currentCaseId);
  console.log("   Hash match:", parsedDataCache.markdownHash === markdownHash);
  console.log(
    "   Version match:",
    parsedDataCache.parserVersion === PARSER_VERSION
  );
}

// 5. Cache storage includes version
setParsedDataCache({
  caseId: currentCaseId,
  markdownHash,
  parserVersion: PARSER_VERSION, // NEW
  data: parsed,
});
```

## How This Fixes The Issue

### Before (Broken)

1. Parser runs once, returns empty data (bug or format issue)
2. Cache stores: `{ caseId: "123", markdownHash: "abc", data: {} }`
3. Fast Refresh preserves cache
4. Next render: cache hit → returns empty data
5. Parser never runs again
6. No logs, no data

### After (Fixed)

1. Parser runs, returns empty data
2. Cache stores: `{ caseId: "123", markdownHash: "abc", parserVersion: "simple-v2", data: {} }`
3. Developer fixes parser or increments `PARSER_VERSION`
4. Next render: cache miss (version mismatch) → runs parser again
5. Parser logs appear (📄, 📊)
6. Fresh data returned

## Benefits

1. **Invalidates stale cache** - Change `PARSER_VERSION` to force re-parse
2. **Development-friendly** - No need to hard reload to test parser changes
3. **Debugging visibility** - Cache miss logs show exactly why cache was invalidated
4. **Production-safe** - Cache still works normally when version is stable
5. **Simple to use** - Just increment version when parser logic changes

## Testing

To verify the fix works:

1. **Check console logs** - Should see:

   ```
   🚀🚀🚀 ABOUT TO CALL SIMPLE PARSER 🚀🚀🚀
   Parser version: simple-v2
   📄 Parsing K-12 report (simple parser)
   ✅ Parsed: X strengths, Y challenges
   ```

2. **Check data display** - Report viewer should show:

   - Actual student name (not "Student")
   - Real strengths from markdown tables
   - Real challenges from markdown tables
   - Support strategies

3. **Test cache invalidation**:
   - Make a parser change
   - Increment `PARSER_VERSION` to `"simple-v3"`
   - Refresh page
   - Should see cache miss logs and fresh parse

## Related Files

- `apps/web/src/components/K12ReportGenerator.tsx` - **FIXED** (added parser version)
- `apps/web/src/utils/k12ReportParserSimple.ts` - Correct parser for current format
- `apps/web/src/utils/k12ReportParser.ts` - Comprehensive parser (for different format)
- `K12_REPORT_PARSER_FIX.md` - Previous fix documentation

## Key Takeaway

The parser was correct, the format was correct, but **stale cache in development** prevented the parser from running. Adding a version to the cache key solves this elegantly without disabling caching entirely.
