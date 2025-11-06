/**
 * Design System - TypeScript Interfaces
 *
 * Type definitions for all design system components and configurations.
 */

import { ReactNode } from "react";
import type { K12Theme } from "../themes/k12Theme";
import type { TutoringTheme } from "../themes/tutoringTheme";

// ============================================================================
// Theme Types
// ============================================================================

export type Theme = K12Theme | TutoringTheme;

// ============================================================================
// Report Configuration Types
// ============================================================================

export interface ReportSection {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }> | string;
  width?: string;
  subsections?: ReportSection[];
}

export interface UtilityButton {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  route: string;
  onClick?: () => void;
}

export interface ReportConfig {
  reportTitle: string;
  sections: ReportSection[];
  utilityButtons?: UtilityButton[];
  theme: Theme;
  logo?: string;
}

// ============================================================================
// Layout Component Props
// ============================================================================

export interface ThriveReportLayoutProps {
  config: ReportConfig;
  currentSection: string;
  onSectionChange: (sectionId: string) => void;
  theme: Theme;
  children: ReactNode;
}

export interface ThriveReportSidebarProps {
  sections: ReportSection[];
  utilityButtons?: UtilityButton[];
  currentSection: string;
  onSectionChange: (sectionId: string) => void;
  theme: Theme;
  logo?: string;
  reportTitle?: string;
}

export interface ThriveReportHeaderProps {
  logo: string;
  title: string;
  theme: Theme;
  actions?: ReactNode;
}

export interface ThriveReportSectionProps {
  section: ReportSection;
  isActive: boolean;
  theme: Theme;
  children: ReactNode;
}

// ============================================================================
// Navigation Component Props
// ============================================================================

export interface NavigationButtonProps {
  section: ReportSection;
  isActive: boolean;
  theme: Theme;
  onClick: () => void;
}

export interface BottomNavigationProps {
  nextLabel?: string;
  onNext: () => void;
  theme: Theme;
}

// ============================================================================
// Card Component Props
// ============================================================================

export interface ThriveReportCardProps {
  children: ReactNode;
  theme: Theme;
  variant?: "default" | "highlighted" | "bordered";
  className?: string;
}

export interface InfoCardProps {
  data: Record<string, string>;
  theme: Theme;
}

export interface DocumentCardProps {
  title: string;
  author: string;
  date: string;
  keyFindings?: string;
  theme: Theme;
}

// ============================================================================
// Accordion Component Props
// ============================================================================

export interface ThematicSection {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  content: string;
}

export interface ThematicAccordionProps {
  sections: ThematicSection[];
  theme: Theme;
}

export interface Strategy {
  strategy: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

export interface StrategyAccordionProps {
  strategies: Strategy[];
  theme: Theme;
}

export interface ActionItem {
  text: string;
  type: "do" | "dont";
}

export interface Strength {
  title: string;
  color: string;
  bgColor: string;
  whatYouSee: string[];
  whatToDo: ActionItem[];
}

export interface StrengthAccordionProps {
  strengths: Strength[];
  theme: Theme;
}

export interface Challenge {
  challenge: string;
  whatYouSee: string[];
  whatToDo: ActionItem[];
}

export interface ChallengeAccordionProps {
  challenges: Challenge[];
  theme: Theme;
}

// ============================================================================
// Data Model Types
// ============================================================================

export interface CaseInformation {
  studentName: string;
  grade: string;
  schoolYear: string;
  tutor: string;
  dateCreated: string;
  lastUpdated: string;
}

export interface Document {
  title: string;
  author: string;
  date: string;
  keyFindings: string;
}

export interface StudentOverview {
  atAGlance: string;
  sections: ThematicSection[];
}

export interface ReportData {
  caseInfo: CaseInformation;
  documentsReviewed: Document[];
  studentOverview: StudentOverview;
  supportStrategies: Strategy[];
  studentStrengths: Strength[];
  studentChallenges: Challenge[];
}
