import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Users,
  UserCheck,
  UserX,
  AlertTriangle,
  Settings,
  Bug,
  Building2,
} from "lucide-react";
import { apiClient } from "@/lib/apiClient";
import { AdminDebugPanel } from "@/components/AdminDebugPanel";
import OrganizationManagementPage from "./OrganizationManagementPage";

interface AdminUser {
  id: number;
  username: string;
  email: string;
  customerId: string;
  customerName?: string;
  role: string;
  assignedModules?: string[];
  organizationId?: string;
  isActive: boolean;
  reportCount: number;
  maxReports: number;
  reportsRemaining: number;
  isLimitReached: boolean;
  demoPermissions: any;
  createdAt: string;
  lastLogin?: string;
}

interface AdminStats {
  users: AdminUser[];
  totalUsers: number;
  activeUsers: number;
  usersAtLimit: number;
}

export default function AdminPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<string>("");
  const [currentUserOrgId, setCurrentUserOrgId] = useState<string | null>(null);

  // Fetch current user info to determine role-based access
  const { data: currentUser } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: () => apiClient.request("/auth/me"),
  });

  useEffect(() => {
    if (currentUser?.user) {
      setCurrentUserRole(currentUser.user.role || "");
      setCurrentUserOrgId(currentUser.user.organizationId || null);
    }
  }, [currentUser]);

  const { data: adminData, isLoading } = useQuery<AdminStats>({
    queryKey: ["/api/admin/users"],
    queryFn: () => apiClient.request("/admin/users"),
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({
      userId,
      updates,
    }: {
      userId: number;
      updates: any;
    }) => {
      return apiClient.request(`/admin/users/${userId}`, {
        method: "PATCH",
        body: JSON.stringify(updates),
      });
    },
    onSuccess: () => {
      toast({ description: "User updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setEditDialogOpen(false);
      setSelectedUser(null);
    },
    onError: () => {
      toast({ variant: "destructive", description: "Failed to update user" });
    },
  });

  const handleEditUser = (user: AdminUser) => {
    setSelectedUser(user);
    setEditDialogOpen(true);
  };

  const handleUpdateUser = (updates: any) => {
    if (selectedUser) {
      updateUserMutation.mutate({ userId: selectedUser.id, updates });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage users and monitor system usage
          </p>
        </div>
        <Badge variant="secondary" className="px-3 py-1">
          eric@thriveiep.com
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {adminData?.totalUsers || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {adminData?.activeUsers || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Inactive Users
            </CardTitle>
            <UserX className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {(adminData?.totalUsers || 0) - (adminData?.activeUsers || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              At Report Limit
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {adminData?.usersAtLimit || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Users, Organizations, and Debug */}
      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full max-w-2xl grid-cols-3">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Users
          </TabsTrigger>
          {(currentUserRole === "developer" || currentUserRole === "admin") && (
            <TabsTrigger
              value="organizations"
              className="flex items-center gap-2"
            >
              <Building2 className="h-4 w-4" />
              Organizations
            </TabsTrigger>
          )}
          <TabsTrigger value="debug" className="flex items-center gap-2">
            <Bug className="h-4 w-4" />
            Debug
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-6">
          {/* Users Table */}
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                View and manage all registered users, their report usage, and
                permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Username</th>
                      <th className="text-left py-2">Email</th>
                      <th className="text-left py-2">Role</th>
                      <th className="text-left py-2">Status</th>
                      <th className="text-left py-2">Demo Access</th>
                      <th className="text-left py-2">Reports</th>
                      <th className="text-left py-2">Last Login</th>
                      <th className="text-left py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminData?.users.map((user) => (
                      <tr key={user.id} className="border-b">
                        <td className="py-3">
                          <div className="font-medium">{user.username}</div>
                          <div className="text-sm text-muted-foreground">
                            ID: {user.id}
                          </div>
                        </td>
                        <td className="py-3">{user.email}</td>
                        <td className="py-3">
                          <Badge
                            variant={
                              user.role === "system_admin"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {user.role}
                          </Badge>
                        </td>
                        <td className="py-3">
                          <Badge
                            variant={user.isActive ? "default" : "destructive"}
                          >
                            {user.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </td>
                        <td className="py-3">
                          <div className="flex flex-wrap gap-1">
                            {user.demoPermissions?.["post-secondary-demo"] && (
                              <Badge variant="outline" className="text-xs">
                                Post-Sec
                              </Badge>
                            )}
                            {user.demoPermissions?.["k12-demo"] && (
                              <Badge variant="outline" className="text-xs">
                                K-12
                              </Badge>
                            )}
                            {user.demoPermissions?.["tutoring-demo"] && (
                              <Badge variant="outline" className="text-xs">
                                Tutoring
                              </Badge>
                            )}
                            {/* Show "None" if no demo permissions are enabled */}
                            {(!user.demoPermissions ||
                              Object.values(user.demoPermissions || {}).every(
                                (val) => !val
                              )) && (
                              <span className="text-xs text-muted-foreground">
                                None
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3">
                          <div className="space-y-1">
                            <div className="text-sm">
                              {user.reportCount}/{user.maxReports}
                            </div>
                            <div className="w-20 bg-gray-200 rounded-full h-1.5">
                              <div
                                className={`h-1.5 rounded-full ${
                                  user.isLimitReached
                                    ? "bg-red-500"
                                    : "bg-blue-500"
                                }`}
                                style={{
                                  width: `${
                                    (user.reportCount / user.maxReports) * 100
                                  }%`,
                                }}
                              ></div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3">
                          {user.lastLogin
                            ? new Date(user.lastLogin).toLocaleDateString()
                            : "Never"}
                        </td>
                        <td className="py-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditUser(user)}
                            data-testid={`edit-user-${user.id}`}
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="debug" className="mt-6">
          <AdminDebugPanel />
        </TabsContent>
      </Tabs>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent data-testid="edit-user-dialog">
          <DialogHeader>
            <DialogTitle>Edit User: {selectedUser?.username}</DialogTitle>
            <DialogDescription>
              Modify user settings, report limits, and permissions
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <UserEditForm
              user={selectedUser}
              onSubmit={handleUpdateUser}
              isLoading={updateUserMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface UserEditFormProps {
  user: AdminUser;
  onSubmit: (updates: any) => void;
  isLoading: boolean;
}

function UserEditForm({ user, onSubmit, isLoading }: UserEditFormProps) {
  const [formData, setFormData] = useState({
    maxReports: user.maxReports,
    reportCount: user.reportCount,
    isActive: user.isActive,
    role: user.role,
    demoPermissions: user.demoPermissions || {},
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="maxReports">Maximum Reports</Label>
        <Input
          id="maxReports"
          type="number"
          min="0"
          max="100"
          value={formData.maxReports}
          onChange={(e) =>
            setFormData({ ...formData, maxReports: parseInt(e.target.value) })
          }
          data-testid="input-max-reports"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="reportCount">Current Report Count</Label>
        <Input
          id="reportCount"
          type="number"
          min="0"
          value={formData.reportCount}
          onChange={(e) =>
            setFormData({ ...formData, reportCount: parseInt(e.target.value) })
          }
          data-testid="input-report-count"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="role">Role</Label>
        <Select
          value={formData.role}
          onValueChange={(value) => setFormData({ ...formData, role: value })}
        >
          <SelectTrigger data-testid="select-role">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tutor">Tutor</SelectItem>
            <SelectItem value="customer_admin">Customer Admin</SelectItem>
            <SelectItem value="system_admin">System Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="isActive"
          checked={formData.isActive}
          onCheckedChange={(checked) =>
            setFormData({ ...formData, isActive: checked })
          }
          data-testid="switch-active"
        />
        <Label htmlFor="isActive">User Active</Label>
      </div>

      <div className="space-y-3">
        <Label className="text-base font-medium">Demo Permissions</Label>
        <div className="space-y-3 pl-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="post-secondary-demo"
              checked={formData.demoPermissions["post-secondary-demo"] || false}
              onCheckedChange={(checked) =>
                setFormData({
                  ...formData,
                  demoPermissions: {
                    ...formData.demoPermissions,
                    "post-secondary-demo": checked,
                  },
                })
              }
              data-testid="switch-post-secondary-demo"
            />
            <Label htmlFor="post-secondary-demo">Post-Secondary Demo</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="k12-demo"
              checked={formData.demoPermissions["k12-demo"] || false}
              onCheckedChange={(checked) =>
                setFormData({
                  ...formData,
                  demoPermissions: {
                    ...formData.demoPermissions,
                    "k12-demo": checked,
                  },
                })
              }
              data-testid="switch-k12-demo"
            />
            <Label htmlFor="k12-demo">K-12 Demo</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="tutoring-demo"
              checked={formData.demoPermissions["tutoring-demo"] || false}
              onCheckedChange={(checked) =>
                setFormData({
                  ...formData,
                  demoPermissions: {
                    ...formData.demoPermissions,
                    "tutoring-demo": checked,
                  },
                })
              }
              data-testid="switch-tutoring-demo"
            />
            <Label htmlFor="tutoring-demo">Tutoring Demo</Label>
          </div>
        </div>
      </div>

      <Button type="submit" disabled={isLoading} data-testid="button-save-user">
        {isLoading ? "Saving..." : "Save Changes"}
      </Button>
    </form>
  );
}
