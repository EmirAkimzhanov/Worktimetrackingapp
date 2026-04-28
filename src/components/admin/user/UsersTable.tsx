import React, { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Edit, Trash2, Plus, User, ChevronLeft, ChevronRight } from 'lucide-react';
import { getRoleBadgeVariant } from '../../../const/consts';
import { User as UserType, Position, Department } from '../../../types/types';
import { useDeleteUsers, useGetUserGrades, useGetUsers } from '../../../hooks/useUsers';
import { useUserStore } from '../../../store/UsersStore';
import { useGetDepartmentRoles, useGetDepartments } from '../../../hooks/useDepartments';
import { useGetCountries } from '../../../hooks/useCountries';
import { useGetPositions } from '../../../hooks/usePosition';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '../../ui/alert-dialog';

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
    const { mutate: getUsers, isPending: isLoadingUsers } = useGetUsers();
    const { mutate: getDepartmentRoles } = useGetDepartmentRoles();
    const { mutate: getUserGrades } = useGetUserGrades();
    const { mutate: getCountries } = useGetCountries();
    const { mutate: getDepartments } = useGetDepartments();
    const { mutate: getPositions } = useGetPositions();
    const { mutate: deleteUser } = useDeleteUsers();

    const store_users = useUserStore((state) => state.users);
    const usersPagination = useUserStore((state) => state.usersPagination);

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<{
        id: number;
        name: string;
    } | null>(null);

    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 30;

    useEffect(() => {
        getDepartmentRoles();
        getUserGrades();
        getCountries();
        getDepartments();
        getPositions();
        loadUsers(1);
    }, []);

    const loadUsers = (page: number) => {
        getUsers({ page, page_size: pageSize });
        setCurrentPage(page);
    };

    // Проверяем, что users это массив
    const users = Array.isArray(store_users) ? store_users : [];
    const totalCount = usersPagination?.count || 0;
    const hasNext = !!usersPagination?.next;
    const hasPrev = !!usersPagination?.previous;

    const handleNextPage = () => {
        if (hasNext) {
            loadUsers(currentPage + 1);
        }
    };

    const handlePrevPage = () => {
        if (hasPrev) {
            loadUsers(currentPage - 1);
        }
    };

    const handleDeleteClick = (user: UserType) => {
        setUserToDelete({
            id: user.id,
            name: `${user.first_name} ${user.last_name}`
        });
        setDeleteDialogOpen(true);
    };

    const handleConfirmDelete = () => {
        if (userToDelete) {
            deleteUser(userToDelete.id.toString(), {
                onSuccess: () => {
                    loadUsers(currentPage);
                    setDeleteDialogOpen(false);
                    setUserToDelete(null);
                },
                onError: (error) => {
                    console.error('Error deleting user:', error);
                    setDeleteDialogOpen(false);
                    setUserToDelete(null);
                }
            });
        }
    };

    const handleCancelDelete = () => {
        setDeleteDialogOpen(false);
        setUserToDelete(null);
    };

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

    if (isLoadingUsers && users.length === 0) {
        return (
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Users</h2>
                        <p className="text-muted-foreground">Manage all users in the organization</p>
                    </div>
                    <Button onClick={onAdd} size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Add User
                    </Button>
                </div>
                <div className="rounded-md border p-8 text-center text-slate-500">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    Loading users...
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Users</h2>
                    <p className="text-muted-foreground">
                        Manage all users in the organization
                        {totalCount > 0 && ` • Total: ${totalCount} users`}
                    </p>
                </div>
                <Button onClick={onAdd} size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add User
                </Button>
            </div>

            <div className="rounded-md border overflow-x-auto">
                <Table className="min-w-[1200px] table-fixed">
                    <colgroup>
                        <col style={{ width: '150px' }} />
                        <col style={{ width: '200px' }} />
                        <col style={{ width: '100px' }} />
                        <col style={{ width: '100px' }} />
                        <col style={{ width: '120px' }} />
                        <col style={{ width: '80px' }} />
                        <col style={{ width: '80px' }} />
                        <col style={{ width: '100px' }} />
                        <col style={{ width: '100px' }} />
                        <col style={{ width: '80px' }} />
                        <col style={{ width: '70px' }} />
                    </colgroup>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Position</TableHead>
                            <TableHead>Department</TableHead>
                            <TableHead>Department Role</TableHead>
                            <TableHead>Grade</TableHead>
                            <TableHead>Country</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Date Joined</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.length === 0 && !isLoadingUsers ? (
                            <TableRow>
                                <TableCell colSpan={11} className="text-center text-slate-500 py-8">
                                    No users found. Click "Add User" to create your first user.
                                </TableCell>
                            </TableRow>
                        ) : (
                            users.map((user: any) => (
                                <TableRow key={user.id} className="hover:bg-slate-50">
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <User className="w-4 h-4 text-slate-500 flex-shrink-0" />
                                            <span className="truncate">
                                                {user.first_name} {user.last_name}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-sm truncate block max-w-[180px]">
                                            {user.email}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-sm truncate block max-w-[90px]">
                                            {user.position || 'Not assigned'}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-sm truncate block max-w-[90px]">
                                            {user.department || 'Not assigned'}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 truncate max-w-[110px]">
                                            {user.department_role || 'Not assigned'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-sm">{user.grade || '-'}</span>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-sm">{user.country || '-'}</span>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={getRoleBadgeVariant(user.role)}>
                                            {user.role === 'admin' ? 'Admin' : user.role === 'user' ? 'User' : user.role || 'Not assigned'}
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
                                                className="h-7 w-7"
                                                onClick={() => onEdit(user)}
                                            >
                                                <Edit className="w-3.5 h-3.5" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7"
                                                onClick={() => handleDeleteClick(user)}
                                            >
                                                <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {(hasNext || hasPrev) && (
                <div className="flex justify-between items-center pt-4">
                    <div className="text-xs text-muted-foreground">
                        Showing {users.length} of {totalCount} users
                    </div>
                    <div className="flex gap-2 items-center">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handlePrevPage}
                            disabled={!hasPrev || isLoadingUsers}
                        >
                            <ChevronLeft size={14} className="mr-1" />
                            Previous
                        </Button>
                        <span className="text-sm text-muted-foreground px-2">
                            Page {currentPage}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleNextPage}
                            disabled={!hasNext || isLoadingUsers}
                        >
                            Next
                            <ChevronRight size={14} className="ml-1" />
                        </Button>
                    </div>
                </div>
            )}

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            {userToDelete && (
                                <>
                                    This action cannot be undone. This will permanently delete the user{' '}
                                    <span className="font-semibold text-red-600">{userToDelete.name}</span>{' '}
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