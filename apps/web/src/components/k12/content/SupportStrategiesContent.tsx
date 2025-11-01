/**
 * SupportStrategiesContent Component
 *
 * Displays key support strategies using StrategyAccordion from the design system.
 * Shows strategy name and detailed description for each strategy.
 *
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6
 */

import React from "react";
import { Clock, ListChecks, Eye, Lightbulb, Users, Target } from "lucide-react";
import { StrategyAccordion } from "@/design-system/components/content/StrategyAccordion";
import BottomNavigation from "@/design-system/components/navigation/BottomNavigation";
import type { SectionContentProps } from "../sectionRegistry";
import type { Strategy } from "@/design-system/components/types";

const SupportStrategiesContent: React.FC<SectionContentProps> = ({
  theme,
  onNext,
  reportData,
}) => {
  // Extract support strategies from reportData or use sample data
  const strategies: Strategy[] = reportData?.supportStrategies || [
    {
      strategy: "Extended Time & Chunking",
      icon: Clock,
      description:
        "Provide Sarah with 1.5x time on tests and assignments. Break longer tasks into smaller, manageable chunks with clear checkpoints. For example, instead of assigning a 5-paragraph essay all at once, break it into: brainstorming (Day 1), outline (Day 2), introduction paragraph (Day 3), etc. This reduces cognitive load and helps Sarah manage her working memory challenges.",
    },
    {
      strategy: "Visual Supports & Graphic Organizers",
      icon: Eye,
      description:
        "Use visual aids to support Sarah's learning across all subjects. Provide graphic organizers for reading comprehension (story maps, Venn diagrams), writing (paragraph frames, essay outlines), and math (step-by-step problem-solving templates). Color-code materials to help with organization. Visual schedules and checklists help Sarah track multi-step tasks and stay organized throughout the day.",
    },
    {
      strategy: "Explicit Task Instructions",
      icon: ListChecks,
      description:
        "Present instructions one step at a time, using both verbal and written formats. Check for understanding by having Sarah repeat back the instructions in her own words. Provide written copies of multi-step directions that Sarah can refer to as she works. Use numbered lists and bullet points to make instructions clear and scannable.",
    },
    {
      strategy: "Movement & Sensory Breaks",
      icon: Target,
      description:
        "Build in regular movement breaks every 20-30 minutes to help Sarah stay regulated and focused. Options include: stretching at her desk, delivering a message to the office, organizing classroom materials, or using a fidget tool. These breaks help Sarah manage her attention and energy levels throughout the day.",
    },
    {
      strategy: "Positive Reinforcement & Self-Monitoring",
      icon: Lightbulb,
      description:
        "Use specific, immediate praise to reinforce Sarah's efforts and progress. Focus on growth mindset language ('I can see how hard you worked on organizing your ideas'). Teach Sarah to use self-monitoring checklists to track her own progress on tasks. This builds metacognitive skills and helps Sarah develop independence.",
    },
    {
      strategy: "Collaborative Learning Opportunities",
      icon: Users,
      description:
        "Pair Sarah with supportive peers for collaborative activities. She benefits from discussing ideas aloud and learning from others' organizational strategies. Structure group work with clear roles and expectations. Sarah's verbal strengths and creativity make her a valuable contributor to group projects when tasks are well-defined.",
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
        Key Support Strategies
      </h2>

      {/* Strategy Accordion */}
      <StrategyAccordion strategies={strategies} theme={theme} />

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

export default SupportStrategiesContent;
