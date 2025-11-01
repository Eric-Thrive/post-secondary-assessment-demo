import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import PDFDownloadButton from "../PDFDownloadButton";
import { k12Theme } from "@/design-system/themes/k12Theme";

// Mock html2canvas and jsPDF
vi.mock("html2canvas", () => ({
  default: vi.fn(() =>
    Promise.resolve({
      toDataURL: () => "data:image/png;base64,mock",
      width: 800,
      height: 1000,
    })
  ),
}));

vi.mock("jspdf", () => ({
  default: vi.fn().mockImplementation(() => ({
    addImage: vi.fn(),
    save: vi.fn(),
  })),
}));

const mockReportData = {
  caseInfo: {
    studentName: "Test Student",
    grade: "5th Grade",
    schoolYear: "2024-2025",
    tutor: "Test Tutor",
    dateCreated: "January 1, 2025",
    lastUpdated: "January 15, 2025",
  },
};

describe("PDFDownloadButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render download button with default text", () => {
    render(
      <PDFDownloadButton
        studentName="Test Student"
        reportData={mockReportData}
        theme={k12Theme}
      />
    );

    expect(screen.getByText("Download PDF")).toBeInTheDocument();
  });

  it("should render download button with custom text", () => {
    render(
      <PDFDownloadButton
        studentName="Test Student"
        reportData={mockReportData}
        theme={k12Theme}
        buttonText="Custom Download Text"
      />
    );

    expect(screen.getByText("Custom Download Text")).toBeInTheDocument();
  });

  it("should have proper aria-label", () => {
    render(
      <PDFDownloadButton
        studentName="Test Student"
        reportData={mockReportData}
        theme={k12Theme}
      />
    );

    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-label", "Download PDF Report");
  });

  it("should use theme colors for button styling", () => {
    render(
      <PDFDownloadButton
        studentName="Test Student"
        reportData={mockReportData}
        theme={k12Theme}
      />
    );

    const button = screen.getByRole("button");
    expect(button.style.backgroundColor).toBe(k12Theme.colors.primary);
    expect(button.style.color).toBe(k12Theme.colors.white);
  });
});
