import { useState } from "react";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Users, Edit, Shield, Eye } from "lucide-react";
import { apiClient } from "@/lib/apiClient";
import { useAuth } from "@/contexts/AuthContext";

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

const ROLE_DESCRIPTIONS = {
  developer: {
    label: "Developer",
    description:
      "Full system access including prompt editing and database management",
    permissions: [
      "Access all modules with switching",
      "View and edit prompts via Git",
      "Access admin dashboards",
      "View all reports",
      "Manage all users and organizations",
      "Edit system configuration",
      "View and edit database tables",
    ],
  },
  admin: {
    label: "Admin",
    description:
      "System administration and customer support across all modules",
    permissions: [
      "Access all modules with switching",
      "View admin dashboards and analytics",
      "View all customer reports",
      "Manage users and organizations",
      "Cannot edit prompts or system config",
    ],
  },
  org_admin: {
    label: "Organization Admin",
    description: "Manage users and reports within their organization",
    permissions: [
      "Access assigned module only",
      "View organization reports",
      "Manage users in organization",
      "Cannot access admin dashboards",
      "Cannot edit system configuration",
    ],
  },
  customer: {
    label: "Customer",
    description: "Create and manage own assessment reports",
    permissions: [
      "Access assigned module only",
      "Create and edit own reports",
      "View shared reports",
      "Cannot manage users",
      "Cannot access admin features",
    ],
  },
  demo: {
    label: "Demo User",
    description: "Limited sandbox access for evaluation",
    permissions: [
      "Access assigned module only",
      "Create up to 5 reports",
      "View own reports only",
      "30-day data retention",
      "Cannot manage users",
    ],
  },
};

const MODULE_OPTIONS = [
  { value: "k12", label: "K-12" },
  { value: "post_secondary", label: "Post-Secondary" },
  { value: "tutoring", label: "Tutoring" },
];

export default function UserManagementPage() {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [permissionsDialogOpen, setPermissionsDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  const { data: usersData, isLoading } = useQuery<UsersData>({
    queryKey: ["/api/admin/users"],
    queryFn: () => apiClient.request("/admin/users"),
    refetchInterval: 10000,
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
    onError: (error: any) => {
      toast({
        variant: "destructive",
        description: error.message || "Failed to update user",
      });
    },
  });

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setEditDialogOpen(true);
  };

  const handleViewPermissions = (role: string) => {
    setSelectedRole(role);
    setPermissionsDialogOpen(true);
  };

  const handleUpdateUser = (updates: any) => {
    if (selectedUser) {
      updateUserMutation.mutate({ userId: selectedUser.id, updates });
    }
  };

  const isOrgAdmin = currentUser?.role === "org_admin";

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
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
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">
            {isOrgAdmin
              ? "Manage users in your organization"
              : "Manage user accounts, roles, and permissions"}
          </p>
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
              Inactive Users
            </CardTitle>
            <Users className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {(usersData?.totalUsers || 0) - (usersData?.activeUsers || 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>
            View and manage user accounts, roles, and module assignments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">User</th>
                  <th className="text-left py-2">Role</th>
                  <th className="text-left py-2">Modules</th>
                  <th className="text-left py-2">Status</th>
                  <th className="text-left py-2">Reports</th>
                  <th className="text-left py-2">Last Login</th>
                  <th className="text-left py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {usersData?.users.map((user) => (
                  <tr key={user.id} className="border-b">
                    <td className="py-3">
                      <div className="font-medium">{user.username}</div>
                      <div className="text-sm text-muted-foreground">
                        {user.email}
                      </div>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary">{user.role}</Badge>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleViewPermissions(user.role)}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                    <td className="py-3">
                      <div className="flex flex-wrap gap-1">
                        {user.assignedModules?.map((module) => (
                          <Badge
                            key={module}
                            variant="outline"
                            className="text-xs"
                          >
                            {module}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="py-3">
                      <Badge
                        variant={user.isActive ? "default" : "destructive"}
                      >
                        {user.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="py-3">
                      <div className="text-sm">
                        {user.reportCount}/
                        {user.maxReports === -1 ? "∞" : user.maxReports}
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
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit User: {selectedUser?.username}</DialogTitle>
            <DialogDescription>
              Update user role, module assignments, and account settings
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <EditUserForm
              user={selectedUser}
              onSubmit={handleUpdateUser}
              isLoading={updateUserMutation.isPending}
              isOrgAdmin={isOrgAdmin}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* View Permissions Dialog */}
      <Dialog
        open={permissionsDialogOpen}
        onOpenChange={setPermissionsDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              {selectedRole &&
                ROLE_DESCRIPTIONS[
                  selectedRole as keyof typeof ROLE_DESCRIPTIONS
                ]?.label}{" "}
              Permissions
            </DialogTitle>
            <DialogDescription>
              {selectedRole &&
                ROLE_DESCRIPTIONS[
                  selectedRole as keyof typeof ROLE_DESCRIPTIONS
                ]?.description}
            </DialogDescription>
          </DialogHeader>
          {selectedRole && (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Permissions:</h4>
                <ul className="space-y-2">
                  {ROLE_DESCRIPTIONS[
                    selectedRole as keyof typeof ROLE_DESCRIPTIONS
                  ]?.permissions.map((permission, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-green-600 mr-2">✓</span>
                      <span className="text-sm">{permission}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface EditUserFormProps {
  user: User;
  onSubmit: (updates: any) => void;
  isLoading: boolean;
  isOrgAdmin: boolean;
}

function EditUserForm({
  user,
  onSubmit,
  isLoading,
  isOrgAdmin,
}: EditUserFormProps) {
  const [formData, setFormData] = useState({
    role: user.role,
    assignedModules: user.assignedModules || [],
    isActive: user.isActive,
    maxReports: user.maxReports,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const toggleModule = (module: string) => {
    setFormData({
      ...formData,
      assignedModules: formData.assignedModules.includes(module)
        ? formData.assignedModules.filter((m) => m !== module)
        : [...formData.assignedModules, module],
    });
  };

  const canEditRole = !isOrgAdmin;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="role">User Role</Label>
        <Select
          value={formData.role}
          onValueChange={(value) => setFormData({ ...formData, role: value })}
          disabled={!canEditRole}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {!isOrgAdmin && (
              <>
                <SelectItem value="developer">Developer</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="org_admin">Organization Admin</SelectItem>
              </>
            )}
            <SelectItem value="customer">Customer</SelectItem>
            <SelectItem value="demo">Demo User</SelectItem>
          </SelectContent>
        </Select>
        {!canEditRole && (
          <p className="text-xs text-muted-foreground">
            Organization admins cannot change user roles
          </p>
        )}
      </div>

      {/* Role Description */}
      {formData.role &&
        ROLE_DESCRIPTIONS[formData.role as keyof typeof ROLE_DESCRIPTIONS] && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-4">
              <p className="text-sm text-blue-900">
                {
                  ROLE_DESCRIPTIONS[
                    formData.role as keyof typeof ROLE_DESCRIPTIONS
                  ].description
                }
              </p>
            </CardContent>
          </Card>
        )}

      <div className="space-y-3">
        <Label className="text-base font-medium">Assigned Modules</Label>
        <div className="space-y-2 pl-4">
          {MODULE_OPTIONS.map((module) => (
            <div key={module.value} className="flex items-center space-x-2">
              <input
                type="checkbox"
                id={module.value}
                checked={formData.assignedModules.includes(module.value)}
                onChange={() => toggleModule(module.value)}
                className="rounded"
              />
              <Label htmlFor={module.value}>{module.label}</Label>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          {formData.role === "developer" || formData.role === "admin"
            ? "Developers and Admins can switch between all modules"
            : "User will only have access to selected modules"}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="maxReports">Maximum Reports</Label>
        <Input
          id="maxReports"
          type="number"
          value={formData.maxReports}
          onChange={(e) =>
            setFormData({ ...formData, maxReports: parseInt(e.target.value) })
          }
        />
        <p className="text-xs text-muted-foreground">
          Set to -1 for unlimited reports. Demo users are limited to 5 reports.
        </p>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="isActive"
          checked={formData.isActive}
          onCheckedChange={(checked) =>
            setFormData({ ...formData, isActive: checked })
          }
        />
        <Label htmlFor="isActive">Account Active</Label>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
