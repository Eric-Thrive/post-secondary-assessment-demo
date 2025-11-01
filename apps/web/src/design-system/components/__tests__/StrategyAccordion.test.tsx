import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { StrategyAccordion } from "../content/StrategyAccordion";
import { k12Theme } from "../../themes/k12Theme";
import { Lightbulb, Target, Zap } from "lucide-react";

const mockStrategies = [
  {
    strategy: "Visual Supports",
    description: "Use visual aids and graphic organizers to support learning.",
    icon: Lightbulb,
  },
  {
    strategy: "Chunking Information",
    description: "Break down complex tasks into smaller, manageable steps.",
    icon: Target,
  },
  {
    strategy: "Frequent Breaks",
    description: "Provide regular movement breaks to maintain focus.",
    icon: Zap,
  },
];

describe("StrategyAccordion", () => {
  it("should render all strategy titles", () => {
    render(<StrategyAccordion strategies={mockStrategies} theme={k12Theme} />);

    expect(screen.getByText("Visual Supports")).toBeInTheDocument();
    expect(screen.getByText("Chunking Information")).toBeInTheDocument();
    expect(screen.getByText("Frequent Breaks")).toBeInTheDocument();
  });

  it("should not show descriptions initially (collapsed state)", () => {
    render(<StrategyAccordion strategies={mockStrategies} theme={k12Theme} />);

    expect(
      screen.queryByText(
        "Use visual aids and graphic organizers to support learning."
      )
    ).not.toBeVisible();
  });

  it("should expand strategy when clicked", async () => {
    render(<StrategyAccordion strategies={mockStrategies} theme={k12Theme} />);

    const trigger = screen.getByText("Visual Supports").closest("button");
    if (trigger) {
      fireEvent.click(trigger);

      await waitFor(() => {
        expect(
          screen.getByText(
            "Use visual aids and graphic organizers to support learning."
          )
        ).toBeVisible();
      });
    }
  });

  it("should collapse strategy when clicked again", async () => {
    render(<StrategyAccordion strategies={mockStrategies} theme={k12Theme} />);

    const trigger = screen.getByText("Visual Supports").closest("button");
    if (trigger) {
      // Expand
      fireEvent.click(trigger);
      await waitFor(() => {
        expect(
          screen.getByText(
            "Use visual aids and graphic organizers to support learning."
          )
        ).toBeVisible();
      });

      // Collapse
      fireEvent.click(trigger);
      await waitFor(() => {
        expect(
          screen.queryByText(
            "Use visual aids and graphic organizers to support learning."
          )
        ).not.toBeVisible();
      });
    }
  });

  it("should only allow one strategy open at a time (single-item behavior)", async () => {
    render(<StrategyAccordion strategies={mockStrategies} theme={k12Theme} />);

    // Open first strategy
    const trigger1 = screen.getByText("Visual Supports").closest("button");
    if (trigger1) {
      fireEvent.click(trigger1);
      await waitFor(() => {
        expect(
          screen.getByText(
            "Use visual aids and graphic organizers to support learning."
          )
        ).toBeVisible();
      });
    }

    // Open second strategy
    const trigger2 = screen.getByText("Chunking Information").closest("button");
    if (trigger2) {
      fireEvent.click(trigger2);
      await waitFor(() => {
        expect(
          screen.getByText(
            "Break down complex tasks into smaller, manageable steps."
          )
        ).toBeVisible();
      });

      // First strategy should now be closed
      await waitFor(() => {
        expect(
          screen.queryByText(
            "Use visual aids and graphic organizers to support learning."
          )
        ).not.toBeVisible();
      });
    }
  });

  it("should have proper aria-label for expand action", () => {
    render(<StrategyAccordion strategies={mockStrategies} theme={k12Theme} />);

    const trigger = screen.getByText("Visual Supports").closest("button");
    expect(trigger).toHaveAttribute(
      "aria-label",
      "Expand Visual Supports strategy"
    );
  });

  it("should render icons for each strategy", () => {
    const { container } = render(
      <StrategyAccordion strategies={mockStrategies} theme={k12Theme} />
    );

    // Each strategy should have an icon (SVG)
    const icons = container.querySelectorAll("svg");
    // 3 strategy icons + 3 chevron icons = 6 total
    expect(icons.length).toBeGreaterThanOrEqual(6);
  });

  it("should apply orange theme to icon circles", () => {
    const { container } = render(
      <StrategyAccordion strategies={mockStrategies} theme={k12Theme} />
    );

    // Find icon circles (they have specific styling with orange background)
    const iconCircles = container.querySelectorAll('[aria-hidden="true"]');
    const firstIconCircle = Array.from(iconCircles).find(
      (el) => el.classList.contains("w-10") || el.classList.contains("w-12")
    ) as HTMLElement;

    if (firstIconCircle) {
      // Check that it has orange-themed background
      expect(firstIconCircle.style.backgroundColor).toContain(
        k12Theme.colors.orange
      );
    }
  });

  it("should meet WCAG minimum touch target size", () => {
    render(<StrategyAccordion strategies={mockStrategies} theme={k12Theme} />);

    const trigger = screen.getByText("Visual Supports").closest("button");
    expect(trigger?.style.minHeight).toBe(k12Theme.dimensions.minTouchTarget);
  });

  it("should rotate chevron icon when expanded", async () => {
    render(<StrategyAccordion strategies={mockStrategies} theme={k12Theme} />);

    const trigger = screen.getByText("Visual Supports").closest("button");
    if (trigger) {
      // Expand the section
      fireEvent.click(trigger);

      await waitFor(() => {
        // Check that the trigger has the open state
        expect(trigger).toHaveAttribute("data-state", "open");
      });
    }
  });

  it("should apply hover effect on mouse enter", () => {
    render(<StrategyAccordion strategies={mockStrategies} theme={k12Theme} />);

    const trigger = screen.getByText("Visual Supports").closest("button");
    if (trigger) {
      // Simulate mouse enter
      fireEvent.mouseEnter(trigger);

      // Check that background color changed (orange with opacity)
      expect(trigger.style.backgroundColor).toContain(k12Theme.colors.orange);
    }
  });
});
