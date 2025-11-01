/**
 * useResponsiveTypography Hook
 *
 * Returns the appropriate font size based on viewport width.
 * Automatically switches between desktop and mobile typography tokens.
 */

import { useState, useEffect } from "react";
import { typography } from "../tokens/typography";

type FontSizeKey = keyof typeof typography.fontSizes;

export const useResponsiveTypography = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Check on mount
    checkMobile();

    // Add resize listener
    window.addEventListener("resize", checkMobile);

    // Cleanup
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const getFontSize = (key: FontSizeKey): string => {
    return isMobile
      ? typography.fontSizesMobile[key]
      : typography.fontSizes[key];
  };

  return {
    isMobile,
    getFontSize,
    fontSizes: isMobile ? typography.fontSizesMobile : typography.fontSizes,
  };
};
