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
      console.log('🖨️ PRINT REPORT: Parsing markdown, length:', markdownReport?.length || 0);
      console.log('🖨️ PRINT REPORT: First 500 chars of markdown:', markdownReport?.slice(0, 500));
      const parsed = parsePostSecondaryReportSections(markdownReport || '');
      console.log('🖨️ PRINT REPORT: Parsed sections:', parsed.map(s => s.title));
      return parsed;
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
      console.log('🖨️ PRINT REPORT: Functional impact section found:', !!functionalImpactSection);
      if (!functionalImpactSection) {
        console.log('🖨️ PRINT REPORT: No functional impact section!');
        return [];
      }
      console.log('🖨️ PRINT REPORT: Functional impact content length:', functionalImpactSection.content?.length || 0);
      const parsed = parseFunctionalImpactBarriers(functionalImpactSection.content);
      console.log('🖨️ PRINT REPORT: Parsed functional impacts:', parsed.length);
      return parsed;
    }, [functionalImpactSection]);

    // Parse accommodation subsections
    const accommodationSection = getSectionForView("accommodations");
    const accommodationSubsections = React.useMemo(() => {
      console.log('🖨️ PRINT REPORT: Accommodation section found:', !!accommodationSection);
      if (!accommodationSection) {
        console.log('🖨️ PRINT REPORT: No accommodation section!');
        return [];
      }
      console.log('🖨️ PRINT REPORT: Accommodation content length:', accommodationSection.content?.length || 0);
      const parsed = parseAccommodationSubsections(accommodationSection.content);
      console.log('🖨️ PRINT REPORT: Parsed accommodation subsections:', parsed.length);
      return parsed;
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

    // Group functional impacts into 2 cards maximum
    const groupedFunctionalImpacts = React.useMemo(() => {
      if (functionalImpacts.length === 0) return [];
      const halfPoint = Math.ceil(functionalImpacts.length / 2);
      return [
        functionalImpacts.slice(0, halfPoint),
        functionalImpacts.slice(halfPoint)
      ].filter(group => group.length > 0);
    }, [functionalImpacts]);

    return (
      <div ref={ref} className="print-report bg-white" style={{ fontFamily: 'Arial, sans-serif', fontSize: '10pt' }}>
        {/* Print-only header */}
        <div className="print-header flex items-center justify-between p-3 border-b" style={{ borderColor: '#1297D2' }}>
          <div className="flex items-center gap-2">
            <img src={ThriveLogo} alt="THRIVE Logo" className="h-8 w-8" />
            <h1 className="text-lg font-bold" style={{ color: '#1297D2' }}>
              Accommodation Report
            </h1>
          </div>
          <div className="text-xs text-gray-600">
            {currentCase?.display_name || 'Bish3'}
          </div>
        </div>

        <div className="p-3 space-y-2">
          {/* Row 1: Student Information and Documents Reviewed (Blue) */}
          <div className="grid grid-cols-2 gap-2">
            {/* Student Information Card */}
            <Card className="p-2" style={{ backgroundColor: 'rgba(150, 215, 225, 0.1)', borderColor: '#96D7E1', borderWidth: '1px' }}>
              <h2 className="text-xs font-bold mb-1" style={{ color: '#1297D2' }}>
                Student Information
              </h2>
              <div className="space-y-0.5 text-xs">
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
                  <span className="ml-1 px-1 py-0.5 rounded text-xs" style={{ backgroundColor: 'rgba(253, 230, 119, 0.5)', color: '#92400E' }}>
                    {studentInfo.status || (currentCase?.status === 'completed' ? 'Completed' : 'In Progress')}
                  </span>
                </div>
              </div>
            </Card>

            {/* Documents Reviewed Card */}
            <Card className="p-2" style={{ backgroundColor: 'rgba(150, 215, 225, 0.1)', borderColor: '#96D7E1', borderWidth: '1px' }}>
              <h2 className="text-xs font-bold mb-1" style={{ color: '#1297D2' }}>
                Documents Reviewed
              </h2>
              {documentsReviewed.length > 0 ? (
                <div className="text-xs">
                  {documentsReviewed.map((doc: string, idx: number) => (
                    <div key={idx} className="mb-0.5">• {doc}</div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-600">No documents available</p>
              )}
            </Card>
          </div>

          {/* Row 2: Functional Impact Summary (Orange) - Maximum 2 cards */}
          <div>
            <h2 className="text-sm font-bold mb-1" style={{ color: '#F89E54' }}>
              Functional Impact Summary
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {groupedFunctionalImpacts.map((group, groupIdx) => (
                <Card
                  key={groupIdx}
                  className="p-2"
                  style={{
                    backgroundColor: 'rgba(248, 158, 84, 0.1)',
                    borderColor: '#F89E54',
                    borderWidth: '1px'
                  }}
                >
                  <div className="space-y-1">
                    {group.map((barrier, idx) => (
                      <div key={idx}>
                        <div className="flex items-start gap-1">
                          <div 
                            className="flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-white"
                            style={{ backgroundColor: '#F89E54', fontSize: '9px', fontWeight: 'bold' }}
                          >
                            {barrier.number}
                          </div>
                          <p className="text-xs text-gray-700">
                            {barrier.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Rows 3-4: Accommodation & Support Plan - 4 cards */}
          <div>
            <h2 className="text-sm font-bold mb-1" style={{ color: '#1297D2' }}>
              Accommodation &amp; Support Plan
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {accommodationSubsections.slice(0, 4).map((subsection, idx) => {
                const accommodations = parseAccommodations(subsection.content);
                
                return (
                  <Card
                    key={idx}
                    className="p-2"
                    style={{
                      backgroundColor: 'rgba(150, 215, 225, 0.1)',
                      borderColor: '#96D7E1',
                      borderWidth: '1px'
                    }}
                  >
                    <h3 className="font-bold text-xs mb-1" style={{ color: '#1297D2' }}>
                      {subsection.id} {subsection.title}
                    </h3>
                    {accommodations.length > 0 ? (
                      <div className="space-y-1">
                        {accommodations.map((acc, accIdx) => (
                          <div key={accIdx} className="text-xs">
                            <div className="flex items-start gap-1">
                              <span
                                className="inline-flex items-center justify-center px-1.5 py-0.5 rounded font-semibold flex-shrink-0"
                                style={{
                                  backgroundColor: 'rgba(253, 230, 119, 0.5)',
                                  color: '#92400E',
                                  fontSize: '10px',
                                  minWidth: '20px'
                                }}
                              >
                                {accIdx + 1}
                              </span>
                              <span className="flex-1">{acc.title}</span>
                            </div>
                            {acc.barrier && (
                              <div className="text-gray-600 ml-6 italic" style={{ fontSize: '9px' }}>
                                {stripMarkdownFormatting(acc.barrier)}
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
          <div className="text-center text-xs text-gray-500 mt-2 pt-1 border-t">
            Generated by THRIVE Assessment System • {new Date().toLocaleDateString()}
          </div>
        </div>

        {/* Print-specific styles */}
        <style>{`
          @media print {
            .print-report {
              margin: 0;
              padding: 0;
              font-size: 9pt !important;
            }
            
            /* Hide navigation and non-print elements */
            header, nav, aside, .no-print {
              display: none !important;
            }
            
            /* Page setup */
            @page {
              size: letter;
              margin: 0.4in;
            }
            
            /* Prevent page breaks inside cards */
            .grid > * {
              page-break-inside: avoid;
              break-inside: avoid;
            }
            
            /* Reduce spacing for print */
            .space-y-2 > * + * {
              margin-top: 0.25rem !important;
            }
            
            .space-y-1 > * + * {
              margin-top: 0.125rem !important;
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