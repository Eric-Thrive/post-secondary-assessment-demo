import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import StudentOverviewContent from "../content/StudentOverviewContent";
import { k12Theme } from "@/design-system/themes/k12Theme";
import { BookOpen, Brain, Heart } from "lucide-react";

const mockReportData = {
  studentOverview: {
    atAGlance: "This is a test student overview summary.",
    sections: [
      {
        title: "Academic Profile",
        icon: BookOpen,
        color: "#1297D2",
        bgColor: "#96D7E120",
        content: "Academic profile content here.",
      },
      {
        title: "Challenges",
        icon: Brain,
        color: "#F89E54",
        bgColor: "#F89E5420",
        content: "Challenges content here.",
      },
      {
        title: "Social-Emotional",
        icon: Heart,
        color: "#16a34a",
        bgColor: "#16a34a20",
        content: "Social-emotional content here.",
      },
    ],
  },
};

describe("StudentOverviewContent", () => {
  it("should render section header", () => {
    render(
      <StudentOverviewContent
        theme={k12Theme}
        onNext={vi.fn()}
        reportData={mockReportData}
      />
    );

    expect(screen.getByText("Student Overview")).toBeInTheDocument();
  });

  it("should render At a Glance summary", () => {
    render(
      <StudentOverviewContent
        theme={k12Theme}
        onNext={vi.fn()}
        reportData={mockReportData}
      />
    );

    expect(
      screen.getByText("This is a test student overview summary.")
    ).toBeInTheDocument();
  });

  it("should render all accordion section titles", () => {
    render(
      <StudentOverviewContent
        theme={k12Theme}
        onNext={vi.fn()}
        reportData={mockReportData}
      />
    );

    expect(screen.getByText("Academic Profile")).toBeInTheDocument();
    expect(screen.getByText("Challenges")).toBeInTheDocument();
    expect(screen.getByText("Social-Emotional")).toBeInTheDocument();
  });

  it("should not show accordion content initially", () => {
    render(
      <StudentOverviewContent
        theme={k12Theme}
        onNext={vi.fn()}
        reportData={mockReportData}
      />
    );

    expect(
      screen.queryByText("Academic profile content here.")
    ).not.toBeVisible();
  });

  it("should expand accordion section when clicked", async () => {
    render(
      <StudentOverviewContent
        theme={k12Theme}
        onNext={vi.fn()}
        reportData={mockReportData}
      />
    );

    const trigger = screen.getByText("Academic Profile").closest("button");
    if (trigger) {
      fireEvent.click(trigger);

      await waitFor(() => {
        expect(
          screen.getByText("Academic profile content here.")
        ).toBeVisible();
      });
    }
  });

  it("should use sample data when reportData is not provided", () => {
    render(
      <StudentOverviewContent
        theme={k12Theme}
        onNext={vi.fn()}
        reportData={undefined}
      />
    );

    // Should render default sample data
    expect(screen.getByText(/Sarah is a bright, creative/)).toBeInTheDocument();
    expect(screen.getByText("Academic & Learning Profile")).toBeInTheDocument();
    expect(screen.getByText("Challenges & Diagnosis")).toBeInTheDocument();
    expect(screen.getByText("Social-Emotional & Supports")).toBeInTheDocument();
  });

  it("should render bottom navigation with Next Section button", () => {
    render(
      <StudentOverviewContent
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
      <StudentOverviewContent
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
      <StudentOverviewContent
        theme={k12Theme}
        onNext={undefined}
        reportData={mockReportData}
      />
    );

    expect(screen.queryByText("Next Section")).not.toBeInTheDocument();
  });

  it("should use theme typography for section header", () => {
    render(
      <StudentOverviewContent
        theme={k12Theme}
        onNext={vi.fn()}
        reportData={mockReportData}
      />
    );

    const header = screen.getByText("Student Overview");
    expect(header.style.fontSize).toBe(k12Theme.typography.fontSizes.h2);
    expect(header.style.fontWeight).toBe(
      k12Theme.typography.fontWeights.bold.toString()
    );
  });

  it("should render ThematicAccordion with correct number of sections", () => {
    render(
      <StudentOverviewContent
        theme={k12Theme}
        onNext={vi.fn()}
        reportData={mockReportData}
      />
    );

    // All three section titles should be present
    const sectionTitles = [
      screen.getByText("Academic Profile"),
      screen.getByText("Challenges"),
      screen.getByText("Social-Emotional"),
    ];

    expect(sectionTitles).toHaveLength(3);
    sectionTitles.forEach((title) => {
      expect(title).toBeInTheDocument();
    });
  });
});
