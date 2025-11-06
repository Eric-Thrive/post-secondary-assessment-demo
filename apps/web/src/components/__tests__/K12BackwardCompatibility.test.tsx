import React from "react";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { describe, it, expect, vi } from "vitest";
import K12ReportGenerator from "@/components/K12ReportGenerator";

// Mock the hooks
vi.mock("@/hooks/useModuleAssessmentData", () => ({
  useModuleAssessmentData: vi.fn(() => ({
    assessmentCases: [],
    isLoading: true,
  })),
}));

vi.mock("@/hooks/useModuleReportCase", () => ({
  useModuleReportCase: vi.fn(() => ({
    currentCase: null,
    selectedCaseId: null,
    displayableCases: [],
  })),
}));

vi.mock("@/hooks/useMarkdownReport", () => ({
  useMarkdownReport: vi.fn(() => ({
    markdownReport: null,
    hasAnalysisResult: false,
  })),
}));

// Mock BaseReportGenerator
vi.mock("@/components/BaseReportGenerator", () => ({
  default: () => <div data-testid="base-report-generator">Fallback</div>,
}));

describe("K12 Backward Compatibility", () => {
  it("should fall back to BaseReportGenerator when loading", () => {
    render(
      <BrowserRouter>
        <K12ReportGenerator />
      </BrowserRouter>
    );

    expect(screen.getByTestId("base-report-generator")).toBeInTheDocument();
  });
});
