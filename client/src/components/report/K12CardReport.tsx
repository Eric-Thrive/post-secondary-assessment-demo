import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { BookOpen, Target, Star, AlertCircle } from 'lucide-react';

interface K12CardReportProps {
  markdownReport: string;
}

interface ReportSection {
  title: string;
  content: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

export const K12CardReport: React.FC<K12CardReportProps> = ({ markdownReport }) => {
  // Parse the K-12 report into sections
  const sections = React.useMemo(() => {
    if (!markdownReport) return [];

    const reportSections: ReportSection[] = [];
    
    // Remove the main title if present
    const cleanedReport = markdownReport.replace(/^#\s+Student Support Report\s*\n+/i, '');
    
    // Split by section dividers (---)
    const sections = cleanedReport.split(/\n---\n/);
    console.log('K12CardReport: Split sections count:', sections.length);
    
    const sectionConfig: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string }> = {
      'TLDR': { icon: BookOpen, color: 'gray' },
      'Student Overview': { icon: BookOpen, color: 'blue' },
      'Key Support Strategies': { icon: Target, color: 'green' },
      'Strengths': { icon: Star, color: 'purple' },
      'Challenges / Areas of Need': { icon: AlertCircle, color: 'orange' },
      'Additional Notes': { icon: BookOpen, color: 'gray' }
    };
    
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
        
        // Clean asterisks from content for display
        content = content.replace(/\*+/g, '');
        
        
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
            color: sectionConfig[matchingKey].color
          });
        }
      } else {
        // Handle sections without ## prefix (like Additional Notes sometimes)
        const firstLine = trimmedSection.split('\n')[0].trim();
        const matchingKey = Object.keys(sectionConfig).find(key => 
          firstLine === key || firstLine.includes(key)
        );
        
        if (matchingKey) {
          let content = trimmedSection.substring(firstLine.length).trim();
          // Clean asterisks from content for display
          content = content.replace(/\*+/g, '');
          if (content) {
            reportSections.push({
              title: matchingKey,
              content: content,
              icon: sectionConfig[matchingKey].icon,
              color: sectionConfig[matchingKey].color
            });
          }
        }
      }
    });

    console.log('K12CardReport: Found sections:', reportSections.map(s => s.title));
    console.log('K12CardReport: Section count:', reportSections.length);

    // The section parsing above is working correctly based on console logs
    // No fallback needed since we're getting all 5 sections

    console.log('K12CardReport: Final sections:', reportSections.map(s => ({ title: s.title, contentLength: s.content.length })));

    return reportSections;
  }, [markdownReport]);

  const getColorClasses = (color: string) => {
    const colorMap: Record<string, string> = {
      blue: 'border-blue-200 bg-blue-50/50',
      green: 'border-green-200 bg-green-50/50',
      purple: 'border-purple-200 bg-purple-50/50',
      orange: 'border-orange-200 bg-orange-50/50',
      gray: 'border-gray-200 bg-gray-50/50'
    };
    return colorMap[color] || colorMap.gray;
  };

  const getIconColorClass = (color: string) => {
    const iconColorMap: Record<string, string> = {
      blue: 'text-blue-600',
      green: 'text-green-600',
      purple: 'text-purple-600',
      orange: 'text-orange-600',
      gray: 'text-gray-600'
    };
    return iconColorMap[color] || iconColorMap.gray;
  };

  return (
    <div className="space-y-6 p-6">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Student Support Report</h1>
        <p className="text-gray-600 mt-2">K-12 Assessment Analysis</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {sections.map((section, index) => {
          // Make full-width cards for sections with tables
          const hasTable = section.content.includes('|');
          const cardClass = hasTable ? 'col-span-1' : 'col-span-1 lg:col-span-1';
          
          return (
            <Card 
              key={index} 
              className={`${cardClass} ${getColorClasses(section.color)} transition-all hover:shadow-lg overflow-visible`}
            >
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <section.icon className={`h-5 w-5 ${getIconColorClass(section.color)}`} />
                <span className="text-lg">{section.title}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none min-h-0">
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
                    tr: ({ node, ...props }) => <tr className="border-b border-gray-100" {...props} />,
                    th: ({ node, ...props }) => (
                      <th className="px-2 py-2 text-left text-xs font-semibold text-gray-800 bg-gray-50/50 first:rounded-tl-md last:rounded-tr-md" {...props} />
                    ),
                    td: ({ node, ...props }) => (
                      <td className="px-2 py-3 text-sm text-gray-700 align-top" {...props} />
                    ),

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


    </div>
  );
};