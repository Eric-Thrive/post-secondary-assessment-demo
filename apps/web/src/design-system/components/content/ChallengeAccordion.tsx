/**
 * ChallengeAccordion Component
 *
 * Expandable challenge cards with "What You See" and "What to Do" sections.
 * Uses orange/yellow theme and Check/X icons for do/don't items.
 */

import React from "react";
import * as Accordion from "@radix-ui/react-accordion";
import { ChevronDown, Check, X, AlertTriangle } from "lucide-react";
import type { ChallengeAccordionProps } from "../types";

export const ChallengeAccordion: React.FC<ChallengeAccordionProps> = ({
  challenges,
  theme,
}) => {
  return (
    <Accordion.Root type="single" collapsible className="w-full">
      {challenges.map((challenge, index) => {
        return (
          <Accordion.Item
            key={index}
            value={`challenge-${index}`}
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
                  backgroundColor:
                    index % 2 === 0
                      ? `${theme.colors.orange}20`
                      : theme.colors.white,
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
                aria-label={`Expand ${challenge.challenge} challenge`}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor =
                    index % 2 === 0
                      ? `${theme.colors.orange}30`
                      : `${theme.colors.gray100}`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor =
                    index % 2 === 0
                      ? `${theme.colors.orange}20`
                      : theme.colors.white;
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
                    <AlertTriangle className="w-5 h-5 md:w-6 md:h-6" />
                  </div>

                  {/* Challenge Title */}
                  <span>{challenge.challenge}</span>
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
                  <ul className="list-disc pl-5 md:pl-6 m-0">
                    {challenge.whatYouSee.map((item, idx) => (
                      <li
                        key={idx}
                        className="mb-2 text-sm md:text-base"
                        style={{
                          fontFamily: theme.typography.fontFamilies.primary,
                          fontWeight: theme.typography.fontWeights.regular,
                          lineHeight: theme.typography.lineHeights.relaxed,
                          color: theme.colors.gray700,
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
                    {challenge.whatToDo
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
                    {challenge.whatToDo
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
