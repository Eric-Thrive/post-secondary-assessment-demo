import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import CaseInformationContent from "../content/CaseInformationContent";
import { k12Theme } from "@/design-system/themes/k12Theme";

const mockReportData = {
  caseInfo: {
    studentName: "John Doe",
    grade: "6th Grade",
    schoolYear: "2024-2025",
    tutor: "Mr. Smith",
    dateCreated: "January 1, 2025",
    lastUpdated: "January 15, 2025",
  },
};

describe("CaseInformationContent", () => {
  it("should render case information fields", () => {
    render(
      <CaseInformationContent
        theme={k12Theme}
        onNext={vi.fn()}
        reportData={mockReportData}
      />
    );

    expect(screen.getByText("Unique ID:")).toBeInTheDocument();
    expect(screen.getByText("John Doe")).toBeInTheDocument();
  });

  it("should render all case information fields", () => {
    render(
      <CaseInformationContent
        theme={k12Theme}
        onNext={vi.fn()}
        reportData={mockReportData}
      />
    );

    expect(screen.getByText("Unique ID:")).toBeInTheDocument();
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("Grade:")).toBeInTheDocument();
    expect(screen.getByText("6th Grade")).toBeInTheDocument();
    expect(screen.getByText("School Year:")).toBeInTheDocument();
    expect(screen.getByText("2024-2025")).toBeInTheDocument();
    expect(screen.getByText("Author:")).toBeInTheDocument();
    expect(screen.getByText("Mr. Smith")).toBeInTheDocument();
    expect(screen.getByText("Date Created:")).toBeInTheDocument();
    expect(screen.getByText("January 1, 2025")).toBeInTheDocument();
    expect(screen.getByText("Last Updated:")).toBeInTheDocument();
    expect(screen.getByText("January 15, 2025")).toBeInTheDocument();
  });

  it("should use sample data when reportData is not provided", () => {
    render(
      <CaseInformationContent
        theme={k12Theme}
        onNext={vi.fn()}
        reportData={undefined}
      />
    );

    // Should render default sample data
    expect(screen.getByText("Sarah Johnson")).toBeInTheDocument();
    expect(screen.getByText("2nd")).toBeInTheDocument();
  });

  it("should render bottom navigation with Next Section button", () => {
    render(
      <CaseInformationContent
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
      <CaseInformationContent
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
      <CaseInformationContent
        theme={k12Theme}
        onNext={undefined}
        reportData={mockReportData}
      />
    );

    expect(screen.queryByText("Next Section")).not.toBeInTheDocument();
  });

  it("should use theme typography for labels", () => {
    render(
      <CaseInformationContent
        theme={k12Theme}
        onNext={vi.fn()}
        reportData={mockReportData}
      />
    );

    const uniqueIdLabel = screen.getByText("Unique ID:");
    expect(uniqueIdLabel).toBeInTheDocument();
    expect(uniqueIdLabel.style.fontWeight).toBe(
      k12Theme.typography.fontWeights.bold.toString()
    );
  });
});
