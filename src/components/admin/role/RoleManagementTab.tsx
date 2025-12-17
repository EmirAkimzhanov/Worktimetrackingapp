import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
    Key
} from 'lucide-react';
import { toast } from 'sonner';

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
        id: 'teams',
        name: 'Teams',
        description: 'Manage departments, positions, and user assignments',
        icon: 'Users',
        path: '/admin/settings?tab=teams'
    },
    {
        id: 'calendar',
        name: 'Calendar',
        description: 'Configure holidays, working days and weekly schedules',
        icon: 'Calendar',
        path: '/admin/settings?tab=calendar'
    },
    {
        id: 'departments',
        name: 'Departments',
        description: 'Manage department tasks and assignments',
        icon: 'Briefcase',
        path: '/admin/settings?tab=departments'
    },
    {
        id: 'roles',
        name: 'Roles',
        description: 'Manage user roles and permissions',
        icon: 'Shield',
        path: '/admin/settings?tab=roles'
    }
];

// Основные пермишены
const availablePermissions = [
    { id: 'manage_users', name: 'Manage Users', description: 'Create, edit, and delete user accounts' },
    { id: 'manage_teams', name: 'Manage Teams', description: 'Create and manage departments and teams' },
    { id: 'manage_tasks', name: 'Manage Tasks', description: 'Create and assign tasks to departments' },
    { id: 'manage_calendar', name: 'Manage Calendar', description: 'Configure holidays and working schedules' },
    { id: 'view_reports', name: 'View Reports', description: 'Access to system reports and analytics' }
];

const defaultRoles: Role[] = [
    {
        id: 'admin',
        name: 'Administrator',
        description: 'Full system access with all permissions',
        isAdmin: true,
        permissions: availablePermissions.map(p => p.id),
        createdAt: '2024-01-01',
        userCount: 3,
        isDefault: true
    },
    {
        id: 'manager',
        name: 'Department Manager',
        description: 'Can manage teams and tasks within assigned departments',
        isAdmin: false,
        permissions: ['manage_users', 'manage_tasks', 'view_reports'],
        createdAt: '2024-01-15',
        userCount: 12,
        isDefault: true
    },
    {
        id: 'employee',
        name: 'Employee',
        description: 'Basic access to view and manage own tasks',
        isAdmin: false,
        permissions: ['view_reports'],
        createdAt: '2024-01-15',
        userCount: 45,
        isDefault: true
    },
    {
        id: 'viewer',
        name: 'Viewer',
        description: 'Read-only access to view system information',
        isAdmin: false,
        permissions: [],
        createdAt: '2024-02-01',
        userCount: 8,
        isDefault: true
    }
];

interface RoleManagementTabProps {
    onRoleCreated?: (role: Role) => void;
    onRoleUpdated?: (role: Role) => void;
    onRoleDeleted?: (roleId: string) => void;
}

export function RoleManagementTab({
    onRoleCreated,
    onRoleUpdated,
    onRoleDeleted
}: RoleManagementTabProps) {
    const [roles, setRoles] = useState<Role[]>(defaultRoles);
    const [activeTab, setActiveTab] = useState('roles');
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedRole, setSelectedRole] = useState<Role | null>(null);

    const [newRole, setNewRole] = useState({
        name: '',
        description: '',
        isAdmin: false,
        selectedPermissions: [] as string[]
    });

    const [searchQuery, setSearchQuery] = useState('');

    // Filter roles based on search
    const filteredRoles = roles.filter(role =>
        role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        role.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleCreateRole = () => {
        if (!newRole.name.trim()) {
            toast.error('Role name is required');
            return;
        }

        // Если выбран админ доступ, добавляем все пермишены
        const finalPermissions = newRole.isAdmin
            ? availablePermissions.map(p => p.id)
            : newRole.selectedPermissions;

        const newRoleObj: Role = {
            id: `role_${Date.now()}`,
            name: newRole.name,
            description: newRole.description,
            isAdmin: newRole.isAdmin,
            permissions: finalPermissions,
            createdAt: new Date().toISOString().split('T')[0],
            userCount: 0
        };

        setRoles(prev => [...prev, newRoleObj]);
        setNewRole({ name: '', description: '', isAdmin: false, selectedPermissions: [] });
        setIsCreateDialogOpen(false);

        onRoleCreated?.(newRoleObj);
        toast.success(`Role "${newRole.name}" created successfully`);

        console.log('Created new role:', newRoleObj);
    };

    const handleEditRole = () => {
        if (!selectedRole || !newRole.name.trim()) return;

        // Если выбран админ доступ, добавляем все пермишены
        const finalPermissions = newRole.isAdmin
            ? availablePermissions.map(p => p.id)
            : newRole.selectedPermissions;

        const updatedRole: Role = {
            ...selectedRole,
            name: newRole.name,
            description: newRole.description,
            isAdmin: newRole.isAdmin,
            permissions: finalPermissions
        };

        setRoles(prev => prev.map(role =>
            role.id === selectedRole.id ? updatedRole : role
        ));

        setSelectedRole(null);
        setNewRole({ name: '', description: '', isAdmin: false, selectedPermissions: [] });
        setIsEditDialogOpen(false);

        onRoleUpdated?.(updatedRole);
        toast.success(`Role "${newRole.name}" updated successfully`);
    };

    const handleDeleteRole = () => {
        if (!selectedRole) return;

        // Prevent deletion of default roles
        if (selectedRole.isDefault) {
            toast.error('Default roles cannot be deleted');
            return;
        }

        setRoles(prev => prev.filter(role => role.id !== selectedRole.id));
        setSelectedRole(null);
        setIsDeleteDialogOpen(false);

        onRoleDeleted?.(selectedRole.id);
        toast.success(`Role "${selectedRole.name}" deleted successfully`);
    };

    const handleEditClick = (role: Role) => {
        setSelectedRole(role);
        setNewRole({
            name: role.name,
            description: role.description,
            isAdmin: role.isAdmin,
            selectedPermissions: role.isAdmin ? [] : [...role.permissions]
        });
        setIsEditDialogOpen(true);
    };

    const handleDeleteClick = (role: Role) => {
        setSelectedRole(role);
        setIsDeleteDialogOpen(true);
    };

    const handlePermissionToggle = (permissionId: string) => {
        setNewRole(prev => ({
            ...prev,
            selectedPermissions: prev.selectedPermissions.includes(permissionId)
                ? prev.selectedPermissions.filter(id => id !== permissionId)
                : [...prev.selectedPermissions, permissionId]
        }));
    };

    const handleSelectAllPermissions = () => {
        const allSelected = newRole.selectedPermissions.length === availablePermissions.length;

        setNewRole(prev => ({
            ...prev,
            selectedPermissions: allSelected
                ? []
                : availablePermissions.map(p => p.id)
        }));
    };

    const handleAdminToggle = () => {
        const newAdminState = !newRole.isAdmin;
        setNewRole(prev => ({
            ...prev,
            isAdmin: newAdminState,
            selectedPermissions: newAdminState ? [] : prev.selectedPermissions
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
            UserCheck: UserCheck
        };
        const Icon = iconMap[iconName] || Shield;
        return <Icon className="w-4 h-4" />;
    };

    const getPermissionsCountText = (role: Role) => {
        if (role.isAdmin) return 'Admin (all permissions)';
        return `${role.permissions.length} permission${role.permissions.length !== 1 ? 's' : ''}`;
    };

    // Функция для сброса формы
    const resetForm = () => {
        setNewRole({
            name: '',
            description: '',
            isAdmin: false,
            selectedPermissions: []
        });
    };

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
                <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
                    setIsCreateDialogOpen(open);
                    if (!open) resetForm(); // Сбрасываем форму при закрытии
                }}>
                    <DialogTrigger asChild>
                        <Button
                            onClick={() => setIsCreateDialogOpen(true)}
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Create Role
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>Create New Role</DialogTitle>
                            <DialogDescription>
                                Define a new role for system access
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="role-name">Role Name *</Label>
                                <Input
                                    id="role-name"
                                    placeholder="e.g., Project Manager"
                                    value={newRole.name}
                                    onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="role-description">Description</Label>
                                <Textarea
                                    id="role-description"
                                    placeholder="Describe the role's purpose..."
                                    value={newRole.description}
                                    onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                                    rows={2}
                                />
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label className="text-sm font-semibold">Access Level</Label>
                                </div>

                                <div className="space-y-2">
                                    {/* Admin toggle - ИЗМЕНЕНО: черная галочка */}
                                    <div
                                        className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${newRole.isAdmin ? 'bg-blue-50 border-blue-200' : 'border-gray-200 hover:bg-gray-50'
                                            }`}
                                        onClick={handleAdminToggle}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-5 h-5 rounded border flex items-center justify-center ${newRole.isAdmin ? 'bg-blue-100 border-blue-400' : 'bg-white border-gray-300'
                                                }`}>
                                                {newRole.isAdmin && (
                                                    <Check className="w-3.5 h-3.5 text-black" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-medium">Administrator Access</p>
                                                <p className="text-xs text-gray-500">Full system access to all features</p>
                                            </div>
                                        </div>
                                        {newRole.isAdmin && (
                                            <Badge className="bg-blue-100 text-blue-800">All Permissions</Badge>
                                        )}
                                    </div>

                                    {/* Only show specific permissions if not admin */}
                                    {!newRole.isAdmin && (
                                        <>
                                            <div className="mt-4 mb-2">
                                                <div className="flex items-center justify-between">
                                                    <Label className="text-sm font-semibold">Specific Permissions</Label>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={handleSelectAllPermissions}
                                                        className="text-xs h-6 px-2"
                                                    >
                                                        {newRole.selectedPermissions.length === availablePermissions.length
                                                            ? 'Deselect All'
                                                            : 'Select All'}
                                                    </Button>
                                                </div>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {newRole.selectedPermissions.length} of {availablePermissions.length} selected
                                                </p>
                                            </div>

                                            <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                                                {availablePermissions.map(permission => (
                                                    <div
                                                        key={permission.id}
                                                        className={`flex items-center space-x-2 p-3 rounded border cursor-pointer transition-colors ${newRole.selectedPermissions.includes(permission.id)
                                                            ? 'bg-blue-50 border-blue-200'
                                                            : 'border-gray-200 hover:bg-gray-50'
                                                            }`}
                                                        onClick={() => handlePermissionToggle(permission.id)}
                                                    >
                                                        {/* ИЗМЕНЕНО: черная галочка */}
                                                        <div className={`w-4 h-4 rounded border flex items-center justify-center ${newRole.selectedPermissions.includes(permission.id)
                                                            ? 'bg-blue-100 border-blue-400'
                                                            : 'bg-white border-gray-300'
                                                            }`}>
                                                            {newRole.selectedPermissions.includes(permission.id) && (
                                                                <Check className="w-3 h-3 text-black" />
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium">
                                                                {permission.name}
                                                            </p>
                                                            <p className="text-xs text-gray-500">
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
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleCreateRole}
                                disabled={!newRole.name.trim() || (!newRole.isAdmin && newRole.selectedPermissions.length === 0)}
                            >
                                Create Role
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Tabs Navigation */}
            <div className="border-b">
                <div className="flex space-x-1">
                    <button
                        onClick={() => setActiveTab('roles')}
                        className={`
                            inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors
                            ${activeTab === 'roles'
                                ? '!bg-black !text-white'
                                : 'text-muted-foreground hover:text-black hover:bg-muted'
                            }
                        `}
                    >
                        <Shield className="w-4 h-4" />
                        Roles
                    </button>
                    <button
                        onClick={() => setActiveTab('tabs')}
                        className={`
                            inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors
                            ${activeTab === 'tabs'
                                ? '!bg-black !text-white'
                                : 'text-muted-foreground hover:text-black hover:bg-muted'
                            }
                        `}
                    >
                        <Settings className="w-4 h-4" />
                        System Tabs
                    </button>
                </div>
            </div>

            {/* Roles Tab */}
            {activeTab === 'roles' && (
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
                                            {roles.reduce((sum, role) => sum + role.userCount, 0)}
                                        </div>
                                        <div className="text-sm text-gray-500">Users Assigned</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold">
                                            {roles.filter(r => r.isAdmin).length}
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
                                        {filteredRoles.map((role) => (
                                            <TableRow key={role.id} className="hover:bg-gray-50">
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Shield className={`w-4 h-4 ${role.isAdmin ? 'text-blue-500' : 'text-gray-400'
                                                            }`} />
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
                                                        <span className="font-medium">{role.userCount}</span>
                                                        <span className="text-sm text-gray-500">users</span>
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
                                                        >
                                                            <Edit2 className="w-3 h-3" />
                                                        </Button>
                                                        {!role.isDefault && (
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() => handleDeleteClick(role)}
                                                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                            >
                                                                <Trash2 className="w-3 h-3" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* System Tabs Tab */}
            {activeTab === 'tabs' && (
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
                                    <Card key={tab.id} className="overflow-hidden hover:shadow-md transition-shadow">
                                        <CardHeader className="pb-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-gray-50 rounded-lg">
                                                        {getIconComponent(tab.icon)}
                                                    </div>
                                                    <div>
                                                        <CardTitle className="text-lg">{tab.name}</CardTitle>
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
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Edit Role</DialogTitle>
                        <DialogDescription>
                            Modify role details and permissions
                        </DialogDescription>
                    </DialogHeader>

                    {selectedRole && (
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-role-name">Role Name *</Label>
                                <Input
                                    id="edit-role-name"
                                    value={newRole.name}
                                    onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="edit-role-description">Description</Label>
                                <Textarea
                                    id="edit-role-description"
                                    value={newRole.description}
                                    onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                                    rows={2}
                                />
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label className="text-sm font-semibold">Access Level</Label>
                                </div>

                                <div className="space-y-2">
                                    {/* Admin toggle - ИЗМЕНЕНО: черная галочка */}
                                    <div
                                        className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${newRole.isAdmin ? 'bg-blue-50 border-blue-200' : 'border-gray-200 hover:bg-gray-50'
                                            }`}
                                        onClick={handleAdminToggle}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-5 h-5 rounded border flex items-center justify-center ${newRole.isAdmin ? 'bg-blue-100 border-blue-400' : 'bg-white border-gray-300'
                                                }`}>
                                                {newRole.isAdmin && (
                                                    <Check className="w-3.5 h-3.5 text-black" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-medium">Administrator Access</p>
                                                <p className="text-xs text-gray-500">Full system access to all features</p>
                                            </div>
                                        </div>
                                        {newRole.isAdmin && (
                                            <Badge className="bg-blue-100 text-blue-800">All Permissions</Badge>
                                        )}
                                    </div>

                                    {/* Only show specific permissions if not admin */}
                                    {!newRole.isAdmin && (
                                        <>
                                            <div className="mt-4 mb-2">
                                                <div className="flex items-center justify-between">
                                                    <Label className="text-sm font-semibold">Specific Permissions</Label>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={handleSelectAllPermissions}
                                                        className="text-xs h-6 px-2"
                                                    >
                                                        {newRole.selectedPermissions.length === availablePermissions.length
                                                            ? 'Deselect All'
                                                            : 'Select All'}
                                                    </Button>
                                                </div>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {newRole.selectedPermissions.length} of {availablePermissions.length} selected
                                                </p>
                                            </div>

                                            <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                                                {availablePermissions.map(permission => (
                                                    <div
                                                        key={permission.id}
                                                        className={`flex items-center space-x-2 p-3 rounded border cursor-pointer transition-colors ${newRole.selectedPermissions.includes(permission.id)
                                                            ? 'bg-blue-50 border-blue-200'
                                                            : 'border-gray-200 hover:bg-gray-50'
                                                            }`}
                                                        onClick={() => handlePermissionToggle(permission.id)}
                                                    >
                                                        {/* ИЗМЕНЕНО: черная галочка */}
                                                        <div className={`w-4 h-4 rounded border flex items-center justify-center ${newRole.selectedPermissions.includes(permission.id)
                                                            ? 'bg-blue-100 border-blue-400'
                                                            : 'bg-white border-gray-300'
                                                            }`}>
                                                            {newRole.selectedPermissions.includes(permission.id) && (
                                                                <Check className="w-3 h-3 text-black" />
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium">
                                                                {permission.name}
                                                            </p>
                                                            <p className="text-xs text-gray-500">
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
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleEditRole}
                            disabled={!newRole.name.trim() || (!newRole.isAdmin && newRole.selectedPermissions.length === 0)}
                        >
                            Save Changes
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
                            This action cannot be undone. This will permanently delete the role.
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
                                    <li>{selectedRole.userCount} user(s) will lose this role</li>
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
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleDeleteRole}
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                        >
                            Delete Role
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}