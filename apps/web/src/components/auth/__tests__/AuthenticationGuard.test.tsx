import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import AuthenticationGuard, {
  withAuthenticationGuard,
} from "../AuthenticationGuard";
import { useUnifiedAuth } from "@/hooks/useUnifiedAuth";
import { useUnifiedRouting } from "@/hooks/useUnifiedRouting";
import { UserRole, ModuleType } from "@/types/unified-auth";

// Mock the hooks
vi.mock("@/hooks/useUnifiedAuth", () => ({
  useUnifiedAuth: vi.fn(),
}));

vi.mock("@/hooks/useUnifiedRouting", () => ({
  useUnifiedRouting: vi.fn(),
}));

// Mock the UnifiedLoginPage component
vi.mock("../UnifiedLoginPage", () => ({
  default: () => <div data-testid="unified-login-page">Login Page</div>,
}));

describe("AuthenticationGuard", () => {
  const mockLogin = vi.fn();
  const mockLogout = vi.fn();
  const mockClearAuthError = vi.fn();
  const mockGetUserModules = vi.fn();
  const mockIsAdmin = vi.fn();
  const mockIsDemoUser = vi.fn();
  const mockGetDefaultModule = vi.fn();
  const mockHandlePostLoginNavigation = vi.fn();
  const mockNavigateToModule = vi.fn();
  const mockNavigateToDashboard = vi.fn();
  const mockHandleUnauthorizedAccess = vi.fn();
  const mockIsRouteAccessible = vi.fn();
  const mockCanAccessModule = vi.fn();

  const defaultAuthState = {
    user: null,
    isLoading: false,
    isAuthenticated: false,
    authError: null,
    login: mockLogin,
    logout: mockLogout,
    clearAuthError: mockClearAuthError,
    getUserModules: mockGetUserModules,
    isAdmin: mockIsAdmin,
    isDemoUser: mockIsDemoUser,
    getDefaultModule: mockGetDefaultModule,
    userRole: null,
    userName: null,
    userEmail: null,
  };

  const defaultRoutingState = {
    handlePostLoginNavigation: mockHandlePostLoginNavigation,
    navigateToModule: mockNavigateToModule,
    navigateToDashboard: mockNavigateToDashboard,
    handleUnauthorizedAccess: mockHandleUnauthorizedAccess,
    isRouteAccessible: mockIsRouteAccessible,
    canAccessModule: mockCanAccessModule,
    shouldShowDashboard: false,
  };

  const mockUser = {
    id: "1",
    email: "test@example.com",
    name: "Test User",
    username: "testuser",
    role: UserRole.CUSTOMER,
    moduleAccess: [
      {
        moduleType: ModuleType.POST_SECONDARY,
        accessLevel: "full" as const,
        permissions: [],
      },
    ],
    preferences: {
      defaultModule: undefined,
      dashboardLayout: "grid" as const,
      theme: "light" as const,
      notifications: {
        email: true,
        browser: true,
        reportComplete: true,
        systemUpdates: true,
      },
    },
    lastLogin: new Date(),
  };

  beforeEach(() => {
    vi.mocked(useUnifiedAuth).mockReturnValue(defaultAuthState);
    vi.mocked(useUnifiedRouting).mockReturnValue(defaultRoutingState);
    mockGetUserModules.mockReturnValue([]);
    mockIsAdmin.mockReturnValue(false);
    mockIsDemoUser.mockReturnValue(false);
    mockGetDefaultModule.mockReturnValue(null);
    mockIsRouteAccessible.mockReturnValue(true);
    mockCanAccessModule.mockReturnValue(true);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Loading State", () => {
    it("should show loading spinner when checking auth status", () => {
      vi.mocked(useUnifiedAuth).mockReturnValue({
        ...defaultAuthState,
        isLoading: true,
      });

      render(
        <AuthenticationGuard>
          <div>Protected Content</div>
        </AuthenticationGuard>
      );

      expect(
        screen.getByText("Checking authentication...")
      ).toBeInTheDocument();
      expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
    });
  });

  describe("Unauthenticated Access", () => {
    it("should show login page when user is not authenticated", () => {
      render(
        <AuthenticationGuard>
          <div>Protected Content</div>
        </AuthenticationGuard>
      );

      expect(screen.getByTestId("unified-login-page")).toBeInTheDocument();
      expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
    });

    it("should call handleUnauthorizedAccess when user is not authenticated", async () => {
      render(
        <AuthenticationGuard redirectOnUnauthorized="/custom-redirect">
          <div>Protected Content</div>
        </AuthenticationGuard>
      );

      await waitFor(() => {
        expect(mockHandleUnauthorizedAccess).toHaveBeenCalledWith(
          "/custom-redirect"
        );
      });
    });

    it("should not require auth when requiresAuth is false", () => {
      render(
        <AuthenticationGuard requiresAuth={false}>
          <div>Public Content</div>
        </AuthenticationGuard>
      );

      expect(screen.getByText("Public Content")).toBeInTheDocument();
      expect(
        screen.queryByTestId("unified-login-page")
      ).not.toBeInTheDocument();
    });
  });

  describe("Authenticated Access", () => {
    beforeEach(() => {
      vi.mocked(useUnifiedAuth).mockReturnValue({
        ...defaultAuthState,
        user: mockUser,
        isAuthenticated: true,
      });
    });

    it("should render protected content when user is authenticated", () => {
      render(
        <AuthenticationGuard>
          <div>Protected Content</div>
        </AuthenticationGuard>
      );

      expect(screen.getByText("Protected Content")).toBeInTheDocument();
    });

    it("should render content when no role restrictions are specified", () => {
      render(
        <AuthenticationGuard>
          <div>Protected Content</div>
        </AuthenticationGuard>
      );

      expect(screen.getByText("Protected Content")).toBeInTheDocument();
    });
  });

  describe("Role-Based Access Control", () => {
    beforeEach(() => {
      vi.mocked(useUnifiedAuth).mockReturnValue({
        ...defaultAuthState,
        user: mockUser,
        isAuthenticated: true,
      });
    });

    it("should allow access when user has required role", () => {
      render(
        <AuthenticationGuard allowedRoles={[UserRole.CUSTOMER]}>
          <div>Role Protected Content</div>
        </AuthenticationGuard>
      );

      expect(screen.getByText("Role Protected Content")).toBeInTheDocument();
    });

    it("should deny access when user lacks required role", () => {
      render(
        <AuthenticationGuard allowedRoles={[UserRole.SYSTEM_ADMIN]}>
          <div>Admin Only Content</div>
        </AuthenticationGuard>
      );

      expect(
        screen.getByText("Access Denied - Insufficient Permissions")
      ).toBeInTheDocument();
      expect(screen.queryByText("Admin Only Content")).not.toBeInTheDocument();
    });

    it("should show upgrade option for demo users", () => {
      const demoUser = { ...mockUser, role: UserRole.DEMO };
      vi.mocked(useUnifiedAuth).mockReturnValue({
        ...defaultAuthState,
        user: demoUser,
        isAuthenticated: true,
        isDemoUser: vi.fn(() => true),
      });

      render(
        <AuthenticationGuard allowedRoles={[UserRole.SYSTEM_ADMIN]}>
          <div>Admin Only Content</div>
        </AuthenticationGuard>
      );

      expect(screen.getByTestId("button-upgrade-account")).toBeInTheDocument();
    });
  });

  describe("Module-Based Access Control", () => {
    beforeEach(() => {
      vi.mocked(useUnifiedAuth).mockReturnValue({
        ...defaultAuthState,
        user: mockUser,
        isAuthenticated: true,
        getUserModules: vi.fn(() => [
          {
            moduleType: ModuleType.POST_SECONDARY,
            accessLevel: "full" as const,
            permissions: [],
          },
        ]),
      });
    });

    it("should allow access when user has required module access", () => {
      mockCanAccessModule.mockReturnValue(true);

      render(
        <AuthenticationGuard allowedModules={[ModuleType.POST_SECONDARY]}>
          <div>Module Protected Content</div>
        </AuthenticationGuard>
      );

      expect(screen.getByText("Module Protected Content")).toBeInTheDocument();
    });

    it("should deny access when user lacks required module access", () => {
      mockCanAccessModule.mockReturnValue(false);

      render(
        <AuthenticationGuard allowedModules={[ModuleType.K12]}>
          <div>K12 Only Content</div>
        </AuthenticationGuard>
      );

      expect(
        screen.getByText("Access Denied - Module Access Required")
      ).toBeInTheDocument();
      expect(screen.queryByText("K12 Only Content")).not.toBeInTheDocument();
    });
  });

  describe("Route Accessibility", () => {
    beforeEach(() => {
      vi.mocked(useUnifiedAuth).mockReturnValue({
        ...defaultAuthState,
        user: mockUser,
        isAuthenticated: true,
      });
    });

    it("should allow access when route is accessible", () => {
      mockIsRouteAccessible.mockReturnValue(true);

      render(
        <AuthenticationGuard>
          <div>Accessible Content</div>
        </AuthenticationGuard>
      );

      expect(screen.getByText("Accessible Content")).toBeInTheDocument();
    });

    it("should deny access when route is not accessible", () => {
      mockIsRouteAccessible.mockReturnValue(false);

      render(
        <AuthenticationGuard>
          <div>Inaccessible Content</div>
        </AuthenticationGuard>
      );

      expect(
        screen.getByText("Access Denied - Route Not Accessible")
      ).toBeInTheDocument();
      expect(
        screen.queryByText("Inaccessible Content")
      ).not.toBeInTheDocument();
    });
  });

  describe("Error Actions", () => {
    beforeEach(() => {
      vi.mocked(useUnifiedAuth).mockReturnValue({
        ...defaultAuthState,
        user: mockUser,
        isAuthenticated: true,
      });

      // Mock window methods
      Object.defineProperty(window, "location", {
        value: { href: "" },
        writable: true,
      });

      Object.defineProperty(window, "history", {
        value: { back: vi.fn() },
        writable: true,
      });
    });

    it("should provide contact support button", () => {
      render(
        <AuthenticationGuard allowedRoles={[UserRole.SYSTEM_ADMIN]}>
          <div>Admin Content</div>
        </AuthenticationGuard>
      );

      expect(screen.getByTestId("button-contact-support")).toBeInTheDocument();
    });

    it("should provide go back button", () => {
      render(
        <AuthenticationGuard allowedRoles={[UserRole.SYSTEM_ADMIN]}>
          <div>Admin Content</div>
        </AuthenticationGuard>
      );

      expect(screen.getByTestId("button-go-back")).toBeInTheDocument();
    });
  });

  describe("Admin Debug Information", () => {
    it("should show debug information for admin users", () => {
      const adminUser = { ...mockUser, role: UserRole.SYSTEM_ADMIN };
      vi.mocked(useUnifiedAuth).mockReturnValue({
        ...defaultAuthState,
        user: adminUser,
        isAuthenticated: true,
        isAdmin: vi.fn(() => true),
      });

      render(
        <AuthenticationGuard allowedRoles={[UserRole.DEVELOPER]}>
          <div>Developer Content</div>
        </AuthenticationGuard>
      );

      expect(screen.getByText("Debug Information")).toBeInTheDocument();
      expect(screen.getByText("User Role: system_admin")).toBeInTheDocument();
    });

    it("should not show debug information for non-admin users", () => {
      render(
        <AuthenticationGuard allowedRoles={[UserRole.SYSTEM_ADMIN]}>
          <div>Admin Content</div>
        </AuthenticationGuard>
      );

      expect(screen.queryByText("Debug Information")).not.toBeInTheDocument();
    });
  });

  describe("Higher-Order Component", () => {
    const TestComponent = () => <div>Test Component</div>;

    it("should create a guarded component with HOC", () => {
      const GuardedComponent = withAuthenticationGuard(TestComponent, {
        requiresAuth: true,
        allowedRoles: [UserRole.CUSTOMER],
      });

      vi.mocked(useUnifiedAuth).mockReturnValue({
        ...defaultAuthState,
        user: mockUser,
        isAuthenticated: true,
      });

      render(<GuardedComponent />);

      expect(screen.getByText("Test Component")).toBeInTheDocument();
    });

    it("should set proper display name for HOC", () => {
      const GuardedComponent = withAuthenticationGuard(TestComponent, {
        requiresAuth: true,
      });

      expect(GuardedComponent.displayName).toBe(
        "withAuthenticationGuard(TestComponent)"
      );
    });
  });

  describe("Security Features", () => {
    it("should handle multiple role requirements", () => {
      vi.mocked(useUnifiedAuth).mockReturnValue({
        ...defaultAuthState,
        user: mockUser,
        isAuthenticated: true,
      });

      render(
        <AuthenticationGuard
          allowedRoles={[UserRole.SYSTEM_ADMIN, UserRole.DEVELOPER]}
        >
          <div>Multi-Role Content</div>
        </AuthenticationGuard>
      );

      expect(
        screen.getByText("Access Denied - Insufficient Permissions")
      ).toBeInTheDocument();
    });

    it("should handle multiple module requirements", () => {
      mockCanAccessModule.mockImplementation(
        (module) => module === ModuleType.POST_SECONDARY
      );

      vi.mocked(useUnifiedAuth).mockReturnValue({
        ...defaultAuthState,
        user: mockUser,
        isAuthenticated: true,
      });

      render(
        <AuthenticationGuard
          allowedModules={[ModuleType.K12, ModuleType.TUTORING]}
        >
          <div>Multi-Module Content</div>
        </AuthenticationGuard>
      );

      expect(
        screen.getByText("Access Denied - Module Access Required")
      ).toBeInTheDocument();
    });
  });
});
