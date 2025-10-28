import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AdminQuickActions } from "../../dashboard/AdminQuickActions";
import { UserRole } from "@/types/unified-auth";
import type { AuthenticatedUser, AdminFeature } from "@/types/unified-auth";

describe("AdminQuickActions", () => {
  const mockUser: AuthenticatedUser = {
    id: "1",
    email: "admin@example.com",
    name: "Admin User",
    username: "admin",
    role: UserRole.SYSTEM_ADMIN,
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
    lastLogin: new Date(),
  };

  const mockAdminFeatures: AdminFeature[] = [
    {
      id: "user-management",
      title: "User Management",
      description: "Manage system users and permissions",
      icon: "Users",
      route: "/admin/users",
      requiredRole: [UserRole.SYSTEM_ADMIN, UserRole.DEVELOPER],
    },
    {
      id: "organization-management",
      title: "Organization Management",
      description: "Manage organizations and settings",
      icon: "Shield",
      route: "/admin/organizations",
      requiredRole: [UserRole.SYSTEM_ADMIN],
    },
    {
      id: "performance-dashboard",
      title: "Performance Dashboard",
      description: "Monitor system performance and metrics",
      icon: "BarChart3",
      route: "/admin/performance",
      requiredRole: [UserRole.DEVELOPER],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock window.location.href
    const originalLocation = window.location;
    delete (window as any).location;
    window.location = { ...originalLocation, href: "" };
  });

  afterEach(() => {
    // Restore original location
    vi.restoreAllMocks();
  });

  it("renders admin quick actions title", () => {
    render(<AdminQuickActions user={mockUser} features={mockAdminFeatures} />);

    expect(screen.getByText("Admin Quick Actions")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Manage system settings, users, and monitor platform performance."
      )
    ).toBeInTheDocument();
  });

  it("filters features based on user role", () => {
    render(<AdminQuickActions user={mockUser} features={mockAdminFeatures} />);

    // System admin should see user management and organization management
    expect(screen.getByText("User Management")).toBeInTheDocument();
    expect(screen.getByText("Organization Management")).toBeInTheDocument();

    // Should not see performance dashboard (developer only)
    expect(screen.queryByText("Performance Dashboard")).not.toBeInTheDocument();
  });

  it("shows all features for developer role", () => {
    const developerUser = { ...mockUser, role: UserRole.DEVELOPER };

    render(
      <AdminQuickActions user={developerUser} features={mockAdminFeatures} />
    );

    expect(screen.getByText("User Management")).toBeInTheDocument();
    expect(screen.getByText("Performance Dashboard")).toBeInTheDocument();
    // Should not see organization management (not in developer's required roles)
    expect(
      screen.queryByText("Organization Management")
    ).not.toBeInTheDocument();
  });

  it("handles feature button clicks", () => {
    render(<AdminQuickActions user={mockUser} features={mockAdminFeatures} />);

    fireEvent.click(screen.getByText("User Management"));
    expect(window.location.href).toBe("/admin/users");
  });

  it("displays feature descriptions", () => {
    render(<AdminQuickActions user={mockUser} features={mockAdminFeatures} />);

    expect(
      screen.getByText("Manage system users and permissions")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Manage organizations and settings")
    ).toBeInTheDocument();
  });

  it("shows system status for developers and system admins", () => {
    render(<AdminQuickActions user={mockUser} features={mockAdminFeatures} />);

    expect(screen.getByText("System Status")).toBeInTheDocument();
    expect(screen.getByText("API Online")).toBeInTheDocument();
    expect(screen.getByText("Database Connected")).toBeInTheDocument();
    expect(screen.getByText("Queue: 3 jobs")).toBeInTheDocument();
  });

  it("hides system status for non-privileged users", () => {
    const orgAdminUser = { ...mockUser, role: UserRole.ORG_ADMIN };

    render(
      <AdminQuickActions user={orgAdminUser} features={mockAdminFeatures} />
    );

    expect(screen.queryByText("System Status")).not.toBeInTheDocument();
  });

  it("returns null when no accessible features", () => {
    const customerUser = { ...mockUser, role: UserRole.CUSTOMER };

    const { container } = render(
      <AdminQuickActions user={customerUser} features={mockAdminFeatures} />
    );

    expect(container.firstChild).toBeNull();
  });

  it("renders empty when features array is empty", () => {
    const { container } = render(
      <AdminQuickActions user={mockUser} features={[]} />
    );

    expect(container.firstChild).toBeNull();
  });

  it("has proper button styling and hover effects", () => {
    render(<AdminQuickActions user={mockUser} features={mockAdminFeatures} />);

    const userManagementButton = screen
      .getByText("User Management")
      .closest("button");
    expect(userManagementButton).toHaveClass("group");
    expect(userManagementButton).toHaveClass("hover:bg-white");
  });
});
