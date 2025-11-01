import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import DocumentsReviewedContent from "../content/DocumentsReviewedContent";
import { k12Theme } from "@/design-system/themes/k12Theme";

const mockReportData = {
  documentsReviewed: [
    {
      title: "Assessment Report 1",
      author: "Dr. Jane Smith",
      date: "January 2025",
      keyFindings: "Key findings from assessment 1.",
    },
    {
      title: "Assessment Report 2",
      author: "Dr. John Doe",
      date: "February 2025",
      keyFindings: "Key findings from assessment 2.",
    },
  ],
};

describe("DocumentsReviewedContent", () => {
  it("should render section header", () => {
    render(
      <DocumentsReviewedContent
        theme={k12Theme}
        onNext={vi.fn()}
        reportData={mockReportData}
      />
    );

    expect(screen.getByText("Documents Reviewed")).toBeInTheDocument();
  });

  it("should render all document cards", () => {
    render(
      <DocumentsReviewedContent
        theme={k12Theme}
        onNext={vi.fn()}
        reportData={mockReportData}
      />
    );

    expect(screen.getByText("Assessment Report 1")).toBeInTheDocument();
    expect(screen.getByText("Dr. Jane Smith")).toBeInTheDocument();
    expect(screen.getByText("January 2025")).toBeInTheDocument();
    expect(
      screen.getByText("Key findings from assessment 1.")
    ).toBeInTheDocument();

    expect(screen.getByText("Assessment Report 2")).toBeInTheDocument();
    expect(screen.getByText("Dr. John Doe")).toBeInTheDocument();
    expect(screen.getByText("February 2025")).toBeInTheDocument();
    expect(
      screen.getByText("Key findings from assessment 2.")
    ).toBeInTheDocument();
  });

  it("should render correct number of document cards", () => {
    render(
      <DocumentsReviewedContent
        theme={k12Theme}
        onNext={vi.fn()}
        reportData={mockReportData}
      />
    );

    // Check that both documents are rendered
    const titles = screen.getAllByText(/Assessment Report/);
    expect(titles).toHaveLength(2);
  });

  it("should use sample data when reportData is not provided", () => {
    render(
      <DocumentsReviewedContent
        theme={k12Theme}
        onNext={vi.fn()}
        reportData={undefined}
      />
    );

    // Should render default sample data
    expect(
      screen.getByText("Psychoeducational Assessment Report")
    ).toBeInTheDocument();
    expect(screen.getByText("IEP Documentation")).toBeInTheDocument();
    expect(screen.getByText("Teacher Progress Notes")).toBeInTheDocument();
  });

  it("should render bottom navigation with Next Section button", () => {
    render(
      <DocumentsReviewedContent
        theme={k12Theme}
        onNext={vi.fn()}
        reportData={mockReportData}
      />
    );

    expect(screen.getByText("Next Section")).toBeInTheDocument();
  });

  it("should call onNext when Next Section button is clicked", () => {
    const handleNext = vi.fn();
    render(
      <DocumentsReviewedContent
        theme={k12Theme}
        onNext={handleNext}
        reportData={mockReportData}
      />
    );

    const nextButton = screen.getByText("Next Section").closest("button");
    if (nextButton) {
      fireEvent.click(nextButton);
      expect(handleNext).toHaveBeenCalledTimes(1);
    }
  });

  it("should not render bottom navigation when onNext is not provided", () => {
    render(
      <DocumentsReviewedContent
        theme={k12Theme}
        onNext={undefined}
        reportData={mockReportData}
      />
    );

    expect(screen.queryByText("Next Section")).not.toBeInTheDocument();
  });

  it("should handle empty documents array", () => {
    const emptyData = { documentsReviewed: [] };
    render(
      <DocumentsReviewedContent
        theme={k12Theme}
        onNext={vi.fn()}
        reportData={emptyData}
      />
    );

    // Header should still be present
    expect(screen.getByText("Documents Reviewed")).toBeInTheDocument();

    // No document cards should be rendered
    expect(screen.queryByText("Assessment Report")).not.toBeInTheDocument();
  });

  it("should use theme typography for section header", () => {
    render(
      <DocumentsReviewedContent
        theme={k12Theme}
        onNext={vi.fn()}
        reportData={mockReportData}
      />
    );

    const header = screen.getByText("Documents Reviewed");
    expect(header.style.fontSize).toBe(k12Theme.typography.fontSizes.h2);
    expect(header.style.fontWeight).toBe(
      k12Theme.typography.fontWeights.bold.toString()
    );
  });
});
