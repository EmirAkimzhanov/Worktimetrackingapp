// src/components/admin/SettingsTab.tsx
import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '../../ui/card';
import { Settings, Users, Calendar, Briefcase, Shield, Layers } from 'lucide-react';
import { TeamsTab } from '../teams/TeamsTab';
import { CalendarManagement } from '../calendar/CalendarManagementProps';
import SimpleDepartmentsTables from "../department/DepartmentTabs";
import { RoleManagementTab } from '../role/RoleManagementTab';
import { Positions } from '../positions/Positions';
import { useGetDepartments } from '../../../hooks/useDepartments';

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
    departments,
    positions,
    users,
    teamMembers,
    onAddDepartment,
    onUpdateDepartment,
    onDeleteDepartment,
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
    positionsData = [{ id: 1, name: 'Notes', grades: ['Notes'] },
    { id: 2, name: 'Junior', grades: ['Assistant 1', 'Assistant 2'] },
    { id: 3, name: 'Senior', grades: ['Assistant 3', 'Senior 1', 'Senior 2'] },
    { id: 4, name: 'Manager', grades: ['Manager 1', 'Manager 2'] },
    { id: 5, name: 'Senior Manager', grades: ['Senior Manager 1', 'Senior Manager 2'] },
    { id: 6, name: 'Partner', grades: ['Partner'] },
    { id: 7, name: 'Director', grades: ['Director'] }],
    onPositionCreated,
    onPositionUpdated,
    onPositionDeleted,
    onGradeCreated,
    onGradeUpdated,
    onGradeDeleted
}: SettingsTabProps) {
    const [activeSubTab, setActiveSubTab] = useState<'teams' | 'calendar' | 'departments' | 'roles' | 'positions'>('teams');

    const { mutate: getDepartments } = useGetDepartments();

    useEffect(() => {
        getDepartments();
    }, [])

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
                {/* Кастомные табы */}
                <div className="border-b px-6 py-2">
                    <div className="flex space-x-1">
                        <button
                            onClick={() => setActiveSubTab('teams')}
                            className={`
                                inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors
                                ${activeSubTab === 'teams'
                                    ? '!bg-black !text-white'
                                    : 'text-muted-foreground hover:text-black hover:bg-muted'
                                }
                            `}
                        >
                            <Users className="w-4 h-4" />
                            Teams
                        </button>

                        <button
                            onClick={() => setActiveSubTab('calendar')}
                            className={`
                                inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors
                                ${activeSubTab === 'calendar'
                                    ? '!bg-black !text-white'
                                    : 'text-muted-foreground hover:text-black hover:bg-muted'
                                }
                            `}
                        >
                            <Calendar className="w-4 h-4" />
                            Calendar
                        </button>

                        <button
                            onClick={() => setActiveSubTab('departments')}
                            className={`
                                inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors
                                ${activeSubTab === 'departments'
                                    ? '!bg-black !text-white'
                                    : 'text-muted-foreground hover:text-black hover:bg-muted'
                                }
                            `}
                        >
                            <Briefcase className="w-4 h-4" />
                            Tasks
                        </button>

                        <button
                            onClick={() => setActiveSubTab('roles')}
                            className={`
                                inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors
                                ${activeSubTab === 'roles'
                                    ? '!bg-black !text-white'
                                    : 'text-muted-foreground hover:text-black hover:bg-muted'
                                }
                            `}
                        >
                            <Shield className="w-4 h-4" />
                            Roles
                        </button>

                        <button
                            onClick={() => setActiveSubTab('positions')}
                            className={`
                                inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors
                                ${activeSubTab === 'positions'
                                    ? '!bg-black !text-white'
                                    : 'text-muted-foreground hover:text-black hover:bg-muted'
                                }
                            `}
                        >
                            <Layers className="w-4 h-4" />
                            Positions
                        </button>
                    </div>
                </div>

                {/* Контент вкладок */}
                <div className="p-0">
                    {/* Teams Content */}
                    {activeSubTab === 'teams' && (
                        <CardContent className="p-6">
                            <TeamsTab
                                departments={departments}
                                positions={positions}
                                users={users}
                                teamMembers={teamMembers}
                                onAddDepartment={onAddDepartment}
                                onUpdateDepartment={onUpdateDepartment}
                                onDeleteDepartment={onDeleteDepartment}
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
                                departments={departments}
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
                </div>
            </Card>
        </div>
    );
}