import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ModuleCard } from "../../dashboard/ModuleCard";
import type { ModuleInfo, ModuleStats } from "@/types/unified-auth";

// Mock the config modules
vi.mock("@/config/modules", () => ({
  getModuleColor: vi.fn(() => "#1297d2"),
}));

describe("ModuleCard", () => {
  const mockModule: ModuleInfo = {
    id: "k12",
    name: "k12",
    displayName: "K-12 Education",
    description:
      "Deliver consistent, student-centered plans across your K-12 program.",
    icon: "School",
    color: "navy",
    route: "/k12",
    features: [
      "Student Support Plans",
      "IEP Management",
      "Progress Tracking",
      "Parent Communication",
    ],
  };

  const mockStats: ModuleStats = {
    totalReports: 15,
    draftReports: 3,
    recentActivity: new Date(),
  };

  const mockOnClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders module information correctly", () => {
    render(
      <ModuleCard
        module={mockModule}
        accessLevel="full"
        onClick={mockOnClick}
      />
    );

    expect(screen.getByText("K-12 Education")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Deliver consistent, student-centered plans across your K-12 program."
      )
    ).toBeInTheDocument();
  });

  it("displays full access badge for full access", () => {
    render(
      <ModuleCard
        module={mockModule}
        accessLevel="full"
        onClick={mockOnClick}
      />
    );

    expect(screen.getByText("Full Access")).toBeInTheDocument();
  });

  it("displays limited access badge for restricted access", () => {
    render(
      <ModuleCard
        module={mockModule}
        accessLevel="restricted"
        onClick={mockOnClick}
      />
    );

    expect(screen.getByText("Limited Access")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Some features may be limited. Contact your administrator for full access."
      )
    ).toBeInTheDocument();
  });

  it("displays unavailable badge for unavailable access", () => {
    render(
      <ModuleCard
        module={mockModule}
        accessLevel="unavailable"
        onClick={mockOnClick}
      />
    );

    expect(screen.getByText("Unavailable")).toBeInTheDocument();
    expect(
      screen.getByText(
        "This module is not available for your account. Contact support for access."
      )
    ).toBeInTheDocument();
  });

  it("displays module features", () => {
    render(
      <ModuleCard
        module={mockModule}
        accessLevel="full"
        onClick={mockOnClick}
      />
    );

    expect(screen.getByText("Student Support Plans")).toBeInTheDocument();
    expect(screen.getByText("IEP Management")).toBeInTheDocument();
    expect(screen.getByText("+2 more")).toBeInTheDocument();
  });

  it("displays stats when provided", () => {
    render(
      <ModuleCard
        module={mockModule}
        accessLevel="full"
        stats={mockStats}
        onClick={mockOnClick}
      />
    );

    expect(screen.getByText("15 reports")).toBeInTheDocument();
    expect(screen.getByText("3 drafts")).toBeInTheDocument();
  });

  it("handles click events", () => {
    render(
      <ModuleCard
        module={mockModule}
        accessLevel="full"
        onClick={mockOnClick}
      />
    );

    fireEvent.click(screen.getByRole("button"));
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it("handles keyboard navigation", () => {
    render(
      <ModuleCard
        module={mockModule}
        accessLevel="full"
        onClick={mockOnClick}
      />
    );

    const card = screen.getByRole("button");
    fireEvent.keyDown(card, { key: "Enter" });
    expect(mockOnClick).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(card, { key: " " });
    expect(mockOnClick).toHaveBeenCalledTimes(2);
  });

  it("disables interaction when disabled", () => {
    render(
      <ModuleCard
        module={mockModule}
        accessLevel="full"
        onClick={mockOnClick}
        disabled={true}
      />
    );

    const card = screen.getByRole("button");
    expect(card).toHaveAttribute("aria-disabled", "true");
    expect(card).toHaveAttribute("tabIndex", "-1");

    fireEvent.click(card);
    expect(mockOnClick).not.toHaveBeenCalled();
  });

  it("disables interaction for unavailable modules", () => {
    render(
      <ModuleCard
        module={mockModule}
        accessLevel="unavailable"
        onClick={mockOnClick}
      />
    );

    const card = screen.getByRole("button");
    expect(card).toHaveAttribute("aria-disabled", "true");

    fireEvent.click(card);
    expect(mockOnClick).not.toHaveBeenCalled();
  });

  it("has proper accessibility attributes", () => {
    render(
      <ModuleCard
        module={mockModule}
        accessLevel="full"
        onClick={mockOnClick}
      />
    );

    const card = screen.getByRole("button");
    expect(card).toHaveAttribute("aria-label", "Access K-12 Education module");
    expect(card).toHaveAttribute("tabIndex", "0");
  });
});
