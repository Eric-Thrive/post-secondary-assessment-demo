/**
 * Design System - Color Tokens
 *
 * Centralized color definitions for all THRIVE report types.
 * No hardcoded color values should exist in components - always reference these tokens.
 */

export const colors = {
  // K-12 Sunwashed Palette (Primary Branding)
  navyBlue: "#1297D2",
  skyBlue: "#96D7E1",
  orange: "#F89E54",
  yellow: "#FDE677",

  // Neutral Colors
  white: "#FFFFFF",
  gray50: "#F8FAFC",
  gray100: "#F1F5F9",
  gray200: "#E2E8F0",
  gray300: "#CBD5E1",
  gray400: "#94A3B8",
  gray500: "#64748B",
  gray600: "#475569",
  gray700: "#334155",
  gray800: "#1E293B",
  gray900: "#0F172A",

  // Semantic Colors
  success: "#16a34a",
  error: "#dc2626",
  warning: "#F89E54",
  info: "#1297D2",

  // Post-Secondary Status Colors (for future use)
  validated: "#10B981",
  needsReview: "#F59E0B",
  flagged: "#EF4444",

  // Post-Secondary Category Colors (for future use)
  academic: "#3B82F6",
  instructional: "#8B5CF6",
  auxiliaryAid: "#06B6D4",
} as const;

export type ColorToken = keyof typeof colors;
