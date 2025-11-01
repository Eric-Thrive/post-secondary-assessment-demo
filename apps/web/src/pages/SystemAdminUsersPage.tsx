import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Search, Download, RefreshCw } from "lucide-react";
import { apiClient } from "@/lib/apiClient";

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  assignedModules: string[];
  organizationId?: string;
  isActive: boolean;
  reportCount: number;
  maxReports: number;
  createdAt: string;
  lastLogin?: string;
}

interface UsersData {
  users: User[];
  totalUsers: number;
  activeUsers: number;
}

const ROLE_LABELS: Record<string, string> = {
  developer: "Developer",
  admin: "Admin",
  system_admin: "System Admin",
  org_admin: "Org Admin",
  customer: "Customer",
  demo: "Demo",
};

const MODULE_LABELS: Record<string, string> = {
  k12: "K-12",
  post_secondary: "Post-Secondary",
  tutoring: "Tutoring",
};

export default function SystemAdminUsersPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const {
    data: usersData,
    isLoading,
    refetch,
  } = useQuery<UsersData>({
    queryKey: ["/api/admin/users"],
    queryFn: () => apiClient.request("/admin/users"),
    refetchInterval: 30000,
  });

  const filteredUsers = usersData?.users.filter((user) => {
    const query = searchQuery.toLowerCase();
    return (
      user.username.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      user.role.toLowerCase().includes(query) ||
      user.assignedModules?.some((m) => m.toLowerCase().includes(query))
    );
  });

  const exportToCSV = () => {
    if (!filteredUsers) return;

    const headers = [
      "ID",
      "Username",
      "Email",
      "Role",
      "Modules",
      "Status",
      "Organization ID",
    ];
    const rows = filteredUsers.map((user) => [
      user.id,
      user.username,
      user.email,
      user.role,
      user.assignedModules?.join("; ") || "None",
      user.isActive ? "Active" : "Inactive",
      user.organizationId || "N/A",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `users-export-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading users...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">All Users</h1>
          <p className="text-muted-foreground">
            View all users with their roles, modules, and contact information
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={() => refetch()} size="sm" variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={exportToCSV} size="sm" variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {usersData?.totalUsers || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {usersData?.activeUsers || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Filtered Results
            </CardTitle>
            <Search className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredUsers?.length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search Bar */}
      <Card>
        <CardHeader>
          <CardTitle>Search Users</CardTitle>
          <CardDescription>
            Filter by username, email, role, or module
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users Directory</CardTitle>
          <CardDescription>
            Complete list of all users in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2">ID</th>
                  <th className="text-left py-3 px-2">Username</th>
                  <th className="text-left py-3 px-2">Email</th>
                  <th className="text-left py-3 px-2">Role</th>
                  <th className="text-left py-3 px-2">Modules</th>
                  <th className="text-left py-3 px-2">Status</th>
                  <th className="text-left py-3 px-2">Org ID</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers && filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-2 text-sm text-muted-foreground">
                        {user.id}
                      </td>
                      <td className="py-3 px-2">
                        <div className="font-medium">{user.username}</div>
                      </td>
                      <td className="py-3 px-2">
                        <div className="text-sm">{user.email}</div>
                      </td>
                      <td className="py-3 px-2">
                        <Badge variant="secondary">
                          {ROLE_LABELS[user.role] || user.role}
                        </Badge>
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex flex-wrap gap-1">
                          {user.assignedModules &&
                          user.assignedModules.length > 0 ? (
                            user.assignedModules.map((module) => (
                              <Badge
                                key={module}
                                variant="outline"
                                className="text-xs"
                              >
                                {MODULE_LABELS[module] || module}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              None
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <Badge
                          variant={user.isActive ? "default" : "destructive"}
                        >
                          {user.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="py-3 px-2">
                        <div className="text-sm text-muted-foreground">
                          {user.organizationId || "—"}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-8 text-center text-muted-foreground"
                    >
                      {searchQuery
                        ? "No users found matching your search"
                        : "No users available"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
