/**
 * ThriveReportSidebar Component
 *
 * Fixed left sidebar for section navigation and utility buttons.
 * Reusable across all report types (K-12, Tutoring, Post-Secondary).
 *
 * Features:
 * - Fixed sidebar with navigation buttons for sections
 * - Utility buttons section (Review, New Report, Home) below section navigation
 * - Uses design tokens for border, background, spacing
 * - ARIA labels and keyboard navigation support
 * - Scrollable content area for long section lists
 */

import React from "react";
import { ThriveReportSidebarProps } from "../types";
import NavigationButton from "../navigation/NavigationButton";

const ThriveReportSidebar: React.FC<ThriveReportSidebarProps> = ({
  sections,
  utilityButtons = [],
  currentSection,
  onSectionChange,
  theme,
  logo,
  reportTitle,
}) => {
  return (
    <div
      className="h-full flex flex-col bg-white"
      style={{
        borderRight: `2px solid ${theme.colors.secondary}`,
        boxShadow: theme.shadows.lg,
      }}
    >
      {/* Logo and Title Section */}
      {(logo || reportTitle) && (
        <div
          className="flex flex-col items-center justify-center border-b"
          style={{
            padding: theme.spacing.lg,
            borderColor: theme.colors.gray200,
          }}
        >
          {logo && (
            <img
              src={logo}
              alt="Report logo"
              className="max-w-full h-auto"
              style={{
                maxHeight: theme.dimensions.logoMaxHeight,
                marginBottom: reportTitle ? theme.spacing.md : "0",
              }}
            />
          )}
          {reportTitle && (
            <h2
              className="text-center font-semibold"
              style={{
                fontFamily: theme.typography.fontFamilies.primary,
                fontSize: theme.typography.fontSizes.h4,
                fontWeight: theme.typography.fontWeights.semibold,
                color: theme.colors.gray900,
              }}
            >
              {reportTitle}
            </h2>
          )}
        </div>
      )}

      {/* Navigation Sections - Scrollable */}
      <nav
        className="flex-1 overflow-y-auto"
        style={{
          padding: theme.spacing.md,
        }}
        role="navigation"
        aria-label="Report sections navigation"
      >
        <div className="space-y-2">
          {sections.map((section) => (
            <NavigationButton
              key={section.id}
              section={section}
              isActive={currentSection === section.id}
              theme={theme}
              onClick={() => onSectionChange(section.id)}
            />
          ))}
        </div>
      </nav>

      {/* Utility Buttons Section */}
      {utilityButtons.length > 0 && (
        <div
          className="border-t"
          style={{
            padding: theme.spacing.md,
            borderColor: theme.colors.gray200,
          }}
        >
          <div className="space-y-2">
            {utilityButtons.map((button) => {
              const IconComponent = button.icon;

              // If button has onClick handler, render as button
              if (button.onClick) {
                return (
                  <button
                    key={button.id}
                    onClick={button.onClick}
                    className="flex items-center gap-3 w-full px-4 py-3 rounded-lg transition-all duration-200 hover:shadow-md"
                    style={{
                      backgroundColor: theme.colors.gray100,
                      border: `1px solid ${theme.colors.gray200}`,
                      color: theme.colors.gray700,
                      fontFamily: theme.typography.fontFamilies.primary,
                      fontSize: theme.typography.fontSizes.body,
                      fontWeight: theme.typography.fontWeights.medium,
                      minHeight: theme.dimensions.minTouchTarget, // WCAG minimum touch target size
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor =
                        theme.colors.gray200;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor =
                        theme.colors.gray100;
                    }}
                    aria-label={button.title}
                  >
                    <IconComponent className="w-5 h-5 flex-shrink-0" />
                    <span>{button.title}</span>
                  </button>
                );
              }

              // Otherwise render as link
              return (
                <a
                  key={button.id}
                  href={button.route}
                  className="flex items-center gap-3 w-full px-4 py-3 rounded-lg transition-all duration-200 hover:shadow-md"
                  style={{
                    backgroundColor: theme.colors.gray100,
                    border: `1px solid ${theme.colors.gray200}`,
                    color: theme.colors.gray700,
                    fontFamily: theme.typography.fontFamilies.primary,
                    fontSize: theme.typography.fontSizes.body,
                    fontWeight: theme.typography.fontWeights.medium,
                    textDecoration: "none",
                    minHeight: theme.dimensions.minTouchTarget, // WCAG minimum touch target size
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor =
                      theme.colors.gray200;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor =
                      theme.colors.gray100;
                  }}
                  aria-label={button.title}
                >
                  <IconComponent className="w-5 h-5 flex-shrink-0" />
                  <span>{button.title}</span>
                </a>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ThriveReportSidebar;
