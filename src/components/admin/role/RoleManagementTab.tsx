import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Edit2,
  Trash2,
  Shield,
  Users,
  Check,
  Calendar,
  Briefcase,
  Settings,
  Search,
  UserCheck,
  Key,
} from "lucide-react";
import { toast } from "sonner";
import { useUserStore } from "../../../store/UsersStore";
import {
  useCreateRole,
  useDeleteRole,
  useEditRole,
  useGetRoles,
} from "../../../hooks/usesRole";

interface Role {
  id: string;
  name: string;
  description: string;
  isAdmin: boolean;
  permissions: string[];
  createdAt: string;
  userCount: number;
  isDefault?: boolean;
}

interface ExistingTab {
  id: string;
  name: string;
  description: string;
  icon: string;
  path: string;
}

const existingTabs: ExistingTab[] = [
  {
    id: "teams",
    name: "Teams",
    description: "Manage departments, positions, and user assignments",
    icon: "Users",
    path: "/admin/settings?tab=teams",
  },
  {
    id: "calendar",
    name: "Calendar",
    description: "Configure holidays, working days and weekly schedules",
    icon: "Calendar",
    path: "/admin/settings?tab=calendar",
  },
  {
    id: "departments",
    name: "Departments",
    description: "Manage department tasks and assignments",
    icon: "Briefcase",
    path: "/admin/settings?tab=departments",
  },
  {
    id: "roles",
    name: "Roles",
    description: "Manage user roles and permissions",
    icon: "Shield",
    path: "/admin/settings?tab=roles",
  },
];

// Основные пермишены
const availablePermissions = [
  {
    id: "manage_users",
    name: "Manage Users",
    description: "Create, edit, and delete user accounts",
  },
  {
    id: "manage_teams",
    name: "Manage Teams",
    description: "Create and manage departments and teams",
  },
  {
    id: "manage_tasks",
    name: "Manage Tasks",
    description: "Create and assign tasks to departments",
  },
  {
    id: "manage_calendar",
    name: "Manage Calendar",
    description: "Configure holidays and working schedules",
  },
  {
    id: "view_reports",
    name: "View Reports",
    description: "Access to system reports and analytics",
  },
];

interface RoleManagementTabProps {
  onRoleCreated?: (role: Role) => void;
  onRoleUpdated?: (role: Role) => void;
  onRoleDeleted?: (roleId: string) => void;
}

export function RoleManagementTab({
  onRoleCreated,
  onRoleUpdated,
  onRoleDeleted,
}: RoleManagementTabProps) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [activeTab, setActiveTab] = useState("roles");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const store_roles = useUserStore((state) => state.roles);
  const { mutate: getRoles, isPending: isRolesLoading } = useGetRoles();
  const { mutate: createRole, isPending: isCreating } = useCreateRole();
  const { mutate: editRole, isPending: isEditing } = useEditRole();
  const { mutate: deleteRole, isPending: isDeleting } = useDeleteRole();
  const [newRole, setNewRole] = useState({
    name: "",
    description: "",
    isAdmin: false,
    selectedPermissions: [] as string[],
  });

  const [searchQuery, setSearchQuery] = useState("");

  // ✅ Вызываем getRoles при монтировании компонента
  useEffect(() => {
    getRoles();
  }, [getRoles]);

  // Загружаем роли из store
  useEffect(() => {
    if (store_roles && store_roles.length > 0) {
      // Преобразуем данные из стора в формат Role с проверкой permissions
      const formattedRoles = store_roles.map((role: any) => ({
        ...role,
        permissions: role.permissions || [], // ✅ Добавляем проверку
        isAdmin: role.isAdmin || false,
        userCount: role.userCount || 0,
      }));
      setRoles(formattedRoles);
    } else {
      setRoles([]); // Убраны моковые данные, теперь пустой массив
    }
  }, [store_roles]);

  // Filter roles based on search
  const filteredRoles = roles.filter(
    (role) =>
      role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      role.description.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // ✅ Используем createRole из хука
  const handleCreateRole = () => {
    if (!newRole.name.trim()) {
      toast.error("Role name is required");
      return;
    }

    createRole(
      {
        name: newRole.name.trim(),
      },
      {
        onSuccess: (data) => {
          // Если выбран админ доступ, добавляем все пермишены
          const finalPermissions = newRole.isAdmin
            ? availablePermissions.map((p) => p.id)
            : newRole.selectedPermissions;

          const newRoleObj: Role = {
            id: data?.id || `role_${Date.now()}`,
            name: newRole.name,
            description: newRole.description,
            isAdmin: newRole.isAdmin,
            permissions: finalPermissions,
            createdAt: new Date().toISOString().split("T")[0],
            userCount: 0,
          };

          setRoles((prev) => [...prev, newRoleObj]);
          setNewRole({
            name: "",
            description: "",
            isAdmin: false,
            selectedPermissions: [],
          });
          setIsCreateDialogOpen(false);

          onRoleCreated?.(newRoleObj);
          toast.success(`Role "${newRole.name}" created successfully`);
          getRoles(); // Обновляем список ролей
        },
        onError: (error) => {
          console.error("Error creating role:", error);
          toast.error(`Failed to create role: ${error.message}`);
        },
      },
    );
  };

  // ✅ Используем editRole из хука
  const handleEditRole = () => {
    if (!selectedRole || !newRole.name.trim()) return;

    editRole(
      {
        roleId: selectedRole.id,
        body: {
          name: newRole.name.trim(),
        },
      },
      {
        onSuccess: (data) => {
          // Если выбран админ доступ, добавляем все пермишены
          const finalPermissions = newRole.isAdmin
            ? availablePermissions.map((p) => p.id)
            : newRole.selectedPermissions;

          const updatedRole: Role = {
            ...selectedRole,
            name: newRole.name,
            description: newRole.description,
            isAdmin: newRole.isAdmin,
            permissions: finalPermissions,
          };

          setRoles((prev) =>
            prev.map((role) =>
              role.id === selectedRole.id ? updatedRole : role,
            ),
          );

          setSelectedRole(null);
          setNewRole({
            name: "",
            description: "",
            isAdmin: false,
            selectedPermissions: [],
          });
          setIsEditDialogOpen(false);

          onRoleUpdated?.(updatedRole);
          toast.success(`Role "${newRole.name}" updated successfully`);
          getRoles(); // Обновляем список ролей
        },
        onError: (error) => {
          console.error("Error editing role:", error);
          toast.error(`Failed to update role: ${error.message}`);
        },
      },
    );
  };

  // ✅ ОБНОВЛЕНО: Используем deleteRole из хука
  const handleDeleteRole = () => {
    if (!selectedRole) return;

    // Prevent deletion of default roles
    if (selectedRole.isDefault) {
      toast.error("Default roles cannot be deleted");
      return;
    }

    deleteRole(selectedRole.id, {
      onSuccess: () => {
        setRoles((prev) => prev.filter((role) => role.id !== selectedRole.id));
        setSelectedRole(null);
        setIsDeleteDialogOpen(false);

        onRoleDeleted?.(selectedRole.id);
        toast.success(`Role "${selectedRole.name}" deleted successfully`);
        getRoles(); // Обновляем список ролей
      },
      onError: (error) => {
        console.error("Error deleting role:", error);
        toast.error(`Failed to delete role: ${error.message}`);
        setIsDeleteDialogOpen(false);
      },
    });
  };

  const handleEditClick = (role: Role) => {
    setSelectedRole(role);
    setNewRole({
      name: role.name,
      description: role.description,
      isAdmin: role.isAdmin,
      selectedPermissions: role.isAdmin ? [] : [...(role.permissions || [])], // ✅ Добавляем проверку
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (role: Role) => {
    setSelectedRole(role);
    setIsDeleteDialogOpen(true);
  };

  const handlePermissionToggle = (permissionId: string) => {
    setNewRole((prev) => ({
      ...prev,
      selectedPermissions: prev.selectedPermissions.includes(permissionId)
        ? prev.selectedPermissions.filter((id) => id !== permissionId)
        : [...prev.selectedPermissions, permissionId],
    }));
  };

  const handleSelectAllPermissions = () => {
    const allSelected =
      newRole.selectedPermissions.length === availablePermissions.length;

    setNewRole((prev) => ({
      ...prev,
      selectedPermissions: allSelected
        ? []
        : availablePermissions.map((p) => p.id),
    }));
  };

  const handleAdminToggle = () => {
    const newAdminState = !newRole.isAdmin;
    setNewRole((prev) => ({
      ...prev,
      isAdmin: newAdminState,
      selectedPermissions: newAdminState ? [] : prev.selectedPermissions,
    }));
  };

  const getIconComponent = (iconName: string) => {
    const iconMap: { [key: string]: React.ElementType } = {
      Users: Users,
      Calendar: Calendar,
      Briefcase: Briefcase,
      Shield: Shield,
      Settings: Settings,
      Key: Key,
      UserCheck: UserCheck,
    };
    const Icon = iconMap[iconName] || Shield;
    return <Icon className="w-4 h-4" />;
  };

  // ✅ Добавлены проверки на undefined
  const getPermissionsCountText = (role: Role) => {
    if (!role) return "No permissions";
    if (role.isAdmin) return "Admin (all permissions)";

    const permissions = role.permissions || [];
    return `${permissions.length} permission${permissions.length !== 1 ? "s" : ""}`;
  };

  // Функция для сброса формы
  const resetForm = () => {
    setNewRole({
      name: "",
      description: "",
      isAdmin: false,
      selectedPermissions: [],
    });
  };

  // Показываем загрузку, если данные еще загружаются
  if (isRolesLoading && !store_roles) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Shield className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading roles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="w-6 h-6" />
            Role Management
          </h2>
          <p className="text-muted-foreground">
            Define roles and permissions for system access control
          </p>
        </div>

        {/* Кнопка создания роли - ВЫХОДИТ ДИАЛОГ */}
        <Dialog
          open={isCreateDialogOpen}
          onOpenChange={(open) => {
            setIsCreateDialogOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button disabled={isCreating || isDeleting}>
              <Plus className="w-4 h-4 mr-2" />
              {isCreating ? "Creating..." : "Create Role"}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Role</DialogTitle>
              <DialogDescription>
                Define a new role for system access
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Первая строка: Role Name и Description в 2 колонки */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="role-name">Role Name *</Label>
                  <Input
                    id="role-name"
                    placeholder="e.g., Project Manager"
                    value={newRole.name}
                    onChange={(e) =>
                      setNewRole({ ...newRole, name: e.target.value })
                    }
                    disabled={isCreating}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role-description">Description</Label>
                  <Textarea
                    id="role-description"
                    placeholder="Describe the role's purpose..."
                    value={newRole.description}
                    onChange={(e) =>
                      setNewRole({ ...newRole, description: e.target.value })
                    }
                    rows={2}
                    className="resize-none"
                    disabled={isCreating}
                  />
                </div>
              </div>

              {/* Вторая строка: Access Level - на всю ширину */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">Access Level</Label>
                </div>

                <div className="space-y-2">
                  {/* Admin toggle */}
                  <div
                    className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${newRole.isAdmin
                      ? "bg-blue-50 border-blue-200"
                      : "border-gray-200 hover:bg-gray-50"
                      }`}
                    onClick={!isCreating ? handleAdminToggle : undefined}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-5 h-5 rounded border flex items-center justify-center ${newRole.isAdmin
                          ? "bg-blue-100 border-blue-400"
                          : "bg-white border-gray-300"
                          }`}
                      >
                        {newRole.isAdmin && (
                          <Check className="w-3.5 h-3.5 text-black" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">Administrator Access</p>
                        <p className="text-xs text-gray-500">
                          Full system access to all features
                        </p>
                      </div>
                    </div>
                    {newRole.isAdmin && (
                      <Badge className="bg-blue-100 text-blue-800">
                        All Permissions
                      </Badge>
                    )}
                  </div>

                  {/* Only show specific permissions if not admin */}
                  {!newRole.isAdmin && (
                    <>
                      <div className="mt-4 mb-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-semibold">
                            Specific Permissions
                          </Label>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleSelectAllPermissions}
                            className="text-xs h-6 px-2"
                            disabled={isCreating}
                          >
                            {newRole.selectedPermissions.length ===
                              availablePermissions.length
                              ? "Deselect All"
                              : "Select All"}
                          </Button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {newRole.selectedPermissions.length} of{" "}
                          {availablePermissions.length} selected
                        </p>
                      </div>

                      {/* Permissions в 2 колонки */}
                      <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-2">
                        {availablePermissions.map((permission) => (
                          <div
                            key={permission.id}
                            className={`flex items-center space-x-2 p-3 rounded border cursor-pointer transition-colors ${newRole.selectedPermissions.includes(
                              permission.id,
                            )
                              ? "bg-blue-50 border-blue-200"
                              : "border-gray-200 hover:bg-gray-50"
                              }`}
                            onClick={
                              !isCreating
                                ? () => handlePermissionToggle(permission.id)
                                : undefined
                            }
                          >
                            <div
                              className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${newRole.selectedPermissions.includes(
                                permission.id,
                              )
                                ? "bg-blue-100 border-blue-400"
                                : "bg-white border-gray-300"
                                }`}
                            >
                              {newRole.selectedPermissions.includes(
                                permission.id,
                              ) && <Check className="w-3 h-3 text-black" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium">
                                {permission.name}
                              </p>
                              <p className="text-xs text-gray-500 truncate">
                                {permission.description}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreateDialogOpen(false);
                  resetForm();
                }}
                className="flex-1"
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateRole}
                disabled={
                  !newRole.name.trim() ||
                  (!newRole.isAdmin &&
                    newRole.selectedPermissions.length === 0) ||
                  isCreating
                }
              >
                {isCreating ? "Creating..." : "Create Role"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b">
        <div className="flex space-x-1">
          <button
            onClick={() => setActiveTab("roles")}
            className={`
                            inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors
                            ${activeTab === "roles"
                ? "!bg-black !text-white"
                : "text-muted-foreground hover:text-black hover:bg-muted"
              }
                        `}
          >
            <Shield className="w-4 h-4" />
            Roles
          </button>
          <button
            onClick={() => setActiveTab("tabs")}
            className={`
                            inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors
                            ${activeTab === "tabs"
                ? "!bg-black !text-white"
                : "text-muted-foreground hover:text-black hover:bg-muted"
              }
                        `}
          >
            <Settings className="w-4 h-4" />
            System Tabs
          </button>
        </div>
      </div>

      {/* Roles Tab */}
      {activeTab === "roles" && (
        <div className="space-y-6">
          {/* Search and Stats */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative flex-1">
                  <Input
                    placeholder="Search roles by name or description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                </div>

                <div className="flex gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{roles.length}</div>
                    <div className="text-sm text-gray-500">Total Roles</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {roles.reduce(
                        (sum, role) => sum + (role.userCount || 0),
                        0,
                      )}
                    </div>
                    <div className="text-sm text-gray-500">Users Assigned</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {roles.filter((r) => r.isAdmin).length}
                    </div>
                    <div className="text-sm text-gray-500">Admin Roles</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Roles Table */}
          <Card>
            <CardHeader>
              <CardTitle>System Roles</CardTitle>
              <CardDescription>
                Manage user roles and their permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Role</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Access Level</TableHead>
                      <TableHead>Users</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRoles.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="text-center py-8 text-gray-500"
                        >
                          No roles found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredRoles.map((role) => (
                        <TableRow key={role.id} className="hover:bg-gray-50">
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Shield
                                className={`w-4 h-4 ${role.isAdmin
                                  ? "text-blue-500"
                                  : "text-gray-400"
                                  }`}
                              />
                              <div>
                                <div className="font-medium">{role.name}</div>
                                {role.isDefault && (
                                  <Badge variant="outline" className="text-xs">
                                    Default
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm text-gray-600 max-w-md">
                              {role.description}
                            </p>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {role.isAdmin ? (
                                <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                                  Administrator
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="text-xs">
                                  {getPermissionsCountText(role)}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-gray-400" />
                              <span className="font-medium">
                                {role.userCount || 0}
                              </span>
                              <span className="text-sm text-gray-500">
                                users
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-gray-600">
                              {role.createdAt}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEditClick(role)}
                                disabled={isEditing || isDeleting}
                              >
                                <Edit2 className="w-3 h-3" />
                              </Button>
                              {!role.isDefault && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDeleteClick(role)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  disabled={isEditing || isDeleting}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* System Tabs Tab */}
      {activeTab === "tabs" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Tabs Overview</CardTitle>
              <CardDescription>
                Information about existing tabs in the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {existingTabs.map((tab) => (
                  <Card
                    key={tab.id}
                    className="overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gray-50 rounded-lg">
                            {getIconComponent(tab.icon)}
                          </div>
                          <div>
                            <CardTitle className="text-lg">
                              {tab.name}
                            </CardTitle>
                            <CardDescription className="mt-1">
                              {tab.description}
                            </CardDescription>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <span>Path:</span>
                          <code className="px-2 py-1 bg-gray-100 rounded text-xs">
                            {tab.path}
                          </code>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Role Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Role</DialogTitle>
            <DialogDescription>
              Modify role details and permissions
            </DialogDescription>
          </DialogHeader>

          {selectedRole && (
            <div className="space-y-4 py-4">
              {/* Первая строка: Role Name и Description в 2 колонки */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-role-name">Role Name *</Label>
                  <Input
                    id="edit-role-name"
                    value={newRole.name}
                    onChange={(e) =>
                      setNewRole({ ...newRole, name: e.target.value })
                    }
                    disabled={isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-role-description">Description</Label>
                  <Textarea
                    id="edit-role-description"
                    value={newRole.description}
                    onChange={(e) =>
                      setNewRole({ ...newRole, description: e.target.value })
                    }
                    rows={2}
                    className="resize-none"
                    disabled={isEditing}
                  />
                </div>
              </div>

              {/* Access Level - на всю ширину */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">Access Level</Label>
                </div>

                <div className="space-y-2">
                  {/* Admin toggle */}
                  <div
                    className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${newRole.isAdmin
                      ? "bg-blue-50 border-blue-200"
                      : "border-gray-200 hover:bg-gray-50"
                      }`}
                    onClick={!isEditing ? handleAdminToggle : undefined}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-5 h-5 rounded border flex items-center justify-center ${newRole.isAdmin
                          ? "bg-blue-100 border-blue-400"
                          : "bg-white border-gray-300"
                          }`}
                      >
                        {newRole.isAdmin && (
                          <Check className="w-3.5 h-3.5 text-black" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">Administrator Access</p>
                        <p className="text-xs text-gray-500">
                          Full system access to all features
                        </p>
                      </div>
                    </div>
                    {newRole.isAdmin && (
                      <Badge className="bg-blue-100 text-blue-800">
                        All Permissions
                      </Badge>
                    )}
                  </div>

                  {/* Only show specific permissions if not admin */}
                  {!newRole.isAdmin && (
                    <>
                      <div className="mt-4 mb-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-semibold">
                            Specific Permissions
                          </Label>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleSelectAllPermissions}
                            className="text-xs h-6 px-2"
                            disabled={isEditing}
                          >
                            {newRole.selectedPermissions.length ===
                              availablePermissions.length
                              ? "Deselect All"
                              : "Select All"}
                          </Button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {newRole.selectedPermissions.length} of{" "}
                          {availablePermissions.length} selected
                        </p>
                      </div>

                      {/* Permissions в 2 колонки */}
                      <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-2">
                        {availablePermissions.map((permission) => (
                          <div
                            key={permission.id}
                            className={`flex items-center space-x-2 p-3 rounded border cursor-pointer transition-colors ${newRole.selectedPermissions.includes(
                              permission.id,
                            )
                              ? "bg-blue-50 border-blue-200"
                              : "border-gray-200 hover:bg-gray-50"
                              }`}
                            onClick={
                              !isEditing
                                ? () => handlePermissionToggle(permission.id)
                                : undefined
                            }
                          >
                            <div
                              className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${newRole.selectedPermissions.includes(
                                permission.id,
                              )
                                ? "bg-blue-100 border-blue-400"
                                : "bg-white border-gray-300"
                                }`}
                            >
                              {newRole.selectedPermissions.includes(
                                permission.id,
                              ) && <Check className="w-3 h-3 text-black" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium">
                                {permission.name}
                              </p>
                              <p className="text-xs text-gray-500 truncate">
                                {permission.description}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false);
                setSelectedRole(null);
                resetForm();
              }}
              className="flex-1"
              disabled={isEditing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditRole}
              disabled={
                !newRole.name.trim() ||
                (!newRole.isAdmin &&
                  newRole.selectedPermissions.length === 0) ||
                isEditing
              }
            >
              {isEditing ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="w-5 h-5" />
              Delete Role
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the
              role.
            </DialogDescription>
          </DialogHeader>

          {selectedRole && (
            <div className="py-4">
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-red-500" />
                  <div>
                    <p className="font-semibold">{selectedRole.name}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      {selectedRole.description}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 text-sm text-gray-600">
                <p className="font-medium">This will affect:</p>
                <ul className="list-disc pl-5 mt-1 space-y-1">
                  <li>Role "{selectedRole.name}" will be removed</li>
                  <li>
                    {selectedRole.userCount || 0} user(s) will lose this role
                  </li>
                  <li>Permission assignments will be lost</li>
                </ul>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setSelectedRole(null);
              }}
              className="flex-1"
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteRole}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
