import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import ThriveReportLayout from "../layout/ThriveReportLayout";
import { k12Theme } from "../../themes/k12Theme";
import { Home } from "lucide-react";

const mockConfig = {
  reportTitle: "Test Report",
  sections: [
    { id: "section1", title: "Section 1", icon: Home },
    { id: "section2", title: "Section 2", icon: Home },
  ],
  utilityButtons: [{ id: "home", title: "Home", icon: Home, route: "/" }],
  theme: k12Theme,
  logo: "/test-logo.png",
};

describe("ThriveReportLayout", () => {
  it("should render with children", () => {
    render(
      <ThriveReportLayout
        config={mockConfig}
        currentSection="section1"
        onSectionChange={vi.fn()}
        theme={k12Theme}
      >
        <div>Test Content</div>
      </ThriveReportLayout>
    );

    expect(screen.getByText("Test Content")).toBeInTheDocument();
  });

  it("should render skip to main content link", () => {
    render(
      <ThriveReportLayout
        config={mockConfig}
        currentSection="section1"
        onSectionChange={vi.fn()}
        theme={k12Theme}
      >
        <div>Content</div>
      </ThriveReportLayout>
    );

    const skipLink = screen.getByText("Skip to main content");
    expect(skipLink).toBeInTheDocument();
    expect(skipLink).toHaveAttribute("href", "#main-content");
  });

  it("should render header with report title", () => {
    render(
      <ThriveReportLayout
        config={mockConfig}
        currentSection="section1"
        onSectionChange={vi.fn()}
        theme={k12Theme}
      >
        <div>Content</div>
      </ThriveReportLayout>
    );

    expect(screen.getByText("Test Report")).toBeInTheDocument();
  });

  it("should render sidebar with sections", () => {
    render(
      <ThriveReportLayout
        config={mockConfig}
        currentSection="section1"
        onSectionChange={vi.fn()}
        theme={k12Theme}
      >
        <div>Content</div>
      </ThriveReportLayout>
    );

    expect(screen.getByText("Section 1")).toBeInTheDocument();
    expect(screen.getByText("Section 2")).toBeInTheDocument();
  });

  it("should call onSectionChange when section is clicked", () => {
    const handleSectionChange = vi.fn();
    render(
      <ThriveReportLayout
        config={mockConfig}
        currentSection="section1"
        onSectionChange={handleSectionChange}
        theme={k12Theme}
      >
        <div>Content</div>
      </ThriveReportLayout>
    );

    const section2Button = screen.getByText("Section 2").closest("button");
    if (section2Button) {
      fireEvent.click(section2Button);
      expect(handleSectionChange).toHaveBeenCalledWith("section2");
    }
  });

  it("should have proper ARIA labels for accessibility", () => {
    render(
      <ThriveReportLayout
        config={mockConfig}
        currentSection="section1"
        onSectionChange={vi.fn()}
        theme={k12Theme}
      >
        <div>Content</div>
      </ThriveReportLayout>
    );

    const mainContent = screen.getByRole("main");
    expect(mainContent).toHaveAttribute("aria-label", "Report content");
    expect(mainContent).toHaveAttribute("id", "main-content");
  });

  it("should toggle mobile sidebar when hamburger is clicked", () => {
    render(
      <ThriveReportLayout
        config={mockConfig}
        currentSection="section1"
        onSectionChange={vi.fn()}
        theme={k12Theme}
      >
        <div>Content</div>
      </ThriveReportLayout>
    );

    const toggleButton = screen.getByLabelText("Toggle navigation menu");
    expect(toggleButton).toBeInTheDocument();
    expect(toggleButton).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(toggleButton);
    expect(toggleButton).toHaveAttribute("aria-expanded", "true");
  });
});
