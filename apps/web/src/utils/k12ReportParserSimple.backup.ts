/**
 * Simple K-12 Report Parser for Current Format
 * Handles the actual markdown format with <br> tags in tables
 */

import type {
  CaseInformation,
  Document,
  StudentOverview,
  Strategy,
  Strength,
  Challenge,
  ActionItem,
} from "@/design-system/components/types";

export interface K12ReportData {
  caseInfo: CaseInformation;
  documentsReviewed: Document[];
  studentOverview: StudentOverview;
  supportStrategies: Strategy[];
  studentStrengths: Strength[];
  studentChallenges: Challenge[];
}

/**
 * Parse K12 report from current markdown format
 */
export function parseK12ReportSimple(markdown: string): K12ReportData {
  console.log("📄 Parsing K-12 report (simple parser)");

  // Extract case info - try multiple field name variations
  let studentName = extractField(markdown, "Student Name");
  if (!studentName) {
    studentName = extractField(markdown, "Student");
  }
  if (!studentName) {
    // Try to extract from Student Overview section
    const overviewMatch = markdown.match(
      /##\s*Student Overview[^\n]*\n+([^\n]+)/i
    );
    if (overviewMatch) {
      // Extract name from first sentence if it contains a name pattern
      const firstLine = overviewMatch[1];
      const nameMatch = firstLine.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/);
      if (nameMatch) {
        studentName = nameMatch[1];
      }
    }
  }
  studentName = studentName || "Student";

  let grade = extractField(markdown, "Grade");
  if (!grade) {
    grade = extractField(markdown, "Grade Level");
  }
  if (!grade) {
    // Try to extract from Student Overview
    const gradeMatch = markdown.match(/grade\s+(\d+|[A-Za-z]+)/i);
    if (gradeMatch) {
      grade = gradeMatch[1];
    }
  }
  grade = grade || "Grade Not Specified";

  // Parse strengths - try multiple header variations
  let strengthsSection = extractSection(markdown, "## Strengths");
  if (!strengthsSection) {
    strengthsSection = extractSection(markdown, "## Student Strengths");
  }
  if (!strengthsSection) {
    strengthsSection = extractSection(markdown, "## Areas of Strength");
  }
  const studentStrengths: Strength[] = parseTableSection(
    strengthsSection,
    "strength"
  ) as Strength[];

  // Parse challenges - try multiple header variations
  let challengesSection = extractSection(markdown, "## Challenges");
  if (!challengesSection) {
    challengesSection = extractSection(markdown, "## Student Challenges");
  }
  if (!challengesSection) {
    challengesSection = extractSection(markdown, "## Areas of Need");
  }
  if (!challengesSection) {
    challengesSection = extractSection(markdown, "## Areas for Growth");
  }
  const studentChallenges: Challenge[] = parseTableSection(
    challengesSection,
    "challenge"
  ) as Challenge[];

  // Parse overview - try multiple header variations
  let overviewSection = extractSection(markdown, "## Student Overview");
  if (!overviewSection) {
    overviewSection = extractSection(markdown, "## Overview");
  }
  if (!overviewSection) {
    overviewSection = extractSection(markdown, "## Executive Summary");
  }
  const studentOverview = {
    atAGlance: overviewSection || "Student overview will be provided.",
    sections: [],
  };

  // Parse strategies - try multiple header variations
  let strategiesSection = extractSection(markdown, "## Key Support Strategies");
  if (!strategiesSection) {
    strategiesSection = extractSection(markdown, "## Support Strategies");
  }
  if (!strategiesSection) {
    strategiesSection = extractSection(markdown, "## Strategies");
  }
  if (!strategiesSection) {
    strategiesSection = extractSection(markdown, "## Recommendations");
  }
  const supportStrategies = parseStrategies(strategiesSection);

  // Log parsing results with warnings for missing data
  console.log(
    `✅ Parsed: ${studentStrengths.length} strengths, ${studentChallenges.length} challenges, ${supportStrategies.length} strategies`
  );

  if (studentStrengths.length === 0) {
    console.warn("⚠️ No strengths found - check markdown format");
  }
  if (studentChallenges.length === 0) {
    console.warn("⚠️ No challenges found - check markdown format");
  }
  if (supportStrategies.length === 0) {
    console.warn("⚠️ No strategies found - check markdown format");
  }

  return {
    caseInfo: {
      studentName,
      grade,
      schoolYear:
        new Date().getFullYear() + "-" + (new Date().getFullYear() + 1),
      tutor: "Not Specified",
      dateCreated: new Date().toLocaleDateString(),
      lastUpdated: new Date().toLocaleDateString(),
    },
    documentsReviewed: [],
    studentOverview,
    supportStrategies,
    studentStrengths,
    studentChallenges,
  };
}

function extractField(markdown: string, fieldName: string): string | null {
  // More flexible field matching - handles variations in spacing and punctuation
  const escapedField = fieldName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`${escapedField}\\s*[:\\-]?\\s*([^\\n]+)`, "i");
  const match = markdown.match(regex);
  return match ? match[1].trim() : null;
}

function extractSection(markdown: string, header: string): string {
  // Flexible header matching - handles variations and suffixes
  // e.g., "## Strengths" matches "## Student Strengths", "## Strengths / Areas", etc.
  const escapedHeader = header.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  // Try exact match first
  let regex = new RegExp(
    `${escapedHeader}[^\\n]*([\\s\\S]*?)(?=##|---|$)`,
    "i"
  );
  let match = markdown.match(regex);

  // If no match, try fuzzy match (contains the keyword)
  if (!match) {
    const keyword = header.replace(/^#+\s*/, "").trim();
    const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    regex = new RegExp(
      `##[^\\n]*${escapedKeyword}[^\\n]*([\\s\\S]*?)(?=##|---|$)`,
      "i"
    );
    match = markdown.match(regex);
  }

  return match ? match[1].trim() : "";
}

function parseTableSection(
  content: string,
  type: "strength" | "challenge"
): (Strength | Challenge)[] {
  const results: (Strength | Challenge)[] = [];

  if (!content || !content.includes("|")) {
    console.log(`⚠️ No table found in ${type} section`);
    return results;
  }

  const lines = content.split("\n");
  let currentItem: Strength | Challenge | null = null;

  for (const rawLine of lines) {
    if (!rawLine.trim().startsWith("|")) continue;

    const cells = rawLine
      .split("|")
      .slice(1, -1)
      .map((cell) => normalizeCell(cell));

    if (cells.length === 0) continue;

    // Skip header and divider rows
    if (isDividerRow(cells) || isHeaderRow(cells, type)) {
      continue;
    }

    const isContinuationRow = cells[0].length === 0;

    if (!isContinuationRow) {
      // Commit previous item before starting a new one
      if (currentItem) {
        results.push(currentItem);
        currentItem = null;
      }

      const { title, descriptions } = extractTitleAndPrimaryDescriptions(
        cells[0]
      );

      if (!title || /add more rows/i.test(title)) {
        continue;
      }

      const actions: ActionItem[] = [];
      let whatYouSee = [...descriptions];

      if (cells[1]) {
        if (isActionCell(cells[1])) {
          addActionItems(actions, cells[1]);
        } else {
          whatYouSee = whatYouSee.concat(splitMultilineText(cells[1]));
        }
      }

      if (cells[2]) {
        addActionItems(actions, cells[2]);
      }

      if (type === "strength") {
        const palette =
          strengthPalette[results.length % strengthPalette.length];
        currentItem = {
          title,
          color: palette.color,
          bgColor: palette.bgColor,
          whatYouSee,
          whatToDo: actions,
        };
      } else {
        currentItem = {
          challenge: title,
          whatYouSee,
          whatToDo: actions,
        };
      }
    } else if (currentItem) {
      if (cells[1]) {
        if (isActionCell(cells[1])) {
          addActionItems(currentItem.whatToDo, cells[1]);
        } else {
          currentItem.whatYouSee = [
            ...currentItem.whatYouSee,
            ...splitMultilineText(cells[1]),
          ];
        }
      }

      if (cells[2]) {
        addActionItems(currentItem.whatToDo, cells[2]);
      }
    }
  }

  if (currentItem) {
    results.push(currentItem);
  }

  return results;
}

function parseStrategies(content: string): Strategy[] {
  const strategies: Strategy[] = [];

  if (!content) return strategies;

  const lines = content.split("\n");
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    // Remove leading list markers (- or * followed by space, but not **)
    const cleaned = line
      .replace(/^[-]\s*/, "")
      .replace(/^\*\s+/, "")
      .trim();

    if (!cleaned.includes(":")) continue;

    // Match **Label:** description format (colon is inside the bold markers)
    const boldMatch = cleaned.match(/\*\*(.+?):\*\*\s*(.+)$/);
    let name: string | null = null;
    let description: string | null = null;

    if (boldMatch) {
      name = boldMatch[1].trim();
      description = boldMatch[2].trim();
    } else {
      // Fallback: split on first colon and remove any ** markers
      const colonIndex = cleaned.indexOf(":");
      if (colonIndex > 0) {
        name = cleaned.slice(0, colonIndex).replace(/\*\*/g, "").trim();
        description = cleaned.slice(colonIndex + 1).trim();
      }
    }

    if (name && description) {
      const cleanName = name.replace(/:\s*$/, "").trim();
      const cleanDescription = description.replace(/^\*\*\s*/, "").trim();

      if (!cleanName || !cleanDescription) continue;

      strategies.push({
        strategy: cleanName,
        description: cleanDescription,
        icon: "Lightbulb" as any,
      });
    }
  }

  return strategies;
}

const strengthPalette = [
  { color: "#2563eb", bgColor: "#dbeafe" },
  { color: "#047857", bgColor: "#d1fae5" },
  { color: "#7c3aed", bgColor: "#ede9fe" },
  { color: "#db2777", bgColor: "#fce7f3" },
];

function normalizeCell(cell: string): string {
  return cell
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/&nbsp;/gi, " ")
    .trim();
}

function isDividerRow(cells: string[]): boolean {
  return cells.every((cell) => !cell || /^-+$/.test(cell.replace(/\s+/g, "")));
}

function isHeaderRow(cells: string[], type: "strength" | "challenge"): boolean {
  const hasBold = cells.some((cell) => /\*\*[^*]+\*\*/.test(cell));
  if (hasBold) return false;

  const combined = cells.join(" ").toLowerCase();
  if (type === "strength") {
    return (
      combined.includes("strength") &&
      combined.includes("what") &&
      (combined.includes("do") || combined.includes("see"))
    );
  }

  return combined.includes("challenge") && combined.includes("what");
}

function extractTitleAndPrimaryDescriptions(col1: string): {
  title: string;
  descriptions: string[];
} {
  const titleMatch = col1.match(/\*\*([^*]+)\*\*/);
  const title = titleMatch
    ? titleMatch[1].trim()
    : splitMultilineText(col1)[0] || "";

  const remaining = col1.replace(/\*\*[^*]+\*\*/g, "").trim();
  const descriptions = splitMultilineText(remaining);

  return { title, descriptions: descriptions.filter(Boolean) };
}

function splitMultilineText(text: string): string[] {
  if (!text) return [];
  return text
    .split(/\n+/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function isActionCell(text: string): boolean {
  return /^[✔✓✘✗✖✕•-]/.test(text.trim()) || /^(✔|✓|✘|✗|✖|✕)/.test(text.trim());
}

function addActionItems(target: ActionItem[], cell?: string): void {
  if (!cell) return;

  const items = splitMultilineText(cell);

  items.forEach((item) => {
    if (!item) return;

    const leadingSymbol = item.trim().charAt(0);
    const type: ActionItem["type"] =
      /^[✘✗✖✕-]/.test(leadingSymbol) || /^don't/i.test(item.trim())
        ? "dont"
        : "do";

    const text = item.replace(/^[✔✓✅✘✗✖✕+\-•\s]+/, "").trim();
    if (text.length > 0) {
      target.push({ type, text });
    }
  });
}
