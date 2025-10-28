import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  AuthenticationLoading,
  ModuleDashboardSkeleton,
  ModuleLoading,
  EmptyState,
  ProgressIndicator,
  LoadingOverlay,
} from "../../shared/LoadingStates";

// Mock window methods
const mockOpen = vi.fn();
Object.defineProperty(window, "open", {
  value: mockOpen,
  writable: true,
});

describe("AuthenticationLoading", () => {
  it("renders authenticating stage correctly", () => {
    render(<AuthenticationLoading stage="authenticating" />);

    expect(screen.getByText("Signing you in...")).toBeInTheDocument();
    expect(screen.getByText("Verifying your credentials")).toBeInTheDocument();
    expect(screen.getByText("25% complete")).toBeInTheDocument();
  });

  it("renders loading profile stage correctly", () => {
    render(<AuthenticationLoading stage="loading_profile" />);

    expect(screen.getByText("Loading your profile...")).toBeInTheDocument();
    expect(
      screen.getByText("Retrieving your account information")
    ).toBeInTheDocument();
    expect(screen.getByText("50% complete")).toBeInTheDocument();
  });

  it("renders checking permissions stage correctly", () => {
    render(<AuthenticationLoading stage="checking_permissions" />);

    expect(screen.getByText("Checking permissions...")).toBeInTheDocument();
    expect(
      screen.getByText("Determining your module access")
    ).toBeInTheDocument();
    expect(screen.getByText("75% complete")).toBeInTheDocument();
  });

  it("renders redirecting stage correctly", () => {
    render(<AuthenticationLoading stage="redirecting" />);

    expect(screen.getByText("Almost ready...")).toBeInTheDocument();
    expect(
      screen.getByText("Taking you to your dashboard")
    ).toBeInTheDocument();
    expect(screen.getByText("100% complete")).toBeInTheDocument();
  });

  it("renders custom message when provided", () => {
    render(
      <AuthenticationLoading
        stage="authenticating"
        message="Custom loading message"
      />
    );

    expect(screen.getByText("Custom loading message")).toBeInTheDocument();
  });
});

describe("ModuleDashboardSkeleton", () => {
  it("renders skeleton structure correctly", () => {
    const { container } = render(<ModuleDashboardSkeleton />);

    // Should render skeleton elements with animate-pulse class
    const skeletonElements = container.querySelectorAll(".animate-pulse");
    expect(skeletonElements.length).toBeGreaterThan(0);

    // Should render card structure
    const cards = container.querySelectorAll(".rounded-lg.border");
    expect(cards.length).toBeGreaterThan(0);
  });
});

describe("ModuleLoading", () => {
  it("renders K-12 module loading correctly", () => {
    render(<ModuleLoading moduleName="K-12" stage="initializing" />);

    expect(screen.getByText("Initializing K-12...")).toBeInTheDocument();
    expect(
      screen.getByText("Setting up the module environment")
    ).toBeInTheDocument();
    expect(screen.getByText("25% complete")).toBeInTheDocument();
  });

  it("renders post-secondary module loading correctly", () => {
    render(<ModuleLoading moduleName="Post-Secondary" stage="loading_data" />);

    expect(
      screen.getByText("Loading Post-Secondary data...")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Retrieving your reports and settings")
    ).toBeInTheDocument();
    expect(screen.getByText("50% complete")).toBeInTheDocument();
  });

  it("uses custom progress when provided", () => {
    render(
      <ModuleLoading
        moduleName="Tutoring"
        stage="preparing_interface"
        progress={85}
      />
    );

    expect(screen.getByText("85% complete")).toBeInTheDocument();
  });
});

describe("EmptyState", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders no modules empty state", () => {
    render(<EmptyState type="no_modules" />);

    expect(screen.getByText("No Modules Available")).toBeInTheDocument();
    expect(
      screen.getByText(/you don't have access to any modules yet/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /contact administrator/i })
    ).toBeInTheDocument();
  });

  it("renders no reports empty state", () => {
    render(<EmptyState type="no_reports" />);

    expect(screen.getByText("No Reports Yet")).toBeInTheDocument();
    expect(
      screen.getByText(/you haven't created any reports yet/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /create report/i })
    ).toBeInTheDocument();
  });

  it("renders demo expired empty state", () => {
    render(<EmptyState type="demo_expired" />);

    expect(screen.getByText("Demo Period Expired")).toBeInTheDocument();
    expect(
      screen.getByText(/your demo access has expired/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /upgrade now/i })
    ).toBeInTheDocument();
  });

  it("uses custom title and description", () => {
    render(
      <EmptyState
        type="no_activity"
        title="Custom Title"
        description="Custom description text"
      />
    );

    expect(screen.getByText("Custom Title")).toBeInTheDocument();
    expect(screen.getByText("Custom description text")).toBeInTheDocument();
  });

  it("handles custom actions", () => {
    const mockAction = vi.fn();
    const customActions = [
      {
        label: "Custom Action",
        action: mockAction,
        variant: "default" as const,
      },
    ];

    render(<EmptyState type="no_activity" actions={customActions} />);

    const button = screen.getByRole("button", { name: /custom action/i });
    fireEvent.click(button);
    expect(mockAction).toHaveBeenCalledTimes(1);
  });
});

describe("ProgressIndicator", () => {
  it("renders progress steps correctly", () => {
    const steps = [
      { label: "Step 1", status: "completed" as const },
      { label: "Step 2", status: "current" as const },
      { label: "Step 3", status: "pending" as const },
      { label: "Step 4", status: "error" as const },
    ];

    render(<ProgressIndicator steps={steps} />);

    expect(screen.getByText("Step 1")).toBeInTheDocument();
    expect(screen.getByText("Step 2")).toBeInTheDocument();
    expect(screen.getByText("Step 3")).toBeInTheDocument();
    expect(screen.getByText("Step 4")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const steps = [{ label: "Test", status: "current" as const }];
    const { container } = render(
      <ProgressIndicator steps={steps} className="custom-class" />
    );

    expect(container.firstChild).toHaveClass("custom-class");
  });
});

describe("LoadingOverlay", () => {
  it("shows loading overlay when loading", () => {
    render(
      <LoadingOverlay isLoading={true} message="Loading content...">
        <div>Content</div>
      </LoadingOverlay>
    );

    expect(screen.getByText("Loading content...")).toBeInTheDocument();
    expect(screen.getByText("Content")).toBeInTheDocument();
  });

  it("hides loading overlay when not loading", () => {
    render(
      <LoadingOverlay isLoading={false}>
        <div>Content</div>
      </LoadingOverlay>
    );

    expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    expect(screen.getByText("Content")).toBeInTheDocument();
  });

  it("uses default loading message", () => {
    render(
      <LoadingOverlay isLoading={true}>
        <div>Content</div>
      </LoadingOverlay>
    );

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });
});
