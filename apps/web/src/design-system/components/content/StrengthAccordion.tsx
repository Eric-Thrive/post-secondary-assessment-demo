/**
 * StrengthAccordion Component
 *
 * Expandable strength cards with "What You See" and "What to Do" sections.
 * Uses color-coded styling and Check/X icons for do/don't items.
 */

import React from "react";
import * as Accordion from "@radix-ui/react-accordion";
import { ChevronDown, Check, X } from "lucide-react";
import type { StrengthAccordionProps } from "../types";

export const StrengthAccordion: React.FC<StrengthAccordionProps> = ({
  strengths,
  theme,
}) => {
  return (
    <Accordion.Root type="single" collapsible className="w-full">
      {strengths.map((strength, index) => {
        return (
          <Accordion.Item
            key={index}
            value={`strength-${index}`}
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
                  backgroundColor: strength.bgColor,
                  border: "none",
                  cursor: "pointer",
                  transition: "opacity 300ms ease",
                  fontFamily: theme.typography.fontFamilies.primary,
                  fontWeight: theme.typography.fontWeights.semibold,
                  color: strength.color,
                  textAlign: "left",
                  minHeight: theme.dimensions.minTouchTarget, // WCAG minimum touch target
                }}
                className="group p-4 md:p-6 text-base md:text-xl"
                aria-label={`Expand ${strength.title} strength`}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = "0.9";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = "1";
                }}
              >
                <span>{strength.title}</span>

                {/* Chevron Icon with rotation */}
                <div style={{ color: strength.color }}>
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
              <div className="p-4 md:p-6">
                {/* What You See Section */}
                <div className="mb-4 md:mb-6">
                  <h4
                    className="mb-3 md:mb-4 text-base md:text-lg"
                    style={{
                      fontFamily: theme.typography.fontFamilies.primary,
                      fontWeight: theme.typography.fontWeights.semibold,
                      color: theme.colors.gray900,
                    }}
                  >
                    What You See
                  </h4>
                  <ul className="pl-0 m-0">
                    {strength.whatYouSee.map((item, idx) => (
                      <li
                        key={idx}
                        className="mb-2 text-sm md:text-base"
                        style={{
                          fontFamily: theme.typography.fontFamilies.primary,
                          fontWeight: theme.typography.fontWeights.regular,
                          lineHeight: theme.typography.lineHeights.relaxed,
                          color: theme.colors.gray700,
                          listStyle: "none",
                        }}
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* What to Do Section */}
                <div>
                  <h4
                    className="mb-3 md:mb-4 text-base md:text-lg"
                    style={{
                      fontFamily: theme.typography.fontFamilies.primary,
                      fontWeight: theme.typography.fontWeights.semibold,
                      color: theme.colors.gray900,
                    }}
                  >
                    What to Do
                  </h4>
                  <div className="flex flex-col gap-2">
                    {/* Display "do" items first */}
                    {strength.whatToDo
                      .filter((item) => item.type === "do")
                      .map((item, idx) => (
                        <div
                          key={`do-${idx}`}
                          className="flex items-start gap-2"
                        >
                          <div
                            style={{
                              color: theme.colors.success,
                              marginTop: theme.spacing.micro,
                            }}
                          >
                            <Check
                              className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0"
                              aria-label="Do"
                            />
                          </div>
                          <span
                            className="text-sm md:text-base"
                            style={{
                              fontFamily: theme.typography.fontFamilies.primary,
                              fontWeight: theme.typography.fontWeights.regular,
                              lineHeight: theme.typography.lineHeights.relaxed,
                              color: theme.colors.gray700,
                            }}
                          >
                            {item.text}
                          </span>
                        </div>
                      ))}

                    {/* Display "don't" items below */}
                    {strength.whatToDo
                      .filter((item) => item.type === "dont")
                      .map((item, idx) => (
                        <div
                          key={`dont-${idx}`}
                          className="flex items-start gap-2"
                        >
                          <div
                            style={{
                              color: "#dc2626", // Red color for X marks
                              marginTop: theme.spacing.micro,
                            }}
                          >
                            <X
                              className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0"
                              aria-label="Don't"
                            />
                          </div>
                          <span
                            className="text-sm md:text-base"
                            style={{
                              fontFamily: theme.typography.fontFamilies.primary,
                              fontWeight: theme.typography.fontWeights.regular,
                              lineHeight: theme.typography.lineHeights.relaxed,
                              color: theme.colors.gray700,
                            }}
                          >
                            {item.text}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </Accordion.Content>
          </Accordion.Item>
        );
      })}
    </Accordion.Root>
  );
};
