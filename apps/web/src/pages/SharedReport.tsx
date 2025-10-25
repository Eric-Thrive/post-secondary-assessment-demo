import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { LoadingState } from '@/components/report/EmptyStates';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { BookOpen, Target, Star, AlertCircle, FileText, User } from 'lucide-react';

interface SharedReportData {
  id: string;
  caseId: string;
  displayName: string;
  moduleType: string;
  reportData: any;
  createdDate: string;
  sharedAt: string;
}

interface ReportSection {
  title: string;
  content: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

export const SharedReport: React.FC = () => {
  const { shareToken } = useParams<{ shareToken: string }>();
  const [reportData, setReportData] = useState<SharedReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSharedReport = async () => {
      if (!shareToken) {
        setError('Invalid share token');
        setLoading(false);
        return;
      }

      try {
        console.log('📖 Fetching shared report with token:', shareToken);
        const response = await fetch(`/api/shared/${shareToken}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('Shared report not found or sharing has been disabled');
          } else {
            setError('Failed to load shared report');
          }
          setLoading(false);
          return;
        }

        const data = await response.json();
        console.log('📖 Shared report data received:', data);
        setReportData(data);
      } catch (err) {
        console.error('Error fetching shared report:', err);
        setError('Failed to load shared report');
      } finally {
        setLoading(false);
      }
    };

    fetchSharedReport();
  }, [shareToken]);

  const getMarkdownContent = (reportData: SharedReportData): string => {
    // Handle different report data formats
    if (typeof reportData.reportData === 'string') {
      return reportData.reportData;
    }
    
    if (reportData.reportData?.markdown_report) {
      return reportData.reportData.markdown_report;
    }
    
    if (reportData.reportData?.analysis_result) {
      if (typeof reportData.reportData.analysis_result === 'string') {
        return reportData.reportData.analysis_result;
      }
      if (reportData.reportData.analysis_result?.markdown_report) {
        return reportData.reportData.analysis_result.markdown_report;
      }
    }
    
    return 'Report content not available';
  };

  // Parse report into styled sections
  const parseReportSections = (markdownReport: string, moduleType: string): ReportSection[] => {
    if (!markdownReport) return [];

    const reportSections: ReportSection[] = [];
    
    // Remove the main title if present
    const cleanedReport = markdownReport.replace(/^#\s+Student Support Report[^\n]*\n+/i, '');
    
    // Section configuration based on module type
    const getSectionConfig = (moduleType: string) => {
      const baseConfig: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string }> = {
        'Documents Reviewed': { icon: FileText, color: 'blue' },
        'Student Overview': { icon: User, color: 'blue' },
        'Key Support Strategies': { icon: Target, color: 'green' },
        'Strengths': { icon: Star, color: 'purple' },
        'Challenges / Areas of Need': { icon: AlertCircle, color: 'orange' },
        'Challenges': { icon: AlertCircle, color: 'orange' },
        'Additional Notes': { icon: BookOpen, color: 'gray' },
        'TLDR': { icon: BookOpen, color: 'gray' }
      };
      
      // Tutoring-specific sections
      if (moduleType === 'tutoring') {
        return {
          ...baseConfig,
          'Communication Support': { icon: Target, color: 'green' },
          'Learning Support': { icon: Target, color: 'green' },
          'Independence Support': { icon: Target, color: 'purple' },
        };
      }
      
      return baseConfig;
    };

    const sectionConfig = getSectionConfig(moduleType);
    
    // Split by section dividers or headers
    const sections = cleanedReport.split(/\n(?=##\s)/);
    
    sections.forEach(section => {
      const trimmedSection = section.trim();
      if (!trimmedSection) return;
      
      // Find the section header (## Header)
      const headerMatch = trimmedSection.match(/^##\s+(.+?)(?:\n|$)/);
      if (headerMatch) {
        const headerText = headerMatch[1].trim();
        
        // Skip TLDR section
        if (headerText.includes('TLDR') || headerText.includes('Teacher Cheat-Sheet')) {
          return;
        }
        
        // Extract content after the header and clean asterisks
        let content = trimmedSection.substring(headerMatch[0].length).trim();
        content = content.replace(/\*+/g, '');
        
        // Find matching section config
        const matchingKey = Object.keys(sectionConfig).find(key => 
          headerText.includes(key) || 
          (key === 'Challenges / Areas of Need' && headerText.includes('Challenges')) ||
          (key === 'Challenges' && headerText.includes('Challenge'))
        );
        
        if (matchingKey && content) {
          const configItem = (sectionConfig as any)[matchingKey];
          if (configItem) {
            reportSections.push({
              title: headerText,
              content: content,
              icon: configItem.icon,
              color: configItem.color
            });
          }
        }
      }
    });

    return reportSections;
  };

  // Tutoring-specific gradient styling
  const getTutoringGradient = (sectionTitle: string) => {
    const gradientMap: Record<string, string> = {
      'Documents Reviewed': 'from-teal-500 to-cyan-500',
      'Student Overview': 'from-blue-500 to-cyan-500', 
      'Tutoring Strategies': 'from-pink-500 to-rose-500',
      'Key Support Strategies': 'from-pink-500 to-rose-500',
      'Strengths': 'from-emerald-500 to-green-500',
      'Challenges': 'from-orange-500 to-amber-500',
      'Challenges / Areas of Need': 'from-orange-500 to-amber-500',
      'Additional Notes': 'from-gray-500 to-slate-500',
      'Support Recommendations': 'from-yellow-500 to-orange-500',
      'Learning Profile': 'from-purple-500 to-indigo-500'
    };
    
    // Find matching gradient
    const matchingKey = Object.keys(gradientMap).find(key => 
      sectionTitle.includes(key) || 
      (key === 'Challenges / Areas of Need' && sectionTitle.includes('Challenges')) ||
      (key === 'Challenges' && sectionTitle.includes('Challenge'))
    );
    
    return matchingKey ? gradientMap[matchingKey] : gradientMap['Additional Notes'];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <LoadingState />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Report Not Available
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {error}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              The link may have been disabled or expired.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              No Report Data
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              The shared report could not be loaded.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const markdownContent = getMarkdownContent(reportData);
  const reportSections = parseReportSections(markdownContent, reportData.moduleType);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {reportData.displayName}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                Shared Assessment Report • {reportData.moduleType}
              </p>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Created: {new Date(reportData.createdDate).toLocaleDateString()}
              {reportData.sharedAt && (
                <>
                  <br />
                  Shared: {new Date(reportData.sharedAt).toLocaleDateString()}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Report Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {reportSections.length > 0 ? (
            <div className="space-y-6">
              {reportSections.map((section, index) => {
                // Make full-width cards for sections with tables
                const hasTable = section.content.includes('|');
                
                return (
                  <Card 
                    key={index} 
                    className="shadow-lg border-0 overflow-hidden hover:shadow-xl transition-all"
                  >
                    <CardHeader className={`bg-gradient-to-r ${getTutoringGradient(section.title)} p-5`}>
                      <CardTitle className="flex items-center gap-3 text-white">
                        <div className="bg-white/20 backdrop-blur-sm p-2 rounded-lg">
                          <section.icon className="h-6 w-6 text-white" />
                        </div>
                        <span className="text-xl font-semibold tracking-wide">{section.title}</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 bg-gradient-to-br from-white to-gray-50">
                      <div className="prose prose-sm max-w-none">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            h1: ({ node, ...props }) => <h1 className="text-lg font-bold mb-2" {...props} />,
                            h2: ({ node, ...props }) => <h2 className="text-base font-semibold mb-2" {...props} />,
                            h3: ({ node, ...props }) => <h3 className="text-sm font-medium mb-1" {...props} />,
                            p: ({ node, ...props }) => <p className="mb-2 text-gray-700" {...props} />,
                            ul: ({ node, ...props }) => <ul className="list-disc pl-5 mb-2" {...props} />,
                            li: ({ node, ...props }) => <li className="mb-1" {...props} />,
                            strong: ({ node, ...props }) => <strong className="font-semibold text-gray-900" {...props} />,
                            // Table components
                            table: ({ node, ...props }) => (
                              <div className="overflow-x-auto mb-4 -mx-4">
                                <table className="w-full border-collapse" {...props} />
                              </div>
                            ),
                            thead: ({ node, ...props }) => <thead {...props} />,
                            tbody: ({ node, ...props }) => <tbody className="divide-y divide-gray-100" {...props} />,
                            tr: ({ node, ...props }) => <tr className="hover:bg-gray-50" {...props} />,
                            th: ({ node, ...props }) => (
                              <th className="px-4 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200" {...props} />
                            ),
                            td: ({ node, ...props }) => (
                              <td className="px-4 py-2 text-sm text-gray-900 border-b border-gray-100" {...props} />
                            ),
                            hr: ({ node, ...props }) => <hr className="my-4 border-gray-200" {...props} />,
                          }}
                        >
                          {section.content}
                        </ReactMarkdown>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            // Fallback to simple markdown rendering if parsing fails
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
              <div className="p-8">
                <article className="prose prose-lg dark:prose-invert max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {markdownContent}
                  </ReactMarkdown>
                </article>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-6 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            This is a shared assessment report. The original report was generated using AI-powered analysis.
          </p>
        </div>
      </footer>
    </div>
  );
};