import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { ReactNode } from "react";
import { useUnifiedRouting } from "../useUnifiedRouting";
import { AuthProvider } from "@/contexts/AuthContext";
import { NavigationProvider } from "@/contexts/NavigationContext";
import { ModuleProvider } from "@/contexts/ModuleContext";
import { AuthenticatedUser, ModuleType, UserRole } from "@/types/unified-auth";

// Mock the auth context
const mockUser: AuthenticatedUser = {
  id: "test-user-1",
  email: "test@example.com",
  name: "Test User",
  username: "testuser",
  role: UserRole.CUSTOMER,
  organizationId: "org-1",
  moduleAccess: [
    {
      moduleType: ModuleType.K12,
      accessLevel: "full",
      permissions: [],
    },
  ],
  preferences: {
    dashboardLayout: "grid",
    theme: "auto",
    notifications: {
      email: true,
      browser: true,
      reportComplete: true,
      systemUpdates: false,
    },
  },
  lastLogin: new Date(),
};

const mockNavigate = vi.fn();

// Mock react-router-dom
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: "/", search: "", hash: "" }),
  };
});

// Mock the auth context
vi.mock("@/contexts/AuthContext", () => ({
  AuthProvider: ({ children }: { children: ReactNode }) => children,
  useAuth: () => ({
    user: mockUser,
    isAuthenticated: true,
    login: vi.fn(),
    logout: vi.fn(),
    isLoading: false,
  }),
}));

// Mock the module context
vi.mock("@/contexts/ModuleContext", () => ({
  ModuleProvider: ({ children }: { children: ReactNode }) => children,
  useModule: () => ({
    activeModule: "k12",
    setActiveModule: vi.fn(),
  }),
}));

const wrapper = ({ children }: { children: ReactNode }) => (
  <BrowserRouter>
    <AuthProvider>
      <ModuleProvider>
        <NavigationProvider>{children}</NavigationProvider>
      </ModuleProvider>
    </AuthProvider>
  </BrowserRouter>
);

describe("useUnifiedRouting", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("handlePostLoginNavigation", () => {
    it("should navigate to single module for single-access users", () => {
      const { result } = renderHook(() => useUnifiedRouting(), { wrapper });

      act(() => {
        result.current.handlePostLoginNavigation();
      });

      expect(mockNavigate).toHaveBeenCalledWith("/k12", { replace: true });
    });

    it("should navigate to dashboard for multi-module users", () => {
      // Mock multi-module user
      const multiModuleUser = {
        ...mockUser,
        moduleAccess: [
          {
            moduleType: ModuleType.K12,
            accessLevel: "full" as const,
            permissions: [],
          },
          {
            moduleType: ModuleType.POST_SECONDARY,
            accessLevel: "full" as const,
            permissions: [],
          },
        ],
      };

      vi.mocked(vi.importActual("@/contexts/AuthContext")).useAuth = () => ({
        user: multiModuleUser,
        isAuthenticated: true,
        login: vi.fn(),
        logout: vi.fn(),
        isLoading: false,
      });

      const { result } = renderHook(() => useUnifiedRouting(), { wrapper });

      act(() => {
        result.current.handlePostLoginNavigation();
      });

      expect(mockNavigate).toHaveBeenCalledWith("/dashboard", {
        replace: true,
      });
    });
  });

  describe("navigateToModule", () => {
    it("should navigate to accessible modules", () => {
      const { result } = renderHook(() => useUnifiedRouting(), { wrapper });

      act(() => {
        result.current.navigateToModule(ModuleType.K12);
      });

      expect(mockNavigate).toHaveBeenCalledWith("/k12");
    });

    it("should not navigate to inaccessible modules", () => {
      const { result } = renderHook(() => useUnifiedRouting(), { wrapper });

      act(() => {
        result.current.navigateToModule(ModuleType.TUTORING);
      });

      // Should not navigate since user doesn't have access
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe("navigateToDashboard", () => {
    it("should navigate to dashboard for multi-module users", () => {
      // Mock multi-module user
      const multiModuleUser = {
        ...mockUser,
        moduleAccess: [
          {
            moduleType: ModuleType.K12,
            accessLevel: "full" as const,
            permissions: [],
          },
          {
            moduleType: ModuleType.POST_SECONDARY,
            accessLevel: "full" as const,
            permissions: [],
          },
        ],
      };

      vi.mocked(vi.importActual("@/contexts/AuthContext")).useAuth = () => ({
        user: multiModuleUser,
        isAuthenticated: true,
        login: vi.fn(),
        logout: vi.fn(),
        isLoading: false,
      });

      const { result } = renderHook(() => useUnifiedRouting(), { wrapper });

      act(() => {
        result.current.navigateToDashboard();
      });

      expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
    });

    it("should navigate to primary module for single-module users", () => {
      const { result } = renderHook(() => useUnifiedRouting(), { wrapper });

      act(() => {
        result.current.navigateToDashboard();
      });

      expect(mockNavigate).toHaveBeenCalledWith("/k12");
    });
  });

  describe("handleUnauthorizedAccess", () => {
    it("should redirect to login for unauthenticated users", () => {
      // Mock unauthenticated state
      vi.mocked(vi.importActual("@/contexts/AuthContext")).useAuth = () => ({
        user: null,
        isAuthenticated: false,
        login: vi.fn(),
        logout: vi.fn(),
        isLoading: false,
      });

      const { result } = renderHook(() => useUnifiedRouting(), { wrapper });

      act(() => {
        result.current.handleUnauthorizedAccess("/protected-route");
      });

      expect(mockNavigate).toHaveBeenCalledWith("/login", { replace: true });
    });

    it("should not redirect for authenticated users", () => {
      const { result } = renderHook(() => useUnifiedRouting(), { wrapper });

      act(() => {
        result.current.handleUnauthorizedAccess("/some-route");
      });

      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe("isRouteAccessible", () => {
    it("should return true for accessible routes", () => {
      const { result } = renderHook(() => useUnifiedRouting(), { wrapper });

      const isAccessible = result.current.isRouteAccessible(
        [UserRole.CUSTOMER],
        [ModuleType.K12]
      );

      expect(isAccessible).toBe(true);
    });

    it("should return false for inaccessible routes by role", () => {
      const { result } = renderHook(() => useUnifiedRouting(), { wrapper });

      const isAccessible = result.current.isRouteAccessible(
        [UserRole.SYSTEM_ADMIN],
        [ModuleType.K12]
      );

      expect(isAccessible).toBe(false);
    });

    it("should return false for inaccessible routes by module", () => {
      const { result } = renderHook(() => useUnifiedRouting(), { wrapper });

      const isAccessible = result.current.isRouteAccessible(
        [UserRole.CUSTOMER],
        [ModuleType.TUTORING]
      );

      expect(isAccessible).toBe(false);
    });
  });

  describe("canAccessModule", () => {
    it("should return true for accessible modules", () => {
      const { result } = renderHook(() => useUnifiedRouting(), { wrapper });

      expect(result.current.canAccessModule(ModuleType.K12)).toBe(true);
    });

    it("should return false for inaccessible modules", () => {
      const { result } = renderHook(() => useUnifiedRouting(), { wrapper });

      expect(result.current.canAccessModule(ModuleType.TUTORING)).toBe(false);
    });
  });

  describe("shouldShowDashboard", () => {
    it("should return false for single-module users", () => {
      const { result } = renderHook(() => useUnifiedRouting(), { wrapper });

      expect(result.current.shouldShowDashboard).toBe(false);
    });

    it("should return true for multi-module users", () => {
      // Mock multi-module user
      const multiModuleUser = {
        ...mockUser,
        moduleAccess: [
          {
            moduleType: ModuleType.K12,
            accessLevel: "full" as const,
            permissions: [],
          },
          {
            moduleType: ModuleType.POST_SECONDARY,
            accessLevel: "full" as const,
            permissions: [],
          },
        ],
      };

      vi.mocked(vi.importActual("@/contexts/AuthContext")).useAuth = () => ({
        user: multiModuleUser,
        isAuthenticated: true,
        login: vi.fn(),
        logout: vi.fn(),
        isLoading: false,
      });

      const { result } = renderHook(() => useUnifiedRouting(), { wrapper });

      expect(result.current.shouldShowDashboard).toBe(true);
    });
  });
});
