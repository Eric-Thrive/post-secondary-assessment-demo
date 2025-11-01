/**
 * K-12 Section Registry
 *
 * Maps section IDs to their corresponding content components.
 * This registry is used by K12ReportViewer to dynamically render section content.
 */

import React from "react";
import type { K12SectionId } from "./k12Config";
import type { Theme } from "@/design-system/components/types";

// Import content components (will be implemented in Task 6)
// For now, we'll use placeholder components
const CaseInformationContent = React.lazy(
  () => import("./content/CaseInformationContent")
);
const DocumentsReviewedContent = React.lazy(
  () => import("./content/DocumentsReviewedContent")
);
const StudentOverviewContent = React.lazy(
  () => import("./content/StudentOverviewContent")
);
const SupportStrategiesContent = React.lazy(
  () => import("./content/SupportStrategiesContent")
);
const StudentStrengthsContent = React.lazy(
  () => import("./content/StudentStrengthsContent")
);
const StudentChallengesContent = React.lazy(
  () => import("./content/StudentChallengesContent")
);
const ReportCompleteContent = React.lazy(
  () => import("./content/ReportCompleteContent")
);

/**
 * Props passed to all section content components
 */
export interface SectionContentProps {
  theme: Theme;
  onNext?: () => void;
  reportData?: any; // Will be typed properly when content components are implemented
}

/**
 * Section Registry
 *
 * Maps section IDs to their content components.
 * Components are lazy-loaded for better performance.
 */
export const sectionRegistry: Record<
  K12SectionId,
  React.LazyExoticComponent<React.ComponentType<SectionContentProps>>
> = {
  "case-info": CaseInformationContent,
  documents: DocumentsReviewedContent,
  overview: StudentOverviewContent,
  strategies: SupportStrategiesContent,
  strengths: StudentStrengthsContent,
  challenges: StudentChallengesContent,
  complete: ReportCompleteContent,
};

/**
 * Get content component for a section ID
 */
export const getSectionContent = (
  sectionId: K12SectionId
): React.LazyExoticComponent<
  React.ComponentType<SectionContentProps>
> | null => {
  return sectionRegistry[sectionId] || null;
};

/**
 * Check if a section has a registered content component
 */
export const hasSectionContent = (sectionId: string): boolean => {
  return sectionId in sectionRegistry;
};
