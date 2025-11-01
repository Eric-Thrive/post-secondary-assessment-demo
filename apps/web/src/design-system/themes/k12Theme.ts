/**
 * K-12 Teacher Guide Theme
 *
 * Theme configuration for K-12 Teacher Guide reports.
 * Combines design tokens with K-12-specific color palette (Sunwashed).
 */

import {
  colors,
  spacing,
  typography,
  shadows,
  borderRadius,
  dimensions,
  pdfDimensions,
} from "../tokens";

export const k12Theme = {
  name: "K-12 Teacher Guide",

  colors: {
    // Primary brand colors
    primary: colors.navyBlue,
    secondary: colors.skyBlue,
    accent: colors.orange,
    highlight: colors.yellow,

    // Include all base colors
    ...colors,
  },

  spacing,
  typography,
  shadows,
  borderRadius,
  dimensions,
  pdfDimensions,

  // K-12-specific navigation styling
  navigation: {
    activeBackground: colors.yellow,
    activeBorder: colors.orange,
    activeText: colors.gray900,
    inactiveBackground: colors.gray100,
    inactiveBorder: colors.gray200,
    inactiveText: colors.gray600,
  },

  // Section-specific gradients
  gradients: {
    header: `linear-gradient(to right, ${colors.navyBlue}, ${colors.skyBlue})`,
    caseInfo: `linear-gradient(135deg, ${colors.skyBlue}20, ${colors.white})`,
    documents: `linear-gradient(135deg, ${colors.gray50}, ${colors.white})`,
    overview: `linear-gradient(135deg, ${colors.skyBlue}20, ${colors.white})`,
    strategies: `linear-gradient(135deg, ${colors.orange}20, ${colors.white})`,
    strengths: `linear-gradient(135deg, ${colors.skyBlue}20, ${colors.white})`,
    challenges: `linear-gradient(135deg, ${colors.orange}20, ${colors.white})`,
  },
} as const;

export type K12Theme = typeof k12Theme;
