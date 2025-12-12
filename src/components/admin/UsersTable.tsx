import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Edit, Trash2 } from 'lucide-react';
import { getRoleBadgeVariant } from '../../const/consts';
import { User, Position, Department } from '../../types/types';

interface UsersTableProps {
    users: User[];
    positions: Position[];
    departments: Department[];
    onEdit: (user: User) => void;
    onDelete: (id: number) => void;
}

export function UsersTable({ users, positions, departments, onEdit, onDelete }: UsersTableProps) {
    const getPositionName = (positionId: number) => {
        return positions.find(p => p.id === positionId)?.name || 'Unknown';
    };

    const getDepartmentName = (departmentId: number) => {
        return departments.find(d => d.id === departmentId)?.name || 'Unknown';
    };

    return (
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
                                No users found
                            </TableCell>
                        </TableRow>
                    ) : (
                        users.map(user => (
                            <TableRow key={user.id} className="hover:bg-slate-50">
                                <TableCell className="font-medium">{user.first_name} {user.last_name}</TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>{getPositionName(user.position_id)}</TableCell>
                                <TableCell>{getDepartmentName(user.department_id)}</TableCell>
                                <TableCell>
                                    <Badge variant={getRoleBadgeVariant(user.role)}>
                                        {user.role}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    {user.date_joined}
                                    {user.leave_date && (
                                        <div className="text-xs text-red-600">Left: {user.leave_date}</div>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <Badge variant={user.is_active ? 'default' : 'outline'} className={user.is_active ? 'bg-green-100 text-green-800' : ''}>
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
    );
}