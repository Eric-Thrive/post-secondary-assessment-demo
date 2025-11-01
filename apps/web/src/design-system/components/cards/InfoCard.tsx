/**
 * InfoCard Component
 *
 * Displays label-value pairs in a semantic HTML structure.
 * Used for case information, metadata, and other key-value data.
 * Uses ThriveReportCard as wrapper and design tokens for all styling.
 */

import React from "react";
import { ThriveReportCard } from "./ThriveReportCard";
import type { InfoCardProps } from "../types";

export const InfoCard: React.FC<InfoCardProps> = ({ data, theme }) => {
  return (
    <ThriveReportCard theme={theme} variant="bordered">
      <dl className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-3 md:gap-4 m-0">
        {Object.entries(data).map(([label, value]) => (
          <React.Fragment key={label}>
            <dt
              className="text-sm md:text-base font-bold md:min-w-[160px]"
              style={{
                fontWeight: theme.typography.fontWeights.bold,
                color: theme.colors.gray900,
              }}
            >
              {label}:
            </dt>
            <dd
              className="text-sm md:text-base m-0"
              style={{
                fontWeight: theme.typography.fontWeights.regular,
                color: theme.colors.gray700,
              }}
            >
              {value}
            </dd>
          </React.Fragment>
        ))}
      </dl>
    </ThriveReportCard>
  );
};
