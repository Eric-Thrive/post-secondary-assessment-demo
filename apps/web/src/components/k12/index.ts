/**
 * K-12 Components - Main Export
 *
 * Central export point for K-12 Teacher Guide components.
 */

export { default as K12ReportViewer } from "./K12ReportViewer";
export {
  k12Config,
  getNextSection,
  getPreviousSection,
  isValidK12Section,
} from "./k12Config";
export type { K12SectionId } from "./k12Config";
export {
  sectionRegistry,
  getSectionContent,
  hasSectionContent,
} from "./sectionRegistry";
export type { SectionContentProps } from "./sectionRegistry";

// PDF Generation Components
export { default as PDFReport } from "./PDFReport";
export { default as PDFDownloadButton } from "./PDFDownloadButton";
export { default as K12CompactPrintReport } from "./K12CompactPrintReport";
export type { PDFReportProps } from "./PDFReport";
export type { PDFDownloadButtonProps } from "./PDFDownloadButton";
export type { K12CompactPrintReportProps } from "./K12CompactPrintReport";
