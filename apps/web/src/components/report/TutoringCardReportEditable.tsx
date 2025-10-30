import React, { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  BookOpen,
  Target,
  Star,
  AlertCircle,
  FileText,
  User,
  Brain,
  Edit2,
  Check,
  X,
} from "lucide-react";

interface TutoringCardReportEditableProps {
  markdownReport: string;
  studentName?: string;
  isEditMode?: boolean;
  onChange?: (newContent: string, changeInfo?: any) => void;
  currentCaseId?: string;
  documents?: Array<{
    id: string;
    name: string;
    type: string;
    size: string;
    uploadDate: string;
    status: string;
  }>;
}

interface ReportSection {
  title: string;
  content: string;
  icon: React.ComponentType<{ className?: string }>;
  backgroundColor: string;
  textColor: string;
}

export const TutoringCardReportEditable: React.FC<
  TutoringCardReportEditableProps
> = ({ markdownReport, isEditMode = false, onChange, documents = [] }) => {
  const componentRef = useRef<HTMLDivElement>(null);
  const [editingSectionIndex, setEditingSectionIndex] = useState<number | null>(
    null
  );
  const [editedContent, setEditedContent] = useState<string>("");

  // Parse the tutoring report into sections (K-12 style)
  const sections = React.useMemo(() => {
    if (!markdownReport || typeof markdownReport !== "string") return [];

    const reportSections: ReportSection[] = [];

    // Remove the main title if present
    const cleanedReport = markdownReport.replace(
      /^#\s+Student Support Report.*\n+/i,
      ""
    );

    // Split by section dividers (---) or by ## headers if no dividers found
    let sections = cleanedReport.split(/\n---\n/);

    // If no section dividers found, try splitting by ## headers
    if (sections.length === 1 && sections[0].includes("##")) {
      sections = sections[0]
        .split(/(?=^## )/m)
        .filter((section) => section.trim());
    }

    // Enhanced section configuration with colored headers for tutoring
    const sectionConfig: Record<
      string,
      {
        icon: React.ComponentType<{ className?: string }>;
        backgroundColor: string;
        textColor: string;
      }
    > = {
      "Student Overview": {
        icon: User,
        backgroundColor: "#4A90E2",
        textColor: "#FFFFFF",
      },
      "Learning Profile": {
        icon: Brain,
        backgroundColor: "#9B59B6",
        textColor: "#FFFFFF",
      },
      Strengths: {
        icon: Star,
        backgroundColor: "#27AE60",
        textColor: "#FFFFFF",
      },
      Challenges: {
        icon: AlertCircle,
        backgroundColor: "#E67E22",
        textColor: "#FFFFFF",
      },
      "Tutoring Strategies": {
        icon: Target,
        backgroundColor: "#9B59B6",
        textColor: "#FFFFFF",
      },
      "Key Support Strategies": {
        icon: Target,
        backgroundColor: "#9B59B6",
        textColor: "#FFFFFF",
      },
      "Support Recommendations": {
        icon: Target,
        backgroundColor: "#F39C12",
        textColor: "#FFFFFF",
      },
      "Documents Reviewed": {
        icon: FileText,
        backgroundColor: "#16A085",
        textColor: "#FFFFFF",
      },
      "Additional Notes": {
        icon: FileText,
        backgroundColor: "#7F8C8D",
        textColor: "#FFFFFF",
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

        // Extract content after the header
        let content = trimmedSection.substring(headerMatch[0].length).trim();
        content = content.replace(/^#+\s*.*?\n/, "").trim();

        // Find matching section config
        const matchingKey = Object.keys(sectionConfig).find(
          (key) =>
            headerText.includes(key) ||
            (key === "Challenges" &&
              (headerText.includes("Challenge") ||
                headerText.includes("Areas of Need"))) ||
            (key === "Learning Profile" && headerText.includes("Profile")) ||
            (key === "Tutoring Strategies" &&
              (headerText.includes("Strateg") ||
                headerText.includes("Approach"))) ||
            (key === "Key Support Strategies" &&
              headerText.includes("Key Support")) ||
            (key === "Support Recommendations" &&
              (headerText.includes("Recommendation") ||
                headerText.includes("Support"))) ||
            (key === "Documents Reviewed" &&
              headerText.includes("Documents Reviewed"))
        );

        if (matchingKey && content) {
          reportSections.push({
            title: matchingKey,
            content: content,
            icon: sectionConfig[matchingKey].icon,
            backgroundColor: sectionConfig[matchingKey].backgroundColor,
            textColor: sectionConfig[matchingKey].textColor,
          });
        }
      }
    });

    // Only add Documents Reviewed fallback if no AI-generated section exists
    const hasDocumentsSection = reportSections.some(
      (section) => section.title === "Documents Reviewed"
    );

    if (!hasDocumentsSection) {
      let documentsContent = "";
      if (documents && documents.length > 0) {
        documentsContent = documents
          .map((doc) => {
            const statusIcon = doc.status === "analyzed" ? "✓" : "📄";
            return `${statusIcon} **${doc.name}** (${doc.type})\n   ${doc.size} - Uploaded ${doc.uploadDate}`;
          })
          .join("\n\n");
      } else {
        documentsContent =
          "*No documents were uploaded for this assessment.*\n\nThis assessment was likely completed using direct input or observation rather than document analysis.";
      }

      reportSections.push({
        title: "Documents Reviewed",
        content: documentsContent,
        icon: FileText,
        backgroundColor: "#16A085",
        textColor: "#FFFFFF",
      });
    }

    return reportSections;
  }, [markdownReport, documents]);

  const handleStartEdit = (index: number) => {
    if (!isEditMode) return;
    // Don't allow editing of Documents Reviewed section
    if (sections[index].title === "Documents Reviewed") return;

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

    // Rebuild the markdown report (excluding Documents Reviewed)
    const newMarkdown =
      `# Student Support Report — Tutor Orientation\n\n` +
      updatedSections
        .filter((section) => section.title !== "Documents Reviewed")
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
    <div className="max-w-6xl mx-auto p-6 bg-white" ref={componentRef}>
      {/* Header */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-8 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Tutor Guide</h1>
              <p className="text-indigo-100 text-lg">
                Generated on {formatDate()}
              </p>
            </div>
            <div className="text-right">
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
                <BookOpen className="h-12 w-12 text-white mx-auto mb-2" />
                <div className="text-sm font-medium">Tutoring Support</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Report Sections */}
      <div className="space-y-6">
        {sections.map((section, index) => {
          const isEditing = editingSectionIndex === index;
          const isDocumentsSection = section.title === "Documents Reviewed";

          return (
            <div
              key={index}
              className="border rounded-lg shadow-md overflow-hidden"
            >
              {/* Section Header */}
              <div
                className="px-6 py-4 flex items-center justify-between"
                style={{
                  backgroundColor: section.backgroundColor,
                  color: section.textColor,
                }}
              >
                <h2 className="text-lg font-semibold">{section.title}</h2>
                <div className="flex items-center space-x-3">
                  {isEditMode && !isDocumentsSection && (
                    <div className="flex items-center space-x-2">
                      {isEditing ? (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleSaveSection(index)}
                            className="text-white hover:bg-white/20"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleCancelEdit}
                            className="text-white hover:bg-white/20"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleStartEdit(index)}
                          className="text-white hover:bg-white/20"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Section Content */}
              <div className="px-6 py-6 bg-gray-50">
                {isEditing ? (
                  // Determine if content is a table or text (same logic as K-12)
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
                      }}
                    >
                      {section.content}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Table Editor Component (copied from K-12)
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

          // Clean up cell content and remove markdown formatting
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

// Formatted Text Editor Component for non-table content (copied from K-12)
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
