import React from 'react';
import { Card } from "@/components/ui/card";
import { 
  parsePostSecondaryReportSections,
  parseAccommodationSubsections,
  parseFunctionalImpactBarriers,
  parseAccommodations,
  stripMarkdownFormatting
} from '@/utils/postSecondaryReportParser';
import { AssessmentCase } from '@/types/assessmentCase';
import ThriveLogo from '@assets/isotype Y-NB_1754494460165.png';

interface PostSecondaryPrintReportProps {
  currentCase: AssessmentCase | null;
  markdownReport: string | null;
}

const PostSecondaryPrintReport = React.forwardRef<HTMLDivElement, PostSecondaryPrintReportProps>(
  ({ currentCase, markdownReport }, ref) => {
    
    // Parse markdown into structured sections
    const sections = React.useMemo(() => {
      return parsePostSecondaryReportSections(markdownReport || '');
    }, [markdownReport]);

    // Get section content by view name
    const getSectionForView = (view: string) => {
      let section = null;
      switch (view) {
        case "student-information":
          section = sections.find(s => s.title.toLowerCase().includes("student") || s.index === 1);
          break;
        case "document-review":
          section = sections.find(s => s.title.toLowerCase().includes("document") || s.title.toLowerCase().includes("student") || s.index === 1);
          break;
        case "functional-impact":
          section = sections.find(s => 
            (s.title.toLowerCase().includes("functional") && s.title.toLowerCase().includes("impact")) ||
            s.title.toLowerCase().includes("functional impact") ||
            s.title.toLowerCase().includes("barrier")
          ) || sections.find(s => s.index === 2);
          break;
        case "accommodations":
          section = sections.find(s => 
            s.title.toLowerCase().includes("accommodation") ||
            (s.title.toLowerCase().includes("support") && s.title.toLowerCase().includes("plan"))
          ) || sections.find(s => s.index === 3);
          break;
        default:
          section = null;
      }
      return section;
    };

    // Parse functional impact barriers
    const functionalImpactSection = getSectionForView("functional-impact");
    const functionalImpacts = React.useMemo(() => {
      if (!functionalImpactSection) return [];
      return parseFunctionalImpactBarriers(functionalImpactSection.content);
    }, [functionalImpactSection]);

    // Parse accommodation subsections
    const accommodationSection = getSectionForView("accommodations");
    const accommodationSubsections = React.useMemo(() => {
      if (!accommodationSection) return [];
      return parseAccommodationSubsections(accommodationSection.content);
    }, [accommodationSection]);

    // Get student information section
    const studentInfoSection = getSectionForView("student-information");
    
    // Parse student info and document review from the same section
    const parseStudentInfo = (content: string) => {
      const lines = content.split('\n');
      const info: Record<string, string> = {};
      
      for (const line of lines) {
        if (line.includes('**Unique ID:**')) {
          info.uniqueId = line.replace(/\*\*Unique ID:\*\*/, '').trim();
        } else if (line.includes('**Program/Major:**')) {
          info.programMajor = line.replace(/\*\*Program\/Major:\*\*/, '').trim();
        } else if (line.includes('**Report Author:**')) {
          info.reportAuthor = line.replace(/\*\*Report Author:\*\*/, '').trim();
        } else if (line.includes('**Date Issued:**')) {
          info.dateIssued = line.replace(/\*\*Date Issued:\*\*/, '').trim();
        } else if (line.includes('**Status:**')) {
          info.status = line.replace(/\*\*Status:\*\*/, '').trim();
        }
      }
      return info;
    };

    const parseDocumentsReviewed = (content: string) => {
      const lines = content.split('\n');
      const documents: string[] = [];
      let inDocumentSection = false;
      
      for (const line of lines) {
        if (line.toLowerCase().includes('documents reviewed') || line.toLowerCase().includes('### documents reviewed')) {
          inDocumentSection = true;
          continue;
        }
        if (inDocumentSection && line.trim().startsWith('-')) {
          documents.push(line.replace(/^-\s*/, '').trim());
        }
        if (inDocumentSection && line.trim().startsWith('**') && !line.includes('document')) {
          break;
        }
      }
      
      if (documents.length === 0 && currentCase?.documents) {
        return Array.isArray(currentCase.documents) 
          ? currentCase.documents.map(d => d.name || 'Document') 
          : [];
      }
      
      return documents;
    };

    const studentInfo = studentInfoSection ? parseStudentInfo(studentInfoSection.content) : {};
    const documentsReviewed = studentInfoSection ? parseDocumentsReviewed(studentInfoSection.content) : [];

    // Determine functional impacts layout - Option A: If only 1, use single column centered
    const functionalImpactsCount = functionalImpacts.length;
    const useSingleColumn = functionalImpactsCount === 1;

    return (
      <div ref={ref} className="print-report bg-white" style={{ fontFamily: 'Montserrat, -apple-system, BlinkMacSystemFont, sans-serif' }}>
        {/* Print-only header */}
        <div className="print-header flex items-center justify-between p-6 border-b-2" style={{ borderColor: '#1297D2' }}>
          <div className="flex items-center gap-3">
            <img src={ThriveLogo} alt="THRIVE Logo" className="h-12 w-12" />
            <h1 className="text-2xl font-bold" style={{ color: '#1297D2', fontFamily: 'Avenir, "Avenir Next", -apple-system, BlinkMacSystemFont, sans-serif' }}>
              Accommodation Report
            </h1>
          </div>
          <div className="text-sm text-gray-600">
            {currentCase?.display_name || 'Bish3'}
          </div>
        </div>

        <div className="p-6 space-y-4">
          {/* Row 1: Student Information and Documents Reviewed (Blue) */}
          <div className="grid grid-cols-2 gap-4">
            {/* Student Information Card */}
            <Card className="p-4" style={{ backgroundColor: '#E6F7FA', borderColor: '#1297D2', borderWidth: '2px' }}>
              <h2 className="text-lg font-bold mb-3" style={{ color: '#1297D2', fontFamily: 'Avenir, "Avenir Next", -apple-system, BlinkMacSystemFont, sans-serif' }}>
                Student Information
              </h2>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-semibold">Unique ID:</span> {studentInfo.uniqueId || currentCase?.unique_id || 'Bish3'}
                </div>
                <div>
                  <span className="font-semibold">Program/Major:</span> {studentInfo.programMajor || currentCase?.program_major || 'Post-Secondary Program'}
                </div>
                <div>
                  <span className="font-semibold">Report Author:</span> {studentInfo.reportAuthor || currentCase?.report_author || 'Eric'}
                </div>
                <div>
                  <span className="font-semibold">Date Issued:</span> {studentInfo.dateIssued || (currentCase?.date_issued ? new Date(currentCase.date_issued).toLocaleDateString() : 'Oct 21, 2025')}
                </div>
                <div>
                  <span className="font-semibold">Status:</span> 
                  <span className="ml-2 px-2 py-1 rounded text-xs font-medium" style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}>
                    {studentInfo.status || (currentCase?.status === 'completed' ? 'Completed' : 'In Progress')}
                  </span>
                </div>
              </div>
            </Card>

            {/* Documents Reviewed Card */}
            <Card className="p-4" style={{ backgroundColor: '#E6F7FA', borderColor: '#1297D2', borderWidth: '2px' }}>
              <h2 className="text-lg font-bold mb-3" style={{ color: '#1297D2', fontFamily: 'Avenir, "Avenir Next", -apple-system, BlinkMacSystemFont, sans-serif' }}>
                Documents Reviewed
              </h2>
              {documentsReviewed.length > 0 ? (
                <div className="text-sm">
                  {documentsReviewed.map((doc: string, idx: number) => (
                    <div key={idx} className="mb-1">• {doc}</div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-600">No documents available</p>
              )}
            </Card>
          </div>

          {/* Row 2: Functional Impact Summary (Orange) - Dynamic grid */}
          <div>
            <h2 className="text-xl font-bold mb-3" style={{ color: '#F89E54', fontFamily: 'Avenir, "Avenir Next", -apple-system, BlinkMacSystemFont, sans-serif' }}>
              Functional Impact Summary
            </h2>
            <div className={useSingleColumn ? "flex justify-center" : "grid grid-cols-2 gap-4"}>
              {functionalImpacts.map((barrier, idx) => (
                <Card 
                  key={idx} 
                  className="p-4" 
                  style={{ 
                    backgroundColor: '#FEF3E8', 
                    borderColor: '#F89E54', 
                    borderWidth: '2px',
                    maxWidth: useSingleColumn ? '50%' : '100%'
                  }}
                >
                  <div className="flex items-start gap-2 mb-2">
                    <div 
                      className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                      style={{ backgroundColor: '#F89E54' }}
                    >
                      {barrier.number}
                    </div>
                    <h3 className="font-bold text-sm" style={{ color: '#1297D2' }}>
                      {barrier.title}
                    </h3>
                  </div>
                  <p className="text-xs text-gray-700 leading-relaxed">
                    {barrier.description}
                  </p>
                  {barrier.evidence && (
                    <p className="text-xs text-gray-500 mt-2 italic">
                      {barrier.evidence}
                    </p>
                  )}
                </Card>
              ))}
            </div>
          </div>

          {/* Rows 3-4: Accommodation & Support Plan - 4 cards */}
          <div>
            <h2 className="text-xl font-bold mb-3" style={{ color: '#1297D2', fontFamily: 'Avenir, "Avenir Next", -apple-system, BlinkMacSystemFont, sans-serif' }}>
              Accommodation &amp; Support Plan
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {accommodationSubsections.slice(0, 4).map((subsection, idx) => {
                const accommodations = parseAccommodations(subsection.content);
                
                return (
                  <Card 
                    key={idx} 
                    className="p-4" 
                    style={{ 
                      backgroundColor: '#E6F7FA', 
                      borderColor: '#1297D2', 
                      borderWidth: '2px' 
                    }}
                  >
                    <h3 className="font-bold text-sm mb-2" style={{ color: '#1297D2' }}>
                      {subsection.id} {subsection.title}
                    </h3>
                    {accommodations.length > 0 ? (
                      <div className="space-y-2">
                        {accommodations.map((acc, accIdx) => (
                          <div key={accIdx} className="text-xs">
                            <div className="font-semibold">{acc.number}. {acc.title}</div>
                            {acc.barrier && (
                              <div className="text-gray-600 ml-3">
                                <span className="font-medium">Barrier:</span> {stripMarkdownFormatting(acc.barrier)}
                              </div>
                            )}
                            {acc.implementation && (
                              <div className="text-gray-600 ml-3">
                                <span className="font-medium">Implementation:</span> {stripMarkdownFormatting(acc.implementation)}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-600">{subsection.content || 'No accommodations specified'}</p>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-xs text-gray-500 mt-6 pt-4 border-t">
            Generated by THRIVE Assessment System • {new Date().toLocaleDateString()}
          </div>
        </div>

        {/* Print-specific styles */}
        <style>{`
          @media print {
            .print-report {
              margin: 0;
              padding: 0;
            }
            
            /* Hide navigation and non-print elements */
            header, nav, aside, .no-print {
              display: none !important;
            }
            
            /* Page setup */
            @page {
              size: letter;
              margin: 0.5in;
            }
            
            /* Prevent page breaks inside cards */
            .grid > * {
              page-break-inside: avoid;
              break-inside: avoid;
            }
            
            /* Ensure colors print */
            * {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
              color-adjust: exact;
            }
          }
          
          @media screen {
            .print-report {
              max-width: 8.5in;
              margin: 0 auto;
            }
          }
        `}</style>
      </div>
    );
  }
);

PostSecondaryPrintReport.displayName = 'PostSecondaryPrintReport';

export default PostSecondaryPrintReport;
