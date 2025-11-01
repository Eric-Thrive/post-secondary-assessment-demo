/**
 * PDFDownloadButton Component
 *
 * Generates and downloads PDF version of K-12 Teacher Guide.
 * Uses html2canvas to capture the PDFReport component and jsPDF to generate the PDF.
 *
 * Requirements: 12.1, 12.2, 12.3, 12.4
 */

import React, { useState, useRef } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Download, Loader2 } from "lucide-react";
import PDFReport from "./PDFReport";
import type { Theme } from "@/design-system/components/types";

export interface PDFDownloadButtonProps {
  /**
   * Student name for filename generation
   */
  studentName: string;

  /**
   * Complete report data to render in PDF
   */
  reportData: any;

  /**
   * Theme for styling
   */
  theme: Theme;

  /**
   * Optional custom button text
   */
  buttonText?: string;

  /**
   * Optional className for custom styling
   */
  className?: string;
}

/**
 * PDFDownloadButton Component
 */
const PDFDownloadButton: React.FC<PDFDownloadButtonProps> = ({
  studentName,
  reportData,
  theme,
  buttonText = "Download PDF",
  className = "",
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pdfReportRef = useRef<HTMLDivElement>(null);

  /**
   * Generate filename in format: Teacher_Guide_[StudentName]_[Date].pdf
   */
  const generateFilename = (): string => {
    const date = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const sanitizedName = studentName.replace(/[^a-zA-Z0-9]/g, "_");
    return `Teacher_Guide_${sanitizedName}_${date}.pdf`;
  };

  /**
   * Handle PDF generation and download
   */
  const handleDownloadPDF = async () => {
    if (!pdfReportRef.current) {
      setError("PDF report element not found");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      // Capture the PDF report element as canvas
      const canvas = await html2canvas(pdfReportRef.current, {
        scale: 2, // Higher quality
        useCORS: true,
        logging: false,
        backgroundColor: theme.colors.white,
      });

      // Calculate dimensions for A4 page
      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Create PDF
      const pdf = new jsPDF({
        orientation: imgHeight > imgWidth ? "portrait" : "portrait",
        unit: "mm",
        format: "a4",
      });

      // Add image to PDF
      const imgData = canvas.toDataURL("image/png");
      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);

      // Download PDF
      const filename = generateFilename();
      pdf.save(filename);

      setIsGenerating(false);
    } catch (err) {
      console.error("PDF generation failed:", err);
      setError("Unable to generate PDF. Please try again or contact support.");
      setIsGenerating(false);
    }
  };

  return (
    <>
      {/* Download Button */}
      <button
        onClick={handleDownloadPDF}
        disabled={isGenerating}
        className={`flex items-center justify-center gap-2 px-6 py-4 rounded-lg transition-all duration-200 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        style={{
          backgroundColor: theme.colors.primary,
          color: theme.colors.white,
          fontFamily: theme.typography.fontFamilies.primary,
          fontSize: theme.typography.fontSizes.body,
          fontWeight: theme.typography.fontWeights.semibold,
          boxShadow: theme.shadows.md,
        }}
        onMouseEnter={(e) => {
          if (!isGenerating) {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = theme.shadows.xl;
          }
        }}
        onMouseLeave={(e) => {
          if (!isGenerating) {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = theme.shadows.md;
          }
        }}
        aria-label={isGenerating ? "Generating PDF" : "Download PDF Report"}
        role="button"
        tabIndex={0}
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Generating PDF...</span>
          </>
        ) : (
          <>
            <Download className="w-5 h-5" />
            <span>{buttonText}</span>
          </>
        )}
      </button>

      {/* Error Message */}
      {error && (
        <div
          className="mt-4 p-4 rounded-lg"
          style={{
            backgroundColor: `${theme.colors.error}10`,
            border: `1px solid ${theme.colors.error}`,
            color: theme.colors.error,
            fontSize: theme.typography.fontSizes.small,
          }}
          role="alert"
        >
          {error}
        </div>
      )}

      {/* Hidden PDF Report Component */}
      <div
        style={{
          position: "absolute",
          left: "-9999px",
          top: 0,
        }}
        aria-hidden="true"
      >
        <PDFReport ref={pdfReportRef} reportData={reportData} theme={theme} />
      </div>
    </>
  );
};

export default PDFDownloadButton;
