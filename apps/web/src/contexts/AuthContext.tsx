import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useToast } from "@/hooks/use-toast";
import { unifiedAuthIntegration } from "@/services/auth/unified-auth-integration";
import { AuthenticatedUser } from "@/types/unified-auth";

// Legacy User interface for backward compatibility
interface LegacyUser {
  id: number;
  username: string;
  customerId: string;
  customerName: string | null;
  role: string;
}

// Support both legacy and unified user types during transition
type User = LegacyUser | AuthenticatedUser;

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (
    username: string,
    password: string,
    environment?: string
  ) => Promise<boolean>;
  logout: () => Promise<void>;
  register: (
    username: string,
    password: string,
    email: string
  ) => Promise<boolean>;
  getLogoutRedirectPath: () => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Check if user is already logged in on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const result = await unifiedAuthIntegration.checkAuthStatus();

      if (result.isAuthenticated && result.user) {
        setUser(result.user);

        // Enable environment override for system admins on page load/refresh
        unifiedAuthIntegration.enableAdminOverride(result.user);
      }
    } catch (error) {
      console.error("Auth status check failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (
    username: string,
    password: string,
    environment?: string
  ): Promise<boolean> => {
    try {
      const result = await unifiedAuthIntegration.authenticate({
        username,
        password,
        environment,
      });

      if (result.success && result.user) {
        setUser(result.user);

        // Enable environment override for system admins immediately after login
        unifiedAuthIntegration.enableAdminOverride(result.user);

        toast({
          title: "Login Successful",
          description: `Welcome back, ${result.user.username}!`,
        });

        // Don't use server redirect - let the client handle navigation
        // if (result.redirectUrl && typeof result.redirectUrl === "string") {
        //   window.location.assign(result.redirectUrl);
        // }
        return true;
      } else {
        // Check for email verification error
        const resultWithCode = result as any;
        if (resultWithCode.code === "EMAIL_NOT_VERIFIED") {
          toast({
            title: "Email Not Verified",
            description:
              result.error ||
              "Please verify your email address before logging in.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Login Failed",
            description: result.error || "Invalid credentials",
            variant: "destructive",
          });
        }
        return false;
      }
    } catch (error) {
      toast({
        title: "Login Error",
        description: "Failed to connect to server. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  const register = async (
    username: string,
    password: string,
    email: string
  ): Promise<boolean> => {
    try {
      const result = await unifiedAuthIntegration.register(
        username,
        password,
        email
      );

      if (result.success) {
        toast({
          title: "Registration Successful",
          description: `Account created for ${username}. Please log in.`,
        });
        return true;
      } else {
        toast({
          title: "Registration Failed",
          description: result.error || "Failed to create account",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      toast({
        title: "Registration Error",
        description: "Failed to connect to server. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  const getLogoutRedirectPath = (): string => {
    // Detect current path to determine redirect destination
    const currentPath = window.location.pathname;

    // Check if we're in a demo environment
    if (currentPath.startsWith("/post-secondary-demo")) {
      return "/post-secondary-demo";
    } else if (currentPath.startsWith("/k12-demo")) {
      return "/k12-demo";
    } else if (currentPath.startsWith("/tutoring-demo")) {
      return "/tutoring-demo";
    }

    // Default to root for developer mode
    return "/";
  };

  const logout = async (): Promise<void> => {
    try {
      const result = await unifiedAuthIntegration.logout();

      setUser(null);

      if (result.success) {
        toast({
          title: "Logged Out",
          description: "You have been successfully logged out.",
        });
      }
    } catch (error) {
      console.error("Logout error:", error);
      // Still clear the user state even if the request fails
      setUser(null);
    }
  };

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    register,
    getLogoutRedirectPath,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
