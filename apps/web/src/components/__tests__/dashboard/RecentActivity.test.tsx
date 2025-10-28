import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { RecentActivity } from "../../dashboard/RecentActivity";
import { ModuleType } from "@/types/unified-auth";
import type { RecentActivity as RecentActivityType } from "@/types/unified-auth";

// Mock the config modules
vi.mock("@/config/modules", () => ({
  getModuleColor: vi.fn(() => "#1297d2"),
}));

describe("RecentActivity", () => {
  const mockActivities: RecentActivityType[] = [
    {
      id: "1",
      type: "report",
      title: "Student Assessment Report",
      moduleType: ModuleType.K12,
      timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      status: "completed",
      route: "/k12/reports/1",
    },
    {
      id: "2",
      type: "assessment",
      title: "Post-Secondary Evaluation",
      moduleType: ModuleType.POST_SECONDARY,
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      status: "draft",
      route: "/post-secondary/assessments/2",
    },
    {
      id: "3",
      type: "report",
      title: "Tutoring Session Notes",
      moduleType: ModuleType.TUTORING,
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      status: "in_progress",
      route: "/tutoring/reports/3",
    },
  ];

  const mockOnActivityClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock window.location.href
    const originalLocation = window.location;
    delete (window as any).location;
    window.location = { ...originalLocation, href: "" };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders recent activity title", () => {
    render(
      <RecentActivity
        activities={mockActivities}
        onActivityClick={mockOnActivityClick}
      />
    );

    expect(screen.getByText("Recent Activity")).toBeInTheDocument();
  });

  it("displays all activities with correct information", () => {
    render(
      <RecentActivity
        activities={mockActivities}
        onActivityClick={mockOnActivityClick}
      />
    );

    expect(screen.getByText("Student Assessment Report")).toBeInTheDocument();
    expect(screen.getByText("Post-Secondary Evaluation")).toBeInTheDocument();
    expect(screen.getByText("Tutoring Session Notes")).toBeInTheDocument();
  });

  it("displays correct status badges", () => {
    render(
      <RecentActivity
        activities={mockActivities}
        onActivityClick={mockOnActivityClick}
      />
    );

    expect(screen.getByText("completed")).toBeInTheDocument();
    expect(screen.getByText("draft")).toBeInTheDocument();
    expect(screen.getByText("in progress")).toBeInTheDocument();
  });

  it("formats timestamps correctly", () => {
    render(
      <RecentActivity
        activities={mockActivities}
        onActivityClick={mockOnActivityClick}
      />
    );

    expect(screen.getByText("30m ago")).toBeInTheDocument();
    expect(screen.getByText("2h ago")).toBeInTheDocument();
    expect(screen.getByText("1d ago")).toBeInTheDocument();
  });

  it("handles activity clicks with custom handler", () => {
    render(
      <RecentActivity
        activities={mockActivities}
        onActivityClick={mockOnActivityClick}
      />
    );

    fireEvent.click(screen.getByText("Student Assessment Report"));
    expect(mockOnActivityClick).toHaveBeenCalledWith(mockActivities[0]);
  });

  it("handles activity clicks with default navigation", () => {
    render(<RecentActivity activities={mockActivities} />);

    fireEvent.click(screen.getByText("Student Assessment Report"));
    expect(window.location.href).toBe("/k12/reports/1");
  });

  it("shows resume draft button when draft activities exist", () => {
    render(
      <RecentActivity
        activities={mockActivities}
        onActivityClick={mockOnActivityClick}
      />
    );

    expect(screen.getByText("Resume Draft Work")).toBeInTheDocument();
  });

  it("handles resume draft button click", () => {
    render(
      <RecentActivity
        activities={mockActivities}
        onActivityClick={mockOnActivityClick}
      />
    );

    fireEvent.click(screen.getByText("Resume Draft Work"));
    expect(mockOnActivityClick).toHaveBeenCalledWith(mockActivities[1]); // The draft activity
  });

  it("does not show resume draft button when no drafts exist", () => {
    const activitiesWithoutDrafts = mockActivities.filter(
      (a) => a.status !== "draft"
    );

    render(
      <RecentActivity
        activities={activitiesWithoutDrafts}
        onActivityClick={mockOnActivityClick}
      />
    );

    expect(screen.queryByText("Resume Draft Work")).not.toBeInTheDocument();
  });

  it("limits display to 5 activities", () => {
    const manyActivities = Array.from({ length: 10 }, (_, i) => ({
      id: `${i + 1}`,
      type: "report" as const,
      title: `Activity ${i + 1}`,
      moduleType: ModuleType.K12,
      timestamp: new Date(),
      status: "completed" as const,
    }));

    render(
      <RecentActivity
        activities={manyActivities}
        onActivityClick={mockOnActivityClick}
      />
    );

    // Should only show first 5
    expect(screen.getByText("Activity 1")).toBeInTheDocument();
    expect(screen.getByText("Activity 5")).toBeInTheDocument();
    expect(screen.queryByText("Activity 6")).not.toBeInTheDocument();
  });

  it("shows empty state when no activities", () => {
    render(
      <RecentActivity activities={[]} onActivityClick={mockOnActivityClick} />
    );

    expect(screen.getByText("No recent activity")).toBeInTheDocument();
    expect(
      screen.getByText("Your recent reports and assessments will appear here.")
    ).toBeInTheDocument();
  });

  it("shows view all button", () => {
    render(
      <RecentActivity
        activities={mockActivities}
        onActivityClick={mockOnActivityClick}
      />
    );

    expect(screen.getByText("View All")).toBeInTheDocument();
  });

  it("has proper hover effects on activity items", () => {
    render(
      <RecentActivity
        activities={mockActivities}
        onActivityClick={mockOnActivityClick}
      />
    );

    const activityItems = screen.getAllByText(/Assessment|Evaluation|Notes/);
    activityItems.forEach((item) => {
      const container = item.closest(".group");
      expect(container).toHaveClass("cursor-pointer");
      expect(container).toHaveClass("hover:border-gray-200");
    });
  });
});
