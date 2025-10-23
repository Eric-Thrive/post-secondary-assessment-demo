import React, { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { FileText } from 'lucide-react';
import { AssessmentCase } from '@/types/assessmentCase';
import {
  parsePostSecondaryReportSections,
  parseAccommodationSubsections,
  parseFunctionalImpactBarriers,
  parseAccommodations,
  stripMarkdownFormatting
} from '@/utils/postSecondaryReportParser';
import { DocumentFile } from '@/types/assessment';

interface PostSecondaryOnePagePDFProps {
  currentCase: AssessmentCase | null;
  markdownReport: string | null;
}

// THRIVE Sunwashed Color Palette
const brandColors = {
  navyBlue: '#1297D2',
  skyBlue: '#96D7E1',
  orange: '#F89E54',
  yellow: '#FDE677',
};

export const PostSecondaryOnePagePDF: React.FC<PostSecondaryOnePagePDFProps> = ({
  currentCase,
  markdownReport
}) => {
  const componentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `${currentCase?.display_name?.replace(/\s+/g, '-') || 'Report'}-${new Date().toISOString().split('T')[0]}`,
    pageStyle: `
      @page {
        size: letter;
        margin: 0.4in;
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
    `
  });

  // Parse the report sections
  const sections = parsePostSecondaryReportSections(markdownReport || '');

  // Get functional impact barriers
  const functionalImpactSection = sections.find(s =>
    s.title.toLowerCase().includes('functional') && s.title.toLowerCase().includes('impact')
  );
  const barriers = functionalImpactSection
    ? parseFunctionalImpactBarriers(functionalImpactSection.content)
    : [];

  // Get accommodation subsections
  const accommodationSection = sections.find(s =>
    s.title.toLowerCase().includes('accommodation')
  );
  const accommodationSubsections = accommodationSection
    ? parseAccommodationSubsections(accommodationSection.content)
    : [];

  // Get documents
  const documents = currentCase?.documents ||
    (currentCase as any)?.documentNames?.map((filename: string, index: number) => ({
      id: `doc_${index}`,
      name: filename,
    })) || [];

  // Reusable PDF content component
  const PDFContent = () => (
    <div
      style={{
        fontFamily: "'Montserrat', 'Avenir', -apple-system, BlinkMacSystemFont, sans-serif",
        fontSize: '8.5px',
        lineHeight: '1.3',
        color: '#1a1a1a'
      }}
    >
          {/* Header */}
          <div
            style={{
              background: `linear-gradient(to right, ${brandColors.navyBlue}, ${brandColors.skyBlue})`,
              color: 'white',
              padding: '12px 16px',
              marginBottom: '12px',
              borderRadius: '6px'
            }}
          >
            <h1 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>
              Accommodation Report
            </h1>
            <p style={{ margin: '2px 0 0 0', fontSize: '10px', opacity: 0.9 }}>
              {currentCase?.display_name || 'Student Report'}
            </p>
          </div>

          {/* Row 1: Student Info and Documents - Blue */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            {/* Student Information Card - Blue */}
            <div
              style={{
                border: `2px solid ${brandColors.skyBlue}`,
                borderRadius: '6px',
                padding: '10px',
                backgroundColor: 'rgba(150, 215, 225, 0.08)'
              }}
            >
              <h2
                style={{
                  fontSize: '11px',
                  fontWeight: 'bold',
                  color: brandColors.navyBlue,
                  margin: '0 0 8px 0',
                  borderBottom: `1px solid ${brandColors.skyBlue}`,
                  paddingBottom: '4px'
                }}
              >
                Student Information
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '4px 8px', fontSize: '8px' }}>
                <span style={{ fontWeight: '600' }}>Unique ID:</span>
                <span>{(currentCase as any)?.unique_id || currentCase?.display_name || 'N/A'}</span>

                <span style={{ fontWeight: '600' }}>Program/Major:</span>
                <span>{(currentCase as any)?.program_major || 'Post-Secondary Program'}</span>

                <span style={{ fontWeight: '600' }}>Report Author:</span>
                <span>{(currentCase as any)?.report_author || 'THRIVE Assessment System'}</span>

                <span style={{ fontWeight: '600' }}>Date Issued:</span>
                <span>
                  {currentCase?.analysis_result?.analysis_date
                    ? new Date(currentCase.analysis_result.analysis_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                    : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                  }
                </span>

                <span style={{ fontWeight: '600' }}>Status:</span>
                <span style={{
                  backgroundColor: brandColors.yellow,
                  padding: '2px 6px',
                  borderRadius: '3px',
                  fontWeight: '600'
                }}>
                  {currentCase?.status === 'completed' ? 'Completed' : 'Draft'}
                </span>
              </div>
            </div>

            {/* Documents Reviewed Card - Blue */}
            <div
              style={{
                border: `2px solid ${brandColors.skyBlue}`,
                borderRadius: '6px',
                padding: '10px',
                backgroundColor: 'rgba(150, 215, 225, 0.08)'
              }}
            >
              <h2
                style={{
                  fontSize: '11px',
                  fontWeight: 'bold',
                  color: brandColors.navyBlue,
                  margin: '0 0 6px 0',
                  borderBottom: `1px solid ${brandColors.skyBlue}`,
                  paddingBottom: '4px'
                }}
              >
                Documents Reviewed
              </h2>
              <div style={{ fontSize: '7.5px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                {documents.length > 0 ? (
                  documents.slice(0, 6).map((doc: DocumentFile | any, idx: number) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <div style={{
                        width: '3px',
                        height: '3px',
                        backgroundColor: brandColors.skyBlue,
                        borderRadius: '50%'
                      }} />
                      <span>{doc.name || doc.filename || `Document ${idx + 1}`}</span>
                    </div>
                  ))
                ) : (
                  <span style={{ fontStyle: 'italic', color: '#666' }}>No documents available</span>
                )}
                {documents.length > 6 && (
                  <span style={{ fontStyle: 'italic', color: '#666' }}>
                    + {documents.length - 6} more document{documents.length - 6 !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Row 2: Functional Impact Summary - Orange - Full Width */}
          <div style={{ marginBottom: '12px' }}>
            <div
              style={{
                border: `2px solid ${brandColors.orange}`,
                borderRadius: '6px',
                padding: '10px',
                backgroundColor: 'rgba(248, 158, 84, 0.08)'
              }}
            >
              <h2
                style={{
                  fontSize: '11px',
                  fontWeight: 'bold',
                  color: brandColors.navyBlue,
                  margin: '0 0 6px 0',
                  borderBottom: `1px solid ${brandColors.orange}`,
                  paddingBottom: '4px'
                }}
              >
                Functional Impact Summary
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {barriers.slice(0, 5).map((barrier, idx) => {
                  const icon = barrier.description.toLowerCase().includes('read') ? '📚' :
                              barrier.description.toLowerCase().includes('test') ? '⏱️' :
                              barrier.description.toLowerCase().includes('focus') ? '🧠' :
                              barrier.description.toLowerCase().includes('writ') ? '✍️' : '•';

                  return (
                    <div key={idx} style={{ fontSize: '7.5px' }}>
                      <div style={{ fontWeight: '600', color: brandColors.navyBlue, marginBottom: '2px' }}>
                        {icon} {stripMarkdownFormatting(barrier.description || barrier.title)}
                      </div>
                      {barrier.evidence && (
                        <div style={{
                          fontSize: '7px',
                          color: '#555',
                          fontStyle: 'italic',
                          paddingLeft: '12px',
                          lineHeight: '1.2'
                        }}>
                          {barrier.evidence.length > 100
                            ? barrier.evidence.substring(0, 100) + '...'
                            : barrier.evidence
                          }
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {barriers.length > 5 && (
                <div style={{ fontSize: '7px', fontStyle: 'italic', color: '#666', textAlign: 'center', marginTop: '6px' }}>
                  + {barriers.length - 5} additional barrier{barriers.length - 5 !== 1 ? 's' : ''}
                </div>
              )}
            </div>
          </div>

          {/* Row 3 & 4: Accommodations - Blue - Two columns */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {accommodationSubsections.map((subsection, idx) => {
              const subsectionAccommodations = parseAccommodations(subsection.content);

              return (
                <div
                  key={idx}
                  style={{
                    border: `2px solid ${brandColors.skyBlue}`,
                    borderRadius: '6px',
                    padding: '10px',
                    backgroundColor: 'rgba(150, 215, 225, 0.08)'
                  }}
                >
                  <h3
                    style={{
                      fontSize: '9px',
                      fontWeight: 'bold',
                      color: brandColors.navyBlue,
                      margin: '0 0 6px 0',
                      borderBottom: `1px solid ${brandColors.skyBlue}`,
                      paddingBottom: '3px'
                    }}
                  >
                    {subsection.id}. {subsection.title}
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {subsectionAccommodations.slice(0, 4).map((acc, accIdx) => (
                      <div key={accIdx} style={{ fontSize: '7px' }}>
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'auto 1fr',
                          gap: '4px',
                          alignItems: 'start'
                        }}>
                          <span style={{
                            fontWeight: '600',
                            color: brandColors.navyBlue,
                            fontSize: '6.5px'
                          }}>
                            {acc.number}.
                          </span>
                          <div>
                            <div style={{ fontWeight: '600', marginBottom: '1px' }}>
                              {stripMarkdownFormatting(acc.title)}
                            </div>
                            <div style={{ fontSize: '6px', color: '#555', lineHeight: '1.2' }}>
                              <strong>Barrier:</strong> {acc.barrier.length > 50 ? acc.barrier.substring(0, 50) + '...' : acc.barrier}
                            </div>
                            <div style={{ fontSize: '6px', color: '#555', lineHeight: '1.2' }}>
                              <strong>Implementation:</strong> {acc.implementation.length > 60 ? acc.implementation.substring(0, 60) + '...' : acc.implementation}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {subsectionAccommodations.length > 4 && (
                      <div style={{ fontSize: '6px', fontStyle: 'italic', color: '#666', paddingLeft: '12px' }}>
                        + {subsectionAccommodations.length - 4} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div
            style={{
              marginTop: '12px',
              padding: '8px',
              borderTop: `2px solid ${brandColors.skyBlue}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '7px',
              color: '#666'
            }}
          >
            <span>Generated by THRIVE Assessment System</span>
            <span>{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
    </div>
  );

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <FileText className="h-4 w-4 mr-2" />
          One-Page Summary
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>One-Page Accommodation Summary</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Button onClick={handlePrint} className="w-full">
            Print / Save as PDF
          </Button>
          <div ref={componentRef}>
            <PDFContent />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
