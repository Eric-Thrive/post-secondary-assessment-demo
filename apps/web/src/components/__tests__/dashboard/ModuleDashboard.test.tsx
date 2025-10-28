import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ModuleDashboard } from "../../dashboard/ModuleDashboard";
import { UserRole, ModuleType } from "@/types/unified-auth";
import type {
  AuthenticatedUser,
  ModuleAccess,
  RecentActivity,
  AdminFeature,
} from "@/types/unified-auth";

// Mock the config modules
vi.mock("@/config/modules", () => ({
  getModuleConfig: vi.fn((moduleType) => ({
    id: moduleType,
    name: moduleType,
    displayName:
      moduleType === "k12"
        ? "K-12 Education"
        : moduleType === "post_secondary"
        ? "Post-Secondary"
        : "Tutoring Services",
    description: "Test description",
    icon: "School",
    color: "navy",
    route: `/${moduleType}`,
    features: ["Feature 1", "Feature 2"],
  })),
}));

// Mock child components
vi.mock("../../dashboard/WelcomeHeader", () => ({
  default: ({ user }: { user: AuthenticatedUser }) => (
    <div data-testid="welcome-header">Welcome {user.name}</div>
  ),
}));

vi.mock("../../dashboard/ModuleCard", () => ({
  default: ({ module, onClick }: { module: any; onClick: () => void }) => (
    <div data-testid={`module-card-${module.id}`} onClick={onClick}>
      {module.displayName}
    </div>
  ),
}));

vi.mock("../../dashboard/AdminQuickActions", () => ({
  default: ({ features }: { features: AdminFeature[] }) => (
    <div data-testid="admin-quick-actions">
      Admin Actions ({features.length})
    </div>
  ),
}));

vi.mock("../../dashboard/RecentActivity", () => ({
  default: ({ activities }: { activities: RecentActivity[] }) => (
    <div data-testid="recent-activity">
      Recent Activity ({activities.length})
    </div>
  ),
}));

describe("ModuleDashboard", () => {
  const mockUser: AuthenticatedUser = {
    id: "1",
    email: "test@example.com",
    name: "Test User",
    username: "testuser",
    role: UserRole.CUSTOMER,
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

  const mockModuleAccess: ModuleAccess[] = [
    {
      moduleType: ModuleType.K12,
      accessLevel: "full",
      permissions: [],
    },
    {
      moduleType: ModuleType.POST_SECONDARY,
      accessLevel: "restricted",
      permissions: [],
    },
  ];

  const mockRecentActivity: RecentActivity[] = [
    {
      id: "1",
      type: "report",
      title: "Test Report",
      moduleType: ModuleType.K12,
      timestamp: new Date(),
      status: "completed",
    },
  ];

  const mockAdminFeatures: AdminFeature[] = [
    {
      id: "user-management",
      title: "User Management",
      description: "Manage users",
      icon: "Users",
      route: "/admin/users",
      requiredRole: [UserRole.SYSTEM_ADMIN],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders welcome header with user information", () => {
    render(
      <ModuleDashboard user={mockUser} availableModules={mockModuleAccess} />
    );

    expect(screen.getByTestId("welcome-header")).toBeInTheDocument();
    expect(screen.getByText("Welcome Test User")).toBeInTheDocument();
  });

  it("renders module cards for accessible modules", () => {
    render(
      <ModuleDashboard user={mockUser} availableModules={mockModuleAccess} />
    );

    expect(screen.getByTestId("module-card-k12")).toBeInTheDocument();
    expect(
      screen.getByTestId("module-card-post_secondary")
    ).toBeInTheDocument();
  });

  it("filters out unavailable modules", () => {
    const moduleAccessWithUnavailable: ModuleAccess[] = [
      ...mockModuleAccess,
      {
        moduleType: ModuleType.TUTORING,
        accessLevel: "unavailable",
        permissions: [],
      },
    ];

    render(
      <ModuleDashboard
        user={mockUser}
        availableModules={moduleAccessWithUnavailable}
      />
    );

    expect(screen.getByTestId("module-card-k12")).toBeInTheDocument();
    expect(
      screen.getByTestId("module-card-post_secondary")
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId("module-card-tutoring")
    ).not.toBeInTheDocument();
  });

  it("shows admin quick actions for admin users", () => {
    const adminUser = { ...mockUser, role: UserRole.SYSTEM_ADMIN };

    render(
      <ModuleDashboard
        user={adminUser}
        availableModules={mockModuleAccess}
        adminFeatures={mockAdminFeatures}
      />
    );

    expect(screen.getByTestId("admin-quick-actions")).toBeInTheDocument();
  });

  it("hides admin quick actions for non-admin users", () => {
    render(
      <ModuleDashboard
        user={mockUser}
        availableModules={mockModuleAccess}
        adminFeatures={mockAdminFeatures}
      />
    );

    expect(screen.queryByTestId("admin-quick-actions")).not.toBeInTheDocument();
  });

  it("shows recent activity when provided", () => {
    render(
      <ModuleDashboard
        user={mockUser}
        availableModules={mockModuleAccess}
        recentActivity={mockRecentActivity}
      />
    );

    expect(screen.getByTestId("recent-activity")).toBeInTheDocument();
  });

  it("shows empty state when no modules are available", () => {
    render(<ModuleDashboard user={mockUser} availableModules={[]} />);

    expect(screen.getByText("No modules available")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Contact your administrator to request access to modules."
      )
    ).toBeInTheDocument();
  });

  it("handles module card clicks", () => {
    // Mock window.location.href
    const originalLocation = window.location;
    delete (window as any).location;
    window.location = { ...originalLocation, href: "" };

    render(
      <ModuleDashboard user={mockUser} availableModules={mockModuleAccess} />
    );

    fireEvent.click(screen.getByTestId("module-card-k12"));
    expect(window.location.href).toBe("/k12");

    // Restore original location
    window.location = originalLocation;
  });

  it("renders help and support section", () => {
    render(
      <ModuleDashboard user={mockUser} availableModules={mockModuleAccess} />
    );

    expect(screen.getByText("Need Help?")).toBeInTheDocument();
    expect(screen.getByText("View Documentation")).toBeInTheDocument();
    expect(screen.getByText("Contact Support")).toBeInTheDocument();
  });
});
