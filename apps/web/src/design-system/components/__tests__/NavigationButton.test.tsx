import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import NavigationButton from "../navigation/NavigationButton";
import { k12Theme } from "../../themes/k12Theme";
import { Home } from "lucide-react";

const mockSection = {
  id: "test-section",
  title: "Test Section",
  icon: Home,
};

describe("NavigationButton", () => {
  it("should render section title", () => {
    render(
      <NavigationButton
        section={mockSection}
        isActive={false}
        theme={k12Theme}
        onClick={vi.fn()}
      />
    );

    expect(screen.getByText("Test Section")).toBeInTheDocument();
  });

  it("should render icon when provided", () => {
    render(
      <NavigationButton
        section={mockSection}
        isActive={false}
        theme={k12Theme}
        onClick={vi.fn()}
      />
    );

    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
    // Icon is rendered as SVG within the button
    const svg = button.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });

  it("should call onClick when clicked", () => {
    const handleClick = vi.fn();
    render(
      <NavigationButton
        section={mockSection}
        isActive={false}
        theme={k12Theme}
        onClick={handleClick}
      />
    );

    const button = screen.getByRole("button");
    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("should have aria-current='page' when active", () => {
    render(
      <NavigationButton
        section={mockSection}
        isActive={true}
        theme={k12Theme}
        onClick={vi.fn()}
      />
    );

    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-current", "page");
  });

  it("should not have aria-current when inactive", () => {
    render(
      <NavigationButton
        section={mockSection}
        isActive={false}
        theme={k12Theme}
        onClick={vi.fn()}
      />
    );

    const button = screen.getByRole("button");
    expect(button).not.toHaveAttribute("aria-current");
  });

  it("should have proper aria-label", () => {
    render(
      <NavigationButton
        section={mockSection}
        isActive={false}
        theme={k12Theme}
        onClick={vi.fn()}
      />
    );

    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-label", "Navigate to Test Section");
  });

  it("should handle keyboard navigation with Enter key", () => {
    const handleClick = vi.fn();
    render(
      <NavigationButton
        section={mockSection}
        isActive={false}
        theme={k12Theme}
        onClick={handleClick}
      />
    );

    const button = screen.getByRole("button");
    fireEvent.keyDown(button, { key: "Enter" });
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("should handle keyboard navigation with Space key", () => {
    const handleClick = vi.fn();
    render(
      <NavigationButton
        section={mockSection}
        isActive={false}
        theme={k12Theme}
        onClick={handleClick}
      />
    );

    const button = screen.getByRole("button");
    fireEvent.keyDown(button, { key: " " });
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("should show active indicator when active", () => {
    const { container } = render(
      <NavigationButton
        section={mockSection}
        isActive={true}
        theme={k12Theme}
        onClick={vi.fn()}
      />
    );

    // Active indicator is a small dot with aria-hidden
    const indicator = container.querySelector('[aria-hidden="true"].w-2.h-2');
    expect(indicator).toBeInTheDocument();
  });

  it("should not show active indicator when inactive", () => {
    const { container } = render(
      <NavigationButton
        section={mockSection}
        isActive={false}
        theme={k12Theme}
        onClick={vi.fn()}
      />
    );

    // Active indicator should not be present
    const indicator = container.querySelector('[aria-hidden="true"].w-2.h-2');
    expect(indicator).not.toBeInTheDocument();
  });

  it("should apply active styles when active", () => {
    render(
      <NavigationButton
        section={mockSection}
        isActive={true}
        theme={k12Theme}
        onClick={vi.fn()}
      />
    );

    const button = screen.getByRole("button");
    const styles = window.getComputedStyle(button);

    // Check that button has active background color from theme
    expect(button.style.backgroundColor).toBe(
      k12Theme.navigation.activeBackground
    );
  });

  it("should apply inactive styles when not active", () => {
    render(
      <NavigationButton
        section={mockSection}
        isActive={false}
        theme={k12Theme}
        onClick={vi.fn()}
      />
    );

    const button = screen.getByRole("button");

    // Check that button has inactive background color from theme
    expect(button.style.backgroundColor).toBe(
      k12Theme.navigation.inactiveBackground
    );
  });
});
