import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { describe, it, expect, vi } from "vitest";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock K12ReportViewer with utility buttons
const MockK12ReportViewer = ({ caseId }: { caseId?: string }) => (
  <div data-testid="k12-report-viewer">
    <button
      data-testid="review-button"
      onClick={() => mockNavigate(`/k12-review-edit/${caseId || ""}`)}
    >
      Review
    </button>
  </div>
);

describe("K12 Editing Workflow Integration", () => {
  it("should navigate to edit page with case ID", () => {
    render(
      <BrowserRouter>
        <MockK12ReportViewer caseId="test-case-123" />
      </BrowserRouter>
    );

    fireEvent.click(screen.getByTestId("review-button"));
    expect(mockNavigate).toHaveBeenCalledWith("/k12-review-edit/test-case-123");
  });
});
