/**
 * PDFReport Component
 *
 * Condensed single-page PDF layout for K-12 Teacher Guide reports.
 * Designed to fit on A4 page with neurodiverse-friendly spacing and clear hierarchy.
 *
 * Features:
 * - Compact layout optimized for printing
 * - Uses design tokens exclusively for styling
 * - Clear visual hierarchy with section headers
 * - Neurodiverse-friendly spacing and typography
 * - All report sections included in condensed format
 *
 * Requirements: 12.2, 12.3
 */

import React from "react";
import { k12Theme } from "@/design-system/themes/k12Theme";
import type {
  CaseInformation,
  Document,
  StudentOverview,
  Strategy,
  Strength,
  Challenge,
} from "@/design-system/components/types";

/**
 * Props for PDFReport component
 */
export interface PDFReportProps {
  /**
   * Report data containing all sections
   */
  reportData: {
    caseInfo: CaseInformation;
    documentsReviewed: Document[];
    studentOverview: StudentOverview;
    supportStrategies: Strategy[];
    studentStrengths: Strength[];
    studentChallenges: Challenge[];
  };
}

/**
 * PDFReport Component
 *
 * Renders a print-optimized, single-page layout of the complete teacher guide.
 */
const PDFReport: React.FC<PDFReportProps> = ({ reportData }) => {
  const theme = k12Theme;

  return (
    <div
      id="pdf-report"
      style={{
        width: "210mm", // A4 width
        minHeight: "297mm", // A4 height
        padding: "10mm",
        backgroundColor: theme.colors.white,
        fontFamily: theme.typography.fontFamilies.primary,
        fontSize: theme.pdfDimensions.fontSize.body,
        lineHeight: "1.3",
        color: theme.colors.gray900,
        boxSizing: "border-box",
      }}
    >
      {/* Header */}
      <div
        style={{
          background: theme.gradients.header,
          padding: theme.pdfDimensions.padding.md,
          borderRadius: theme.borderRadius.md,
          marginBottom: theme.pdfDimensions.spacing.lg,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h1
          style={{
            fontSize: theme.pdfDimensions.fontSize.title,
            fontWeight: theme.typography.fontWeights.bold,
            color: theme.colors.white,
            margin: 0,
          }}
        >
          K-12 Teacher Guide
        </h1>
        <div
          style={{
            fontSize: theme.pdfDimensions.fontSize.subheading,
            color: theme.colors.white,
            fontWeight: theme.typography.fontWeights.medium,
          }}
        >
          {reportData.caseInfo.studentName}
        </div>
      </div>

      {/* Two-column layout for compact presentation */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "8px",
        }}
      >
        {/* Left Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {/* Case Information */}
          <Section title="Case Information" theme={theme}>
            <InfoGrid
              data={{
                Student: reportData.caseInfo.studentName,
                Grade: reportData.caseInfo.grade,
                "School Year": reportData.caseInfo.schoolYear,
                Author: reportData.caseInfo.tutor,
                Created: reportData.caseInfo.dateCreated,
                Updated: reportData.caseInfo.lastUpdated,
              }}
              theme={theme}
            />
          </Section>

          {/* Documents Reviewed */}
          <Section title="Documents Reviewed" theme={theme}>
            {reportData.documentsReviewed.map((doc, index) => (
              <div
                key={index}
                style={{
                  marginBottom:
                    index < reportData.documentsReviewed.length - 1 ? "6px" : 0,
                  paddingBottom:
                    index < reportData.documentsReviewed.length - 1 ? "6px" : 0,
                  borderBottom:
                    index < reportData.documentsReviewed.length - 1
                      ? `1px solid ${theme.colors.gray200}`
                      : "none",
                }}
              >
                <div
                  style={{
                    fontWeight: theme.typography.fontWeights.semibold,
                    fontSize: theme.pdfDimensions.fontSize.body,
                    marginBottom: theme.pdfDimensions.spacing.xs,
                  }}
                >
                  {doc.title}
                </div>
                <div
                  style={{
                    fontSize: theme.pdfDimensions.fontSize.small,
                    color: theme.colors.gray600,
                    marginBottom: theme.pdfDimensions.spacing.xs,
                  }}
                >
                  {doc.author} • {doc.date}
                </div>
                <div
                  style={{
                    fontSize: theme.pdfDimensions.fontSize.small,
                    lineHeight: "1.3",
                  }}
                >
                  {doc.keyFindings}
                </div>
              </div>
            ))}
          </Section>

          {/* Student Overview - At a Glance */}
          <Section title="Student Overview" theme={theme}>
            <div
              style={{
                backgroundColor: `${theme.colors.yellow}40`,
                padding: theme.pdfDimensions.padding.sm,
                borderRadius: theme.borderRadius.sm,
                marginBottom: theme.pdfDimensions.spacing.md,
              }}
            >
              <div
                style={{
                  fontWeight: theme.typography.fontWeights.semibold,
                  fontSize: theme.pdfDimensions.fontSize.body,
                  marginBottom: theme.pdfDimensions.spacing.sm,
                }}
              >
                At a Glance
              </div>
              <div
                style={{
                  fontSize: theme.pdfDimensions.fontSize.small,
                  lineHeight: "1.3",
                }}
              >
                {reportData.studentOverview.atAGlance}
              </div>
            </div>

            {/* Overview Subsections */}
            {reportData.studentOverview.sections.map((section, index) => (
              <div
                key={index}
                style={{
                  marginBottom:
                    index < reportData.studentOverview.sections.length - 1
                      ? theme.pdfDimensions.spacing.md
                      : 0,
                }}
              >
                <div
                  style={{
                    fontWeight: theme.typography.fontWeights.semibold,
                    fontSize: theme.pdfDimensions.fontSize.body,
                    color: section.color,
                    marginBottom: theme.pdfDimensions.spacing.xs,
                  }}
                >
                  {section.title}
                </div>
                <div
                  style={{
                    fontSize: theme.pdfDimensions.fontSize.small,
                    lineHeight: "1.3",
                  }}
                >
                  {section.content}
                </div>
              </div>
            ))}
          </Section>
        </div>

        {/* Right Column */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: theme.pdfDimensions.spacing.lg,
          }}
        >
          {/* Key Support Strategies */}
          <Section title="Key Support Strategies" theme={theme}>
            {reportData.supportStrategies.map((strategy, index) => (
              <div
                key={index}
                style={{
                  marginBottom:
                    index < reportData.supportStrategies.length - 1
                      ? theme.pdfDimensions.spacing.md
                      : 0,
                  paddingBottom:
                    index < reportData.supportStrategies.length - 1
                      ? theme.pdfDimensions.spacing.md
                      : 0,
                  borderBottom:
                    index < reportData.supportStrategies.length - 1
                      ? `${theme.dimensions.borderThin} solid ${theme.colors.gray200}`
                      : "none",
                }}
              >
                <div
                  style={{
                    fontWeight: theme.typography.fontWeights.semibold,
                    fontSize: theme.pdfDimensions.fontSize.body,
                    color: theme.colors.orange,
                    marginBottom: theme.pdfDimensions.spacing.xs,
                  }}
                >
                  {strategy.strategy}
                </div>
                <div
                  style={{
                    fontSize: theme.pdfDimensions.fontSize.small,
                    lineHeight: "1.3",
                  }}
                >
                  {strategy.description}
                </div>
              </div>
            ))}
          </Section>

          {/* Student's Strengths */}
          <Section title="Student's Strengths" theme={theme}>
            {reportData.studentStrengths.map((strength, index) => (
              <div
                key={index}
                style={{
                  marginBottom:
                    index < reportData.studentStrengths.length - 1
                      ? theme.pdfDimensions.spacing.md
                      : 0,
                  paddingBottom:
                    index < reportData.studentStrengths.length - 1
                      ? theme.pdfDimensions.spacing.md
                      : 0,
                  borderBottom:
                    index < reportData.studentStrengths.length - 1
                      ? `${theme.dimensions.borderThin} solid ${theme.colors.gray200}`
                      : "none",
                }}
              >
                <div
                  style={{
                    fontWeight: theme.typography.fontWeights.semibold,
                    fontSize: theme.pdfDimensions.fontSize.body,
                    color: strength.color,
                    marginBottom: theme.pdfDimensions.spacing.xs,
                  }}
                >
                  {strength.title}
                </div>
                <div
                  style={{
                    fontSize: theme.pdfDimensions.fontSize.small,
                    marginBottom: theme.pdfDimensions.spacing.sm,
                  }}
                >
                  <span
                    style={{
                      fontWeight: theme.typography.fontWeights.medium,
                      fontSize: theme.pdfDimensions.fontSize.small,
                    }}
                  >
                    What You See:
                  </span>{" "}
                  {strength.whatYouSee.join("; ")}
                </div>
                <div style={{ fontSize: theme.pdfDimensions.fontSize.small }}>
                  <span
                    style={{
                      fontWeight: theme.typography.fontWeights.medium,
                      fontSize: theme.pdfDimensions.fontSize.small,
                    }}
                  >
                    What to Do:
                  </span>{" "}
                  {strength.whatToDo
                    .filter((item) => item.type === "do")
                    .map((item) => item.text)
                    .join("; ")}
                </div>
              </div>
            ))}
          </Section>

          {/* Student's Challenges */}
          <Section title="Student's Challenges" theme={theme}>
            {reportData.studentChallenges.map((challenge, index) => (
              <div
                key={index}
                style={{
                  marginBottom:
                    index < reportData.studentChallenges.length - 1
                      ? theme.pdfDimensions.spacing.md
                      : 0,
                  paddingBottom:
                    index < reportData.studentChallenges.length - 1
                      ? theme.pdfDimensions.spacing.md
                      : 0,
                  borderBottom:
                    index < reportData.studentChallenges.length - 1
                      ? `${theme.dimensions.borderThin} solid ${theme.colors.gray200}`
                      : "none",
                  backgroundColor:
                    index % 2 === 0
                      ? theme.colors.white
                      : `${theme.colors.orange}10`,
                  padding: theme.pdfDimensions.padding.sm,
                  borderRadius: theme.borderRadius.sm,
                }}
              >
                <div
                  style={{
                    fontWeight: theme.typography.fontWeights.semibold,
                    fontSize: theme.pdfDimensions.fontSize.body,
                    color: theme.colors.orange,
                    marginBottom: theme.pdfDimensions.spacing.xs,
                  }}
                >
                  {challenge.challenge}
                </div>
                <div
                  style={{
                    fontSize: theme.pdfDimensions.fontSize.small,
                    marginBottom: theme.pdfDimensions.spacing.sm,
                  }}
                >
                  <span
                    style={{
                      fontWeight: theme.typography.fontWeights.medium,
                      fontSize: theme.pdfDimensions.fontSize.small,
                    }}
                  >
                    What You See:
                  </span>{" "}
                  {challenge.whatYouSee.join("; ")}
                </div>
                <div style={{ fontSize: theme.pdfDimensions.fontSize.small }}>
                  <span
                    style={{
                      fontWeight: theme.typography.fontWeights.medium,
                      fontSize: theme.pdfDimensions.fontSize.small,
                    }}
                  >
                    What to Do:
                  </span>{" "}
                  {challenge.whatToDo
                    .filter((item) => item.type === "do")
                    .map((item) => item.text)
                    .join("; ")}
                </div>
              </div>
            ))}
          </Section>
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          marginTop: theme.pdfDimensions.spacing.lg,
          paddingTop: theme.pdfDimensions.padding.sm,
          borderTop: `${theme.dimensions.borderThin} solid ${theme.colors.gray200}`,
          fontSize: theme.pdfDimensions.fontSize.tiny,
          color: theme.colors.gray600,
          textAlign: "center",
        }}
      >
        Generated on {new Date().toLocaleDateString()} • THRIVE K-12 Teacher
        Guide
      </div>
    </div>
  );
};

/**
 * Section Component
 * Reusable section wrapper with consistent styling
 */
interface SectionProps {
  title: string;
  theme: typeof k12Theme;
  children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ title, theme, children }) => (
  <div
    style={{
      border: `${theme.dimensions.borderThin} solid ${theme.colors.gray200}`,
      borderRadius: theme.borderRadius.sm,
      padding: theme.pdfDimensions.padding.sm,
      backgroundColor: theme.colors.white,
    }}
  >
    <h2
      style={{
        fontSize: theme.pdfDimensions.fontSize.heading,
        fontWeight: theme.typography.fontWeights.bold,
        color: theme.colors.navyBlue,
        marginBottom: theme.pdfDimensions.spacing.md,
        paddingBottom: theme.pdfDimensions.spacing.sm,
        borderBottom: `${theme.dimensions.borderMedium} solid ${theme.colors.skyBlue}`,
      }}
    >
      {title}
    </h2>
    {children}
  </div>
);

/**
 * InfoGrid Component
 * Displays label-value pairs in a compact grid
 */
interface InfoGridProps {
  data: Record<string, string>;
  theme: typeof k12Theme;
}

const InfoGrid: React.FC<InfoGridProps> = ({ data, theme }) => (
  <div
    style={{
      display: "grid",
      gridTemplateColumns: "auto 1fr",
      gap: `${theme.pdfDimensions.spacing.sm} ${theme.pdfDimensions.spacing.md}`,
      fontSize: theme.pdfDimensions.fontSize.small,
    }}
  >
    {Object.entries(data).map(([label, value]) => (
      <React.Fragment key={label}>
        <div
          style={{
            fontWeight: theme.typography.fontWeights.semibold,
            color: theme.colors.gray700,
          }}
        >
          {label}:
        </div>
        <div style={{ color: theme.colors.gray900 }}>{value}</div>
      </React.Fragment>
    ))}
  </div>
);

export default PDFReport;
