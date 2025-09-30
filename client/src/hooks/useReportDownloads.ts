import { AssessmentCase } from '@/types/assessmentCase';
import { universalItemMasterExportService } from '@/services/universalItemMasterExportService';

export const useReportDownloads = () => {
  const handleDownloadRawText = (currentCase: AssessmentCase | null) => {
    if (!currentCase) {
      console.warn('No case selected for raw text download');
      return;
    }

    console.log('=== Generating Raw Text Download ===');
    console.log('Case:', currentCase.id);
    console.log('Documents count:', currentCase.documents.length);

    // Extract text content from documents
    let rawTextContent = `RAW EXTRACTED TEXT REPORT
===============================
Case: ${currentCase.display_name}
Case ID: ${currentCase.id}
Processing Date: ${new Date(currentCase.last_updated).toLocaleString()}
Total Documents: ${currentCase.documents.length}

`;

    // Add content from each document
    currentCase.documents.forEach((doc, index) => {
      rawTextContent += `
===============================
DOCUMENT ${index + 1}: ${doc.name}
Type: ${doc.type}
Size: ${doc.size}
Upload Date: ${new Date(doc.uploadDate).toLocaleString()}
Status: ${doc.status}
===============================

`;

      // Try to get the content - this might be stored in different places
      let content = 'No content available';
      
      // Check if content is stored in the document object
      if ((doc as any).content) {
        content = (doc as any).content;
      } else if (currentCase.analysis_result) {
        // Try to find content in analysis result
        const analysisResult = currentCase.analysis_result as any;
        if (analysisResult.document_contents) {
          const matchingDoc = analysisResult.document_contents.find((docContent: any) => 
            docContent.filename === doc.name
          );
          if (matchingDoc) {
            content = matchingDoc.content;
          }
        }
      }

      rawTextContent += content;
      rawTextContent += '\n\n';
    });

    // Add summary
    rawTextContent += `
===============================
EXTRACTION SUMMARY
===============================
Total documents processed: ${currentCase.documents.length}
Case status: ${currentCase.status}
Generated: ${new Date().toLocaleString()}
`;

    console.log('Raw text content length:', rawTextContent.length);

    // Create and download the file
    const blob = new Blob([rawTextContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `raw-text-${currentCase.display_name.replace(/[^a-z0-9]/gi, '-')}-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    console.log('Raw text download initiated');
  };

  const handleDownloadMarkdown = (markdownReport: string | null, currentCase: AssessmentCase | null) => {
    if (!markdownReport) {
      console.warn('No markdown report available for download');
      return;
    }

    const blob = new Blob([markdownReport], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `assessment-report-${currentCase?.display_name?.replace(/[^a-z0-9]/gi, '-') || 'analysis'}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPDF = (markdownReport: string | null) => {
    if (!markdownReport) {
      console.warn('No report available for PDF download');
      return;
    }

    // For now, we'll download the markdown. In the future, this could be enhanced
    // to convert markdown to PDF using a library like jsPDF with markdown parsing
    handleDownloadMarkdown(markdownReport, null);
  };

  const handleDownloadItemMaster = async (currentCase: AssessmentCase | null, format: 'csv' | 'json' | 'markdown') => {
    if (!currentCase) {
      console.warn('No case selected for item master export');
      return;
    }

    console.log('=== Generating Item Master Export ===');
    console.log('Case:', currentCase.id);
    console.log('Format:', format);
    console.log('Module type:', currentCase.module_type);

    try {
      const exportContent = await universalItemMasterExportService.exportItems(currentCase, format);
      
      if (!exportContent || exportContent.trim() === '') {
        console.warn('No analysis data available for export');
        return;
      }

      console.log('Export content length:', exportContent.length);

      // Determine file extension and MIME type
      const extensions = { csv: 'csv', json: 'json', markdown: 'md' };
      const mimeTypes = { 
        csv: 'text/csv', 
        json: 'application/json', 
        markdown: 'text/markdown' 
      };
      
      const extension = extensions[format];
      const mimeType = mimeTypes[format];

      // Create and download the file
      const blob = new Blob([exportContent], { type: `${mimeType};charset=utf-8` });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `analysis-data-${currentCase.display_name.replace(/[^a-z0-9]/gi, '-')}-${new Date().toISOString().split('T')[0]}.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log('Item master export download initiated');
    } catch (error) {
      console.error('Error exporting item master data:', error);
    }
  };

  return {
    handleDownloadRawText,
    handleDownloadMarkdown,
    handleDownloadPDF,
    handleDownloadItemMaster
  };
};
