import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient } from "@/lib/apiClient";
import {
  Users,
  Building2,
  FileText,
  Activity,
  Database,
  Zap,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import PromptManager from "@/components/PromptManager";

interface AdminStats {
  users: {
    total: number;
    active: number;
    byRole: Record<string, number>;
    byModule: Record<string, number>;
  };
  organizations: {
    total: number;
    active: number;
  };
  reports: {
    total: number;
    byModule: Record<string, number>;
    byStatus: Record<string, number>;
  };
  system: {
    apiHealth: "healthy" | "warning" | "critical";
    databaseHealth: "healthy" | "warning" | "critical";
    aiCosts24h: number;
  };
}

interface OrgAdminStats {
  organization: {
    id: string;
    name: string;
    userCount: number;
    maxUsers: number;
    assignedModules: string[];
  };
  users: {
    total: number;
    active: number;
    byRole: Record<string, number>;
  };
  reports: {
    total: number;
    byStatus: Record<string, number>;
    recentReports: Array<{
      id: string;
      displayName: string;
      createdBy: string;
      status: string;
      createdAt: string;
    }>;
  };
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Determine which dashboard to show based on role
  const isOrgAdmin = user?.role === "org_admin";
  const isAdminOrDeveloper =
    user?.role === "admin" ||
    user?.role === "developer" ||
    user?.role === "system_admin" ||
    user?.role === "SYSTEM_ADMIN";

  // Fetch admin stats for admin/developer
  const {
    data: adminStats,
    isLoading: adminLoading,
    refetch: refetchAdmin,
  } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
    queryFn: () => apiClient.request("/admin/stats"),
    enabled: isAdminOrDeveloper,
    refetchInterval: 30000,
  });

  // Fetch org admin stats for org admin
  const {
    data: orgAdminStats,
    isLoading: orgAdminLoading,
    refetch: refetchOrgAdmin,
  } = useQuery<OrgAdminStats>({
    queryKey: ["/api/admin/org-stats"],
    queryFn: () => apiClient.request("/admin/org-stats"),
    enabled: isOrgAdmin,
    refetchInterval: 30000,
  });

  const isLoading = isAdminOrDeveloper ? adminLoading : orgAdminLoading;

  const handleRefresh = () => {
    if (isAdminOrDeveloper) {
      refetchAdmin();
    } else {
      refetchOrgAdmin();
    }
    setLastUpdated(new Date());
  };

  useEffect(() => {
    const interval = setInterval(() => {
      handleRefresh();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  // Render Org Admin Dashboard
  if (isOrgAdmin && orgAdminStats) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Organization Dashboard</h1>
            <p className="text-muted-foreground">
              {orgAdminStats.organization.name}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </span>
            <Button onClick={handleRefresh} size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Org Admin Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {orgAdminStats.users.total}
              </div>
              <p className="text-xs text-muted-foreground">
                {orgAdminStats.users.active} active /{" "}
                {orgAdminStats.organization.maxUsers} max
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Reports
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {orgAdminStats.reports.total}
              </div>
              <p className="text-xs text-muted-foreground">Across all users</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {orgAdminStats.reports.byStatus.completed || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {(
                  ((orgAdminStats.reports.byStatus.completed || 0) /
                    orgAdminStats.reports.total) *
                  100
                ).toFixed(0)}
                % completion rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Modules</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1">
                {orgAdminStats.organization.assignedModules.map((module) => (
                  <Badge key={module} variant="secondary" className="text-xs">
                    {module}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Reports */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Reports</CardTitle>
            <CardDescription>
              Latest reports from your organization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {orgAdminStats.reports.recentReports.length > 0 ? (
                orgAdminStats.reports.recentReports.map((report) => (
                  <div
                    key={report.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <h3 className="font-medium">{report.displayName}</h3>
                      <p className="text-sm text-gray-500">
                        Created by {report.createdBy} •{" "}
                        {new Date(report.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge
                      variant={
                        report.status === "completed" ? "default" : "secondary"
                      }
                    >
                      {report.status}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-8">
                  No reports available
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button
            onClick={() =>
              navigate("/organizations/" + orgAdminStats.organization.id)
            }
            className="h-20"
            variant="outline"
          >
            <Users className="h-5 w-5 mr-2" />
            Manage Users
          </Button>
          <Button
            onClick={() => navigate("/reports")}
            className="h-20"
            variant="outline"
          >
            <FileText className="h-5 w-5 mr-2" />
            View All Reports
          </Button>
        </div>
      </div>
    );
  }

  // Render Admin/Developer Dashboard
  if (isAdminOrDeveloper && adminStats) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">
              System overview and analytics
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </span>
            <Button onClick={handleRefresh} size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* System Health Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">API Health</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    adminStats.system.apiHealth === "healthy"
                      ? "bg-green-500"
                      : adminStats.system.apiHealth === "warning"
                      ? "bg-yellow-500"
                      : "bg-red-500"
                  }`}
                />
                <span className="text-2xl font-bold capitalize">
                  {adminStats.system.apiHealth}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Database</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    adminStats.system.databaseHealth === "healthy"
                      ? "bg-green-500"
                      : adminStats.system.databaseHealth === "warning"
                      ? "bg-yellow-500"
                      : "bg-red-500"
                  }`}
                />
                <span className="text-2xl font-bold capitalize">
                  {adminStats.system.databaseHealth}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                AI Costs (24h)
              </CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${adminStats.system.aiCosts24h.toFixed(2)}
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="organizations">Organizations</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="prompts">Prompts</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Users
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {adminStats.users.total}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {adminStats.users.active} active
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Organizations
                  </CardTitle>
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {adminStats.organizations.total}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {adminStats.organizations.active} active
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Reports
                  </CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {adminStats.reports.total}
                  </div>
                  <p className="text-xs text-muted-foreground">All modules</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Completed
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {adminStats.reports.byStatus.completed || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {(
                      ((adminStats.reports.byStatus.completed || 0) /
                        adminStats.reports.total) *
                      100
                    ).toFixed(0)}
                    % rate
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Button
                onClick={() => navigate("/admin/users")}
                className="h-20"
                variant="outline"
              >
                <Users className="h-5 w-5 mr-2" />
                Manage Users
              </Button>
              <Button
                onClick={() => navigate("/admin/all-users")}
                className="h-20"
                variant="outline"
              >
                <Users className="h-5 w-5 mr-2" />
                View All Users
              </Button>
              <Button
                onClick={() => navigate("/admin/organizations")}
                className="h-20"
                variant="outline"
              >
                <Building2 className="h-5 w-5 mr-2" />
                Manage Organizations
              </Button>
              <Button
                onClick={() => navigate("/admin/performance")}
                className="h-20"
                variant="outline"
              >
                <Activity className="h-5 w-5 mr-2" />
                Performance Dashboard
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Users by Role</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(adminStats.users.byRole).map(
                    ([role, count]) => (
                      <div
                        key={role}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <Badge variant="secondary">{role}</Badge>
                          <span className="font-medium capitalize">
                            {role.replace("_", " ")}
                          </span>
                        </div>
                        <span className="text-2xl font-bold">{count}</span>
                      </div>
                    )
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Users by Module</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(adminStats.users.byModule).map(
                    ([module, count]) => (
                      <div
                        key={module}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <span className="font-medium capitalize">
                          {module.replace("_", " ")}
                        </span>
                        <span className="text-2xl font-bold">{count}</span>
                      </div>
                    )
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="organizations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Organization Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      Total Organizations
                    </p>
                    <p className="text-3xl font-bold">
                      {adminStats.organizations.total}
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      Active Organizations
                    </p>
                    <p className="text-3xl font-bold text-green-600">
                      {adminStats.organizations.active}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button
              onClick={() => navigate("/admin/organizations")}
              className="w-full"
            >
              <Building2 className="h-4 w-4 mr-2" />
              View All Organizations
            </Button>
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Reports by Module</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(adminStats.reports.byModule).map(
                    ([module, count]) => (
                      <div
                        key={module}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <span className="font-medium capitalize">
                          {module.replace("_", " ")}
                        </span>
                        <span className="text-2xl font-bold">{count}</span>
                      </div>
                    )
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Reports by Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(adminStats.reports.byStatus).map(
                    ([status, count]) => (
                      <div
                        key={status}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <Badge
                            variant={
                              status === "completed" ? "default" : "secondary"
                            }
                          >
                            {status}
                          </Badge>
                          <span className="font-medium capitalize">
                            {status}
                          </span>
                        </div>
                        <span className="text-2xl font-bold">{count}</span>
                      </div>
                    )
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="prompts" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Prompt Manager</CardTitle>
                <CardDescription>
                  Manage AI prompts for all modules (K-12, Tutoring,
                  Post-Secondary)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PromptManager />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  // Fallback for unauthorized access
  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2" />
            Access Restricted
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>You do not have permission to access the admin dashboard.</p>
        </CardContent>
      </Card>
    </div>
  );
}
