import React, { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Edit, Trash2, Plus, User } from 'lucide-react';
import { getRoleBadgeVariant } from '../../const/consts';
import { User as UserType, Position, Department } from '../../types/types';
import { useDeleteUsers, useGetUserGrades, useGetUsers } from '../../hooks/useUsers';
import { useUserStore } from '../../store/UsersStore';
import { useGetDepartmentRoles, useGetDepartments } from '../../hooks/useDepartments';
import { useGetCountries } from '../../hooks/useCountries';
import { useGetPositions } from '../../hooks/usePosition';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '../ui/alert-dialog';

interface UsersTableProps {
    positions: Position[];
    departments: Department[];
    onEdit: (user: UserType) => void;
    onAdd: () => void;
}

export function UsersTable({
    positions,
    departments,
    onEdit,
    onAdd
}: UsersTableProps) {
    const { mutate: getUsers } = useGetUsers();
    const { mutate: getDepartmentRoles } = useGetDepartmentRoles();
    const { mutate: getUserGrades } = useGetUserGrades();
    const { mutate: getCountries } = useGetCountries();
    const { mutate: getDepartments } = useGetDepartments();
    const { mutate: getPositions } = useGetPositions();
    const { mutate: deleteUser } = useDeleteUsers();
    const store_users = useUserStore((state) => state.users);

    // Состояние для попапа подтверждения удаления
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<{
        id: number;
        name: string;
    } | null>(null);

    useEffect(() => {
        getUsers();
        getDepartmentRoles();
        getUserGrades();
        getCountries();
        getDepartments();
        getPositions();
    }, []);

    // Используем пользователей из стора, проверяем на null/undefined
    const users = store_users || [];

    // Функция для открытия попапа удаления
    const handleDeleteClick = (user: UserType) => {
        setUserToDelete({
            id: user.id,
            name: `${user.first_name} ${user.last_name}`
        });
        setDeleteDialogOpen(true);
    };

    // Функция для подтверждения удаления
    const handleConfirmDelete = () => {
        if (userToDelete) {
            deleteUser(userToDelete.id, {
                onSuccess: () => {
                    // После успешного удаления обновляем список пользователей
                    getUsers();
                    // Закрываем попап
                    setDeleteDialogOpen(false);
                    setUserToDelete(null);
                },
                onError: (error) => {
                    console.error('Error deleting user:', error);
                    // Можно добавить уведомление об ошибке
                    setDeleteDialogOpen(false);
                    setUserToDelete(null);
                }
            });
        }
    };

    // Функция для отмены удаления
    const handleCancelDelete = () => {
        setDeleteDialogOpen(false);
        setUserToDelete(null);
    };

    // Форматирование даты
    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'Not set';
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch {
            return dateString;
        }
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
                            <TableHead>Grade</TableHead>
                            <TableHead>Country</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Date Joined</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="w-24">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={10} className="text-center text-slate-500 py-8">
                                    {store_users === null ? 'Loading users...' : 'No users found. Click "Add User" to create your first user.'}
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
                                    <TableCell>
                                        <span className="text-sm">
                                            {user.position || 'Not assigned'}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-sm">
                                            {user.department || 'Not assigned'}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-sm">
                                            {user.grade || '-'}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-sm">
                                            {user?.country || '-'}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={getRoleBadgeVariant(user.role)}>
                                            {user.role || 'Not assigned'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm">{formatDate(user.date_joined)}</div>
                                        {user.date_left && (
                                            <div className="text-xs text-red-600">
                                                Left: {formatDate(user.date_left)}
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={user.is_active ? 'default' : 'outline'}
                                            className={`${user.is_active
                                                ? 'bg-green-100 text-green-800 hover:bg-green-100'
                                                : 'bg-gray-100 text-gray-800 hover:bg-gray-100'}`}
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
                                                onClick={() => handleDeleteClick(user)}
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

            {/* Попап подтверждения удаления */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            {userToDelete && (
                                <>
                                    This action cannot be undone. This will permanently delete the user{" "}
                                    <span className="font-semibold text-red-600">{userToDelete.name}</span>{" "}
                                    from the system.
                                    <div className="mt-3 p-3 bg-red-50 rounded-md">
                                        <p className="text-sm text-red-700 font-medium">
                                            ⚠️ Warning: All data associated with this user will be lost.
                                        </p>
                                    </div>
                                </>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={handleCancelDelete}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmDelete}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            Delete User
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}