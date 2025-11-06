/**
 * StudentStrengthsContent Component
 *
 * Displays student strengths using StrengthAccordion from the design system.
 * Shows "What You See" observations and "What to Do" recommendations with do/don't icons.
 *
 * Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6
 */

import React from "react";
import { StrengthAccordion } from "@/design-system/components/content/StrengthAccordion";
import BottomNavigation from "@/design-system/components/navigation/BottomNavigation";
import type { SectionContentProps } from "../sectionRegistry";
import type { Strength } from "@/design-system/components/types";

const StudentStrengthsContent: React.FC<SectionContentProps> = ({
  theme,
  onNext,
  reportData,
}) => {
  // Extract student strengths from reportData or use sample data
  const strengths: Strength[] = reportData?.studentStrengths || [
    {
      title: "Verbal Expression & Communication",
      color: theme.colors.navyBlue,
      bgColor: `${theme.colors.skyBlue}40`,
      whatYouSee: [
        "Sarah articulates her thoughts clearly and uses rich vocabulary in discussions",
        "She enjoys storytelling and can elaborate on ideas with descriptive details",
        "Sarah asks thoughtful questions and makes connections between concepts",
        "She participates actively in class discussions and group conversations",
      ],
      whatToDo: [
        {
          type: "do",
          text: "Provide opportunities for Sarah to explain her thinking aloud before writing",
        },
        {
          type: "do",
          text: "Use think-pair-share activities to leverage her verbal strengths",
        },
        {
          type: "do",
          text: "Allow Sarah to record verbal responses as an alternative to written work when appropriate",
        },
        {
          type: "dont",
          text: "Don't assume strong verbal skills mean she doesn't need writing supports",
        },
        {
          type: "dont",
          text: "Don't rush her through verbal explanations - give her time to fully express ideas",
        },
      ],
    },
    {
      title: "Creative Problem-Solving",
      color: theme.colors.success,
      bgColor: `${theme.colors.success}30`,
      whatYouSee: [
        "Sarah approaches problems from unique angles and suggests creative solutions",
        "She excels in open-ended projects where she can apply her imagination",
        "Sarah makes unexpected connections between different subjects and ideas",
        "She enjoys hands-on activities and learns well through experimentation",
      ],
      whatToDo: [
        {
          type: "do",
          text: "Offer choice in how Sarah demonstrates her learning (projects, presentations, models)",
        },
        {
          type: "do",
          text: "Incorporate hands-on, project-based learning opportunities",
        },
        {
          type: "do",
          text: "Encourage Sarah to brainstorm multiple solutions before selecting one",
        },
        {
          type: "dont",
          text: "Don't limit her to one 'correct' way of solving problems",
        },
        {
          type: "dont",
          text: "Don't over-structure creative tasks - give her room to explore",
        },
      ],
    },
    {
      title: "Social Awareness & Empathy",
      color: theme.colors.orange,
      bgColor: `${theme.colors.orange}30`,
      whatYouSee: [
        "Sarah is kind and considerate toward her peers",
        "She notices when others are struggling and offers help",
        "Sarah builds positive relationships with both peers and adults",
        "She demonstrates strong self-awareness about her own learning needs",
      ],
      whatToDo: [
        {
          type: "do",
          text: "Pair Sarah with peers who may benefit from her supportive nature",
        },
        {
          type: "do",
          text: "Acknowledge and reinforce her empathetic behaviors",
        },
        {
          type: "do",
          text: "Encourage Sarah to advocate for her own needs and accommodations",
        },
        {
          type: "dont",
          text: "Don't overload her with peer support responsibilities",
        },
        {
          type: "dont",
          text: "Don't assume she always feels confident - check in regularly",
        },
      ],
    },
  ];

  return (
    <div
      className="p-8"
      style={{
        fontFamily: theme.typography.fontFamilies.primary,
      }}
    >
      {/* Strength Accordion */}
      <StrengthAccordion strengths={strengths} theme={theme} />

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

export default StudentStrengthsContent;
