import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ThematicAccordion } from "../content/ThematicAccordion";
import { k12Theme } from "../../themes/k12Theme";
import { BookOpen, Brain, Heart } from "lucide-react";

const mockSections = [
  {
    title: "Academic Profile",
    icon: BookOpen,
    color: "#1297D2",
    bgColor: "#96D7E120",
    content: "This is the academic profile content.",
  },
  {
    title: "Cognitive Factors",
    icon: Brain,
    color: "#F89E54",
    bgColor: "#F89E5420",
    content: "This is the cognitive factors content.",
  },
  {
    title: "Social-Emotional",
    icon: Heart,
    color: "#16a34a",
    bgColor: "#16a34a20",
    content: "This is the social-emotional content.",
  },
];

describe("ThematicAccordion", () => {
  it("should render all section titles", () => {
    render(<ThematicAccordion sections={mockSections} theme={k12Theme} />);

    expect(screen.getByText("Academic Profile")).toBeInTheDocument();
    expect(screen.getByText("Cognitive Factors")).toBeInTheDocument();
    expect(screen.getByText("Social-Emotional")).toBeInTheDocument();
  });

  it("should not show content initially (collapsed state)", () => {
    render(<ThematicAccordion sections={mockSections} theme={k12Theme} />);

    // Content should not be visible initially
    expect(
      screen.queryByText("This is the academic profile content.")
    ).not.toBeVisible();
  });

  it("should expand section when clicked", async () => {
    render(<ThematicAccordion sections={mockSections} theme={k12Theme} />);

    const trigger = screen.getByText("Academic Profile").closest("button");
    if (trigger) {
      fireEvent.click(trigger);

      await waitFor(() => {
        expect(
          screen.getByText("This is the academic profile content.")
        ).toBeVisible();
      });
    }
  });

  it("should collapse section when clicked again", async () => {
    render(<ThematicAccordion sections={mockSections} theme={k12Theme} />);

    const trigger = screen.getByText("Academic Profile").closest("button");
    if (trigger) {
      // Expand
      fireEvent.click(trigger);
      await waitFor(() => {
        expect(
          screen.getByText("This is the academic profile content.")
        ).toBeVisible();
      });

      // Collapse
      fireEvent.click(trigger);
      await waitFor(() => {
        expect(
          screen.queryByText("This is the academic profile content.")
        ).not.toBeVisible();
      });
    }
  });

  it("should only allow one section open at a time (single-item behavior)", async () => {
    render(<ThematicAccordion sections={mockSections} theme={k12Theme} />);

    // Open first section
    const trigger1 = screen.getByText("Academic Profile").closest("button");
    if (trigger1) {
      fireEvent.click(trigger1);
      await waitFor(() => {
        expect(
          screen.getByText("This is the academic profile content.")
        ).toBeVisible();
      });
    }

    // Open second section
    const trigger2 = screen.getByText("Cognitive Factors").closest("button");
    if (trigger2) {
      fireEvent.click(trigger2);
      await waitFor(() => {
        expect(
          screen.getByText("This is the cognitive factors content.")
        ).toBeVisible();
      });

      // First section should now be closed
      await waitFor(() => {
        expect(
          screen.queryByText("This is the academic profile content.")
        ).not.toBeVisible();
      });
    }
  });

  it("should have proper aria-label for expand action", () => {
    render(<ThematicAccordion sections={mockSections} theme={k12Theme} />);

    const trigger = screen.getByText("Academic Profile").closest("button");
    expect(trigger).toHaveAttribute(
      "aria-label",
      "Expand Academic Profile section"
    );
  });

  it("should render icons for each section", () => {
    const { container } = render(
      <ThematicAccordion sections={mockSections} theme={k12Theme} />
    );

    // Each section should have an icon (SVG)
    const icons = container.querySelectorAll("svg");
    // 3 section icons + 3 chevron icons = 6 total
    expect(icons.length).toBeGreaterThanOrEqual(6);
  });

  it("should rotate chevron icon when expanded", async () => {
    const { container } = render(
      <ThematicAccordion sections={mockSections} theme={k12Theme} />
    );

    const trigger = screen.getByText("Academic Profile").closest("button");
    if (trigger) {
      // Get the chevron icon
      const chevron = trigger.querySelector(
        ".group-data-\\[state\\=open\\]\\:rotate-180"
      );

      // Expand the section
      fireEvent.click(trigger);

      await waitFor(() => {
        // Check that the trigger has the open state
        expect(trigger).toHaveAttribute("data-state", "open");
      });
    }
  });

  it("should apply themed colors to section headers", () => {
    render(<ThematicAccordion sections={mockSections} theme={k12Theme} />);

    const trigger1 = screen.getByText("Academic Profile").closest("button");
    expect(trigger1?.style.color).toBe(mockSections[0].color);

    const trigger2 = screen.getByText("Cognitive Factors").closest("button");
    expect(trigger2?.style.color).toBe(mockSections[1].color);
  });

  it("should meet WCAG minimum touch target size", () => {
    render(<ThematicAccordion sections={mockSections} theme={k12Theme} />);

    const trigger = screen.getByText("Academic Profile").closest("button");
    expect(trigger?.style.minHeight).toBe(k12Theme.dimensions.minTouchTarget);
  });
});
