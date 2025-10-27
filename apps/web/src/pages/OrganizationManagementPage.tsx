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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Building2, Users, Plus, Settings, Trash2 } from "lucide-react";
import { apiClient } from "@/lib/apiClient";

interface Organization {
  id: string;
  name: string;
  customerId: string;
  assignedModules: string[];
  maxUsers: number;
  isActive: boolean;
  userCount: number;
  createdAt: string;
  lastUpdated: string;
}

interface OrganizationStats {
  organizations: Organization[];
  totalOrganizations: number;
  activeOrganizations: number;
}

interface OrganizationUser {
  id: number;
  username: string;
  email: string;
  role: string;
  assignedModules: string[];
  isActive: boolean;
  reportCount: number;
  maxReports: number;
  createdAt: string;
  lastLogin?: string;
}

interface OrganizationDetail {
  organization: Organization;
  users: OrganizationUser[];
  userCount: number;
}

export default function OrganizationManagementPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  const { data: orgData, isLoading } = useQuery<OrganizationStats>({
    queryKey: ["/api/organizations"],
    queryFn: () => apiClient.request("/organizations"),
    refetchInterval: 10000,
  });

  const { data: orgDetail } = useQuery<OrganizationDetail>({
    queryKey: ["/api/organizations", selectedOrg?.id],
    queryFn: () => apiClient.request(`/organizations/${selectedOrg?.id}`),
    enabled: !!selectedOrg && viewDialogOpen,
  });

  const createOrgMutation = useMutation({
    mutationFn: async (orgData: any) => {
      return apiClient.request("/organizations", {
        method: "POST",
        body: JSON.stringify(orgData),
      });
    },
    onSuccess: () => {
      toast({ description: "Organization created successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/organizations"] });
      setCreateDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        description: error.message || "Failed to create organization",
      });
    },
  });

  const updateOrgMutation = useMutation({
    mutationFn: async ({ orgId, updates }: { orgId: string; updates: any }) => {
      return apiClient.request(`/organizations/${orgId}`, {
        method: "PATCH",
        body: JSON.stringify(updates),
      });
    },
    onSuccess: () => {
      toast({ description: "Organization updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/organizations"] });
      setEditDialogOpen(false);
      setSelectedOrg(null);
    },
    onError: () => {
      toast({
        variant: "destructive",
        description: "Failed to update organization",
      });
    },
  });

  const deleteOrgMutation = useMutation({
    mutationFn: async (orgId: string) => {
      return apiClient.request(`/organizations/${orgId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      toast({ description: "Organization deactivated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/organizations"] });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        description: error.message || "Failed to deactivate organization",
      });
    },
  });

  const handleCreateOrg = (orgData: any) => {
    createOrgMutation.mutate(orgData);
  };

  const handleEditOrg = (org: Organization) => {
    setSelectedOrg(org);
    setEditDialogOpen(true);
  };

  const handleUpdateOrg = (updates: any) => {
    if (selectedOrg) {
      updateOrgMutation.mutate({ orgId: selectedOrg.id, updates });
    }
  };

  const handleViewOrg = (org: Organization) => {
    setSelectedOrg(org);
    setViewDialogOpen(true);
  };

  const handleDeleteOrg = (orgId: string) => {
    if (
      confirm(
        "Are you sure you want to deactivate this organization? This action will prevent new logins but preserve data."
      )
    ) {
      deleteOrgMutation.mutate(orgId);
    }
  };

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
          <h1 className="text-3xl font-bold">Organization Management</h1>
          <p className="text-muted-foreground">
            Manage customer organizations and their settings
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Organization
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Organizations
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {orgData?.totalOrganizations || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Organizations
            </CardTitle>
            <Building2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {orgData?.activeOrganizations || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Inactive Organizations
            </CardTitle>
            <Building2 className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {(orgData?.totalOrganizations || 0) -
                (orgData?.activeOrganizations || 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Organizations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Organizations</CardTitle>
          <CardDescription>
            View and manage all customer organizations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Name</th>
                  <th className="text-left py-2">Customer ID</th>
                  <th className="text-left py-2">Modules</th>
                  <th className="text-left py-2">Users</th>
                  <th className="text-left py-2">Status</th>
                  <th className="text-left py-2">Created</th>
                  <th className="text-left py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orgData?.organizations.map((org) => (
                  <tr key={org.id} className="border-b">
                    <td className="py-3">
                      <div className="font-medium">{org.name}</div>
                      <div className="text-sm text-muted-foreground">
                        ID: {org.id}
                      </div>
                    </td>
                    <td className="py-3">{org.customerId}</td>
                    <td className="py-3">
                      <div className="flex flex-wrap gap-1">
                        {org.assignedModules.map((module) => (
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
                      <div className="text-sm">
                        {org.userCount}/{org.maxUsers}
                      </div>
                    </td>
                    <td className="py-3">
                      <Badge variant={org.isActive ? "default" : "destructive"}>
                        {org.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="py-3">
                      {new Date(org.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewOrg(org)}
                        >
                          <Users className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditOrg(org)}
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                        {org.isActive && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteOrg(org.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Create Organization Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Organization</DialogTitle>
            <DialogDescription>
              Add a new customer organization to the system
            </DialogDescription>
          </DialogHeader>
          <CreateOrganizationForm
            onSubmit={handleCreateOrg}
            isLoading={createOrgMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Organization Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Organization: {selectedOrg?.name}</DialogTitle>
            <DialogDescription>
              Modify organization settings and module assignments
            </DialogDescription>
          </DialogHeader>
          {selectedOrg && (
            <EditOrganizationForm
              organization={selectedOrg}
              onSubmit={handleUpdateOrg}
              isLoading={updateOrgMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* View Organization Users Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Organization Users: {selectedOrg?.name}</DialogTitle>
            <DialogDescription>
              View and manage users in this organization
            </DialogDescription>
          </DialogHeader>
          {orgDetail && (
            <OrganizationUsersView
              organization={orgDetail.organization}
              users={orgDetail.users}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface CreateOrganizationFormProps {
  onSubmit: (data: any) => void;
  isLoading: boolean;
}

function CreateOrganizationForm({
  onSubmit,
  isLoading,
}: CreateOrganizationFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    customerId: "",
    assignedModules: ["post_secondary"],
    maxUsers: 10,
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Organization Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="customerId">Customer ID</Label>
        <Input
          id="customerId"
          value={formData.customerId}
          onChange={(e) =>
            setFormData({ ...formData, customerId: e.target.value })
          }
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="maxUsers">Maximum Users</Label>
        <Input
          id="maxUsers"
          type="number"
          min="1"
          value={formData.maxUsers}
          onChange={(e) =>
            setFormData({ ...formData, maxUsers: parseInt(e.target.value) })
          }
          required
        />
      </div>

      <div className="space-y-3">
        <Label className="text-base font-medium">Assigned Modules</Label>
        <div className="space-y-2 pl-4">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="k12"
              checked={formData.assignedModules.includes("k12")}
              onChange={() => toggleModule("k12")}
              className="rounded"
            />
            <Label htmlFor="k12">K-12</Label>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="post_secondary"
              checked={formData.assignedModules.includes("post_secondary")}
              onChange={() => toggleModule("post_secondary")}
              className="rounded"
            />
            <Label htmlFor="post_secondary">Post-Secondary</Label>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="tutoring"
              checked={formData.assignedModules.includes("tutoring")}
              onChange={() => toggleModule("tutoring")}
              className="rounded"
            />
            <Label htmlFor="tutoring">Tutoring</Label>
          </div>
        </div>
      </div>

      <Button type="submit" disabled={isLoading}>
        {isLoading ? "Creating..." : "Create Organization"}
      </Button>
    </form>
  );
}

interface EditOrganizationFormProps {
  organization: Organization;
  onSubmit: (updates: any) => void;
  isLoading: boolean;
}

function EditOrganizationForm({
  organization,
  onSubmit,
  isLoading,
}: EditOrganizationFormProps) {
  const [formData, setFormData] = useState({
    name: organization.name,
    assignedModules: organization.assignedModules,
    maxUsers: organization.maxUsers,
    isActive: organization.isActive,
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Organization Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="maxUsers">Maximum Users</Label>
        <Input
          id="maxUsers"
          type="number"
          min="1"
          value={formData.maxUsers}
          onChange={(e) =>
            setFormData({ ...formData, maxUsers: parseInt(e.target.value) })
          }
          required
        />
      </div>

      <div className="space-y-3">
        <Label className="text-base font-medium">Assigned Modules</Label>
        <div className="space-y-2 pl-4">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="k12"
              checked={formData.assignedModules.includes("k12")}
              onChange={() => toggleModule("k12")}
              className="rounded"
            />
            <Label htmlFor="k12">K-12</Label>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="post_secondary"
              checked={formData.assignedModules.includes("post_secondary")}
              onChange={() => toggleModule("post_secondary")}
              className="rounded"
            />
            <Label htmlFor="post_secondary">Post-Secondary</Label>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="tutoring"
              checked={formData.assignedModules.includes("tutoring")}
              onChange={() => toggleModule("tutoring")}
              className="rounded"
            />
            <Label htmlFor="tutoring">Tutoring</Label>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="isActive"
          checked={formData.isActive}
          onCheckedChange={(checked) =>
            setFormData({ ...formData, isActive: checked })
          }
        />
        <Label htmlFor="isActive">Organization Active</Label>
      </div>

      <Button type="submit" disabled={isLoading}>
        {isLoading ? "Saving..." : "Save Changes"}
      </Button>
    </form>
  );
}

interface OrganizationUsersViewProps {
  organization: Organization;
  users: OrganizationUser[];
}

function OrganizationUsersView({
  organization,
  users,
}: OrganizationUsersViewProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            {users.length} of {organization.maxUsers} users
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2">Username</th>
              <th className="text-left py-2">Email</th>
              <th className="text-left py-2">Role</th>
              <th className="text-left py-2">Status</th>
              <th className="text-left py-2">Reports</th>
              <th className="text-left py-2">Last Login</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b">
                <td className="py-3">{user.username}</td>
                <td className="py-3">{user.email}</td>
                <td className="py-3">
                  <Badge variant="secondary">{user.role}</Badge>
                </td>
                <td className="py-3">
                  <Badge variant={user.isActive ? "default" : "destructive"}>
                    {user.isActive ? "Active" : "Inactive"}
                  </Badge>
                </td>
                <td className="py-3">
                  {user.reportCount}/{user.maxReports}
                </td>
                <td className="py-3">
                  {user.lastLogin
                    ? new Date(user.lastLogin).toLocaleDateString()
                    : "Never"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
