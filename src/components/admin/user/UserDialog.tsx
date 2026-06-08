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

    const { mutate: getAccountsStatuses } = useGetAccountsStatuses();
    const accounts_statuses = useUserStore((state) => state.accounts_statuses) as AccountStatus[];

    const { mutate: sendUser, isLoading: isCreating } = useSendUsers();
    const { mutate: getUsers } = useGetUsers();
    const { mutate: editUser, isLoading: isEditing } = useEditUsers();
    const { mutate: getRoles } = useGetRoles();

    const roles = useUserStore((state) => state.roles) as Role[];
    const department_roles = useUserStore((state) => state.department_roles) ?? [];
    const countriesData = useUserStore((state) => state.countries);

    const user_grades = useMemo(() => {
        const grades = useUserStore.getState().user_grades;
        if (!grades) return [];
        if (Array.isArray(grades)) {
            return grades.filter(grade => grade && grade !== null);
        }
        if (typeof grades === 'object') {
            return Object.values(grades).filter(grade => grade && grade !== null);
        }
        return [];
    }, []);

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
        const positions = useUserStore.getState().positions;
        if (!positions) return [];
        if (Array.isArray(positions)) {
            return positions.filter(pos => pos && pos !== null);
        }
        if (typeof positions === 'object') {
            return Object.values(positions).filter(pos => pos && pos !== null);
        }
        return [];
    }, []);

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

            const roleId = getRoleIdFromEditingUser();
            const accountStatusId = getAccountStatusIdFromEditingUser();

            setUserForm({
                email: editingUser.email || '',
                first_name: editingUser.first_name || '',
                last_name: editingUser.last_name || '',
                password: '',
                date_joined: editingUser.date_joined?.split('T')[0] || new Date().toISOString().split('T')[0],
                leave_date: editingUser.leave_date || editingUser.date_left || '',
                is_active: editingUser.is_active ?? true,
                position_id: editingUser.position_id || findId(store_positions, editingUser.position) || store_positions[0]?.id || 1,
                department_id: editingUser.department_id || findId(store_departments, editingUser.department) || store_departments[0]?.id || 1,
                role_id: roleId || (roles && roles.length > 0 ? roles[0].id : 1),
                department_role_id: editingUser.department_role_id || findId(department_roles, editingUser.department_role) || department_roles[0]?.id || 1,
                grade_id: editingUser.grade_id || findId(user_grades, editingUser.grade) || user_grades[0]?.id || 10,
                country_id: editingUser.country_id || findId(countries, editingUser.country) || countries[0]?.id || 1,
                account_status_id: accountStatusId,
                status_started_at: editingUser.status_started_at?.split('T')[0]
                    || editingUser.status_start_date?.split('T')[0]
                    || editingUser.started_at?.split('T')[0]
                    || ''
            });
        } else if (!open) {
            isInitializedRef.current = false;
            resetForm();
        }
    }, [editingUser, open, store_positions, store_departments, department_roles, user_grades, countries, roles, accounts_statuses]);

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

    const resetForm = () => {
        setUserForm({
            email: '',
            first_name: '',
            last_name: '',
            password: '',
            date_joined: new Date().toISOString().split('T')[0],
            leave_date: '',
            is_active: true,
            position_id: store_positions[0]?.id || 1,
            department_id: store_departments[0]?.id || 1,
            role_id: roles[0]?.id || 1,
            department_role_id: department_roles[0]?.id || 1,
            grade_id: user_grades[0]?.id || 10,
            country_id: countries[0]?.id || 1,
            account_status_id: accounts_statuses[0]?.id || null,
            status_started_at: ''
        });
        setErrors({});
    };

    const handleClose = () => {
        resetForm();
        onOpenChange(false);
    };

    const validateEmail = useCallback((email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }, []);

    // Функция для проверки даты при редактировании
    const validateDateForEdit = useCallback((newDate: string, previousDate: string | undefined): boolean => {
        if (!previousDate) return true; // Если нет предыдущей даты, разрешаем

        const newDateObj = new Date(newDate);
        const previousDateObj = new Date(previousDate);

        // Сравниваем только даты (без времени)
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

        // Проверка для редактирования: новая дата не может быть меньше предыдущей
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

        const userBody: UserBody = {
            email: userForm.email,
            first_name: userForm.first_name,
            last_name: userForm.last_name,
            grade: userForm.grade_id,
            position: userForm.position_id,
            department: userForm.department_id,
            department_role: userForm.department_role_id,
            role: userForm.role_id,
            country: userForm.country_id,
            status_started_at: userForm.status_started_at,
            ...(editingUser && { status: userForm.account_status_id })
        };

        if (editingUser) {
            editUser({ body: userBody, user_id: editingUser.id }, {
                onSuccess: () => {
                    reloadUsersWithFilters();
                    handleClose();
                    if (onSave) onSave();
                },
                onError: (error) => {
                    console.error('Error editing user:', error);
                }
            });
        } else {
            sendUser(userBody, {
                onSuccess: () => {
                    reloadUsersWithFilters();
                    handleClose();
                    if (onSave) onSave();
                },
                onError: (error) => {
                    console.error('Error creating user:', error);
                }
            });
        }
    }, [validateForm, userForm, editingUser, editUser, sendUser, reloadUsersWithFilters, handleClose, onSave]);

    const handleEmailChange = useCallback((value: string) => {
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
        setUserForm({ ...userForm, [field]: value });

        // Очищаем ошибку для этого поля
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }

        // Дополнительная проверка при изменении даты в режиме редактирования
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

    // Получаем предыдущую дату для отображения (только в режиме редактирования)
    const previousDate = editingUser ? (
        editingUser.status_started_at?.split('T')[0]
        || editingUser.status_start_date?.split('T')[0]
        || editingUser.started_at?.split('T')[0]
    ) : null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl" style={{ width: '600px' }}>
                <DialogHeader>
                    <DialogTitle> {editingUser ? 'Edit User' : 'Add New User'}</DialogTitle>
                    <DialogDescription>
                        {editingUser ? 'Update user details' : 'Create a new user account'}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* First Name & Last Name */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="first_name">First Name *</Label>
                            <Input
                                id="first_name"
                                value={userForm.first_name || ''}
                                onChange={(e) => handleTextChange('first_name', e.target.value)}
                                placeholder="Enter first name"
                                className={errors.first_name ? 'border-red-500' : ''}
                                disabled={isLoading}
                            />
                            {errors.first_name && (
                                <p className="text-sm text-red-500">{errors.first_name}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="last_name">Last Name *</Label>
                            <Input
                                id="last_name"
                                value={userForm.last_name || ''}
                                onChange={(e) => handleTextChange('last_name', e.target.value)}
                                placeholder="Enter last name"
                                className={errors.last_name ? 'border-red-500' : ''}
                                disabled={isLoading}
                            />
                            {errors.last_name && (
                                <p className="text-sm text-red-500">{errors.last_name}</p>
                            )}
                        </div>
                    </div>

                    {/* Email & Grade */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email *</Label>
                            <Input
                                id="email"
                                type="email"
                                value={userForm.email || ''}
                                onChange={(e) => handleEmailChange(e.target.value)}
                                placeholder="Enter email address"
                                className={errors.email ? 'border-red-500' : ''}
                                disabled={isLoading}
                            />
                            {errors.email && (
                                <p className="text-sm text-red-500">{errors.email}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="grade">Grade *</Label>
                            <Select
                                value={safeToString(userForm.grade_id)}
                                onValueChange={(value: string) =>
                                    setUserForm({ ...userForm, grade_id: parseInt(value) })
                                }
                                disabled={isLoading || user_grades.length === 0}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select grade" />
                                </SelectTrigger>
                                <SelectContent>
                                    {renderSelectOptions(user_grades)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Position & Department */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="position">Position *</Label>
                            <Select
                                value={safeToString(userForm.position_id)}
                                onValueChange={(value: string) =>
                                    setUserForm({ ...userForm, position_id: parseInt(value) })
                                }
                                disabled={isLoading || store_positions.length === 0}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select position" />
                                </SelectTrigger>
                                <SelectContent>
                                    {renderSelectOptions(store_positions)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="department">Department *</Label>
                            <Select
                                value={safeToString(userForm.department_id)}
                                onValueChange={(value: string) =>
                                    setUserForm({ ...userForm, department_id: parseInt(value) })
                                }
                                disabled={isLoading || store_departments.length === 0}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select department" />
                                </SelectTrigger>
                                <SelectContent>
                                    {renderSelectOptions(store_departments)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Department Role & Country */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="department_role">Department Role *</Label>
                            <Select
                                value={safeToString(userForm.department_role_id)}
                                onValueChange={(value: string) =>
                                    setUserForm({ ...userForm, department_role_id: parseInt(value) })
                                }
                                disabled={isLoading || department_roles.length === 0}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                                <SelectContent>
                                    {renderSelectOptions(department_roles)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="country">Country *</Label>
                            <Select
                                value={safeToString(userForm.country_id)}
                                onValueChange={(value: string) =>
                                    setUserForm({ ...userForm, country_id: parseInt(value) })
                                }
                                disabled={isLoading || countries.length === 0}
                            >
                                <SelectTrigger>
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

                    {/* System Role & Status Started At */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="role">System Role *</Label>
                            <Select
                                value={safeToString(userForm.role_id) || ""}
                                onValueChange={(value: string) => {
                                    isUserChangingRole.current = true;
                                    const parsedValue = parseInt(value);
                                    if (!isNaN(parsedValue)) {
                                        setUserForm(prev => ({ ...prev, role_id: parsedValue }));
                                    }
                                }}
                                disabled={isLoading || !roles || roles.length === 0}
                            >
                                <SelectTrigger>
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
                        <div className="space-y-2">
                            <Label htmlFor="status_started_at">
                                {editingUser ? 'Assignment date *' : 'Hiring date *'} {!editingUser && '*'}
                            </Label>
                            <Input
                                id="status_started_at"
                                type="date"
                                value={userForm.status_started_at || ''}
                                onChange={(e) => handleDateChange('status_started_at', e.target.value)}
                                disabled={isLoading}
                                className={errors.status_started_at ? 'border-red-500' : ''}
                            />
                            {errors.status_started_at && (
                                <div>
                                    <p className="text-sm text-red-500">{errors.status_started_at}   Previous date: {previousDate}</p>
                                </div>
                            )}
                            {editingUser && previousDate && !errors.status_started_at && userForm.status_started_at && (
                                <></>
                            )}
                        </div>
                    </div>

                    {/* Account Status (only for Edit mode) */}
                    {editingUser && (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="account_status">Account Status</Label>
                                <Select
                                    value={safeToString(userForm.account_status_id)}
                                    onValueChange={(value: string) => {
                                        const parsedValue = value === 'null' || value === '' ? null : parseInt(value);
                                        setUserForm({ ...userForm, account_status_id: parsedValue });
                                    }}
                                    disabled={isLoading || !accounts_statuses || accounts_statuses.length === 0}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select account status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {accounts_statuses.map((status: AccountStatus) => (
                                            <SelectItem key={status.id} value={safeToString(status.id)}>
                                                {status.name || status.status || 'Unknown'}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}
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
                            (!!errors.status_started_at)
                        }
                    >
                        {isLoading ? 'Saving...' : (editingUser ? 'Save Changes' : 'Add User')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}