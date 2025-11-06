/**
 * K12ReportViewer Integration Tests
 *
 * Tests the K12ReportViewer component with various parsed data formats
 * and verifies all sections display correctly with navigation.
 *
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import K12ReportViewer from "@/components/k12/K12ReportViewer";
import { parseK12Report } from "@/utils/k12ReportParser";

// Mock the design system components
vi.mock("@/design-system", () => ({
  ThriveReportLayout: ({ children, onSectionChange, currentSection }: any) => (
    <div data-testid="thrive-report-layout">
      <div data-testid="current-section">{currentSection}</div>
      <button
        data-testid="section-nav-case-info"
        onClick={() => onSectionChange("case-info")}
      >
        Case Info
      </button>
      <button
        data-testid="section-nav-student-overview"
        onClick={() => onSectionChange("student-overview")}
      >
        Student Overview
      </button>
      <button
        data-testid="section-nav-student-strengths"
        onClick={() => onSectionChange("student-strengths")}
      >
        Student Strengths
      </button>
      <button
        data-testid="section-nav-student-challenges"
        onClick={() => onSectionChange("student-challenges")}
      >
        Student Challenges
      </button>
      <button
        data-testid="section-nav-support-strategies"
        onClick={() => onSectionChange("support-strategies")}
      >
        Support Strategies
      </button>
      {children}
    </div>
  ),
  ThriveReportSection: ({ children }: any) => (
    <div data-testid="thrive-report-section">{children}</div>
  ),
}));

// Mock the section registry
vi.mock("@/components/k12/sectionRegistry", () => ({
  getSectionContent: (sectionId: string) => {
    const MockComponent = ({ reportData, onNext }: any) => (
      <div data-testid={`section-content-${sectionId}`}>
        <h2>Section: {sectionId}</h2>
        {reportData && (
          <div data-testid="report-data">
            <div data-testid="student-name">
              {reportData.caseInfo?.studentName}
            </div>
            <div data-testid="grade">{reportData.caseInfo?.grade}</div>
            {reportData.studentStrengths && (
              <div data-testid="strengths-count">
                {reportData.studentStrengths.length}
              </div>
            )}
            {reportData.studentChallenges && (
              <div data-testid="challenges-count">
                {reportData.studentChallenges.length}
              </div>
            )}
            {reportData.supportStrategies && (
              <div data-testid="strategies-count">
                {reportData.supportStrategies.length}
              </div>
            )}
          </div>
        )}
        {onNext && (
          <button data-testid="next-button" onClick={onNext}>
            Next Section
          </button>
        )}
      </div>
    );
    return MockComponent;
  },
}));

// Mock the k12Config
vi.mock("@/components/k12/k12Config", () => ({
  k12Config: {
    theme: {
      colors: {
        primary: "#2563eb",
        gray600: "#6b7280",
        gray900: "#111827",
        white: "#ffffff",
      },
      typography: {
        fontFamilies: {
          primary: "Inter, sans-serif",
        },
        fontSizes: {
          h2: "1.5rem",
          body: "1rem",
          bodyLarge: "1.125rem",
        },
        fontWeights: {
          bold: "700",
          medium: "500",
        },
      },
      spacing: {
        md: "1rem",
      },
    },
    sections: [
      { id: "case-info", title: "Case Information" },
      { id: "student-overview", title: "Student Overview" },
      { id: "student-strengths", title: "Student Strengths" },
      { id: "student-challenges", title: "Student Challenges" },
      { id: "support-strategies", title: "Support Strategies" },
    ],
    utilityButtons: [
      { id: "review", label: "Review", route: "/k12-review-edit/:caseId" },
    ],
  },
  getNextSection: (currentSection: string) => {
    const sections = [
      "case-info",
      "student-overview",
      "student-strengths",
      "student-challenges",
      "support-strategies",
    ];
    const currentIndex = sections.indexOf(currentSection);
    return currentIndex < sections.length - 1
      ? sections[currentIndex + 1]
      : null;
  },
}));

// Test data - various K-12 markdown report formats
const sampleMarkdownReports = {
  comprehensive: `
# Student Support Report

## Case Information
Student Name: Sarah Johnson
Grade: 5th Grade
School Year: 2024-2025
Tutor: Ms. Anderson
Analysis Date: October 31, 2024

## Student Overview
Sarah is a bright, thoughtful student who thrives with small changes to her instruction. She enjoys reading and has strong verbal communication skills. Sarah works best in quiet environments and benefits from visual supports.

### Academic & Learning Profile
Sarah demonstrates strong reading comprehension and vocabulary skills. She excels in creative writing and enjoys discussing books with peers.

### Challenges & Diagnosis
Sarah struggles with math computation and has difficulty with sustained attention during lengthy tasks.

### Social-Emotional & Supports
Sarah is well-liked by peers and enjoys collaborative learning when properly structured.

## Key Support Strategies
- Use strengths: Leverage Sarah's strong verbal skills to support math learning
- Support challenges: Provide visual math supports and break tasks into smaller chunks
- Small changes: Offer quiet workspace options and movement breaks
- Don't underestimate: Sarah's potential for growth with appropriate supports

## Section 1: Strengths

### Spoken Language
**What You See:**
- Excellent vocabulary and verbal expression
- Enjoys storytelling and creative narratives
- Asks thoughtful questions during discussions

**What to Do:**
✔ Encourage verbal explanations of thinking processes
✔ Use discussion-based learning activities
✘ Don't limit opportunities for verbal participation

### Social Interaction
**What You See:**
- Works well with familiar peers
- Shows empathy and consideration for others
- Enjoys collaborative projects

**What to Do:**
✔ Provide structured group work opportunities
✔ Pair with supportive classmates
✘ Don't force large group interactions

### Reasoning
**What You See:**
- Strong logical thinking in familiar contexts
- Good problem-solving with adequate time
- Makes connections between concepts

**What to Do:**
✔ Allow extra processing time
✔ Use visual organizers for complex problems
✘ Don't rush through reasoning tasks

## Section 2: Challenges

### Attention and Focus
**What You See:**
- Difficulty sustaining attention during long tasks
- Easily distracted by environmental stimuli
- Needs frequent redirection

**What to Do:**
✔ Break tasks into smaller segments
✔ Provide movement breaks every 15-20 minutes
✔ Use visual timers and schedules
✘ Don't expect sustained focus for more than 20 minutes

### Math Computation
**What You See:**
- Struggles with multi-step math problems
- Makes computational errors under time pressure
- Avoids math tasks when possible

**What to Do:**
✔ Provide step-by-step visual guides
✔ Allow use of calculator for complex computations
✔ Connect math to real-world examples
✘ Don't emphasize speed over accuracy
  `,

  minimal: `
# K-12 Assessment Report

Student: Alex Chen
Grade: 3rd

## Overview
Alex is a creative student who learns best with hands-on activities.

## Strengths
- Creative thinking
- Artistic abilities
- Kind to others

## Challenges  
- Reading fluency
- Following multi-step directions

## Strategies
- Use visual supports
- Provide extra time
- Break down instructions
  `,

  malformed: `
This is not a properly formatted report.
Some random text without proper sections.
Student might be mentioned somewhere.
No clear structure or headers.
  `,
};

// Helper function to render component with router
const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe("K12ReportViewer Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Comprehensive Report Display", () => {
    it("should display parsed comprehensive report data correctly", async () => {
      const parsedData = parseK12Report(sampleMarkdownReports.comprehensive);

      renderWithRouter(
        <K12ReportViewer
          reportData={parsedData}
          caseId="test-case-123"
          initialSection="case-info"
        />
      );

      // Verify layout is rendered
      expect(screen.getByTestId("thrive-report-layout")).toBeInTheDocument();

      // Verify initial section is displayed
      expect(screen.getByTestId("current-section")).toHaveTextContent(
        "case-info"
      );

      // Verify case information is displayed
      await waitFor(() => {
        expect(screen.getByTestId("student-name")).toHaveTextContent(
          "Sarah Johnson"
        );
        expect(screen.getByTestId("grade")).toHaveTextContent("5th Grade");
      });
    });

    it("should display all sections with correct data counts", async () => {
      const parsedData = parseK12Report(sampleMarkdownReports.comprehensive);

      renderWithRouter(
        <K12ReportViewer
          reportData={parsedData}
          caseId="test-case-123"
          initialSection="student-strengths"
        />
      );

      await waitFor(() => {
        // Verify strengths count (parser may extract 4 strengths from comprehensive report)
        expect(screen.getByTestId("strengths-count")).toHaveTextContent("4");
      });

      // Navigate to challenges section
      fireEvent.click(screen.getByTestId("section-nav-student-challenges"));

      await waitFor(() => {
        expect(screen.getByTestId("current-section")).toHaveTextContent(
          "student-challenges"
        );
        // Verify challenges count (parser may extract 3 challenges from comprehensive report)
        expect(screen.getByTestId("challenges-count")).toHaveTextContent("3");
      });

      // Navigate to strategies section
      fireEvent.click(screen.getByTestId("section-nav-support-strategies"));

      await waitFor(() => {
        expect(screen.getByTestId("current-section")).toHaveTextContent(
          "support-strategies"
        );
        // Verify strategies count (should have 4 based on parsing)
        expect(screen.getByTestId("strategies-count")).toHaveTextContent("4");
      });
    });
  });

  describe("Navigation Between Sections", () => {
    it("should navigate between sections correctly", async () => {
      const parsedData = parseK12Report(sampleMarkdownReports.comprehensive);

      renderWithRouter(
        <K12ReportViewer
          reportData={parsedData}
          caseId="test-case-123"
          initialSection="case-info"
        />
      );

      // Start at case-info
      expect(screen.getByTestId("current-section")).toHaveTextContent(
        "case-info"
      );

      // Navigate to student overview
      fireEvent.click(screen.getByTestId("section-nav-student-overview"));
      await waitFor(() => {
        expect(screen.getByTestId("current-section")).toHaveTextContent(
          "student-overview"
        );
      });

      // Navigate to strengths
      fireEvent.click(screen.getByTestId("section-nav-student-strengths"));
      await waitFor(() => {
        expect(screen.getByTestId("current-section")).toHaveTextContent(
          "student-strengths"
        );
      });

      // Navigate to challenges
      fireEvent.click(screen.getByTestId("section-nav-student-challenges"));
      await waitFor(() => {
        expect(screen.getByTestId("current-section")).toHaveTextContent(
          "student-challenges"
        );
      });

      // Navigate to strategies
      fireEvent.click(screen.getByTestId("section-nav-support-strategies"));
      await waitFor(() => {
        expect(screen.getByTestId("current-section")).toHaveTextContent(
          "support-strategies"
        );
      });
    });

    it("should handle next section navigation", async () => {
      const parsedData = parseK12Report(sampleMarkdownReports.comprehensive);

      renderWithRouter(
        <K12ReportViewer
          reportData={parsedData}
          caseId="test-case-123"
          initialSection="case-info"
        />
      );

      // Click next button to go to student-overview
      fireEvent.click(screen.getByTestId("next-button"));

      await waitFor(() => {
        expect(screen.getByTestId("current-section")).toHaveTextContent(
          "student-overview"
        );
      });
    });

    it("should call onSectionChange callback when provided", async () => {
      const parsedData = parseK12Report(sampleMarkdownReports.comprehensive);
      const onSectionChange = vi.fn();

      renderWithRouter(
        <K12ReportViewer
          reportData={parsedData}
          caseId="test-case-123"
          initialSection="case-info"
          onSectionChange={onSectionChange}
        />
      );

      // Navigate to different section
      fireEvent.click(screen.getByTestId("section-nav-student-overview"));

      await waitFor(() => {
        expect(onSectionChange).toHaveBeenCalledWith("student-overview");
      });
    });
  });

  describe("Minimal Report Handling", () => {
    it("should handle minimal report format gracefully", async () => {
      const parsedData = parseK12Report(sampleMarkdownReports.minimal);

      renderWithRouter(
        <K12ReportViewer
          reportData={parsedData}
          caseId="test-case-456"
          initialSection="case-info"
        />
      );

      // Verify basic case information is extracted
      await waitFor(() => {
        expect(screen.getByTestId("student-name")).toHaveTextContent("Alex");
        expect(screen.getByTestId("grade")).toHaveTextContent("3rd");
      });

      // Navigate to strengths and verify it has some content
      fireEvent.click(screen.getByTestId("section-nav-student-strengths"));

      await waitFor(() => {
        expect(screen.getByTestId("current-section")).toHaveTextContent(
          "student-strengths"
        );
        // Should have at least default strengths
        const strengthsCount = screen.getByTestId("strengths-count");
        expect(parseInt(strengthsCount.textContent || "0")).toBeGreaterThan(0);
      });
    });
  });

  describe("Malformed Report Handling", () => {
    it("should handle malformed reports with default data", async () => {
      const parsedData = parseK12Report(sampleMarkdownReports.malformed);

      renderWithRouter(
        <K12ReportViewer
          reportData={parsedData}
          caseId="test-case-789"
          initialSection="case-info"
        />
      );

      // Should display default case information
      await waitFor(() => {
        expect(screen.getByTestId("student-name")).toHaveTextContent("Student");
        expect(screen.getByTestId("grade")).toHaveTextContent(
          "Grade Not Specified"
        );
      });

      // Should still be able to navigate to other sections
      fireEvent.click(screen.getByTestId("section-nav-student-strengths"));

      await waitFor(() => {
        expect(screen.getByTestId("current-section")).toHaveTextContent(
          "student-strengths"
        );
        // Should have default strengths
        expect(screen.getByTestId("strengths-count")).toHaveTextContent("1");
      });
    });
  });

  describe("Case Information Display", () => {
    it("should properly display case information from various formats", async () => {
      const testCases = [
        {
          markdown: sampleMarkdownReports.comprehensive,
          expectedName: "Sarah Johnson",
          expectedGrade: "5th Grade",
        },
        {
          markdown: sampleMarkdownReports.minimal,
          expectedName: "Alex",
          expectedGrade: "3rd",
        },
      ];

      for (const testCase of testCases) {
        const parsedData = parseK12Report(testCase.markdown);

        const { unmount } = renderWithRouter(
          <K12ReportViewer
            reportData={parsedData}
            caseId="test-case"
            initialSection="case-info"
          />
        );

        await waitFor(() => {
          expect(screen.getByTestId("student-name")).toHaveTextContent(
            testCase.expectedName
          );
          expect(screen.getByTestId("grade")).toHaveTextContent(
            testCase.expectedGrade
          );
        });

        unmount();
      }
    });
  });

  describe("Error Handling", () => {
    it("should handle missing reportData gracefully", () => {
      renderWithRouter(
        <K12ReportViewer
          caseId="test-case-no-data"
          initialSection="case-info"
        />
      );

      // Should still render the layout
      expect(screen.getByTestId("thrive-report-layout")).toBeInTheDocument();
      expect(screen.getByTestId("current-section")).toHaveTextContent(
        "case-info"
      );
    });

    it("should handle invalid section gracefully", () => {
      const parsedData = parseK12Report(sampleMarkdownReports.comprehensive);

      renderWithRouter(
        <K12ReportViewer
          reportData={parsedData}
          caseId="test-case"
          initialSection="invalid-section"
          as
          any
        />
      );

      // Should still render and allow navigation to valid sections
      expect(screen.getByTestId("thrive-report-layout")).toBeInTheDocument();

      // Should be able to navigate to valid section
      fireEvent.click(screen.getByTestId("section-nav-case-info"));

      expect(screen.getByTestId("current-section")).toHaveTextContent(
        "case-info"
      );
    });
  });

  describe("URL Hash Integration", () => {
    it("should update URL hash when section changes", async () => {
      const parsedData = parseK12Report(sampleMarkdownReports.comprehensive);

      renderWithRouter(
        <K12ReportViewer
          reportData={parsedData}
          caseId="test-case"
          initialSection="case-info"
        />
      );

      // Navigate to different section
      fireEvent.click(screen.getByTestId("section-nav-student-overview"));

      await waitFor(() => {
        expect(window.location.hash).toBe("#student-overview");
      });
    });
  });
});
