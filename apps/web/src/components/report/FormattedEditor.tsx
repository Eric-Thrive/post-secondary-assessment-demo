import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Bold, Italic, List, ListOrdered, Plus, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

interface FormattedEditorProps {
  content: string;
  onChange: (value: string) => void;
  className?: string;
  sectionType?: 'challenges' | 'other';
}

export const FormattedEditor: React.FC<FormattedEditorProps> = ({ 
  content, 
  onChange, 
  className = '',
  sectionType = 'other'
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isTableContent, setIsTableContent] = useState(false);

  // Parse table content into structured data
  const parseTableContent = (text: string) => {
    const lines = text.split('\n');
    const rows: string[][] = [];
    
    lines.forEach(line => {
      if (line.includes('|') && !line.match(/^\s*\|?\s*[-:]+\s*\|/)) {
        // Split by | and remove first and last empty elements
        let cells = line.split('|');
        
        // Remove empty first/last elements from leading/trailing |
        if (cells[0] === '') cells = cells.slice(1);
        if (cells[cells.length - 1] === '') cells = cells.slice(0, -1);
        
        cells = cells.map(cell => cell.trim());
        
        if (cells.length > 0) {
          rows.push(cells);
        }
      }
    });
    
    return rows;
  };

  // Convert structured table back to markdown
  const tableToMarkdown = (rows: string[][]) => {
    if (rows.length === 0) return '';
    
    let markdown = '';
    rows.forEach((row, idx) => {
      markdown += '| ' + row.join(' | ') + ' |\n';
      if (idx === 0) {
        markdown += '|' + row.map(() => '---').join('|') + '|\n';
      }
    });
    
    return markdown;
  };

  useEffect(() => {
    // Check if content contains a table (has pipes and separator row) or if it's a challenges section
    const hasTable = content.includes('|') && content.includes('---');
    const isChallengesSection = sectionType === 'challenges' || content.toLowerCase().includes('challenge');
    setIsTableContent(hasTable || isChallengesSection);
    
    if (editorRef.current && !hasTable && !isChallengesSection) {
      // For non-table content, render formatted text
      const cleanContent = content
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/^### (.*)/gm, '<h3 style="font-size: 1.1em; font-weight: 600; margin: 8px 0;">$1</h3>')
        .replace(/^## (.*)/gm, '<h2 style="font-size: 1.2em; font-weight: 600; margin: 10px 0;">$1</h2>')
        .replace(/^# (.*)/gm, '<h1 style="font-size: 1.4em; font-weight: 700; margin: 12px 0;">$1</h1>')
        .replace(/^- (.*)/gm, '<li>$1</li>')
        .replace(/(<li>.*<\/li>\n?)+/g, '<ul style="margin-left: 20px; list-style-type: disc;">$&</ul>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>');
      
      editorRef.current.innerHTML = `<p>${cleanContent}</p>`;
    }
  }, [content, sectionType]);

  const handleInput = () => {
    if (!editorRef.current) return;
    
    if (isTableContent) {
      // For table content, get from table editor
      return;
    }
    
    // Convert formatted HTML back to markdown
    let markdown = editorRef.current.innerHTML
      .replace(/<strong>(.*?)<\/strong>/g, '**$1**')
      .replace(/<em>(.*?)<\/em>/g, '*$1*')
      .replace(/<h1[^>]*>(.*?)<\/h1>/g, '# $1\n')
      .replace(/<h2[^>]*>(.*?)<\/h2>/g, '## $1\n')
      .replace(/<h3[^>]*>(.*?)<\/h3>/g, '### $1\n')
      .replace(/<ul[^>]*>(.*?)<\/ul>/g, '$1')
      .replace(/<li>(.*?)<\/li>/g, '- $1\n')
      .replace(/<br\s*\/?>/g, '\n')
      .replace(/<\/p><p>/g, '\n\n')
      .replace(/<p>|<\/p>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&');
    
    onChange(markdown);
  };

  const applyFormat = (format: string) => {
    if (!editorRef.current) return;
    
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    
    const range = selection.getRangeAt(0);
    const selectedText = range.toString();
    
    if (selectedText) {
      let formattedText = '';
      
      switch(format) {
        case 'bold':
          formattedText = `**${selectedText}**`;
          break;
        case 'italic':
          formattedText = `*${selectedText}*`;
          break;
        case 'list':
          formattedText = `\n- ${selectedText}`;
          break;
        case 'ordered':
          formattedText = `\n1. ${selectedText}`;
          break;
      }
      
      document.execCommand('insertText', false, formattedText);
      handleInput();
    }
  };

  if (isTableContent) {
    const tableRows = parseTableContent(content);
    
    // Check if this is a challenges table - use prop first, then content detection
    const isChallengesTable = sectionType === 'challenges' || (
      tableRows.length > 0 && (
        // Check for table headers
        (tableRows[0]?.some(cell => 
          cell?.toLowerCase().includes('challenge') ||
          cell?.toLowerCase().includes('what you see') ||
          cell?.toLowerCase().includes('what to do') ||
          cell?.toLowerCase().includes('area of need') ||
          cell?.toLowerCase().includes('barrier')
        )) ||
        // Check content for challenge-related keywords
        content.toLowerCase().includes('challenge') ||
        content.toLowerCase().includes('what you see') ||
        content.toLowerCase().includes('what to do') ||
        content.toLowerCase().includes('areas of need') ||
        // Check if it's in the context of challenges section
        (tableRows.length >= 2 && tableRows[0]?.length >= 3)
      )
    );
    
    if (isChallengesTable) {
      // Parse challenges from either table format or structured text
      let challenges = [];
      
      if (tableRows.length >= 2) {
        // Parse from table format
        challenges = tableRows.slice(1).map(row => ({
          challenge: row[0]?.replace(/\*\*/g, '') || '',
          whatYouSee: row[1] || '',
          whatToDo: (row[2] || '').split('•').filter(s => s.trim()).map(s => s.trim())
        }));
      } else {
        // Parse from structured text format (same logic as RenderChallengesTable)
        const sections = content.split(/(?=^[A-Z][^\n]*$)/m).filter(s => s.trim());
        
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
            challenges.push({
              challenge: challengeTitle,
              whatYouSee: whatYouSee,
              whatToDo: whatToDo
            });
          }
        }
        
        // If no structured format, create a default challenge
        if (challenges.length === 0) {
          challenges = [{
            challenge: 'New Challenge',
            whatYouSee: '',
            whatToDo: []
          }];
        }
      }
      
      return (
        <div className={`${className}`}>
          <div className="space-y-6">
            {challenges.map((challenge, idx) => (
              <div key={idx} className="space-y-3">
                <div className="space-y-4 border rounded-lg p-4 bg-blue-50">
                  <div>
                    <label className="font-medium text-gray-700 mb-1 block">Challenge Title:</label>
                    <Textarea
                      value={challenge.challenge}
                      onChange={(e) => {
                        const newChallenges = [...challenges];
                        newChallenges[idx].challenge = e.target.value;
                        
                        if (tableRows.length >= 2) {
                          // Update table format
                          const newTableRows = [...tableRows];
                          if (newTableRows[idx + 1]) {
                            newTableRows[idx + 1][0] = `**${e.target.value}**`;
                            onChange(tableToMarkdown(newTableRows));
                          }
                        } else {
                          // Update text format
                          const textFormat = newChallenges.map(ch => 
                            `**${ch.challenge}**\n\nWhat You See:\n${ch.whatYouSee}\n\nWhat To Do:\n${ch.whatToDo.map(item => `• ${item}`).join('\n')}`
                          ).join('\n\n---\n\n');
                          onChange(textFormat);
                        }
                      }}
                      className="w-full"
                      rows={2}
                    />
                  </div>
                  
                  <div>
                    <label className="font-medium text-gray-700 mb-1 block">What You See:</label>
                    <Textarea
                      value={challenge.whatYouSee}
                      onChange={(e) => {
                        const newChallenges = [...challenges];
                        newChallenges[idx].whatYouSee = e.target.value;
                        
                        if (tableRows.length >= 2) {
                          // Update table format
                          const newTableRows = [...tableRows];
                          if (newTableRows[idx + 1]) {
                            newTableRows[idx + 1][1] = e.target.value;
                            onChange(tableToMarkdown(newTableRows));
                          }
                        } else {
                          // Update text format
                          const textFormat = newChallenges.map(ch => 
                            `**${ch.challenge}**\n\nWhat You See:\n${ch.whatYouSee}\n\nWhat To Do:\n${ch.whatToDo.map(item => `• ${item}`).join('\n')}`
                          ).join('\n\n---\n\n');
                          onChange(textFormat);
                        }
                      }}
                      className="w-full"
                      rows={2}
                    />
                  </div>
                  
                  <div>
                    <label className="font-medium text-gray-700 mb-1 block">What To Do (one per line, use ✓ or ✗ for do/don't):</label>
                    <Textarea
                      value={challenge.whatToDo.join('\n')}
                      onChange={(e) => {
                        const items = e.target.value.split('\n').filter(line => line.trim());
                        const newChallenges = [...challenges];
                        newChallenges[idx].whatToDo = items;
                        
                        if (tableRows.length >= 2) {
                          // Update table format
                          const newTableRows = [...tableRows];
                          if (newTableRows[idx + 1]) {
                            newTableRows[idx + 1][2] = items.map(item => {
                              if (item.startsWith('✓') || item.startsWith('✗')) {
                                return item;
                              }
                              return `• ${item}`;
                            }).join(' ');
                            onChange(tableToMarkdown(newTableRows));
                          }
                        } else {
                          // Update text format
                          const textFormat = newChallenges.map(ch => 
                            `**${ch.challenge}**\n\nWhat You See:\n${ch.whatYouSee}\n\nWhat To Do:\n${ch.whatToDo.map(item => `• ${item}`).join('\n')}`
                          ).join('\n\n---\n\n');
                          onChange(textFormat);
                        }
                      }}
                      className="w-full"
                      rows={4}
                      placeholder="✓ Give extra time, use repeated reading&#10;✗ Don't rush or call on her unexpectedly"
                    />
                  </div>
                  
                  <div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const newChallenges = challenges.filter((_, cIdx) => cIdx !== idx);
                        
                        if (tableRows.length >= 2) {
                          // Update table format
                          const newTableRows = tableRows.filter((_, rowIdx) => rowIdx !== idx + 1);
                          onChange(tableToMarkdown(newTableRows));
                        } else {
                          // Update text format
                          const textFormat = newChallenges.map(ch => 
                            `**${ch.challenge}**\n\nWhat You See:\n${ch.whatYouSee}\n\nWhat To Do:\n${ch.whatToDo.map(item => `• ${item}`).join('\n')}`
                          ).join('\n\n---\n\n');
                          onChange(textFormat);
                        }
                      }}
                      className="text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Remove Challenge
                    </Button>
                  </div>
                </div>
                
                {/* Preview of formatted challenge */}
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                    {challenge.challenge || 'Challenge Title'}
                  </h3>
                  
                  <div>
                    <div className="font-medium text-gray-700 mb-2">What You See:</div>
                    <div className="text-gray-600 leading-relaxed">{challenge.whatYouSee || 'Description of what you observe...'}</div>
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
            
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const newChallenge = {
                    challenge: 'New Challenge',
                    whatYouSee: 'What you observe...',
                    whatToDo: ['Strategy 1', 'Strategy 2']
                  };
                  
                  if (tableRows.length >= 2) {
                    // Update table format
                    const newRow = ['**New Challenge**', 'What you observe...', '• Strategy 1 • Strategy 2'];
                    const newTableRows = [...tableRows, newRow];
                    onChange(tableToMarkdown(newTableRows));
                  } else {
                    // Update text format
                    const newChallenges = [...challenges, newChallenge];
                    const textFormat = newChallenges.map(ch => 
                      `**${ch.challenge}**\n\nWhat You See:\n${ch.whatYouSee}\n\nWhat To Do:\n${ch.whatToDo.map(item => `• ${item}`).join('\n')}`
                    ).join('\n\n---\n\n');
                    onChange(textFormat);
                  }
                }}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Challenge
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsTableContent(false)}
              >
                Switch to Text
              </Button>
            </div>
          </div>
        </div>
      );
    }
    
    // Default table editor for non-challenges tables
    return (
      <div className={`border rounded-lg ${className}`}>
        <div className="bg-gray-50 p-2 border-b">
          <span className="text-sm font-medium text-gray-600">Table Editor</span>
        </div>
        <div className="p-4">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <tbody>
                {tableRows.map((row, rowIdx) => (
                  <tr key={rowIdx} className={rowIdx === 0 ? 'bg-blue-50' : 'hover:bg-gray-50'}>
                    {row.map((cell, cellIdx) => (
                      <td key={cellIdx} className="border border-gray-300 p-1">
                        <Textarea
                          value={cell}
                          onChange={(e) => {
                            const newRows = [...tableRows];
                            newRows[rowIdx][cellIdx] = e.target.value;
                            onChange(tableToMarkdown(newRows));
                          }}
                          className={`w-full border-0 resize-none rounded-none focus:ring-0 min-h-[60px] p-2 ${
                            rowIdx === 0 ? 'font-semibold bg-blue-50' : 'bg-white'
                          }`}
                          rows={Math.max(2, Math.ceil(cell.length / 40))}
                          placeholder={rowIdx === 0 ? ['Strength', 'What You See', 'What to Do'][cellIdx] || `Header ${cellIdx + 1}` : 'Enter content...'}
                        />
                      </td>
                    ))}
                    <td className="border-0 p-1">
                      {rowIdx > 0 && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            const newRows = tableRows.filter((_, idx) => idx !== rowIdx);
                            onChange(tableToMarkdown(newRows));
                          }}
                          className="p-1 h-6 w-6 hover:bg-red-100"
                        >
                          <Trash2 className="h-3 w-3 text-red-500" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const newRows = [...tableRows, new Array(tableRows[0]?.length || 3).fill('')];
                onChange(tableToMarkdown(newRows));
              }}
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Row
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                // Switch to text mode
                setIsTableContent(false);
              }}
            >
              Switch to Text
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`border rounded-lg ${className}`}>
      <div className="border-b p-2 flex gap-1 bg-gray-50">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => applyFormat('bold')}
          className="p-1 h-7 w-7"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => applyFormat('italic')}
          className="p-1 h-7 w-7"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => applyFormat('list')}
          className="p-1 h-7 w-7"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => applyFormat('ordered')}
          className="p-1 h-7 w-7"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        className="p-4 min-h-[200px] focus:outline-none prose prose-sm max-w-none"
        style={{
          lineHeight: '1.6',
          color: '#374151'
        }}
      />
    </div>
  );
};