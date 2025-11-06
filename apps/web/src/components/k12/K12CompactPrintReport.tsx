/**
 * K12CompactPrintReport Component
 *
 * Compact single-page print layout for K-12 Teacher Guide reports.
 */

import React from "react";
import { k12Theme } from "@/design-system/themes/k12Theme";
import type { K12ReportData } from "@/utils/k12ReportParserSimple";

export interface K12CompactPrintReportProps {
  reportData: K12ReportData;
  studentName?: string;
}

const K12CompactPrintReport = React.forwardRef<
  HTMLDivElement,
  K12CompactPrintReportProps
>(({ reportData, studentName }, ref) => {
  const theme = k12Theme;
  const name = studentName || reportData.caseInfo.studentName || "Student";

  return (
    <div
      ref={ref}
      className="print-report bg-white"
      style={{
        fontFamily: theme.typography.fontFamilies.primary,
        fontSize: "8pt",
        lineHeight: "1.4",
        color: "#000000",
        width: "210mm",
        minHeight: "297mm",
        maxHeight: "297mm",
        margin: "0 auto",
        padding: "14mm",
        backgroundColor: "#ffffff",
      }}
    >
      {/* Header */}
      <div
        style={{
          marginBottom: "10px",
          paddingBottom: "6px",
          borderBottom: `2px solid ${theme.colors.skyBlue}`,
        }}
      >
        <h1
          style={{
            fontSize: "14pt",
            fontWeight: theme.typography.fontWeights.bold,
            color: theme.colors.skyBlue,
            marginBottom: "4px",
            lineHeight: "1.2",
            margin: 0,
          }}
        >
          Teacher Guide
        </h1>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "4px",
            fontSize: "7pt",
            lineHeight: "1.3",
          }}
        >
          <div>
            <span style={{ fontWeight: theme.typography.fontWeights.bold }}>
              Student:
            </span>{" "}
            {name}
          </div>
          <div>
            <span style={{ fontWeight: theme.typography.fontWeights.bold }}>
              Grade:
            </span>{" "}
            {reportData.caseInfo.grade || "N/A"}
          </div>
          <div>
            <span style={{ fontWeight: theme.typography.fontWeights.bold }}>
              School Year:
            </span>{" "}
            {reportData.caseInfo.schoolYear || "N/A"}
          </div>
          <div>
            <span style={{ fontWeight: theme.typography.fontWeights.bold }}>
              Teacher:
            </span>{" "}
            {reportData.caseInfo.tutor || "N/A"}
          </div>
          <div>
            <span style={{ fontWeight: theme.typography.fontWeights.bold }}>
              Created:
            </span>{" "}
            {reportData.caseInfo.dateCreated || new Date().toLocaleDateString()}
          </div>
          <div>
            <span style={{ fontWeight: theme.typography.fontWeights.bold }}>
              Updated:
            </span>{" "}
            {reportData.caseInfo.lastUpdated || new Date().toLocaleDateString()}
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "8px",
        }}
      >
        {/* Left Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {/* About Student */}
          <div
            style={{
              border: `1px solid ${theme.colors.skyBlue}`,
              borderRadius: theme.borderRadius.sm,
              backgroundColor: "#e0f2fe",
              padding: "6px",
            }}
          >
            <h2
              style={{
                fontSize: "9pt",
                fontWeight: theme.typography.fontWeights.bold,
                color: theme.colors.skyBlue,
                marginBottom: "4px",
                lineHeight: "1.2",
                margin: 0,
              }}
            >
              About Student
            </h2>
            <div
              style={{
                fontSize: "6.5pt",
                lineHeight: "1.4",
                color: "#374151",
              }}
            >
              {reportData.studentOverview.atAGlance
                .split("\n\n")
                .map((paragraph, index) => (
                  <p
                    key={index}
                    style={{
                      marginBottom: "4px",
                      margin: index > 0 ? "4px 0 0 0" : 0,
                    }}
                  >
                    {paragraph}
                  </p>
                ))}
            </div>
          </div>

          {/* Key Support Strategies */}
          <div
            style={{
              border: `1px solid ${theme.colors.orange}`,
              borderRadius: theme.borderRadius.sm,
              backgroundColor: "#fff7ed",
              padding: "6px",
            }}
          >
            <h2
              style={{
                fontSize: "9pt",
                fontWeight: theme.typography.fontWeights.bold,
                color: theme.colors.orange,
                marginBottom: "4px",
                lineHeight: "1.2",
                margin: 0,
              }}
            >
              Key Support Strategies
            </h2>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "3px",
              }}
            >
              {reportData.supportStrategies.map((strategy, idx) => (
                <div key={idx} style={{ fontSize: "6.5pt", lineHeight: "1.3" }}>
                  <div
                    style={{
                      fontWeight: theme.typography.fontWeights.semibold,
                      color: "#000000",
                    }}
                  >
                    {strategy.strategy}
                  </div>
                  <div style={{ color: "#4b5563", fontSize: "6pt" }}>
                    {strategy.description}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {/* Student's Strengths */}
          <div
            style={{
              border: `1px solid ${theme.colors.skyBlue}`,
              borderRadius: theme.borderRadius.sm,
              backgroundColor: "#e0f2fe",
              padding: "6px",
            }}
          >
            <h2
              style={{
                fontSize: "9pt",
                fontWeight: theme.typography.fontWeights.bold,
                color: theme.colors.skyBlue,
                marginBottom: "4px",
                lineHeight: "1.2",
                margin: 0,
              }}
            >
              Student's Strengths
            </h2>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "4px",
              }}
            >
              {reportData.studentStrengths.map((strength, idx) => (
                <div key={idx} style={{ fontSize: "6.5pt", lineHeight: "1.3" }}>
                  <div
                    style={{
                      fontWeight: theme.typography.fontWeights.semibold,
                      color: strength.color,
                      marginBottom: "2px",
                    }}
                  >
                    {strength.title}
                  </div>
                  <div style={{ paddingLeft: "4px" }}>
                    <div
                      style={{
                        fontSize: "6pt",
                        color: "#4b5563",
                        marginBottom: "1px",
                      }}
                    >
                      What You See: {strength.whatYouSee.join("; ")}
                    </div>
                    <div style={{ fontSize: "6pt", color: "#4b5563" }}>
                      What to Do:{" "}
                      {strength.whatToDo.map((item) => item.text).join("; ")}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Student's Challenges - Table */}
          <div
            style={{
              border: `1px solid ${theme.colors.orange}`,
              borderRadius: theme.borderRadius.sm,
              backgroundColor: "#fff7ed",
              padding: "6px",
            }}
          >
            <h2
              style={{
                fontSize: "9pt",
                fontWeight: theme.typography.fontWeights.bold,
                color: theme.colors.orange,
                marginBottom: "4px",
                lineHeight: "1.2",
                margin: 0,
              }}
            >
              Student's Challenges
            </h2>
            <table
              style={{
                width: "100%",
                fontSize: "6pt",
                lineHeight: "1.3",
                borderCollapse: "collapse",
              }}
            >
              <thead>
                <tr style={{ backgroundColor: "#96D7E1" }}>
                  <th
                    style={{
                      fontWeight: theme.typography.fontWeights.bold,
                      color: "#000000",
                      padding: "3px",
                      textAlign: "left",
                      borderBottom: "1px solid #64b5c6",
                      width: "30%",
                    }}
                  >
                    Challenge
                  </th>
                  <th
                    style={{
                      fontWeight: theme.typography.fontWeights.bold,
                      color: "#000000",
                      padding: "3px",
                      textAlign: "left",
                      borderBottom: "1px solid #64b5c6",
                      width: "70%",
                    }}
                  >
                    What to Do
                  </th>
                </tr>
              </thead>
              <tbody>
                {reportData.studentChallenges.map((challenge, idx) => (
                  <tr
                    key={idx}
                    style={{
                      backgroundColor: idx % 2 === 0 ? "#ffffff" : "#fed7aa",
                    }}
                  >
                    <td
                      style={{
                        padding: "3px",
                        verticalAlign: "top",
                        borderBottom:
                          idx < reportData.studentChallenges.length - 1
                            ? "1px solid #e5e7eb"
                            : "none",
                      }}
                    >
                      <div
                        style={{
                          fontWeight: theme.typography.fontWeights.semibold,
                          color: "#000000",
                        }}
                      >
                        {challenge.challenge}
                      </div>
                    </td>
                    <td
                      style={{
                        padding: "3px",
                        verticalAlign: "top",
                        borderBottom:
                          idx < reportData.studentChallenges.length - 1
                            ? "1px solid #e5e7eb"
                            : "none",
                      }}
                    >
                      <ul
                        style={{
                          margin: 0,
                          paddingLeft: "8px",
                          listStyleType: "none",
                        }}
                      >
                        {challenge.whatToDo.map((item, i) => (
                          <li
                            key={i}
                            style={{
                              marginBottom: "1px",
                              position: "relative",
                              paddingLeft: "8px",
                            }}
                          >
                            <span
                              style={{
                                position: "absolute",
                                left: 0,
                                color:
                                  item.type === "do" ? "#16a34a" : "#dc2626",
                                fontSize: "7pt",
                              }}
                            >
                              {item.type === "do" ? "✓" : "✗"}
                            </span>
                            {item.text}
                          </li>
                        ))}
                      </ul>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          borderTop: "1px solid #d1d5db",
          fontSize: "6pt",
          color: "#4b5563",
          marginTop: "8px",
          paddingTop: "4px",
          lineHeight: "1.3",
          textAlign: "center",
        }}
      >
        <p style={{ margin: 0 }}>
          This document is confidential and should be shared only with
          authorized educational staff on a need-to-know basis.
        </p>
        <p style={{ margin: 0, marginTop: "2px" }}>
          Generated on {new Date().toLocaleDateString()} | THRIVE Program |
          Teacher Support Services
        </p>
      </div>

      {/* Print-specific styles */}
      <style>{`
        @media print {
          .print-report {
            margin: 0 !important;
            padding: 14mm !important;
            font-size: 8pt !important;
            width: 210mm !important;
            max-width: 210mm !important;
          }
          
          @page {
            size: A4;
            margin: 0;
          }
          
          table {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          
          tr {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          
          h1, h2, h3 {
            page-break-after: avoid;
          }
        }
        
        @media screen {
          .print-report {
            max-width: 210mm;
            margin: 0 auto;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
          }
        }
      `}</style>
    </div>
  );
});

K12CompactPrintReport.displayName = "K12CompactPrintReport";

export default K12CompactPrintReport;
