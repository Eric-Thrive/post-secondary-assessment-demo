/**
 * Design System - Spacing Tokens
 *
 * Consistent spacing scale based on 4px base unit.
 * Use these tokens for all padding, margin, and gap values.
 */

export const spacing = {
  micro: "2px", // For micro-adjustments like icon alignment
  xs: "4px",
  sm: "8px",
  md: "16px",
  lg: "24px",
  xl: "32px",
  xxl: "48px",
  xxxl: "64px",
} as const;

export type SpacingToken = keyof typeof spacing;
