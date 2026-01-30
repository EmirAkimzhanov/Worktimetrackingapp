// src/components/admin/TeamsTab.tsx
import React, { useState, useEffect, forwardRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Badge } from '../../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import { Plus, Edit, Trash2, X, Users, Building, Search, Check, UserPlus, Crown, MoreVertical, AlertCircle, Key, Briefcase } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../ui/dropdown-menu';
import { Label } from '../../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../../ui/dialog';
import { toast } from 'sonner';
import { useUserStore } from '../../../store/UsersStore';

interface OrganizationMember {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    grade: string | null;
    position: string | null;
    department: string;
    department_role: string;
    role: string | null;
    country: string;
    is_active: boolean;
    date_joined: string;
    date_left: string | null;
}

interface DepartmentGroup {
    id: number;
    name: string;
    code: string;
    managers: OrganizationMember[]; // Теперь храним объекты менеджеров
    managerIds: number[]; // Массив ID менеджеров
    members: OrganizationMember[];
}

interface BusinessUnit {
    id: number;
    name: string;
    departments: DepartmentGroup[];
}

interface Employee {
    id: number;
    name: string;
    department?: string;
    role?: string;
    email?: string;
    status: 'active' | 'inactive';
}

interface Role {
    id: number;
    name: string;
    description?: string;
}

// Интерфейс для department_roles из store
interface DepartmentRole {
    id: number;
    name: string;
    // добавьте другие поля если они есть в ваших данных
}

// Интерфейс для уведомлений
interface Notification {
    id: number;
    message: string;
    type: 'success' | 'error' | 'info';
}

// Компонент модального окна добавления сотрудника
const AddMemberModal = ({
    department,
    allEmployees,
    businessUnits,
    departmentRoles,
    onClose,
    onAdd
}: {
    department: DepartmentGroup;
    allEmployees: Employee[];
    businessUnits: BusinessUnit[];
    departmentRoles: DepartmentRole[];
    onClose: () => void;
    onAdd: (member: OrganizationMember) => void;
}) => {
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
    const [employeeRole, setEmployeeRole] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState<string>('');

    // Получить доступных сотрудников для отдела
    const getAvailableEmployees = () => {
        const currentDepartment = businessUnits[0].departments.find(d => d.id === department.id);
        if (!currentDepartment) return allEmployees;

        const assignedEmployeeIds = currentDepartment.members.map(m => m.id.toString());

        return allEmployees.filter(emp =>
            (emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                emp.email?.toLowerCase().includes(searchQuery.toLowerCase())) &&
            !assignedEmployeeIds.includes(emp.id.toString()) &&
            emp.status === 'active'
        );
    };

    const availableEmployees = getAvailableEmployees();
    const selectedEmployee = allEmployees.find(e => e.id.toString() === selectedEmployeeId);

    // Обработчик клавиши Escape
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        document.addEventListener('keydown', handleEscape);

        return () => {
            document.removeEventListener('keydown', handleEscape);
        };
    }, [onClose]);

    const handleAdd = () => {
        if (!selectedEmployee) return;

        const newMember: OrganizationMember = {
            id: Date.now(),
            first_name: selectedEmployee.name.split(' ')[0],
            last_name: selectedEmployee.name.split(' ').slice(1).join(' ') || '',
            email: selectedEmployee.email || '',
            grade: null,
            position: selectedEmployee.role || null,
            department: department.name,
            department_role: employeeRole === 'Manager' ? 'Manager' : employeeRole || 'Member',
            role: employeeRole === 'Manager' ? 'operational' : null,
            country: 'KG',
            is_active: true,
            date_joined: new Date().toISOString(),
            date_left: null
        };

        onAdd(newMember);
        onClose();
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div className="bg-background rounded-lg shadow-lg border w-full max-w-2xl flex flex-col" style={{ width: '40%', height: '600px' }}>
                {/* Заголовок */}
                <div className="flex items-center justify-between p-4 border-b shrink-0">
                    <div>
                        <h2 className="text-lg font-semibold">Add Member to {department.name}</h2>
                        <p className="text-sm text-muted-foreground mt-1">
                            Select an employee to add to this department
                        </p>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="h-8 w-8"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                {/* Основной контент с фиксированной высотой и скроллом */}
                <div className="flex-1 overflow-hidden flex flex-col p-4">
                    {/* Поиск и роль */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 shrink-0">
                        <div className="space-y-2">
                            <Label htmlFor="modal-search-employees" className="text-sm font-medium">
                                Search Employees
                            </Label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input
                                    id="modal-search-employees"
                                    placeholder="Type to search..."
                                    className="pl-10 h-9"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="modal-employee-role" className="text-sm font-medium">
                                Department Role
                            </Label>
                            <Select value={employeeRole} onValueChange={setEmployeeRole}>
                                <SelectTrigger id="modal-employee-role" className="h-9">
                                    <SelectValue placeholder="Select a role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="no-role">No role</SelectItem>
                                    {departmentRoles.map(role => (
                                        <SelectItem key={role.id} value={role.name}>
                                            {role.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Заголовок списка */}
                    <div className="shrink-0 mb-2">
                        <Label className="text-sm font-medium">
                            Available Employees ({availableEmployees.length})
                        </Label>
                    </div>

                    {/* Список сотрудников с фиксированной высотой и скроллом */}
                    <div className="flex-1 min-h-0 border rounded-lg overflow-hidden">
                        {availableEmployees.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center p-6">
                                <Users className="w-10 h-10 text-gray-300 mb-3" />
                                <p className="text-gray-500 text-sm text-center">
                                    No available employees found
                                </p>
                                {searchQuery && (
                                    <p className="text-gray-400 text-xs mt-1">
                                        Try a different search term
                                    </p>
                                )}
                            </div>
                        ) : (
                            <div className="h-full overflow-y-auto">
                                <div className="divide-y">
                                    {availableEmployees.map((employee) => (
                                        <div
                                            key={employee.id}
                                            className={`p-3 cursor-pointer transition-colors ${selectedEmployeeId === employee.id.toString()
                                                ? 'bg-blue-50 dark:bg-blue-900/20 border-l-2 border-blue-500'
                                                : 'hover:bg-gray-50 dark:hover:bg-gray-900/50'
                                                }`}
                                            onClick={() => setSelectedEmployeeId(employee.id.toString())}
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="min-w-0 flex-1">
                                                    <div className="font-medium text-sm">{employee.name}</div>
                                                    <div className="text-xs text-gray-500 mt-0.5">
                                                        {employee.email}
                                                    </div>
                                                    {employee.department && (
                                                        <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                                                            <Building className="w-3 h-3" />
                                                            {employee.department}
                                                        </div>
                                                    )}
                                                </div>
                                                {selectedEmployeeId === employee.id.toString() && (
                                                    <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Выбранный сотрудник */}
                    {selectedEmployee && (
                        <div className="mt-4 shrink-0">
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                                <div className="flex items-start gap-2">
                                    <Check className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                    <div className="text-sm flex-1">
                                        <div className="font-medium text-sm">Selected Employee</div>
                                        <div className="mt-1">
                                            <div className="font-medium">
                                                {selectedEmployee.name}
                                            </div>
                                            {employeeRole && employeeRole !== 'no-role' && (
                                                <div className="mt-1 flex items-center gap-2">
                                                    <Badge variant="outline" className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                                                        {employeeRole}
                                                    </Badge>
                                                    <span className="text-xs text-gray-500">will be assigned as this role</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Футер */}
                <div className="border-t p-4 shrink-0">
                    <div className="flex items-center justify-end gap-2">
                        <Button
                            variant="outline"
                            onClick={onClose}
                            className="h-9"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleAdd}
                            disabled={!selectedEmployeeId}
                            className="h-9"
                        >
                            <UserPlus className="w-4 h-4 mr-2" />
                            Add to Department
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Компонент модального окна добавления отдела
const AddDepartmentModal = ({
    onClose,
    onAdd,
    businessUnits,
    departmentRoles,
    allEmployees
}: {
    onClose: () => void;
    onAdd: (department: DepartmentGroup) => void;
    businessUnits: BusinessUnit[];
    departmentRoles: DepartmentRole[];
    allEmployees: Employee[];
}) => {
    const [departmentName, setDepartmentName] = useState('');
    const [departmentCode, setDepartmentCode] = useState('');
    const [selectedManagerIds, setSelectedManagerIds] = useState<number[]>([]);

    const handleAdd = () => {
        if (!departmentName.trim()) return;

        const newDepartment: DepartmentGroup = {
            id: Date.now(),
            name: departmentName,
            code: departmentCode || departmentName.substring(0, 3).toUpperCase(),
            managers: [],
            managerIds: [],
            members: []
        };

        if (selectedManagerIds.length > 0) {
            selectedManagerIds.forEach(managerId => {
                const manager = allEmployees.find(e => e.id === managerId);
                if (manager) {
                    const managerObj: OrganizationMember = {
                        id: manager.id,
                        first_name: manager.name.split(' ')[0],
                        last_name: manager.name.split(' ').slice(1).join(' ') || '',
                        email: manager.email || '',
                        grade: null,
                        position: manager.role || null,
                        department: departmentName,
                        department_role: 'Manager',
                        role: 'operational',
                        country: 'KG',
                        is_active: true,
                        date_joined: new Date().toISOString(),
                        date_left: null
                    };
                    newDepartment.managers.push(managerObj);
                    newDepartment.managerIds.push(manager.id);
                }
            });
        }

        onAdd(newDepartment);
        onClose();
    };

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="
    w-[60vw]
    max-w-none
    min-w-[600px]
    max-h-[80vh]
  ">
                <DialogHeader>
                    <DialogTitle>Add New Department</DialogTitle>
                    <DialogDescription>
                        Create a new department for your organization
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label htmlFor="department-name">Department Name *</Label>
                        <Input
                            id="department-name"
                            value={departmentName}
                            onChange={(e) => setDepartmentName(e.target.value)}
                            placeholder="e.g., Engineering"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="department-code">Code (Optional)</Label>
                        <Input
                            id="department-code"
                            value={departmentCode}
                            onChange={(e) => setDepartmentCode(e.target.value)}
                            placeholder="e.g., ENG"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="department-managers">Managers (Optional)</Label>
                        <Select
                            value=""
                            onValueChange={(value) => {
                                if (value && !selectedManagerIds.includes(parseInt(value))) {
                                    setSelectedManagerIds([...selectedManagerIds, parseInt(value)]);
                                }
                            }}
                        >
                            <SelectTrigger id="department-managers">
                                <SelectValue placeholder="Select managers" />
                            </SelectTrigger>
                            <SelectContent>
                                {allEmployees.map(employee => (
                                    <SelectItem key={employee.id} value={employee.id.toString()}>
                                        {employee.name} ({employee.email})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {selectedManagerIds.length > 0 && (
                            <div className="mt-2 space-y-2">
                                <div className="text-sm font-medium">Selected Managers:</div>
                                <div className="flex flex-wrap gap-2">
                                    {selectedManagerIds.map(managerId => {
                                        const manager = allEmployees.find(e => e.id === managerId);
                                        return (
                                            <Badge
                                                key={managerId}
                                                variant="secondary"
                                                className="flex items-center gap-1"
                                            >
                                                {manager?.name}
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedManagerIds(selectedManagerIds.filter(id => id !== managerId));
                                                    }}
                                                    className="ml-1 hover:text-red-500"
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </Badge>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={handleAdd} disabled={!departmentName.trim()}>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Department
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

// Компонент модального окна создания роли
const CreateRoleModal = ({
    onClose,
    onAdd
}: {
    onClose: () => void;
    onAdd: (role: Role) => void;
}) => {
    const [roleName, setRoleName] = useState('');
    const [roleDescription, setRoleDescription] = useState('');

    const handleAdd = () => {
        if (!roleName.trim()) return;

        const newRole: Role = {
            id: Date.now(),
            name: roleName,
            description: roleDescription || undefined
        };

        onAdd(newRole);
        onClose();
    };

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Create New Role</DialogTitle>
                    <DialogDescription>
                        Add a new role that can be assigned to employees
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label htmlFor="role-name">Role Name *</Label>
                        <Input
                            id="role-name"
                            value={roleName}
                            onChange={(e) => setRoleName(e.target.value)}
                            placeholder="e.g., Senior Developer"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="role-description">Description (Optional)</Label>
                        <Input
                            id="role-description"
                            value={roleDescription}
                            onChange={(e) => setRoleDescription(e.target.value)}
                            placeholder="Describe the role responsibilities..."
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={handleAdd} disabled={!roleName.trim()}>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Role
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

// Компонент уведомления
const NotificationToast = ({ notification, onClose }: { notification: Notification, onClose: () => void }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 3000);

        return () => clearTimeout(timer);
    }, [onClose]);

    const bgColor = notification.type === 'success'
        ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
        : notification.type === 'error'
            ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
            : 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800';

    const textColor = notification.type === 'success'
        ? 'text-green-800 dark:text-green-300'
        : notification.type === 'error'
            ? 'text-red-800 dark:text-red-300'
            : 'text-blue-800 dark:text-blue-300';

    const iconColor = notification.type === 'success'
        ? 'text-green-600 dark:text-green-400'
        : notification.type === 'error'
            ? 'text-red-600 dark:text-red-400'
            : 'text-blue-600 dark:text-blue-400';

    return (
        <div className={`fixed top-4 right-4 z-50 w-80 ${bgColor} border rounded-lg shadow-lg p-4 animate-in slide-in-from-right-5`}>
            <div className="flex items-start gap-3">
                <div className={`${iconColor} flex-shrink-0`}>
                    {notification.type === 'success' ? (
                        <Check className="h-5 w-5" />
                    ) : notification.type === 'error' ? (
                        <AlertCircle className="h-5 w-5" />
                    ) : (
                        <AlertCircle className="h-5 w-5" />
                    )}
                </div>
                <div className="flex-1">
                    <p className={`text-sm font-medium ${textColor}`}>
                        {notification.message}
                    </p>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    className="h-6 w-6 -mt-1 -mr-1"
                >
                    <X className="h-3 w-3" />
                </Button>
            </div>
        </div>
    );
};

export function TeamsTab() {
    const departments = useUserStore((state) => state.departments);
    const department_roles = useUserStore((state) => state.department_roles);

    // Конвертируем данные из departments в структуру для отображения
    const convertToBusinessUnits = (depts: any[] | null): BusinessUnit[] => {
        if (!depts || depts.length === 0) {
            return [
                {
                    id: 1,
                    name: 'Business Unit (EU)',
                    departments: []
                }
            ];
        }

        return [
            {
                id: 1,
                name: 'Business Unit (EU)',
                departments: depts.map(dept => ({
                    id: dept.id,
                    name: dept.name,
                    code: dept.name.substring(0, 3).toUpperCase(),
                    managers: dept.managers.map((manager: any) => ({
                        ...manager,
                        department: dept.name,
                        department_role: 'Manager'
                    })),
                    managerIds: dept.managers.map((m: any) => m.id),
                    members: [...dept.managers.map((manager: any) => ({
                        ...manager,
                        department: dept.name,
                        department_role: 'Manager'
                    })), ...dept.members.map((member: any) => ({
                        ...member,
                        department: dept.name
                    }))]
                }))
            }
        ];
    };

    const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
    const [businessUnits, setBusinessUnits] = useState<BusinessUnit[]>([]);

    // Инициализируем данные из departments
    useEffect(() => {
        if (departments) {
            const businessUnitsData = convertToBusinessUnits(departments);
            setBusinessUnits(businessUnitsData);

            // Создаем список всех сотрудников из departments (включая менеджеров)
            const allEmps: Employee[] = [];
            departments.forEach(dept => {
                // Добавляем менеджеров
                dept.managers.forEach((manager: any) => {
                    allEmps.push({
                        id: manager.id,
                        name: `${manager.first_name} ${manager.last_name}`,
                        department: manager.department,
                        role: manager.department_role,
                        email: manager.email,
                        status: manager.is_active ? 'active' : 'inactive'
                    });
                });

                // Добавляем обычных членов
                dept.members.forEach((member: any) => {
                    if (!allEmps.some(emp => emp.id === member.id)) {
                        allEmps.push({
                            id: member.id,
                            name: `${member.first_name} ${member.last_name}`,
                            department: member.department,
                            role: member.department_role,
                            email: member.email,
                            status: member.is_active ? 'active' : 'inactive'
                        });
                    }
                });
            });
            setAllEmployees(allEmps);
        } else {
            // Fallback данные если departments пустые
            setBusinessUnits([
                {
                    id: 1,
                    name: 'Business Unit (EU)',
                    departments: []
                }
            ]);
            setAllEmployees([]);
        }
    }, [departments]);

    // Список ролей (изначальный, может быть удален если используем только department_roles)
    const [roles, setRoles] = useState<Role[]>([
        { id: 1, name: 'Developer', description: 'Software development' },
        { id: 2, name: 'Designer', description: 'UI/UX design' },
        { id: 3, name: 'Manager', description: 'Team management' },
        { id: 4, name: 'Analyst', description: 'Business analysis' },
        { id: 5, name: 'Tester', description: 'Quality assurance' },
    ]);

    // Состояния для редактирования
    const [editingCell, setEditingCell] = useState<{
        type: 'department' | 'member' | 'manager';
        departmentId?: number;
        memberId?: number;
        field: string;
        value: string;
    } | null>(null);

    const [tempValue, setTempValue] = useState('');
    const [showAddMemberModal, setShowAddMemberModal] = useState(false);
    const [showAddDepartmentModal, setShowAddDepartmentModal] = useState(false);
    const [showCreateRoleModal, setShowCreateRoleModal] = useState(false);
    const [selectedDepartment, setSelectedDepartment] = useState<DepartmentGroup | null>(null);
    const [showManagerModal, setShowManagerModal] = useState<number | null>(null);

    // Состояния для уведомлений
    const [notifications, setNotifications] = useState<Notification[]>([]);

    // Добавить уведомление
    const addNotification = (message: string, type: 'success' | 'error' | 'info') => {
        const id = Date.now();
        setNotifications(prev => [...prev, { id, message, type }]);
    };

    // Удалить уведомление
    const removeNotification = (id: number) => {
        setNotifications(prev => prev.filter(notification => notification.id !== id));
    };

    // Проверяем, является ли сотрудник менеджером отдела
    const isEmployeeManager = (department: DepartmentGroup, member: OrganizationMember) => {
        return department.managerIds.includes(member.id);
    };

    // Получить всех сотрудников отдела (включая менеджеров)
    const getAllDepartmentMembers = (department: DepartmentGroup): OrganizationMember[] => {
        // Менеджеры уже включены в members, но для ясности объединяем
        return department.members;
    };

    // Функция для принудительного обновления интерфейса
    const forceUpdate = useState({})[1];

    // Начать редактирование ячейки
    const startEditing = (
        type: 'department' | 'member' | 'manager',
        departmentId?: number,
        memberId?: number,
        field: string,
        currentValue: string
    ) => {
        // Преобразуем значение для редактирования
        let editingValue = currentValue;
        if (field === 'role' && currentValue === '') {
            editingValue = 'no-role';
        }

        setEditingCell({ type, departmentId, memberId, field, value: editingValue });
        setTempValue(editingValue);
    };

    // Конвертировать значение для отображения
    const convertForDisplay = (value: string): string => {
        if (value === 'no-role') return '';
        return value;
    };

    // Рендер редактируемой ячейки с выпадающим списком (автосохранение)
    const renderEditableSelectCell = (
        value: string,
        type: 'department' | 'member' | 'manager',
        departmentId?: number,
        memberId?: number,
        field: string = 'name',
        options: { value: string; label: string }[] = []
    ) => {
        const isEditing = editingCell?.type === type &&
            editingCell?.departmentId === departmentId &&
            editingCell?.memberId === memberId &&
            editingCell?.field === field;

        const handleSelectChange = (newValue: string) => {
            // Сохраняем изменения сразу при выборе значения
            if (!departmentId) return;

            let finalValue = newValue;

            // Конвертируем специальные значения в пустую строку для хранения
            if (newValue === 'no-role') {
                finalValue = '';
            }

            if (type === 'member' && memberId) {
                // Редактирование сотрудника
                setBusinessUnits(prev => {
                    const updated = [...prev];
                    const department = updated[0].departments.find(d => d.id === departmentId);
                    if (department) {
                        const member = department.members.find(m => m.id === memberId);
                        if (member) {
                            const oldValue = field === 'role' ? member.role : '';
                            if (field === 'role') {
                                member.role = finalValue || undefined;
                                if (oldValue !== finalValue) {
                                    toast.success(
                                        `Role for "${member.first_name} ${member.last_name}" has been updated to "${finalValue || 'No role'}"`,
                                        // 'success'
                                    );
                                }
                            }
                        }
                    }
                    return updated;
                });
                // Принудительно обновляем интерфейс
                forceUpdate({});
            }

            // Закрываем режим редактирования
            setEditingCell(null);
            setTempValue('');
        };

        if (isEditing) {
            const selectValue = tempValue || (value === '' ? 'no-role' : value);

            return (
                <div className="flex items-center gap-1">
                    <Select
                        value={selectValue}
                        onValueChange={handleSelectChange}
                        autoFocus
                    >
                        <SelectTrigger className="h-7 text-sm">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {options.map(option => (
                                <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button size="icon" variant="ghost" onClick={() => {
                        setEditingCell(null);
                        setTempValue('');
                    }} className="h-6 w-6">
                        <X className="h-3 w-3" />
                    </Button>
                </div>
            );
        }

        const displayValue = convertForDisplay(value);

        return (
            <div
                className="group flex items-center gap-1 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 px-1 py-0.5 rounded"
                onClick={() => {
                    startEditing(type, departmentId, memberId, field, value);
                }}
            >
                <span className="text-sm">{displayValue || '-'}</span>
                <Edit className="h-3 w-3 opacity-0 group-hover:opacity-50 text-gray-400" />
            </div>
        );
    };

    // Рендер редактируемой ячейки с department_roles
    const renderEditableDepartmentRoleCell = (
        value: string,
        type: 'department' | 'member' | 'manager',
        departmentId?: number,
        memberId?: number,
        field: string = 'department_role'
    ) => {
        const isEditing = editingCell?.type === type &&
            editingCell?.departmentId === departmentId &&
            editingCell?.memberId === memberId &&
            editingCell?.field === field;

        const handleSelectChange = (newValue: string) => {
            // Сохраняем изменения сразу при выборе значения
            if (!departmentId || !memberId) return;

            let finalValue = newValue;

            // Конвертируем специальные значения в пустую строку для хранения
            if (newValue === 'no-role') {
                finalValue = '';
            }

            // Редактирование сотрудника
            setBusinessUnits(prev => {
                const updated = [...prev];
                const department = updated[0].departments.find(d => d.id === departmentId);
                if (department) {
                    const member = department.members.find(m => m.id === memberId);
                    if (member) {
                        const oldValue = member.department_role;
                        member.department_role = finalValue || 'Member';

                        // Если ставим роль менеджера, добавляем в список менеджеров
                        if (finalValue === 'Manager' && !department.managerIds.includes(member.id)) {
                            department.managers.push(member);
                            department.managerIds.push(member.id);
                        }
                        // Если убираем роль менеджера, удаляем из списка менеджеров
                        else if (finalValue !== 'Manager' && department.managerIds.includes(member.id)) {
                            department.managers = department.managers.filter(m => m.id !== member.id);
                            department.managerIds = department.managerIds.filter(id => id !== member.id);
                        }

                        if (oldValue !== finalValue) {
                            toast.success(
                                `Department role for "${member.first_name} ${member.last_name}" has been updated to "${finalValue || 'Member'}"`,
                                // 'success'
                            );
                        }
                    }
                }
                return updated;
            });

            // Принудительно обновляем интерфейс
            forceUpdate({});

            // Закрываем режим редактирования
            setEditingCell(null);
            setTempValue('');
        };

        if (isEditing) {
            const selectValue = tempValue || (value === '' ? 'no-role' : value);

            return (
                <div className="flex items-center gap-1">
                    <Select
                        value={selectValue}
                        onValueChange={handleSelectChange}
                        autoFocus
                    >
                        <SelectTrigger className="h-7 text-sm">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="no-role">No role</SelectItem>
                            {department_roles && department_roles.length > 0 ? (
                                department_roles.map(role => (
                                    <SelectItem key={role.id} value={role.name}>
                                        {role.name}
                                    </SelectItem>
                                ))
                            ) : (
                                <>
                                    <SelectItem value="Member">Member</SelectItem>
                                    <SelectItem value="Manager">Manager</SelectItem>
                                </>
                            )}
                        </SelectContent>
                    </Select>
                    <Button size="icon" variant="ghost" onClick={() => {
                        setEditingCell(null);
                        setTempValue('');
                    }} className="h-6 w-6">
                        <X className="h-3 w-3" />
                    </Button>
                </div>
            );
        }

        const displayValue = convertForDisplay(value);

        return (
            <div
                className="group flex items-center gap-1 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 px-1 py-0.5 rounded"
                onClick={() => {
                    startEditing(type, departmentId, memberId, field, value);
                }}
            >
                <span className="text-sm font-medium">{displayValue || 'Member'}</span>
                <Edit className="h-3 w-3 opacity-0 group-hover:opacity-50 text-gray-400" />
            </div>
        );
    };

    // Рендер редактируемой ячейки с инпутом
    const renderEditableInputCell = (
        value: string,
        type: 'department' | 'member' | 'manager',
        departmentId?: number,
        memberId?: number,
        field: string = 'name'
    ) => {
        const isEditing = editingCell?.type === type &&
            editingCell?.departmentId === departmentId &&
            editingCell?.memberId === memberId &&
            editingCell?.field === field;

        const handleSave = () => {
            if (!editingCell || !tempValue.trim()) return;

            const { type, departmentId, memberId, field } = editingCell;

            if (type === 'department' && departmentId) {
                // Редактирование отдела
                setBusinessUnits(prev => {
                    const updated = [...prev];
                    const department = updated[0].departments.find(d => d.id === departmentId);
                    if (department) {
                        if (field === 'name') {
                            const oldValue = department.name;
                            department.name = tempValue;
                            if (oldValue !== tempValue) {
                                toast.success(
                                    `Department name has been updated to "${tempValue}"`,
                                    // 'success'
                                );
                            }
                        }
                        if (field === 'code') {
                            const oldValue = department.code;
                            department.code = tempValue;
                            if (oldValue !== tempValue) {
                                toast.success(
                                    `Department code has been updated to "${tempValue}"`,
                                    // 'success'
                                );
                            }
                        }
                    }
                    return updated;
                });
            } else if (type === 'member' && departmentId && memberId) {
                // Редактирование сотрудника
                setBusinessUnits(prev => {
                    const updated = [...prev];
                    const department = updated[0].departments.find(d => d.id === departmentId);
                    if (department) {
                        const member = department.members.find(m => m.id === memberId);
                        if (member) {
                            const oldValue = member[field as keyof OrganizationMember];
                            if (field === 'first_name') {
                                const names = tempValue.split(' ');
                                member.first_name = names[0];
                                member.last_name = names.slice(1).join(' ') || member.last_name;
                            }
                            if (field === 'email') member.email = tempValue;

                            if (oldValue !== tempValue) {
                                toast.success(
                                    `Employee "${member.first_name} ${member.last_name}" has been updated successfully`,
                                    // 'success'
                                );
                            }
                        }
                    }
                    return updated;
                });
                // Принудительно обновляем интерфейс
                forceUpdate({});
            }

            setEditingCell(null);
            setTempValue('');
        };

        const handleKeyDown = (e: React.KeyboardEvent) => {
            if (e.key === 'Enter') {
                handleSave();
            }
            if (e.key === 'Escape') {
                setEditingCell(null);
                setTempValue('');
            }
        };

        if (isEditing) {
            return (
                <div className="flex items-center gap-1">
                    <Input
                        value={tempValue}
                        onChange={(e) => setTempValue(e.target.value)}
                        className="h-7 text-sm"
                        autoFocus
                        onKeyDown={handleKeyDown}
                    />
                    <div className="flex gap-0.5">
                        <Button size="icon" variant="ghost" onClick={handleSave} className="h-6 w-6">
                            <Check className="h-3 w-3" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => {
                            setEditingCell(null);
                            setTempValue('');
                        }} className="h-6 w-6">
                            <X className="h-3 w-3" />
                        </Button>
                    </div>
                </div>
            );
        }

        return (
            <div
                className="group flex items-center gap-1 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 px-1 py-0.5 rounded"
                onClick={() => startEditing(type, departmentId, memberId, field, value)}
            >
                <span className="text-sm">{value || '-'}</span>
                <Edit className="h-3 w-3 opacity-0 group-hover:opacity-50 text-gray-400" />
            </div>
        );
    };

    // Отменить редактирование
    const cancelEdit = () => {
        setEditingCell(null);
        setTempValue('');
    };

    // Добавить сотрудника в отдел с уведомлением
    const addMemberToDepartment = (newMember: OrganizationMember) => {
        if (!selectedDepartment) return;

        setBusinessUnits(prev => {
            const updated = [...prev];
            const department = updated[0].departments.find(d => d.id === selectedDepartment.id);
            if (department) {
                department.members.push(newMember);

                // Если добавляем менеджера, добавляем его в список менеджеров
                if (newMember.department_role === 'Manager') {
                    department.managers.push(newMember);
                    department.managerIds.push(newMember.id);
                }

                // Уведомление об успешном добавлении
                toast.success(
                    `Employee "${newMember.first_name} ${newMember.last_name}" has been added to ${department.name} department`,
                    // 'success'
                );
            }
            return updated;
        });

        // Закрыть модальное окно
        setShowAddMemberModal(false);
        setSelectedDepartment(null);

        // Принудительно обновляем интерфейс
        forceUpdate({});
    };

    // Добавить отдел с уведомлением
    const addDepartment = (newDepartment: DepartmentGroup) => {
        setBusinessUnits(prev => {
            const updated = [...prev];
            updated[0].departments.push(newDepartment);
            return updated;
        });

        // Уведомление об успешном создании
        toast.success(
            `Department "${newDepartment.name}" has been created successfully`,
            // 'success'
        );

        setShowAddDepartmentModal(false);

        // Принудительно обновляем интерфейс
        forceUpdate({});
    };

    // Добавить роль с уведомлением
    const addRole = (newRole: Role) => {
        setRoles(prev => [...prev, newRole]);

        // Уведомление об успешном создании
        toast.success(
            `Role "${newRole.name}" has been created successfully`,
            // 'success'
        );

        setShowCreateRoleModal(false);
    };

    // Удалить сотрудника из отдела с уведомлением
    const removeMemberFromDepartment = (departmentId: number, memberId: number) => {
        let memberName = '';

        setBusinessUnits(prev => {
            const updated = [...prev];
            const department = updated[0].departments.find(d => d.id === departmentId);
            if (department) {
                const member = department.members.find(m => m.id === memberId);
                if (member) {
                    memberName = `${member.first_name} ${member.last_name}`;

                    // Если удаляем менеджера, удаляем его из списка менеджеров
                    if (department.managerIds.includes(member.id)) {
                        department.managers = department.managers.filter(m => m.id !== member.id);
                        department.managerIds = department.managerIds.filter(id => id !== member.id);
                    }
                }
                department.members = department.members.filter(m => m.id !== memberId);
            }
            return updated;
        });

        // Уведомление об успешном удалении
        if (memberName) {
            toast.success(
                `Employee "${memberName}" has been removed from department`,
                // 'success'
            );
        }

        // Принудительно обновляем интерфейс
        forceUpdate({});
    };

    // Удалить отдел с уведомлением
    const removeDepartment = (departmentId: number) => {
        let departmentName = '';

        setBusinessUnits(prev => {
            const updated = [...prev];
            const department = updated[0].departments.find(d => d.id === departmentId);
            if (department) {
                departmentName = department.name;
                updated[0].departments = updated[0].departments.filter(d => d.id !== departmentId);
            }
            return updated;
        });

        // Уведомление об успешном удалении
        if (departmentName) {
            toast.success(
                `Department "${departmentName}" has been deleted`,
                // 'success'
            );
        }

        // Принудительно обновляем интерфейс
        forceUpdate({});
    };

    // Получить опции для ролей
    const getRoleOptions = () => {
        return [{ value: 'no-role', label: 'No role' }, ...roles.map(r => ({ value: r.name, label: r.name }))];
    };

    // Получить опции для department_roles
    const getDepartmentRoleOptions = () => {
        if (department_roles && department_roles.length > 0) {
            return [{ value: 'no-role', label: 'No role' }, ...department_roles.map(r => ({ value: r.name, label: r.name }))];
        }
        return [
            { value: 'no-role', label: 'No role' },
            { value: 'Member', label: 'Member' },
            { value: 'Manager', label: 'Manager' }
        ];
    };

    // Рендер ячейки менеджера с галочкой
    const renderManagerCell = (department: DepartmentGroup, member: OrganizationMember) => {
        const isManager = isEmployeeManager(department, member);

        return (
            <div className="text-center">
                {isManager ? (
                    <div className="flex items-center justify-center">
                        <Badge variant="outline" className="flex items-center gap-1 bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300">
                            <Crown className="h-3 w-3" />
                            Manager
                        </Badge>
                    </div>
                ) : (
                    <Badge variant="outline" className="flex items-center gap-1">
                        {member.department_role || 'Member'}
                    </Badge>
                )}
            </div>
        );
    };

    // Назначить/снять с должности менеджера
    const toggleEmployeeManager = (departmentId: number, member: OrganizationMember) => {
        if (!member.id) {
            toast.error('Employee does not have an id');
            return;
        }

        setBusinessUnits(prev => {
            const updated = [...prev];
            const department = updated[0].departments.find(d => d.id === departmentId);
            if (department) {
                const isCurrentlyManager = department.managerIds.includes(member.id);
                const memberName = `${member.first_name} ${member.last_name}`;

                if (isCurrentlyManager) {
                    // Снимаем с должности менеджера
                    department.managers = department.managers.filter(m => m.id !== member.id);
                    department.managerIds = department.managerIds.filter(id => id !== member.id);
                    member.department_role = 'Member';
                    toast.success(
                        `${memberName} has been removed as manager of ${department.name}`
                    );
                } else {
                    // Назначаем менеджером
                    department.managers.push(member);
                    department.managerIds.push(member.id);
                    member.department_role = 'Manager';
                    toast.success(
                        `${memberName} has been appointed as manager of ${department.name}`
                    );
                }
            }
            return updated;
        });

        // Принудительно обновляем интерфейс
        forceUpdate({});
    };

    // Получить список менеджеров для отдела
    const getDepartmentManagers = (departmentId: number) => {
        const department = businessUnits[0]?.departments.find(d => d.id === departmentId);
        return department ? department.managers : [];
    };

    // Модальное окно управления менеджерами
    const ManagerManagementModal = ({ departmentId, onClose }: { departmentId: number, onClose: () => void }) => {
        const department = businessUnits[0]?.departments.find(d => d.id === departmentId);
        const [selectedManagerIds, setSelectedManagerIds] = useState<number[]>(
            department ? [...department.managerIds] : []
        );

        const handleSave = () => {
            if (!department) return;

            setBusinessUnits(prev => {
                const updated = [...prev];
                const dept = updated[0].departments.find(d => d.id === departmentId);
                if (dept) {
                    // Сначала сбрасываем всех менеджеров
                    dept.members.forEach(member => {
                        if (dept.managerIds.includes(member.id)) {
                            member.department_role = 'Member';
                        }
                    });

                    // Получаем выбранных менеджеров
                    const selectedManagers: OrganizationMember[] = [];
                    dept.members.forEach(member => {
                        if (selectedManagerIds.includes(member.id)) {
                            member.department_role = 'Manager';
                            selectedManagers.push(member);
                        }
                    });

                    dept.managers = selectedManagers;
                    dept.managerIds = selectedManagerIds;

                    toast.success(
                        `Managers for ${dept.name} have been updated`
                    );
                }
                return updated;
            });

            onClose();
            forceUpdate({});
        };

        if (!department) return null;

        return (
            <Dialog open={true} onOpenChange={onClose}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Manage Managers for {department.name}</DialogTitle>
                        <DialogDescription>
                            Select multiple employees as managers for this department
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label>Available Employees</Label>
                            <div className="max-h-60 overflow-y-auto border rounded-md p-2">
                                {department.members.map((member) => (
                                    <div key={member.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={selectedManagerIds.includes(member.id)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedManagerIds([...selectedManagerIds, member.id]);
                                                    } else {
                                                        setSelectedManagerIds(selectedManagerIds.filter(id => id !== member.id));
                                                    }
                                                }}
                                                className="h-4 w-4"
                                            />
                                            <div>
                                                <div className="font-medium text-sm">{member.first_name} {member.last_name}</div>
                                                <div className="text-xs text-gray-500">{member.position || 'No position'}</div>
                                            </div>
                                        </div>
                                        {selectedManagerIds.includes(member.id) && (
                                            <Crown className="h-4 w-4 text-yellow-500" />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {selectedManagerIds.length > 0 && (
                            <div className="space-y-2">
                                <Label>Selected Managers ({selectedManagerIds.length})</Label>
                                <div className="flex flex-wrap gap-2 p-2 border rounded-md">
                                    {selectedManagerIds.map(managerId => {
                                        const member = department.members.find(m => m.id === managerId);
                                        return member ? (
                                            <Badge key={managerId} variant="secondary" className="flex items-center gap-1">
                                                <Crown className="h-3 w-3" />
                                                {member.first_name} {member.last_name}
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedManagerIds(selectedManagerIds.filter(id => id !== managerId))}
                                                    className="ml-1 hover:text-red-500"
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </Badge>
                                        ) : null;
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button onClick={handleSave}>
                            Save Managers
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        );
    };

    return (
        <div className="space-y-6">
            {/* Уведомления */}
            {notifications.map((notification) => (
                <NotificationToast
                    key={notification.id}
                    notification={notification}
                    onClose={() => removeNotification(notification.id)}
                />
            ))}

            {/* Заголовок и управление */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Organization Structure</h2>
                    <p className="text-muted-foreground">Edit departments and team members</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        onClick={() => setShowAddDepartmentModal(true)}
                        size="sm"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Department
                    </Button>
                </div>
            </div>

            {/* Карточка с организационной структурой */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-xl">
                        <div className="text-xl font-bold">Business Unit (EU)</div>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-8">
                        {/* Members Section */}
                        <div className="space-y-6">
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                <Users className="w-5 h-5" />
                                Members
                            </h3>

                            {businessUnits[0]?.departments.map((department) => (
                                <div key={department.id} className="space-y-4">
                                    {/* Заголовок отдела */}
                                    <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <Building className="w-5 h-5 text-gray-500" />
                                            <div className="space-y-1">
                                                <div className="font-semibold text-base">
                                                    {renderEditableInputCell(department.name, 'department', department.id, undefined, 'name')}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    Code: {renderEditableInputCell(department.code, 'department', department.id, undefined, 'code')}
                                                </div>
                                                {department.managers.length > 0 && (
                                                    <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1 flex-wrap">
                                                        <Crown className="w-3.5 h-3.5 text-yellow-500" />
                                                        <span className="font-medium">Managers:</span>
                                                        <span>{department.managers.map(m => `${m.first_name} ${m.last_name}`).join(', ')}</span>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-6 px-2 text-xs"
                                                            onClick={() => setShowManagerModal(department.id)}
                                                        >
                                                            <Edit className="h-3 w-3 mr-1" />
                                                            Edit
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="flex items-center gap-1 text-xs">
                                                <Users className="w-3 h-3" />
                                                {getAllDepartmentMembers(department).length} total
                                            </Badge>
                                            <Badge variant="outline" className="flex items-center gap-1 text-xs bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300">
                                                <Crown className="w-3 h-3" />
                                                {department.managers.length} managers
                                            </Badge>
                                            <Badge variant="outline" className="flex items-center gap-1 text-xs bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300">
                                                {getAllDepartmentMembers(department).filter(m => m.is_active).length} active
                                            </Badge>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => {
                                                    setSelectedDepartment(department);
                                                    setShowAddMemberModal(true);
                                                }}
                                            >
                                                <UserPlus className="w-4 h-4 mr-1" />
                                                Add
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => removeDepartment(department.id)}
                                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Таблица сотрудников отдела */}
                                    <div className="ml-6 pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                                        {getAllDepartmentMembers(department).length === 0 ? (
                                            <div className="text-center py-8 text-gray-500">
                                                <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                                <p>No members in this department</p>
                                            </div>
                                        ) : (
                                            <div className="rounded-md border">
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead className="w-[25%] py-2">Name</TableHead>
                                                            <TableHead className="w-[20%] py-2">Position & Grade</TableHead>
                                                            <TableHead className="w-[25%] py-2">Contact</TableHead>
                                                            <TableHead className="w-[15%] py-2">Department Role</TableHead>
                                                            <TableHead className="w-[15%] py-2 text-center">Status</TableHead>
                                                            <TableHead className="w-[10%] py-2 text-right">Actions</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {getAllDepartmentMembers(department).map((member) => (
                                                            <TableRow key={member.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                                                                <TableCell className="py-2">
                                                                    <div className="text-sm font-medium">
                                                                        {renderEditableInputCell(`${member.first_name} ${member.last_name}`, 'member', department.id, member.id, 'first_name')}
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell className="py-2">
                                                                    <div>
                                                                        <div className="text-sm font-medium">
                                                                            {member.position || '-'}
                                                                        </div>
                                                                        <div className="text-xs text-gray-500">
                                                                            {member.grade || 'No grade'}
                                                                        </div>
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell className="py-2">
                                                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                                                        {renderEditableInputCell(member.email || '', 'member', department.id, member.id, 'email')}
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell className="py-2">
                                                                    <div className="text-sm">
                                                                        {renderEditableDepartmentRoleCell(
                                                                            member.department_role || '',
                                                                            'member',
                                                                            department.id,
                                                                            member.id,
                                                                            'department_role',
                                                                        )}
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell className="py-2 text-center">
                                                                    {renderManagerCell(department, member)}
                                                                </TableCell>
                                                                <TableCell className="py-2 text-right">
                                                                    <DropdownMenu>
                                                                        <DropdownMenuTrigger asChild>
                                                                            <Button variant="ghost" size="icon" className="h-7 w-7">
                                                                                <MoreVertical className="h-4 w-4" />
                                                                            </Button>
                                                                        </DropdownMenuTrigger>
                                                                        <DropdownMenuContent align="end" className="w-48">
                                                                            <DropdownMenuItem
                                                                                onClick={() => {
                                                                                    startEditing('member', department.id, member.id, 'first_name', `${member.first_name} ${member.last_name}`);
                                                                                }}
                                                                            >
                                                                                <Edit className="h-3 w-3 mr-2" />
                                                                                Edit Name
                                                                            </DropdownMenuItem>
                                                                            <DropdownMenuItem
                                                                                onClick={() => {
                                                                                    startEditing('member', department.id, member.id, 'department_role', member.department_role || '');
                                                                                }}
                                                                            >
                                                                                <Edit className="h-3 w-3 mr-2" />
                                                                                Edit Department Role
                                                                            </DropdownMenuItem>
                                                                            <DropdownMenuItem
                                                                                onClick={() => {
                                                                                    toggleEmployeeManager(department.id, member);
                                                                                }}
                                                                            >
                                                                                {isEmployeeManager(department, member) ? (
                                                                                    <>
                                                                                        <X className="h-3 w-3 mr-2 text-red-500" />
                                                                                        Remove as Manager
                                                                                    </>
                                                                                ) : (
                                                                                    <>
                                                                                        <Crown className="h-3 w-3 mr-2 text-yellow-500" />
                                                                                        Set as Manager
                                                                                    </>
                                                                                )}
                                                                            </DropdownMenuItem>
                                                                            <DropdownMenuItem className="text-red-600"
                                                                                onClick={() => removeMemberFromDepartment(department.id, member.id)}
                                                                            >
                                                                                <Trash2 className="h-3 w-3 mr-2" />
                                                                                Remove
                                                                            </DropdownMenuItem>
                                                                        </DropdownMenuContent>
                                                                    </DropdownMenu>
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Модальное окно для добавления сотрудника */}
            {showAddMemberModal && selectedDepartment && (
                <AddMemberModal
                    department={selectedDepartment}
                    allEmployees={allEmployees}
                    businessUnits={businessUnits}
                    departmentRoles={department_roles || []}
                    onClose={() => {
                        setShowAddMemberModal(false);
                        setSelectedDepartment(null);
                    }}
                    onAdd={addMemberToDepartment}
                />
            )}

            {/* Модальное окно для добавления отдела */}
            {showAddDepartmentModal && (
                <AddDepartmentModal
                    onClose={() => setShowAddDepartmentModal(false)}
                    onAdd={addDepartment}
                    businessUnits={businessUnits}
                    departmentRoles={department_roles || []}
                    allEmployees={allEmployees}
                />
            )}

            {showCreateRoleModal && (
                <CreateRoleModal
                    onClose={() => setShowCreateRoleModal(false)}
                    onAdd={addRole}
                />
            )}

            {showManagerModal && (
                <ManagerManagementModal
                    departmentId={showManagerModal}
                    onClose={() => setShowManagerModal(null)}
                />
            )}
        </div>
    );
}