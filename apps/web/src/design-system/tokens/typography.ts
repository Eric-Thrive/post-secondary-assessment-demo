/**
 * Design System - Typography Tokens
 *
 * Typography system aligned with post-secondary report design.
 * Includes font families, sizes, weights, and line heights.
 * Responsive font sizes scale down 10-15% on mobile devices.
 */

export const typography = {
  fontFamilies: {
    primary:
      '"Avenir", "Avenir Next", -apple-system, BlinkMacSystemFont, sans-serif',
    secondary: '"Montserrat", -apple-system, BlinkMacSystemFont, sans-serif',
  },

  fontSizes: {
    h1: "32px", // Report Title
    h2: "24px", // Section Headers
    h3: "20px", // Subsection Headers
    h4: "18px", // Card Headers
    bodyLarge: "16px",
    body: "14px",
    small: "12px",
  },

  // Mobile font sizes (scaled down 10-15% for better readability on small screens)
  fontSizesMobile: {
    h1: "28px", // 32px * 0.875 = 28px (12.5% reduction)
    h2: "20px", // 24px * 0.833 = 20px (16.7% reduction)
    h3: "18px", // 20px * 0.9 = 18px (10% reduction)
    h4: "16px", // 18px * 0.889 = 16px (11.1% reduction)
    bodyLarge: "15px", // 16px * 0.9375 = 15px (6.25% reduction)
    body: "14px", // Keep same for readability
    small: "12px", // Keep same for readability
  },

  fontWeights: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
    heavy: 900,
  },

  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;

export type FontFamily = keyof typeof typography.fontFamilies;
export type FontSize = keyof typeof typography.fontSizes;
export type FontWeight = keyof typeof typography.fontWeights;
export type LineHeight = keyof typeof typography.lineHeights;
