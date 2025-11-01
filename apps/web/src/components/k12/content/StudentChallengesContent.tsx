/**
 * StudentChallengesContent Component
 *
 * Displays student challenges using ChallengeAccordion from the design system.
 * Shows "What You See" observations and "What to Do" recommendations with do/don't icons.
 *
 * Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6
 */

import React from "react";
import { ChallengeAccordion } from "@/design-system/components/content/ChallengeAccordion";
import BottomNavigation from "@/design-system/components/navigation/BottomNavigation";
import type { SectionContentProps } from "../sectionRegistry";
import type { Challenge } from "@/design-system/components/types";

const StudentChallengesContent: React.FC<SectionContentProps> = ({
  theme,
  onNext,
  reportData,
}) => {
  // Extract student challenges from reportData or use sample data
  const challenges: Challenge[] = reportData?.studentChallenges || [
    {
      challenge: "Written Expression & Organization",
      whatYouSee: [
        "Sarah struggles to get her ideas down on paper, even though she can express them verbally",
        "Her writing often lacks organization and clear structure",
        "She may start writing without a plan, leading to disjointed paragraphs",
        "Sarah takes significantly longer than peers to complete written assignments",
        "She may avoid writing tasks or become frustrated when asked to write",
      ],
      whatToDo: [
        {
          type: "do",
          text: "Provide graphic organizers and planning templates before writing",
        },
        {
          type: "do",
          text: "Allow Sarah to verbally explain her ideas before writing (record or scribe)",
        },
        {
          type: "do",
          text: "Break writing tasks into smaller, manageable steps with checkpoints",
        },
        {
          type: "do",
          text: "Offer extended time for written assignments and assessments",
        },
        {
          type: "do",
          text: "Use assistive technology like speech-to-text when appropriate",
        },
        {
          type: "dont",
          text: "Don't penalize Sarah for spelling or grammar errors in first drafts",
        },
        {
          type: "dont",
          text: "Don't assign lengthy writing tasks without scaffolding and support",
        },
        {
          type: "dont",
          text: "Don't compare her written work to her verbal abilities - they're different skills",
        },
      ],
    },
    {
      challenge: "Processing Speed & Working Memory",
      whatYouSee: [
        "Sarah needs more time to process information and formulate responses",
        "She may lose track of multi-step directions or forget what she was doing",
        "Sarah struggles with timed tasks and may not finish assessments",
        "She can become overwhelmed when too much information is presented at once",
        "Sarah may need to hear instructions multiple times or have them written down",
      ],
      whatToDo: [
        {
          type: "do",
          text: "Provide extended time for all tasks, especially assessments",
        },
        {
          type: "do",
          text: "Break instructions into smaller chunks and check for understanding",
        },
        {
          type: "do",
          text: "Use visual supports (written directions, checklists, anchor charts)",
        },
        {
          type: "do",
          text: "Allow Sarah to use external memory aids (notes, organizers, calculators)",
        },
        {
          type: "do",
          text: "Reduce the amount of information presented at one time",
        },
        {
          type: "dont",
          text: "Don't rush Sarah or make her feel pressured by time constraints",
        },
        {
          type: "dont",
          text: "Don't give long, complex verbal directions without visual support",
        },
        {
          type: "dont",
          text: "Don't assume she remembers information from previous lessons - review regularly",
        },
      ],
    },
    {
      challenge: "Attention & Focus During Independent Work",
      whatYouSee: [
        "Sarah may have difficulty sustaining attention during independent work periods",
        "She can become distracted by environmental stimuli (noise, movement, visuals)",
        "Sarah may need frequent redirection to stay on task",
        "She works best with structure, clear expectations, and regular check-ins",
        "Sarah may hyperfocus on preferred activities but struggle with less engaging tasks",
      ],
      whatToDo: [
        {
          type: "do",
          text: "Provide a structured work environment with minimal distractions",
        },
        {
          type: "do",
          text: "Use timers and break tasks into shorter work periods with breaks",
        },
        {
          type: "do",
          text: "Offer preferential seating away from high-traffic areas",
        },
        {
          type: "do",
          text: "Check in regularly during independent work to help Sarah stay on track",
        },
        {
          type: "do",
          text: "Use visual schedules and checklists to help Sarah monitor her progress",
        },
        {
          type: "dont",
          text: "Don't seat Sarah near windows, doors, or high-traffic areas",
        },
        {
          type: "dont",
          text: "Don't assign long independent work periods without breaks or check-ins",
        },
        {
          type: "dont",
          text: "Don't interpret her attention difficulties as lack of effort or motivation",
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
      {/* Section Header */}
      <h2
        style={{
          fontSize: theme.typography.fontSizes.h2,
          fontWeight: theme.typography.fontWeights.bold,
          color: theme.colors.gray900,
          marginBottom: theme.spacing.lg,
        }}
      >
        Student's Challenges
      </h2>

      {/* Challenge Accordion */}
      <ChallengeAccordion challenges={challenges} theme={theme} />

      {/* Bottom Navigation */}
      {onNext && (
        <BottomNavigation
          nextLabel="Complete Report"
          onNext={onNext}
          theme={theme}
        />
      )}
    </div>
  );
};

export default StudentChallengesContent;
