import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { WelcomeHeader } from "../../dashboard/WelcomeHeader";
import { UserRole } from "@/types/unified-auth";
import type { AuthenticatedUser } from "@/types/unified-auth";

describe("WelcomeHeader", () => {
  const mockOnSettingsClick = vi.fn();

  const createMockUser = (
    role: UserRole,
    overrides: Partial<AuthenticatedUser> = {}
  ): AuthenticatedUser => ({
    id: "1",
    email: "test@example.com",
    name: "Test User",
    username: "testuser",
    role,
    moduleAccess: [],
    preferences: {
      dashboardLayout: "grid",
      theme: "light",
      notifications: {
        email: true,
        browser: true,
        reportComplete: true,
        systemUpdates: false,
      },
    },
    lastLogin: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders user name and greeting", () => {
    const user = createMockUser(UserRole.CUSTOMER);

    render(<WelcomeHeader user={user} onSettingsClick={mockOnSettingsClick} />);

    expect(screen.getByText("Welcome back, Test User")).toBeInTheDocument();
  });

  it("displays correct role badge for customer", () => {
    const user = createMockUser(UserRole.CUSTOMER);

    render(<WelcomeHeader user={user} onSettingsClick={mockOnSettingsClick} />);

    expect(screen.getByText("User")).toBeInTheDocument();
  });

  it("displays correct role badge for developer", () => {
    const user = createMockUser(UserRole.DEVELOPER);

    render(<WelcomeHeader user={user} onSettingsClick={mockOnSettingsClick} />);

    expect(screen.getByText("Developer")).toBeInTheDocument();
    expect(screen.getByText(/Welcome back, Developer/)).toBeInTheDocument();
  });

  it("displays correct role badge for system admin", () => {
    const user = createMockUser(UserRole.SYSTEM_ADMIN);

    render(<WelcomeHeader user={user} onSettingsClick={mockOnSettingsClick} />);

    expect(screen.getByText("System Admin")).toBeInTheDocument();
    expect(screen.getByText(/Welcome back, Administrator/)).toBeInTheDocument();
  });

  it("displays correct role badge for org admin", () => {
    const user = createMockUser(UserRole.ORG_ADMIN, {
      organizationId: "org-123",
    });

    render(<WelcomeHeader user={user} onSettingsClick={mockOnSettingsClick} />);

    expect(screen.getByText("Organization Admin")).toBeInTheDocument();
    expect(screen.getByText("Managing organization:")).toBeInTheDocument();
    expect(screen.getByText("org-123")).toBeInTheDocument();
  });

  it("displays demo user badge and upgrade button", () => {
    const user = createMockUser(UserRole.DEMO, {
      demoExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    });

    render(<WelcomeHeader user={user} onSettingsClick={mockOnSettingsClick} />);

    expect(screen.getByText("Demo User")).toBeInTheDocument();
    expect(screen.getByText(/Welcome to THRIVE/)).toBeInTheDocument();
    expect(screen.getByText("Upgrade Account")).toBeInTheDocument();
    expect(screen.getByText("Demo Mode Active")).toBeInTheDocument();
  });

  it("formats last login time correctly", () => {
    const user = createMockUser(UserRole.CUSTOMER);

    render(<WelcomeHeader user={user} onSettingsClick={mockOnSettingsClick} />);

    expect(screen.getByText("Last login: 2 hours ago")).toBeInTheDocument();
  });

  it("handles settings button click", () => {
    const user = createMockUser(UserRole.CUSTOMER);

    render(<WelcomeHeader user={user} onSettingsClick={mockOnSettingsClick} />);

    fireEvent.click(screen.getByText("Settings"));
    expect(mockOnSettingsClick).toHaveBeenCalledTimes(1);
  });

  it("shows organization info for org admin", () => {
    const user = createMockUser(UserRole.ORG_ADMIN, {
      organizationId: "test-org",
    });

    render(<WelcomeHeader user={user} onSettingsClick={mockOnSettingsClick} />);

    expect(screen.getByText("Managing organization:")).toBeInTheDocument();
    expect(screen.getByText("test-org")).toBeInTheDocument();
  });

  it("shows demo warning for demo users", () => {
    const user = createMockUser(UserRole.DEMO, {
      demoExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    render(<WelcomeHeader user={user} onSettingsClick={mockOnSettingsClick} />);

    expect(screen.getByText("Demo Mode Active")).toBeInTheDocument();
    expect(
      screen.getByText(/You're exploring THRIVE in demo mode/)
    ).toBeInTheDocument();
  });

  it("displays role-specific descriptions", () => {
    const developerUser = createMockUser(UserRole.DEVELOPER);
    const { rerender } = render(
      <WelcomeHeader
        user={developerUser}
        onSettingsClick={mockOnSettingsClick}
      />
    );

    expect(
      screen.getByText(
        "You have full system access and development privileges."
      )
    ).toBeInTheDocument();

    const customerUser = createMockUser(UserRole.CUSTOMER);
    rerender(
      <WelcomeHeader
        user={customerUser}
        onSettingsClick={mockOnSettingsClick}
      />
    );

    expect(
      screen.getByText("Access your assessment tools and reports.")
    ).toBeInTheDocument();
  });
});
