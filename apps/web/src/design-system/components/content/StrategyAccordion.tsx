/**
 * StrategyAccordion Component
 *
 * Expandable support strategy cards with orange theme.
 * Uses Radix UI Accordion with single-item behavior.
 */

import React from "react";
import * as Accordion from "@radix-ui/react-accordion";
import { ChevronDown } from "lucide-react";
import type { StrategyAccordionProps } from "../types";

export const StrategyAccordion: React.FC<StrategyAccordionProps> = ({
  strategies,
  theme,
}) => {
  return (
    <Accordion.Root type="single" collapsible className="w-full">
      {strategies.map((strategy, index) => {
        const IconComponent = strategy.icon;

        return (
          <Accordion.Item
            key={index}
            value={`strategy-${index}`}
            style={{
              marginBottom: theme.spacing.md,
              borderRadius: theme.borderRadius.lg,
              overflow: "hidden",
              border: `1px solid ${theme.colors.gray200}`,
              boxShadow: theme.shadows.sm,
            }}
          >
            <Accordion.Header>
              <Accordion.Trigger
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  backgroundColor: theme.colors.white,
                  border: "none",
                  cursor: "pointer",
                  transition: "background-color 300ms ease",
                  fontFamily: theme.typography.fontFamilies.primary,
                  fontWeight: theme.typography.fontWeights.semibold,
                  color: theme.colors.gray900,
                  textAlign: "left",
                  minHeight: theme.dimensions.minTouchTarget, // WCAG minimum touch target
                }}
                className="group p-4 md:p-6 text-base md:text-xl"
                aria-label={`Expand ${strategy.strategy} strategy`}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = `${theme.colors.orange}20`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = theme.colors.white;
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                  }}
                  className="gap-3 md:gap-4"
                >
                  {/* Icon Circle with Orange background */}
                  <div
                    className="w-10 h-10 md:w-12 md:h-12"
                    style={{
                      borderRadius: theme.borderRadius.full,
                      backgroundColor: `${theme.colors.orange}30`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      color: theme.colors.orange,
                    }}
                    aria-hidden="true"
                  >
                    <IconComponent className="w-5 h-5 md:w-6 md:h-6" />
                  </div>

                  {/* Strategy Name */}
                  <span>{strategy.strategy}</span>
                </div>

                {/* Chevron Icon with rotation */}
                <div style={{ color: theme.colors.orange }}>
                  <ChevronDown
                    className="w-6 h-6 transition-transform duration-300 group-data-[state=open]:rotate-180"
                    aria-hidden="true"
                  />
                </div>
              </Accordion.Trigger>
            </Accordion.Header>

            <Accordion.Content
              style={{
                overflow: "hidden",
                backgroundColor: theme.colors.white,
              }}
              className="data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up"
            >
              <div
                className="p-4 md:p-6 pt-2 md:pt-4 text-sm md:text-base"
                style={{
                  fontFamily: theme.typography.fontFamilies.primary,
                  fontWeight: theme.typography.fontWeights.regular,
                  lineHeight: theme.typography.lineHeights.relaxed,
                  color: theme.colors.gray700,
                }}
              >
                {strategy.description}
              </div>
            </Accordion.Content>
          </Accordion.Item>
        );
      })}
    </Accordion.Root>
  );
};
