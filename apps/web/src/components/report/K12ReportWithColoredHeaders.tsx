import React, { useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { K12MarkdownExportService } from "@/services/k12MarkdownExportService";
import { Printer, BookOpen } from "lucide-react";

interface K12ReportWithColoredHeadersProps {
  markdownReport: string;
  studentName?: string;
}

interface ReportSection {
  title: string;
  content: string;
  backgroundColor: string;
  textColor: string;
}

export const K12ReportWithColoredHeaders: React.FC<
  K12ReportWithColoredHeadersProps
> = ({ markdownReport, studentName = "Student" }) => {
  const componentRef = useRef<HTMLDivElement>(null);

  // Print original markdown directly from AI
  const handlePrint = () => {
    K12MarkdownExportService.printOriginalMarkdown(markdownReport, studentName);
  };

  const sections = React.useMemo(() => {
    if (!markdownReport) return [];

    const reportSections: ReportSection[] = [];

    const cleanedReport = markdownReport.replace(
      /^#\s+(Student Support Report|Teacher Guide)\s*\n+/i,
      ""
    );
    const sections = cleanedReport.split(/\n---\n/);

    const sectionConfig: Record<
      string,
      { backgroundColor: string; textColor: string }
    > = {
      "Student Overview": {
        backgroundColor: "#4A90E2",
        textColor: "#FFFFFF",
      },
      "Key Support Strategies": {
        backgroundColor: "#9B59B6",
        textColor: "#FFFFFF",
      },
      Strengths: {
        backgroundColor: "#27AE60",
        textColor: "#FFFFFF",
      },
      "Challenges / Areas of Need": {
        backgroundColor: "#E67E22",
        textColor: "#FFFFFF",
      },
      "Additional Notes": {
        backgroundColor: "#7F8C8D",
        textColor: "#FFFFFF",
      },
    };

    sections.forEach((section) => {
      const trimmedSection = section.trim();
      if (!trimmedSection) return;

      const cleanSection = trimmedSection.replace(/^-+\s*/, "").trim();
      const headerMatch = cleanSection.match(/^##\s+(.+?)(?:\n|$)/);

      if (headerMatch) {
        const headerText = headerMatch[1].trim();

        if (
          headerText.includes("TLDR") ||
          headerText.includes("Teacher Cheat-Sheet")
        ) {
          return;
        }

        let content = cleanSection.substring(headerMatch[0].length).trim();

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
            backgroundColor: sectionConfig[matchingKey].backgroundColor,
            textColor: sectionConfig[matchingKey].textColor,
          });
        }
      }
    });

    return reportSections;
  }, [markdownReport]);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="no-print mb-4 flex justify-end">
        <Button onClick={handlePrint} variant="outline">
          <Printer className="w-4 h-4 mr-2" />
          Print Report
        </Button>
      </div>

      <div ref={componentRef} className="bg-white">
        {/* Header */}
        <div className="text-center py-8 border-b">
          <div className="flex items-center justify-center gap-2 mb-2">
            <BookOpen className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-semibold text-blue-600">
              Teacher Guide
            </h1>
          </div>
          <p className="text-sm text-gray-600">Student Support Report</p>
        </div>

        {/* Sections */}
        <div className="space-y-0">
          {sections.map((section, index) => (
            <div key={index} className="border-b last:border-b-0">
              {/* Section Header */}
              <div
                className="px-6 py-4"
                style={{
                  backgroundColor: section.backgroundColor,
                  color: section.textColor,
                }}
              >
                <h2 className="text-lg font-semibold">{section.title}</h2>
              </div>

              {/* Section Content */}
              <div className="px-6 py-6 bg-gray-50">
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      ul: ({ node, ...props }) => (
                        <ul
                          className="list-disc pl-5 space-y-2 text-gray-700"
                          {...props}
                        />
                      ),
                      ol: ({ node, ...props }) => (
                        <ol
                          className="list-decimal pl-5 space-y-2 text-gray-700"
                          {...props}
                        />
                      ),
                      li: ({ node, ...props }) => (
                        <li className="text-gray-700" {...props} />
                      ),
                      p: ({ node, ...props }) => (
                        <p className="text-gray-700 mb-3" {...props} />
                      ),
                      strong: ({ node, ...props }) => (
                        <strong
                          className="font-semibold text-gray-900"
                          {...props}
                        />
                      ),
                      h3: ({ node, ...props }) => (
                        <h3
                          className="font-semibold text-gray-900 mt-4 mb-2"
                          {...props}
                        />
                      ),
                      h4: ({ node, ...props }) => (
                        <h4
                          className="font-semibold text-gray-900 mt-3 mb-2"
                          {...props}
                        />
                      ),
                    }}
                  >
                    {section.content}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default K12ReportWithColoredHeaders;
