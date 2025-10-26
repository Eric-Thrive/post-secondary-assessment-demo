import React, { useState, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Home,
  FileText,
  ListChecks,
  Target,
  BookOpen,
  User,
  HandHeart,
  CheckCircle,
  XCircle,
  Edit,
  Save,
  X,
  ArrowLeft,
  ChevronDown,
  AlertCircle,
} from "lucide-react";
import { useReactToPrint } from "react-to-print";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface PostSecondaryStyleReportProps {
  markdownReport: string;
  studentName?: string;
  reportTitle?: string;
  moduleType: "post_secondary" | "tutoring";
  isEditMode?: boolean;
  onChange?: (newContent: string, changeInfo?: any) => void;
  availableReports?: Array<{ id: string; name: string; student?: string }>;
  currentReportId?: string;
  onReportChange?: (reportId: string) => void;
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
  id: string;
  title: string;
  content: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const PostSecondaryStyleReport: React.FC<
  PostSecondaryStyleReportProps
> = ({
  markdownReport,
  studentName = "Student",
  reportTitle = "Assessment Report",
  moduleType,
  isEditMode = false,
  onChange,
  availableReports = [],
  currentReportId,
  onReportChange,
  documents = [],
}) => {
  const navigate = useNavigate();
  const componentRef = useRef<HTMLDivElement>(null);
  const [selectedSectionId, setSelectedSectionId] = useState<string>("");
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState<string>("");

  // Print handler
  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `${studentName.replace(/\s+/g, "-")}-Report-${
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
        }
        .no-print {
          display: none !important;
        }
        .page-break {
          page-break-after: always;
        }
      }
    `,
  });

  // Parse markdown into sections
  const sections = React.useMemo(() => {
    if (!markdownReport || typeof markdownReport !== "string") return [];

    const reportSections: ReportSection[] = [];

    // Remove the main title if present
    let processedReport = markdownReport.replace(/^#\s+.*?\n\n/m, "");

    // Split by ## headers
    const sectionSplits = processedReport.split(/(?=^##\s)/m);

    // Icon mapping based on section titles
    const iconMap: { [key: string]: any } = {
      "Student Information": User,
      "Documents Reviewed": FileText,
      "Document Review": FileText,
      "Functional Impact": Target,
      Accommodations: CheckCircle,
      "Academic Accommodations": CheckCircle,
      "Report Complete": ListChecks,
      "Go Home": Home,
      "Student Overview": User,
      "Key Support Strategies": Target,
      "Support Strategies": Target,
      Strengths: CheckCircle,
      Challenges: HandHeart,
      "Areas of Need": HandHeart,
      "Additional Notes": BookOpen,
      Notes: BookOpen,
      Implementation: ListChecks,
      "Support Services": BookOpen,
    };

    sectionSplits.forEach((section, index) => {
      if (!section.trim()) return;

      const lines = section.split("\n");
      const titleLine = lines[0];
      let title = titleLine.replace(/^##\s*/, "").trim();
      const content = lines.slice(1).join("\n").trim();

      // Clean up section titles but preserve the essential ones
      // Don't rename the first section if it's Student Information
      if (title.includes("Student Information")) {
        title = "Student Information";
      } else if (title.includes("Document Review")) {
        title = "Document Review";
      } else if (title.includes("Functional Impact")) {
        title = "Functional Impact";
      } else if (title.includes("Accommodations")) {
        title = "Accommodations";
      } else if (title.includes("Implementation")) {
        title = "Implementation Guidelines";
      }

      // Find the best matching icon
      let matchedIcon = BookOpen;
      for (const [key, icon] of Object.entries(iconMap)) {
        if (
          title.toLowerCase().includes(key.toLowerCase()) ||
          key.toLowerCase().includes(title.toLowerCase())
        ) {
          matchedIcon = icon;
          break;
        }
      }

      reportSections.push({
        id: `section-${index}`,
        title,
        content,
        icon: matchedIcon,
      });
    });

    // Add Documents Reviewed section if documents are provided
    if (documents && documents.length > 0) {
      reportSections.push({
        id: "documents-reviewed",
        title: "Documents Reviewed",
        content: "", // This will be handled specially
        icon: FileText,
      });
    }

    // Set the first section as selected by default
    if (reportSections.length > 0 && !selectedSectionId) {
      setSelectedSectionId(reportSections[0].id);
    }

    return reportSections;
  }, [markdownReport]);

  const currentSection = sections.find((s) => s.id === selectedSectionId);

  const handleGoHome = () => {
    navigate("/");
  };

  const handleEditSection = (sectionId: string) => {
    const section = sections.find((s) => s.id === sectionId);
    if (section) {
      setEditingSectionId(sectionId);
      setEditedContent(section.content);
    }
  };

  const handleSaveSection = () => {
    if (!editingSectionId || !onChange) return;

    const section = sections.find((s) => s.id === editingSectionId);
    if (section && editedContent !== section.content) {
      const updatedMarkdown = markdownReport.replace(
        `## ${section.title}\n${section.content}`,
        `## ${section.title}\n${editedContent}`
      );

      onChange(updatedMarkdown, {
        type: "section_edit",
        sectionId: editingSectionId,
        sectionTitle: section.title,
        oldContent: section.content,
        newContent: editedContent,
      });
    }

    setEditingSectionId(null);
    setEditedContent("");
  };

  const handleCancelEdit = () => {
    setEditingSectionId(null);
    setEditedContent("");
  };

  return (
    <>
      <style>{`
        .accommodation-report ol li {
          position: relative;
          margin-bottom: 0.5em;
        }
        
        /* Highlight the accommodation text (first line of each list item) */
        .accommodation-report ol li > p:first-child,
        .accommodation-report ol li > text:first-child {
          background: rgba(255, 193, 7, 0.4);
          padding: 2px 6px;
          border-radius: 4px;
          display: inline-block;
          font-weight: 500;
        }
        
        /* Don't highlight the barrier explanation (italic text) */
        .accommodation-report ol li em {
          background: transparent !important;
          font-style: italic;
          color: #666;
          font-size: 0.9em;
        }
        
        /* Alternative: highlight the entire text node before the em tag */
        .accommodation-report ol li {
          background: linear-gradient(90deg, 
            rgba(255, 193, 7, 0.3) 0%, 
            rgba(255, 193, 7, 0.3) 100%);
          padding: 4px 8px;
          border-radius: 4px;
          margin: 4px 0;
        }
        
        .accommodation-report ol li em {
          background: rgba(255, 255, 255, 0.8);
          padding: 2px 4px;
          border-radius: 2px;
          margin-top: 4px;
          display: block;
        }
      `}</style>
      <div
        className="fixed inset-0 flex flex-col bg-white"
        style={{
          fontFamily:
            'Avenir, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
          zIndex: 1000,
        }}
      >
        {/* Header with gradient background - no margins */}
        <div className="bg-gradient-to-r from-blue-400 to-blue-500 text-white py-6 px-8 no-print">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">{reportTitle}</h1>
              <p className="text-blue-100 mt-1">{studentName}</p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handlePrint}
                variant="secondary"
                className="bg-white text-blue-600 hover:bg-blue-50"
              >
                <FileText className="w-4 h-4 mr-2" />
                Print Report
              </Button>
              <Button
                onClick={handleGoHome}
                variant="secondary"
                className="bg-white text-blue-600 hover:bg-blue-50"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Home
              </Button>
            </div>
          </div>
        </div>

        <div className="flex flex-1 bg-gradient-to-br from-blue-50 to-blue-100">
          {/* Side Navigation Menu - White background with distinct buttons */}
          <div className="w-64 bg-white shadow-lg min-h-full p-4 no-print border-r border-gray-200">
            <div className="space-y-2">
              {sections.map((section) => {
                const Icon = section.icon;
                const isSelected = selectedSectionId === section.id;
                const isEditing = editingSectionId === section.id;

                return (
                  <button
                    key={section.id}
                    onClick={() => setSelectedSectionId(section.id)}
                    className={cn(
                      "w-full text-left px-4 py-3 rounded-lg transition-all duration-200 flex items-center gap-3 border",
                      isSelected
                        ? "bg-yellow-300 text-gray-900 font-semibold shadow-md border-yellow-400"
                        : "bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200 hover:border-gray-300 hover:shadow-sm"
                    )}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm font-medium">{section.title}</span>
                    {isEditing && (
                      <Edit className="w-3 h-3 ml-auto text-blue-600" />
                    )}
                  </button>
                );
              })}

              {/* Go Home button at bottom of menu */}
              <div className="pt-4 mt-4 border-t border-gray-200">
                <button
                  onClick={handleGoHome}
                  className="w-full text-left px-4 py-3 rounded-lg transition-all duration-200 flex items-center gap-3 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 hover:border-gray-300 hover:shadow-sm"
                >
                  <Home className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm font-medium">Go Home</span>
                </button>
              </div>
            </div>
          </div>

          {/* Main Content Area - Centered vertically */}
          <div className="flex-1 p-8 overflow-auto flex flex-col items-center justify-center">
            <div className="w-full max-w-4xl flex flex-col items-center">
              {/* Show only report selector for "Select" section */}
              {currentSection &&
              currentSection.title === "Select" &&
              availableReports.length > 0 ? (
                <Card className="bg-white shadow-lg w-full max-w-2xl">
                  <CardHeader className="border-b">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <User className="w-5 h-5 text-blue-600" />
                      Report Selector
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <label className="text-sm font-medium text-gray-700 flex-shrink-0">
                          Select Report:
                        </label>
                        <Select
                          value={currentReportId || ""}
                          onValueChange={onReportChange}
                        >
                          <SelectTrigger className="w-full max-w-md">
                            <SelectValue placeholder="Choose a report..." />
                          </SelectTrigger>
                          <SelectContent>
                            {availableReports.map((report) => (
                              <SelectItem key={report.id} value={report.id}>
                                {report.name}{" "}
                                {report.student && `- ${report.student}`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Current Student Info within the same card */}
                      <div className="pt-4 border-t">
                        <div className="flex items-center gap-2 text-gray-700">
                          <User className="w-4 h-4" />
                          <span className="font-medium">
                            Current Student: {studentName}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Next Section Button - Bottom right corner */}
                    {sections.length > 1 && (
                      <div className="flex justify-end mt-4 pt-4 border-t">
                        <Button
                          size="sm"
                          onClick={() => {
                            const currentIndex = sections.findIndex(
                              (s) => s.id === selectedSectionId
                            );
                            const nextIndex =
                              (currentIndex + 1) % sections.length;
                            setSelectedSectionId(sections[nextIndex].id);
                          }}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          Next Section
                          <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : currentSection &&
                currentSection.id === "documents-reviewed" ? (
                /* Show documents section */
                <Card className="bg-white shadow-lg w-full max-w-2xl">
                  <CardHeader className="border-b">
                    <div className="flex items-center gap-3">
                      <FileText className="w-6 h-6 text-blue-600" />
                      <CardTitle className="text-xl">
                        Documents Reviewed
                      </CardTitle>
                    </div>
                  </CardHeader>

                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <p className="text-gray-600 text-sm">
                        These are the original documents that were analyzed to
                        create this assessment report.
                      </p>

                      {documents.map((doc, index) => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                              {doc.status === "analyzed" ? (
                                <CheckCircle className="h-5 w-5 text-green-600" />
                              ) : doc.status === "processing" ? (
                                <AlertCircle className="h-5 w-5 text-amber-600" />
                              ) : (
                                <FileText className="h-5 w-5 text-gray-600" />
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">
                                {doc.name}
                              </p>
                              <p className="text-sm text-gray-600">
                                {doc.type} • {doc.size} • Uploaded{" "}
                                {doc.uploadDate}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                doc.status === "analyzed"
                                  ? "bg-green-100 text-green-800"
                                  : doc.status === "processing"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {doc.status}
                            </span>
                          </div>
                        </div>
                      ))}

                      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-start gap-2">
                          <FileText className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <div className="text-sm text-blue-800">
                            <p className="font-medium">Analysis Summary</p>
                            <p className="mt-1">
                              {documents.length} document
                              {documents.length !== 1 ? "s" : ""} processed
                              successfully. All text content was extracted and
                              analyzed to generate the accommodation
                              recommendations in this report.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Next Section Button - Bottom right corner */}
                    {sections.length > 1 && (
                      <div className="flex justify-end mt-4 pt-4 border-t">
                        <Button
                          size="sm"
                          onClick={() => {
                            const currentIndex = sections.findIndex(
                              (s) => s.id === selectedSectionId
                            );
                            const nextIndex =
                              (currentIndex + 1) % sections.length;
                            setSelectedSectionId(sections[nextIndex].id);
                          }}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          Next Section
                          <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                /* Show regular content for other sections */
                currentSection && (
                  <Card className="bg-white shadow-lg w-full max-w-2xl">
                    <CardHeader className="border-b">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {React.createElement(currentSection.icon, {
                            className: "w-6 h-6 text-blue-600",
                          })}
                          <CardTitle className="text-xl">
                            {currentSection.title}
                          </CardTitle>
                        </div>
                        {isEditMode && !editingSectionId && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditSection(currentSection.id)}
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Edit Section
                          </Button>
                        )}
                        {editingSectionId === currentSection.id && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="default"
                              onClick={handleSaveSection}
                            >
                              <Save className="w-4 h-4 mr-1" />
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleCancelEdit}
                            >
                              <X className="w-4 h-4 mr-1" />
                              Cancel
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardHeader>

                    <CardContent className="p-6">
                      {editingSectionId === currentSection.id ? (
                        <textarea
                          value={editedContent}
                          onChange={(e) => setEditedContent(e.target.value)}
                          className="w-full min-h-[400px] p-4 border rounded-lg font-mono text-sm"
                          style={{ fontFamily: "Monaco, Consolas, monospace" }}
                          placeholder="Enter section content..."
                        />
                      ) : (
                        <div
                          className="prose prose-sm max-w-none accommodation-report"
                          style={{
                            fontFamily:
                              'Avenir, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
                          }}
                        >
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {currentSection.content}
                          </ReactMarkdown>
                        </div>
                      )}

                      {/* Next Section Button - Bottom right corner */}
                      {sections.length > 1 && (
                        <div className="flex justify-end mt-4 pt-4 border-t">
                          <Button
                            size="sm"
                            onClick={() => {
                              const currentIndex = sections.findIndex(
                                (s) => s.id === selectedSectionId
                              );
                              const nextIndex =
                                (currentIndex + 1) % sections.length;
                              setSelectedSectionId(sections[nextIndex].id);
                            }}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            Next Section
                            <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              )}
            </div>
          </div>
        </div>

        {/* Print Version */}
        <div className="hidden print:block" ref={componentRef}>
          <div className="mb-6">
            <h1 className="text-2xl font-bold">{reportTitle}</h1>
            <p className="text-gray-600 mt-2">{studentName}</p>
          </div>

          {sections.map((section, index) => (
            <div key={section.id} className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                {React.createElement(section.icon, {
                  className: "w-5 h-5 text-gray-600",
                })}
                <h2 className="text-lg font-semibold">{section.title}</h2>
              </div>
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {section.content}
                </ReactMarkdown>
              </div>
              {index < sections.length - 1 && <hr className="mt-4" />}
            </div>
          ))}
        </div>
      </div>
    </>
  );
};
