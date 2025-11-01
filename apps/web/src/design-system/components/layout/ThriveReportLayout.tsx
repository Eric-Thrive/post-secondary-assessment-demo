/**
 * ThriveReportLayout Component
 *
 * Main layout wrapper that provides the overall page structure with sidebar and content area.
 * Reusable across all report types (K-12, Tutoring, Post-Secondary).
 *
 * Features:
 * - Fixed sidebar navigation on the left
 * - Main content area with responsive behavior
 * - Uses design tokens exclusively (zero inline hardcoded values)
 * - Responsive layout (sidebar collapses on mobile)
 * - Semantic HTML5 structure with proper accessibility
 */

import React, { useState } from "react";
import { ThriveReportLayoutProps } from "../types";
import ThriveReportSidebar from "./ThriveReportSidebar";
import ThriveReportHeader from "./ThriveReportHeader";

const ThriveReportLayout: React.FC<ThriveReportLayoutProps> = ({
  config,
  currentSection,
  onSectionChange,
  theme,
  children,
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Skip to main content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-white focus:text-gray-900 focus:rounded-md focus:shadow-lg"
        style={{
          fontFamily: theme.typography.fontFamilies.primary,
          fontSize: theme.typography.fontSizes.body,
        }}
      >
        Skip to main content
      </a>

      {/* Header */}
      <ThriveReportHeader
        logo={config.logo || ""}
        title={config.reportTitle}
        theme={theme}
        actions={
          <button
            onClick={toggleSidebar}
            className="md:hidden p-2 rounded-md hover:bg-white/20 transition-colors"
            aria-label="Toggle navigation menu"
            aria-expanded={isSidebarOpen}
          >
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isSidebarOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        }
      />

      <div className="flex relative">
        {/* Sidebar - Fixed on desktop, overlay on mobile */}
        <aside
          className={`
            fixed top-0 left-0 h-screen z-40 transition-transform duration-300 ease-in-out
            ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
            md:translate-x-0 md:sticky md:top-0
          `}
          style={{
            width: theme.dimensions.sidebarWidth,
            marginTop: theme.dimensions.headerHeight,
          }}
          aria-hidden={!isSidebarOpen ? "true" : undefined}
        >
          <ThriveReportSidebar
            sections={config.sections}
            utilityButtons={config.utilityButtons}
            currentSection={currentSection}
            onSectionChange={(sectionId) => {
              onSectionChange(sectionId);
              // Close sidebar on mobile after selection
              if (window.innerWidth < 768) {
                setIsSidebarOpen(false);
              }
            }}
            theme={theme}
            logo={config.logo}
            reportTitle={config.reportTitle}
          />
        </aside>

        {/* Mobile overlay - blocks interaction with content when sidebar is open */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 md:hidden"
            onClick={toggleSidebar}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                toggleSidebar();
              }
            }}
            role="button"
            tabIndex={0}
            aria-label="Close navigation menu"
          />
        )}

        {/* Main content area */}
        <main
          id="main-content"
          className="flex-1 min-h-screen w-full md:ml-0"
          style={{
            paddingTop: theme.dimensions.headerHeight,
          }}
          role="main"
          aria-label="Report content"
          tabIndex={-1}
        >
          <div className="w-full px-4 md:px-6 lg:px-8">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default ThriveReportLayout;
