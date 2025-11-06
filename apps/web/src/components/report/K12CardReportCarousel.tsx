import React, { useRef, useState } from "react";
import { useReactToPrint } from "react-to-print";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { K12MarkdownExportService } from "@/services/k12MarkdownExportService";
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
} from "lucide-react";

interface K12CardReportCarouselProps {
  markdownReport: string;
  studentName?: string;
}

interface ReportSection {
  title: string;
  content: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  iconBg: string;
}

export const K12CardReportCarousel: React.FC<K12CardReportCarouselProps> = ({
  markdownReport,
  studentName = "Student",
}) => {
  const componentRef = useRef<HTMLDivElement>(null);
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);

  // Print original markdown directly from AI
  const handlePrint = () => {
    K12MarkdownExportService.printOriginalMarkdown(markdownReport, studentName);
  };

  // Parse the report into sections
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

    // Enhanced section configuration with gradients
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

        // Extract content after the header
        let content = trimmedSection.substring(headerMatch[0].length).trim();
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
      }
    });

    return reportSections;
  }, [markdownReport]);

  // Update carousel state
  React.useEffect(() => {
    if (!api) {
      return;
    }

    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap() + 1);

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap() + 1);
    });
  }, [api]);

  const formatDate = () => {
    const now = new Date();
    return now.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-6">
      {/* Header */}
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
      </div>

      {/* Carousel Progress Indicator */}
      <div className="mb-6 no-print">
        <div className="flex items-center justify-center gap-2">
          <div className="text-sm text-gray-600 font-medium">
            Section {current} of {count}
          </div>
          <div className="flex gap-1.5 ml-4">
            {Array.from({ length: count }).map((_, index) => (
              <button
                key={index}
                onClick={() => api?.scrollTo(index)}
                className={`h-2 rounded-full transition-all ${
                  index === current - 1
                    ? "w-8 bg-blue-600"
                    : "w-2 bg-gray-300 hover:bg-gray-400"
                }`}
                aria-label={`Go to section ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Carousel Container */}
      <div ref={componentRef}>
        <Carousel
          setApi={setApi}
          className="w-full"
          opts={{
            align: "start",
            loop: false,
          }}
        >
          <CarouselContent>
            {sections.map((section, index) => {
              const IconComponent = section.icon;

              return (
                <CarouselItem key={index} className="carousel-item">
                  <div className="p-1">
                    <Card className="overflow-hidden border-2 shadow-2xl hover:shadow-3xl transition-shadow min-h-[600px]">
                      <CardHeader
                        className={`bg-gradient-to-r ${section.gradient} text-white p-6`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`${section.iconBg} p-3 rounded-lg`}>
                            <IconComponent className="h-6 w-6 text-gray-800" />
                          </div>
                          <CardTitle className="text-2xl font-bold">
                            {section.title}
                          </CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="p-8 bg-gradient-to-br from-white to-gray-50">
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
                                <p className="mb-4 text-gray-600 leading-relaxed text-base">
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
                              table: ({ node, ...props }) => (
                                <div className="overflow-x-auto mb-6 rounded-lg border border-gray-200">
                                  <table
                                    className="w-full border-collapse bg-white"
                                    {...props}
                                  />
                                </div>
                              ),
                              thead: ({ node, ...props }) => (
                                <thead
                                  className="bg-gray-50 border-b-2 border-gray-200"
                                  {...props}
                                />
                              ),
                              tbody: ({ node, ...props }) => (
                                <tbody
                                  className="divide-y divide-gray-100"
                                  {...props}
                                />
                              ),
                              tr: ({ node, ...props }) => (
                                <tr
                                  className="hover:bg-blue-50 transition-colors"
                                  {...props}
                                />
                              ),
                              th: ({ node, ...props }) => (
                                <th
                                  className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider"
                                  {...props}
                                />
                              ),
                              td: ({ node, children, ...props }) => {
                                const text = String(children);

                                if (text.includes("✔") || text.includes("✓")) {
                                  return (
                                    <td
                                      className="px-4 py-3 text-sm text-gray-700 align-top"
                                      {...props}
                                    >
                                      <div className="flex items-start gap-2">
                                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                        <span>
                                          {text.replace(/[✔✓]/g, "").trim()}
                                        </span>
                                      </div>
                                    </td>
                                  );
                                }
                                if (text.includes("✘") || text.includes("✗")) {
                                  return (
                                    <td
                                      className="px-4 py-3 text-sm text-gray-700 align-top"
                                      {...props}
                                    >
                                      <div className="flex items-start gap-2">
                                        <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                                        <span>
                                          {text.replace(/[✘✗]/g, "").trim()}
                                        </span>
                                      </div>
                                    </td>
                                  );
                                }

                                return (
                                  <td
                                    className="px-4 py-3 text-sm text-gray-700 align-top"
                                    {...props}
                                  >
                                    {children}
                                  </td>
                                );
                              },
                            }}
                          >
                            {section.content}
                          </ReactMarkdown>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </CarouselItem>
              );
            })}
          </CarouselContent>
          <CarouselPrevious className="no-print -left-12 h-12 w-12" />
          <CarouselNext className="no-print -right-12 h-12 w-12" />
        </Carousel>
      </div>

      {/* Navigation Hint */}
      <div className="mt-6 text-center text-sm text-gray-500 no-print">
        <p>Use arrow keys or swipe to navigate between sections</p>
      </div>
    </div>
  );
};
