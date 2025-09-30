import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Edit2, Check, X, BookOpen, Target, Star, AlertCircle, CheckCircle, XCircle } from "lucide-react";

interface EditableReportContentProps {
  content: string;
  isEditMode: boolean;
  onChange: (newContent: string, changeInfo: any) => void;
  moduleType?: 'k12' | 'post_secondary';
}

export const EditableReportContent: React.FC<EditableReportContentProps> = ({
  content,
  isEditMode,
  onChange,
  moduleType = 'post_secondary'
}) => {
  const [sections, setSections] = useState<any[]>([]);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState<string>('');

  // Section configuration for K-12
  const sectionConfig: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string }> = {
    'Student Overview': { icon: BookOpen, color: 'blue' },
    'Key Support Strategies': { icon: Target, color: 'green' },
    'Strengths': { icon: Star, color: 'purple' },
    'Challenges / Areas of Need': { icon: AlertCircle, color: 'orange' },
    'Additional Notes': { icon: BookOpen, color: 'gray' }
  };

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

  // Convert markdown to HTML for display in contentEditable
  const convertMarkdownToHtml = (markdown: string): string => {
    // First, handle complete tables as blocks
    const tableRegex = /(\|[^\n]+\|\n)+/g;
    let html = markdown;
    
    // Process each table
    html = html.replace(tableRegex, (tableMatch) => {
      const lines = tableMatch.trim().split('\n');
      let tableHtml = '<table class="min-w-full divide-y divide-gray-200">';
      
      lines.forEach((line, index) => {
        // Skip separator lines
        if (line.includes('---') && line.includes('|')) {
          return;
        }
        
        // Split by | and clean up - keep empty cells to maintain structure
        const rawCells = line.split('|');
        // Remove first and last empty cells (from leading/trailing |)
        const cells = rawCells.slice(1, -1).map(cell => cell.trim());
        
        if (cells.length > 0) {
          // Skip rows where all cells are empty (continuation rows with empty first column)
          const hasContent = cells.some(cell => cell.length > 0);
          if (!hasContent) {
            return;
          }
          
          // Check if this is a header row
          const isHeader = cells.some(cell => 
            cell.match(/^(What|Strength|Challenge|What You See|What to Do)/i)
          );
          
          if (isHeader) {
            tableHtml += '<tr>' + cells.map(cell => `<th>${cell}</th>`).join('') + '</tr>';
          } else {
            tableHtml += '<tr>' + cells.map(cell => {
              // Remove all asterisks and clean up
              let cleanCell = cell
                .replace(/\*+/g, '') // Remove all asterisks (single or multiple)
                .replace(/^\✗\s*/, '✗ ')
                .replace(/^\✔\s*/, '✔ ')
                .trim();
              return `<td>${cleanCell}</td>`;
            }).join('') + '</tr>';
          }
        }
      });
      
      tableHtml += '</table>';
      return tableHtml;
    });
    
    // Then handle non-table content
    const lines = html.split('\n');
    html = lines.map(line => {
      // Skip if already processed as table
      if (line.includes('<table') || line.includes('</table>') || line.includes('<tr>') || line.includes('</tr>')) {
        return line;
      }
      
      const trimmedLine = line.trim();
      
      // Convert headers
      if (trimmedLine.startsWith('#')) {
        const match = trimmedLine.match(/^(#{1,6})\s+(.+)$/);
        if (match) {
          const level = match[1].length;
          return `<h${level}>${match[2]}</h${level}>`;
        }
      }
      
      // Convert bold text (remove ** completely for display)
      if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**')) {
        return `<p><strong>${trimmedLine.slice(2, -2)}</strong></p>`;
      }
      
      // Convert bullet points (removing the asterisk)
      if (trimmedLine.startsWith('*') || trimmedLine.startsWith('-')) {
        return `<li>${trimmedLine.substring(1).trim()}</li>`;
      }
      
      // Regular paragraphs - clean asterisks
      if (trimmedLine && !trimmedLine.includes('|')) {
        const cleanedLine = trimmedLine.replace(/\*+/g, '');
        return `<p>${cleanedLine}</p>`;
      }
      
      return '';
    })
    .filter(line => line)
    .join('\n');
    
    // Wrap consecutive list items in ul tags
    html = html.replace(/(<li>.*<\/li>\s*)+/g, match => `<ul>${match}</ul>`);
    
    return html;
  };

  // Convert HTML back to markdown for saving
  const convertHtmlToMarkdown = (html: string): string => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    let markdown = '';
    
    const processNode = (node: Node): string => {
      if (node.nodeType === Node.TEXT_NODE) {
        return node.textContent || '';
      }
      
      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as HTMLElement;
        const tagName = element.tagName.toLowerCase();
        
        switch (tagName) {
          case 'h1':
          case 'h2':
          case 'h3':
          case 'h4':
          case 'h5':
          case 'h6':
            const level = parseInt(tagName.substring(1));
            return '#'.repeat(level) + ' ' + element.textContent + '\n\n';
          case 'p':
            const text = element.textContent || '';
            // Check if it contains bold text
            if (element.querySelector('strong')) {
              return Array.from(element.childNodes)
                .map(child => processNode(child))
                .join('') + '\n\n';
            }
            return text + '\n\n';
          case 'strong':
          case 'b':
            return `**${element.textContent}**`;
          case 'em':
          case 'i':
            return `*${element.textContent}*`;
          case 'ul':
            return Array.from(element.children)
              .map(li => `* ${li.textContent}`)
              .join('\n') + '\n\n';
          case 'li':
            return `* ${element.textContent}\n`;
          case 'table':
            const rows = Array.from(element.querySelectorAll('tr'));
            let tableMarkdown = '';
            
            rows.forEach((row, index) => {
              const cells = Array.from(row.children);
              const cellContents = cells.map(cell => {
                const content = cell.textContent?.trim() || '';
                // For data cells, check if we need to add back asterisk for formatting
                if (cell.tagName === 'TD' && content && !content.startsWith('✔') && !content.startsWith('✗')) {
                  // Don't add asterisk back - keep content clean
                  return content;
                }
                return content;
              });
              
              // Ensure proper table formatting with pipes
              tableMarkdown += '| ' + cellContents.join(' | ') + ' |\n';
              
              // Add separator after header row
              if (index === 0 && row.querySelector('th')) {
                tableMarkdown += '|' + cells.map(() => '---').join('|') + '|\n';
              }
            });
            
            return tableMarkdown + '\n';
          case 'br':
            return '\n';
          default:
            return Array.from(element.childNodes)
              .map(child => processNode(child))
              .join('');
        }
      }
      
      return '';
    };
    
    markdown = Array.from(tempDiv.childNodes)
      .map(node => processNode(node))
      .join('')
      .trim();
    
    // Clean up extra newlines
    markdown = markdown.replace(/\n{3,}/g, '\n\n');
    
    return markdown;
  };

  useEffect(() => {
    // Parse content into sections
    const parsedSections = parseMarkdownIntoSections(content);
    console.log('=== EditableReportContent Debug ===');
    console.log('Module Type:', moduleType);
    console.log('Parsed sections:', parsedSections.map(s => s.title));
    
    // Filter sections based on module type
    const filteredSections = filterSectionsByModule(parsedSections, moduleType);
    console.log('Filtered sections:', filteredSections.map(s => s.title));
    setSections(filteredSections);
  }, [content, moduleType]);

  const parseMarkdownIntoSections = (markdown: string): any[] => {
    let cleanedMarkdown = markdown;

    const lines = cleanedMarkdown.split('\n');
    const sections: any[] = [];
    let currentSection: any = null;

    lines.forEach((line, index) => {
      // Check if line is a header
      const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
      if (headerMatch) {
        if (currentSection) {
          sections.push(currentSection);
        }
        currentSection = {
          id: `section-${index}`,
          level: headerMatch[1].length,
          title: headerMatch[2],
          startLine: index,
          content: [],
          fullContent: ''
        };
      } else if (currentSection) {
        currentSection.content.push(line);
      }
    });

    if (currentSection) {
      sections.push(currentSection);
    }

    // Build full content for each section
    sections.forEach(section => {
      let fullContent = section.content.join('\n').trim();
      
      // For K-12, filter out instructional text from section content
      if (moduleType === 'k12') {
        const filteredLines = fullContent.split('\n').filter((line: string) => {
          const trimmedLine = line.trim();
          return !trimmedLine.includes('✔ = what to do') && 
                 !trimmedLine.includes('✘ = what not to do') &&
                 !trimmedLine.includes('✔ = what to do (recommended strategies/supports)') &&
                 !trimmedLine.includes('✘ = what not to do (common mistakes/counterproductive actions)');
        });
        fullContent = filteredLines.join('\n').trim();
      }
      
      // Clean up asterisks - remove them completely for display
      // ReactMarkdown should handle the bold formatting
      fullContent = fullContent
        .replace(/\*\*\*+/g, '') // Remove triple or more asterisks
        .replace(/\*\*([^*]+?)\*\*/g, '$1') // Remove bold asterisks completely
        .replace(/\*([^*]+?)\*/g, '$1'); // Remove single asterisks (italics)
      
      section.fullContent = fullContent;
    });
    
    return sections;
  };

  const filterSectionsByModule = (sections: any[], moduleType: string): any[] => {
    if (moduleType !== 'k12') {
      return sections; // For post-secondary, show all sections
    }

    // For K-12, only show these specific sections
    const allowedK12Sections = [
      'Student Support Report', // Main title
      'Student Overview',
      'Key Support Strategies', 
      'Strengths',
      'Challenges / Areas of Need', // Exact match for the current format
      'Challenges',
      'Areas of Need',
      'Additional Notes' // Keep this section as requested
    ];

    // Explicitly exclude these sections and instructional text
    const excludedPatterns = [
      'TL;DR',
      'Teacher Cheat-Sheet',
      '✔ = what to do',
      '✘ = what not to do',
      'Student Support Report' // Exclude the main title
    ];

    return sections.filter(section => {
      const title = section.title.trim();
      const content = section.fullContent || '';
      
      // Check if section title or content contains excluded patterns
      const isExcluded = excludedPatterns.some(pattern => 
        title.toLowerCase().includes(pattern.toLowerCase()) ||
        content.toLowerCase().includes(pattern.toLowerCase())
      );
      
      if (isExcluded) {
        return false;
      }
      
      // Then check if it's in the allowed list
      return allowedK12Sections.some(allowed => 
        title.toLowerCase() === allowed.toLowerCase() ||
        title.toLowerCase().includes(allowed.toLowerCase()) ||
        allowed.toLowerCase().includes(title.toLowerCase())
      );
    });
  };

  const handleEditClick = (sectionId: string, sectionContent: string) => {
    setEditingSection(sectionId);
    // Clean up asterisks and other markdown formatting for editing
    let cleanContent = sectionContent
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold asterisks **text**
      .replace(/\*(.*?)\*/g, '$1') // Remove italic asterisks *text*
      .replace(/\*\*([^*]+)\*\*/g, '$1') // Additional bold cleanup
      .replace(/\*([^*]+)\*/g, '$1'); // Additional italic cleanup
    
    setEditedContent(cleanContent);
  };

  const handleSaveSection = (section: any) => {
    const lines = content.split('\n');
    const sectionHeader = '#'.repeat(section.level) + ' ' + section.title;
    
    // Find the section in the original content
    let startIndex = -1;
    let endIndex = lines.length;
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i] === sectionHeader) {
        startIndex = i + 1;
        // Find where this section ends (next header of same or higher level)
        for (let j = i + 1; j < lines.length; j++) {
          const match = lines[j].match(/^(#{1,6})\s+(.+)$/);
          if (match && match[1].length <= section.level) {
            endIndex = j;
            break;
          }
        }
        break;
      }
    }
    
    // Extract just the content of this section (without the header)
    const oldSectionContent = startIndex !== -1 ? 
      lines.slice(startIndex, endIndex).join('\n').trim() : 
      section.fullContent;
    


    if (startIndex !== -1) {
      // Replace the section content
      const newLines = [
        ...lines.slice(0, startIndex),
        ...editedContent.split('\n'),
        ...lines.slice(endIndex)
      ];

      const newContent = newLines.join('\n');
      const changeInfo = {
        type: 'section_edit',
        sectionId: section.id,
        sectionTitle: section.title,
        oldContent: oldSectionContent,
        newContent: editedContent.trim()
      };
      

      
      onChange(newContent, changeInfo);
    }

    setEditingSection(null);
    setEditedContent('');
  };

  const handleCancel = () => {
    setEditingSection(null);
    setEditedContent('');
  };

  if (!isEditMode) {
    // View mode - display the markdown with filtering for K-12
    let displayContent = content;
    if (moduleType === 'k12') {
      // Remove the instructional text about symbols
      displayContent = displayContent
        .split('\n')
        .filter(line => {
          const trimmedLine = line.trim();
          return !trimmedLine.includes('✔ = what to do') && 
                 !trimmedLine.includes('✘ = what not to do') &&
                 !trimmedLine.includes('✔ = what to do (recommended strategies/supports)') &&
                 !trimmedLine.includes('✘ = what not to do (common mistakes/counterproductive actions)');
        })
        .join('\n');
    }
    
    return (
      <div className="prose prose-sm max-w-none k12-report-content">
        <ReactMarkdown 
          remarkPlugins={[remarkGfm]}
          components={{
            table: ({ children }) => (
              <table className="min-w-full divide-y divide-gray-200">
                {children}
              </table>
            ),
            th: ({ children }) => (
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {children}
              </th>
            ),
            td: ({ children }) => (
              <td className="px-4 py-2 text-sm text-gray-900 align-top">
                {children}
              </td>
            )
          }}
        >
          {displayContent}
        </ReactMarkdown>
      </div>
    );
  }

  // Edit mode - show sections with edit buttons
  return (
    <div className="space-y-4">
      {sections.map((section) => {
        // Get section config for K-12
        const config = moduleType === 'k12' 
          ? (sectionConfig[section.title] || 
             (section.title.includes('Challenges') ? sectionConfig['Challenges / Areas of Need'] : null))
          : null;
        
        const Icon = config?.icon;
        const colorClasses = config ? getColorClasses(config.color) : '';
        const iconColorClass = config ? getIconColorClass(config.color) : '';
        
        return (
          <Card key={section.id} className={moduleType === 'k12' ? colorClasses : ''}>
            {moduleType === 'k12' ? (
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {Icon && <Icon className={`h-5 w-5 ${iconColorClass}`} />}
                    <span className="text-lg font-semibold">{section.title}</span>
                  </div>
                  {editingSection !== section.id && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEditClick(section.id, section.fullContent)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
            ) : (
              <div className="flex justify-between items-start mb-2 p-4 pb-0">
                <h3 className={`font-semibold ${
                  section.level === 1 ? 'text-2xl' :
                  section.level === 2 ? 'text-xl' :
                  section.level === 3 ? 'text-lg' : 'text-base'
                }`}>
                  {section.title}
                </h3>
                {editingSection !== section.id && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEditClick(section.id, section.fullContent)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}

            <CardContent className={moduleType === 'k12' ? '' : 'p-4'}>
              {editingSection === section.id ? (
                <div className="space-y-2">
                  <div 
                    contentEditable
                    className="prose prose-sm max-w-none k12-report-content p-4 border rounded-md min-h-[200px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                    dangerouslySetInnerHTML={{ __html: convertMarkdownToHtml(editedContent) }}
                    onInput={(e) => {
                      const target = e.target as HTMLDivElement;
                      const markdown = convertHtmlToMarkdown(target.innerHTML);
                      setEditedContent(markdown);
                    }}
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleSaveSection(section)}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Apply Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCancel}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="prose prose-sm max-w-none k12-report-content">
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
                      )
                    }}
                  >
                    {section.fullContent}
                  </ReactMarkdown>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

// Component to render challenges table from markdown - copied from K12CardReportEditable
const RenderChallengesTable: React.FC<{ content: string }> = ({ content }) => {
  const challenges = React.useMemo(() => {
    // First try to parse as table format
    const tableMatch = content.match(/\|[\s\S]+?\|/g);
    if (tableMatch) {
      const lines = content.split('\n').filter(line => 
        line.includes('|') && !line.includes('---')
      );
      
      const parsedChallenges = [];
      for (let i = 1; i < lines.length; i++) { // Skip header
        const parts = lines[i].split('|').filter(p => p.trim());
        if (parts.length >= 3) {
          parsedChallenges.push({
            challenge: parts[0].replace(/\*\*/g, '').trim(),
            whatYouSee: parts[1].trim(),
            whatToDo: parts[2].split('•').filter(s => s.trim()).map(s => s.trim())
          });
        }
      }
      if (parsedChallenges.length > 0) return parsedChallenges;
    }
    
    // If no table format, try to parse structured text format
    const sections = content.split(/(?=^[A-Z][^\n]*$)/m).filter(s => s.trim());
    const parsedChallenges = [];
    
    for (const section of sections) {
      const lines = section.trim().split('\n');
      if (lines.length < 3) continue;
      
      const challengeTitle = lines[0].trim().replace(/^#+\s*/, '').replace(/\*\*/g, '');
      if (!challengeTitle) continue;
      
      let whatYouSee = '';
      let whatToDo = [];
      let currentSection = '';
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.toLowerCase().includes('what you see')) {
          currentSection = 'see';
          continue;
        }
        if (line.toLowerCase().includes('what to do')) {
          currentSection = 'do';
          continue;
        }
        
        if (currentSection === 'see' && line) {
          whatYouSee = line;
        }
        if (currentSection === 'do' && line) {
          if (line.startsWith('•') || line.startsWith('-') || line.startsWith('*')) {
            whatToDo.push(line.replace(/^[•\-*]\s*/, ''));
          } else if (line.startsWith('✓') || line.startsWith('✗')) {
            whatToDo.push(line);
          } else if (line && !line.toLowerCase().includes('what')) {
            whatToDo.push(line);
          }
        }
      }
      
      if (challengeTitle && (whatYouSee || whatToDo.length > 0)) {
        parsedChallenges.push({
          challenge: challengeTitle,
          whatYouSee: whatYouSee,
          whatToDo: whatToDo
        });
      }
    }
    
    return parsedChallenges;
  }, [content]);

  if (challenges.length === 0) {
    return (
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {content}
      </ReactMarkdown>
    );
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
              <div className="font-medium text-gray-700 mb-2">What You See:</div>
              <div className="text-gray-600 leading-relaxed">{challenge.whatYouSee}</div>
            </div>
            
            <div>
              <div className="font-medium text-gray-700 mb-2">What To Do:</div>
              <div className="space-y-2">
                {challenge.whatToDo.map((item, i) => (
                  <div key={i} className="flex items-start gap-3 text-gray-600">
                    {item.startsWith('✓') ? (
                      <>
                        <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="leading-relaxed">{item.replace('✓', '').trim()}</span>
                      </>
                    ) : item.startsWith('✗') || item.startsWith('✘') ? (
                      <>
                        <XCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                        <span className="leading-relaxed">{item.replace(/[✗✘]/, '').trim()}</span>
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