import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ModuleType, UserRole } from "@/types/rbac";

export interface ModuleAssignmentData {
  userId: number;
  role: UserRole;
  assignedModules: ModuleType[];
  canSwitchModules: boolean;
  defaultModule: ModuleType;
  organizationId?: string;
  totalModulesAvailable: number;
}

export interface ModuleDetails {
  type: ModuleType;
  name: string;
  description: string;
  icon: string;
}

export interface AvailableModulesData {
  assignedModules: ModuleType[];
  moduleDetails: ModuleDetails[];
  canSwitchModules: boolean;
  defaultModule: ModuleType;
  userRole: UserRole;
  totalAvailable: number;
}

export interface ModuleSwitchResult {
  success: boolean;
  newModule: ModuleType;
  previousModule?: ModuleType;
  message: string;
  canSwitch: boolean;
  assignedModules: ModuleType[];
  userRole: UserRole;
}

/**
 * Hook for managing module assignments and switching
 */
export function useModuleAssignment() {
  const { user } = useAuth();
  const [assignmentData, setAssignmentData] =
    useState<ModuleAssignmentData | null>(null);
  const [availableModules, setAvailableModules] =
    useState<AvailableModulesData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch user's module assignments
   */
  const fetchAssignments = async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/modules/assignments", {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch assignments: ${response.statusText}`);
      }

      const result = await response.json();
      if (result.success) {
        setAssignmentData(result.data);
      } else {
        throw new Error(result.error || "Failed to fetch assignments");
      }
    } catch (err: any) {
      console.error("Error fetching module assignments:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Fetch available modules for the user
   */
  const fetchAvailableModules = async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/modules/available", {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(
          `Failed to fetch available modules: ${response.statusText}`
        );
      }

      const result = await response.json();
      if (result.success) {
        setAvailableModules(result.data);
      } else {
        throw new Error(result.error || "Failed to fetch available modules");
      }
    } catch (err: any) {
      console.error("Error fetching available modules:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Check if user has access to a specific module
   */
  const checkModuleAccess = async (
    moduleType: ModuleType
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      const response = await fetch(`/api/modules/${moduleType}/access`, {
        credentials: "include",
      });

      if (!response.ok) {
        return false;
      }

      const result = await response.json();
      return result.success && result.data.hasAccess;
    } catch (err: any) {
      console.error("Error checking module access:", err);
      return false;
    }
  };

  /**
   * Switch to a different module
   */
  const switchModule = async (
    targetModule: ModuleType,
    currentModule?: ModuleType
  ): Promise<ModuleSwitchResult | null> => {
    if (!user) return null;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/modules/switch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          targetModule,
          currentModule,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || `Failed to switch modules: ${response.statusText}`
        );
      }

      if (result.success) {
        // Refresh assignments after successful switch
        await fetchAssignments();
        await fetchAvailableModules();
        return result.data;
      } else {
        throw new Error(result.error || "Failed to switch modules");
      }
    } catch (err: any) {
      console.error("Error switching modules:", err);
      setError(err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Check if user can switch modules
   */
  const canSwitchModules = (): boolean => {
    if (!user) return false;
    return user.role === UserRole.DEVELOPER || user.role === UserRole.ADMIN;
  };

  /**
   * Get assigned modules from current data
   */
  const getAssignedModules = (): ModuleType[] => {
    return (
      assignmentData?.assignedModules || availableModules?.assignedModules || []
    );
  };

  /**
   * Get default module for user
   */
  const getDefaultModule = (): ModuleType => {
    return (
      assignmentData?.defaultModule ||
      availableModules?.defaultModule ||
      ModuleType.POST_SECONDARY
    );
  };

  /**
   * Check if a specific module is assigned to the user
   */
  const hasModuleAccess = (moduleType: ModuleType): boolean => {
    const assigned = getAssignedModules();
    return assigned.includes(moduleType);
  };

  // Load data when user changes
  useEffect(() => {
    if (user) {
      fetchAssignments();
      fetchAvailableModules();
    } else {
      setAssignmentData(null);
      setAvailableModules(null);
      setError(null);
    }
  }, [user]);

  return {
    // Data
    assignmentData,
    availableModules,
    isLoading,
    error,

    // Actions
    fetchAssignments,
    fetchAvailableModules,
    checkModuleAccess,
    switchModule,

    // Computed values
    canSwitchModules: canSwitchModules(),
    assignedModules: getAssignedModules(),
    defaultModule: getDefaultModule(),
    hasModuleAccess,

    // Utilities
    refresh: () => {
      fetchAssignments();
      fetchAvailableModules();
    },
    clearError: () => setError(null),
  };
}
