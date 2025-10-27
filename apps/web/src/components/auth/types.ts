import {
  AuthenticatedUser,
  LoginCredentials,
  AuthenticationFlowProps,
} from "@/types/unified-auth";

// Authentication component specific types
export interface UnifiedLoginPageProps extends AuthenticationFlowProps {
  variant?: "unified";
  showBranding?: boolean;
}

export interface AuthenticationGuardProps {
  children: React.ReactNode;
  fallback?: React.ComponentType;
  requiredRoles?: string[];
  requiredModules?: string[];
}

export interface LoginFormData extends LoginCredentials {
  rememberMe?: boolean;
}

export interface AuthenticationError {
  code: string;
  message: string;
  details?: any;
}

// Re-export commonly used types
export type { AuthenticatedUser, LoginCredentials, AuthenticationFlowProps };
