// Shared component types
export interface LoadingStateProps {
  isLoading: boolean;
  message?: string;
  showSpinner?: boolean;
}

export interface ErrorStateProps {
  error: Error | string;
  onRetry?: () => void;
  showDetails?: boolean;
}

export interface EmptyStateProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: string;
}

export interface ThemeConfig {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
}

export interface BrandingConfig {
  logo: string;
  name: string;
  colors: ThemeConfig;
}
