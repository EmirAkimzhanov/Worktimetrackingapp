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

interface UserDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editingUser: any;
    userForm: UserFormData;
    setUserForm: (form: UserFormData) => void;
    onSave: () => void;
}

interface Country {
    id: number;
    name: string;
    code: string;
}

export function UserDialog({
    open,
    onOpenChange,
    editingUser,
    userForm,
    setUserForm,
    onSave,
}: UserDialogProps) {
    const [errors, setErrors] = useState<Record<string, string>>({});
    const isInitializedRef = useRef(false);

    const department_roles = useUserStore((state) => state.department_roles) || [];
    const user_grades = useUserStore((state) => state.user_grades) || [];
    const countriesData = useUserStore((state) => state.countries);
    const store_departments = useUserStore((state) => state.departments) || [];
    const store_positions = useUserStore((state) => state.positions) || [];
    const { mutate: sendUser, isLoading: isCreating } = useSendUsers();
    const { mutate: getUsers } = useGetUsers();
    const { mutate: editUser, isLoading: isEditing } = useEditUsers();

    // Преобразуем countries в массив, если это объект
    const countries = useMemo(() => {
        if (!countriesData) return [];
        if (Array.isArray(countriesData)) {
            return countriesData;
        }
        if (typeof countriesData === 'object') {
            if (countriesData && 'map' in countriesData && typeof countriesData.map === 'function') {
                return countriesData as Country[];
            }
            return Object.values(countriesData);
        }
        return [];
    }, [countriesData]);

    // Безопасное преобразование в строку
    const safeToString = useCallback((value: any): string => {
        if (value === null || value === undefined) return '';
        return value.toString();
    }, []);

    // Функция для поиска ID по названию или прямого использования ID
    const findId = useCallback((
        items: any[],
        value: any,
        nameField: string = 'name'
    ): number => {
        if (!items || items.length === 0) return 0;

        // Если value уже является числом (ID)
        if (typeof value === 'number') {
            const exists = items.find(item => item.id === value);
            if (exists) return value;
        }

        // Если value является строкой (название)
        if (typeof value === 'string') {
            const item = items.find(item => item[nameField] === value);
            if (item) return item.id;
        }

        // Если value является объектом с id
        if (value && typeof value === 'object' && value.id) {
            return value.id;
        }

        return items[0]?.id || 0;
    }, []);

    // Загружаем данные пользователя в форму при редактировании
    useEffect(() => {
        if (editingUser && open && !isInitializedRef.current) {
            isInitializedRef.current = true;

            // Функции для получения ID с проверкой на существование
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
                role: editingUser.role || 'user',
                department_role_id: getDepartmentRoleId(),
                grade_id: getGradeId(),
                country_id: getCountryId()
            });
        } else if (!open) {
            isInitializedRef.current = false;
            resetForm();
        }
    }, [editingUser, open, store_positions, store_departments, department_roles, user_grades, countries, setUserForm, findId]);

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
            role: 'user',
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

    // Функция валидации email
    const validateEmail = useCallback((email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }, []);

    // Валидация всей формы
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

    // Преобразование role string в number
    const mapRoleToNumber = useCallback((role: string): number => {
        switch (role) {
            case 'admin': return 1;
            case 'manager': return 2;
            case 'user': return 3;
            default: return 3;
        }
    }, []);

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
            role: mapRoleToNumber(userForm.role),
            country: userForm.country_id
        };

        if (editingUser) {
            editUser({ body: userBody, user_id: editingUser.id }, {
                onSuccess: () => {
                    getUsers();
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
                    getUsers();
                    handleClose();
                    if (onSave) onSave();
                },
                onError: (error) => {
                    console.error('Error creating user:', error);
                }
            });
        }
    }, [validateForm, userForm, editingUser, editUser, getUsers, handleClose, onSave, sendUser, mapRoleToNumber]);

    // Обработчик изменения email с валидацией
    const handleEmailChange = useCallback((value: string) => {
        setUserForm({ ...userForm, email: value });

        if (errors.email) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors.email;
                return newErrors;
            });
        }
    }, [userForm, errors.email]);

    const isLoading = isCreating || isEditing;

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
                                onChange={(e) => setUserForm({ ...userForm, first_name: e.target.value })}
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
                                onChange={(e) => setUserForm({ ...userForm, last_name: e.target.value })}
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
                                disabled={isLoading}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select grade" />
                                </SelectTrigger>
                                <SelectContent>
                                    {user_grades.map(grade => (
                                        <SelectItem key={grade.id} value={safeToString(grade.id)}>
                                            {grade.name}
                                        </SelectItem>
                                    ))}
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
                                disabled={isLoading}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select position" />
                                </SelectTrigger>
                                <SelectContent>
                                    {store_positions.map(position => (
                                        <SelectItem key={position.id} value={safeToString(position.id)}>
                                            {position.name}
                                        </SelectItem>
                                    ))}
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
                                disabled={isLoading}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select department" />
                                </SelectTrigger>
                                <SelectContent>
                                    {store_departments.map(department => (
                                        <SelectItem key={department.id} value={safeToString(department.id)}>
                                            {department.name}
                                        </SelectItem>
                                    ))}
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
                                disabled={isLoading}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                                <SelectContent>
                                    {department_roles.map(role => (
                                        <SelectItem key={role.id} value={safeToString(role.id)}>
                                            {role.name}
                                        </SelectItem>
                                    ))}
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
                                disabled={isLoading}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select country" />
                                </SelectTrigger>
                                <SelectContent>
                                    {countries.length > 0 ? (
                                        countries.map((country: Country) => (
                                            <SelectItem key={country.id} value={safeToString(country.id)}>
                                                {country.name} {country.code ? `(${country.code})` : ''}
                                            </SelectItem>
                                        ))
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
                                value={userForm.role || 'user'}
                                onValueChange={(value: 'admin' | 'user' | 'manager') =>
                                    setUserForm({ ...userForm, role: value })
                                }
                                disabled={isLoading}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="user">User</SelectItem>
                                    <SelectItem value="manager">Manager</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2 flex items-center gap-2 pt-6">
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