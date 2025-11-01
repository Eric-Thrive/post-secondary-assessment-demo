/**
 * K-12 Teacher Guide Configuration
 *
 * Defines the section structure, utility buttons, and theme for K-12 Teacher Guide reports.
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
} from "lucide-react";
import {
  ThriveStudentIcon,
  ThriveDocumentIcon,
} from "@/components/icons/ThriveIcons";
import { k12Theme } from "@/design-system/themes/k12Theme";
import type { ReportConfig } from "@/design-system/components/types";

/**
 * K-12 Report Configuration
 *
 * Defines all sections, utility buttons, and theme for the K-12 Teacher Guide.
 * Sections are displayed in the sidebar navigation in the order defined here.
 */
export const k12Config: ReportConfig = {
  reportTitle: "Teacher Guide",

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
      id: "review",
      title: "Review",
      icon: Edit,
      route: "/k12-review-edit",
    },
    {
      id: "new-report",
      title: "New Report",
      icon: Plus,
      route: "/new-k12-assessment",
    },
    {
      id: "home",
      title: "Home",
      icon: Home,
      route: "/",
    },
  ],

  // K-12 theme (Sunwashed palette)
  theme: k12Theme,

  // Logo (optional - can be set at runtime)
  logo: undefined,
};

/**
 * Section IDs for type-safe navigation
 */
export type K12SectionId =
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
export const isValidK12Section = (
  sectionId: string
): sectionId is K12SectionId => {
  return k12Config.sections.some((section) => section.id === sectionId);
};

/**
 * Get next section ID for navigation
 */
export const getNextSection = (
  currentSectionId: K12SectionId
): K12SectionId | null => {
  const currentIndex = k12Config.sections.findIndex(
    (section) => section.id === currentSectionId
  );

  if (currentIndex === -1 || currentIndex === k12Config.sections.length - 1) {
    return null;
  }

  return k12Config.sections[currentIndex + 1].id as K12SectionId;
};

/**
 * Get previous section ID for navigation
 */
export const getPreviousSection = (
  currentSectionId: K12SectionId
): K12SectionId | null => {
  const currentIndex = k12Config.sections.findIndex(
    (section) => section.id === currentSectionId
  );

  if (currentIndex <= 0) {
    return null;
  }

  return k12Config.sections[currentIndex - 1].id as K12SectionId;
};
