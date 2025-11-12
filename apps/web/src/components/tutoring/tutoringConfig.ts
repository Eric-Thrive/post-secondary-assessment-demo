/**
 * Tutoring Tutor Guide Configuration
 *
 * Defines the section structure, utility buttons, and theme for Tutoring Tutor Guide reports.
 * This configuration drives the report viewer layout and navigation.
 */

import {
  Star,
  AlertTriangle,
  CheckCircle,
  Edit,
  Plus,
  Home,
  Lightbulb,
  Eye,
  Printer,
} from "lucide-react";
import {
  ThriveStudentIcon,
  ThriveDocumentIcon,
} from "@/components/icons/ThriveIcons";
import { tutoringTheme } from "@/design-system/themes/tutoringTheme";
import type { ReportConfig } from "@/design-system/components/types";

/**
 * Tutoring Report Configuration
 *
 * Defines all sections, utility buttons, and theme for the Tutoring Tutor Guide.
 * Sections are displayed in the sidebar navigation in the order defined here.
 */
export const tutoringConfig: ReportConfig = {
  reportTitle: "Tutor Guide",

  // Main report sections (displayed in sidebar navigation)
  sections: [
    {
      id: "case-info",
      title: "Case Information",
      icon: ThriveStudentIcon,
    },
    {
      id: "documents",
      title: "Documents Reviewed",
      icon: ThriveDocumentIcon,
    },
    {
      id: "overview",
      title: "Student Overview",
      icon: Eye,
    },
    {
      id: "strategies",
      title: "Key Support Strategies",
      icon: Lightbulb,
    },
    {
      id: "strengths",
      title: "Student's Strengths",
      icon: Star,
    },
    {
      id: "challenges",
      title: "Student's Challenges",
      icon: AlertTriangle,
    },
    {
      id: "complete",
      title: "Report Complete",
      icon: CheckCircle,
    },
  ],

  // Utility buttons (displayed below sections in sidebar)
  utilityButtons: [
    {
      id: "print",
      title: "Print Compact View",
      icon: Printer,
      route: "#print",
    },
    {
      id: "review",
      title: "Review",
      icon: Edit,
      route: "/tutoring-review-edit",
    },
    {
      id: "new-report",
      title: "New Report",
      icon: Plus,
      route: "/new-tutoring-assessment",
    },
    {
      id: "home",
      title: "Home",
      icon: Home,
      route: "/",
    },
  ],

  // Tutoring theme (Purple palette)
  theme: tutoringTheme,

  // Logo (optional - can be set at runtime)
  logo: undefined,
};

/**
 * Section IDs for type-safe navigation
 */
export type TutoringSectionId =
  | "case-info"
  | "documents"
  | "overview"
  | "strategies"
  | "strengths"
  | "challenges"
  | "complete";

/**
 * Utility to validate section ID
 */
export const isValidTutoringSection = (
  sectionId: string
): sectionId is TutoringSectionId => {
  return tutoringConfig.sections.some((section) => section.id === sectionId);
};

/**
 * Get next section ID for navigation
 */
export const getNextSection = (
  currentSectionId: TutoringSectionId
): TutoringSectionId | null => {
  const currentIndex = tutoringConfig.sections.findIndex(
    (section) => section.id === currentSectionId
  );

  if (
    currentIndex === -1 ||
    currentIndex === tutoringConfig.sections.length - 1
  ) {
    return null;
  }

  return tutoringConfig.sections[currentIndex + 1].id as TutoringSectionId;
};

/**
 * Get previous section ID for navigation
 */
export const getPreviousSection = (
  currentSectionId: TutoringSectionId
): TutoringSectionId | null => {
  const currentIndex = tutoringConfig.sections.findIndex(
    (section) => section.id === currentSectionId
  );

  if (currentIndex <= 0) {
    return null;
  }

  return tutoringConfig.sections[currentIndex - 1].id as TutoringSectionId;
};
