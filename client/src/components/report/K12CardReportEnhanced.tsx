import React, { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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
  Brain,
  Heart,
  Lightbulb
} from 'lucide-react';

interface K12CardReportEnhancedProps {
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

export const K12CardReportEnhanced: React.FC<K12CardReportEnhancedProps> = ({ 
  markdownReport, 
  studentName = "Student" 
}) => {
  const componentRef = useRef<HTMLDivElement>(null);
  
  // Print configuration
  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `${studentName.replace(/\s+/g, '-')}-Teacher-Guide-${new Date().toISOString().split('T')[0]}`,
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
    `
  });

  // Parse the report into sections (supports both K-12 and tutoring reports)
  const sections = React.useMemo(() => {
    if (!markdownReport) return [];

    const reportSections: ReportSection[] = [];
    
    // Remove the main title if present (handle both K-12 and tutoring reports)
    const cleanedReport = markdownReport.replace(/^#\s+(Student Support Report|Tutoring Support Report)\s*\n+/i, '');
    
    // Split by section dividers (---)
    const sections = cleanedReport.split(/\n---\n/);
    
    // Enhanced section configuration with gradients and better icons
    const sectionConfig: Record<string, { 
      icon: React.ComponentType<{ className?: string }>; 
      gradient: string;
      iconBg: string;
    }> = {
      'Student Overview': { 
        icon: User, 
        gradient: 'from-blue-500 to-cyan-500',
        iconBg: 'bg-blue-100'
      },
      'Key Support Strategies': { 
        icon: Target, 
        gradient: 'from-purple-500 to-indigo-500',
        iconBg: 'bg-purple-100'
      },
      'Strengths': { 
        icon: Star, 
        gradient: 'from-emerald-500 to-green-500',
        iconBg: 'bg-emerald-100'
      },
      'Challenges / Areas of Need': { 
        icon: AlertCircle, 
        gradient: 'from-orange-500 to-amber-500',
        iconBg: 'bg-orange-100'
      },
      'Additional Notes': { 
        icon: FileText, 
        gradient: 'from-gray-500 to-slate-500',
        iconBg: 'bg-gray-100'
      }
    };
    
    sections.forEach((section, idx) => {
      const trimmedSection = section.trim();
      if (!trimmedSection) return;
      
      // Remove any leading --- dividers
      const cleanSection = trimmedSection.replace(/^-+\s*/, '').trim();
      
      // Find the section header (## Header)
      const headerMatch = cleanSection.match(/^##\s+(.+?)(?:\n|$)/);
      if (headerMatch) {
        const headerText = headerMatch[1].trim();
        
        // Skip TLDR section
        if (headerText.includes('TLDR') || headerText.includes('Teacher Cheat-Sheet')) {
          return;
        }
        
        // Extract content after the header
        let content = cleanSection.substring(headerMatch[0].length).trim();
        
        // Find matching section config
        const matchingKey = Object.keys(sectionConfig).find(key => 
          headerText.includes(key) || 
          (key === 'Challenges / Areas of Need' && headerText.includes('Challenges'))
        );
        
        if (matchingKey && content) {
          reportSections.push({
            title: matchingKey,
            content: content,
            icon: sectionConfig[matchingKey].icon,
            gradient: sectionConfig[matchingKey].gradient,
            iconBg: sectionConfig[matchingKey].iconBg
          });
        }
      } else {
        // Handle sections without ## prefix (like Student Overview sometimes)
        const firstLine = trimmedSection.split('\n')[0].trim();
        const matchingKey = Object.keys(sectionConfig).find(key => 
          firstLine === key || firstLine.includes(key)
        );
        
        if (matchingKey) {
          let content = trimmedSection.substring(firstLine.length).trim();
          if (content) {
            reportSections.push({
              title: matchingKey,
              content: content,
              icon: sectionConfig[matchingKey].icon,
              gradient: sectionConfig[matchingKey].gradient,
              iconBg: sectionConfig[matchingKey].iconBg
            });
          }
        }
      }
    });

    return reportSections;
  }, [markdownReport]);

  // Extract student name from report if available
  const extractedName = React.useMemo(() => {
    if (studentName !== "Student") return studentName;
    
    const nameMatch = markdownReport.match(/^##?\s*(.+?)\s+is\s+/m);
    if (nameMatch) return nameMatch[1];
    
    return "Student";
  }, [markdownReport, studentName]);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Report Content */}
      <div ref={componentRef} className="bg-white p-8">
        {/* Header */}
        <div className="text-center mb-10 keep-together">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl">
              <BookOpen className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent gradient-text">
              Teacher Guide
            </h1>
          </div>
          
          <p className="text-sm text-gray-500 mt-2">
            Generated on {new Date().toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>

        

        {/* Report Sections */}
        <div className="space-y-6">
          {sections.map((section, index) => (
            <Card 
              key={index} 
              className="shadow-lg border-0 overflow-hidden keep-together hover:shadow-xl transition-all"
            >
              <CardHeader className={`bg-gradient-to-r ${section.gradient} p-5`}>
                <CardTitle className="flex items-center gap-3 text-white">
                  <div className="bg-white/20 backdrop-blur-sm p-2 rounded-lg">
                    <section.icon className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-xl font-semibold tracking-wide">
                    {section.title}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 bg-gradient-to-br from-white to-gray-50">
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h1: ({ node, ...props }) => (
                        <h1 className="text-lg font-bold mb-3 text-gray-800" {...props} />
                      ),
                      h2: ({ node, ...props }) => (
                        <h2 className="text-base font-semibold mb-2 text-gray-800" {...props} />
                      ),
                      h3: ({ node, ...props }) => (
                        <h3 className="text-sm font-medium mb-2 text-gray-700" {...props} />
                      ),
                      p: ({ node, children, ...props }) => {
                        // Enhanced paragraph with checkmark/X replacements
                        const text = String(children);
                        if (text.includes('✔') || text.includes('✓')) {
                          const parts = text.split(/[✔✓]/);
                          return (
                            <p className="mb-3 text-gray-700 leading-relaxed" {...props}>
                              {parts.map((part, i) => (
                                <React.Fragment key={i}>
                                  {i > 0 && (
                                    <CheckCircle className="inline-block w-4 h-4 text-green-500 mx-1" />
                                  )}
                                  {part}
                                </React.Fragment>
                              ))}
                            </p>
                          );
                        }
                        if (text.includes('✘') || text.includes('✗')) {
                          const parts = text.split(/[✘✗]/);
                          return (
                            <p className="mb-3 text-gray-700 leading-relaxed" {...props}>
                              {parts.map((part, i) => (
                                <React.Fragment key={i}>
                                  {i > 0 && (
                                    <XCircle className="inline-block w-4 h-4 text-red-500 mx-1" />
                                  )}
                                  {part}
                                </React.Fragment>
                              ))}
                            </p>
                          );
                        }
                        return (
                          <p className="mb-3 text-gray-700 leading-relaxed" {...props}>
                            {children}
                          </p>
                        );
                      },
                      ul: ({ node, ...props }) => (
                        <ul className="list-disc pl-5 mb-3 space-y-1" {...props} />
                      ),
                      li: ({ node, children, ...props }) => {
                        const text = String(children);
                        const hasCheck = text.includes('✔') || text.includes('✓');
                        const hasX = text.includes('✘') || text.includes('✗');
                        
                        return (
                          <li className={`mb-1 ${hasCheck ? 'text-green-700' : hasX ? 'text-red-700' : 'text-gray-700'}`} {...props}>
                            {children}
                          </li>
                        );
                      },
                      strong: ({ node, ...props }) => (
                        <strong className="font-semibold text-gray-900" {...props} />
                      ),
                      // Enhanced table styling
                      table: ({ node, ...props }) => (
                        <div className="overflow-x-auto mb-6 rounded-lg border border-gray-200">
                          <table className="w-full border-collapse bg-white" {...props} />
                        </div>
                      ),
                      thead: ({ node, ...props }) => (
                        <thead className="bg-gray-50 border-b-2 border-gray-200" {...props} />
                      ),
                      tbody: ({ node, ...props }) => (
                        <tbody className="divide-y divide-gray-100" {...props} />
                      ),
                      tr: ({ node, ...props }) => (
                        <tr className="hover:bg-blue-50 transition-colors" {...props} />
                      ),
                      th: ({ node, ...props }) => (
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider" {...props} />
                      ),
                      td: ({ node, children, ...props }) => {
                        const text = String(children);
                        
                        // Enhanced table cells with icons
                        if (text.includes('✔') || text.includes('✓')) {
                          return (
                            <td className="px-4 py-3 text-sm text-gray-700 align-top" {...props}>
                              <div className="flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                <span>{text.replace(/[✔✓]/g, '').trim()}</span>
                              </div>
                            </td>
                          );
                        }
                        if (text.includes('✘') || text.includes('✗')) {
                          return (
                            <td className="px-4 py-3 text-sm text-gray-700 align-top" {...props}>
                              <div className="flex items-start gap-2">
                                <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                                <span>{text.replace(/[✘✗]/g, '').trim()}</span>
                              </div>
                            </td>
                          );
                        }
                        
                        return (
                          <td className="px-4 py-3 text-sm text-gray-700 align-top" {...props}>
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
          ))}
        </div>

        {/* Footer */}
        <div className="mt-10 pt-6 border-t border-gray-200 text-center keep-together">
          <p className="text-xs text-gray-500">
            This report provides education and advocacy services.
            It does not provide legal or medical advice or services in any manner or form.
          </p>
        </div>
      </div>

      {/* Print Controls - Hidden during print */}
      <div className="no-print mt-6 flex gap-3 justify-center p-4">
        <Button
          onClick={handlePrint}
          className="bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg px-8 py-3"
        >
          <Printer className="w-5 h-5 mr-2" />
          Download PDF Report
        </Button>
      </div>
    </div>
  );
};