import React, { useState, useMemo } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { UserFormData, UserBody } from '../../types/types';
import { useUserStore } from '../../store/UsersStore';
import { useEditUsers, useGetUsers, useSendUsers } from '../../hooks/useUsers';

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
    const department_roles = useUserStore((state) => state.department_roles) || [];
    const user_grades = useUserStore((state) => state.user_grades) || [];
    const countriesData = useUserStore((state) => state.countries);
    const store_departments = useUserStore((state) => state.departments) || [];
    const store_positions = useUserStore((state) => state.positions) || [];
    const { mutate: sendUser } = useSendUsers();
    const { mutate: getUsers } = useGetUsers();
    const { mutate: editUser } = useEditUsers();

    // Преобразуем countries в массив, если это объект
    const countries = useMemo(() => {
        console.log('Raw countries data:', countriesData);

        if (!countriesData) return [];

        // Если это массив, возвращаем как есть
        if (Array.isArray(countriesData)) {
            return countriesData;
        }

        // Если это объект, преобразуем в массив
        if (typeof countriesData === 'object') {
            // Проверяем, есть ли у объекта метод map (значит это массив)
            if (countriesData && 'map' in countriesData && typeof countriesData.map === 'function') {
                return countriesData as Country[];
            }

            // Если это объект с ключами, преобразуем значения в массив
            return Object.values(countriesData);
        }

        return [];
    }, [countriesData]);

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
            department_role_id: 1,
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
    const validateEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    // Валидация всей формы
    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        // Валидация email
        if (!userForm.email?.trim()) {
            newErrors.email = 'Email is required';
        } else if (!validateEmail(userForm.email)) {
            newErrors.email = 'Please enter a valid email address';
        }

        // Валидация имени
        if (!userForm.first_name?.trim()) {
            newErrors.first_name = 'First name is required';
        }

        // Валидация фамилии
        if (!userForm.last_name?.trim()) {
            newErrors.last_name = 'Last name is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Преобразование role string в number
    const mapRoleToNumber = (role: string): number => {
        switch (role) {
            case 'admin': return 1;
            case 'manager': return 2;
            case 'user': return 3;
            default: return 3;
        }
    };

    const handleSaveUser = () => {
        // Проверяем валидность формы перед сохранением
        if (!validateForm()) {
            return;
        }

        // Создаем тело запроса в соответствии с интерфейсом UserBody
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
            // Редактирование существующего пользователя
            editUser({ body: userBody, user_id: editingUser.id }, {
                onSuccess: () => {
                    // После успешного редактирования обновляем список пользователей
                    getUsers();
                    handleClose();
                    if (onSave) onSave();
                },
                onError: (error) => {
                    console.error('Error editing user:', error);
                    // Можно добавить уведомление об ошибке
                }
            });
        } else {
            // Создание нового пользователя
            sendUser(userBody, {
                onSuccess: () => {
                    // После успешного создания пользователя обновляем список пользователей
                    getUsers();
                    handleClose();
                    if (onSave) onSave();
                },
                onError: (error) => {
                    console.error('Error creating user:', error);
                    // Можно добавить уведомление об ошибке
                }
            });
        }
    };

    // Безопасное преобразование в строку
    const safeToString = (value: any): string => {
        if (value === null || value === undefined) return '';
        return value.toString();
    };

    // Обработчик изменения email с валидацией
    const handleEmailChange = (value: string) => {
        setUserForm({ ...userForm, email: value });

        // Очищаем ошибку email при изменении
        if (errors.email) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors.email;
                return newErrors;
            });
        }
    };

    // Для отладки
    console.log('Countries after conversion:', countries);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{editingUser ? 'Edit User' : 'Add New User'}</DialogTitle>
                    <DialogDescription>
                        {editingUser ? 'Update user details' : 'Create a new user account'}
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="first_name">First Name *</Label>
                            <Input
                                id="first_name"
                                value={userForm.first_name || ''}
                                onChange={(e) => setUserForm({ ...userForm, first_name: e.target.value })}
                                placeholder="Enter first name"
                                className={errors.first_name ? 'border-red-500' : ''}
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
                            />
                            {errors.last_name && (
                                <p className="text-sm text-red-500">{errors.last_name}</p>
                            )}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input
                            id="email"
                            type="email"
                            value={userForm.email || ''}
                            onChange={(e) => handleEmailChange(e.target.value)}
                            placeholder="Enter email address"
                            className={errors.email ? 'border-red-500' : ''}
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

                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="position">Position *</Label>
                            <Select
                                value={safeToString(userForm.position_id)}
                                onValueChange={(value: string) =>
                                    setUserForm({ ...userForm, position_id: parseInt(value) })
                                }
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
                        <div className="space-y-2">
                            <Label htmlFor="department_role">Department Role *</Label>
                            <Select
                                value={safeToString(userForm.department_role_id)}
                                onValueChange={(value: string) =>
                                    setUserForm({ ...userForm, department_role_id: parseInt(value) })
                                }
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
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="country">Country *</Label>
                        <Select
                            value={safeToString(userForm.country_id)}
                            onValueChange={(value: string) =>
                                setUserForm({ ...userForm, country_id: parseInt(value) })
                            }
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

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="role">System Role *</Label>
                            <Select
                                value={userForm.role || 'user'}
                                onValueChange={(value: 'admin' | 'user' | 'manager') =>
                                    setUserForm({ ...userForm, role: value })
                                }
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
                <DialogFooter>
                    <Button variant="outline" onClick={handleClose}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSaveUser}
                        style={{ backgroundColor: '#1F4E78' }}
                        disabled={!userForm.email?.trim() || !userForm.first_name?.trim() || !userForm.last_name?.trim()}
                    >
                        {editingUser ? 'Save Changes' : 'Add User'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}