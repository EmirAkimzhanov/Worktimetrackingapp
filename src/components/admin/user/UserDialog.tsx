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

interface UserDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editingUser: any;
    userForm: UserFormData;
    setUserForm: (form: UserFormData) => void;
    onSave: () => void;
    // НОВЫЕ ПРОПЫ для сохранения фильтров и пагинации
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

    const department_roles = useUserStore((state) => state.department_roles) ?? [];

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

    const { mutate: sendUser, isLoading: isCreating } = useSendUsers();
    const { mutate: getUsers } = useGetUsers();
    const { mutate: editUser, isLoading: isEditing } = useEditUsers();
    const { mutate: getRoles } = useGetRoles();
    const roles = useUserStore((state) => state.roles) as Role[];

    // Функция для перезагрузки пользователей с сохранением фильтров и пагинации
    const reloadUsersWithFilters = useCallback(() => {
        const params = {
            ...currentFilters,
            page: currentPage,
            page_size: 30,
        };
        console.log('🔄 Reloading users with params:', params);
        getUsers(params);
    }, [currentFilters, currentPage, getUsers]);

    // ✅ Преобразуем countries в массив, если это объект
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

    // ✅ Безопасное преобразование в строку
    const safeToString = useCallback((value: any): string => {
        if (value === null || value === undefined) return '';
        if (typeof value === 'number') return value.toString();
        if (typeof value === 'string') return value;
        return '';
    }, []);

    // ✅ Функция для поиска ID по названию или прямого использования ID
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

    // ✅ Функция для получения ID роли из editingUser
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
                console.log('Found role by name:', editingUser.role, '-> ID:', foundRole.id);
                return foundRole.id;
            }
        }

        return roles && roles.length > 0 ? roles[0].id : null;
    }, [editingUser, roles]);

    // ✅ Загружаем роли при открытии
    useEffect(() => {
        if (open) {
            getRoles();
        }
    }, [open, getRoles]);

    // ✅ Инициализация формы при редактировании
    useEffect(() => {
        if (editingUser && open && !isInitializedRef.current) {
            isInitializedRef.current = true;

            const getPositionId = () => {
                if (editingUser.position_id) return editingUser.position_id;
                if (editingUser.position) return findId(store_positions, editingUser.position);
                return store_positions[0]?.id || 1;
            };

            const getDepartmentId = () => {
                if (editingUser.department_id) return editingUser.department_id;
                if (editingUser.department) return findId(store_departments, editingUser.department);
                return store_departments[0]?.id || 1;
            };

            const getDepartmentRoleId = () => {
                if (editingUser.department_role_id) return editingUser.department_role_id;
                if (editingUser.department_role) return findId(department_roles, editingUser.department_role);
                return department_roles[0]?.id || 1;
            };

            const getGradeId = () => {
                if (editingUser.grade_id) return editingUser.grade_id;
                if (editingUser.grade) return findId(user_grades, editingUser.grade);
                return user_grades[0]?.id || 10;
            };

            const getCountryId = () => {
                if (editingUser.country_id) return editingUser.country_id;
                if (editingUser.country) return findId(countries, editingUser.country);
                return countries[0]?.id || 1;
            };

            const roleId = getRoleIdFromEditingUser();
            console.log('Setting initial role_id to:', roleId);

            setUserForm({
                email: editingUser.email || '',
                first_name: editingUser.first_name || '',
                last_name: editingUser.last_name || '',
                password: '',
                date_joined: editingUser.date_joined?.split('T')[0] || new Date().toISOString().split('T')[0],
                leave_date: editingUser.leave_date || editingUser.date_left || '',
                is_active: editingUser.is_active ?? true,
                position_id: getPositionId(),
                department_id: getDepartmentId(),
                role_id: roleId || (roles && roles.length > 0 ? roles[0].id : 1),
                department_role_id: getDepartmentRoleId(),
                grade_id: getGradeId(),
                country_id: getCountryId()
            });
        } else if (!open) {
            isInitializedRef.current = false;
            resetForm();
        }
    }, [editingUser, open, store_positions, store_departments, department_roles, user_grades, countries, roles, setUserForm, findId, getRoleIdFromEditingUser]);

    useEffect(() => {
        if (isUserChangingRole.current) return;

        if (editingUser && open && roles && roles.length > 0 && userForm.role_id) {
            const expectedRoleId = getRoleIdFromEditingUser();

            if (expectedRoleId && expectedRoleId !== userForm.role_id) {
                setUserForm(prev => ({
                    ...prev,
                    role_id: expectedRoleId
                }));
            }
        }
    }, [editingUser, open, roles, userForm.role_id, getRoleIdFromEditingUser, setUserForm]);

    // ✅ Добавьте после всех других useEffect
    useEffect(() => {
        console.log('Current userForm.role_id:', userForm.role_id);
        console.log('Available roles:', roles);

        // Если role_id не установлен или не существует в списке ролей, устанавливаем первую роль
        if (roles && roles.length > 0 && (!userForm.role_id || !roles.some(r => r.id === userForm.role_id))) {
            const defaultRoleId = roles[0].id;
            console.log('Setting default role_id to:', defaultRoleId);
            setUserForm(prev => ({ ...prev, role_id: defaultRoleId }));
        }
    }, [roles, userForm.role_id, setUserForm]);
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
            position_id: store_positions.length > 0 ? store_positions[0].id : 1,
            department_id: store_departments.length > 0 ? store_departments[0].id : 1,
            role_id: roles && roles.length > 0 ? roles[0].id : 1,
            department_role_id: department_roles.length > 0 ? department_roles[0].id : 1,
            grade_id: user_grades.length > 0 ? user_grades[0].id : 10,
            country_id: countries.length > 0 ? countries[0].id : 1
        });
        setErrors({});
    };

    const handleClose = () => {
        resetForm();
        onOpenChange(false);
    };

    const validateEmail = useCallback((email: string): boolean => {
        if (!email) return false;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
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

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [userForm.email, userForm.first_name, userForm.last_name, validateEmail]);

    const handleSaveUser = useCallback(() => {
        if (!validateForm()) {
            return;
        }

        const userBody: UserBody = {
            email: userForm.email,
            first_name: userForm.first_name,
            last_name: userForm.last_name,
            grade: userForm.grade_id,
            position: userForm.position_id,
            department: userForm.department_id,
            department_role: userForm.department_role_id,
            role: userForm.role_id,
            country: userForm.country_id
        };

        if (editingUser) {
            editUser({ body: userBody, user_id: editingUser.id }, {
                onSuccess: () => {
                    // Перезагружаем пользователей с сохранением фильтров и пагинации
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
                    // Перезагружаем пользователей с сохранением фильтров и пагинации
                    reloadUsersWithFilters();
                    handleClose();
                    if (onSave) onSave();
                },
                onError: (error) => {
                    console.error('Error creating user:', error);
                }
            });
        }
    }, [validateForm, userForm, editingUser, editUser, reloadUsersWithFilters, handleClose, onSave, sendUser]);

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
            const label = item[labelKey];

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

    const isUserChangingRole = useRef(false);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>{editingUser ? 'Edit User' : 'Add New User'}</DialogTitle>
                    <DialogDescription>
                        {editingUser ? 'Update user details' : 'Create a new user account'}
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    {/* Первая строка: First Name и Last Name */}
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

                    {/* Вторая строка: Email и Grade */}
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

                    {/* Третья строка: Position и Department */}
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

                    {/* Четвертая строка: Department Role и Country */}
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
                                    {countries.length > 0 ? (
                                        countries.map((country: Country, index: number) => {
                                            if (!country || country === null || typeof country !== 'object') {
                                                return null;
                                            }
                                            return (
                                                <SelectItem key={country.id || index} value={safeToString(country.id)}>
                                                    {country.name} {country.code ? `(${country.code})` : ''}
                                                </SelectItem>
                                            );
                                        }).filter(Boolean)
                                    ) : (
                                        <SelectItem value="1" disabled>
                                            No countries available
                                        </SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    {/* Пятая строка: System Role и Active Status */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="role">System Role *</Label>
                            <Select
                                value={safeToString(userForm.role_id) || ""}
                                onValueChange={(value: string) => {
                                    isUserChangingRole.current = true;

                                    const parsedValue = parseInt(value);
                                    if (!isNaN(parsedValue)) {
                                        setUserForm(prev => ({
                                            ...prev,
                                            role_id: parsedValue
                                        }));
                                    }
                                }}
                                disabled={isLoading || !roles || roles.length === 0}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder={!roles || roles.length === 0 ? "Loading roles..." : "Select system role"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {roles && roles.length > 0 ? (
                                        roles.map((role: Role) => (
                                            <SelectItem key={role.id} value={safeToString(role.id)}>
                                                {role.name}
                                            </SelectItem>
                                        ))
                                    ) : (
                                        <SelectItem value="0" disabled>No roles available</SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 pt-6">
                                <div className="flex items-center space-x-2">
                                    <div
                                        className={`w-3 h-3 rounded-full ${userForm.is_active ? 'bg-green-500' : 'bg-red-500'}`}
                                    />
                                    <Label className="text-sm font-medium">
                                        {userForm.is_active ? 'Active' : 'Inactive'}
                                    </Label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <DialogFooter className='display-flex pt-4 justify-between'>
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
                            isLoading
                        }
                    >
                        {isLoading ? 'Saving...' : (editingUser ? 'Save Changes' : 'Add User')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}