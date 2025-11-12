import React, { useState, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Download,
  Share2,
  Edit,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  BookOpen,
  Users,
  Eye,
  Printer,
  Package,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useNavigate } from "react-router-dom";
import { useModule } from "@/contexts/ModuleContext";
import { useToast } from "@/hooks/use-toast";
import { useReactToPrint } from "react-to-print";
import { AssessmentCase } from "@/types/assessmentCase";
import { BatchExportModal } from "./BatchExportModal";
import { UniversalCompactPrintReport } from "../report/UniversalCompactPrintReport";

interface UnifiedReportViewerProps {
  currentCase: AssessmentCase | null;
  markdownReport: string | null;
  hasAnalysisResult: boolean;
  onDownloadPDF?: () => void;
  onDownloadMarkdown?: () => void;
  onDownloadRawText?: () => void;
  onShareReport?: () => void;
  isShared?: boolean;
  availableCases?: AssessmentCase[];
}

export const UnifiedReportViewer: React.FC<UnifiedReportViewerProps> = ({
  currentCase,
  markdownReport,
  hasAnalysisResult,
  onDownloadPDF,
  onDownloadMarkdown,
  onDownloadRawText,
  onShareReport,
  isShared,
  availableCases = [],
}) => {
  const navigate = useNavigate();
  const { activeModule } = useModule();
  const { toast } = useToast();
  const [currentView, setCurrentView] = useState("overview");
  const [isBatchExportOpen, setIsBatchExportOpen] = useState(false);
  const compactPrintRef = useRef<HTMLDivElement>(null);

  // In the simplified RBAC system, demo mode will be handled by user roles
  const isDemoMode = false;

  // Module configuration
  const moduleConfig = {
    post_secondary: {
      name: "Post-Secondary",
      icon: GraduationCap,
      color: "bg-blue-600",
      textColor: "text-blue-600",
      reviewEditRoute: "/post-secondary-review-edit",
    },
    k12: {
      name: "K-12",
      icon: BookOpen,
      color: "bg-green-600",
      textColor: "text-green-600",
      reviewEditRoute: "/k12-review-edit",
    },
    tutoring: {
      name: "Tutoring",
      icon: Users,
      color: "bg-purple-600",
      textColor: "text-purple-600",
      reviewEditRoute: "/tutoring-review-edit",
    },
  };

  const currentModuleConfig =
    moduleConfig[activeModule as keyof typeof moduleConfig];

  // Parse markdown into sections based on module type
  const sections = useMemo(() => {
    if (!markdownReport) return [];

    if (activeModule === "post_secondary") {
      // Post-secondary parsing (existing logic for complex sections)
      const lines = markdownReport.split("\n");
      const sections: Array<{ title: string; content: string; id: string }> =
        [];
      let currentSection: {
        title: string;
        content: string;
        id: string;
      } | null = null;

      for (const line of lines) {
        // Check for section headers (## or ###)
        const headerMatch = line.match(/^(#{2,3})\s+(.+)$/);
        if (headerMatch) {
          // Save previous section
          if (currentSection) {
            sections.push(currentSection);
          }

          // Start new section
          const title = headerMatch[2].trim();
          const id = title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "");
          currentSection = {
            title,
            content: "",
            id,
          };
        } else if (currentSection) {
          // Add content to current section
          currentSection.content += line + "\n";
        }
      }

      // Add the last section
      if (currentSection) {
        sections.push(currentSection);
      }

      return sections;
    } else {
      // K-12 and Tutoring parsing (section-based with --- dividers)
      const reportSections: Array<{
        title: string;
        content: string;
        id: string;
      }> = [];

      // Remove the main title if present
      const cleanedReport = markdownReport.replace(
        /^#\s+Student Support Report.*?\n+/i,
        ""
      );

      // Split by section dividers (---)
      const sections = cleanedReport.split(/\n---\n/);

      sections.forEach((section) => {
        const trimmedSection = section.trim();
        if (!trimmedSection) return;

        // Find the section header (## Header)
        const headerMatch = trimmedSection.match(/^##\s+(.+?)(?:\n|$)/);
        if (headerMatch) {
          const headerText = headerMatch[1].trim();

          // Skip TLDR section for K-12
          if (
            activeModule === "k12" &&
            (headerText.includes("TLDR") ||
              headerText.includes("Teacher Cheat-Sheet"))
          ) {
            return;
          }

          // Extract content after the header
          let content = trimmedSection.substring(headerMatch[0].length).trim();

          if (content) {
            const id = headerText
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/^-|-$/g, "");
            reportSections.push({
              title: headerText,
              content: content,
              id,
            });
          }
        } else {
          // Handle sections without ## prefix (like Additional Notes sometimes)
          const firstLine = trimmedSection.split("\n")[0].trim();
          const content = trimmedSection.substring(firstLine.length).trim();

          if (content && firstLine) {
            const id = firstLine
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/^-|-$/g, "");
            reportSections.push({
              title: firstLine,
              content: content,
              id,
            });
          }
        }
      });

      return reportSections;
    }
  }, [markdownReport, activeModule]);

  // Navigation items based on sections
  const navigationItems = [
    { id: "overview", label: "Overview", icon: Eye },
    ...sections.map((section) => ({
      id: section.id,
      label: section.title,
      icon: FileText,
    })),
  ];

  // Handle edit click
  const handleEditClick = () => {
    if (isDemoMode) {
      toast({
        title: "Premium Feature",
        description:
          "Review & Edit is only available on paid plans. Contact eric@thriveiep.com to upgrade and access this feature.",
        variant: "default",
      });
      return;
    }

    if (currentCase?.id) {
      navigate(
        `${currentModuleConfig.reviewEditRoute}?caseId=${currentCase.id}`
      );
    } else {
      navigate(currentModuleConfig.reviewEditRoute);
    }
  };

  // Handle compact print
  const handleCompactPrint = useReactToPrint({
    contentRef: compactPrintRef,
    documentTitle: `${currentModuleConfig.name}_Report_${
      currentCase?.display_name?.replace(/[^a-z0-9]/gi, "_") || "Report"
    }_${new Date().toISOString().split("T")[0]}`,
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
      }
    `,
  });

  // Get current section content
  const getCurrentContent = () => {
    if (currentView === "overview") {
      return {
        title: "Report Overview",
        content: `# ${
          currentCase?.display_name || "Assessment Report"
        }\n\n**Module:** ${currentModuleConfig.name}\n\n**Created:** ${
          currentCase?.created_date
            ? new Date(currentCase.created_date).toLocaleDateString()
            : "Unknown"
        }\n\n**Status:** ${
          currentCase?.status || "Unknown"
        }\n\nThis report contains a comprehensive analysis of the assessment data. Use the navigation on the left to explore different sections of the report.`,
      };
    }

    const section = sections.find((s) => s.id === currentView);
    return section ? { title: section.title, content: section.content } : null;
  };

  const currentContent = getCurrentContent();

  if (!hasAnalysisResult || !markdownReport) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Report Available
          </h3>
          <p className="text-gray-600">
            This assessment hasn't been processed yet or doesn't have analysis
            results.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-screen bg-gray-50">
      {/* Left Sidebar Navigation */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center space-x-3 mb-4">
            <div className={`p-2 rounded-lg ${currentModuleConfig.color}`}>
              <currentModuleConfig.icon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">
                {currentModuleConfig.name} Report
              </h2>
              <p className="text-sm text-gray-600">
                {currentCase?.display_name || "Assessment Report"}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            <Button
              onClick={handleEditClick}
              variant="outline"
              size="sm"
              className="w-full justify-start"
            >
              <Edit className="h-4 w-4 mr-2" />
              Review & Edit
            </Button>

            <div className="space-y-2">
              <Button
                onClick={handleCompactPrint}
                variant="outline"
                size="sm"
                className="w-full justify-start"
              >
                <Printer className="h-4 w-4 mr-2" />
                Print Compact Report
              </Button>

              <div className="flex space-x-2">
                {onDownloadPDF && (
                  <Button
                    onClick={onDownloadPDF}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    PDF
                  </Button>
                )}

                {onShareReport && (
                  <Button
                    onClick={onShareReport}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    <Share2 className="h-4 w-4 mr-1" />
                    Share
                  </Button>
                )}
              </div>

              {availableCases.length > 1 && (
                <Button
                  onClick={() => setIsBatchExportOpen(true)}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  <Package className="h-4 w-4 mr-2" />
                  Batch Export
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 p-4 space-y-1">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
            Report Sections
          </h3>

          {navigationItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={`
                w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors
                ${
                  currentView === item.id
                    ? `${currentModuleConfig.color} text-white`
                    : "text-gray-700 hover:bg-gray-100"
                }
              `}
            >
              <item.icon className="h-4 w-4" />
              <span className="text-sm font-medium truncate">{item.label}</span>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Report Generated</span>
            <span>
              {currentCase?.created_date
                ? new Date(currentCase.created_date).toLocaleDateString()
                : "Unknown"}
            </span>
          </div>
          {isShared && (
            <Badge variant="secondary" className="w-full mt-2 justify-center">
              Shared Report
            </Badge>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Content Header */}
        <div className="bg-white border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {currentContent?.title || "Report Section"}
              </h1>
              <p className="text-gray-600 mt-1">
                {currentView === "overview"
                  ? "Complete assessment report overview"
                  : "Detailed section analysis"}
              </p>
            </div>

            <div className="flex items-center space-x-2">
              {onDownloadMarkdown && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onDownloadMarkdown}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Markdown
                </Button>
              )}

              {onDownloadRawText && (
                <Button variant="outline" size="sm" onClick={onDownloadRawText}>
                  <Download className="h-4 w-4 mr-2" />
                  Raw Text
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 p-6 overflow-auto">
          <Card className="max-w-none">
            <CardContent className="p-8">
              {currentContent ? (
                <div className="prose prose-lg max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {currentContent.content}
                  </ReactMarkdown>
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Section Not Found
                  </h3>
                  <p className="text-gray-600">
                    The selected section could not be loaded.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Batch Export Modal */}
      <BatchExportModal
        isOpen={isBatchExportOpen}
        onClose={() => setIsBatchExportOpen(false)}
        availableCases={availableCases}
        moduleType={activeModule as "k12" | "post_secondary" | "tutoring"}
      />

      {/* Hidden Compact Print Report */}
      <div style={{ display: "none" }} aria-hidden="true">
        <UniversalCompactPrintReport
          ref={compactPrintRef}
          markdownReport={markdownReport || ""}
          reportType={activeModule === "k12" ? "k12" : "tutoring"}
          studentName={currentCase?.display_name || "Student"}
        />
      </div>
    </div>
  );
};
