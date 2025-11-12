import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useReactToPrint } from "react-to-print";
import { Button } from "@/components/ui/button";
import { Printer, CheckCircle, XCircle, Target, BookOpen } from "lucide-react";

interface UniversalCompactPrintReportProps {
  markdownReport: string;
  reportType: "k12" | "tutoring";
  reportId?: string;
  studentName?: string;
  documents?: Array<{
    id: string;
    name: string;
    type: string;
    size: string;
    uploadDate: string;
    status: string;
  }>;
  hidePrintButton?: boolean;
}

export const UniversalCompactPrintReport = React.forwardRef<
  HTMLDivElement,
  UniversalCompactPrintReportProps
>(
  (
    {
      markdownReport,
      reportType,
      reportId,
      studentName = "Student",
      documents = [],
      hidePrintButton = false,
    },
    ref
  ) => {
    const componentRef =
      (ref as React.RefObject<HTMLDivElement>) ||
      React.useRef<HTMLDivElement>(null);

    const handlePrint = useReactToPrint({
      contentRef: componentRef,
      documentTitle: `${
        reportType === "k12" ? "Teacher" : "Tutor"
      }-Guide-${studentName}`,
      pageStyle: `
      @page {
        size: letter;
        margin: 0.4in;
      }
      @media print {
        * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          color-adjust: exact !important;
        }
        body {
          font-size: 9px !important;
          line-height: 1.3 !important;
          margin: 0 !important;
          padding: 0 !important;
        }
        .print-container {
          width: 100% !important;
          max-width: none !important;
          margin: 0 !important;
          padding: 0 !important;
          font-size: 9px !important;
        }
        .print-header {
          margin-bottom: 16px !important;
          padding: 12px !important;
        }
        .print-header h1 {
          font-size: 20px !important;
          margin-bottom: 0 !important;
        }
        .print-header h2 {
          font-size: 16px !important;
        }
        .print-two-column {
          margin-bottom: 16px !important;
          gap: 24px !important;
        }
        .print-two-column h3 {
          font-size: 12px !important;
          margin-bottom: 8px !important;
        }
        .print-two-column div {
          font-size: 8px !important;
          line-height: 1.2 !important;
        }
        .print-strengths {
          margin-bottom: 16px !important;
        }
        .print-strengths h3 {
          font-size: 14px !important;
          margin-bottom: 8px !important;
        }
        .print-strengths .grid {
          gap: 8px !important;
        }
        .print-strengths .strength-card {
          padding: 8px !important;
          min-height: 120px !important;
          height: auto !important;
        }
        .print-strengths .strength-card h4 {
          font-size: 9px !important;
          margin-bottom: 4px !important;
          line-height: 1.1 !important;
        }
        .print-strengths .strength-card .text-sm {
          font-size: 6.5px !important;
          line-height: 1.2 !important;
        }
        .print-strengths .strength-card ul {
          margin: 0 !important;
          padding-left: 8px !important;
        }
        .print-strengths .strength-card li {
          margin-bottom: 0.5px !important;
          line-height: 1.2 !important;
        }
        .print-strengths .strength-card p {
          margin-bottom: 2px !important;
        }
        .print-challenges {
          margin-bottom: 12px !important;
        }
        .print-challenges h3 {
          font-size: 14px !important;
          margin-bottom: 8px !important;
        }
        .print-challenges table {
          width: 100% !important;
          font-size: 7px !important;
        }
        .print-challenges th,
        .print-challenges td {
          font-size: 7px !important;
          padding: 4px !important;
          line-height: 1.1 !important;
        }
        .print-challenges th:nth-child(1),
        .print-challenges td:nth-child(1) {
          width: 25% !important;
        }
        .print-challenges th:nth-child(2),
        .print-challenges td:nth-child(2) {
          width: 35% !important;
        }
        .print-challenges th:nth-child(3),
        .print-challenges td:nth-child(3) {
          width: 40% !important;
        }
        .no-print {
          display: none !important;
        }
        .page-break {
          page-break-before: always;
        }
        .print-challenges-table th:nth-child(1),
        .print-challenges-table td:nth-child(1) {
          width: 33% !important;
        }
        .print-challenges-table th:nth-child(2),
        .print-challenges-table td:nth-child(2) {
          width: 34% !important;
        }
        .print-challenges-table th:nth-child(3),
        .print-challenges-table td:nth-child(3) {
          width: 33% !important;
        }
        .print-strength-card {
          font-size: 10px !important;
          padding: 12px !important;
        }
        .print-strength-card h4 {
          font-size: 12px !important;
          margin-bottom: 8px !important;
        }
        .print-strength-card ul {
          font-size: 9px !important;
          line-height: 1.3 !important;
        }
        h1, h2, h3 {
          page-break-after: avoid;
        }
        table {
          page-break-inside: avoid;
          break-inside: avoid;
        }
        tr {
          page-break-inside: avoid;
          break-inside: avoid;
        }
      }
    `,
    });

    // Parse the markdown report into sections
    const parsedReport = React.useMemo(() => {
      if (!markdownReport || typeof markdownReport !== "string") return {};

      const sections: { [key: string]: string } = {};

      // Remove the main title if present
      const cleanedReport = markdownReport.replace(/^#\s+.*Report.*\n+/i, "");

      // Split by section dividers (---) or by ## headers if no dividers found
      let reportSections = cleanedReport.split(/\n---\n/);

      // If no section dividers found, try splitting by ## headers
      if (reportSections.length === 1 && reportSections[0].includes("##")) {
        reportSections = reportSections[0]
          .split(/(?=^## )/m)
          .filter((section) => section.trim());
      }

      reportSections.forEach((section) => {
        let trimmedSection = section.trim();
        if (!trimmedSection) return;

        // Remove any leading --- dividers
        trimmedSection = trimmedSection.replace(/^-+\s*/, "").trim();

        // Find the section header (## Header)
        const headerMatch = trimmedSection.match(/^##\s+(.+?)(?:\n|$)/);
        if (headerMatch) {
          const headerText = headerMatch[1].trim();

          // Extract content after the header
          let content = trimmedSection.substring(headerMatch[0].length).trim();
          content = content.replace(/^#+\s*.*?\n/, "").trim();

          if (content) {
            sections[headerText] = content;
          }
        }
      });

      return sections;
    }, [markdownReport]);

    // Extract student name from report
    const extractedName = React.useMemo(() => {
      if (studentName !== "Student") return studentName;
      const nameMatch = markdownReport.match(/^##?\s*(.+?)\s+is\s+/m);
      if (nameMatch) return nameMatch[1];
      return "Student";
    }, [markdownReport, studentName]);

    // Parse strengths into three categories for the colored cards
    const parseStrengths = (content: string) => {
      const categories = {
        primary: {
          title:
            reportType === "k12"
              ? "Hardworking and eager to please"
              : "Understanding and Engagement",
          items: [] as string[],
          whatToDo: [] as string[],
          color: "bg-blue-500",
        },
        secondary: {
          title:
            reportType === "k12"
              ? "Enjoys humor and making connections"
              : "Follow Instruction and Making Connections",
          items: [] as string[],
          whatToDo: [] as string[],
          color: "bg-teal-500",
        },
        tertiary: {
          title:
            reportType === "k12"
              ? "Thrives in small group or 1:1"
              : "Strengths and Qualities",
          items: [] as string[],
          whatToDo: [] as string[],
          color: "bg-orange-500",
        },
      };

      // Extract all strength descriptions from the content
      const lines = content.split("\n");
      const strengthItems: string[] = [];

      for (const line of lines) {
        const trimmed = line.trim();

        // Look for bullet points or numbered items that describe strengths
        if (
          trimmed.startsWith("•") ||
          trimmed.startsWith("-") ||
          trimmed.startsWith("*") ||
          /^\d+\./.test(trimmed)
        ) {
          const item = trimmed
            .replace(/^[•\-*]\s*/, "")
            .replace(/^\d+\.\s*/, "")
            .replace(/\*\*/g, "")
            .trim();

          // Skip headers and empty items
          if (
            item &&
            !item.toLowerCase().includes("what you see") &&
            !item.toLowerCase().includes("what to do") &&
            !item.toLowerCase().includes("strengths:") &&
            item !== "--" &&
            item.length > 5
          ) {
            strengthItems.push(item);
          }
        }
      }

      // Distribute strength items into categories based on content
      strengthItems.forEach((item, index) => {
        const lowerItem = item.toLowerCase();

        if (
          lowerItem.includes("language") ||
          lowerItem.includes("verbal") ||
          lowerItem.includes("speak") ||
          lowerItem.includes("express") ||
          lowerItem.includes("communicat") ||
          lowerItem.includes("understand") ||
          lowerItem.includes("engage")
        ) {
          categories.primary.items.push(item);
        } else if (
          lowerItem.includes("social") ||
          lowerItem.includes("friend") ||
          lowerItem.includes("peer") ||
          lowerItem.includes("collaborat") ||
          lowerItem.includes("kind") ||
          lowerItem.includes("empath") ||
          lowerItem.includes("follow") ||
          lowerItem.includes("instruction") ||
          lowerItem.includes("connect")
        ) {
          categories.secondary.items.push(item);
        } else if (
          lowerItem.includes("reasoning") ||
          lowerItem.includes("problem") ||
          lowerItem.includes("think") ||
          lowerItem.includes("visual") ||
          lowerItem.includes("spatial") ||
          lowerItem.includes("creative") ||
          lowerItem.includes("build") ||
          lowerItem.includes("solv") ||
          lowerItem.includes("strength") ||
          lowerItem.includes("qualit")
        ) {
          categories.tertiary.items.push(item);
        } else {
          // Distribute remaining items cyclically
          if (index % 3 === 0 && categories.primary.items.length < 3) {
            categories.primary.items.push(item);
          } else if (index % 3 === 1 && categories.secondary.items.length < 3) {
            categories.secondary.items.push(item);
          } else if (categories.tertiary.items.length < 3) {
            categories.tertiary.items.push(item);
          }
        }
      });

      // Provide fallback descriptions if categories are empty
      if (categories.primary.items.length === 0) {
        categories.primary.items =
          reportType === "k12"
            ? [
                "Expresses ideas clearly",
                "Good vocabulary for grade level",
                "Participates in discussions",
              ]
            : [
                "Shows understanding of concepts",
                "Engages with material",
                "Asks thoughtful questions",
              ];
      }

      if (categories.secondary.items.length === 0) {
        categories.secondary.items =
          reportType === "k12"
            ? [
                "Works well with peers",
                "Shows kindness and empathy",
                "Positive classroom presence",
              ]
            : [
                "Follows instructions well",
                "Makes connections between ideas",
                "Collaborative learner",
              ];
      }

      if (categories.tertiary.items.length === 0) {
        categories.tertiary.items =
          reportType === "k12"
            ? [
                "Creative problem solver",
                "Strong visual-spatial skills",
                "Thinks outside the box",
              ]
            : [
                "Shows persistence",
                "Creative approach to problems",
                "Strong work ethic",
              ];
      }

      // Add appropriate "What to Do" items for each category
      categories.primary.whatToDo =
        reportType === "k12"
          ? [
              "Talk through steps outloud with them",
              "Don't assume comprehension issues",
            ]
          : ["Use verbal explanations", "Don't rush through concepts"];

      categories.secondary.whatToDo =
        reportType === "k12"
          ? [
              "Prep time to participate, teamwork",
              "No surprise callouts or public reading",
            ]
          : [
              "Build on their connections",
              "Don't isolate from collaborative work",
            ];

      categories.tertiary.whatToDo =
        reportType === "k12"
          ? [
              "Use manipulatives to explore concepts",
              "Don't penalize for solving a problem visually",
            ]
          : [
              "Encourage creative approaches",
              "Don't limit to one solution method",
            ];

      return categories;
    };

    // Helper function to parse whatToDo cell content
    const parseWhatToDoCell = (whatToDoText: string): string[] => {
      const whatToDo: string[] = [];

      // First, check if it has ✓, ✔, ✘, ✗, or ❌ symbols
      const hasSymbols =
        whatToDoText.includes("✓") ||
        whatToDoText.includes("✔") ||
        whatToDoText.includes("✘") ||
        whatToDoText.includes("✗") ||
        whatToDoText.includes("❌") ||
        whatToDoText.includes("×");

      if (hasSymbols) {
        // Split by bullet points first to handle each item separately
        const allItems = whatToDoText.split(/(?=[✓✔✘✗❌×])/);

        allItems.forEach((item) => {
          const trimmedItem = item.trim();
          if (!trimmedItem) return;

          // Check if it's a positive action (✓ or ✔)
          if (trimmedItem.startsWith("✓") || trimmedItem.startsWith("✔")) {
            const clean = trimmedItem.replace(/[✓✔]\s*/, "").trim();
            if (clean) whatToDo.push(clean);
          }
          // Check if it's a negative action (✘, ✗, ❌, or ×)
          else if (
            trimmedItem.startsWith("✘") ||
            trimmedItem.startsWith("✗") ||
            trimmedItem.startsWith("❌") ||
            trimmedItem.startsWith("×")
          ) {
            const clean = trimmedItem.replace(/[✘✗❌×]\s*/, "").trim();
            if (clean) whatToDo.push(`Don't: ${clean}`);
          }
        });
      } else {
        // No symbols, just plain text
        const cleaned = whatToDoText.trim();
        if (cleaned && cleaned.length > 5) {
          whatToDo.push(cleaned);
        }
      }

      return whatToDo;
    };

    // Parse challenges into table format
    const parseChallenges = (content: string) => {
      const challenges: Array<{
        challenge: string;
        whatYouSee: string;
        whatToDo: string[];
      }> = [];

      // Check if content is formatted as a markdown table
      if (
        content.includes("| Challenge") &&
        content.includes("| What You See") &&
        content.includes("| What to Do")
      ) {
        // Parse as markdown table with multi-row support
        const lines = content.split("\n");
        let inTable = false;
        let currentChallenge: {
          challenge: string;
          whatYouSee: string;
          whatToDo: string[];
        } | null = null;

        for (let i = 0; i < lines.length; i++) {
          const trimmed = lines[i].trim();

          // Skip header and separator lines
          if (
            trimmed.includes("| Challenge") ||
            trimmed.startsWith("|--") ||
            trimmed === ""
          ) {
            inTable = true;
            // If we were building a challenge and hit a separator, save it
            if (currentChallenge && trimmed === "") {
              challenges.push(currentChallenge);
              currentChallenge = null;
            }
            continue;
          }

          // Parse table rows
          if (inTable && trimmed.startsWith("|")) {
            // Split by | and get the cells (ignoring first and last empty elements from splitting)
            const cells = trimmed
              .split("|")
              .map((cell) => cell.trim())
              .filter((cell, idx) => idx > 0 && idx < 4);

            if (cells.length >= 3) {
              // Check if this is a new challenge (non-empty first cell) or continuation row
              const challengeCell = cells[0].replace(/\*\*/g, "").trim();
              const whatYouSeeCell = cells[1].trim();
              const whatToDoCell = cells[2].trim();

              if (challengeCell && challengeCell !== "") {
                // This is a new challenge - save previous one if exists
                if (currentChallenge) {
                  challenges.push(currentChallenge);
                }

                // Start new challenge
                currentChallenge = {
                  challenge: challengeCell,
                  whatYouSee: whatYouSeeCell === "--" ? "" : whatYouSeeCell,
                  whatToDo: [],
                };

                // Process the whatToDo content for this row
                if (whatToDoCell) {
                  const items = parseWhatToDoCell(whatToDoCell);
                  currentChallenge.whatToDo.push(...items);
                }
              } else if (currentChallenge) {
                // This is a continuation row - add more whatToDo items to current challenge
                if (whatToDoCell) {
                  const items = parseWhatToDoCell(whatToDoCell);
                  currentChallenge.whatToDo.push(...items);
                }
              }
            }
          }
        }

        // Don't forget to add the last challenge
        if (currentChallenge) {
          challenges.push(currentChallenge);
        }
      }

      // If no table format found, use default challenges based on report type
      if (challenges.length === 0) {
        if (reportType === "k12") {
          challenges.push(
            {
              challenge: "Processing Speed",
              whatYouSee: "Gets tired, slow to finish tasks",
              whatToDo: [
                "Break down big tasks into smaller steps",
                "Shorten assignments",
                "No time crunches",
                "No skipping breaks",
              ],
            },
            {
              challenge: "Reading Fluency",
              whatYouSee: "Reads slowly, struggles with grade-level texts",
              whatToDo: [
                "Provide explicit, multi-sensory instruction",
                "Use audiobooks to build comprehension",
                "Allow extra time for reading",
                "Don't: Rush or pressure to read fast",
                "Don't: Avoid text altogether",
              ],
            }
          );
        } else {
          challenges.push(
            {
              challenge: "Focus and Attention",
              whatYouSee: "Difficulty staying on task, easily distracted",
              whatToDo: [
                "Break sessions into shorter segments",
                "Use visual cues and reminders",
                "Minimize distractions in environment",
                "Don't: Expect sustained focus for long periods",
              ],
            },
            {
              challenge: "Processing Information",
              whatYouSee: "Needs extra time to understand concepts",
              whatToDo: [
                "Present information in multiple ways",
                "Allow processing time between concepts",
                "Check for understanding frequently",
                "Don't: Rush through material",
              ],
            }
          );
        }
      }

      return challenges;
    };

    const strengthsSection =
      parsedReport["Strengths"] || parsedReport["Student's Strengths"];
    const challengesSection =
      parsedReport["Challenges"] ||
      parsedReport["Challenges / Areas of Need"] ||
      parsedReport["Student's Challenges"];
    const overviewSection =
      parsedReport["Student Overview"] || parsedReport["About Student"];
    const strategiesSection =
      parsedReport["Key Support Strategies"] ||
      parsedReport["Tutoring Strategies"] ||
      parsedReport["Support Recommendations"];

    const strengths = strengthsSection
      ? parseStrengths(strengthsSection)
      : null;
    const challenges = challengesSection
      ? parseChallenges(challengesSection)
      : [];

    const formatDate = () => {
      const now = new Date();
      return now.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    };

    return (
      <div className="max-w-6xl mx-auto">
        {/* Report Content */}
        <div
          ref={componentRef}
          className="print-container bg-white p-3 text-xs leading-tight"
        >
          {/* Header */}
          <div className="print-header mb-3">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-3 rounded-lg shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1 bg-white/20 rounded">
                    {reportType === "k12" ? (
                      <Target className="h-6 w-6 text-white" />
                    ) : (
                      <BookOpen className="h-6 w-6 text-white" />
                    )}
                  </div>
                  <h1 className="text-xl font-bold">THRIVE</h1>
                </div>
                <div className="text-right">
                  <h2 className="text-lg font-light">
                    {reportType === "k12" ? "Teacher Guide" : "Tutor Guide"}
                  </h2>
                </div>
              </div>
            </div>
          </div>

          {/* Two Column Section: About & Key Strategies */}
          <div className="print-two-column grid grid-cols-2 gap-4 mb-3">
            {/* About Student */}
            <div>
              <h3 className="text-sm font-semibold text-blue-700 mb-2">
                About {extractedName}
              </h3>
              <div className="text-xs text-gray-700 leading-tight space-y-1">
                {overviewSection ? (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      p: ({ children }) => <p className="mb-2">{children}</p>,
                      ul: ({ children }) => (
                        <ul className="ml-4 space-y-1">{children}</ul>
                      ),
                      li: ({ children }) => (
                        <li className="list-disc">{children}</li>
                      ),
                    }}
                  >
                    {overviewSection}
                  </ReactMarkdown>
                ) : (
                  <p>
                    Student information will be displayed here based on the
                    assessment.
                  </p>
                )}
              </div>
            </div>

            {/* Key Support Strategies */}
            <div>
              <h3 className="text-sm font-semibold text-blue-700 mb-2">
                Key Support Strategies
              </h3>
              <div className="text-xs text-gray-700 space-y-1">
                {strategiesSection ? (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      p: ({ children }) => <p className="mb-2">{children}</p>,
                      ul: ({ children }) => (
                        <ul className="space-y-1">{children}</ul>
                      ),
                      li: ({ children }) => <li>{children}</li>,
                      strong: ({ children }) => (
                        <strong className="font-semibold">{children}</strong>
                      ),
                    }}
                  >
                    {strategiesSection}
                  </ReactMarkdown>
                ) : (
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="font-semibold">
                        • Use their strengths:
                      </span>
                      <span>
                        Build on what they do well to support learning.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-semibold">
                        • Support key challenges:
                      </span>
                      <span>
                        Provide targeted interventions for areas of need.
                      </span>
                    </li>
                  </ul>
                )}
              </div>
            </div>
          </div>

          {/* Strengths Section - Three Columns */}
          {strengths && (
            <div className="print-strengths mb-3">
              <h3 className="text-sm font-semibold text-blue-700 mb-2">
                {extractedName}'s Strengths
              </h3>
              <div className="grid grid-cols-3 gap-1">
                {/* Primary Strength Card */}
                <div
                  className={`${strengths.primary.color} text-white rounded p-2 strength-card min-h-32`}
                >
                  <h4 className="font-semibold mb-1 text-xs leading-tight">
                    {strengths.primary.title}
                  </h4>
                  <div className="text-xs space-y-1">
                    <div className="mb-1">
                      <p className="font-medium mb-0.5 text-xs">
                        What You See:
                      </p>
                      <ul className="space-y-0 text-xs">
                        {strengths.primary.items
                          .slice(0, 2)
                          .map((item, idx) => (
                            <li key={idx} className="text-xs leading-tight">
                              • {item}
                            </li>
                          ))}
                      </ul>
                    </div>
                    <div>
                      <p className="font-medium mb-0.5 text-xs">What to Do:</p>
                      <ul className="space-y-0 text-xs">
                        {strengths.primary.whatToDo.map((item, idx) => (
                          <li key={idx} className="text-xs leading-tight">
                            {item.startsWith("Don't") ? "✗" : "✓"} {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Secondary Strength Card */}
                <div
                  className={`${strengths.secondary.color} text-white rounded p-2 strength-card min-h-32`}
                >
                  <h4 className="font-semibold mb-1 text-xs leading-tight">
                    {strengths.secondary.title}
                  </h4>
                  <div className="text-xs space-y-1">
                    <div className="mb-1">
                      <p className="font-medium mb-0.5 text-xs">
                        What You See:
                      </p>
                      <ul className="space-y-0 text-xs">
                        {strengths.secondary.items
                          .slice(0, 2)
                          .map((item, idx) => (
                            <li key={idx} className="text-xs leading-tight">
                              • {item}
                            </li>
                          ))}
                      </ul>
                    </div>
                    <div>
                      <p className="font-medium mb-0.5 text-xs">What to Do:</p>
                      <ul className="space-y-0 text-xs">
                        {strengths.secondary.whatToDo.map((item, idx) => (
                          <li key={idx} className="text-xs leading-tight">
                            {item.startsWith("Don't") ? "✗" : "✓"} {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Tertiary Strength Card */}
                <div
                  className={`${strengths.tertiary.color} text-white rounded p-2 strength-card min-h-32`}
                >
                  <h4 className="font-semibold mb-1 text-xs leading-tight">
                    {strengths.tertiary.title}
                  </h4>
                  <div className="text-xs space-y-1">
                    <div className="mb-1">
                      <p className="font-medium mb-0.5 text-xs">
                        What You See:
                      </p>
                      <ul className="space-y-0 text-xs">
                        {strengths.tertiary.items
                          .slice(0, 2)
                          .map((item, idx) => (
                            <li key={idx} className="text-xs leading-tight">
                              • {item}
                            </li>
                          ))}
                      </ul>
                    </div>
                    <div>
                      <p className="font-medium mb-0.5 text-xs">What to Do:</p>
                      <ul className="space-y-0 text-xs">
                        {strengths.tertiary.whatToDo.map((item, idx) => (
                          <li key={idx} className="text-xs leading-tight">
                            {item.startsWith("Don't") ? "✗" : "✓"} {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Challenges Section - Table */}
          {challenges.length > 0 && (
            <div className="print-challenges mb-3">
              <h3 className="text-sm font-semibold text-blue-700 mb-2">
                {extractedName}'s Challenges
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse bg-white">
                  <thead>
                    <tr className="bg-blue-50">
                      <th className="border border-gray-300 px-2 py-1 text-left text-xs font-semibold text-gray-700">
                        Challenge
                      </th>
                      <th className="border border-gray-300 px-2 py-1 text-left text-xs font-semibold text-gray-700">
                        What You See
                      </th>
                      <th className="border border-gray-300 px-2 py-1 text-left text-xs font-semibold text-gray-700">
                        What to Do
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {challenges.map((challenge, idx) => (
                      <tr
                        key={idx}
                        className={`hover:bg-gray-50 ${
                          idx % 2 === 0 ? "bg-white" : "bg-orange-50"
                        }`}
                      >
                        <td className="border border-gray-300 px-2 py-1 text-xs font-medium text-gray-900 align-top">
                          {challenge.challenge}
                        </td>
                        <td className="border border-gray-300 px-2 py-1 text-xs text-gray-700 align-top">
                          {challenge.whatYouSee}
                        </td>
                        <td className="border border-gray-300 px-2 py-1 text-xs text-gray-700 align-top">
                          <ul className="space-y-1">
                            {challenge.whatToDo.map((item, i) => (
                              <li key={i} className="flex items-start gap-1">
                                {item.startsWith("Don't:") ? (
                                  <>
                                    <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                                    <span>{item.replace("Don't: ", "")}</span>
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                    <span>{item}</span>
                                  </>
                                )}
                              </li>
                            ))}
                          </ul>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="mt-2 pt-2 border-t border-gray-200 text-center">
            <p className="text-xs text-gray-500">
              ThrivED provides education and advocacy services. ThrivED does not
              provide legal or medical advice or services in any manner or form.
            </p>
          </div>
        </div>

        {/* Print Button */}
        {!hidePrintButton && (
          <div className="no-print mt-6 flex justify-center">
            <Button
              onClick={handlePrint}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3"
            >
              <Printer className="w-5 h-5 mr-2" />
              Download Compact PDF
            </Button>
          </div>
        )}
      </div>
    );
  }
);

UniversalCompactPrintReport.displayName = "UniversalCompactPrintReport";
