// src/components/admin/TeamsTab.tsx
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Badge } from "../../ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../ui/table";
import {
  Plus,
  Edit,
  Trash2,
  X,
  Users,
  Building,
  Search,
  Check,
  UserPlus,
  Crown,
  MoreVertical,
  AlertCircle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../ui/dropdown-menu";
import { Label } from "../../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "../../ui/dialog";
import { toast } from "sonner";
import { useUserStore } from "../../../store/UsersStore";
import {
  useCreateDepartment,
  useDeleteDepartment,
  useEditDepartmentName,
  useEditDepartmentRoles,
  useGetDepartments,
} from "../../../hooks/useDepartments";

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
  managers: OrganizationMember[];
  managerIds: number[];
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
  status: "active" | "inactive";
}

interface Role {
  id: number;
  name: string;
  description?: string;
}

interface DepartmentRole {
  id: number;
  name: string;
}

interface Notification {
  id: number;
  message: string;
  type: "success" | "error" | "info";
}

// Компонент модального окна добавления сотрудника
const AddMemberModal = ({
  department,
  allEmployees,
  businessUnits,
  departmentRoles,
  onClose,
  onAdd,
}: {
  department: DepartmentGroup;
  allEmployees: Employee[];
  businessUnits: BusinessUnit[];
  departmentRoles: DepartmentRole[];
  onClose: () => void;
  onAdd: (member: OrganizationMember) => void;
}) => {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [employeeRoleId, setEmployeeRoleId] = useState<string>("1");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const { mutate: getDepartments } = useGetDepartments();

  const getAvailableEmployees = () => {
    const currentDepartment = businessUnits[0].departments.find(
      (d) => d.id === department.id,
    );
    if (!currentDepartment) return allEmployees;

    const assignedEmployeeIds = currentDepartment.members.map((m) =>
      m.id.toString(),
    );

    return allEmployees.filter(
      (emp) =>
        (emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          emp.email?.toLowerCase().includes(searchQuery.toLowerCase())) &&
        !assignedEmployeeIds.includes(emp.id.toString()) &&
        emp.status === "active",
    );
  };

  const availableEmployees = getAvailableEmployees();
  const selectedEmployee = allEmployees.find(
    (e) => e.id.toString() === selectedEmployeeId,
  );
  const selectedRole = departmentRoles.find(
    (r) => r.id.toString() === employeeRoleId,
  );

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  useEffect(() => {
    getDepartments();
  }, []);

  const handleAdd = () => {
    if (!selectedEmployee) return;

    const selectedRole = departmentRoles.find(
      (r) => r.id.toString() === employeeRoleId,
    );

    const newMember: OrganizationMember = {
      id: selectedEmployee.id,
      first_name: selectedEmployee.name.split(" ")[0],
      last_name: selectedEmployee.name.split(" ").slice(1).join(" ") || "",
      email: selectedEmployee.email || "",
      grade: null,
      position: selectedEmployee.role || null,
      department: department.name,
      department_role: selectedRole ? selectedRole.name : "Member",
      role: selectedRole?.name === "Manager" ? "operational" : null,
      country: "KG",
      is_active: true,
      date_joined: new Date().toISOString(),
      date_left: null,
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
      <div
        className="bg-background rounded-lg shadow-lg border w-full max-w-2xl flex flex-col"
        style={{ width: "40%", height: "600px" }}
      >
        <div className="flex items-center justify-between p-4 border-b shrink-0">
          <div>
            <h2 className="text-lg font-semibold">
              Add Member to {department.name}
            </h2>
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

        <div className="flex-1 overflow-hidden flex flex-col p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 shrink-0">
            <div className="space-y-2">
              <Label
                htmlFor="modal-search-employees"
                className="text-sm font-medium"
              >
                Search Employees
              </Label>
              <div className="relative">
                <Search
                  className="absolute left-1 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
                  style={{ padding: "1px" }}
                />
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
              <Label
                htmlFor="modal-employee-role"
                className="text-sm font-medium"
              >
                Department Role
              </Label>
              <Select value={employeeRoleId} onValueChange={setEmployeeRoleId}>
                <SelectTrigger id="modal-employee-role" className="h-9">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {departmentRoles.map((role) => (
                    <SelectItem key={role.id} value={role.id.toString()}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="shrink-0 mb-2">
            <Label className="text-sm font-medium">
              Available Employees ({availableEmployees.length})
            </Label>
          </div>

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
                        ? "bg-blue-50 dark:bg-blue-900/20 border-l-2 border-blue-500"
                        : "hover:bg-gray-50 dark:hover:bg-gray-900/50"
                        }`}
                      onClick={() =>
                        setSelectedEmployeeId(employee.id.toString())
                      }
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-sm">
                            {employee.name}
                          </div>
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

          {selectedEmployee && (
            <div className="mt-4 shrink-0">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm flex-1">
                    <div className="font-medium text-sm">Selected Employee</div>
                    <div className="mt-1">
                      <div className="font-medium">{selectedEmployee.name}</div>
                      {selectedRole && (
                        <div className="mt-1 flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                          >
                            {selectedRole.name}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            will be assigned as this role
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="border-t p-4 shrink-0">
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" onClick={onClose} className="h-9">
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
}: {
  onClose: () => void;
  onAdd: (department: DepartmentGroup) => void;
}) => {
  const [departmentName, setDepartmentName] = useState("");
  const [departmentCode, setDepartmentCode] = useState("");
  const { mutate: createDepartment } = useCreateDepartment();

  const handleAdd = () => {
    if (!departmentName.trim() || !departmentCode.trim()) return;

    createDepartment(
      { name: departmentName, code: departmentCode },
      {
        onSuccess: (data) => {
          const newDepartment: DepartmentGroup = {
            id: data.id || Date.now(),
            name: departmentName,
            code: departmentCode,
            managers: [],
            managerIds: [],
            members: [],
          };

          onAdd(newDepartment);
          toast.success(
            `Department "${departmentName}" has been created successfully`,
          );
          onClose();
        },
        onError: (error) => {
          toast.error(
            `Failed to create department: ${error.message || "Unknown error"}`,
          );
        },
      },
    );
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="w-[60vw] max-w-none min-w-[600px] max-h-[80vh]">
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
            <Label htmlFor="department-code">Department Code *</Label>
            <Input
              id="department-code"
              value={departmentCode}
              onChange={(e) => setDepartmentCode(e.target.value.toUpperCase())}
              placeholder="e.g., ENG"
            />
          </div>
        </div>
        <DialogFooter
          style={{ display: "flex", justifyContent: "space-between" }}
        >
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleAdd} disabled={!departmentName.trim() || !departmentCode.trim()}>
            <Plus className="w-4 h-4 mr-2" />
            Create Department
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Компонент модального окна подтверждения удаления
const ConfirmDeleteModal = ({
  departmentName,
  onClose,
  onConfirm,
}: {
  departmentName: string;
  onClose: () => void;
  onConfirm: () => void;
}) => {
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            Delete Department
          </DialogTitle>
          <DialogDescription className="pt-2">
            Are you sure you want to delete the department{" "}
            <span className="font-semibold text-foreground">
              "{departmentName}"
            </span>
            ?
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-2">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
              <div className="text-sm text-yellow-800 dark:text-yellow-300">
                <p className="font-medium">Warning:</p>
                <p>
                  This action cannot be undone. All members and data associated
                  with this department will be affected.
                </p>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Department
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Компонент уведомления
const NotificationToast = ({
  notification,
  onClose,
}: {
  notification: Notification;
  onClose: () => void;
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor =
    notification.type === "success"
      ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800"
      : notification.type === "error"
        ? "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800"
        : "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800";

  const textColor =
    notification.type === "success"
      ? "text-green-800 dark:text-green-300"
      : notification.type === "error"
        ? "text-red-800 dark:text-red-300"
        : "text-blue-800 dark:text-blue-300";

  const iconColor =
    notification.type === "success"
      ? "text-green-600 dark:text-green-400"
      : notification.type === "error"
        ? "text-red-600 dark:text-red-400"
        : "text-blue-600 dark:text-blue-400";

  return (
    <div
      className={`fixed top-4 right-4 z-50 w-80 ${bgColor} border rounded-lg shadow-lg p-4 animate-in slide-in-from-right-5`}
    >
      <div className="flex items-start gap-3">
        <div className={`${iconColor} flex-shrink-0`}>
          {notification.type === "success" ? (
            <Check className="h-5 w-5" />
          ) : notification.type === "error" ? (
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
  const { mutate: editDepartmentName } = useEditDepartmentName();
  const { mutate: editDepartmentRole } = useEditDepartmentRoles();
  const { mutate: deleteDepartment } = useDeleteDepartment();
  const { mutate: getDepartments } = useGetDepartments();

  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState<{
    show: boolean;
    departmentId: number;
    departmentName: string;
  }>({
    show: false,
    departmentId: 0,
    departmentName: "",
  });

  // Вызов getDepartments при монтировании компонента
  useEffect(() => {
    getDepartments();
  }, []);

  const convertToBusinessUnits = (depts: any[] | null): BusinessUnit[] => {
    if (!depts || depts.length === 0) {
      return [
        {
          id: 1,
          name: "Business Unit (EU)",
          departments: [],
        },
      ];
    }

    return [
      {
        id: 1,
        name: "Business Unit (EU)",
        departments: depts.map((dept) => ({
          id: dept.id,
          name: dept.name,
          code: dept.name.substring(0, 3).toUpperCase(),
          managers: dept.managers.map((manager: any) => ({
            ...manager,
            department: dept.name,
            department_role: "Manager",
          })),
          managerIds: dept.managers.map((m: any) => m.id),
          members: [
            ...dept.managers.map((manager: any) => ({
              ...manager,
              department: dept.name,
            })),
            ...dept.members.map((member: any) => ({
              ...member,
              department: dept.name,
            })),
          ],
        })),
      },
    ];
  };

  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
  const [businessUnits, setBusinessUnits] = useState<BusinessUnit[]>([]);

  useEffect(() => {
    if (departments) {
      const businessUnitsData = convertToBusinessUnits(departments);
      setBusinessUnits(businessUnitsData);

      const allEmps: Employee[] = [];
      departments.forEach((dept) => {
        dept.managers.forEach((manager: any) => {
          allEmps.push({
            id: manager.id,
            name: `${manager.first_name} ${manager.last_name}`,
            department: manager.department,
            role: manager.department_role,
            email: manager.email,
            status: manager.is_active ? "active" : "inactive",
          });
        });

        dept.members.forEach((member: any) => {
          if (!allEmps.some((emp) => emp.id === member.id)) {
            allEmps.push({
              id: member.id,
              name: `${member.first_name} ${member.last_name}`,
              department: member.department,
              role: member.department_role,
              email: member.email,
              status: member.is_active ? "active" : "inactive",
            });
          }
        });
      });
      setAllEmployees(allEmps);
    } else {
      setBusinessUnits([
        {
          id: 1,
          name: "Business Unit (EU)",
          departments: [],
        },
      ]);
      setAllEmployees([]);
    }
  }, [departments]);

  const [roles, setRoles] = useState<Role[]>([
    { id: 1, name: "Developer", description: "Software development" },
    { id: 2, name: "Designer", description: "UI/UX design" },
    { id: 3, name: "Manager", description: "Team management" },
    { id: 4, name: "Analyst", description: "Business analysis" },
    { id: 5, name: "Tester", description: "Quality assurance" },
  ]);

  const [editingCell, setEditingCell] = useState<{
    type: "department" | "member" | "manager";
    departmentId?: number;
    memberId?: number;
    field: string;
    value: string;
  } | null>(null);

  const [tempValue, setTempValue] = useState("");
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showAddDepartmentModal, setShowAddDepartmentModal] = useState(false);
  const [selectedDepartment, setSelectedDepartment] =
    useState<DepartmentGroup | null>(null);
  const [showManagerModal, setShowManagerModal] = useState<number | null>(null);

  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = (
    message: string,
    type: "success" | "error" | "info",
  ) => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, message, type }]);
  };

  const removeNotification = (id: number) => {
    setNotifications((prev) =>
      prev.filter((notification) => notification.id !== id),
    );
  };

  const isEmployeeManager = (
    department: DepartmentGroup,
    member: OrganizationMember,
  ) => {
    return department.managerIds.includes(member.id);
  };

  const getAllDepartmentMembers = (
    department: DepartmentGroup,
  ): OrganizationMember[] => {
    return department.members;
  };

  const forceUpdate = useState({})[1];

  const findRoleIdByName = (roleName: string): number => {
    const role = department_roles?.find((r) => r.name === roleName);
    return role ? role.id : 1;
  };

  const findRoleById = (roleId: number): DepartmentRole | undefined => {
    return department_roles?.find((r) => r.id === roleId);
  };

  const startEditing = (
    type: "department" | "member" | "manager",
    departmentId?: number,
    memberId?: number,
    field: string,
    currentValue: string,
  ) => {
    let editingValue = currentValue;
    if (field === "role" && currentValue === "") {
      editingValue = "no-role";
    }

    setEditingCell({
      type,
      departmentId,
      memberId,
      field,
      value: editingValue,
    });
    setTempValue(editingValue);
  };

  // Рендер редактируемой ячейки с department_roles
  const renderEditableDepartmentRoleCell = (
    value: string,
    type: "department" | "member" | "manager",
    departmentId?: number,
    memberId?: number,
    field: string = "department_role",
  ) => {
    const isEditing =
      editingCell?.type === type &&
      editingCell?.departmentId === departmentId &&
      editingCell?.memberId === memberId &&
      editingCell?.field === field;

    const handleSelectChange = (newRoleId: string) => {
      if (!departmentId || !memberId) return;

      const roleId = parseInt(newRoleId);
      const selectedRole = findRoleById(roleId);

      if (!selectedRole) return;

      setBusinessUnits((prev) => {
        const updated = [...prev];
        const department = updated[0].departments.find(
          (d) => d.id === departmentId,
        );
        if (department) {
          const member = department.members.find((m) => m.id === memberId);
          if (member) {
            const oldValue = member.department_role;
            member.department_role = selectedRole.name;

            if (
              selectedRole.name === "Manager" &&
              !department.managerIds.includes(member.id)
            ) {
              department.managers.push(member);
              department.managerIds.push(member.id);
            } else if (
              selectedRole.name !== "Manager" &&
              department.managerIds.includes(member.id)
            ) {
              department.managers = department.managers.filter(
                (m) => m.id !== member.id,
              );
              department.managerIds = department.managerIds.filter(
                (id) => id !== member.id,
              );
            }

            if (member.id) {
              editDepartmentRole({
                userId: member.id,
                department_role: roleId,
              });
            }

            if (oldValue !== selectedRole.name) {
              toast.success(
                `Department role for "${member.first_name} ${member.last_name}" has been updated to "${selectedRole.name}"`,
              );
            }
          }
        }
        return updated;
      });

      forceUpdate({});
      setEditingCell(null);
      setTempValue("");
    };

    if (isEditing) {
      const currentRoleId = findRoleIdByName(value);
      const selectValue = currentRoleId.toString();

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
              {department_roles?.map((role) => (
                <SelectItem key={role.id} value={role.id.toString()}>
                  {role.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => {
              setEditingCell(null);
              setTempValue("");
            }}
            className="h-6 w-6"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      );
    }

    const displayValue = value || "Member";

    return (
      <div
        className="group flex items-center gap-1 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 px-1 py-0.5 rounded"
        onClick={() => {
          startEditing(type, departmentId, memberId, field, value || "");
        }}
      >
        <span className="text-sm font-medium">{displayValue}</span>
        <Edit className="h-3 w-3 opacity-0 group-hover:opacity-50 text-gray-400" />
      </div>
    );
  };

  // Рендер редактируемой ячейки с инпутом (с использованием editDepartmentName)
  const renderEditableInputCell = (
    value: string,
    type: "department" | "member" | "manager",
    departmentId?: number,
    memberId?: number,
    field: string = "name",
  ) => {
    const isEditing =
      editingCell?.type === type &&
      editingCell?.departmentId === departmentId &&
      editingCell?.memberId === memberId &&
      editingCell?.field === field;

    const handleSave = () => {
      if (!editingCell || !tempValue.trim()) return;

      const { type, departmentId, memberId, field } = editingCell;

      if (type === "department" && departmentId) {
        // Редактирование отдела
        setBusinessUnits((prev) => {
          const updated = [...prev];
          const department = updated[0].departments.find(
            (d) => d.id === departmentId,
          );
          if (department) {
            if (field === "name") {
              const oldValue = department.name;
              department.name = tempValue;

              // Вызываем API для обновления названия отдела
              editDepartmentName(
                {
                  department_id: departmentId,
                  name: tempValue,
                },
                {
                  onSuccess: () => {
                    toast.success(
                      `Department name has been updated to "${tempValue}"`,
                    );
                  },
                  onError: (error) => {
                    // В случае ошибки откатываем изменения
                    department.name = oldValue;
                    toast.error(
                      `Failed to update department name: ${error.message || "Unknown error"}`,
                    );
                    forceUpdate({});
                  },
                },
              );
            }
            if (field === "code") {
              const oldValue = department.code;
              department.code = tempValue;
              if (oldValue !== tempValue) {
                toast.success(
                  `Department code has been updated to "${tempValue}"`,
                );
              }
            }
          }
          return updated;
        });
      }

      setEditingCell(null);
      setTempValue("");
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        handleSave();
      }
      if (e.key === "Escape") {
        setEditingCell(null);
        setTempValue("");
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
            <Button
              size="icon"
              variant="ghost"
              onClick={handleSave}
              className="h-6 w-6"
            >
              <Check className="h-3 w-3" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => {
                setEditingCell(null);
                setTempValue("");
              }}
              className="h-6 w-6"
            >
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
        <span className="text-sm">{value || "-"}</span>
        <Edit className="h-3 w-3 opacity-0 group-hover:opacity-50 text-gray-400" />
      </div>
    );
  };

  const renderReadOnlyCell = (value: string) => {
    return (
      <div className="text-sm">
        <span className="text-sm">{value || "-"}</span>
      </div>
    );
  };

  const addMemberToDepartment = (newMember: OrganizationMember) => {
    if (!selectedDepartment) return;

    setBusinessUnits((prev) => {
      const updated = [...prev];
      const department = updated[0].departments.find(
        (d) => d.id === selectedDepartment.id,
      );
      if (department) {
        department.members.push(newMember);

        if (newMember.department_role === "Manager") {
          department.managers.push(newMember);
          department.managerIds.push(newMember.id);
        }

        const roleId = findRoleIdByName(newMember.department_role);

        if (newMember.id) {
          editDepartmentRole({
            userId: newMember.id,
            department_role: roleId,
          });
        }

        toast.success(
          `Employee "${newMember.first_name} ${newMember.last_name}" has been added to ${department.name} department`,
        );
      }
      return updated;
    });

    setShowAddMemberModal(false);
    setSelectedDepartment(null);
    forceUpdate({});
  };

  const addDepartment = (newDepartment: DepartmentGroup) => {
    setBusinessUnits((prev) => {
      const updated = [...prev];
      updated[0].departments.push(newDepartment);
      return updated;
    });

    toast.success(
      `Department "${newDepartment.name}" has been created successfully`,
    );
    setShowAddDepartmentModal(false);
    forceUpdate({});
  };

  const removeMemberFromDepartment = (
    departmentId: number,
    memberId: number,
  ) => {
    let memberName = "";

    setBusinessUnits((prev) => {
      const updated = [...prev];
      const department = updated[0].departments.find(
        (d) => d.id === departmentId,
      );
      if (department) {
        const member = department.members.find((m) => m.id === memberId);
        if (member) {
          memberName = `${member.first_name} ${member.last_name}`;

          if (department.managerIds.includes(member.id)) {
            department.managers = department.managers.filter(
              (m) => m.id !== member.id,
            );
            department.managerIds = department.managerIds.filter(
              (id) => id !== member.id,
            );

            if (member.id) {
              editDepartmentRole({
                userId: member.id,
                department_role: 1,
              });
            }
          }
        }
        department.members = department.members.filter(
          (m) => m.id !== memberId,
        );
      }
      return updated;
    });

    if (memberName) {
      toast.success(
        `Employee "${memberName}" has been removed from department`,
      );
    }

    forceUpdate({});
  };

  const handleDeleteDepartment = (departmentId: number) => {
    deleteDepartment(
      { department_id: departmentId },
      {
        onSuccess: () => {
          toast.success("Department has been deleted successfully");
          // Обновляем список департаментов
          getDepartments();
        },
        onError: (error) => {
          toast.error(
            `Failed to delete department: ${error.message || "Unknown error"}`,
          );
        },
      },
    );
  };

  const removeDepartment = (departmentId: number, departmentName: string) => {
    setShowDeleteConfirmModal({
      show: true,
      departmentId,
      departmentName,
    });
  };

  const toggleEmployeeManager = (
    departmentId: number,
    member: OrganizationMember,
  ) => {
    if (!member.id) {
      toast.error("Employee does not have an id");
      return;
    }

    setBusinessUnits((prev) => {
      const updated = [...prev];
      const department = updated[0].departments.find(
        (d) => d.id === departmentId,
      );
      if (department) {
        const isCurrentlyManager = department.managerIds.includes(member.id);
        const memberName = `${member.first_name} ${member.last_name}`;

        if (isCurrentlyManager) {
          department.managers = department.managers.filter(
            (m) => m.id !== member.id,
          );
          department.managerIds = department.managerIds.filter(
            (id) => id !== member.id,
          );
          member.department_role = "Member";

          editDepartmentRole({
            userId: member.id,
            department_role: 1,
          });

          toast.success(
            `${memberName} has been removed as manager of ${department.name}`,
          );
        } else {
          department.managers.push(member);
          department.managerIds.push(member.id);
          member.department_role = "Manager";

          editDepartmentRole({
            userId: member.id,
            department_role: 2,
          });

          toast.success(
            `${memberName} has been appointed as manager of ${department.name}`,
          );
        }
      }
      return updated;
    });

    forceUpdate({});
  };

  const ManagerManagementModal = ({
    departmentId,
    onClose,
  }: {
    departmentId: number;
    onClose: () => void;
  }) => {
    const department = businessUnits[0]?.departments.find(
      (d) => d.id === departmentId,
    );
    const [selectedManagerIds, setSelectedManagerIds] = useState<number[]>(
      department ? [...department.managerIds] : [],
    );

    const handleSave = () => {
      if (!department) return;

      setBusinessUnits((prev) => {
        const updated = [...prev];
        const dept = updated[0].departments.find((d) => d.id === departmentId);
        if (dept) {
          dept.members.forEach((member) => {
            if (dept.managerIds.includes(member.id)) {
              member.department_role = "Member";

              if (member.id) {
                editDepartmentRole({
                  userId: member.id,
                  department_role: 1,
                });
              }
            }
          });

          const selectedManagers: OrganizationMember[] = [];
          dept.members.forEach((member) => {
            if (selectedManagerIds.includes(member.id)) {
              member.department_role = "Manager";
              selectedManagers.push(member);

              if (member.id) {
                editDepartmentRole({
                  userId: member.id,
                  department_role: 2,
                });
              }
            }
          });

          dept.managers = selectedManagers;
          dept.managerIds = selectedManagerIds;

          toast.success(`Managers for ${dept.name} have been updated`);
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
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-2 hover:bg-gray-50 rounded"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedManagerIds.includes(member.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedManagerIds([
                              ...selectedManagerIds,
                              member.id,
                            ]);
                          } else {
                            setSelectedManagerIds(
                              selectedManagerIds.filter(
                                (id) => id !== member.id,
                              ),
                            );
                          }
                        }}
                        className="h-4 w-4"
                      />
                      <div>
                        <div className="font-medium text-sm">
                          {member.first_name} {member.last_name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {member.position || "No position"}
                        </div>
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
                  {selectedManagerIds.map((managerId) => {
                    const member = department.members.find(
                      (m) => m.id === managerId,
                    );
                    return member ? (
                      <Badge
                        key={managerId}
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        <Crown className="h-3 w-3" />
                        {member.first_name} {member.last_name}
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedManagerIds(
                              selectedManagerIds.filter(
                                (id) => id !== managerId,
                              ),
                            )
                          }
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
            <Button onClick={handleSave}>Save Managers</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="space-y-6">
      {notifications.map((notification) => (
        <NotificationToast
          key={notification.id}
          notification={notification}
          onClose={() => removeNotification(notification.id)}
        />
      ))}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Organization Structure
          </h2>
          <p className="text-muted-foreground">
            Edit departments and team members
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowAddDepartmentModal(true)} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Department
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">
            {/* <div className="text-xl font-bold">Business Unit (EU)</div> */}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            <div className="space-y-6">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Users className="w-5 h-5" />
                Members
              </h3>

              {businessUnits[0]?.departments.map((department) => (
                <div key={department.id} className="space-y-4">
                  <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Building className="w-5 h-5 text-gray-500" />
                      <div className="space-y-1">
                        <div className="font-semibold text-base">
                          {renderEditableInputCell(
                            department.name,
                            "department",
                            department.id,
                            undefined,
                            "name",
                          )}
                        </div>
                        <div className="text-sm text-gray-500"></div>
                        {department.managers.length > 0 && (
                          <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1 flex-wrap">
                            <Crown className="w-3.5 h-3.5 text-yellow-500" />
                            <span className="font-medium">Managers:</span>
                            <span>
                              {department.managers
                                .map((m) => `${m.first_name} ${m.last_name}`)
                                .join(", ")}
                            </span>
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
                      <Badge
                        variant="outline"
                        className="flex items-center gap-1 text-xs"
                      >
                        <Users className="w-3 h-3" />
                        {getAllDepartmentMembers(department).length} total
                      </Badge>
                      <Badge
                        variant="outline"
                        className="flex items-center gap-1 text-xs bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300"
                      >
                        <Crown className="w-3 h-3" />
                        {department.managers.length} managers
                      </Badge>
                      <Badge
                        variant="outline"
                        className="flex items-center gap-1 text-xs bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300"
                      >
                        {
                          getAllDepartmentMembers(department).filter(
                            (m) => m.is_active,
                          ).length
                        }{" "}
                        active
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          removeDepartment(department.id, department.name)
                        }
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

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
                              <TableHead className="w-[25%] py-2">
                                Name
                              </TableHead>
                              <TableHead className="w-[20%] py-2">
                                Position & Grade
                              </TableHead>
                              <TableHead className="w-[25%] py-2">
                                Contact
                              </TableHead>
                              <TableHead className="w-[15%] py-2">
                                Department Role
                              </TableHead>
                              <TableHead className="w-[15%] py-2 text-center">
                                Status
                              </TableHead>
                              <TableHead className="w-[10%] py-2 text-right">
                                Actions
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {getAllDepartmentMembers(department).map(
                              (member) => (
                                <TableRow
                                  key={member.id}
                                  className="hover:bg-gray-50 dark:hover:bg-gray-900/50"
                                >
                                  <TableCell className="py-2">
                                    <div className="text-sm font-medium">
                                      {renderReadOnlyCell(
                                        `${member.first_name} ${member.last_name}`,
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell className="py-2">
                                    <div>
                                      <div className="text-sm font-medium">
                                        {member.position || "-"}
                                      </div>
                                      <div className="text-xs text-gray-500">
                                        {member.grade || "No grade"}
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell className="py-2">
                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                      {renderReadOnlyCell(member.email || "")}
                                    </div>
                                  </TableCell>
                                  <TableCell className="py-2 text-center">
                                    <div className="text-center">
                                      {renderEditableDepartmentRoleCell(
                                        member.department_role || "",
                                        "member",
                                        department.id,
                                        member.id,
                                        "department_role",
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell className="py-2 text-center">
                                    <div className="text-center">
                                      {isEmployeeManager(department, member) ? (
                                        <Badge
                                          variant="outline"
                                          className="flex items-center justify-center gap-1 bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300"
                                        >
                                          <Crown className="h-3 w-3" />
                                          Manager
                                        </Badge>
                                      ) : (
                                        <Badge
                                          variant="outline"
                                          className="flex items-center justify-center gap-1"
                                        >
                                          {member.department_role || "Member"}
                                        </Badge>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell className="py-2 text-right">
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-7 w-7"
                                        >
                                          <MoreVertical className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent
                                        align="end"
                                        className="w-48"
                                      >
                                        <DropdownMenuItem
                                          onClick={() => {
                                            startEditing(
                                              "member",
                                              department.id,
                                              member.id,
                                              "department_role",
                                              member.department_role || "",
                                            );
                                          }}
                                        >
                                          <Edit className="h-3 w-3 mr-2" />
                                          Edit Department Role
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={() => {
                                            toggleEmployeeManager(
                                              department.id,
                                              member,
                                            );
                                          }}
                                        >
                                          {isEmployeeManager(
                                            department,
                                            member,
                                          ) ? (
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
                                        <DropdownMenuItem
                                          className="text-red-600"
                                          onClick={() =>
                                            removeMemberFromDepartment(
                                              department.id,
                                              member.id,
                                            )
                                          }
                                        >
                                          <Trash2 className="h-3 w-3 mr-2" />
                                          Remove
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </TableCell>
                                </TableRow>
                              ),
                            )}
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

      {showAddDepartmentModal && (
        <AddDepartmentModal
          onClose={() => setShowAddDepartmentModal(false)}
          onAdd={addDepartment}
        />
      )}

      {showManagerModal && (
        <ManagerManagementModal
          departmentId={showManagerModal}
          onClose={() => setShowManagerModal(null)}
        />
      )}

      {showDeleteConfirmModal.show && (
        <ConfirmDeleteModal
          departmentName={showDeleteConfirmModal.departmentName}
          onClose={() =>
            setShowDeleteConfirmModal({ show: false, departmentId: 0, departmentName: "" })
          }
          onConfirm={() => handleDeleteDepartment(showDeleteConfirmModal.departmentId)}
        />
      )}
    </div>
  );
}