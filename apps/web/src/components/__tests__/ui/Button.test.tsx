import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

// Mock a simple Button component for testing
const Button = ({
  children,
  onClick,
  disabled = false,
  variant = "default",
  ...props
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "default" | "primary" | "secondary";
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`btn btn-${variant}`}
    {...props}
  >
    {children}
  </button>
);

describe("Button Component", () => {
  it("should render with children", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText("Click me")).toBeInTheDocument();
  });

  it("should handle click events", () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    fireEvent.click(screen.getByText("Click me"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("should be disabled when disabled prop is true", () => {
    render(<Button disabled>Disabled button</Button>);

    const button = screen.getByText("Disabled button");
    expect(button).toBeDisabled();
  });

  it("should apply correct variant class", () => {
    render(<Button variant="primary">Primary button</Button>);

    const button = screen.getByText("Primary button");
    expect(button).toHaveClass("btn-primary");
  });

  it("should not call onClick when disabled", () => {
    const handleClick = vi.fn();
    render(
      <Button onClick={handleClick} disabled>
        Disabled button
      </Button>
    );

    fireEvent.click(screen.getByText("Disabled button"));
    expect(handleClick).not.toHaveBeenCalled();
  });
});
