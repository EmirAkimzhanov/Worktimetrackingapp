// src/components/admin/settings/SettingsTab.tsx
import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '../../ui/card';
import {
    Settings,
    Users,
    Calendar,
    Briefcase,
    Shield,
    Layers,
    Globe,
    Activity,
    PieChart,
    Wrench,
    Building2,
    LineChart,
    CheckSquare,
    MoreHorizontal
} from 'lucide-react';
import { TeamsTab } from '../teams/TeamsTab';
import { CalendarManagement } from '../calendar/CalendarManagementProps';
import SimpleDepartmentsTables from "../department/DepartmentTabs";
import { RoleManagementTab } from '../role/RoleManagementTab';
import { Positions } from '../positions/Positions';
import { useGetDepartments } from '../../../hooks/useDepartments';
import { CountryTable } from '../country/CountryTable';
import { MOCK_DEPARTMENTS } from '../../../const/consts';
import { toast } from 'sonner';
import MonitoringPage from '../monitoring/MonitoringPage';
import { PieTable } from '../pie/PieTable';
import { ServiceTable } from '../service type/ServiceTable';
import { SectorTable } from '../sector/SectorTable';
import { ServiceLineTable } from '../service-line/ServiceLineTable';
import { ProjectStatusTable } from '../project-status/ProjectStatusTable';

// Тип для Department
interface Department {
    id: number;
    name: string;
    description?: string;
    manager_id?: number | null;
    parent_id?: number | null;
    created_at?: string;
    updated_at?: string;
}

type SubTabType =
    | 'teams'
    | 'calendar'
    | 'departments'
    | 'roles'
    | 'positions'
    | 'countries'
    | 'monitoring'
    | 'pie'
    | 'service-type'
    | 'sectors'
    | 'service-line'
    | 'project-status';

interface SettingsTabProps {
    // Teams props
    departments: any[];
    positions: any[];
    users: any[];
    teamMembers: any[];
    onAddDepartment: (department: any) => void;
    onUpdateDepartment: (department: any) => void;
    onDeleteDepartment: (id: number) => void;
    onAddUser: (user: any) => void;
    onUpdateUser: (user: any) => void;
    onDeleteUser: (id: number) => void;
    onAssignToDepartment: (userId: number, departmentId: number, role: any) => void;
    onRemoveFromDepartment: (userId: number, departmentId: number) => void;
    onAddUsersToDepartment: (userIds: number[], departmentId: number) => void;
    onSetDepartmentManager: (departmentId: number, managerId: number | null) => void;

    // Calendar props
    calendarConfigs: any[];
    onUpdateCalendarConfig: (config: any) => void;
    onAddCalendarConfig: (config: any) => void;
    onDeleteCalendarConfig: (id: number) => void;
    onAddHoliday: (countryId: number, holiday: any) => void;
    onUpdateHoliday: (countryId: number, holiday: any) => void;
    onDeleteHoliday: (countryId: number, holidayId: number) => void;
    onAddWorkWeekend: (countryId: number, workWeekend: any) => void;
    onDeleteWorkWeekend: (countryId: number, workWeekendId: number) => void;
    onUpdateWeeklySchedule: (countryId: number, schedule: any) => void;

    // Departments props
    onAddDepartmentFromSettings?: () => void;
    onAddCountryFromSettings?: () => void;

    // Role management props
    onRoleCreated?: (role: any) => void;
    onRoleUpdated?: (role: any) => void;
    onRoleDeleted?: (roleId: string) => void;

    // Positions props
    positionsData?: any[];
    onPositionCreated?: (position: any) => void;
    onPositionUpdated?: (position: any) => void;
    onPositionDeleted?: (positionId: number) => void;
    onGradeCreated?: (positionId: number, grade: string) => void;
    onGradeUpdated?: (positionId: number, gradeIndex: number, grade: string) => void;
    onGradeDeleted?: (positionId: number, gradeIndex: number) => void;
}

export function SettingsTab({
    // Teams
    departments: departmentsProp,
    positions,
    users,
    teamMembers,
    onAddDepartment,
    onUpdateDepartment: onUpdateDepartmentProp,
    onDeleteDepartment: onDeleteDepartmentProp,
    onAddUser,
    onUpdateUser,
    onDeleteUser,
    onAssignToDepartment,
    onRemoveFromDepartment,
    onAddUsersToDepartment,
    onSetDepartmentManager,

    // Calendar
    calendarConfigs,
    onUpdateCalendarConfig,
    onAddCalendarConfig,
    onDeleteCalendarConfig,
    onAddHoliday,
    onUpdateHoliday,
    onDeleteHoliday,
    onAddWorkWeekend,
    onDeleteWorkWeekend,
    onUpdateWeeklySchedule,

    // Callbacks for dialogs
    onAddDepartmentFromSettings,
    onAddCountryFromSettings,

    // Role management callbacks
    onRoleCreated,
    onRoleUpdated,
    onRoleDeleted,

    // Positions callbacks
    positionsData = [
        { id: 1, name: 'Notes', grades: ['Notes'] },
        { id: 2, name: 'Junior', grades: ['Assistant 1', 'Assistant 2'] },
        { id: 3, name: 'Senior', grades: ['Assistant 3', 'Senior 1', 'Senior 2'] },
        { id: 4, name: 'Manager', grades: ['Manager 1', 'Manager 2'] },
        { id: 5, name: 'Senior Manager', grades: ['Senior Manager 1', 'Senior Manager 2'] },
        { id: 6, name: 'Partner', grades: ['Partner'] },
        { id: 7, name: 'Director', grades: ['Director'] }
    ],
    onPositionCreated,
    onPositionUpdated,
    onPositionDeleted,
    onGradeCreated,
    onGradeUpdated,
    onGradeDeleted
}: SettingsTabProps) {
    const [activeSubTab, setActiveSubTab] = useState<SubTabType>('teams');

    const { mutate: getDepartments } = useGetDepartments();

    const handleUpdateDepartment = (department: Department) => {
        if (onUpdateDepartmentProp) {
            onUpdateDepartmentProp(department);
        }
        toast.success('Department updated successfully');
    };

    const handleDeleteDepartment = (id: number) => {
        if (onDeleteDepartmentProp) {
            onDeleteDepartmentProp(id);
        }
        toast.success('Department deleted successfully');
    };

    useEffect(() => {
        getDepartments();
    }, []);

    // Обработчики для Positions
    const handlePositionCreated = (position: any) => {
        if (onPositionCreated) {
            onPositionCreated(position);
        }
    };

    const handlePositionUpdated = (position: any) => {
        if (onPositionUpdated) {
            onPositionUpdated(position);
        }
    };

    const handlePositionDeleted = (positionId: number) => {
        if (onPositionDeleted) {
            onPositionDeleted(positionId);
        }
    };

    const handleGradeCreated = (positionId: number, grade: string) => {
        if (onGradeCreated) {
            onGradeCreated(positionId, grade);
        }
    };

    const handleGradeUpdated = (positionId: number, gradeIndex: number, grade: string) => {
        if (onGradeUpdated) {
            onGradeUpdated(positionId, gradeIndex, grade);
        }
    };

    const handleGradeDeleted = (positionId: number, gradeIndex: number) => {
        if (onGradeDeleted) {
            onGradeDeleted(positionId, gradeIndex);
        }
    };

    // Определяем все табы
    const mainTabs = [
        { id: 'teams', label: 'Teams', icon: Users },
        { id: 'calendar', label: 'Calendar', icon: Calendar },
        { id: 'departments', label: 'Task types', icon: Briefcase },
        { id: 'roles', label: 'Roles', icon: Shield },
        { id: 'positions', label: 'Positions', icon: Layers },
        { id: 'countries', label: 'Countries', icon: Globe },
        { id: 'pie', label: 'PIE', icon: PieChart },
        { id: 'service-type', label: 'Service Type', icon: Wrench },
        { id: 'sectors', label: 'Sectors', icon: Building2 },
        { id: 'service-line', label: 'Service Line', icon: LineChart },
        { id: 'project-status', label: 'Project Status', icon: CheckSquare },
    ] as const;

    return (
        <div className="space-y-6">
            {/* Заголовок */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <Settings className="w-6 h-6" />
                        Settings
                    </h2>
                    <p className="text-muted-foreground">Configure organization settings and management</p>
                </div>

                {/* Кнопки действий в зависимости от активной подвкладки */}
                {activeSubTab === 'teams' && onAddDepartmentFromSettings && (
                    <button
                        onClick={onAddDepartmentFromSettings}
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-black text-white hover:bg-gray-800 h-9 px-4 py-2"
                    >
                        <span>+</span>
                        <span className="ml-2">Add Department</span>
                    </button>
                )}
                {activeSubTab === 'calendar' && onAddCountryFromSettings && (
                    <button
                        onClick={onAddCountryFromSettings}
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-black text-white hover:bg-gray-800 h-9 px-4 py-2"
                    >
                        <span>+</span>
                        <span className="ml-2">Add Country</span>
                    </button>
                )}
            </div>

            {/* Подвкладки */}
            <Card>
                <div className="border-b px-6 py-2">
                    <div className="flex space-x-1 flex-wrap gap-y-2">
                        {mainTabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveSubTab(tab.id)}
                                    className={`
                                        inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors
                                        ${activeSubTab === tab.id
                                            ? '!bg-black !text-white'
                                            : 'text-muted-foreground hover:text-black hover:bg-muted'
                                        }
                                    `}
                                >
                                    <Icon className="w-4 h-4" />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Контент вкладок */}
                <div className="p-0">
                    {/* Teams Content */}
                    {activeSubTab === 'teams' && (
                        <CardContent className="p-6">
                            <TeamsTab
                                departments={departmentsProp}
                                positions={positions}
                                users={users}
                                teamMembers={teamMembers}
                                onAddDepartment={onAddDepartment}
                                onUpdateDepartment={onUpdateDepartmentProp}
                                onDeleteDepartment={onDeleteDepartmentProp}
                                onAddUser={onAddUser}
                                onUpdateUser={onUpdateUser}
                                onDeleteUser={onDeleteUser}
                                onAssignToDepartment={onAssignToDepartment}
                                onRemoveFromDepartment={onRemoveFromDepartment}
                                onAddUsersToDepartment={onAddUsersToDepartment}
                                onSetDepartmentManager={onSetDepartmentManager}
                            />
                        </CardContent>
                    )}

                    {/* Calendar Content */}
                    {activeSubTab === 'calendar' && (
                        <CardContent className="p-6">
                            <CalendarManagement
                                configs={calendarConfigs}
                                onUpdateConfig={onUpdateCalendarConfig}
                                onAddConfig={onAddCalendarConfig}
                                onDeleteConfig={onDeleteCalendarConfig}
                                onAddHoliday={onAddHoliday}
                                onUpdateHoliday={onUpdateHoliday}
                                onDeleteHoliday={onDeleteHoliday}
                                onAddWorkWeekend={onAddWorkWeekend}
                                onDeleteWorkWeekend={onDeleteWorkWeekend}
                                onUpdateWeeklySchedule={onUpdateWeeklySchedule}
                            />
                        </CardContent>
                    )}

                    {/* Departments Content */}
                    {activeSubTab === 'departments' && (
                        <CardContent className="p-6">
                            <SimpleDepartmentsTables
                                departments={departmentsProp}
                                users={users}
                            />
                        </CardContent>
                    )}

                    {/* Roles Content */}
                    {activeSubTab === 'roles' && (
                        <CardContent className="p-6">
                            <RoleManagementTab
                                onRoleCreated={onRoleCreated}
                                onRoleUpdated={onRoleUpdated}
                                onRoleDeleted={onRoleDeleted}
                            />
                        </CardContent>
                    )}

                    {/* Positions Content */}
                    {activeSubTab === 'positions' && (
                        <CardContent className="p-6">
                            <Positions
                                positions={positionsData}
                                onPositionCreated={handlePositionCreated}
                                onPositionUpdated={handlePositionUpdated}
                                onPositionDeleted={handlePositionDeleted}
                                onGradeCreated={handleGradeCreated}
                                onGradeUpdated={handleGradeUpdated}
                                onGradeDeleted={handleGradeDeleted}
                            />
                        </CardContent>
                    )}

                    {/* Countries Content */}
                    {activeSubTab === 'countries' && (
                        <CardContent className="p-6">
                            <CountryTable />
                        </CardContent>
                    )}



                    {/* PIE Content */}
                    {activeSubTab === 'pie' && (
                        <CardContent className="p-6">
                            <PieTable />
                        </CardContent>
                    )}

                    {/* Service Type Content */}
                    {activeSubTab === 'service-type' && (
                        <CardContent className="p-6">
                            <ServiceTable />
                        </CardContent>
                    )}

                    {/* Sectors Content */}
                    {activeSubTab === 'sectors' && (
                        <CardContent className="p-6">
                            <SectorTable />
                        </CardContent>
                    )}

                    {/* Service Line Content */}
                    {activeSubTab === 'service-line' && (
                        <CardContent className="p-6">
                            <ServiceLineTable />
                        </CardContent>
                    )}

                    {/* Project Status Content */}
                    {activeSubTab === 'project-status' && (
                        <CardContent className="p-6">
                            <ProjectStatusTable />
                        </CardContent>
                    )}
                </div>
            </Card>
        </div>
    );
}