/**
 * Design System - Dimension Tokens
 *
 * Layout dimensions, border widths, and icon sizes.
 * Use these tokens for consistent sizing across all components.
 */

export const dimensions = {
  // Layout dimensions
  headerHeight: "80px",
  sidebarWidth: "320px",
  logoMaxWidth: "150px",
  logoMaxHeight: "60px",

  // Icon sizes
  iconXs: "16px",
  iconSm: "20px",
  iconMd: "24px",
  iconLg: "32px",
  iconXl: "48px",
  iconXxl: "64px",
  iconHuge: "120px",

  // Border widths
  borderThin: "1px",
  borderMedium: "2px",
  borderThick: "4px",

  // Minimum touch target (WCAG accessibility)
  minTouchTarget: "44px",
} as const;

/**
 * PDF-specific compact dimensions
 * Used for generating single-page PDF reports with condensed layout
 */
export const pdfDimensions = {
  fontSize: {
    title: "16px",
    heading: "11px",
    subheading: "10px",
    body: "9px",
    small: "8px",
    tiny: "7px",
  },
  spacing: {
    xs: "2px",
    sm: "3px",
    md: "6px",
    lg: "8px",
  },
  padding: {
    xs: "3px",
    sm: "6px",
    md: "8px",
    lg: "12px",
  },
} as const;

export type DimensionToken = keyof typeof dimensions;
export type PdfFontSize = keyof typeof pdfDimensions.fontSize;
export type PdfSpacing = keyof typeof pdfDimensions.spacing;
export type PdfPadding = keyof typeof pdfDimensions.padding;
