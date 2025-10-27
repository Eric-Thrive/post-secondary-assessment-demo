import React, { useState, useEffect } from "react";
import { useModule } from "@/contexts/ModuleContext";
import { useAuth } from "@/contexts/AuthContext";
import { useModuleAssignment } from "@/hooks/useModuleAssignment";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  GraduationCap,
  BookOpen,
  Users,
  Lock,
  AlertCircle,
} from "lucide-react";
import { ModuleType, UserRole } from "@/types/rbac";
import { useToast } from "@/hooks/use-toast";

interface ModuleSwitcherProps {
  variant?: "compact" | "full";
  className?: string;
}

export const ModuleSwitcher: React.FC<ModuleSwitcherProps> = ({
  variant = "compact",
  className = "",
}) => {
  const { activeModule, setActiveModule } = useModule();
  const { user } = useAuth();
  const { toast } = useToast();
  const {
    availableModules,
    canSwitchModules,
    assignedModules,
    switchModule,
    isLoading,
    error,
    hasModuleAccess,
  } = useModuleAssignment();

  const [isSwitching, setIsSwitching] = useState(false);

  // Get module display information
  const getModuleInfo = (moduleType: ModuleType) => {
    const moduleMap = {
      [ModuleType.POST_SECONDARY]: {
        name: "Post-Secondary",
        icon: GraduationCap,
        color: "bg-blue-600",
        description: "Higher education assessments",
      },
      [ModuleType.K12]: {
        name: "K-12",
        icon: BookOpen,
        color: "bg-green-600",
        description: "K-12 education assessments",
      },
      [ModuleType.TUTORING]: {
        name: "Tutoring",
        icon: Users,
        color: "bg-purple-600",
        description: "Tutoring service assessments",
      },
    };
    return moduleMap[moduleType];
  };

  // Handle module switching
  const handleModuleSwitch = async (targetModule: ModuleType) => {
    if (!canSwitchModules) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to switch modules",
        variant: "destructive",
      });
      return;
    }

    if (!hasModuleAccess(targetModule)) {
      toast({
        title: "Module Access Denied",
        description: `You don't have access to the ${
          getModuleInfo(targetModule).name
        } module`,
        variant: "destructive",
      });
      return;
    }

    if (targetModule === activeModule) {
      return; // Already on this module
    }

    setIsSwitching(true);
    try {
      const result = await switchModule(
        targetModule,
        activeModule as ModuleType
      );
      if (result?.success) {
        setActiveModule(targetModule);
        toast({
          title: "Module Switched",
          description: `Successfully switched to ${
            getModuleInfo(targetModule).name
          }`,
        });
      }
    } catch (err: any) {
      toast({
        title: "Switch Failed",
        description: err.message || "Failed to switch modules",
        variant: "destructive",
      });
    } finally {
      setIsSwitching(false);
    }
  };

  // Compact variant - just shows current module
  if (variant === "compact") {
    const currentModuleInfo = getModuleInfo(activeModule as ModuleType);
    const isDemoUser = user?.role === UserRole.DEMO;

    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <Badge
          variant="default"
          className="text-xs flex items-center space-x-1"
        >
          <currentModuleInfo.icon className="h-3 w-3" />
          <span>{currentModuleInfo.name}</span>
        </Badge>
        {isDemoUser && (
          <Badge variant="secondary" className="text-xs">
            Demo
          </Badge>
        )}
        {!canSwitchModules && assignedModules.length === 1 && (
          <Lock className="h-3 w-3 text-gray-400" />
        )}
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <Alert className={`${className}`}>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load module information: {error}
        </AlertDescription>
      </Alert>
    );
  }

  // Show loading state
  if (isLoading || !availableModules) {
    return (
      <div className={`flex items-center space-x-3 ${className}`}>
        <span className="text-sm font-medium text-gray-700">Module:</span>
        <div className="bg-gray-100 rounded-lg p-1 animate-pulse">
          <div className="h-8 w-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  // Full variant - shows module switcher
  // Hide switcher if user can't switch and only has one module
  if (!canSwitchModules && assignedModules.length <= 1) {
    const currentModuleInfo = getModuleInfo(activeModule as ModuleType);
    return (
      <div className={`flex items-center space-x-3 ${className}`}>
        <span className="text-sm font-medium text-gray-700">Module:</span>
        <div className="flex items-center space-x-2 bg-gray-100 rounded-lg px-3 py-2">
          <currentModuleInfo.icon className="h-4 w-4" />
          <span className="text-sm font-medium">{currentModuleInfo.name}</span>
          <Lock className="h-3 w-3 text-gray-400" />
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <span className="text-sm font-medium text-gray-700">Module:</span>

      {canSwitchModules ? (
        // Privileged users get full toggle group
        <ToggleGroup
          type="single"
          value={activeModule}
          onValueChange={(value) =>
            value && handleModuleSwitch(value as ModuleType)
          }
          className="bg-gray-100 rounded-lg p-1"
          disabled={isSwitching}
        >
          {assignedModules.map((moduleType) => {
            const moduleInfo = getModuleInfo(moduleType);
            const IconComponent = moduleInfo.icon;
            return (
              <ToggleGroupItem
                key={moduleType}
                value={moduleType}
                className={`data-[state=on]:${moduleInfo.color} data-[state=on]:text-white flex items-center space-x-2 px-3 py-2 transition-colors`}
                disabled={isSwitching}
              >
                <IconComponent className="h-4 w-4" />
                <span>{moduleInfo.name}</span>
              </ToggleGroupItem>
            );
          })}
        </ToggleGroup>
      ) : (
        // Non-privileged users with multiple modules get buttons (shouldn't happen in current design)
        <div className="flex items-center space-x-2">
          {assignedModules.map((moduleType) => {
            const moduleInfo = getModuleInfo(moduleType);
            const IconComponent = moduleInfo.icon;
            const isActive = moduleType === activeModule;

            return (
              <Button
                key={moduleType}
                variant={isActive ? "default" : "outline"}
                size="sm"
                className="flex items-center space-x-2"
                disabled={true} // Non-privileged users can't switch
              >
                <IconComponent className="h-4 w-4" />
                <span>{moduleInfo.name}</span>
              </Button>
            );
          })}
        </div>
      )}

      {/* Show role-based access indicator */}
      {!canSwitchModules && (
        <div className="text-xs text-gray-500 flex items-center space-x-1">
          <Lock className="h-3 w-3" />
          <span>Role: {user?.role}</span>
        </div>
      )}
    </div>
  );
};
