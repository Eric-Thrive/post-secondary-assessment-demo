/**
 * StudentOverviewContent Component
 *
 * Displays student overview with "At a Glance" summary and three expandable subsections.
 * Uses AtAGlanceCard and ThematicAccordion from the design system.
 *
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6
 */

import React from "react";
import { BookOpen, Brain, Heart } from "lucide-react";
import { AtAGlanceCard } from "./AtAGlanceCard";
import { ThematicAccordion } from "@/design-system/components/content/ThematicAccordion";
import BottomNavigation from "@/design-system/components/navigation/BottomNavigation";
import type { SectionContentProps } from "../sectionRegistry";
import type { StudentOverview } from "@/design-system/components/types";

const StudentOverviewContent: React.FC<SectionContentProps> = ({
  theme,
  onNext,
  reportData,
}) => {
  // Extract student overview from reportData or use sample data
  const studentOverview: StudentOverview = reportData?.studentOverview || {
    atAGlance:
      "Sarah is a bright, creative 5th grader who thrives when given visual supports and time to process information. She excels in verbal expression and shows strong problem-solving skills when tasks are broken into manageable steps. Sarah benefits from a structured environment with clear expectations and opportunities for movement breaks.",
    sections: [
      {
        title: "Academic & Learning Profile",
        icon: BookOpen,
        color: theme.colors.navyBlue,
        bgColor: `${theme.colors.skyBlue}30`,
        content:
          "Sarah demonstrates strong verbal reasoning abilities and excels in creative writing and storytelling. She has a rich vocabulary and enjoys participating in class discussions. Reading comprehension is strongest when she can use graphic organizers to track main ideas and supporting details. Math skills are developing well with concrete manipulatives and visual representations. Sarah benefits from breaking multi-step problems into smaller, sequential tasks.",
      },
      {
        title: "Challenges & Diagnosis",
        icon: Brain,
        color: theme.colors.orange,
        bgColor: `${theme.colors.orange}20`,
        content:
          "Sarah has been diagnosed with ADHD (predominantly inattentive type) and shows characteristics of a specific learning disability in written expression. Working memory challenges impact her ability to hold multiple pieces of information simultaneously, particularly during complex tasks. Processing speed is below average, meaning Sarah needs additional time to complete assignments and assessments. She may struggle with organization and time management without external supports.",
      },
      {
        title: "Social-Emotional & Supports",
        icon: Heart,
        color: theme.colors.success,
        bgColor: `${theme.colors.success}20`,
        content:
          "Sarah is a kind and empathetic student who builds positive relationships with peers and adults. She demonstrates strong self-awareness and can articulate when she needs help or a break. Sarah benefits from a calm, predictable environment and responds well to positive reinforcement. She may experience anxiety when faced with timed tasks or unexpected changes to routine. Movement breaks and opportunities for hands-on learning help Sarah stay engaged and regulated throughout the school day.",
      },
    ],
  };

  return (
    <div
      className="p-8"
      style={{
        fontFamily: theme.typography.fontFamilies.primary,
      }}
    >
      {/* Section Header */}
      <h2
        style={{
          fontSize: theme.typography.fontSizes.h2,
          fontWeight: theme.typography.fontWeights.bold,
          color: theme.colors.gray900,
          marginBottom: theme.spacing.lg,
        }}
      >
        Student Overview
      </h2>

      {/* At a Glance Summary Card */}
      <AtAGlanceCard content={studentOverview.atAGlance} theme={theme} />

      {/* Thematic Accordion Subsections */}
      <div style={{ marginTop: theme.spacing.xl }}>
        <ThematicAccordion sections={studentOverview.sections} theme={theme} />
      </div>

      {/* Bottom Navigation */}
      {onNext && (
        <BottomNavigation
          nextLabel="Next Section"
          onNext={onNext}
          theme={theme}
        />
      )}
    </div>
  );
};

export default StudentOverviewContent;
