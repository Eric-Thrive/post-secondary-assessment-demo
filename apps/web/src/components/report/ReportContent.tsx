import React, { useState, useMemo, useEffect, useRef } from "react";
import { AssessmentCase } from "@/types/assessmentCase";
import { NoDataPrompt } from "@/components/report/EmptyStates";
import { CaseInformation } from "@/components/report/CaseInformation";
import { K12CardReportEnhanced } from "@/components/report/K12CardReportEnhanced";
import { K12CompactReport } from "@/components/report/K12CompactReport";
import { TutoringCardReportEditable } from "@/components/report/TutoringCardReportEditable";
import FigmaEnhancedReportViewer from "@/components/FigmaEnhancedReportViewer";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  ListChecks,
  Info,
  Layout,
  Layers,
} from "lucide-react";
interface ReportContentProps {
  currentCase: AssessmentCase;
  markdownReport: string | null;
  hasAnalysisResult: boolean;
}

interface ReportSection {
  title: string;
  content: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const ReportContent: React.FC<ReportContentProps> = ({
  currentCase,
  markdownReport,
  hasAnalysisResult,
}) => {
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [fontSize, setFontSize] = useState("text-sm");
  const contentRef = useRef<HTMLDivElement>(null);

  // Check if we're in K-12 demo environment
  const currentEnvironment =
    localStorage.getItem("app-environment") || "replit-prod";
  const isK12Demo = currentEnvironment === "k12-demo";
  const isK12Module = currentCase?.module_type === "k12";

  // Parse markdown report into sections
  const reportSections = useMemo(() => {
    if (!markdownReport) return [];

    const sections: ReportSection[] = [];

    // Split by level 2 headers (## sections)
    const parts = markdownReport.split(/^## /m);

    if (parts.length > 1) {
      // Process each section (skip the first part if it's just the title or empty)
      for (let i = 1; i < parts.length; i++) {
        const sectionContent = parts[i];
        const titleMatch = sectionContent.match(/^([^\n]+)/);
        const title = titleMatch ? titleMatch[1].trim() : `Section ${i}`;
        const content = `## ${sectionContent}`;

        // Check if this is section 2 (Functional Impact Summary)
        if (title.includes("2.") && title.includes("Functional Impact")) {
          // Split Section 2 by functional impairments (max 4 per page)
          const barrierPattern = /\*\*Observed Barrier:\*\*/g;

          // First, extract just the content after the header
          const headerEndIndex = content.indexOf("\n\n");
          const sectionHeader = content.substring(0, headerEndIndex + 2);
          const sectionBody = content.substring(headerEndIndex + 2);

          // Split the body by barriers
          const barriers = sectionBody
            .split(barrierPattern)
            .filter((b) => b.trim());

          // Check if we actually have barriers (first element might be empty)
          const actualBarriers =
            barriers[0]?.trim() === "" ? barriers.slice(1) : barriers;

          if (actualBarriers.length > 7) {
            // Need to split into multiple pages
            const pagesNeeded = Math.ceil(actualBarriers.length / 7);

            for (let pageNum = 0; pageNum < pagesNeeded; pageNum++) {
              const startIdx = pageNum * 7;
              const endIdx = Math.min(startIdx + 7, actualBarriers.length);
              const pageBarriers = actualBarriers.slice(startIdx, endIdx);

              // Reconstruct the content for this page
              let pageContent = `## 2. Functional Impact Summary`;
              if (pagesNeeded > 1) {
                pageContent = `## 2. Functional Impact Summary (Page ${
                  pageNum + 1
                } of ${pagesNeeded})`;
              }
              pageContent += "\n\n";

              // Add each barrier back with the **Observed Barrier:** prefix
              pageBarriers.forEach((barrier, index) => {
                if (index > 0) pageContent += "\n\n";
                pageContent += "**Observed Barrier:** " + barrier.trim();
              });

              sections.push({
                title:
                  pagesNeeded > 1
                    ? `2. Functional Impact Summary (${
                        startIdx + 1
                      }-${endIdx} of ${actualBarriers.length})`
                    : "2. Functional Impact Summary",
                content: pageContent.trim(),
                icon: ListChecks,
              });
            }
          } else {
            // 4 or fewer barriers, keep as single page
            sections.push({
              title,
              content,
              icon: ListChecks,
            });
          }
        }
        // Check if this is section 3 (Accommodation & Support Plan)
        else if (title.includes("3.") && title.includes("Accommodation")) {
          // Split section 3 into subsections
          const subsections = content.split(/(?=###\s*3\.\d+)/);

          let section31Content = "";
          let section32Content = "";
          let section33Content = "";
          let section34Content = "";

          for (const subsection of subsections) {
            if (subsection.includes("### 3.1")) {
              section31Content = subsection;
            } else if (subsection.includes("### 3.2")) {
              section32Content = subsection;
            } else if (subsection.includes("### 3.3")) {
              section33Content = subsection;
            } else if (subsection.includes("### 3.4")) {
              section34Content = subsection;
            }
            // Remove the problematic prepending logic that disrupts Section 3.1 formatting
          }

          // Section 3.1 on its own page
          if (section31Content) {
            sections.push({
              title: "3.1 Academic Accommodations",
              content: section31Content.trim(),
              icon: ListChecks,
            });
          }

          // Sections 3.2, 3.3, and 3.4 combined on one page
          const combinedContent = (
            section32Content +
            section33Content +
            section34Content
          ).trim();
          if (combinedContent) {
            sections.push({
              title: "3.2-3.4 Instructional/Auxiliary/Support",
              content: combinedContent,
              icon: ListChecks,
            });
          }
        } else {
          // Regular section processing
          sections.push({
            title,
            content,
            icon: ListChecks,
          });
        }
      }
    } else {
      // Fallback: treat entire report as one section
      sections.push({
        title: "Complete Report",
        content: markdownReport,
        icon: FileText,
      });
    }

    // Debug logging
    console.log("=== Report Sections Parsed ===");
    console.log("Total sections:", sections.length);
    sections.forEach((section, index) => {
      console.log(
        `Section ${index + 1}: "${section.title}" (${
          section.content.length
        } chars)`
      );
    });

    return sections;
  }, [markdownReport, currentCase]);

  const currentSection = reportSections[currentSectionIndex];
  const totalSections = reportSections.length;

  // Dynamic font sizing based on content length
  useEffect(() => {
    const adjustFontSize = () => {
      if (!contentRef.current || !reportSections[currentSectionIndex]) return;

      const container = contentRef.current;
      const containerHeight = container.offsetHeight;
      const scrollHeight = container.scrollHeight;
      const contentLength = reportSections[currentSectionIndex].content.length;

      // If content overflows, reduce font size
      if (scrollHeight > containerHeight) {
        if (contentLength > 2000) {
          setFontSize("text-xs");
        } else if (contentLength > 1500) {
          setFontSize("text-sm");
        } else {
          setFontSize("text-base");
        }
      } else {
        // If content fits, use larger font
        if (contentLength < 1000) {
          setFontSize("text-base");
        } else {
          setFontSize("text-sm");
        }
      }
    };

    // Small delay to ensure DOM is updated
    const timer = setTimeout(adjustFontSize, 100);
    return () => clearTimeout(timer);
  }, [currentSectionIndex, reportSections]);

  const goToNextSection = () => {
    if (currentSectionIndex < totalSections - 1) {
      setCurrentSectionIndex(currentSectionIndex + 1);
    }
  };

  const goToPreviousSection = () => {
    if (currentSectionIndex > 0) {
      setCurrentSectionIndex(currentSectionIndex - 1);
    }
  };
  // Enhanced debugging to investigate database vs UI discrepancy
  React.useEffect(() => {
    console.log("=== ENHANCED DATABASE CONTENT INVESTIGATION ===");
    console.log("Case ID:", currentCase.id);
    console.log("Case status:", currentCase.status);
    console.log(
      "Raw analysis_result from database:",
      currentCase.analysis_result
    );
    console.log(
      "Raw report_data from database:",
      (currentCase as any).report_data
    );

    const analysisResult =
      currentCase.analysis_result || (currentCase as any).report_data;
    if (analysisResult) {
      console.log("Analysis result type:", typeof analysisResult);
      console.log("Analysis result keys:", Object.keys(analysisResult));
      if (analysisResult.markdown_report) {
        console.log(
          "Raw markdown_report length:",
          analysisResult.markdown_report.length
        );
        console.log(
          "First 500 chars of stored markdown:",
          analysisResult.markdown_report.substring(0, 500)
        );
        console.log(
          "Last 500 chars of stored markdown:",
          analysisResult.markdown_report.substring(
            Math.max(0, analysisResult.markdown_report.length - 500)
          )
        );

        // Check for potential encoding or formatting issues
        const hasSpecialChars = /[^\x20-\x7E\n\r\t]/.test(
          analysisResult.markdown_report
        );
        console.log("Contains non-printable characters:", hasSpecialChars);

        // Check line count
        const lineCount = analysisResult.markdown_report.split("\n").length;
        console.log("Total lines in markdown:", lineCount);

        // Check for common markdown patterns
        const hasHeaders = /^#+\s/m.test(analysisResult.markdown_report);
        const hasBold = /\*\*.*?\*\*/m.test(analysisResult.markdown_report);
        const hasLists = /^[-*+]\s/m.test(analysisResult.markdown_report);
        console.log("Markdown formatting detected:", {
          hasHeaders,
          hasBold,
          hasLists,
        });
      } else {
        console.log("❌ No markdown_report found in analysis_result");
      }
    } else {
      console.log("❌ No analysis_result found in case");
    }
    console.log(
      "Processed markdownReport length (from useMarkdownReport):",
      markdownReport?.length || 0
    );
    console.log("hasAnalysisResult flag:", hasAnalysisResult);
  }, [currentCase, markdownReport, hasAnalysisResult]);

  // If K-12, tutoring, or post-secondary module, use the unified viewer
  const isTutoringModule = currentCase?.module_type === "tutoring";
  const isPostSecondaryModule = currentCase?.module_type === "post_secondary";
  if (
    (isK12Module || isTutoringModule || isPostSecondaryModule) &&
    hasAnalysisResult &&
    markdownReport
  ) {
    // Extract student name from the case if available
    const studentName =
      (currentCase as any).student_name ||
      (currentCase as any).file_name?.split("_")[0] ||
      "Student";

    // For post-secondary, use the FigmaEnhancedReportViewer component
    if (isPostSecondaryModule) {
      return (
        <FigmaEnhancedReportViewer
          currentCase={currentCase}
          markdownReport={markdownReport}
          hasAnalysisResult={!!markdownReport}
          initialViewMode="figma"
          autoload={false}
        />
      );
    }

    // For K-12 and tutoring, use the unified viewer (no view toggle)
    return (
      <K12CardReportEnhanced
        markdownReport={markdownReport}
        studentName={studentName}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Paginated Report Display */}
      {hasAnalysisResult && markdownReport && totalSections > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-4">
          {/* Section Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="p-1 bg-blue-100 rounded">
                {currentSection &&
                  React.createElement(currentSection.icon, {
                    className: "h-4 w-4 text-blue-600",
                  })}
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">
                  {currentSection?.title}
                </h3>
                <p className="text-xs text-gray-500">
                  Section {currentSectionIndex + 1} of {totalSections}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* Case Information Button */}
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center space-x-1"
                  >
                    <Info className="h-4 w-4" />
                    <span>Case Info</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Case Information</DialogTitle>
                  </DialogHeader>
                  <CaseInformation currentCase={currentCase} />
                </DialogContent>
              </Dialog>

              {/* Progress indicator */}
              <div className="flex items-center space-x-2">
                <div className="w-24 h-1 bg-gray-200 rounded-full">
                  <div
                    className="h-1 bg-blue-500 rounded-full transition-all duration-300"
                    style={{
                      width: `${
                        ((currentSectionIndex + 1) / totalSections) * 100
                      }%`,
                    }}
                  />
                </div>
                <span className="text-xs text-gray-500 font-medium">
                  {Math.round(
                    ((currentSectionIndex + 1) / totalSections) * 100
                  )}
                  %
                </span>
              </div>
            </div>
          </div>

          {/* Section Content - Viewport Height Based */}
          <div className="bg-gray-50 rounded-lg p-4 h-[calc(100vh-200px)] min-h-[500px] overflow-hidden">
            <div
              ref={contentRef}
              className={`text-gray-700 ${fontSize}`}
              style={{ maxWidth: "85%", marginRight: "0" }}
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({ node, ...props }) => (
                    <h1
                      className="text-xl font-bold mb-2 mt-2 text-center"
                      {...props}
                    />
                  ),
                  h2: ({ node, ...props }) => (
                    <h2
                      className="text-lg font-semibold mb-2 mt-3 border-b border-gray-200 pb-1"
                      {...props}
                    />
                  ),
                  h3: ({ node, ...props }) => (
                    <h3
                      className="text-base font-medium mb-1 mt-2"
                      {...props}
                    />
                  ),
                  h4: ({ node, ...props }) => (
                    <h4 className="text-sm font-medium mb-1 mt-2" {...props} />
                  ),
                  p: ({ node, ...props }) => (
                    <p
                      className="mb-2 leading-normal text-sm pl-0"
                      {...props}
                    />
                  ),
                  ul: ({ node, ...props }) => (
                    <ul className="list-disc mb-2 text-sm pl-4" {...props} />
                  ),
                  ol: ({ node, ...props }) => (
                    <ol className="list-decimal mb-2 text-sm pl-4" {...props} />
                  ),
                  li: ({ node, ...props }) => (
                    <li className="mb-1 text-sm" {...props} />
                  ),
                  hr: ({ node, ...props }) => (
                    <hr className="my-2 border-gray-300" {...props} />
                  ),
                  strong: ({ node, ...props }) => (
                    <strong
                      className="font-semibold text-gray-900"
                      {...props}
                    />
                  ),
                  // Support HTML div elements for centering
                  div: ({ node, ...props }) => <div {...props} />,
                }}
              >
                {currentSection?.content}
              </ReactMarkdown>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between mt-4 px-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPreviousSection}
              disabled={currentSectionIndex === 0}
              className="flex items-center space-x-1"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Previous</span>
            </Button>

            <div className="flex space-x-2">
              {reportSections.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSectionIndex(index)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentSectionIndex
                      ? "bg-blue-500"
                      : "bg-gray-300 hover:bg-gray-400"
                  }`}
                />
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={goToNextSection}
              disabled={currentSectionIndex === totalSections - 1}
              className="flex items-center space-x-1"
            >
              <span>Next</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {!hasAnalysisResult && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Debugging Information
          </h2>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-700 space-y-2">
              <div>
                <strong>Case Status:</strong> {currentCase.status}
              </div>
              <div>
                <strong>Has Analysis Result:</strong>{" "}
                {currentCase.analysis_result ? "Yes" : "No"}
              </div>
              {currentCase.analysis_result && (
                <>
                  <div>
                    <strong>Analysis Result Keys:</strong>{" "}
                    {Object.keys(currentCase.analysis_result as any).join(", ")}
                  </div>
                  <div>
                    <strong>Analysis Status:</strong>{" "}
                    {(currentCase.analysis_result as any)?.status || "Unknown"}
                  </div>
                  <div>
                    <strong>Has Markdown Report:</strong>{" "}
                    {!!(currentCase.analysis_result as any)?.markdown_report
                      ? "Yes"
                      : "No"}
                  </div>
                  {(currentCase.analysis_result as any)?.markdown_report && (
                    <div>
                      <strong>Markdown Length:</strong>{" "}
                      {(
                        currentCase.analysis_result as any
                      ).markdown_report.length.toLocaleString()}{" "}
                      characters
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
          <NoDataPrompt
            title="No analysis result available"
            description="The assessment analysis has not completed yet or failed to generate a report."
          />
        </div>
      )}
    </div>
  );
};
