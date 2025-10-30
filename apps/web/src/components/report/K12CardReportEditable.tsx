import React, { useRef, useState, useEffect } from "react";
import { useReactToPrint } from "react-to-print";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  BookOpen,
  Target,
  Star,
  AlertCircle,
  Printer,
  FileText,
  CheckCircle,
  XCircle,
  User,
  Edit2,
  Check,
  X,
} from "lucide-react";

interface K12CardReportEditableProps {
  markdownReport: string;
  studentName?: string;
  isEditMode?: boolean;
  onChange?: (newContent: string, changeInfo?: any) => void;
}

interface ReportSection {
  title: string;
  content: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  iconBg: string;
}

export const K12CardReportEditable: React.FC<K12CardReportEditableProps> = ({
  markdownReport,
  studentName = "Student",
  isEditMode = false,
  onChange,
}) => {
  const componentRef = useRef<HTMLDivElement>(null);
  const [editingSectionIndex, setEditingSectionIndex] = useState<number | null>(
    null
  );
  const [editedContent, setEditedContent] = useState<string>("");

  // Print configuration
  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `${studentName.replace(/\s+/g, "-")}-Teacher-Guide-${
      new Date().toISOString().split("T")[0]
    }`,
    pageStyle: `
      @page {
        size: A4;
        margin: 15mm;
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
          color-adjust: exact;
        }
        .no-print {
          display: none !important;
        }
        .page-break {
          page-break-after: always;
        }
        .keep-together {
          break-inside: avoid;
        }
        .gradient-text {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
      }
    `,
  });

  // Parse the K-12 report into sections
  const sections = React.useMemo(() => {
    if (!markdownReport || typeof markdownReport !== "string") return [];

    const reportSections: ReportSection[] = [];

    // Remove the main title if present
    const cleanedReport = markdownReport.replace(
      /^#\s+Student Support Report\s*\n+/i,
      ""
    );

    // Split by section dividers (---) or by ## headers if no dividers found
    let sections = cleanedReport.split(/\n---\n/);

    // If no section dividers found, try splitting by ## headers
    if (sections.length === 1 && sections[0].includes("##")) {
      // Split by headers, but clean up the content better
      sections = sections[0]
        .split(/(?=^## )/m)
        .filter((section) => section.trim());
    }

    console.log("📝 Section parsing debug:", {
      totalSections: sections.length,
      hasDividers: cleanedReport.includes("---"),
      firstSectionPreview: sections[0]?.substring(0, 100),
    });

    // Enhanced section configuration with gradients and better icons
    const sectionConfig: Record<
      string,
      {
        icon: React.ComponentType<{ className?: string }>;
        gradient: string;
        iconBg: string;
      }
    > = {
      "Student Overview": {
        icon: User,
        gradient: "from-blue-500 to-cyan-500",
        iconBg: "bg-blue-100",
      },
      "Key Support Strategies": {
        icon: Target,
        gradient: "from-purple-500 to-indigo-500",
        iconBg: "bg-purple-100",
      },
      Strengths: {
        icon: Star,
        gradient: "from-emerald-500 to-green-500",
        iconBg: "bg-emerald-100",
      },
      "Challenges / Areas of Need": {
        icon: AlertCircle,
        gradient: "from-orange-500 to-amber-500",
        iconBg: "bg-orange-100",
      },
      "Additional Notes": {
        icon: FileText,
        gradient: "from-gray-500 to-slate-500",
        iconBg: "bg-gray-100",
      },
    };

    sections.forEach((section) => {
      let trimmedSection = section.trim();
      if (!trimmedSection) return;

      // Remove any leading --- dividers
      trimmedSection = trimmedSection.replace(/^-+\s*/, "").trim();

      // Find the section header (## Header)
      const headerMatch = trimmedSection.match(/^##\s+(.+?)(?:\n|$)/);
      if (headerMatch) {
        const headerText = headerMatch[1].trim();

        // Skip TLDR section
        if (
          headerText.includes("TLDR") ||
          headerText.includes("Teacher Cheat-Sheet")
        ) {
          return;
        }

        // Extract content after the header - everything after the ## line
        let content = trimmedSection.substring(headerMatch[0].length).trim();

        // Remove any additional markdown formatting that might have leaked through
        content = content.replace(/^#+\s*.*?\n/, "").trim();

        // Find matching section config
        const matchingKey = Object.keys(sectionConfig).find(
          (key) =>
            headerText.includes(key) ||
            (key === "Challenges / Areas of Need" &&
              headerText.includes("Challenges"))
        );

        if (matchingKey && content) {
          reportSections.push({
            title: matchingKey,
            content: content,
            icon: sectionConfig[matchingKey].icon,
            gradient: sectionConfig[matchingKey].gradient,
            iconBg: sectionConfig[matchingKey].iconBg,
          });
        }
      } else {
        // Handle sections without headers
        if (trimmedSection && reportSections.length === 0) {
          reportSections.push({
            title: "Student Overview",
            content: trimmedSection,
            icon: sectionConfig["Student Overview"].icon,
            gradient: sectionConfig["Student Overview"].gradient,
            iconBg: sectionConfig["Student Overview"].iconBg,
          });
        }
      }
    });

    return reportSections;
  }, [markdownReport]);

  const handleStartEdit = (index: number) => {
    if (!isEditMode) return;
    setEditingSectionIndex(index);

    // Clean up asterisks for editing
    let cleanContent = sections[index].content
      .replace(/\*\*\*+/g, "") // Remove triple or more asterisks
      .replace(/\*\*([^*]+?)\*\*/g, "$1") // Remove bold asterisks completely
      .replace(/\*([^*]+?)\*/g, "$1"); // Remove single asterisks (italics)

    setEditedContent(cleanContent);
  };

  const handleSaveSection = (index: number) => {
    if (!onChange) return;

    // Reconstruct the markdown with the edited section
    const updatedSections = [...sections];
    updatedSections[index] = {
      ...updatedSections[index],
      content: editedContent,
    };

    // Rebuild the markdown report
    const newMarkdown =
      `# Student Support Report\n\n` +
      updatedSections
        .map((section) => {
          return `## ${section.title}\n\n${section.content}`;
        })
        .join("\n\n---\n\n");

    onChange(newMarkdown, {
      sectionTitle: sections[index].title,
      oldContent: sections[index].content,
      newContent: editedContent,
    });

    setEditingSectionIndex(null);
    setEditedContent("");
  };

  const handleCancelEdit = () => {
    setEditingSectionIndex(null);
    setEditedContent("");
  };

  const formatDate = () => {
    const now = new Date();
    return now.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="w-full" ref={componentRef}>
      {/* Header with gradient */}
      <div className="mb-8 relative overflow-hidden rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 p-8 text-white shadow-xl">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <BookOpen className="h-8 w-8" />
            <h1 className="text-3xl font-bold">Teacher Guide</h1>
          </div>
          <p className="text-lg opacity-90">Generated on {formatDate()}</p>
        </div>
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />

        {/* Print Button */}
        {!isEditMode && (
          <div className="absolute top-8 right-8 no-print">
            <Button
              onClick={handlePrint}
              variant="secondary"
              size="sm"
              className="bg-white/20 hover:bg-white/30 text-white border-white/30"
            >
              <Printer className="h-4 w-4 mr-2" />
              Print Report
            </Button>
          </div>
        )}
      </div>

      {/* Report Sections */}
      <div className="space-y-6">
        {sections.map((section, index) => {
          const IconComponent = section.icon;
          const isEditing = editingSectionIndex === index;

          return (
            <div key={index} className="keep-together">
              <Card className="overflow-hidden border-2 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader
                  className={`bg-gradient-to-r ${section.gradient} text-white p-6`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`${section.iconBg} p-3 rounded-lg`}>
                        <IconComponent className="h-6 w-6 text-gray-800" />
                      </div>
                      <CardTitle className="text-xl font-bold">
                        {section.title}
                      </CardTitle>
                    </div>
                    {isEditMode && !isEditing && (
                      <Button
                        onClick={() => handleStartEdit(index)}
                        size="sm"
                        variant="secondary"
                        className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                      >
                        <Edit2 className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    )}
                    {isEditing && (
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleSaveSection(index)}
                          size="sm"
                          variant="secondary"
                          className="bg-green-500 hover:bg-green-600 text-white"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={handleCancelEdit}
                          size="sm"
                          variant="secondary"
                          className="bg-red-500 hover:bg-red-600 text-white"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-6 bg-white">
                  {isEditing ? (
                    // Determine if content is a table or text
                    editedContent.includes("|") &&
                    (editedContent.includes("---") ||
                      editedContent.split("|").length > 6) ? (
                      <TableEditor
                        content={editedContent}
                        onChange={(value) => setEditedContent(value)}
                        sectionTitle={section.title}
                      />
                    ) : (
                      <FormattedTextEditor
                        content={editedContent}
                        onChange={(value) => setEditedContent(value)}
                        sectionTitle={section.title}
                      />
                    )
                  ) : (
                    <div className="prose prose-gray max-w-none">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          h1: ({ children }) => (
                            <h1 className="text-2xl font-bold mb-4 text-gray-800">
                              {children}
                            </h1>
                          ),
                          h2: ({ children }) => (
                            <h2 className="text-xl font-semibold mb-3 text-gray-700">
                              {children}
                            </h2>
                          ),
                          h3: ({ children }) => (
                            <h3 className="text-lg font-medium mb-2 text-gray-600">
                              {children}
                            </h3>
                          ),
                          p: ({ children }) => (
                            <p className="mb-4 text-gray-600 leading-relaxed">
                              {children}
                            </p>
                          ),
                          ul: ({ children }) => (
                            <ul className="mb-4 ml-6 space-y-2 list-disc">
                              {children}
                            </ul>
                          ),
                          ol: ({ children }) => (
                            <ol className="mb-4 ml-6 space-y-2 list-decimal">
                              {children}
                            </ol>
                          ),
                          li: ({ children }) => (
                            <li className="text-gray-600 leading-relaxed">
                              {children}
                            </li>
                          ),
                          strong: ({ children }) => (
                            <strong className="font-semibold text-gray-800">
                              {children}
                            </strong>
                          ),
                          blockquote: ({ children }) => (
                            <blockquote className="border-l-4 border-blue-500 pl-4 py-2 mb-4 bg-blue-50 rounded-r">
                              {children}
                            </blockquote>
                          ),
                          code: ({ children }) => (
                            <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono text-gray-700">
                              {children}
                            </code>
                          ),
                          pre: ({ children }) => (
                            <pre className="bg-gray-100 p-4 rounded-lg mb-4 overflow-x-auto">
                              {children}
                            </pre>
                          ),
                          table: ({ node, ...props }) => (
                            <div className="overflow-x-auto mb-4 -mx-4">
                              <table
                                className="w-full border-collapse"
                                {...props}
                              />
                            </div>
                          ),
                          thead: ({ node, ...props }) => <thead {...props} />,
                          tbody: ({ node, ...props }) => (
                            <tbody
                              className="divide-y divide-gray-100"
                              {...props}
                            />
                          ),
                          tr: ({ node, ...props }) => (
                            <tr
                              className="border-b border-gray-100"
                              {...props}
                            />
                          ),
                          th: ({ node, ...props }) => (
                            <th
                              className="px-2 py-2 text-left text-xs font-semibold text-gray-800 bg-gray-50/50 first:rounded-tl-md last:rounded-tr-md"
                              {...props}
                            />
                          ),
                          td: ({ node, ...props }) => (
                            <td
                              className="px-2 py-3 text-sm text-gray-700 align-top"
                              {...props}
                            />
                          ),
                        }}
                      >
                        {section.content}
                      </ReactMarkdown>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Component to render challenges table from markdown
const RenderChallengesTable: React.FC<{ content: string }> = ({ content }) => {
  const challenges = React.useMemo(() => {
    // First try to parse as table format
    const tableMatch = content.match(/\|[\s\S]+?\|/g);
    if (tableMatch) {
      const lines = content
        .split("\n")
        .filter((line) => line.includes("|") && !line.includes("---"));

      const parsedChallenges = [];
      for (let i = 1; i < lines.length; i++) {
        // Skip header
        const parts = lines[i].split("|").filter((p) => p.trim());
        if (parts.length >= 3) {
          parsedChallenges.push({
            challenge: parts[0].replace(/\*\*/g, "").trim(),
            whatYouSee: parts[1].trim(),
            whatToDo: parts[2]
              .split("•")
              .filter((s) => s.trim())
              .map((s) => s.trim()),
          });
        }
      }
      if (parsedChallenges.length > 0) return parsedChallenges;
    }

    // If no table format, try to parse structured text format
    const sections = content
      .split(/(?=^[A-Z][^\n]*$)/m)
      .filter((s) => s.trim());
    const parsedChallenges = [];

    for (const section of sections) {
      const lines = section.trim().split("\n");
      if (lines.length < 3) continue;

      const challengeTitle = lines[0]
        .trim()
        .replace(/^#+\s*/, "")
        .replace(/\*\*/g, "");
      if (!challengeTitle) continue;

      let whatYouSee = "";
      let whatToDo = [];
      let currentSection = "";

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.toLowerCase().includes("what you see")) {
          currentSection = "see";
          continue;
        }
        if (line.toLowerCase().includes("what to do")) {
          currentSection = "do";
          continue;
        }

        if (currentSection === "see" && line) {
          whatYouSee = line;
        }
        if (currentSection === "do" && line) {
          if (
            line.startsWith("•") ||
            line.startsWith("-") ||
            line.startsWith("*")
          ) {
            whatToDo.push(line.replace(/^[•\-*]\s*/, ""));
          } else if (line.startsWith("✓") || line.startsWith("✗")) {
            whatToDo.push(line);
          } else if (line && !line.toLowerCase().includes("what")) {
            whatToDo.push(line);
          }
        }
      }

      if (challengeTitle && (whatYouSee || whatToDo.length > 0)) {
        parsedChallenges.push({
          challenge: challengeTitle,
          whatYouSee: whatYouSee,
          whatToDo: whatToDo,
        });
      }
    }

    return parsedChallenges;
  }, [content]);

  if (challenges.length === 0) {
    return <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>;
  }

  return (
    <div className="space-y-6">
      {challenges.map((challenge, idx) => (
        <div key={idx} className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
            {challenge.challenge}
          </h3>

          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div>
              <div className="font-medium text-gray-700 mb-2">
                What You See:
              </div>
              <div className="text-gray-600 leading-relaxed">
                {challenge.whatYouSee}
              </div>
            </div>

            <div>
              <div className="font-medium text-gray-700 mb-2">What To Do:</div>
              <div className="space-y-2">
                {challenge.whatToDo.map((item, i) => (
                  <div key={i} className="flex items-start gap-3 text-gray-600">
                    {item.startsWith("✓") ? (
                      <>
                        <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="leading-relaxed">
                          {item.replace("✓", "").trim()}
                        </span>
                      </>
                    ) : item.startsWith("✗") || item.startsWith("✘") ? (
                      <>
                        <XCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                        <span className="leading-relaxed">
                          {item.replace(/[✗✘]/, "").trim()}
                        </span>
                      </>
                    ) : (
                      <>
                        <div className="h-2 w-2 bg-blue-500 rounded-full mt-2.5 flex-shrink-0"></div>
                        <span className="leading-relaxed">{item}</span>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Table Editor Component
interface TableEditorProps {
  content: string;
  onChange: (value: string) => void;
  sectionTitle: string;
}

const TableEditor: React.FC<TableEditorProps> = ({
  content,
  onChange,
  sectionTitle,
}) => {
  const [tableData, setTableData] = useState<string[][]>([]);
  const [isTableFormat, setIsTableFormat] = useState(false);

  useEffect(() => {
    // Check if content contains a table - look for multiple | symbols and table-like structure
    const hasTable =
      content.includes("|") &&
      (content.includes("---") || content.split("|").length > 6);
    setIsTableFormat(hasTable);

    if (hasTable) {
      // Parse table content more robustly
      const lines = content.split("\n").filter((line) => line.trim() !== "");
      const rows: string[][] = [];

      lines.forEach((line) => {
        // Check if line contains table separators (|) but is not a header separator line
        if (
          line.includes("|") &&
          !line.match(/^\s*\|?\s*[-:]+\s*(\|\s*[-:]+\s*)*\|?\s*$/)
        ) {
          // Split by | and clean up
          let cells = line.split("|");

          // Remove empty first/last elements from leading/trailing |
          if (cells.length > 0 && cells[0].trim() === "") {
            cells = cells.slice(1);
          }
          if (cells.length > 0 && cells[cells.length - 1].trim() === "") {
            cells = cells.slice(0, -1);
          }

          // Clean up cell content and remove markdown formatting for display
          cells = cells.map((cell) => {
            let cleanCell = cell.trim();
            // Remove markdown formatting for better display
            cleanCell = cleanCell.replace(/\*\*(.*?)\*\*/g, "$1"); // Remove bold markers
            cleanCell = cleanCell.replace(/\*([^*]+?)\*/g, "$1"); // Remove italic markers
            return cleanCell;
          });

          // Only add rows that have meaningful content
          if (cells.length > 0 && cells.some((cell) => cell.length > 0)) {
            rows.push(cells);
          }
        }
      });

      // Ensure all rows have the same number of columns
      if (rows.length > 0) {
        const maxCols = Math.max(...rows.map((row) => row.length));
        const normalizedRows = rows.map((row) => {
          const newRow = [...row];
          while (newRow.length < maxCols) {
            newRow.push("");
          }
          return newRow;
        });
        setTableData(normalizedRows);
      } else {
        setTableData([]);
      }
    }
  }, [content]);

  const updateTableData = (newData: string[][]) => {
    setTableData(newData);

    // Convert back to markdown
    let markdown = "";
    newData.forEach((row, idx) => {
      // For the first column, add back bold formatting if it looks like a header/title
      const formattedRow = row.map((cell, cellIdx) => {
        if (cellIdx === 0 && cell.trim() && !cell.includes("**")) {
          // Add bold formatting to first column items that look like titles
          if (cell.length > 2 && /^[A-Z]/.test(cell.trim())) {
            return `**${cell}**`;
          }
        }
        return cell;
      });

      markdown += "| " + formattedRow.join(" | ") + " |\n";
      if (idx === 0) {
        markdown += "|" + formattedRow.map(() => "---").join("|") + "|\n";
      }
    });

    onChange(markdown);
  };

  const updateCell = (rowIdx: number, cellIdx: number, value: string) => {
    const newData = [...tableData];
    if (!newData[rowIdx]) newData[rowIdx] = [];
    newData[rowIdx][cellIdx] = value;
    updateTableData(newData);
  };

  const addRow = () => {
    const colCount = tableData[0]?.length || 3;
    const newRow = new Array(colCount).fill("");
    updateTableData([...tableData, newRow]);
  };

  const removeRow = (rowIdx: number) => {
    if (rowIdx === 0) return; // Don't remove header
    const newData = tableData.filter((_, idx) => idx !== rowIdx);
    updateTableData(newData);
  };

  if (!isTableFormat) {
    // For non-table content, show formatted text editor
    return (
      <FormattedTextEditor
        content={content}
        onChange={onChange}
        sectionTitle={sectionTitle}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 p-3 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">
          Editing: {sectionTitle}
        </h4>
        <p className="text-sm text-blue-700">
          Click on any cell to edit. Use the buttons below to add or remove
          rows.
        </p>
      </div>

      <div className="overflow-x-auto border rounded-lg">
        <table className="w-full border-collapse">
          <tbody>
            {tableData.map((row, rowIdx) => (
              <tr
                key={rowIdx}
                className={rowIdx === 0 ? "bg-blue-50" : "hover:bg-gray-50"}
              >
                {row.map((cell, cellIdx) => (
                  <td key={cellIdx} className="border border-gray-300 p-1">
                    <Textarea
                      value={cell}
                      onChange={(e) =>
                        updateCell(rowIdx, cellIdx, e.target.value)
                      }
                      className={`w-full border-0 resize-none rounded-none focus:ring-1 focus:ring-blue-500 min-h-[60px] p-2 ${
                        rowIdx === 0 ? "font-semibold bg-blue-50" : "bg-white"
                      }`}
                      rows={Math.max(2, Math.ceil(cell.length / 40))}
                      placeholder={
                        rowIdx === 0
                          ? `Header ${cellIdx + 1}`
                          : `Enter content...`
                      }
                    />
                  </td>
                ))}
                <td className="border-0 p-1 w-10">
                  {rowIdx > 0 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeRow(rowIdx)}
                      className="p-1 h-8 w-8 hover:bg-red-100"
                    >
                      <X className="h-4 w-4 text-red-500" />
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={addRow}>
          Add Row
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            // Switch to raw text editing
            setIsTableFormat(false);
          }}
        >
          Switch to Text Mode
        </Button>
      </div>
    </div>
  );
};

// Formatted Text Editor Component for non-table content
interface FormattedTextEditorProps {
  content: string;
  onChange: (value: string) => void;
  sectionTitle: string;
}

const FormattedTextEditor: React.FC<FormattedTextEditorProps> = ({
  content,
  onChange,
  sectionTitle,
}) => {
  const [editableContent, setEditableContent] = useState(content);

  useEffect(() => {
    setEditableContent(content);
  }, [content]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setEditableContent(newValue);
    // Update parent immediately
    onChange(newValue);
  };

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 p-3 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">
          Editing: {sectionTitle}
        </h4>
        <p className="text-sm text-blue-700">
          Edit the text content below. Use **text** for bold, *text* for italic,
          and - for list items.
        </p>
      </div>

      <textarea
        value={editableContent}
        onChange={handleContentChange}
        className="min-h-[200px] w-full text-sm font-sans bg-white rounded-md p-3 resize-vertical"
        placeholder="Enter content here. Use **bold**, *italic*, and - for lists."
        autoFocus
        style={{
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          fontSize: "14px",
          lineHeight: "1.6",
          border: "1px solid #e5e7eb",
          borderRadius: "6px",
          padding: "12px",
          backgroundColor: "#ffffff",
          color: "#111827",
          outline: "2px solid transparent",
          outlineOffset: "2px",
          transition: "border-color 0.2s",
          WebkitAppearance: "none",
          MozAppearance: "none",
          appearance: "none",
        }}
        onFocus={(e) => {
          e.target.style.borderColor = "#3b82f6";
          e.target.style.outline = "2px solid #dbeafe";
        }}
        onBlur={(e) => {
          e.target.style.borderColor = "#e5e7eb";
          e.target.style.outline = "2px solid transparent";
        }}
      />
    </div>
  );
};
