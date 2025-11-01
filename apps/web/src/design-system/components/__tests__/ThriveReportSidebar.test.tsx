import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import ThriveReportSidebar from "../layout/ThriveReportSidebar";
import { k12Theme } from "../../themes/k12Theme";
import { Home, FileText } from "lucide-react";

const mockSections = [
  { id: "section1", title: "Section 1", icon: Home },
  { id: "section2", title: "Section 2", icon: FileText },
  { id: "section3", title: "Section 3", icon: Home },
];

const mockUtilityButtons = [
  { id: "home", title: "Home", icon: Home, route: "/" },
  { id: "new", title: "New Report", icon: FileText, route: "/new" },
];

describe("ThriveReportSidebar", () => {
  it("should render all sections", () => {
    render(
      <ThriveReportSidebar
        sections={mockSections}
        currentSection="section1"
        onSectionChange={vi.fn()}
        theme={k12Theme}
      />
    );

    expect(screen.getByText("Section 1")).toBeInTheDocument();
    expect(screen.getByText("Section 2")).toBeInTheDocument();
    expect(screen.getByText("Section 3")).toBeInTheDocument();
  });

  it("should render logo when provided", () => {
    render(
      <ThriveReportSidebar
        sections={mockSections}
        currentSection="section1"
        onSectionChange={vi.fn()}
        theme={k12Theme}
        logo="/test-logo.png"
      />
    );

    const logo = screen.getByAltText("Report logo");
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute("src", "/test-logo.png");
  });

  it("should render report title when provided", () => {
    render(
      <ThriveReportSidebar
        sections={mockSections}
        currentSection="section1"
        onSectionChange={vi.fn()}
        theme={k12Theme}
        reportTitle="Test Report Title"
      />
    );

    expect(screen.getByText("Test Report Title")).toBeInTheDocument();
  });

  it("should render utility buttons when provided", () => {
    render(
      <ThriveReportSidebar
        sections={mockSections}
        utilityButtons={mockUtilityButtons}
        currentSection="section1"
        onSectionChange={vi.fn()}
        theme={k12Theme}
      />
    );

    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("New Report")).toBeInTheDocument();
  });

  it("should call onSectionChange when navigation button is clicked", () => {
    const handleSectionChange = vi.fn();
    render(
      <ThriveReportSidebar
        sections={mockSections}
        currentSection="section1"
        onSectionChange={handleSectionChange}
        theme={k12Theme}
      />
    );

    const section2Button = screen.getByText("Section 2").closest("button");
    if (section2Button) {
      fireEvent.click(section2Button);
      expect(handleSectionChange).toHaveBeenCalledWith("section2");
    }
  });

  it("should have proper ARIA labels for navigation", () => {
    render(
      <ThriveReportSidebar
        sections={mockSections}
        currentSection="section1"
        onSectionChange={vi.fn()}
        theme={k12Theme}
      />
    );

    const nav = screen.getByRole("navigation");
    expect(nav).toHaveAttribute("aria-label", "Report sections navigation");
  });

  it("should highlight active section", () => {
    render(
      <ThriveReportSidebar
        sections={mockSections}
        currentSection="section2"
        onSectionChange={vi.fn()}
        theme={k12Theme}
      />
    );

    const section2Button = screen.getByText("Section 2").closest("button");
    expect(section2Button).toHaveAttribute("aria-current", "page");
  });

  it("should render utility button links with correct routes", () => {
    render(
      <ThriveReportSidebar
        sections={mockSections}
        utilityButtons={mockUtilityButtons}
        currentSection="section1"
        onSectionChange={vi.fn()}
        theme={k12Theme}
      />
    );

    const homeLink = screen.getByText("Home").closest("a");
    expect(homeLink).toHaveAttribute("href", "/");

    const newReportLink = screen.getByText("New Report").closest("a");
    expect(newReportLink).toHaveAttribute("href", "/new");
  });
});
