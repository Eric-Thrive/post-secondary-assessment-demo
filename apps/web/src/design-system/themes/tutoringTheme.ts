/**
 * Tutoring Tutor Guide Theme
 *
 * Theme configuration for Tutoring Tutor Guide reports.
 * Shares the same structure and most values with K-12 theme.
 * Can be customized independently if needed in the future.
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

export const tutoringTheme = {
  name: "Tutoring Tutor Guide",

  colors: {
    // Primary brand colors (same as K-12 for now)
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

  // Tutoring-specific navigation styling (same as K-12 for now)
  navigation: {
    activeBackground: colors.yellow,
    activeBorder: colors.orange,
    activeText: colors.gray900,
    inactiveBackground: colors.gray100,
    inactiveBorder: colors.gray200,
    inactiveText: colors.gray600,
  },

  // Section-specific gradients (same structure as K-12)
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

export type TutoringTheme = typeof tutoringTheme;
