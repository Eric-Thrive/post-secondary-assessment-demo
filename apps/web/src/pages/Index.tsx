import { useEffect, useMemo } from "react";
import { Loader2, ShieldAlert } from "lucide-react";
import WelcomeDashboard from "@/pages/WelcomeDashboard";
import { ModuleDashboard } from "@/components/dashboard/ModuleDashboard";
import { useUnifiedAuth } from "@/hooks/useUnifiedAuth";
import { useUnifiedRouting } from "@/hooks/useUnifiedRouting";
import { useModule } from "@/contexts/ModuleContext";
import { ModuleType, UserRole } from "@/types/unified-auth";

const Index = () => {
  const { user, isLoading } = useUnifiedAuth();
  const { navigateToModule } = useUnifiedRouting();
  const { setActiveModule } = useModule();
  const moduleAccess = user?.moduleAccess ?? [];

  const adminFeatures = useMemo(() => {
    if (!user) return [];

    if (
      ![UserRole.DEVELOPER, UserRole.SYSTEM_ADMIN, UserRole.ORG_ADMIN].includes(
        user.role
      )
    ) {
      return [];
    }

    return [
      {
        id: "user-management",
        title: "User Management",
        description: "Manage user accounts and roles",
        icon: "Users",
        route: "/admin/users",
        requiredRole: [UserRole.SYSTEM_ADMIN, UserRole.DEVELOPER, UserRole.ORG_ADMIN],
      },
      {
        id: "organization-management",
        title: "Organizations",
        description: "Configure organization settings and modules",
        icon: "Shield",
        route: "/admin/organizations",
        requiredRole: [UserRole.SYSTEM_ADMIN, UserRole.DEVELOPER],
      },
      {
        id: "prompt-management",
        title: "Prompt Manager",
        description: "Review and edit AI prompt content",
        icon: "FileText",
        route: "/prompts",
        requiredRole: [UserRole.DEVELOPER, UserRole.SYSTEM_ADMIN],
      },
    ];
  }, [user]);

  useEffect(() => {
    if (!user) {
      setActiveModule("post_secondary");
      return;
    }

    if (moduleAccess.length === 0) {
      setActiveModule("post_secondary");
      return;
    }

    if (moduleAccess.length === 1) {
      const targetModule = moduleAccess[0].moduleType as ModuleType;
      setActiveModule(targetModule);
      navigateToModule(targetModule);
    }
  }, [user, moduleAccess, navigateToModule, setActiveModule]);

  // Show loading spinner while checking auth status
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <WelcomeDashboard />;
  }

  if (moduleAccess.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center space-y-3 max-w-md">
          <div className="mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center">
            <ShieldAlert className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-lg font-semibold">No modules assigned</p>
          <p className="text-sm text-muted-foreground">
            Your account does not have any modules enabled yet. Please contact
            your administrator for access.
          </p>
        </div>
      </div>
    );
  }

  if (moduleAccess.length === 1) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">
            Preparing your workspace…
          </p>
        </div>
      </div>
    );
  }

  return (
    <ModuleDashboard
      user={user}
      availableModules={moduleAccess}
      recentActivity={[]}
      adminFeatures={adminFeatures}
    />
  );
};

export default Index;
