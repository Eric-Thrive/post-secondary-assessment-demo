/**
 * Enhanced K-12 Report Parser for Current Format
 * Handles the actual markdown format with proper section parsing
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
  console.log("📄 Parsing K-12 report (simplified overview)");
  console.log("Markdown length:", markdown.length);

  // Extract student info from the header section
  const studentInfo = extractStudentInfo(markdown);

  // Parse documents reviewed section
  const documentsSection = extractSection(markdown, "Documents Reviewed");
  const documentsReviewed = parseDocumentsReviewedSection(documentsSection);

  // Parse overview section with subsections
  const overviewSection = extractSection(markdown, "Student Overview");
  const studentOverview = parseStudentOverview(overviewSection);

  // Parse strengths section
  const strengthsSection = extractSection(markdown, "Strengths");
  const studentStrengths = parseStrengthsSection(strengthsSection);

  // Parse challenges section - try multiple variations
  let challengesSection = extractSection(markdown, "Challenges");
  if (!challengesSection) {
    challengesSection = extractSection(markdown, "Challenges / Areas of Need");
  }
  if (!challengesSection) {
    challengesSection = extractSection(markdown, "Areas of Need");
  }
  const studentChallenges = parseChallengesSection(challengesSection);

  // Parse strategies section - try multiple variations
  let strategiesSection = extractSection(markdown, "Key Support Strategies");
  if (!strategiesSection) {
    strategiesSection = extractSection(markdown, "Support Strategies");
  }
  if (!strategiesSection) {
    strategiesSection = extractSection(
      markdown,
      "Key Support Strategies & Accommodations"
    );
  }
  const supportStrategies = parseStrategiesTable(strategiesSection);

  console.log(
    `✅ Parsed: ${documentsReviewed.length} documents, ${studentStrengths.length} strengths, ${studentChallenges.length} challenges, ${supportStrategies.length} strategies`
  );

  return {
    caseInfo: {
      studentName: studentInfo.name,
      grade: studentInfo.grade,
      schoolYear:
        new Date().getFullYear() + "-" + (new Date().getFullYear() + 1),
      tutor: "Not Specified",
      dateCreated: new Date().toLocaleDateString(),
      lastUpdated: new Date().toLocaleDateString(),
    },
    documentsReviewed,
    studentOverview,
    supportStrategies,
    studentStrengths,
    studentChallenges,
  };
}

function parseStudentOverview(overviewContent: string): StudentOverview {
  if (!overviewContent) {
    return {
      atAGlance: "Student overview will be provided.",
      sections: [],
    };
  }

  // Remove the metadata header (Student:, Grade:, School:, Background & Context:)
  // Keep only the actual paragraph content
  let cleanContent = overviewContent;

  // Remove pattern like: **Student:** Name **Grade:** Grade **School:** School **Background & Context:**
  cleanContent = cleanContent.replace(
    /\*\*Student:\*\*[^*]*\*\*Grade:\*\*[^*]*(?:\*\*School:\*\*[^*]*)?\*\*Background & Context:\*\*/gi,
    ""
  );

  // Also try simpler pattern in case format varies
  cleanContent = cleanContent.replace(
    /\*\*(?:Student|Grade|School|Background & Context):\*\*[^*\n]*/gi,
    ""
  );

  // Clean up any extra whitespace
  cleanContent = cleanContent.trim();

  return {
    atAGlance: cleanContent || overviewContent,
    sections: [], // No subsections - just one "At a Glance" section
  };
}

function extractStudentInfo(markdown: string): { name: string; grade: string } {
  let name = "Student";
  let grade = "Grade Not Specified";

  // Try to extract from the header pattern: **Student:** Name **Grade:** Grade
  const headerMatch = markdown.match(
    /\*\*Student:\*\*\s*([^*\n]+)\s*\*\*Grade:\*\*\s*([^*\n]+)/i
  );
  if (headerMatch) {
    name = headerMatch[1].trim();
    grade = headerMatch[2].trim();
    return { name, grade };
  }

  // Try alternative patterns
  const nameMatch = markdown.match(/\*\*Student:\*\*\s*([^\n*]+)/i);
  if (nameMatch) {
    name = nameMatch[1].trim();
  }

  const gradeMatch = markdown.match(/\*\*Grade:\*\*\s*([^\n*]+)/i);
  if (gradeMatch) {
    grade = gradeMatch[1].trim();
  }

  // If still not found, try to extract from Student Overview section
  if (name === "Student") {
    const overviewSection = extractSection(markdown, "Student Overview");
    if (overviewSection) {
      // Look for name patterns in the first paragraph
      const namePattern = /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+is\s+a/;
      const nameInOverview = overviewSection.match(namePattern);
      if (nameInOverview) {
        name = nameInOverview[1];
      }
    }
  }

  return { name, grade };
}

function extractSection(markdown: string, sectionTitle: string): string {
  // Create a flexible regex that matches section headers
  const escapedTitle = sectionTitle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const patterns = [
    new RegExp(
      `##\\s*${escapedTitle}\\s*\\n([\\s\\S]*?)(?=\\n##|\\n---|$)`,
      "i"
    ),
    new RegExp(
      `##\\s*${escapedTitle}[^\\n]*\\n([\\s\\S]*?)(?=\\n##|\\n---|$)`,
      "i"
    ),
    new RegExp(
      `##\\s*[^\\n]*${escapedTitle}[^\\n]*\\n([\\s\\S]*?)(?=\\n##|\\n---|$)`,
      "i"
    ),
  ];

  for (const pattern of patterns) {
    const match = markdown.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }

  return "";
}

function parseStrengthsSection(content: string): Strength[] {
  if (!content) return [];

  const strengths: Strength[] = [];
  const strengthPalette = [
    { color: "#2563eb", bgColor: "#dbeafe" },
    { color: "#047857", bgColor: "#d1fae5" },
    { color: "#7c3aed", bgColor: "#ede9fe" },
    { color: "#db2777", bgColor: "#fce7f3" },
  ];

  // Check if content contains table format
  if (content.includes("|")) {
    return parseStrengthsFromTable(content, strengthPalette);
  }

  // Fall back to bullet point format
  const bulletPoints = content
    .split(/\n\s*-\s+/)
    .filter((point) => point.trim())
    .slice(0, 3);

  bulletPoints.forEach((point, index) => {
    const trimmedPoint = point.trim();
    if (!trimmedPoint) return;

    const titleMatch = trimmedPoint.match(/^\*\*([^*]+)\*\*:?\s*([\s\S]*)/);
    let title = "";
    let description = "";

    if (titleMatch) {
      title = titleMatch[1].trim();
      description = titleMatch[2].trim();
    } else {
      const sentences = trimmedPoint.split(/[.!?]+/);
      title = sentences[0].trim();
      description = sentences.slice(1).join(".").trim();
    }

    if (title) {
      const palette = strengthPalette[index % strengthPalette.length];
      const whatYouSee: string[] = [];
      if (description) {
        const items = description
          .split(/[.!]\s+/)
          .map((item) => item.trim())
          .filter((item) => item.length > 0);

        items.forEach((item) => {
          const cleanItem = item.match(/[.!?]$/) ? item : item + ".";
          whatYouSee.push(cleanItem);
        });
      }

      strengths.push({
        title,
        color: palette.color,
        bgColor: palette.bgColor,
        whatYouSee,
        whatToDo: [],
      });
    }
  });

  return strengths;
}

function parseChallengesSection(content: string): Challenge[] {
  if (!content) return [];

  const challenges: Challenge[] = [];

  // Check if content contains table format
  if (content.includes("|")) {
    return parseChallengesFromTable(content);
  }

  // Fall back to bullet point format
  const challengeBlocks = content
    .split(/(?=^-\s*\*\*[^*]+\*\*)/gm)
    .filter((block) => block.trim());

  for (const block of challengeBlocks) {
    const trimmedBlock = block.trim();
    if (!trimmedBlock) continue;

    let titleMatch = trimmedBlock.match(/^-?\s*\*\*([^*]+)\*\*/);
    if (!titleMatch) {
      titleMatch = trimmedBlock.match(/^\*\*([^*]+)\*\*/);
    }

    if (!titleMatch) continue;

    const title = titleMatch[1].trim();
    const remainingContent = trimmedBlock
      .substring(titleMatch[0].length)
      .trim();

    const whatYouSee: string[] = [];
    const whatToDo: ActionItem[] = [];

    const whatYouSeeMatch = remainingContent.match(
      /\*\*What you see:\*\*\s*([\s\S]*?)(?=\s*\*\*Evidence:\*\*|\s*\*\*Impact|$)/
    );
    if (whatYouSeeMatch) {
      const description = whatYouSeeMatch[1].trim();
      if (description) {
        whatYouSee.push(description);
      }
    }

    const evidenceMatch = remainingContent.match(
      /\*\*Evidence:\*\*\s*([\s\S]*?)(?=\s*\*\*Impact|$)/
    );
    if (evidenceMatch) {
      const evidence = evidenceMatch[1].trim();
      if (evidence) {
        whatYouSee.push("Evidence: " + evidence);
      }
    }

    const impactMatch = remainingContent.match(
      /\*\*Impact on learning:\*\*\s*([\s\S]*?)$/
    );
    if (impactMatch) {
      const impact = impactMatch[1].trim();
      if (impact) {
        whatYouSee.push("Impact: " + impact);
      }
    }

    if (whatYouSee.length === 0 && remainingContent) {
      const cleanContent = remainingContent
        .replace(/\*\*[^*]*\*\*/g, "")
        .replace(/\s+/g, " ")
        .trim();

      if (cleanContent) {
        whatYouSee.push(cleanContent);
      }
    }

    if (title) {
      challenges.push({
        challenge: title,
        whatYouSee,
        whatToDo,
      });
    }
  }

  return challenges;
}

function parseStrategiesTable(content: string): Strategy[] {
  if (!content) return [];

  const strategies: Strategy[] = [];

  // Look for table format first
  if (content.includes("|")) {
    return parseStrategiesFromTable(content);
  }

  // Parse bullet point format with bold labels
  const lines = content.split("\n");
  let currentStrategy: Partial<Strategy> | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Look for bold labels like **Use strengths:** or **Support challenges:**
    const labelMatch = trimmed.match(/^\*\*([^*]+):\*\*\s*(.*)/);
    if (labelMatch) {
      // Save previous strategy if exists
      if (
        currentStrategy &&
        currentStrategy.strategy &&
        currentStrategy.description
      ) {
        strategies.push({
          strategy: currentStrategy.strategy,
          description: currentStrategy.description,
          icon: "Lightbulb" as any,
        });
      }

      // Start new strategy
      const label = labelMatch[1].trim();
      const content = labelMatch[2].trim();

      currentStrategy = {
        strategy: label,
        description: content,
      };
    } else if (
      currentStrategy &&
      trimmed.startsWith("**") &&
      trimmed.includes(":**")
    ) {
      // Handle additional labels for the same strategy
      const additionalMatch = trimmed.match(/^\*\*([^*]+):\*\*\s*(.*)/);
      if (additionalMatch) {
        const additionalLabel = additionalMatch[1].trim();
        const additionalContent = additionalMatch[2].trim();

        if (currentStrategy.description) {
          currentStrategy.description += `\n\n${additionalLabel}: ${additionalContent}`;
        }
      }
    } else if (currentStrategy && trimmed) {
      // Continue description on next line
      if (currentStrategy.description) {
        currentStrategy.description += ` ${trimmed}`;
      }
    }
  }

  // Save the last strategy
  if (
    currentStrategy &&
    currentStrategy.strategy &&
    currentStrategy.description
  ) {
    strategies.push({
      strategy: currentStrategy.strategy,
      description: currentStrategy.description,
      icon: "Lightbulb" as any,
    });
  }

  return strategies;
}

function parseStrategiesFromTable(content: string): Strategy[] {
  const strategies: Strategy[] = [];
  const lines = content.split("\n");

  let inTable = false;
  let headerProcessed = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed.startsWith("|")) {
      if (inTable) break; // End of table
      continue;
    }

    inTable = true;

    // Skip header and separator rows
    if (!headerProcessed) {
      if (trimmed.includes("Challenge") || trimmed.includes("---")) {
        if (trimmed.includes("---")) headerProcessed = true;
        continue;
      }
    }

    // Parse table row
    const cells = trimmed
      .split("|")
      .slice(1, -1)
      .map((cell) => cell.trim());

    if (cells.length >= 2 && cells[0] && cells[1]) {
      const challenge = cells[0];
      const whatToDoCell = cells[1];
      const whatToAvoidCell = cells.length >= 3 ? cells[2] : "";

      // Clean up the text
      const cleanChallenge = challenge.replace(/\*\*/g, "").trim();

      // Parse "What to Do" - split by line breaks or bullet points
      const whatToDoItems = whatToDoCell
        .split(/\n|<br\s*\/?>/gi)
        .map((item) =>
          item
            .replace(/^[-•]\s*/, "")
            .replace(/\*\*/g, "")
            .trim()
        )
        .filter((item) => item.length > 0);

      // Parse "What to Avoid" - split by line breaks or bullet points
      const whatToAvoidItems = whatToAvoidCell
        .split(/\n|<br\s*\/?>/gi)
        .map((item) =>
          item
            .replace(/^[-•]\s*/, "")
            .replace(/\*\*/g, "")
            .trim()
        )
        .filter((item) => item.length > 0);

      // Combine into description with checkmarks and X marks
      let description = "";

      if (whatToDoItems.length > 0) {
        description += whatToDoItems.map((item) => `✓ ${item}`).join("\n");
      }

      if (whatToAvoidItems.length > 0) {
        if (description) description += "\n\n";
        description += whatToAvoidItems.map((item) => `✗ ${item}`).join("\n");
      }

      if (cleanChallenge && description) {
        strategies.push({
          strategy: cleanChallenge,
          description: description,
          icon: "Lightbulb" as any,
        });
      }
    }
  }

  return strategies;
}

function parseStrengthsFromTable(
  content: string,
  strengthPalette: Array<{ color: string; bgColor: string }>
): Strength[] {
  const strengths: Strength[] = [];
  const lines = content.split("\n");

  let inTable = false;
  let headerProcessed = false;
  let currentStrength: Partial<Strength> | null = null;

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed.startsWith("|")) {
      if (inTable) break; // End of table
      continue;
    }

    inTable = true;

    // Skip header and separator rows
    if (!headerProcessed) {
      if (trimmed.includes("Strength") || trimmed.includes("---")) {
        if (trimmed.includes("---")) headerProcessed = true;
        continue;
      }
    }

    // Parse table row
    const cells = trimmed
      .split("|")
      .slice(1, -1)
      .map((cell) => cell.trim());

    if (cells.length >= 3) {
      const strengthTitle = cells[0].replace(/\*\*/g, "").trim();
      const whatYouSeeCell = cells[1];
      const whatToDoCell = cells[2];

      // If we have a title, this is a new strength
      if (strengthTitle) {
        // Save previous strength if exists
        if (currentStrength && currentStrength.title) {
          const palette =
            strengthPalette[strengths.length % strengthPalette.length];
          strengths.push({
            title: currentStrength.title,
            color: palette.color,
            bgColor: palette.bgColor,
            whatYouSee: currentStrength.whatYouSee || [],
            whatToDo: currentStrength.whatToDo || [],
          });
        }

        // Start new strength
        currentStrength = {
          title: strengthTitle,
          whatYouSee: whatYouSeeCell ? [whatYouSeeCell] : [],
          whatToDo: [],
        };

        // Parse "What to Do" for this row
        if (whatToDoCell) {
          const cleanItem = whatToDoCell.trim();
          if (cleanItem.startsWith("✔") || cleanItem.startsWith("✓")) {
            currentStrength.whatToDo!.push({
              type: "do",
              text: cleanItem.replace(/^[✔✓]\s*/, "").trim(),
            });
          } else if (cleanItem.startsWith("✘") || cleanItem.startsWith("✗")) {
            currentStrength.whatToDo!.push({
              type: "dont",
              text: cleanItem.replace(/^[✘✗]\s*/, "").trim(),
            });
          } else if (cleanItem) {
            currentStrength.whatToDo!.push({
              type: "do",
              text: cleanItem,
            });
          }
        }
      } else if (currentStrength) {
        // This is a continuation row (empty title cell)
        // Add to current strength's whatYouSee if present
        if (whatYouSeeCell) {
          currentStrength.whatYouSee!.push(whatYouSeeCell);
        }

        // Add to current strength's whatToDo if present
        if (whatToDoCell) {
          const cleanItem = whatToDoCell.trim();
          if (cleanItem.startsWith("✔") || cleanItem.startsWith("✓")) {
            currentStrength.whatToDo!.push({
              type: "do",
              text: cleanItem.replace(/^[✔✓]\s*/, "").trim(),
            });
          } else if (cleanItem.startsWith("✘") || cleanItem.startsWith("✗")) {
            currentStrength.whatToDo!.push({
              type: "dont",
              text: cleanItem.replace(/^[✘✗]\s*/, "").trim(),
            });
          } else if (cleanItem) {
            currentStrength.whatToDo!.push({
              type: "do",
              text: cleanItem,
            });
          }
        }
      }
    }
  }

  // Save the last strength
  if (currentStrength && currentStrength.title) {
    const palette = strengthPalette[strengths.length % strengthPalette.length];
    strengths.push({
      title: currentStrength.title,
      color: palette.color,
      bgColor: palette.bgColor,
      whatYouSee: currentStrength.whatYouSee || [],
      whatToDo: currentStrength.whatToDo || [],
    });
  }

  return strengths;
}

function parseChallengesFromTable(content: string): Challenge[] {
  const challenges: Challenge[] = [];
  const lines = content.split("\n");

  let inTable = false;
  let headerProcessed = false;
  let currentChallenge: Partial<Challenge> | null = null;

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed.startsWith("|")) {
      if (inTable) break; // End of table
      continue;
    }

    inTable = true;

    // Skip header and separator rows
    if (!headerProcessed) {
      if (trimmed.includes("Challenge") || trimmed.includes("---")) {
        if (trimmed.includes("---")) headerProcessed = true;
        continue;
      }
    }

    // Parse table row
    const cells = trimmed
      .split("|")
      .slice(1, -1)
      .map((cell) => cell.trim());

    if (cells.length >= 3) {
      const challengeTitle = cells[0].replace(/\*\*/g, "").trim();
      const whatYouSeeCell = cells[1];
      const whatToDoCell = cells[2];

      // If we have a title, this is a new challenge
      if (challengeTitle) {
        // Save previous challenge if exists
        if (currentChallenge && currentChallenge.challenge) {
          challenges.push({
            challenge: currentChallenge.challenge,
            whatYouSee: currentChallenge.whatYouSee || [],
            whatToDo: currentChallenge.whatToDo || [],
          });
        }

        // Start new challenge
        currentChallenge = {
          challenge: challengeTitle,
          whatYouSee: whatYouSeeCell ? [whatYouSeeCell] : [],
          whatToDo: [],
        };

        // Parse "What to Do" for this row
        if (whatToDoCell) {
          const cleanItem = whatToDoCell.trim();
          if (cleanItem.startsWith("✔") || cleanItem.startsWith("✓")) {
            currentChallenge.whatToDo!.push({
              type: "do",
              text: cleanItem.replace(/^[✔✓]\s*/, "").trim(),
            });
          } else if (cleanItem.startsWith("✘") || cleanItem.startsWith("✗")) {
            currentChallenge.whatToDo!.push({
              type: "dont",
              text: cleanItem.replace(/^[✘✗]\s*/, "").trim(),
            });
          } else if (cleanItem) {
            currentChallenge.whatToDo!.push({
              type: "do",
              text: cleanItem,
            });
          }
        }
      } else if (currentChallenge) {
        // This is a continuation row (empty title cell)
        // Add to current challenge's whatYouSee if present
        if (whatYouSeeCell) {
          currentChallenge.whatYouSee!.push(whatYouSeeCell);
        }

        // Add to current challenge's whatToDo if present
        if (whatToDoCell) {
          const cleanItem = whatToDoCell.trim();
          if (cleanItem.startsWith("✔") || cleanItem.startsWith("✓")) {
            currentChallenge.whatToDo!.push({
              type: "do",
              text: cleanItem.replace(/^[✔✓]\s*/, "").trim(),
            });
          } else if (cleanItem.startsWith("✘") || cleanItem.startsWith("✗")) {
            currentChallenge.whatToDo!.push({
              type: "dont",
              text: cleanItem.replace(/^[✘✗]\s*/, "").trim(),
            });
          } else if (cleanItem) {
            currentChallenge.whatToDo!.push({
              type: "do",
              text: cleanItem,
            });
          }
        }
      }
    }
  }

  // Save the last challenge
  if (currentChallenge && currentChallenge.challenge) {
    challenges.push({
      challenge: currentChallenge.challenge,
      whatYouSee: currentChallenge.whatYouSee || [],
      whatToDo: currentChallenge.whatToDo || [],
    });
  }

  return challenges;
}

function parseDocumentsReviewedSection(content: string): Document[] {
  if (!content) return [];

  const documents: Document[] = [];

  // Look for numbered list format: 1. **Document Title** - Author, Date
  const numberedListPattern =
    /^\d+\.\s*\*\*([^*]+)\*\*\s*[-–—]\s*([^,\n]+),?\s*([^\n]*)/gm;
  let match;

  while ((match = numberedListPattern.exec(content)) !== null) {
    const title = match[1].trim();
    const author = match[2].trim();
    const dateAndFindings = match[3].trim();

    // Try to separate date from key findings
    let date = "";
    let keyFindings = "";

    // Look for date patterns (e.g., "September 2024", "2024", "Oct 2023")
    const dateMatch = dateAndFindings.match(
      /^([A-Za-z]+ \d{4}|\d{4}|[A-Za-z]{3} \d{4})/
    );
    if (dateMatch) {
      date = dateMatch[1];
      keyFindings = dateAndFindings
        .substring(dateMatch[0].length)
        .replace(/^[,:\s]+/, "")
        .trim();
    } else {
      // If no clear date pattern, treat the whole thing as key findings
      keyFindings = dateAndFindings;
      date = "Date not specified";
    }

    if (title) {
      documents.push({
        title,
        author: author || "Author not specified",
        date: date || "Date not specified",
        keyFindings: keyFindings || "Key findings not specified",
      });
    }
  }

  // If numbered list didn't work, try bullet point format: - **Document Title**
  if (documents.length === 0) {
    const bulletPattern = /^[-*]\s*\*\*([^*]+)\*\*\s*[-–—]?\s*([^\n]*)/gm;

    while ((match = bulletPattern.exec(content)) !== null) {
      const title = match[1].trim();
      const rest = match[2].trim();

      // Try to parse author and date from the rest
      let author = "Author not specified";
      let date = "Date not specified";
      let keyFindings = "";

      // Look for patterns like "Dr. Smith, September 2024" or "School District, 2024"
      const authorDateMatch = rest.match(
        /^([^,]+),\s*([A-Za-z]+ \d{4}|\d{4}|[A-Za-z]{3} \d{4})/
      );
      if (authorDateMatch) {
        author = authorDateMatch[1].trim();
        date = authorDateMatch[2].trim();
        keyFindings = rest
          .substring(authorDateMatch[0].length)
          .replace(/^[,:\s]+/, "")
          .trim();
      } else {
        keyFindings = rest;
      }

      if (title) {
        documents.push({
          title,
          author,
          date,
          keyFindings: keyFindings || "Key findings not specified",
        });
      }
    }
  }

  // If still no documents found, try to parse simple line-by-line format
  if (documents.length === 0) {
    const lines = content.split("\n").filter((line) => line.trim());

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#") || trimmed.includes("---"))
        continue;

      // Look for any bold text as potential document title
      const boldMatch = trimmed.match(/\*\*([^*]+)\*\*/);
      if (boldMatch) {
        const title = boldMatch[1].trim();
        const rest = trimmed
          .replace(/\*\*[^*]+\*\*/, "")
          .replace(/^[-–—:\s]+/, "")
          .trim();

        documents.push({
          title,
          author: "Author not specified",
          date: "Date not specified",
          keyFindings: rest || "Key findings not specified",
        });
      }
    }
  }

  console.log(
    `📄 Parsed ${documents.length} documents from Documents Reviewed section`
  );
  return documents;
}
