import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '../../ui/dialog';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { UserFormData, UserBody } from '../../../types/types';
import { useUserStore } from '../../../store/UsersStore';
import { useEditUsers, useGetUsers, useSendUsers } from '../../../hooks/useUsers';
import { useGetRoles } from '../../../hooks/usesRole';
import { useGetAccountsStatuses } from '../../../hooks/useStatus';
import { useGetPositions } from '../../../hooks/usePosition';

interface UserDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editingUser: any;
    userForm: UserFormData;
    setUserForm: (form: UserFormData) => void;
    onSave: () => void;
    currentFilters?: Record<string, any>;
    currentPage?: number;
}

interface Country {
    id: number;
    name: string;
    code: string;
}

interface Role {
    id: number;
    name: string;
}

interface AccountStatus {
    id: number;
    name: string;
    status?: string;
}

interface Position {
    id: number;
    name: string;
    grades: Grade[];
}

interface Grade {
    id: number;
    name: string;
    position: number;
    short_name: string;
}

export function UserDialog({
    open,
    onOpenChange,
    editingUser,
    userForm,
    setUserForm,
    onSave,
    currentFilters = {},
    currentPage = 1,
}: UserDialogProps) {
    const [errors, setErrors] = useState<Record<string, string>>({});
    const isInitializedRef = useRef(false);
    const isUserChangingRole = useRef(false);
    const changedFields = useRef<Set<keyof UserFormData>>(new Set());

    const { mutate: getAccountsStatuses } = useGetAccountsStatuses();
    const accounts_statuses = useUserStore((state) => state.accounts_statuses) as AccountStatus[];

    const { mutate: getPositions } = useGetPositions();
    const positions = useUserStore((state) => state.positions) as Position[];

    useEffect(() => {
        getPositions(false);
    }, []);

    const { mutate: sendUser, isLoading: isCreating } = useSendUsers();
    const { mutate: getUsers } = useGetUsers();
    const { mutate: editUser, isLoading: isEditing } = useEditUsers();
    const { mutate: getRoles } = useGetRoles();

    const roles = useUserStore((state) => state.roles) as Role[];
    const department_roles = useUserStore((state) => state.department_roles) ?? [];
    const countriesData = useUserStore((state) => state.countries);

    const store_departments = useMemo(() => {
        const depts = useUserStore.getState().departments;
        if (!depts) return [];
        if (Array.isArray(depts)) {
            return depts.filter(dept => dept && dept !== null);
        }
        if (typeof depts === 'object') {
            return Object.values(depts).filter(dept => dept && dept !== null);
        }
        return [];
    }, []);

    const store_positions = useMemo(() => {
        if (!positions) return [];
        if (Array.isArray(positions)) {
            return positions.filter(pos => pos && pos !== null);
        }
        if (typeof positions === 'object') {
            return Object.values(positions).filter(pos => pos && pos !== null);
        }
        return [];
    }, [positions]);

    const filteredGrades = useMemo(() => {
        if (!positions || !userForm.position_id) return [];

        const selectedPosition = positions.find(pos => pos.id === userForm.position_id);
        if (!selectedPosition || !selectedPosition.grades) return [];

        return selectedPosition.grades;
    }, [positions, userForm.position_id]);

    const countries = useMemo(() => {
        if (!countriesData) return [];
        if (Array.isArray(countriesData)) {
            return countriesData.filter(country => country && country !== null);
        }
        if (typeof countriesData === 'object') {
            return Object.values(countriesData).filter(country => country && country !== null);
        }
        return [];
    }, [countriesData]);

    const safeToString = useCallback((value: any): string => {
        if (value === null || value === undefined) return '';
        if (typeof value === 'number') return value.toString();
        if (typeof value === 'string') return value;
        return '';
    }, []);

    const findId = useCallback((
        items: any[],
        value: any,
        nameField: string = 'name'
    ): number => {
        if (!items || items.length === 0) return 0;

        if (typeof value === 'number') {
            const exists = items.find(item => item?.id === value);
            if (exists) return value;
        }

        if (typeof value === 'string' && value.trim()) {
            const item = items.find(item => item?.[nameField] === value);
            if (item && item.id) return item.id;
        }

        if (value && typeof value === 'object' && value.id) {
            return value.id;
        }

        return items[0]?.id || 0;
    }, []);

    const getRoleIdFromEditingUser = useCallback(() => {
        if (!editingUser) return null;

        if (editingUser.role_id) {
            return editingUser.role_id;
        }

        if (editingUser.role && typeof editingUser.role === 'string' && roles && roles.length > 0) {
            const foundRole = roles.find(
                (role: Role) => role.name?.toLowerCase() === editingUser.role.toLowerCase()
            );
            if (foundRole) {
                return foundRole.id;
            }
        }

        return roles && roles.length > 0 ? roles[0].id : null;
    }, [editingUser, roles]);

    const getAccountStatusIdFromEditingUser = useCallback(() => {
        if (!editingUser) return null;

        if (editingUser.account_status_id) {
            return editingUser.account_status_id;
        }

        const statusValue = editingUser.status || editingUser.account_status;

        if (statusValue && typeof statusValue === 'string' && accounts_statuses && accounts_statuses.length > 0) {
            const foundStatus = accounts_statuses.find(
                (status: AccountStatus) =>
                    status.name?.toLowerCase() === statusValue.toLowerCase() ||
                    status.status?.toLowerCase() === statusValue.toLowerCase()
            );
            if (foundStatus) return foundStatus.id;
        }

        return accounts_statuses && accounts_statuses.length > 0 ? accounts_statuses[0].id : null;
    }, [editingUser, accounts_statuses]);

    const reloadUsersWithFilters = useCallback(() => {
        const params = {
            ...currentFilters,
            page: currentPage,
            page_size: 30,
        };
        getUsers(params);
    }, [currentFilters, currentPage, getUsers]);

    useEffect(() => {
        if (open) {
            getRoles();
            getAccountsStatuses();
        }
    }, [open, getRoles, getAccountsStatuses]);

    useEffect(() => {
        if (editingUser && open && !isInitializedRef.current) {
            isInitializedRef.current = true;
            changedFields.current = new Set();

            const roleId = getRoleIdFromEditingUser();
            const accountStatusId = getAccountStatusIdFromEditingUser();

            const editingPosition = store_positions.find(pos =>
                pos.id === editingUser.position_id ||
                pos.name === editingUser.position
            );

            let gradeId = editingUser.grade_id;
            if (!gradeId && editingPosition && editingUser.grade) {
                const foundGrade = editingPosition.grades?.find(g =>
                    g.name === editingUser.grade ||
                    g.id === editingUser.grade_id
                );
                if (foundGrade) {
                    gradeId = foundGrade.id;
                }
            }

            setUserForm({
                email: editingUser.email || '',
                first_name: editingUser.first_name || '',
                last_name: editingUser.last_name || '',
                password: '',
                date_joined: editingUser.date_joined?.split('T')[0] || new Date().toISOString().split('T')[0],
                leave_date: editingUser.leave_date || editingUser.date_left || '',
                is_active: editingUser.is_active ?? true,
                position_id: editingUser.position_id || findId(store_positions, editingUser.position) || (store_positions && store_positions.length > 0 ? store_positions[0]?.id : 1),
                department_id: editingUser.department_id || findId(store_departments, editingUser.department) || (store_departments && store_departments.length > 0 ? store_departments[0]?.id : 1),
                role_id: roleId || (roles && roles.length > 0 ? roles[0].id : 1),
                department_role_id: editingUser.department_role_id || findId(department_roles, editingUser.department_role) || (department_roles && department_roles.length > 0 ? department_roles[0]?.id : 1),
                grade_id: gradeId || (filteredGrades.length > 0 ? filteredGrades[0]?.id : 10),
                grade_started_at: editingUser.grade_started_at?.split('T')[0] || '',
                country_id: editingUser.country_id || findId(countries, editingUser.country) || (countries && countries.length > 0 ? countries[0]?.id : 1),
                account_status_id: accountStatusId,
                status_started_at: editingUser.status_started_at?.split('T')[0]
                    || editingUser.status_start_date?.split('T')[0]
                    || editingUser.started_at?.split('T')[0]
                    || ''
            });
        } else if (!open) {
            isInitializedRef.current = false;
            changedFields.current = new Set();
            resetForm();
        }
    }, [editingUser, open, store_positions, store_departments, department_roles, countries, roles, accounts_statuses, filteredGrades]);

    useEffect(() => {
        if (isUserChangingRole.current) return;

        if (editingUser && open && roles && roles.length > 0 && userForm.role_id) {
            const expectedRoleId = getRoleIdFromEditingUser();
            if (expectedRoleId && expectedRoleId !== userForm.role_id) {
                setUserForm(prev => ({ ...prev, role_id: expectedRoleId }));
            }
        }
    }, [editingUser, open, roles, userForm.role_id]);

    useEffect(() => {
        if (roles && roles.length > 0 && (!userForm.role_id || !roles.some(r => r.id === userForm.role_id))) {
            setUserForm(prev => ({ ...prev, role_id: roles[0].id }));
        }
    }, [roles, userForm.role_id]);

    useEffect(() => {
        if (!open) {
            isUserChangingRole.current = false;
        }
    }, [open]);

    useEffect(() => {
        if (userForm.position_id && filteredGrades.length > 0) {
            const currentGradeBelongsToPosition = filteredGrades.some(g => g.id === userForm.grade_id);
            if (!currentGradeBelongsToPosition) {
                setUserForm(prev => ({
                    ...prev,
                    grade_id: filteredGrades[0]?.id
                }));
            }
        }
    }, [userForm.position_id, filteredGrades]);

    const resetForm = () => {
        setUserForm({
            email: '',
            first_name: '',
            last_name: '',
            password: '',
            date_joined: new Date().toISOString().split('T')[0],
            leave_date: '',
            is_active: true,
            position_id: store_positions && store_positions.length > 0 ? store_positions[0]?.id : 1,
            department_id: store_departments && store_departments.length > 0 ? store_departments[0]?.id : 1,
            role_id: roles && roles.length > 0 ? roles[0]?.id : 1,
            department_role_id: department_roles && department_roles.length > 0 ? department_roles[0]?.id : 1,
            grade_id: filteredGrades.length > 0 ? filteredGrades[0]?.id : 10,
            grade_started_at: '',
            country_id: countries && countries.length > 0 ? countries[0]?.id : 1,
            account_status_id: accounts_statuses && accounts_statuses.length > 0 ? accounts_statuses[0]?.id : null,
            status_started_at: ''
        });
        setErrors({});
        changedFields.current = new Set();
    };

    const handleClose = () => {
        resetForm();
        onOpenChange(false);
    };

    const validateEmail = useCallback((email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }, []);

    const validateDateForEdit = useCallback((newDate: string, previousDate: string | undefined): boolean => {
        if (!previousDate) return true;

        const newDateObj = new Date(newDate);
        const previousDateObj = new Date(previousDate);

        newDateObj.setHours(0, 0, 0, 0);
        previousDateObj.setHours(0, 0, 0, 0);

        return newDateObj >= previousDateObj;
    }, []);

    const validateForm = useCallback((): boolean => {
        const newErrors: Record<string, string> = {};

        if (!userForm.email?.trim()) {
            newErrors.email = 'Email is required';
        } else if (!validateEmail(userForm.email)) {
            newErrors.email = 'Please enter a valid email address';
        }

        if (!userForm.first_name?.trim()) {
            newErrors.first_name = 'First name is required';
        }

        if (!userForm.last_name?.trim()) {
            newErrors.last_name = 'Last name is required';
        }

        if (!editingUser && !userForm.status_started_at) {
            newErrors.status_started_at = 'Status started at is required';
        }

        if (editingUser && userForm.status_started_at) {
            const previousDate = editingUser.status_started_at?.split('T')[0]
                || editingUser.status_start_date?.split('T')[0]
                || editingUser.started_at?.split('T')[0];

            if (previousDate && !validateDateForEdit(userForm.status_started_at, previousDate)) {
                newErrors.status_started_at = 'New date cannot be earlier than the previous date';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [userForm.email, userForm.first_name, userForm.last_name, userForm.status_started_at, editingUser, validateEmail, validateDateForEdit]);

    const handleSaveUser = useCallback(() => {
        if (!validateForm()) return;

        const fullBody: UserBody = {
            email: userForm.email,
            first_name: userForm.first_name,
            last_name: userForm.last_name,
            grade: userForm.grade_id,
            grade_started_at: userForm.grade_started_at,
            position: userForm.position_id,
            department: userForm.department_id,
            department_role: userForm.department_role_id,
            role: userForm.role_id,
            country: userForm.country_id,
            status_started_at: userForm.status_started_at,
            ...(editingUser && { status: userForm.account_status_id })
        };

        // Для создания отправляем всё
        if (!editingUser) {
            sendUser(fullBody, {
                onSuccess: () => {
                    reloadUsersWithFilters();
                    handleClose();
                    if (onSave) onSave();
                },
                onError: (error) => {
                    console.error('Error creating user:', error);
                }
            });
            return;
        }

        // Для редактирования — только изменённые поля
        const fieldMap: Partial<Record<keyof UserFormData, keyof UserBody>> = {
            email: 'email',
            first_name: 'first_name',
            last_name: 'last_name',
            grade_id: 'grade',
            grade_started_at: 'grade_started_at',
            position_id: 'position',
            department_id: 'department',
            department_role_id: 'department_role',
            role_id: 'role',
            country_id: 'country',
            status_started_at: 'status_started_at',
            account_status_id: 'status',
        };

        const partialBody: Partial<UserBody> = {};
        changedFields.current.forEach((field) => {
            const bodyKey = fieldMap[field];
            if (bodyKey) {
                (partialBody as any)[bodyKey] = (fullBody as any)[bodyKey];
            }
        });

        if (Object.keys(partialBody).length === 0) {
            handleClose();
            return;
        }

        editUser({ body: partialBody, user_id: editingUser.id }, {
            onSuccess: () => {
                reloadUsersWithFilters();
                handleClose();
                if (onSave) onSave();
            },
            onError: (error) => {
                console.error('Error editing user:', error);
            }
        });
    }, [validateForm, userForm, editingUser, editUser, sendUser, reloadUsersWithFilters, handleClose, onSave]);

    const handleEmailChange = useCallback((value: string) => {
        changedFields.current.add('email');
        setUserForm({ ...userForm, email: value });
        if (errors.email) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors.email;
                return newErrors;
            });
        }
    }, [userForm, setUserForm, errors.email]);

    const handleTextChange = useCallback((field: keyof UserFormData, value: string) => {
        changedFields.current.add(field);
        setUserForm({ ...userForm, [field]: value });
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    }, [userForm, setUserForm, errors]);

    const handleDateChange = useCallback((field: keyof UserFormData, value: string) => {
        changedFields.current.add(field);
        setUserForm({ ...userForm, [field]: value });

        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }

        if (editingUser && field === 'status_started_at' && value) {
            const previousDate = editingUser.status_started_at?.split('T')[0]
                || editingUser.status_start_date?.split('T')[0]
                || editingUser.started_at?.split('T')[0];

            if (previousDate && !validateDateForEdit(value, previousDate)) {
                setErrors(prev => ({
                    ...prev,
                    status_started_at: 'New date cannot be earlier than the previous date'
                }));
            }
        }
    }, [userForm, setUserForm, errors, editingUser, validateDateForEdit]);

    const handleSelectChange = useCallback((field: keyof UserFormData, value: any) => {
        changedFields.current.add(field);
        setUserForm({ ...userForm, [field]: value });
    }, [userForm, setUserForm]);

    const isLoading = isCreating || isEditing;

    const renderSelectOptions = useCallback((items: any[], valueKey: string = 'id', labelKey: string = 'name') => {
        if (!items || !Array.isArray(items) || items.length === 0) {
            return <SelectItem value="0" disabled>No options available</SelectItem>;
        }

        return items.map((item, index) => {
            if (!item || item === null || typeof item !== 'object') {
                return null;
            }

            const value = item[valueKey];
            const label = item[labelKey] || item.status;

            if (value === undefined || value === null) {
                return null;
            }

            return (
                <SelectItem key={`${valueKey}-${value}-${index}`} value={safeToString(value)}>
                    {label || 'Unknown'}
                </SelectItem>
            );
        }).filter(Boolean);
    }, [safeToString]);

    const previousDate = editingUser ? (
        editingUser.status_started_at?.split('T')[0]
        || editingUser.status_start_date?.split('T')[0]
        || editingUser.started_at?.split('T')[0]
    ) : null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-5xl" style={{ width: '900px' }}>
                <DialogHeader>
                    <DialogTitle>{editingUser ? 'Edit User' : 'Add New User'}</DialogTitle>
                    <DialogDescription>
                        {editingUser ? 'Update user details' : 'Create a new user account'}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-2 gap-6 py-4">
                    {/* Personal Information Group */}
                    <div className="space-y-3 p-4 border-2 border-gray-200 rounded-lg bg-gray-50">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="first_name" className="text-sm font-medium">First Name *</Label>
                                <Input
                                    id="first_name"
                                    value={userForm.first_name || ''}
                                    onChange={(e) => handleTextChange('first_name', e.target.value)}
                                    placeholder="Enter first name"
                                    className={`mt-1.5 ${errors.first_name ? 'border-red-500' : ''}`}
                                    disabled={isLoading}
                                />
                                {errors.first_name && (
                                    <p className="text-sm text-red-500 mt-1">{errors.first_name}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="last_name" className="text-sm font-medium">Last Name *</Label>
                                <Input
                                    id="last_name"
                                    value={userForm.last_name || ''}
                                    onChange={(e) => handleTextChange('last_name', e.target.value)}
                                    placeholder="Enter last name"
                                    className={`mt-1.5 ${errors.last_name ? 'border-red-500' : ''}`}
                                    disabled={isLoading}
                                />
                                {errors.last_name && (
                                    <p className="text-sm text-red-500 mt-1">{errors.last_name}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-sm font-medium">Email *</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={userForm.email || ''}
                                    onChange={(e) => handleEmailChange(e.target.value)}
                                    placeholder="Enter email address"
                                    className={`mt-1.5 ${errors.email ? 'border-red-500' : ''}`}
                                    disabled={isLoading}
                                />
                                {errors.email && (
                                    <p className="text-sm text-red-500 mt-1">{errors.email}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="country" className="text-sm font-medium">Country *</Label>
                                <Select
                                    value={safeToString(userForm.country_id)}
                                    onValueChange={(value: string) =>
                                        handleSelectChange('country_id', parseInt(value))
                                    }
                                    disabled={isLoading || countries.length === 0}
                                >
                                    <SelectTrigger className="mt-1.5">
                                        <SelectValue placeholder="Select country" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {countries.map((country: Country) => (
                                            <SelectItem key={country.id} value={safeToString(country.id)}>
                                                {country.name} {country.code ? `(${country.code})` : ''}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    {/* Position & Grade Group */}
                    <div className="space-y-3 p-4 border-2 border-blue-200 rounded-lg bg-blue-50">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="position" className="text-sm font-medium">Position *</Label>
                                <Select
                                    value={safeToString(userForm.position_id)}
                                    onValueChange={(value: string) => {
                                        handleSelectChange('position_id', parseInt(value));
                                    }}
                                    disabled={isLoading || store_positions.length === 0}
                                >
                                    <SelectTrigger className="mt-1.5">
                                        <SelectValue placeholder="Select position" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {store_positions.map((position: Position) => (
                                            <SelectItem key={position.id} value={safeToString(position.id)}>
                                                {position.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="grade" className="text-sm font-medium">Grade *</Label>
                                <Select
                                    value={safeToString(userForm.grade_id)}
                                    onValueChange={(value: string) =>
                                        handleSelectChange('grade_id', parseInt(value))
                                    }
                                    disabled={isLoading || filteredGrades.length === 0}
                                >
                                    <SelectTrigger className="mt-1.5">
                                        <SelectValue placeholder={filteredGrades.length === 0 ? "Select position first" : "Select grade"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {filteredGrades.length > 0 ? (
                                            filteredGrades.map((grade: Grade) => (
                                                <SelectItem key={grade.id} value={safeToString(grade.id)}>
                                                    {grade.name}
                                                </SelectItem>
                                            ))
                                        ) : (
                                            <SelectItem value="no-grades" disabled>No grades available</SelectItem>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="grade_started_at" className="text-sm font-medium">Grade Start Date</Label>
                                <Input
                                    id="grade_started_at"
                                    type="date"
                                    value={userForm.grade_started_at || ''}
                                    onChange={(e) => handleDateChange('grade_started_at', e.target.value)}
                                    className="mt-1.5"
                                    disabled={isLoading}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Department & Roles Group */}
                    <div className="space-y-3 p-4 border-2 border-purple-200 rounded-lg bg-purple-50">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="department" className="text-sm font-medium">Department *</Label>
                                <Select
                                    value={safeToString(userForm.department_id)}
                                    onValueChange={(value: string) =>
                                        handleSelectChange('department_id', parseInt(value))
                                    }
                                    disabled={isLoading || store_departments.length === 0}
                                >
                                    <SelectTrigger className="mt-1.5">
                                        <SelectValue placeholder="Select department" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {renderSelectOptions(store_departments)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="department_role" className="text-sm font-medium">Department Role *</Label>
                                <Select
                                    value={safeToString(userForm.department_role_id)}
                                    onValueChange={(value: string) =>
                                        handleSelectChange('department_role_id', parseInt(value))
                                    }
                                    disabled={isLoading || department_roles.length === 0}
                                >
                                    <SelectTrigger className="mt-1.5">
                                        <SelectValue placeholder="Select role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {renderSelectOptions(department_roles)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="role" className="text-sm font-medium">System Role *</Label>
                                <Select
                                    value={safeToString(userForm.role_id) || ""}
                                    onValueChange={(value: string) => {
                                        isUserChangingRole.current = true;
                                        const parsedValue = parseInt(value);
                                        if (!isNaN(parsedValue)) {
                                            handleSelectChange('role_id', parsedValue);
                                        }
                                    }}
                                    disabled={isLoading || !roles || roles.length === 0}
                                >
                                    <SelectTrigger className="mt-1.5">
                                        <SelectValue placeholder="Select system role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {roles && roles.length > 0 ? (
                                            roles.map((role: Role) => (
                                                <SelectItem key={role.id} value={safeToString(role.id)}>
                                                    {role.name}
                                                </SelectItem>
                                            ))
                                        ) : (
                                            <SelectItem value="no-roles" disabled>No roles available</SelectItem>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    {/* Assignment & Status Group */}
                    <div className="space-y-3 p-4 border-2 border-green-200 rounded-lg bg-green-50">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="status_started_at" className="text-sm font-medium">
                                    {editingUser ? 'Assignment date *' : 'Hiring date *'}
                                </Label>
                                <Input
                                    id="status_started_at"
                                    type="date"
                                    value={userForm.status_started_at || ''}
                                    onChange={(e) => handleDateChange('status_started_at', e.target.value)}
                                    disabled={isLoading}
                                    className={`mt-1.5 ${errors.status_started_at ? 'border-red-500' : ''}`}
                                />
                                {errors.status_started_at && (
                                    <div className="mt-1">
                                        <p className="text-sm text-red-500">{errors.status_started_at}</p>
                                        {previousDate && (
                                            <p className="text-xs text-gray-500 mt-0.5">Previous: {previousDate}</p>
                                        )}
                                    </div>
                                )}
                            </div>
                            {editingUser && (
                                <div className="space-y-2">
                                    <Label htmlFor="account_status" className="text-sm font-medium">Account Status</Label>
                                    <Select
                                        value={safeToString(userForm.account_status_id)}
                                        onValueChange={(value: string) => {
                                            const parsedValue = value === 'null' || value === '' ? null : parseInt(value);
                                            handleSelectChange('account_status_id', parsedValue);
                                        }}
                                        disabled={isLoading || !accounts_statuses || accounts_statuses.length === 0}
                                    >
                                        <SelectTrigger className="mt-1.5">
                                            <SelectValue placeholder="Select account status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {accounts_statuses && accounts_statuses.length > 0 ? (
                                                accounts_statuses.map((status: AccountStatus) => (
                                                    <SelectItem key={status.id} value={safeToString(status.id)}>
                                                        {status.name || status.status || 'Unknown'}
                                                    </SelectItem>
                                                ))
                                            ) : (
                                                <SelectItem value="no-status" disabled>No statuses available</SelectItem>
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <DialogFooter className="flex justify-between pt-4">
                    <Button variant="outline" onClick={handleClose} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSaveUser}
                        style={{ backgroundColor: '#1F4E78' }}
                        disabled={
                            !userForm.email?.trim() ||
                            !userForm.first_name?.trim() ||
                            !userForm.last_name?.trim() ||
                            (!editingUser && !userForm.status_started_at) ||
                            isLoading ||
                            (!!errors.status_started_at) ||
                            filteredGrades.length === 0
                        }
                    >
                        {isLoading ? 'Saving...' : (editingUser ? 'Save Changes' : 'Add User')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}