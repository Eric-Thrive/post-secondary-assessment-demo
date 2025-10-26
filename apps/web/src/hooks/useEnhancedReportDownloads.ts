import { useState } from "react";
import { AssessmentCase } from "@/types/assessmentCase";
import { universalItemMasterExportService } from "@/services/universalItemMasterExportService";
import { useToast } from "@/hooks/use-toast";

export interface BatchExportOptions {
  cases: AssessmentCase[];
  formats: ("markdown" | "csv" | "json" | "pdf")[];
  includeRawText?: boolean;
  includeAnalysisData?: boolean;
}

export interface ExportProgress {
  current: number;
  total: number;
  currentFile: string;
  status: "idle" | "processing" | "completed" | "error";
  error?: string;
}

export const useEnhancedReportDownloads = () => {
  const { toast } = useToast();
  const [exportProgress, setExportProgress] = useState<ExportProgress>({
    current: 0,
    total: 0,
    currentFile: "",
    status: "idle",
  });

  const showUserFriendlyError = (error: unknown, context: string) => {
    let title = "Export Failed";
    let description = "An unexpected error occurred during export.";
    let actionableGuidance = "";

    if (error instanceof Error) {
      if (
        error.message.includes("network") ||
        error.message.includes("fetch")
      ) {
        title = "Network Error";
        description = "Unable to connect to the server.";
        actionableGuidance =
          "Please check your internet connection and try again.";
      } else if (
        error.message.includes("permission") ||
        error.message.includes("access")
      ) {
        title = "Access Denied";
        description = "You don't have permission to export this data.";
        actionableGuidance = "Please contact your administrator for access.";
      } else if (error.message.includes("timeout")) {
        title = "Request Timeout";
        description = "The export took too long to complete.";
        actionableGuidance =
          "Try exporting fewer items or a smaller date range.";
      } else if (
        error.message.includes("storage") ||
        error.message.includes("quota")
      ) {
        title = "Storage Full";
        description = "Not enough space to save the export file.";
        actionableGuidance = "Free up some disk space and try again.";
      } else {
        description = error.message;
        actionableGuidance =
          "Please try again or contact support if the problem persists.";
      }
    }

    toast({
      title,
      description: `${description} ${actionableGuidance}`,
      variant: "destructive",
    });

    console.error(`Export error in ${context}:`, error);
  };

  const handleDownloadRawText = async (currentCase: AssessmentCase | null) => {
    if (!currentCase) {
      toast({
        title: "No Case Selected",
        description: "Please select an assessment case to download raw text.",
        variant: "destructive",
      });
      return;
    }

    try {
      setExportProgress({
        current: 1,
        total: 1,
        currentFile: "raw-text.txt",
        status: "processing",
      });

      console.log("=== Generating Raw Text Download ===");
      console.log("Case:", currentCase.id);
      console.log("Documents count:", currentCase.documents.length);

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
        let content = "No content available";

        // Check if content is stored in the document object
        if ((doc as any).content) {
          content = (doc as any).content;
        } else if (currentCase.analysis_result) {
          // Try to find content in analysis result
          const analysisResult = currentCase.analysis_result as any;
          if (analysisResult.document_contents) {
            const matchingDoc = analysisResult.document_contents.find(
              (docContent: any) => docContent.filename === doc.name
            );
            if (matchingDoc) {
              content = matchingDoc.content;
            }
          }
        }

        rawTextContent += content;
        rawTextContent += "\n\n";
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

      console.log("Raw text content length:", rawTextContent.length);

      // Create and download the file
      const blob = new Blob([rawTextContent], {
        type: "text/plain;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `raw-text-${currentCase.display_name.replace(
        /[^a-z0-9]/gi,
        "-"
      )}-${new Date().toISOString().split("T")[0]}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setExportProgress({
        current: 1,
        total: 1,
        currentFile: "raw-text.txt",
        status: "completed",
      });

      toast({
        title: "Export Successful",
        description: "Raw text file has been downloaded successfully.",
      });

      console.log("Raw text download initiated");
    } catch (error) {
      setExportProgress({
        current: 0,
        total: 1,
        currentFile: "",
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
      showUserFriendlyError(error, "raw text download");
    }
  };

  const handleDownloadMarkdown = async (
    markdownReport: string | null,
    currentCase: AssessmentCase | null
  ) => {
    if (!markdownReport) {
      toast({
        title: "No Report Available",
        description:
          "No markdown report is available for download. Please ensure the analysis is complete.",
        variant: "destructive",
      });
      return;
    }

    try {
      setExportProgress({
        current: 1,
        total: 1,
        currentFile: "report.md",
        status: "processing",
      });

      const blob = new Blob([markdownReport], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `assessment-report-${
        currentCase?.display_name?.replace(/[^a-z0-9]/gi, "-") || "analysis"
      }.md`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setExportProgress({
        current: 1,
        total: 1,
        currentFile: "report.md",
        status: "completed",
      });

      toast({
        title: "Export Successful",
        description: "Markdown report has been downloaded successfully.",
      });
    } catch (error) {
      setExportProgress({
        current: 0,
        total: 1,
        currentFile: "",
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
      showUserFriendlyError(error, "markdown download");
    }
  };

  const handleDownloadPDF = async (
    markdownReport: string | null,
    currentCase: AssessmentCase | null
  ) => {
    if (!markdownReport) {
      toast({
        title: "No Report Available",
        description:
          "No report is available for PDF conversion. Please ensure the analysis is complete.",
        variant: "destructive",
      });
      return;
    }

    try {
      setExportProgress({
        current: 1,
        total: 1,
        currentFile: "report.pdf",
        status: "processing",
      });

      // For now, we'll download the markdown with a note about PDF conversion
      // In the future, this could be enhanced to convert markdown to PDF using a library like jsPDF
      const pdfNote = `# PDF Export Note

This file contains the markdown content that would be converted to PDF.
To convert to PDF, you can:

1. Use a markdown to PDF converter online
2. Import into a word processor that supports markdown
3. Use a browser extension to print this as PDF

---

${markdownReport}`;

      const blob = new Blob([pdfNote], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `assessment-report-${
        currentCase?.display_name?.replace(/[^a-z0-9]/gi, "-") || "analysis"
      }-for-pdf.md`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setExportProgress({
        current: 1,
        total: 1,
        currentFile: "report.pdf",
        status: "completed",
      });

      toast({
        title: "Export Prepared",
        description:
          "Markdown file prepared for PDF conversion has been downloaded.",
      });
    } catch (error) {
      setExportProgress({
        current: 0,
        total: 1,
        currentFile: "",
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
      showUserFriendlyError(error, "PDF preparation");
    }
  };

  const handleDownloadItemMaster = async (
    currentCase: AssessmentCase | null,
    format: "csv" | "json" | "markdown"
  ) => {
    if (!currentCase) {
      toast({
        title: "No Case Selected",
        description:
          "Please select an assessment case to export analysis data.",
        variant: "destructive",
      });
      return;
    }

    console.log("=== Generating Item Master Export ===");
    console.log("Case:", currentCase.id);
    console.log("Format:", format);
    console.log("Module type:", currentCase.module_type);

    try {
      setExportProgress({
        current: 1,
        total: 1,
        currentFile: `analysis-data.${format}`,
        status: "processing",
      });

      const exportContent = await universalItemMasterExportService.exportItems(
        currentCase,
        format
      );

      if (!exportContent || exportContent.trim() === "") {
        toast({
          title: "No Data Available",
          description:
            "No analysis data is available for export. Please ensure the analysis is complete and contains structured data.",
          variant: "destructive",
        });
        setExportProgress({
          current: 0,
          total: 1,
          currentFile: "",
          status: "error",
          error: "No analysis data available",
        });
        return;
      }

      console.log("Export content length:", exportContent.length);

      // Determine file extension and MIME type
      const extensions = { csv: "csv", json: "json", markdown: "md" };
      const mimeTypes = {
        csv: "text/csv",
        json: "application/json",
        markdown: "text/markdown",
      };

      const extension = extensions[format];
      const mimeType = mimeTypes[format];

      // Create and download the file
      const blob = new Blob([exportContent], {
        type: `${mimeType};charset=utf-8`,
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `analysis-data-${currentCase.display_name.replace(
        /[^a-z0-9]/gi,
        "-"
      )}-${new Date().toISOString().split("T")[0]}.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setExportProgress({
        current: 1,
        total: 1,
        currentFile: `analysis-data.${format}`,
        status: "completed",
      });

      toast({
        title: "Export Successful",
        description: `Analysis data has been exported as ${format.toUpperCase()} successfully.`,
      });

      console.log("Item master export download initiated");
    } catch (error) {
      setExportProgress({
        current: 0,
        total: 1,
        currentFile: "",
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
      showUserFriendlyError(error, "analysis data export");
    }
  };

  const handleBatchExport = async (options: BatchExportOptions) => {
    const {
      cases,
      formats,
      includeRawText = false,
      includeAnalysisData = false,
    } = options;

    if (cases.length === 0) {
      toast({
        title: "No Cases Selected",
        description:
          "Please select at least one assessment case for batch export.",
        variant: "destructive",
      });
      return;
    }

    if (formats.length === 0) {
      toast({
        title: "No Formats Selected",
        description: "Please select at least one export format.",
        variant: "destructive",
      });
      return;
    }

    try {
      const totalFiles =
        cases.length *
        (formats.length +
          (includeRawText ? 1 : 0) +
          (includeAnalysisData ? 1 : 0));
      let currentFile = 0;

      setExportProgress({
        current: 0,
        total: totalFiles,
        currentFile: "Starting batch export...",
        status: "processing",
      });

      // Create a zip file for batch export (simplified approach - create individual files)
      for (const assessmentCase of cases) {
        for (const format of formats) {
          currentFile++;
          setExportProgress({
            current: currentFile,
            total: totalFiles,
            currentFile: `${assessmentCase.display_name}.${format}`,
            status: "processing",
          });

          // Add delay to prevent overwhelming the browser
          await new Promise((resolve) => setTimeout(resolve, 100));

          if (format === "markdown") {
            // Get markdown report for this case
            const markdownReport = assessmentCase.analysis_result
              ? (assessmentCase.analysis_result as any).markdown_report ||
                (assessmentCase.analysis_result as any).report ||
                "No markdown report available"
              : "No analysis result available";

            await handleDownloadMarkdown(markdownReport, assessmentCase);
          } else if (format === "csv" || format === "json") {
            await handleDownloadItemMaster(assessmentCase, format);
          }
        }

        if (includeRawText) {
          currentFile++;
          setExportProgress({
            current: currentFile,
            total: totalFiles,
            currentFile: `${assessmentCase.display_name}-raw.txt`,
            status: "processing",
          });
          await handleDownloadRawText(assessmentCase);
        }
      }

      setExportProgress({
        current: totalFiles,
        total: totalFiles,
        currentFile: "Batch export completed",
        status: "completed",
      });

      toast({
        title: "Batch Export Completed",
        description: `Successfully exported ${cases.length} cases in ${formats.length} format(s).`,
      });
    } catch (error) {
      setExportProgress({
        current: 0,
        total: 0,
        currentFile: "",
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
      showUserFriendlyError(error, "batch export");
    }
  };

  const resetExportProgress = () => {
    setExportProgress({
      current: 0,
      total: 0,
      currentFile: "",
      status: "idle",
    });
  };

  return {
    handleDownloadRawText,
    handleDownloadMarkdown,
    handleDownloadPDF,
    handleDownloadItemMaster,
    handleBatchExport,
    exportProgress,
    resetExportProgress,
    showUserFriendlyError,
  };
};
