import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Input } from '../../ui/input';
import { Edit, Trash2, Plus, User, ChevronLeft, ChevronRight, Search, X, Download } from 'lucide-react';
import { getDeptRoleBadgeVariant, getRoleBadgeVariant } from '../../../const/consts';
import { User as UserType, Position, Department } from '../../../types/types';
import { useDeleteUsers, useGetUserGrades, useGetUsers, useExportUsersExcel } from '../../../hooks/useUsers';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../../ui/select';
import { UserDialog } from './UserDialog';
import { UserFormData } from '../../../types/types';

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}

interface UsersTableProps {
    positions: Position[];
    departments: Department[];
}

interface Filters {
    first_name: string;
    last_name: string;
    email: string;
    position_name: string;
    department_name: string;
    department_role_name: string;
    grade_name: string;
    country_code: string;
    role_name: string;
    is_active: string;
}

type SortOption = {
    value: string;
    label: string;
};

const sortOptions: SortOption[] = [
    { value: 'first_name', label: 'First Name (A-Z)' },
    { value: '-first_name', label: 'First Name (Z-A)' },
    { value: 'last_name', label: 'Last Name (A-Z)' },
    { value: '-last_name', label: 'Last Name (Z-A)' },
    { value: 'email', label: 'Email (A-Z)' },
    { value: '-email', label: 'Email (Z-A)' },
    { value: 'position_name', label: 'Position (A-Z)' },
    { value: '-position_name', label: 'Position (Z-A)' },
    { value: 'department_name', label: 'Department (A-Z)' },
    { value: '-department_name', label: 'Department (Z-A)' },
    { value: 'department_role_name', label: 'Department Role (A-Z)' },
    { value: '-department_role_name', label: 'Department Role (Z-A)' },
    { value: 'grade_name', label: 'Grade (A-Z)' },
    { value: '-grade_name', label: 'Grade (Z-A)' },
    { value: 'country_code', label: 'Country (A-Z)' },
    { value: '-country_code', label: 'Country (Z-A)' },
    { value: 'role_name', label: 'Role (A-Z)' },
    { value: '-role_name', label: 'Role (Z-A)' },
    { value: 'date_joined', label: 'Date Joined (Oldest first)' },
    { value: '-date_joined', label: 'Date Joined (Newest first)' },
    { value: 'is_active', label: 'Status (Active first)' },
    { value: '-is_active', label: 'Status (Inactive first)' },
];

export function UsersTable({
    positions,
    departments,
}: UsersTableProps) {
    const { mutate: getUsers, isPending: isLoadingUsers } = useGetUsers();
    const { mutate: getDepartmentRoles } = useGetDepartmentRoles();
    const { mutate: getUserGrades } = useGetUserGrades();
    const { mutate: getCountries } = useGetCountries();
    const { mutate: getDepartments } = useGetDepartments();
    const { mutate: getPositions } = useGetPositions();
    const { mutate: deleteUser } = useDeleteUsers();
    const { mutate: exportUsers, isPending: isExporting } = useExportUsersExcel();

    const store_users = useUserStore((state) => state.users);
    const usersPagination = useUserStore((state) => state.usersPagination);
    const store_countries = useUserStore((state) => state.countries);
    const store_department_roles = useUserStore((state) => state.department_roles);
    const store_positions = useUserStore((state) => state.positions);
    const store_departments = useUserStore((state) => state.departments);

    // Состояния для диалога пользователя
    const [userDialogOpen, setUserDialogOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<UserType | null>(null);
    const [userForm, setUserForm] = useState<UserFormData>({
        first_name: '',
        last_name: '',
        email: '',
        position_id: undefined,
        department_id: undefined,
        department_role: '',
        grade_id: undefined,
        country_id: undefined,
        role: 'user',
        is_active: true,
        date_joined: new Date().toISOString().split('T')[0],
        date_left: '',
    });

    // ✅ Безопасное преобразование departments в массив с фильтрацией null
    const departmentsArray = useMemo(() => {
        if (!store_departments) return [];
        if (Array.isArray(store_departments)) return store_departments.filter(d => d && d !== null);
        if (typeof store_departments === 'object') return Object.values(store_departments).filter(d => d && d !== null);
        return [];
    }, [store_departments]);

    // ✅ Безопасное преобразование positions в массив с фильтрацией null
    const positionsArray = useMemo(() => {
        if (!store_positions) return [];
        if (Array.isArray(store_positions)) return store_positions.filter(p => p && p !== null);
        if (typeof store_positions === 'object') return Object.values(store_positions).filter(p => p && p !== null);
        return [];
    }, [store_positions]);

    // ✅ Безопасное преобразование department_roles в массив с фильтрацией null
    const departmentRolesArray = useMemo(() => {
        if (!store_department_roles) return [];
        if (Array.isArray(store_department_roles)) return store_department_roles.filter(r => r && r !== null);
        if (typeof store_department_roles === 'object') return Object.values(store_department_roles).filter(r => r && r !== null);
        return [];
    }, [store_department_roles]);

    // ✅ Безопасное преобразование countries в массив с фильтрацией null
    const countriesArray = useMemo(() => {
        if (!store_countries) return [];
        if (Array.isArray(store_countries)) return store_countries.filter(c => c && c !== null);
        if (typeof store_countries === 'object') return Object.values(store_countries).filter(c => c && c !== null);
        return [];
    }, [store_countries]);

    const store_user_grades = useUserStore((state) => state.userGrades);

    // ✅ Безопасное преобразование user_grades в массив с фильтрацией null
    const userGradesArray = useMemo(() => {
        if (!store_user_grades) return [];
        if (Array.isArray(store_user_grades)) return store_user_grades.filter(g => g && g !== null);
        if (typeof store_user_grades === 'object') return Object.values(store_user_grades).filter(g => g && g !== null);
        return [];
    }, [store_user_grades]);

    // Вытаскиваем все грейды из позиций
    const allGradesFromPositions = useMemo(() => {
        const grades: any[] = [];
        if (positionsArray.length > 0) {
            positionsArray.forEach((position: any) => {
                if (position.grades && Array.isArray(position.grades)) {
                    grades.push(...position.grades.filter(g => g && g !== null));
                }
            });
        }
        return grades;
    }, [positionsArray]);

    const availableGrades = userGradesArray.length > 0 ? userGradesArray : allGradesFromPositions;

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<{
        id: number;
        name: string;
    } | null>(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [ordering, setOrdering] = useState<string>('-date_joined');
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    const [localFilters, setLocalFilters] = useState<Filters>({
        first_name: '',
        last_name: '',
        email: '',
        position_name: '',
        department_name: '',
        department_role_name: '',
        grade_name: '',
        country_code: '',
        role_name: '',
        is_active: '',
    });

    const debouncedFirstName = useDebounce(localFilters.first_name, 500);
    const debouncedLastName = useDebounce(localFilters.last_name, 500);
    const debouncedEmail = useDebounce(localFilters.email, 500);
    const debouncedPosition = useDebounce(localFilters.position_name, 300);
    const debouncedDepartment = useDebounce(localFilters.department_name, 300);
    const debouncedDepartmentRole = useDebounce(localFilters.department_role_name, 300);
    const debouncedGrade = useDebounce(localFilters.grade_name, 300);
    const debouncedCountry = useDebounce(localFilters.country_code, 300);
    const debouncedRole = useDebounce(localFilters.role_name, 300);

    const pageSize = 30;

    useEffect(() => {
        getDepartmentRoles();
        getUserGrades();
        getCountries();
        getDepartments();
        getPositions();
        loadUsers(1);
    }, []);

    // Функция для получения текущих параметров фильтрации
    const getCurrentFilterParams = useCallback((includePagination: boolean = false) => {
        const params: any = {
            ordering: ordering,
        };

        if (debouncedFirstName && debouncedFirstName.trim()) params.first_name = debouncedFirstName;
        if (debouncedLastName && debouncedLastName.trim()) params.last_name = debouncedLastName;
        if (debouncedEmail && debouncedEmail.trim()) params.email = debouncedEmail;
        if (debouncedPosition && debouncedPosition.trim()) params.position_name = debouncedPosition;
        if (debouncedDepartment && debouncedDepartment.trim()) params.department_name = debouncedDepartment;
        if (debouncedDepartmentRole && debouncedDepartmentRole.trim()) params.department_role_name = debouncedDepartmentRole;
        if (debouncedGrade && debouncedGrade.trim()) params.grade_name = debouncedGrade;
        if (debouncedCountry && debouncedCountry.trim()) params.country_code = debouncedCountry;
        if (debouncedRole && debouncedRole.trim()) params.role_name = debouncedRole;
        if (localFilters.is_active && localFilters.is_active !== 'all') params.is_active = localFilters.is_active;

        if (includePagination) {
            params.page = currentPage;
            params.page_size = pageSize;
        }

        return params;
    }, [debouncedFirstName, debouncedLastName, debouncedEmail, debouncedPosition, debouncedDepartment, debouncedDepartmentRole, debouncedGrade, debouncedCountry, debouncedRole, localFilters.is_active, ordering, currentPage, pageSize]);

    const loadUsers = useCallback((page: number) => {
        const params = getCurrentFilterParams(true);
        params.page = page;

        console.log('📦 Loading users with params:', params);
        getUsers(params);
        setCurrentPage(page);
    }, [getCurrentFilterParams, getUsers]);

    useEffect(() => {
        if (!isInitialLoad) {
            loadUsers(1);
        } else {
            setIsInitialLoad(false);
            loadUsers(1);
        }
    }, [debouncedFirstName, debouncedLastName, debouncedEmail, debouncedPosition, debouncedDepartment, debouncedDepartmentRole, debouncedGrade, debouncedCountry, debouncedRole, localFilters.is_active, ordering]);

    // Функция для экспорта в Excel
    const handleExportExcel = () => {
        const filterParams = getCurrentFilterParams(false);
        console.log('📊 Exporting users with params:', filterParams);
        exportUsers(filterParams);
    };

    const handleFilterChange = (key: keyof Filters, value: string) => {
        setLocalFilters(prev => ({ ...prev, [key]: value }));
    };

    const clearFilters = () => {
        setLocalFilters({
            first_name: '',
            last_name: '',
            email: '',
            position_name: '',
            department_name: '',
            department_role_name: '',
            grade_name: '',
            country_code: '',
            role_name: '',
            is_active: '',
        });
        setCurrentPage(1);
    };

    // Обработчики для диалога пользователя
    const handleAddUser = () => {
        setEditingUser(null);
        setUserForm({
            first_name: '',
            last_name: '',
            email: '',
            position_id: undefined,
            department_id: undefined,
            department_role: '',
            grade_id: undefined,
            country_id: undefined,
            role: 'user',
            is_active: true,
            date_joined: new Date().toISOString().split('T')[0],
            date_left: '',
        });
        setUserDialogOpen(true);
    };

    const handleEditUser = (user: UserType) => {
        setEditingUser(user);
        setUserDialogOpen(true);
    };

    const handleCloseUserDialog = () => {
        setUserDialogOpen(false);
        setEditingUser(null);
    };

    const handleUserSaved = () => {
        loadUsers(currentPage);
    };

    const users = Array.isArray(store_users) ? store_users : [];
    const totalCount = usersPagination?.count || 0;
    const totalPages = Math.ceil(totalCount / pageSize);
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

    const handleGoToPage = (page: number) => {
        if (page >= 1 && page <= totalPages && page !== currentPage) {
            loadUsers(page);
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

    const renderPageNumbers = () => {
        const pages = [];
        const maxVisiblePages = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        if (startPage > 1) {
            pages.push(
                <Button
                    key="1"
                    variant="outline"
                    size="sm"
                    onClick={() => handleGoToPage(1)}
                    disabled={isLoadingUsers}
                    className="min-w-[40px] hidden sm:inline-flex"
                >
                    1
                </Button>
            );
            if (startPage > 2) {
                pages.push(
                    <span key="ellipsis1" className="px-1 text-muted-foreground hidden sm:inline">
                        ...
                    </span>
                );
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            pages.push(
                <Button
                    key={i}
                    variant={currentPage === i ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleGoToPage(i)}
                    disabled={isLoadingUsers}
                    className="min-w-[40px]"
                >
                    {i}
                </Button>
            );
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                pages.push(
                    <span key="ellipsis2" className="px-1 text-muted-foreground hidden sm:inline">
                        ...
                    </span>
                );
            }
            pages.push(
                <Button
                    key={totalPages}
                    variant="outline"
                    size="sm"
                    onClick={() => handleGoToPage(totalPages)}
                    disabled={isLoadingUsers}
                    className="min-w-[40px] hidden sm:inline-flex"
                >
                    {totalPages}
                </Button>
            );
        }

        return pages;
    };

    const activeFiltersCount = Object.values(localFilters).filter(v => v && v !== '' && v !== 'all').length;

    if (isLoadingUsers && users.length === 0 && isInitialLoad) {
        return (
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Users</h2>
                        <p className="text-muted-foreground">Manage all users in the organization</p>
                    </div>
                    <Button onClick={handleAddUser} size="sm">
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
        <>
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Users</h2>
                        <p className="text-muted-foreground">
                            Manage all users in the organization
                            {totalCount > 0 && ` • Total: ${totalCount} users`}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            onClick={handleExportExcel}
                            size="sm"
                            variant="outline"
                            disabled={isExporting || isLoadingUsers}
                        >
                            <Download className="w-4 h-4 mr-2" />
                            {isExporting ? 'Exporting...' : 'Export to Excel'}
                        </Button>
                        <Button onClick={handleAddUser} size="sm">
                            <Plus className="w-4 h-4 mr-2" />
                            Add User
                        </Button>
                    </div>
                </div>

                {/* Filters Row */}
                <div className="overflow-x-auto">
                    <div className="flex items-center gap-2 min-w-max">
                        {/* Поиск по имени */}
                        <div className="relative w-[100px]">
                            <Input
                                placeholder="First name"
                                value={localFilters.first_name}
                                onChange={(e) => handleFilterChange('first_name', e.target.value)}
                                className="text-xs pl-7 h-7"
                                autoComplete="off"
                            />
                        </div>

                        {/* Поиск по фамилии */}
                        <div className="relative w-[100px]">
                            <Input
                                placeholder="Last name"
                                value={localFilters.last_name}
                                onChange={(e) => handleFilterChange('last_name', e.target.value)}
                                className="text-xs pl-7 h-7"
                                autoComplete="off"
                            />
                        </div>

                        {/* Поиск по email */}
                        <div className="relative w-[150px]">
                            <Input
                                placeholder="Email"
                                value={localFilters.email}
                                onChange={(e) => handleFilterChange('email', e.target.value)}
                                className="text-xs pl-7 h-7"
                                autoComplete="off"
                            />
                        </div>

                        {/* Position */}
                        <Select
                            value={localFilters.position_name || "all"}
                            onValueChange={(value) => handleFilterChange('position_name', value === "all" ? "" : value)}
                        >
                            <SelectTrigger className="h-7 w-[110px] text-xs">
                                <SelectValue placeholder="Position" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Positions</SelectItem>
                                {positionsArray.map((pos: any, idx: number) => {
                                    if (!pos || pos === null) return null;
                                    return (
                                        <SelectItem key={pos.id || idx} value={pos.name || String(pos.id)}>
                                            {pos.name || 'Unknown'}
                                        </SelectItem>
                                    );
                                }).filter(Boolean)}
                            </SelectContent>
                        </Select>

                        {/* Department */}
                        <Select
                            value={localFilters.department_name || "all"}
                            onValueChange={(value) => handleFilterChange('department_name', value === "all" ? "" : value)}
                        >
                            <SelectTrigger className="h-7 w-[110px] text-xs">
                                <SelectValue placeholder="Department" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Depts</SelectItem>
                                {departmentsArray.map((dept: any, idx: number) => {
                                    if (!dept || dept === null) return null;
                                    return (
                                        <SelectItem key={dept.id || idx} value={dept.name || String(dept.id)}>
                                            {dept.name || 'Unknown'}
                                        </SelectItem>
                                    );
                                }).filter(Boolean)}
                            </SelectContent>
                        </Select>

                        {/* Department Role */}
                        <Select
                            value={localFilters.department_role_name || "all"}
                            onValueChange={(value) => handleFilterChange('department_role_name', value === "all" ? "" : value)}
                        >
                            <SelectTrigger className="h-7 w-[110px] text-xs">
                                <SelectValue placeholder="Dept Role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Roles</SelectItem>
                                {departmentRolesArray.map((role: any, idx: number) => {
                                    if (!role || role === null) return null;
                                    return (
                                        <SelectItem key={role.id || idx} value={role.name || String(role.id)}>
                                            {role.display_name || role.name || 'Unknown'}
                                        </SelectItem>
                                    );
                                }).filter(Boolean)}
                            </SelectContent>
                        </Select>

                        {/* Grade */}
                        <Select
                            value={localFilters.grade_name || "all"}
                            onValueChange={(value) => handleFilterChange('grade_name', value === "all" ? "" : value)}
                        >
                            <SelectTrigger className="h-7 w-[100px] text-xs">
                                <SelectValue placeholder="Grade" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Grades</SelectItem>
                                {availableGrades.map((grade: any, idx: number) => {
                                    if (!grade || grade === null) return null;
                                    return (
                                        <SelectItem key={grade.id || idx} value={grade.name || String(grade.id)}>
                                            {grade.name || 'Unknown'}
                                        </SelectItem>
                                    );
                                }).filter(Boolean)}
                            </SelectContent>
                        </Select>

                        {/* Country */}
                        <Select
                            value={localFilters.country_code || "all"}
                            onValueChange={(value) => handleFilterChange('country_code', value === "all" ? "" : value)}
                        >
                            <SelectTrigger className="h-7 w-[100px] text-xs">
                                <SelectValue placeholder="Country" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Countries</SelectItem>
                                {countriesArray.map((country: any, idx: number) => {
                                    if (!country || country === null) return null;
                                    return (
                                        <SelectItem key={country.id || idx} value={country.code || String(country.id)}>
                                            {country.name || 'Unknown'}
                                        </SelectItem>
                                    );
                                }).filter(Boolean)}
                            </SelectContent>
                        </Select>

                        {/* User Role */}
                        <Select
                            value={localFilters.role_name || "all"}
                            onValueChange={(value) => handleFilterChange('role_name', value === "all" ? "" : value)}
                        >
                            <SelectTrigger className="h-7 w-[90px] text-xs">
                                <SelectValue placeholder="Role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Roles</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="user">User</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Status */}
                        <Select
                            value={localFilters.is_active || "all"}
                            onValueChange={(value) => handleFilterChange('is_active', value === "all" ? "" : value)}
                        >
                            <SelectTrigger className="h-7 w-[90px] text-xs">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="true">Active</SelectItem>
                                <SelectItem value="false">Inactive</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Sort By */}
                        <Select
                            value={ordering}
                            onValueChange={(value) => setOrdering(value)}
                        >
                            <SelectTrigger className="h-7 w-[130px] text-xs">
                                <SelectValue placeholder="Sort by" />
                            </SelectTrigger>
                            <SelectContent>
                                {sortOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Clear filters button */}
                        {activeFiltersCount > 0 && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={clearFilters}
                                title="Clear all filters"
                                className="h-7 px-2"
                            >
                                <X className="w-3 h-3" />
                            </Button>
                        )}
                    </div>
                </div>

                <div className="rounded-md border overflow-x-auto">
                    <Table className="min-w-[1300px] table-fixed">
                        <colgroup>
                            <col style={{ width: '100px' }} />
                            <col style={{ width: '100px' }} />
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
                                <TableHead>First Name</TableHead>
                                <TableHead>Last Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Position</TableHead>
                                <TableHead>Department</TableHead>
                                <TableHead>Dept Role</TableHead>
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
                                    <TableCell colSpan={12} className="text-center text-slate-500 py-8">
                                        No users found matching your filters.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                users.map((user: any) => (
                                    <TableRow key={user.id} className="hover:bg-slate-50">
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <User className="w-3 h-3 text-slate-500 flex-shrink-0" />
                                                <span className="truncate text-xs">
                                                    {user.first_name || '-'}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            <span className="truncate block text-xs">
                                                {user.last_name || '-'}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-xs truncate block max-w-[180px]">
                                                {user.email}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-xs truncate block max-w-[90px]">
                                                {user.position_name || user.position || '-'}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-xs truncate block max-w-[90px]">
                                                {user.department_name || user.department || '-'}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={getDeptRoleBadgeVariant(user.department_role)}
                                                className="text-xs truncate max-w-[110px]"
                                            >
                                                {user.department_role === 'manager' ? 'Manager' : user.department_role === 'member' ? 'Member' : user.department_role || '-'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-xs">{user.grade_name || user.grade || '-'}</span>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-xs">{user.country_code || user.country || '-'}</span>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={getRoleBadgeVariant(user.role)} className="text-xs">
                                                {user.role === 'admin' ? 'Admin' : user.role === 'user' ? 'User' : user.role || '-'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-xs">{formatDate(user.date_joined)}</div>
                                            {user.date_left && (
                                                <div className="text-xs text-red-600">
                                                    Left: {formatDate(user.date_left)}
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={user.is_active ? 'default' : 'outline'}
                                                className={`text-xs ${user.is_active
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-gray-100 text-gray-800'}`}
                                            >
                                                {user.is_active ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6"
                                                    onClick={() => handleEditUser(user)}
                                                >
                                                    <Edit className="w-3 h-3" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6"
                                                    onClick={() => handleDeleteClick(user)}
                                                >
                                                    <Trash2 className="w-3 h-3 text-red-500" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Пагинация */}
                {totalPages > 0 && (
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4">
                        <div className="text-xs text-muted-foreground">
                            Showing {users.length} of {totalCount} users
                        </div>

                        <div className="flex items-center gap-2 flex-wrap justify-center">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handlePrevPage}
                                disabled={!hasPrev || isLoadingUsers}
                                className="h-7 text-xs"
                            >
                                <ChevronLeft size={12} className="mr-1" />
                                Prev
                            </Button>

                            <div className="hidden md:flex gap-1">
                                {renderPageNumbers()}
                            </div>

                            <div className="flex md:hidden items-center gap-2">
                                <Select
                                    value={currentPage.toString()}
                                    onValueChange={(value) => handleGoToPage(parseInt(value))}
                                    disabled={isLoadingUsers}
                                >
                                    <SelectTrigger className="w-[100px] h-7 text-xs">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                            <SelectItem key={page} value={page.toString()}>
                                                Page {page} of {totalPages}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="hidden sm:flex md:hidden items-center gap-2 text-xs">
                                <span className="font-medium">{currentPage}</span>
                                <span className="text-muted-foreground">of {totalPages}</span>
                            </div>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleNextPage}
                                disabled={!hasNext || isLoadingUsers}
                                className="h-7 text-xs"
                            >
                                Next
                                <ChevronRight size={12} className="ml-1" />
                            </Button>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                                Go to:
                            </span>
                            <input
                                type="number"
                                min={1}
                                max={totalPages}
                                value={currentPage}
                                onChange={(e) => {
                                    const page = parseInt(e.target.value);
                                    if (!isNaN(page) && page >= 1 && page <= totalPages) {
                                        handleGoToPage(page);
                                    }
                                }}
                                className="w-14 h-7 px-2 text-xs border rounded-md"
                                disabled={isLoadingUsers}
                            />
                        </div>
                    </div>
                )}

                {totalPages > 0 && (
                    <div className="text-center text-xs text-muted-foreground pt-2 border-t">
                        Page {currentPage} of {totalPages} • Total {totalCount} users
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

            {/* User Dialog */}
            <UserDialog
                open={userDialogOpen}
                onOpenChange={handleCloseUserDialog}
                editingUser={editingUser}
                userForm={userForm}
                setUserForm={setUserForm}
                currentFilters={getCurrentFilterParams(false)}
                currentPage={currentPage}
            />
        </>
    );
}