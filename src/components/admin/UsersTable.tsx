import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Edit, Trash2, Plus, User } from 'lucide-react';
import { getRoleBadgeVariant } from '../../const/consts';
import { User as UserType, Position, Department } from '../../types/types';

interface UsersTableProps {
    users: UserType[];
    positions: Position[];
    departments: Department[];
    onEdit: (user: UserType) => void;
    onDelete: (id: number) => void;
    onAdd: () => void; // Добавлен новый проп
}

export function UsersTable({ users, positions, departments, onEdit, onDelete, onAdd }: UsersTableProps) {
    const getPositionName = (positionId: number) => {
        return positions.find(p => p.id === positionId)?.name || 'Unknown';
    };

    const getDepartmentName = (departmentId: number) => {
        return departments.find(d => d.id === departmentId)?.name || 'Unknown';
    };

    return (
        <div className="space-y-4">
            {/* Заголовок с кнопкой Add */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Users</h2>
                    <p className="text-muted-foreground">Manage all users in the organization</p>
                </div>
                <Button onClick={onAdd} size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add User
                </Button>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Position</TableHead>
                            <TableHead>Department</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Date Joined</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="w-24">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center text-slate-500 py-8">
                                    No users found. Click "Add User" to create your first user.
                                </TableCell>
                            </TableRow>
                        ) : (
                            users.map(user => (
                                <TableRow key={user.id} className="hover:bg-slate-50">
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            <User className="w-4 h-4 text-slate-500" />
                                            {user.first_name} {user.last_name}
                                        </div>
                                    </TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>{getPositionName(user.position_id)}</TableCell>
                                    <TableCell>{getDepartmentName(user.department_id)}</TableCell>
                                    <TableCell>
                                        <Badge variant={getRoleBadgeVariant(user.role)}>
                                            {user.role}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm">{user.date_joined}</div>
                                        {user.leave_date && (
                                            <div className="text-xs text-red-600">Left: {user.leave_date}</div>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={user.is_active ? 'default' : 'outline'}
                                            className={`${user.is_active ? 'bg-green-100 text-green-800 hover:bg-green-100' : 'bg-gray-100 text-gray-800 hover:bg-gray-100'}`}
                                        >
                                            {user.is_active ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => onEdit(user)}
                                            >
                                                <Edit className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => onDelete(user.id)}
                                            >
                                                <Trash2 className="w-4 h-4 text-red-500" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}