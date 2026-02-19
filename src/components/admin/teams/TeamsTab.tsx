// src/components/admin/TeamsTab.tsx
import React, { useState, useEffect, forwardRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Badge } from '../../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import { Plus, Edit, Trash2, X, Users, Building, Search, Check, UserPlus, Crown, MoreVertical, AlertCircle, Key, Briefcase, CheckCircle } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../ui/dropdown-menu';
import { Label } from '../../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../../ui/dialog';
import { toast } from 'sonner';

interface OrganizationMember {
    id: number;
    name: string;
    department: string;
    role?: string;
    email?: string;
    phone?: string;
    status: 'active' | 'inactive' | 'pending';
    employeeId?: string;
    isManager?: boolean;
}

interface DepartmentGroup {
    id: number;
    name: string;
    code: string;
    managerIds?: number[]; // Массив ID менеджеров
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
    roles,
    onClose,
    onAdd
}: {
    department: DepartmentGroup;
    allEmployees: Employee[];
    businessUnits: BusinessUnit[];
    roles: Role[];
    onClose: () => void;
    onAdd: (member: OrganizationMember) => void;
}) => {
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
    const [employeeRole, setEmployeeRole] = useState<string>('');
    const [isManager, setIsManager] = useState<boolean>(false);
    const [searchQuery, setSearchQuery] = useState<string>('');

    // Получить доступных сотрудников для отдела
    const getAvailableEmployees = () => {
        const currentDepartment = businessUnits[0].departments.find(d => d.id === department.id);
        if (!currentDepartment) return allEmployees;

        const assignedEmployeeIds = currentDepartment.members.map(m => m.employeeId);

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
            name: selectedEmployee.name,
            department: department.name,
            role: employeeRole || selectedEmployee.role || '',
            email: selectedEmployee.email || '',
            status: 'active',
            employeeId: selectedEmployee.id.toString(),
            isManager: isManager
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
                    {/* Поиск, роль и менеджер */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 shrink-0">
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
                                Role
                            </Label>
                            <Select value={employeeRole} onValueChange={setEmployeeRole}>
                                <SelectTrigger id="modal-employee-role" className="h-9">
                                    <SelectValue placeholder="Select a role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="no-role">No role</SelectItem>
                                    {roles.map(role => (
                                        <SelectItem key={role.id} value={role.name}>
                                            {role.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-medium">Manager</Label>
                            <div className="flex items-center space-x-2 pt-2">
                                <input
                                    type="checkbox"
                                    id="is-manager"
                                    checked={isManager}
                                    onChange={(e) => setIsManager(e.target.checked)}
                                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <Label htmlFor="is-manager" className="text-sm font-normal cursor-pointer">
                                    Set as department manager
                                </Label>
                            </div>
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
                                            <div className="mt-2 space-y-2">
                                                {employeeRole && employeeRole !== 'no-role' && (
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="outline" className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                                                            {employeeRole}
                                                        </Badge>
                                                        <span className="text-xs text-gray-500">will be assigned as this role</span>
                                                    </div>
                                                )}
                                                {isManager && (
                                                    <div className="flex items-center gap-2">
                                                        <Crown className="w-3 h-3 text-yellow-500" />
                                                        <Badge variant="outline" className="text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
                                                            Manager
                                                        </Badge>
                                                        <span className="text-xs text-gray-500">will be set as department manager</span>
                                                    </div>
                                                )}
                                            </div>
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
    roles,
    allEmployees
}: {
    onClose: () => void;
    onAdd: (department: DepartmentGroup) => void;
    businessUnits: BusinessUnit[];
    roles: Role[];
    allEmployees: Employee[];
}) => {
    const [departmentName, setDepartmentName] = useState('');
    const [departmentCode, setDepartmentCode] = useState('');

    const handleAdd = () => {
        if (!departmentName.trim()) return;

        const newDepartment: DepartmentGroup = {
            id: Date.now(),
            name: departmentName,
            code: departmentCode || departmentName.substring(0, 3).toUpperCase(),
            managerIds: [],
            members: []
        };

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
    // Полный список всех сотрудников в компании
    const [allEmployees, setAllEmployees] = useState<Employee[]>([
        { id: 1, name: 'Emile A. Montgomery', department: 'COHS', role: 'Developer', email: 'emile@company.com', status: 'active' },
        { id: 2, name: 'Terry Eisenberg', department: 'COHS', role: 'Designer', email: 'terry@company.com', status: 'active' },
        { id: 3, name: 'Turgut Drinksteller', department: 'COHS', role: 'Manager', email: 'turgut@company.com', status: 'active' },
        { id: 4, name: 'Agertin Eckalena', department: 'Admin', role: 'Manager', email: 'agertin@company.com', status: 'active' },
        { id: 5, name: 'Adolf Grynkysse', department: 'Admin', email: 'adolf@company.com', status: 'active' },
        { id: 6, name: 'Ching\'s Unladayer', department: 'Admin', email: 'ching@company.com', status: 'active' },
        { id: 7, name: 'Dyreusen Ynutzova', department: 'Admin', email: 'dyreusen@company.com', status: 'active' },
        { id: 8, name: 'Karisa Zakirova', department: 'Admin', email: 'karisa@company.com', status: 'active' },
        { id: 9, name: 'Luna Alpilova', department: 'Admin', email: 'luna@company.com', status: 'active' },
        { id: 10, name: 'Nesmula Kostyuk', department: 'Admin', email: 'nesmula@company.com', status: 'active' },
        { id: 11, name: 'Susan Kazantseva', department: 'Admin', email: 'susan@company.com', status: 'active' },
        { id: 12, name: 'Vita Khador', department: 'Admin', email: 'vita@company.com', status: 'active' },
        { id: 13, name: 'Zhangbak Shamputarov', department: 'Admin', email: 'zhangbak@company.com', status: 'active' },
        { id: 14, name: 'Adl Elsyaber', department: 'Audit', role: 'Manager', email: 'adl@company.com', status: 'active' },
        { id: 15, name: 'Allan Omedelma', department: 'Audit', email: 'allan@company.com', status: 'active' },
        { id: 16, name: 'Alan Lundholm', department: 'Audit', email: 'alan@company.com', status: 'active' },
        { id: 17, name: 'Adele Kalmyza', department: 'Audit', email: 'adele@company.com', status: 'active' },
        { id: 18, name: 'Ajayas Kapfereggeev', department: 'Audit', email: 'ajayas@company.com', status: 'active' },
        { id: 19, name: 'Abbasan Mustarev', department: 'Audit', email: 'abbasan@company.com', status: 'active' },
        { id: 20, name: 'Ahmed Ryosny', department: 'Audit', email: 'ahmed@company.com', status: 'active' },
        { id: 21, name: 'Alan', department: 'Audit', email: 'alan2@company.com', status: 'active' },
        { id: 22, name: 'Alyana Trudaleva', department: 'Audit', email: 'alyana@company.com', status: 'active' },
        { id: 23, name: 'Adolf Kotolakova', department: 'Audit', email: 'adolfk@company.com', status: 'active' },
        { id: 24, name: 'Ayana Dubina', department: 'Audit', email: 'ayana@company.com', status: 'active' },
        { id: 25, name: 'Bashan Novopolska', department: 'Audit', email: 'bashan@company.com', status: 'active' },
        { id: 26, name: 'Barbara Juhnfeier', department: 'Audit', email: 'barbara@company.com', status: 'active' },
        { id: 27, name: 'Bernet Zhiegheva', department: 'Audit', email: 'bernet@company.com', status: 'active' },
        { id: 28, name: 'Burdiati Rastotanov', department: 'Audit', email: 'burdiati@company.com', status: 'active' },
        { id: 29, name: 'Diana Kazantseva', department: 'Audit', email: 'diana@company.com', status: 'active' },
        { id: 30, name: 'Rafaela Baddenov', department: 'Audit', email: 'rafaela@company.com', status: 'active' },
    ]);

    // Список ролей
    const [roles, setRoles] = useState<Role[]>([
        { id: 1, name: 'Developer', description: 'Software development' },
        { id: 2, name: 'Designer', description: 'UI/UX design' },
        { id: 3, name: 'Manager', description: 'Team management' },
        { id: 4, name: 'Analyst', description: 'Business analysis' },
        { id: 5, name: 'Tester', description: 'Quality assurance' },
    ]);

    // Исходные данные структуры - обновленные для поддержки нескольких менеджеров
    const [businessUnits, setBusinessUnits] = useState<BusinessUnit[]>([
        {
            id: 1,
            name: 'Business Unit (EU)',
            departments: [
                {
                    id: 1,
                    name: 'COHS',
                    code: 'COHS',
                    managerIds: [3], // ID менеджеров (Turgut Drinksteller)
                    members: [
                        { id: 1, name: 'Emile A. Montgomery', department: 'COHS', role: 'Developer', status: 'active', employeeId: '1', isManager: false },
                        { id: 2, name: 'Terry Eisenberg', department: 'COHS', role: 'Designer', status: 'active', employeeId: '2', isManager: false },
                        { id: 3, name: 'Turgut Drinksteller', department: 'COHS', role: 'Manager', status: 'active', employeeId: '3', isManager: true },
                    ]
                },
                {
                    id: 2,
                    name: 'Admin',
                    code: 'ADM',
                    managerIds: [4], // ID менеджеров (Agertin Eckalena)
                    members: [
                        { id: 4, name: 'Agertin Eckalena', department: 'Admin', role: 'Manager', status: 'active', employeeId: '4', isManager: true },
                        { id: 5, name: 'Adolf Grynkysse', department: 'Admin', status: 'active', employeeId: '5', isManager: false },
                        { id: 6, name: 'Ching\'s Unladayer', department: 'Admin', status: 'active', employeeId: '6', isManager: false },
                        { id: 7, name: 'Dyreusen Ynutzova', department: 'Admin', status: 'active', employeeId: '7', isManager: false },
                        { id: 8, name: 'Karisa Zakirova', department: 'Admin', status: 'active', employeeId: '8', isManager: false },
                        { id: 9, name: 'Luna Alpilova', department: 'Admin', status: 'active', employeeId: '9', isManager: false },
                        { id: 10, name: 'Nesmula Kostyuk', department: 'Admin', status: 'active', employeeId: '10', isManager: false },
                        { id: 11, name: 'Susan Kazantseva', department: 'Admin', status: 'active', employeeId: '11', isManager: false },
                        { id: 12, name: 'Vita Khador', department: 'Admin', status: 'active', employeeId: '12', isManager: false },
                        { id: 13, name: 'Zhangbak Shamputarov', department: 'Admin', status: 'active', employeeId: '13', isManager: false },
                    ]
                },
                {
                    id: 3,
                    name: 'Audit',
                    code: 'AUD',
                    managerIds: [14], // ID менеджеров (Adl Elsyaber)
                    members: [
                        { id: 14, name: 'Adl Elsyaber', department: 'Audit', role: 'Manager', status: 'active', employeeId: '14', isManager: true },
                        { id: 15, name: 'Allan Omedelma', department: 'Audit', status: 'active', employeeId: '15', isManager: false },
                        { id: 16, name: 'Alan Lundholm', department: 'Audit', status: 'active', employeeId: '16', isManager: false },
                        { id: 17, name: 'Adele Kalmyza', department: 'Audit', status: 'active', employeeId: '17', isManager: false },
                        { id: 18, name: 'Ajayas Kapfereggeev', department: 'Audit', status: 'active', employeeId: '18', isManager: false },
                        { id: 19, name: 'Abbasan Mustarev', department: 'Audit', status: 'active', employeeId: '19', isManager: false },
                        { id: 20, name: 'Ahmed Ryosny', department: 'Audit', status: 'active', employeeId: '20', isManager: false },
                        { id: 21, name: 'Alan', department: 'Audit', status: 'active', employeeId: '21', isManager: false },
                        { id: 22, name: 'Alyana Trudaleva', department: 'Audit', status: 'active', employeeId: '22', isManager: false },
                        { id: 23, name: 'Adolf Kotolakova', department: 'Audit', status: 'active', employeeId: '23', isManager: false },
                        { id: 24, name: 'Ayana Dubina', department: 'Audit', status: 'active', employeeId: '24', isManager: false },
                        { id: 25, name: 'Bashan Novopolska', department: 'Audit', status: 'active', employeeId: '25', isManager: false },
                        { id: 26, name: 'Barbara Juhnfeier', department: 'Audit', status: 'active', employeeId: '26', isManager: false },
                        { id: 27, name: 'Bernet Zhiegheva', department: 'Audit', status: 'active', employeeId: '27', isManager: false },
                        { id: 28, name: 'Burdiati Rastotanov', department: 'Audit', status: 'active', employeeId: '28', isManager: false },
                        { id: 29, name: 'Diana Kazantseva', department: 'Audit', status: 'active', employeeId: '29', isManager: false },
                        { id: 30, name: 'Rafaela Baddenov', department: 'Audit', status: 'active', employeeId: '30', isManager: false },
                    ]
                }
            ]
        }
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

    // Получить список менеджеров отдела
    const getDepartmentManagers = (departmentId: number) => {
        const department = businessUnits[0].departments.find(d => d.id === departmentId);
        if (!department) return [];

        return department.members
            .filter(member => member.isManager)
            .map(member => member.name);
    };

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

    // Тоггл статуса менеджера
    const toggleManagerStatus = (departmentId: number, memberId: number, isManager: boolean) => {
        setBusinessUnits(prev => {
            const updated = [...prev];
            const department = updated[0].departments.find(d => d.id === departmentId);
            if (department) {
                const member = department.members.find(m => m.id === memberId);
                if (member) {
                    member.isManager = !isManager;
                    
                    // Обновляем массив managerIds
                    if (!isManager) {
                        // Добавляем менеджера
                        if (!department.managerIds) {
                            department.managerIds = [];
                        }
                        department.managerIds.push(parseInt(member.employeeId || '0'));
                    } else {
                        // Удаляем менеджера
                        if (department.managerIds) {
                            department.managerIds = department.managerIds.filter(id => 
                                id !== parseInt(member.employeeId || '0')
                            );
                        }
                    }

                    const action = !isManager ? 'added as' : 'removed from';
                    toast.success(
                        `"${member.name}" has been ${action} department managers`,
                        // 'success'
                    );
                }
            }
            return updated;
        });
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
                                        `Role for "${member.name}" has been updated to "${finalValue || 'No role'}"`,
                                        // 'success'
                                    );
                                }
                            }
                        }
                    }
                    return updated;
                });
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
                            if (field === 'name') member.name = tempValue;
                            if (field === 'email') member.email = tempValue;

                            if (oldValue !== tempValue) {
                                toast.success(
                                    `Employee "${member.name}" has been updated successfully`,
                                    // 'success'
                                );
                            }
                        }
                    }
                    return updated;
                });
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

                // Если сотрудник добавлен как менеджер, обновляем managerIds
                if (newMember.isManager && newMember.employeeId) {
                    if (!department.managerIds) {
                        department.managerIds = [];
                    }
                    department.managerIds.push(parseInt(newMember.employeeId));
                }

                // Уведомление об успешном добавлении
                const managerText = newMember.isManager ? ' as manager' : '';
                toast.success(
                    `Employee "${newMember.name}" has been added to ${department.name} department${managerText}`,
                    // 'success'
                );
            }
            return updated;
        });

        // Закрыть модальное окно
        setShowAddMemberModal(false);
        setSelectedDepartment(null);
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
        let isManager = false;

        setBusinessUnits(prev => {
            const updated = [...prev];
            const department = updated[0].departments.find(d => d.id === departmentId);
            if (department) {
                const member = department.members.find(m => m.id === memberId);
                if (member) {
                    memberName = member.name;
                    isManager = member.isManager || false;
                    
                    // Если удаляемый сотрудник - менеджер, удаляем его ID из managerIds
                    if (isManager && member.employeeId && department.managerIds) {
                        department.managerIds = department.managerIds.filter(
                            id => id !== parseInt(member.employeeId || '0')
                        );
                    }
                }
                department.members = department.members.filter(m => m.id !== memberId);
            }
            return updated;
        });

        // Уведомление об успешном удалении
        if (memberName) {
            const managerText = isManager ? ' manager' : '';
            toast.success(
                `Employee "${memberName}" (${managerText}) has been removed from department`,
                // 'success'
            );
        }
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
    };

    // Получить опции для ролей
    const getRoleOptions = () => {
        return [{ value: 'no-role', label: 'No role' }, ...roles.map(r => ({ value: r.name, label: r.name }))];
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

                            {businessUnits[0].departments.map((department) => (
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
                                                    {department.managerIds && department.managerIds.length > 0 && (
                                                        <span className="ml-3 text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
                                                            {department.managerIds.length} manager{department.managerIds.length > 1 ? 's' : ''}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="flex items-center gap-1 text-xs">
                                                <Users className="w-3 h-3" />
                                                {department.members.length}
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
                                        <div className="rounded-md border">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead className="w-[30%] py-2">Name</TableHead>
                                                        <TableHead className="w-[20%] py-2">Role</TableHead>
                                                        <TableHead className="w-[25%] py-2">Email</TableHead>
                                                        <TableHead className="w-[15%] py-2 text-center">Manager</TableHead>
                                                        <TableHead className="w-[10%] py-2 text-right">Actions</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {department.members.map((member) => (
                                                        <TableRow key={member.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                                                            <TableCell className="py-2">
                                                                <div className="text-sm font-medium flex items-center gap-2">
                                                                    {renderEditableInputCell(member.name, 'member', department.id, member.id, 'name')}
                                                                    {member.isManager && (
                                                                        <Crown className="w-3 h-3 text-yellow-500" />
                                                                    )}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="py-2">
                                                                <div className="text-sm">
                                                                    {renderEditableSelectCell(
                                                                        member.role || '',
                                                                        'member',
                                                                        department.id,
                                                                        member.id,
                                                                        'role',
                                                                        getRoleOptions()
                                                                    )}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="py-2">
                                                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                                                    {renderEditableInputCell(member.email || '', 'member', department.id, member.id, 'email')}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="py-2 text-center">
                                                                <div className="flex items-center justify-center">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => toggleManagerStatus(department.id, member.id, member.isManager || false)}
                                                                        className={`relative inline-flex h-6 w-11 items-center rounded-full ${member.isManager ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}`}
                                                                    >
                                                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${member.isManager ? 'translate-x-6' : 'translate-x-1'}`} />
                                                                    </button>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="py-2 text-right">
                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger asChild>
                                                                        <Button variant="ghost" size="icon" className="h-7 w-7">
                                                                            <MoreVertical className="h-4 w-4" />
                                                                        </Button>
                                                                    </DropdownMenuTrigger>
                                                                    <DropdownMenuContent align="end" className="w-40">
                                                                        <DropdownMenuItem
                                                                            onClick={() => {
                                                                                startEditing('member', department.id, member.id, 'name', member.name);
                                                                            }}
                                                                        >
                                                                            <Edit className="h-3 w-3 mr-2" />
                                                                            Edit Name
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem
                                                                            onClick={() => {
                                                                                startEditing('member', department.id, member.id, 'role', member.role || '');
                                                                            }}
                                                                        >
                                                                            <Edit className="h-3 w-3 mr-2" />
                                                                            Edit Role
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem
                                                                            onClick={() => toggleManagerStatus(department.id, member.id, member.isManager || false)}
                                                                        >
                                                                            <Crown className="h-3 w-3 mr-2" />
                                                                            {member.isManager ? 'Remove as Manager' : 'Set as Manager'}
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
                    roles={roles}
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
                    roles={roles}
                    allEmployees={allEmployees}
                />
            )}

            {/* Модальное окно для создания роли */}
            {showCreateRoleModal && (
                <CreateRoleModal
                    onClose={() => setShowCreateRoleModal(false)}
                    onAdd={addRole}
                />
            )}
        </div>
    );
}