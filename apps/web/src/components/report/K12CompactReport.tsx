import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useReactToPrint } from "react-to-print";
import { Button } from "@/components/ui/button";
import {
  Printer,
  CheckCircle,
  XCircle,
  User,
  Lightbulb,
  Users,
  Brain,
  BookOpen,
  Target,
  AlertCircle,
} from "lucide-react";

interface K12CompactReportProps {
  markdownReport: string;
  reportId?: string;
  studentName?: string;
}

export const K12CompactReport: React.FC<K12CompactReportProps> = ({
  markdownReport,
  reportId,
  studentName = "Student",
}) => {
  const componentRef = React.useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Teacher-Guide-${studentName}`,
    pageStyle: `
      @page {
        size: letter;
        margin: 0.5in;
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .no-print {
          display: none !important;
        }
        .page-break {
          page-break-before: always;
        }
      }
    `,
  });

  // Parse the markdown report into sections
  const parsedReport = React.useMemo(() => {
    const sections: { [key: string]: string } = {};
    let currentSection = "";
    let currentContent: string[] = [];

    const lines = markdownReport.split("\n");

    for (const line of lines) {
      if (line.startsWith("## ")) {
        if (currentSection && currentContent.length > 0) {
          sections[currentSection] = currentContent.join("\n").trim();
        }
        currentSection = line.replace("## ", "").trim();
        currentContent = [];
      } else {
        currentContent.push(line);
      }
    }

    if (currentSection && currentContent.length > 0) {
      sections[currentSection] = currentContent.join("\n").trim();
    }

    return sections;
  }, [markdownReport]);

  // Extract student name from report
  const extractedName = React.useMemo(() => {
    if (studentName !== "Student") return studentName;
    const nameMatch = markdownReport.match(/^##?\s*(.+?)\s+is\s+/m);
    if (nameMatch) return nameMatch[1];
    return "Student";
  }, [markdownReport, studentName]);

  // Parse strengths into categories
  const parseStrengths = (content: string) => {
    const categories = {
      language: {
        title: "Spoken Language",
        items: [] as string[],
        whatToDo: [] as string[],
      },
      social: {
        title: "Social Interaction",
        items: [] as string[],
        whatToDo: [] as string[],
      },
      reasoning: {
        title: "Reasoning",
        items: [] as string[],
        whatToDo: [] as string[],
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
        lowerItem.includes("communicat")
      ) {
        categories.language.items.push(item);
      } else if (
        lowerItem.includes("social") ||
        lowerItem.includes("friend") ||
        lowerItem.includes("peer") ||
        lowerItem.includes("collaborat") ||
        lowerItem.includes("kind") ||
        lowerItem.includes("empath")
      ) {
        categories.social.items.push(item);
      } else if (
        lowerItem.includes("reasoning") ||
        lowerItem.includes("problem") ||
        lowerItem.includes("think") ||
        lowerItem.includes("visual") ||
        lowerItem.includes("spatial") ||
        lowerItem.includes("creative") ||
        lowerItem.includes("build") ||
        lowerItem.includes("solv")
      ) {
        categories.reasoning.items.push(item);
      } else {
        // Distribute remaining items cyclically
        if (index % 3 === 0 && categories.language.items.length < 3) {
          categories.language.items.push(item);
        } else if (index % 3 === 1 && categories.social.items.length < 3) {
          categories.social.items.push(item);
        } else if (categories.reasoning.items.length < 3) {
          categories.reasoning.items.push(item);
        }
      }
    });

    // Provide fallback descriptions if categories are empty
    if (categories.language.items.length === 0) {
      categories.language.items = [
        "Expresses ideas clearly",
        "Good vocabulary for grade level",
        "Participates in discussions",
      ];
    }

    if (categories.social.items.length === 0) {
      categories.social.items = [
        "Works well with peers",
        "Shows kindness and empathy",
        "Positive classroom presence",
      ];
    }

    if (categories.reasoning.items.length === 0) {
      categories.reasoning.items = [
        "Creative problem solver",
        "Strong visual-spatial skills",
        "Thinks outside the box",
      ];
    }

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

    // If no table format found, use default challenges
    if (challenges.length === 0) {
      // Use default challenges
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
        },
        {
          challenge: "Word Retrieval",
          whatYouSee: "Difficulty getting thoughts onto paper",
          whatToDo: [
            "Provide sentence starters",
            "Allow verbal responses",
            "Break writing into steps",
            "Don't: Use open-ended prompts without support",
          ],
        },
        {
          challenge: "Anxiety & Sensory",
          whatYouSee: "Physical complaints, overwhelmed by stimuli",
          whatToDo: [
            "Predictable routines",
            "Quiet space when needed",
            "Advance warning of changes",
            "Don't: Dismiss physical complaints",
            "Don't: Remove recess",
          ],
        }
      );
    }

    return challenges;
  };

  const strengths = parsedReport["Strengths"]
    ? parseStrengths(parsedReport["Strengths"])
    : null;
  const challenges = parsedReport["Challenges / Areas of Need"]
    ? parseChallenges(parsedReport["Challenges / Areas of Need"])
    : [];

  return (
    <div className="max-w-7xl mx-auto">
      {/* Report Content */}
      <div ref={componentRef} className="bg-white p-8">
        {/* Header with Logo */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Target className="w-10 h-10 text-blue-600" />
            </div>
            <h1 className="text-4xl font-light text-blue-600 tracking-wider">
              THRIVE
            </h1>
          </div>
          <h2 className="text-2xl font-light text-gray-700">Teacher Guide</h2>
        </div>

        {/* Two Column Section: About & Key Strategies */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          {/* About Student */}
          <div>
            <h3 className="text-lg font-semibold text-blue-700 mb-3">
              About {extractedName}
            </h3>
            <div className="text-sm text-gray-700 leading-relaxed space-y-2">
              {parsedReport["Student Overview"] && (
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
                  {parsedReport["Student Overview"]}
                </ReactMarkdown>
              )}
            </div>
          </div>

          {/* Key Support Strategies */}
          <div>
            <h3 className="text-lg font-semibold text-blue-700 mb-3">
              Key Support Strategies
            </h3>
            <div className="text-sm text-gray-700 space-y-2">
              {parsedReport["Key Support Strategies"] ? (
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
                  {parsedReport["Key Support Strategies"]}
                </ReactMarkdown>
              ) : (
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="font-semibold">
                      • Use their strengths:
                    </span>
                    <span>
                      oral language, kindness, collaboration, and conceptual
                      understanding.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-semibold">
                      • Support key challenges:
                    </span>
                    <span>
                      anxiety, processing speed, transitions, and
                      decoding/fluency.
                    </span>
                  </li>
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Strengths Section - Three Columns */}
        {strengths && (
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-blue-700 mb-4">
              {extractedName}'s Strengths
            </h3>
            <div className="grid grid-cols-3 gap-4">
              {/* Spoken Language Card */}
              <div className="bg-blue-500 text-white rounded-lg p-4">
                <h4 className="font-semibold mb-3">
                  {strengths.language.title}
                </h4>
                <div className="text-sm space-y-2">
                  <div className="mb-3">
                    <p className="font-medium mb-1">What You See:</p>
                    <ul className="space-y-1">
                      {strengths.language.items.slice(0, 3).map((item, idx) => (
                        <li key={idx}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium mb-1">What to Do:</p>
                    <ul className="space-y-1">
                      <li>✓ Talk through steps outloud with them</li>
                      <li>✗ Don't assume comprehension issues</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Social Interaction Card */}
              <div className="bg-teal-500 text-white rounded-lg p-4">
                <h4 className="font-semibold mb-3">{strengths.social.title}</h4>
                <div className="text-sm space-y-2">
                  <div className="mb-3">
                    <p className="font-medium mb-1">What You See:</p>
                    <ul className="space-y-1">
                      {strengths.social.items.slice(0, 3).map((item, idx) => (
                        <li key={idx}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium mb-1">What to Do:</p>
                    <ul className="space-y-1">
                      <li>✓ Prep time to participate, teamwork</li>
                      <li>✗ No surprise callouts or public reading</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Reasoning Card */}
              <div className="bg-orange-500 text-white rounded-lg p-4">
                <h4 className="font-semibold mb-3">
                  {strengths.reasoning.title}
                </h4>
                <div className="text-sm space-y-2">
                  <div className="mb-3">
                    <p className="font-medium mb-1">What You See:</p>
                    <ul className="space-y-1">
                      {strengths.reasoning.items
                        .slice(0, 3)
                        .map((item, idx) => (
                          <li key={idx}>• {item}</li>
                        ))}
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium mb-1">What to Do:</p>
                    <ul className="space-y-1">
                      <li>✓ Use manipulatives to explore concepts</li>
                      <li>✗ Don't penalize for solving a problem visually</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Challenges Section - Table */}
        {challenges.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-blue-700 mb-4">
              Student's Challenges
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse bg-white">
                <thead>
                  <tr className="bg-blue-50">
                    <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Challenge
                    </th>
                    <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      What You See
                    </th>
                    <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      What to Do
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {challenges.map((challenge, idx) => (
                    <tr
                      key={idx}
                      className={`hover:bg-gray-50 ${
                        idx % 2 === 0 ? "bg-white" : "bg-orange-100"
                      }`}
                    >
                      <td className="border border-gray-300 px-4 py-3 text-sm font-medium text-gray-900 align-top">
                        {challenge.challenge}
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-sm text-gray-700 align-top">
                        {challenge.whatYouSee}
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-sm text-gray-700 align-top">
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
        <div className="mt-8 pt-4 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-500">
            ThrivED provides education and advocacy services. ThrivED does not
            provide legal or medical advice or services in any manner or form.
          </p>
        </div>
      </div>

      {/* Print Button */}
      <div className="no-print mt-6 flex justify-center">
        <Button
          onClick={handlePrint}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3"
        >
          <Printer className="w-5 h-5 mr-2" />
          Download Compact PDF
        </Button>
      </div>
    </div>
  );
};
