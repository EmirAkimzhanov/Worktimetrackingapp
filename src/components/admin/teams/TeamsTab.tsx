// src/components/admin/TeamsTab.tsx
import React, { useState, useMemo, ChangeEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import { Badge } from '../../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../../ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../../ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { Textarea } from '../../ui/textarea';
import { Switch } from '../../ui/switch';
import { Plus, Edit, Trash2, Users, UserCog, Building, Search, Mail, Phone, Calendar, Briefcase, UserPlus, Crown, X } from 'lucide-react';
import { User, Department, Position, TeamMember } from '../../../types/types';

interface TeamsTabProps {
    departments: Department[];
    positions: Position[];
    users: User[];
    teamMembers: TeamMember[];
    onAddDepartment: (department: Omit<Department, 'id'>) => void;
    onUpdateDepartment: (department: Department) => void;
    onDeleteDepartment: (id: number) => void;
    onAddUser: (user: Omit<User, 'id'>) => void;
    onUpdateUser: (user: User) => void;
    onDeleteUser: (id: number) => void;
    onAssignToDepartment: (userId: number, departmentId: number, role: TeamMember['role']) => void;
    onRemoveFromDepartment: (userId: number, departmentId: number) => void;
    onAddUsersToDepartment: (userIds: number[], departmentId: number) => void;
    onSetDepartmentManager: (departmentId: number, managerId: number | null) => void;
}

export function TeamsTab({
    departments,
    positions,
    users,
    teamMembers,
    onAddDepartment,
    onUpdateDepartment,
    onDeleteDepartment,
    onAddUser,
    onUpdateUser,
    onDeleteUser,
    onAssignToDepartment,
    onRemoveFromDepartment,
    onAddUsersToDepartment,
    onSetDepartmentManager
}: TeamsTabProps) {
    const [activeTab, setActiveTab] = useState('departments');
    const [searchQuery, setSearchQuery] = useState('');
    const [departmentDialogOpen, setDepartmentDialogOpen] = useState(false);
    const [userDialogOpen, setUserDialogOpen] = useState(false);
    const [assignDialogOpen, setAssignDialogOpen] = useState(false);
    const [assignMultipleDialogOpen, setAssignMultipleDialogOpen] = useState(false);
    const [managerDialogOpen, setManagerDialogOpen] = useState(false);
    const [deleteDeptDialogOpen, setDeleteDeptDialogOpen] = useState(false);
    const [deleteUserDialogOpen, setDeleteUserDialogOpen] = useState(false);

    const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [assigningUser, setAssigningUser] = useState<User | null>(null);
    const [assigningToDept, setAssigningToDept] = useState<Department | null>(null);
    const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
    const [managingDept, setManagingDept] = useState<Department | null>(null);
    const [deptToDelete, setDeptToDelete] = useState<number | null>(null);
    const [userToDelete, setUserToDelete] = useState<number | null>(null);

    // Формы
    const [deptName, setDeptName] = useState('');
    const [deptCode, setDeptCode] = useState('');
    const [deptDescription, setDeptDescription] = useState('');

    const [userEmail, setUserEmail] = useState('');
    const [userFirstName, setUserFirstName] = useState('');
    const [userLastName, setUserLastName] = useState('');
    const [userRole, setUserRole] = useState<User['role']>('user');
    const [userPositionId, setUserPositionId] = useState<string>('');
    const [userDepartmentId, setUserDepartmentId] = useState<string>('');
    const [userIsActive, setUserIsActive] = useState(true);
    const [userDateJoined, setUserDateJoined] = useState(new Date().toISOString().split('T')[0]);
    const [userLeaveDate, setUserLeaveDate] = useState('');
    const [userPassword, setUserPassword] = useState('');

    const [selectedDeptForAssign, setSelectedDeptForAssign] = useState<string>('');
    const [assignRole, setAssignRole] = useState<TeamMember['role']>('member');
    const [selectedManagerId, setSelectedManagerId] = useState<string>('');

    // Фильтрация и группировка данных
    const filteredDepartments = useMemo(() => {
        return departments.filter(dept =>
            dept.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (dept.code && dept.code.toLowerCase().includes(searchQuery.toLowerCase()))
        );
    }, [departments, searchQuery]);

    const filteredUsers = useMemo(() => {
        return users.filter(user =>
            user.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [users, searchQuery]);

    const getDepartmentUsers = (deptId: number) => {
        const memberIds = teamMembers
            .filter(member => member.departmentId === deptId)
            .map(member => member.userId);

        return users.filter(user => memberIds.includes(user.id));
    };

    const getDepartmentManager = (deptId: number) => {
        const deptUsers = getDepartmentUsers(deptId);
        return deptUsers.find(user =>
            teamMembers.some(m =>
                m.userId === user.id &&
                m.departmentId === deptId &&
                m.role === 'manager'
            )
        ) || null;
    };

    const getAvailableUsersForDepartment = (deptId: number) => {
        const deptUserIds = teamMembers
            .filter(member => member.departmentId === deptId)
            .map(member => member.userId);

        return users.filter(user => !deptUserIds.includes(user.id) && user.is_active);
    };

    const getUnassignedUsers = () => {
        const assignedUserIds = teamMembers.map(member => member.userId);
        return users.filter(user => !assignedUserIds.includes(user.id) && user.is_active);
    };

    const getUserDepartment = (userId: number) => {
        const member = teamMembers.find(m => m.userId === userId);
        if (!member) return null;
        return departments.find(d => d.id === member.departmentId);
    };

    const getUserPosition = (userId: number) => {
        const user = users.find(u => u.id === userId);
        if (!user) return null;
        return positions.find(p => p.id === user.position_id);
    };

    const getUserRoleInDepartment = (userId: number) => {
        const member = teamMembers.find(m => m.userId === userId);
        return member?.role || null;
    };

    const handleAddDepartment = () => {
        const newDept: Omit<Department, 'id'> = {
            name: deptName,
            code: deptCode || '',
            description: deptDescription || '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            teamSize: 0
        };

        onAddDepartment(newDept);
        resetDepartmentForm();
        setDepartmentDialogOpen(false);
    };

    const handleUpdateDepartment = () => {
        if (!editingDepartment) return;

        const updatedDept: Department = {
            ...editingDepartment,
            name: deptName,
            code: deptCode || '',
            description: deptDescription || '',
            updatedAt: new Date().toISOString()
        };

        onUpdateDepartment(updatedDept);
        resetDepartmentForm();
        setDepartmentDialogOpen(false);
    };

    const handleAddUser = () => {
        const newUser: Omit<User, 'id'> = {
            email: userEmail,
            first_name: userFirstName,
            last_name: userLastName,
            date_joined: userDateJoined,
            leave_date: userLeaveDate || undefined,
            is_active: userIsActive,
            position_id: userPositionId ? parseInt(userPositionId) : 0,
            department_id: userDepartmentId ? parseInt(userDepartmentId) : 0,
            role: userRole
        };

        onAddUser(newUser);
        resetUserForm();
        setUserDialogOpen(false);
    };

    const handleUpdateUser = () => {
        if (!editingUser) return;

        const updatedUser: User = {
            ...editingUser,
            email: userEmail,
            first_name: userFirstName,
            last_name: userLastName,
            date_joined: userDateJoined,
            leave_date: userLeaveDate || undefined,
            is_active: userIsActive,
            position_id: userPositionId ? parseInt(userPositionId) : 0,
            department_id: userDepartmentId ? parseInt(userDepartmentId) : 0,
            role: userRole
        };

        onUpdateUser(updatedUser);
        resetUserForm();
        setUserDialogOpen(false);
    };

    const handleAssignUser = () => {
        if (!assigningUser || !selectedDeptForAssign) return;

        onAssignToDepartment(
            assigningUser.id,
            parseInt(selectedDeptForAssign),
            assignRole
        );

        setAssigningUser(null);
        setSelectedDeptForAssign('');
        setAssignRole('member');
        setAssignDialogOpen(false);
    };

    const handleAssignMultipleUsers = () => {
        if (!assigningToDept || selectedUsers.length === 0) return;

        onAddUsersToDepartment(selectedUsers, assigningToDept.id);

        setAssigningToDept(null);
        setSelectedUsers([]);
        setAssignMultipleDialogOpen(false);
    };

    const handleSetManager = () => {
        if (!managingDept) return;

        const managerId = selectedManagerId && selectedManagerId !== "no-manager"
            ? parseInt(selectedManagerId)
            : null;

        onSetDepartmentManager(managingDept.id, managerId);

        // Также назначаем пользователю роль manager в команде
        if (managerId) {
            const existingMember = teamMembers.find(
                m => m.userId === managerId && m.departmentId === managingDept.id
            );

            if (existingMember) {
                onAssignToDepartment(managerId, managingDept.id, 'manager');
            } else {
                onAssignToDepartment(managerId, managingDept.id, 'manager');
            }
        }

        setManagingDept(null);
        setSelectedManagerId('');
        setManagerDialogOpen(false);
    };

    const handleEditDepartment = (dept: Department) => {
        setEditingDepartment(dept);
        setDeptName(dept.name);
        setDeptCode(dept.code || '');
        setDeptDescription(dept.description || '');
        setDepartmentDialogOpen(true);
    };

    const handleEditUser = (user: User) => {
        setEditingUser(user);
        setUserEmail(user.email);
        setUserFirstName(user.first_name);
        setUserLastName(user.last_name);
        setUserRole(user.role);
        setUserPositionId(user.position_id.toString());
        setUserDepartmentId(user.department_id.toString());
        setUserIsActive(user.is_active);
        setUserDateJoined(user.date_joined.split('T')[0]);
        setUserLeaveDate(user.leave_date?.split('T')[0] || '');
        setUserDialogOpen(true);
    };

    const handleAssignClick = (user: User) => {
        setAssigningUser(user);
        setAssignDialogOpen(true);
    };

    const handleAddUsersClick = (dept: Department) => {
        setAssigningToDept(dept);
        setAssignMultipleDialogOpen(true);
    };

    const handleSetManagerClick = (dept: Department) => {
        setManagingDept(dept);
        const currentManager = getDepartmentManager(dept.id);
        setSelectedManagerId(currentManager?.id.toString() || 'no-manager');
        setManagerDialogOpen(true);
    };

    const handleRemoveManager = (dept: Department) => {
        onSetDepartmentManager(dept.id, null);
    };

    const handleDeleteDepartment = (id: number) => {
        setDeptToDelete(id);
        setDeleteDeptDialogOpen(true);
    };

    const handleDeleteUser = (id: number) => {
        setUserToDelete(id);
        setDeleteUserDialogOpen(true);
    };

    const confirmDeleteDepartment = () => {
        if (deptToDelete) {
            onDeleteDepartment(deptToDelete);
        }
        setDeleteDeptDialogOpen(false);
        setDeptToDelete(null);
    };

    const confirmDeleteUser = () => {
        if (userToDelete) {
            onDeleteUser(userToDelete);
        }
        setDeleteUserDialogOpen(false);
        setUserToDelete(null);
    };

    const resetDepartmentForm = () => {
        setDeptName('');
        setDeptCode('');
        setDeptDescription('');
        setEditingDepartment(null);
    };

    const resetUserForm = () => {
        setUserEmail('');
        setUserFirstName('');
        setUserLastName('');
        setUserRole('user');
        setUserPositionId('');
        setUserDepartmentId('');
        setUserIsActive(true);
        setUserDateJoined(new Date().toISOString().split('T')[0]);
        setUserLeaveDate('');
        setUserPassword('');
        setEditingUser(null);
    };

    const toggleUserSelection = (userId: number) => {
        setSelectedUsers(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const roleColors: Record<User['role'], string> = {
        user: 'bg-blue-100 text-blue-800',
        manager: 'bg-green-100 text-green-800',
        admin: 'bg-purple-100 text-purple-800'
    };

    const statusColors: Record<'active' | 'inactive', string> = {
        active: 'bg-green-100 text-green-800',
        inactive: 'bg-gray-100 text-gray-800'
    };

    const teamRoleColors: Record<TeamMember['role'], string> = {
        member: 'bg-blue-100 text-blue-800',
        lead: 'bg-yellow-100 text-yellow-800',
        manager: 'bg-green-100 text-green-800'
    };

    // Обработчики с правильными типами
    const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
    };

    const handleDeptNameChange = (e: ChangeEvent<HTMLInputElement>) => {
        setDeptName(e.target.value);
    };

    const handleDeptCodeChange = (e: ChangeEvent<HTMLInputElement>) => {
        setDeptCode(e.target.value);
    };

    const handleDeptDescriptionChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
        setDeptDescription(e.target.value);
    };

    const handleUserEmailChange = (e: ChangeEvent<HTMLInputElement>) => {
        setUserEmail(e.target.value);
    };

    const handleUserFirstNameChange = (e: ChangeEvent<HTMLInputElement>) => {
        setUserFirstName(e.target.value);
    };

    const handleUserLastNameChange = (e: ChangeEvent<HTMLInputElement>) => {
        setUserLastName(e.target.value);
    };

    const handleUserPasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
        setUserPassword(e.target.value);
    };

    const handleUserDateJoinedChange = (e: ChangeEvent<HTMLInputElement>) => {
        setUserDateJoined(e.target.value);
    };

    const handleUserLeaveDateChange = (e: ChangeEvent<HTMLInputElement>) => {
        setUserLeaveDate(e.target.value);
    };

    const handleUserRoleChange = (value: User['role']) => {
        setUserRole(value);
    };

    const handleUserPositionChange = (value: string) => {
        setUserPositionId(value);
    };

    const handleUserDepartmentChange = (value: string) => {
        setUserDepartmentId(value);
    };

    const handleAssignDeptChange = (value: string) => {
        setSelectedDeptForAssign(value);
    };

    const handleAssignRoleChange = (value: TeamMember['role']) => {
        setAssignRole(value);
    };

    const handleManagerChange = (value: string) => {
        setSelectedManagerId(value);
    };

    const handleUserIsActiveChange = (checked: boolean) => {
        setUserIsActive(checked);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Team Management</h2>
                    <p className="text-muted-foreground">Manage departments, positions and user assignments</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search departments, users..."
                            className="pl-10 w-80 bg-background"
                            value={searchQuery}
                            onChange={handleSearchChange}
                        />
                    </div>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid grid-cols-3 w-full max-w-md">
                    <TabsTrigger value="departments" className="flex items-center gap-2">
                        <Building className="w-4 h-4" />
                        Departments
                    </TabsTrigger>
                    <TabsTrigger value="users" className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Users
                    </TabsTrigger>
                    <TabsTrigger value="assignments" className="flex items-center gap-2">
                        <UserCog className="w-4 h-4" />
                        Assignments
                    </TabsTrigger>
                </TabsList>

                {/* Departments Tab */}
                <TabsContent value="departments" className="space-y-4 mt-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                            <div>
                                <CardTitle className="text-xl">Departments</CardTitle>
                                <p className="text-sm text-muted-foreground">
                                    Manage your organization's departments and teams
                                </p>
                            </div>
                            <Button onClick={() => { resetDepartmentForm(); setDepartmentDialogOpen(true); }}>
                                <Plus className="w-4 h-4 mr-2" />
                                Add Department
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {filteredDepartments.length === 0 ? (
                                <div className="text-center py-12 border rounded-lg">
                                    <Building className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                                    <h3 className="text-lg font-medium mb-1">No departments found</h3>
                                    <p className="text-muted-foreground mb-4">
                                        {searchQuery ? 'Try a different search' : 'Get started by creating a department'}
                                    </p>
                                    <Button onClick={() => { resetDepartmentForm(); setDepartmentDialogOpen(true); }}>
                                        <Plus className="w-4 h-4 mr-2" />
                                        Create Department
                                    </Button>
                                </div>
                            ) : (
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-20">ID</TableHead>
                                                <TableHead>Name</TableHead>
                                                <TableHead className="w-32">Code</TableHead>
                                                <TableHead>Manager</TableHead>
                                                <TableHead className="w-32">Team Size</TableHead>
                                                <TableHead className="w-36 text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredDepartments.map(dept => {
                                                const manager = getDepartmentManager(dept.id);
                                                const deptUsers = getDepartmentUsers(dept.id);
                                                const position = manager ? getUserPosition(manager.id) : null;

                                                return (
                                                    <TableRow key={dept.id} className="hover:bg-muted/50">
                                                        <TableCell className="font-mono text-sm">{dept.id}</TableCell>
                                                        <TableCell className="font-medium">{dept.name}</TableCell>
                                                        <TableCell>
                                                            {dept.code ? (
                                                                <Badge variant="outline" className="font-mono">{dept.code}</Badge>
                                                            ) : (
                                                                <span className="text-muted-foreground text-sm">-</span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            {manager ? (
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                                                            <span className="text-sm font-medium text-green-800 dark:text-green-300">
                                                                                {manager.first_name[0]}{manager.last_name[0]}
                                                                            </span>
                                                                        </div>
                                                                        <div>
                                                                            <div className="font-medium text-sm">{manager.first_name} {manager.last_name}</div>
                                                                            <div className="text-xs text-muted-foreground">
                                                                                {position?.name || 'No position'}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-6 w-6 hover:bg-destructive/10 hover:text-destructive"
                                                                        onClick={() => handleRemoveManager(dept)}
                                                                        title="Remove manager"
                                                                    >
                                                                        <X className="w-3 h-3" />
                                                                    </Button>
                                                                </div>
                                                            ) : (
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => handleSetManagerClick(dept)}
                                                                    className="flex items-center gap-1"
                                                                >
                                                                    <Crown className="w-3 h-3" />
                                                                    Set Manager
                                                                </Button>
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center gap-2">
                                                                <Users className="w-4 h-4 text-muted-foreground" />
                                                                <span className="font-medium">{deptUsers.length}</span>
                                                                <span className="text-sm text-muted-foreground">members</span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex gap-1 justify-end">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() => handleEditDepartment(dept)}
                                                                    title="Edit department"
                                                                >
                                                                    <Edit className="w-4 h-4" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() => handleAddUsersClick(dept)}
                                                                    title="Add users to department"
                                                                >
                                                                    <UserPlus className="w-4 h-4" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() => handleSetManagerClick(dept)}
                                                                    title="Set department manager"
                                                                >
                                                                    <Crown className="w-4 h-4" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() => handleDeleteDepartment(dept.id)}
                                                                    title="Delete department"
                                                                    className="hover:bg-destructive/10 hover:text-destructive"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Users Tab */}
                <TabsContent value="users" className="space-y-4 mt-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                            <div>
                                <CardTitle className="text-xl">Users</CardTitle>
                                <p className="text-sm text-muted-foreground">
                                    Manage user accounts and their roles
                                </p>
                            </div>
                            <Button onClick={() => { resetUserForm(); setUserDialogOpen(true); }}>
                                <Plus className="w-4 h-4 mr-2" />
                                Add User
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {filteredUsers.length === 0 ? (
                                <div className="text-center py-12 border rounded-lg">
                                    <Users className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                                    <h3 className="text-lg font-medium mb-1">No users found</h3>
                                    <p className="text-muted-foreground mb-4">
                                        {searchQuery ? 'Try a different search' : 'Get started by creating a user'}
                                    </p>
                                    <Button onClick={() => { resetUserForm(); setUserDialogOpen(true); }}>
                                        <Plus className="w-4 h-4 mr-2" />
                                        Create User
                                    </Button>
                                </div>
                            ) : (
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>User</TableHead>
                                                <TableHead>Contact</TableHead>
                                                <TableHead>Position</TableHead>
                                                <TableHead>Department</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead className="w-24 text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredUsers.map(user => {
                                                const department = departments.find(d => d.id === user.department_id);
                                                const position = positions.find(p => p.id === user.position_id);
                                                const userDepartment = getUserDepartment(user.id);
                                                const userRoleInDept = getUserRoleInDepartment(user.id);

                                                return (
                                                    <TableRow key={user.id} className="hover:bg-muted/50">
                                                        <TableCell>
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                                                    <span className="font-medium text-blue-800 dark:text-blue-300">
                                                                        {user.first_name[0]}{user.last_name[0]}
                                                                    </span>
                                                                </div>
                                                                <div>
                                                                    <div className="font-medium">{user.first_name} {user.last_name}</div>
                                                                    <Badge className={`mt-1 ${roleColors[user.role]}`}>
                                                                        {user.role}
                                                                    </Badge>
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="space-y-1">
                                                                <div className="flex items-center gap-2">
                                                                    <Mail className="w-3 h-3 text-muted-foreground" />
                                                                    <span className="text-sm">{user.email}</span>
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            {position ? (
                                                                <div className="flex items-center gap-2">
                                                                    <Briefcase className="w-3 h-3 text-muted-foreground" />
                                                                    <span>{position.name}</span>
                                                                </div>
                                                            ) : (
                                                                <span className="text-muted-foreground">No position</span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            {department ? (
                                                                <div>
                                                                    <div className="font-medium">{department.name}</div>
                                                                    {userDepartment && userRoleInDept && (
                                                                        <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                                                            <Badge variant="outline" size="sm" className={teamRoleColors[userRoleInDept]}>
                                                                                {userRoleInDept}
                                                                            </Badge>
                                                                            <span>(Team Assignment)</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ) : userDepartment ? (
                                                                <div>
                                                                    <div className="font-medium">{userDepartment.name}</div>
                                                                    {userRoleInDept && (
                                                                        <div className="text-xs text-muted-foreground">
                                                                            <Badge variant="outline" size="sm" className={teamRoleColors[userRoleInDept]}>
                                                                                {userRoleInDept}
                                                                            </Badge>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => handleAssignClick(user)}
                                                                >
                                                                    Assign to Team
                                                                </Button>
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge className={statusColors[user.is_active ? 'active' : 'inactive']}>
                                                                {user.is_active ? 'Active' : 'Inactive'}
                                                            </Badge>
                                                            <div className="text-xs text-muted-foreground mt-1">
                                                                Joined: {new Date(user.date_joined).toLocaleDateString()}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex gap-1 justify-end">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() => handleEditUser(user)}
                                                                    title="Edit user"
                                                                >
                                                                    <Edit className="w-4 h-4" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() => handleDeleteUser(user.id)}
                                                                    title="Delete user"
                                                                    className="hover:bg-destructive/10 hover:text-destructive"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Assignments Tab */}
                <TabsContent value="assignments" className="space-y-4 mt-4">
                    <Card>
                        <CardHeader className="space-y-0 pb-4">
                            <CardTitle className="text-xl">Team Assignments</CardTitle>
                            <p className="text-sm text-muted-foreground">Manage user assignments to departments</p>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Unassigned Users */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-semibold text-lg flex items-center gap-2">
                                            <Users className="w-4 h-4" />
                                            Unassigned Users
                                        </h3>
                                        <Badge variant="outline" className="font-mono">
                                            {getUnassignedUsers().length}
                                        </Badge>
                                    </div>
                                    {getUnassignedUsers().length === 0 ? (
                                        <div className="text-center py-8 border rounded-lg">
                                            <Users className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                                            <p className="text-muted-foreground">All users are assigned to teams</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {getUnassignedUsers().map(user => (
                                                <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                                                            <span className="text-sm font-medium">
                                                                {user.first_name[0]}{user.last_name[0]}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <div className="font-medium">{user.first_name} {user.last_name}</div>
                                                            <div className="text-xs text-muted-foreground">{user.email}</div>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleAssignClick(user)}
                                                    >
                                                        Assign to Team
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Department Teams */}
                                <div className="space-y-4">
                                    <h3 className="font-semibold text-lg flex items-center gap-2">
                                        <Building className="w-4 h-4" />
                                        Department Teams
                                    </h3>
                                    <div className="space-y-4">
                                        {departments.map(dept => {
                                            const deptUsers = getDepartmentUsers(dept.id);
                                            const manager = getDepartmentManager(dept.id);

                                            if (deptUsers.length === 0) {
                                                return (
                                                    <div key={dept.id} className="border rounded-lg p-4">
                                                        <div className="flex items-center justify-between mb-3">
                                                            <div>
                                                                <h4 className="font-semibold">{dept.name}</h4>
                                                                {dept.code && (
                                                                    <p className="text-sm text-muted-foreground">Code: {dept.code}</p>
                                                                )}
                                                            </div>
                                                            <Button
                                                                size="sm"
                                                                onClick={() => handleAddUsersClick(dept)}
                                                            >
                                                                <UserPlus className="w-4 h-4 mr-1" />
                                                                Add Users
                                                            </Button>
                                                        </div>
                                                        <div className="text-center py-6 text-muted-foreground">
                                                            No users assigned to this department
                                                        </div>
                                                    </div>
                                                );
                                            }

                                            return (
                                                <div key={dept.id} className="border rounded-lg p-4">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <div>
                                                            <h4 className="font-semibold">{dept.name}</h4>
                                                            {dept.code && (
                                                                <p className="text-sm text-muted-foreground">Code: {dept.code}</p>
                                                            )}
                                                            {manager && (
                                                                <div className="flex items-center gap-1 mt-1">
                                                                    <Crown className="w-3 h-3 text-yellow-500" />
                                                                    <span className="text-sm text-muted-foreground">
                                                                        Manager: {manager.first_name} {manager.last_name}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Badge variant="outline">{deptUsers.length} members</Badge>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => handleAddUsersClick(dept)}
                                                                title="Add more users"
                                                            >
                                                                <UserPlus className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2">
                                                        {deptUsers.map(user => {
                                                            const memberRole = teamMembers.find(m =>
                                                                m.userId === user.id && m.departmentId === dept.id
                                                            )?.role;
                                                            const position = positions.find(p => p.id === user.position_id);
                                                            const isManager = manager?.id === user.id;

                                                            return (
                                                                <div key={user.id} className={`flex items-center justify-between p-2 hover:bg-muted/50 rounded transition-colors ${isManager ? 'bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-l-yellow-400' : ''}`}>
                                                                    <div className="flex items-center gap-2">
                                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isManager ? 'bg-yellow-100 dark:bg-yellow-900/30' : 'bg-blue-100 dark:bg-blue-900/30'}`}>
                                                                            <span className="text-sm font-medium">
                                                                                {user.first_name[0]}{user.last_name[0]}
                                                                            </span>
                                                                        </div>
                                                                        <div>
                                                                            <div className="font-medium text-sm flex items-center gap-1">
                                                                                {user.first_name} {user.last_name}
                                                                                {isManager && <Crown className="w-3 h-3 text-yellow-500" />}
                                                                            </div>
                                                                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                                                                                {memberRole && (
                                                                                    <Badge variant="outline" size="sm" className={teamRoleColors[memberRole]}>
                                                                                        {memberRole}
                                                                                    </Badge>
                                                                                )}
                                                                                {position?.name}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center gap-1">
                                                                        {!isManager && (
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                onClick={() => onRemoveFromDepartment(user.id, dept.id)}
                                                                                className="hover:bg-destructive/10 hover:text-destructive"
                                                                            >
                                                                                Remove
                                                                            </Button>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Department Dialog */}
            <Dialog open={departmentDialogOpen} onOpenChange={setDepartmentDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            {editingDepartment ? 'Edit Department' : 'Create Department'}
                        </DialogTitle>
                        <DialogDescription>
                            {editingDepartment
                                ? 'Update department information below'
                                : 'Add a new department to your organization'
                            }
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label htmlFor="dept-name">Name *</Label>
                            <Input
                                id="dept-name"
                                value={deptName}
                                onChange={handleDeptNameChange}
                                placeholder="e.g., Engineering"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="dept-code">Code (Optional)</Label>
                                <Input
                                    id="dept-code"
                                    value={deptCode}
                                    onChange={handleDeptCodeChange}
                                    placeholder="e.g., ENG"
                                    maxLength={10}
                                />
                                <p className="text-xs text-muted-foreground">Short department identifier</p>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="dept-description">Description (Optional)</Label>
                            <Textarea
                                id="dept-description"
                                value={deptDescription}
                                onChange={handleDeptDescriptionChange}
                                placeholder="Describe the department's purpose and responsibilities..."
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDepartmentDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={editingDepartment ? handleUpdateDepartment : handleAddDepartment}>
                            {editingDepartment ? 'Update Department' : 'Create Department'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* User Dialog */}
            <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
                <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>
                            {editingUser ? 'Edit User' : 'Create User'}
                        </DialogTitle>
                        <DialogDescription>
                            {editingUser
                                ? 'Update user information below'
                                : 'Create a new user account for your organization'
                            }
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="user-first-name">First Name *</Label>
                                <Input
                                    id="user-first-name"
                                    value={userFirstName}
                                    onChange={handleUserFirstNameChange}
                                    placeholder="John"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="user-last-name">Last Name *</Label>
                                <Input
                                    id="user-last-name"
                                    value={userLastName}
                                    onChange={handleUserLastNameChange}
                                    placeholder="Doe"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="user-email">Email *</Label>
                            <Input
                                id="user-email"
                                type="email"
                                value={userEmail}
                                onChange={handleUserEmailChange}
                                placeholder="john.doe@company.com"
                            />
                        </div>
                        {!editingUser && (
                            <div className="space-y-2">
                                <Label htmlFor="user-password">Password *</Label>
                                <Input
                                    id="user-password"
                                    type="password"
                                    value={userPassword}
                                    onChange={handleUserPasswordChange}
                                    placeholder="Create a secure password"
                                />
                                <p className="text-xs text-muted-foreground">User will be able to change this later</p>
                            </div>
                        )}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="user-role">Role *</Label>
                                <Select value={userRole} onValueChange={handleUserRoleChange}>
                                    <SelectTrigger id="user-role">
                                        <SelectValue placeholder="Select role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="user">User</SelectItem>
                                        <SelectItem value="manager">Manager</SelectItem>
                                        <SelectItem value="admin">Administrator</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="user-position">Position *</Label>
                                <Select value={userPositionId} onValueChange={handleUserPositionChange}>
                                    <SelectTrigger id="user-position">
                                        <SelectValue placeholder="Select position" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {positions.map(position => (
                                            <SelectItem key={position.id} value={position.id.toString()}>
                                                {position.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="user-department">Department *</Label>
                                <Select value={userDepartmentId} onValueChange={handleUserDepartmentChange}>
                                    <SelectTrigger id="user-department">
                                        <SelectValue placeholder="Select department" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {departments.map(dept => (
                                            <SelectItem key={dept.id} value={dept.id.toString()}>
                                                {dept.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="user-date-joined">Date Joined *</Label>
                                <Input
                                    id="user-date-joined"
                                    type="date"
                                    value={userDateJoined}
                                    onChange={handleUserDateJoinedChange}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="user-leave-date">Leave Date (Optional)</Label>
                            <Input
                                id="user-leave-date"
                                type="date"
                                value={userLeaveDate}
                                onChange={handleUserLeaveDateChange}
                            />
                        </div>
                        <div className="flex items-center space-x-2 pt-2">
                            <Switch
                                id="user-active"
                                checked={userIsActive}
                                onCheckedChange={handleUserIsActiveChange}
                            />
                            <Label htmlFor="user-active" className="cursor-pointer">
                                Active user account
                            </Label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setUserDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={editingUser ? handleUpdateUser : handleAddUser}>
                            {editingUser ? 'Update User' : 'Create User'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Assign User Dialog */}
            <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Assign User to Team</DialogTitle>
                        <DialogDescription>
                            Assign {assigningUser?.first_name} {assigningUser?.last_name} to a department team
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label htmlFor="assign-dept">Department *</Label>
                            <Select value={selectedDeptForAssign} onValueChange={handleAssignDeptChange}>
                                <SelectTrigger id="assign-dept">
                                    <SelectValue placeholder="Select a department" />
                                </SelectTrigger>
                                <SelectContent>
                                    {departments.map(dept => (
                                        <SelectItem key={dept.id} value={dept.id.toString()}>
                                            {dept.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="assign-role">Team Role *</Label>
                            <Select value={assignRole} onValueChange={handleAssignRoleChange}>
                                <SelectTrigger id="assign-role">
                                    <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="member">Team Member</SelectItem>
                                    <SelectItem value="lead">Team Lead</SelectItem>
                                    <SelectItem value="manager">Team Manager</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                                Team Managers can manage team assignments and view team reports
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleAssignUser} disabled={!selectedDeptForAssign}>
                            Assign to Team
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Add Multiple Users to Department Dialog */}
            <Dialog open={assignMultipleDialogOpen} onOpenChange={setAssignMultipleDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Add Users to Team</DialogTitle>
                        <DialogDescription>
                            Select users to add to the {assigningToDept?.name} department team
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="border rounded-lg p-4 max-h-96 overflow-y-auto">
                            {assigningToDept && getAvailableUsersForDepartment(assigningToDept.id).length === 0 ? (
                                <div className="text-center py-8">
                                    <Users className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                                    <p className="text-muted-foreground">No available users to add to this department</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {assigningToDept && getAvailableUsersForDepartment(assigningToDept.id).map(user => (
                                        <div
                                            key={user.id}
                                            className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${selectedUsers.includes(user.id) ? 'bg-primary/5 border-primary' : 'hover:bg-muted/50'
                                                }`}
                                            onClick={() => toggleUserSelection(user.id)}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                                    <span className="text-sm font-medium">
                                                        {user.first_name[0]}{user.last_name[0]}
                                                    </span>
                                                </div>
                                                <div>
                                                    <div className="font-medium">{user.first_name} {user.last_name}</div>
                                                    <div className="text-sm text-muted-foreground">{user.email}</div>
                                                </div>
                                            </div>
                                            <div className={`text-sm ${selectedUsers.includes(user.id) ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                                                {selectedUsers.includes(user.id) ? 'Selected' : 'Click to select'}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        {selectedUsers.length > 0 && (
                            <div className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
                                <div className="flex items-center justify-between">
                                    <span>Selected {selectedUsers.length} user{selectedUsers.length !== 1 ? 's' : ''}</span>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setSelectedUsers([])}
                                        className="h-7 text-xs"
                                    >
                                        Clear all
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAssignMultipleDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleAssignMultipleUsers}
                            disabled={selectedUsers.length === 0}
                        >
                            Add {selectedUsers.length > 0 ? `${selectedUsers.length} Users` : 'Users'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Set Manager Dialog */}
            <Dialog open={managerDialogOpen} onOpenChange={setManagerDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Set Department Manager</DialogTitle>
                        <DialogDescription>
                            Assign a manager for the {managingDept?.name} department
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label htmlFor="select-manager">Select Manager</Label>
                            <Select value={selectedManagerId} onValueChange={handleManagerChange}>
                                <SelectTrigger id="select-manager">
                                    <SelectValue placeholder="Select a manager" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="no-manager">No Manager</SelectItem>
                                    {managingDept && getDepartmentUsers(managingDept.id).map(user => (
                                        <SelectItem key={user.id} value={user.id.toString()}>
                                            {user.first_name} {user.last_name} ({user.email})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        {selectedManagerId && selectedManagerId !== "no-manager" && (
                            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                <p className="text-sm text-blue-700 dark:text-blue-300">
                                    The selected user will be assigned as the team manager and will receive manager permissions for this department.
                                </p>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setManagerDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSetManager}>
                            {selectedManagerId === "no-manager" ? 'Remove Manager' : 'Set as Manager'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Department Dialog */}
            <AlertDialog open={deleteDeptDialogOpen} onOpenChange={setDeleteDeptDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Department</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the department and remove all team assignments.
                            Users assigned to this department team will become unassigned.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDeleteDepartment}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Delete Department
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Delete User Dialog */}
            <AlertDialog open={deleteUserDialogOpen} onOpenChange={setDeleteUserDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete User</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the user account and remove all their:
                            <ul className="list-disc list-inside mt-2 text-sm">
                                <li>Team assignments</li>
                                <li>Time entries</li>
                                <li>Reports and data</li>
                            </ul>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDeleteUser}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Delete User
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}