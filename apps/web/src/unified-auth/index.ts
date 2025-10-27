// Unified Authentication System - Main Export
// This file provides a single entry point for all unified auth functionality

// Types
export * from "@/types/unified-auth";

// Components
export * from "@/components/auth";
export * from "@/components/dashboard";
export * from "@/components/shared";

// Contexts
export {
  NavigationProvider,
  useNavigation,
} from "@/contexts/NavigationContext";

// Hooks
export { useUnifiedAuth } from "@/hooks/useUnifiedAuth";
export { useUnifiedRouting } from "@/hooks/useUnifiedRouting";

// Configuration
export * from "@/config/routes";
export * from "@/config/modules";

// Utilities
export * from "@/utils/routing";

// Constants
export { THRIVE_COLORS } from "@/config/modules";
