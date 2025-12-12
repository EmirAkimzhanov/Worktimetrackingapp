import React, { useState } from 'react';
import { Card, CardContent } from './ui/card';
import { toast } from 'sonner';
import { useTimeTracker, Project } from './TimeTrackerContext';

// Импорт компонентов
import { AdminPanelHeader } from '../components/admin/AdminPanelHeader';
import { ProjectsTable } from '../components/admin/ProjectTables';
import { UsersTable } from '../components/admin/UsersTable';
import { ClientsTable } from '../components/admin/ClientsTable';
import { CalendarManagement } from '../components/admin/calendar/CalendarManagementProps';
import { TeamsTab } from '../components/admin/teams/TeamsTab';
import { ProjectDialog } from '../components/admin/ProjectDialog';
import { UserDialog } from '../components/admin/UserDialog';
import { ClientDialog } from '../components/admin/ClientsDialog';
import { DeleteConfirmationDialog } from '../components/admin/DeleteConfiramtion';

// Импорт констант
import {
  MOCK_POSITIONS,
  MOCK_DEPARTMENTS,
  MOCK_USERS,
  MOCK_CLIENTS,
  COUNTRIES,
  PREDEFINED_COLORS
} from '../const/consts';

import {
  User,
  Client,
  Position,
  Department,
  UserFormData,
  ClientFormData,
  ProjectFormData,
  CountryCalendarConfig,
  Holiday,
  WorkWeekend,
  WeeklySchedule,
  TeamMember
} from '../types/types';

export function AdminPanel() {
  const { projects, addProject, updateProject, deleteProject, entries } = useTimeTracker();

  // Состояния - добавлена вкладка teams
  const [activeTab, setActiveTab] = useState<'projects' | 'users' | 'clients' | 'calendar' | 'teams'>('projects');

  // Состояния диалогов
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [isAddClientDialogOpen, setIsAddClientDialogOpen] = useState(false);

  // Состояния редактирования
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  // Состояния диалогов удаления
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteUserDialogOpen, setDeleteUserDialogOpen] = useState(false);
  const [deleteClientDialogOpen, setDeleteClientDialogOpen] = useState(false);

  // Состояния для удаления
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const [userToDelete, setUserToDelete] = useState<number | null>(null);
  const [clientToDelete, setClientToDelete] = useState<number | null>(null);

  // Данные форм
  const [projectForm, setProjectForm] = useState<ProjectFormData>({
    name: '',
    code: '',
    color: '#1F4E78',
    client_id: undefined,
    project_manager: undefined,
    country: '',
    department: '',
    description: ''
  });

  const [userForm, setUserForm] = useState<UserFormData>({
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    date_joined: new Date().toISOString().split('T')[0],
    leave_date: '',
    is_active: true,
    position_id: 1,
    department_id: 1,
    role: 'user'
  });

  const [clientForm, setClientForm] = useState<ClientFormData>({
    name: '',
    company: '',
    email: '',
    phone: '',
    country: '',
    is_active: true
  });

  // Mock данные
  const [positions] = useState<Position[]>(MOCK_POSITIONS);
  const [departments, setDepartments] = useState<Department[]>(MOCK_DEPARTMENTS);
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [clients, setClients] = useState<Client[]>(MOCK_CLIENTS);

  // Состояние для Teams - добавьте поля assignedAt и updatedAt
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    {
      id: 1,
      userId: 1,
      departmentId: 1,
      role: 'manager',
      assignedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 2,
      userId: 2,
      departmentId: 2,
      role: 'member',
      assignedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 3,
      userId: 3,
      departmentId: 1,
      role: 'member',
      assignedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ]);

  // Calendar Configuration Data
  const [calendarConfigs, setCalendarConfigs] = useState<CountryCalendarConfig[]>([
    {
      id: 0,
      country: 'General',
      countryCode: 'GENERAL',
      weeklySchedule: {
        id: 0,
        country_id: 0,
        monday: true,
        tuesday: true,
        wednesday: true,
        thursday: true,
        friday: true,
        saturday: false,
        sunday: false,
        workHoursPerDay: 8
      },
      holidays: [
        {
          id: 1,
          country_id: 0,
          date: '2024-01-01',
          name: "New Year's Day",
          is_halfday: false,
          is_recurring: true
        },
        {
          id: 2,
          country_id: 0,
          date: '2024-12-25',
          name: 'Christmas Day',
          is_halfday: false,
          is_recurring: true
        }
      ],
      workWeekends: [
        {
          id: 1,
          country_id: 0,
          date: '2024-01-06',
          description: 'Saturday (working day)'
        }
      ],
      statistics: {
        yearlyWorkDays: 250,
        yearlyHours: 2000,
        daysInWeek: 5,
        hoursInWeek: 40,
        vacationDays: 25,
        lastUpdated: new Date().toISOString()
      }
    },
    {
      id: 1,
      country: 'Kazakhstan',
      countryCode: 'KZ',
      weeklySchedule: {
        id: 1,
        country_id: 1,
        monday: true,
        tuesday: true,
        wednesday: true,
        thursday: true,
        friday: true,
        saturday: false,
        sunday: false,
        workHoursPerDay: 8
      },
      holidays: [
        {
          id: 3,
          country_id: 1,
          date: '2024-03-08',
          name: "Women's Day",
          is_halfday: false,
          is_recurring: true
        },
        {
          id: 4,
          country_id: 1,
          date: '2024-03-21',
          name: 'Nauryz',
          is_halfday: false,
          is_recurring: true
        }
      ],
      workWeekends: [],
      statistics: {
        yearlyWorkDays: 248,
        yearlyHours: 1984,
        daysInWeek: 5,
        hoursInWeek: 40,
        vacationDays: 24,
        lastUpdated: new Date().toISOString()
      }
    },
    {
      id: 2,
      country: 'Kyrgyzstan',
      countryCode: 'KG',
      weeklySchedule: {
        id: 2,
        country_id: 2,
        monday: true,
        tuesday: true,
        wednesday: true,
        thursday: true,
        friday: true,
        saturday: false,
        sunday: false,
        workHoursPerDay: 8
      },
      holidays: [
        {
          id: 5,
          country_id: 2,
          date: '2024-03-08',
          name: "Women's Day",
          is_halfday: false,
          is_recurring: true
        },
        {
          id: 6,
          country_id: 2,
          date: '2024-03-21',
          name: 'Nooruz',
          is_halfday: false,
          is_recurring: true
        }
      ],
      workWeekends: [],
      statistics: {
        yearlyWorkDays: 247,
        yearlyHours: 1976,
        daysInWeek: 5,
        hoursInWeek: 40,
        vacationDays: 24,
        lastUpdated: new Date().toISOString()
      }
    }
  ]);

  // Функции сброса форм
  const resetProjectForm = () => {
    setProjectForm({
      name: '',
      code: '',
      color: '#1F4E78',
      client_id: undefined,
      project_manager: undefined,
      country: '',
      department: '',
      description: ''
    });
  };

  const resetUserForm = () => {
    setUserForm({
      email: '',
      first_name: '',
      last_name: '',
      password: '',
      date_joined: new Date().toISOString().split('T')[0],
      leave_date: '',
      is_active: true,
      position_id: 1,
      department_id: 1,
      role: 'user'
    });
  };

  const resetClientForm = () => {
    setClientForm({
      name: '',
      company: '',
      email: '',
      phone: '',
      country: '',
      is_active: true
    });
  };

  // Обработчики для проектов
  const handleAddProject = () => {
    if (!projectForm.name.trim() || !projectForm.code.trim() || !projectForm.country.trim() || !projectForm.department.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (projects.some(p => p.code.toLowerCase() === projectForm.code.toLowerCase())) {
      toast.error('Project code already exists');
      return;
    }

    // Find client name if client selected
    const clientName = projectForm.client_id ?
      clients.find(c => c.id === projectForm.client_id)?.company : undefined;

    // Find project manager name if selected
    const projectManagerName = projectForm.project_manager ?
      users.find(u => u.id === projectForm.project_manager)?.first_name + ' ' +
      users.find(u => u.id === projectForm.project_manager)?.last_name : undefined;

    addProject({
      name: projectForm.name,
      code: projectForm.code.toUpperCase(),
      color: projectForm.color,
      client_id: projectForm.client_id,
      clientName: clientName,
      projectManager: projectForm.project_manager,
      projectManagerName: projectManagerName,
      country: projectForm.country,
      department: projectForm.department,
      description: projectForm.description
    });

    toast.success('Project added successfully');
    setIsAddDialogOpen(false);
    resetProjectForm();
  };

  const handleUpdateProject = () => {
    if (!editingProject) return;

    if (!projectForm.name.trim() || !projectForm.code.trim() || !projectForm.country.trim() || !projectForm.department.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (projects.some(p => p.id !== editingProject.id && p.code.toLowerCase() === projectForm.code.toLowerCase())) {
      toast.error('Project code already exists');
      return;
    }

    // Find client name if client selected
    const clientName = projectForm.client_id ?
      clients.find(c => c.id === projectForm.client_id)?.company : undefined;

    // Find project manager name if selected
    const projectManagerName = projectForm.project_manager ?
      users.find(u => u.id === projectForm.project_manager)?.first_name + ' ' +
      users.find(u => u.id === projectForm.project_manager)?.last_name : undefined;

    updateProject(editingProject.id, {
      name: projectForm.name,
      code: projectForm.code.toUpperCase(),
      color: projectForm.color,
      client_id: projectForm.client_id,
      clientName: clientName,
      projectManager: projectForm.project_manager,
      projectManagerName: projectManagerName,
      country: projectForm.country,
      department: projectForm.department,
      description: projectForm.description
    });

    toast.success('Project updated successfully');
    setEditingProject(null);
    resetProjectForm();
  };

  // Обработчики для пользователей
  const handleAddUser = () => {
    if (!userForm.email.trim() || !userForm.first_name.trim() || !userForm.last_name.trim() || !userForm.password.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (users.some(u => u.email.toLowerCase() === userForm.email.toLowerCase())) {
      toast.error('Email already exists');
      return;
    }

    const newUser: User = {
      id: Date.now(),
      email: userForm.email,
      first_name: userForm.first_name,
      last_name: userForm.last_name,
      date_joined: userForm.date_joined,
      leave_date: userForm.leave_date || '',
      is_active: userForm.is_active,
      position_id: userForm.position_id,
      department_id: userForm.department_id,
      role: userForm.role
    };

    setUsers(prev => [...prev, newUser]);
    toast.success('User added successfully');
    setIsAddUserDialogOpen(false);
    resetUserForm();
  };

  const handleUpdateUser = () => {
    if (!editingUser) return;

    if (!userForm.email.trim() || !userForm.first_name.trim() || !userForm.last_name.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (users.some(u => u.id !== editingUser.id && u.email.toLowerCase() === userForm.email.toLowerCase())) {
      toast.error('Email already exists');
      return;
    }

    setUsers(prev => prev.map(user =>
      user.id === editingUser.id
        ? {
          ...user,
          email: userForm.email,
          first_name: userForm.first_name,
          last_name: userForm.last_name,
          date_joined: userForm.date_joined,
          leave_date: userForm.leave_date || '',
          is_active: userForm.is_active,
          position_id: userForm.position_id,
          department_id: userForm.department_id,
          role: userForm.role
        }
        : user
    ));

    toast.success('User updated successfully');
    setEditingUser(null);
    resetUserForm();
  };

  // Обработчики для клиентов
  const handleAddClient = () => {
    if (!clientForm.name.trim() || !clientForm.company.trim() || !clientForm.email.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (clients.some(c => c.email.toLowerCase() === clientForm.email.toLowerCase())) {
      toast.error('Client email already exists');
      return;
    }

    const newClient: Client = {
      id: Date.now(),
      name: clientForm.name,
      company: clientForm.company,
      email: clientForm.email,
      phone: clientForm.phone,
      country: clientForm.country,
      is_active: clientForm.is_active,
      created_at: new Date().toISOString().split('T')[0]
    };

    setClients(prev => [...prev, newClient]);
    toast.success('Client added successfully');
    setIsAddClientDialogOpen(false);
    resetClientForm();
  };

  const handleUpdateClient = () => {
    if (!editingClient) return;

    if (!clientForm.name.trim() || !clientForm.company.trim() || !clientForm.email.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (clients.some(c => c.id !== editingClient.id && c.email.toLowerCase() === clientForm.email.toLowerCase())) {
      toast.error('Client email already exists');
      return;
    }

    setClients(prev => prev.map(client =>
      client.id === editingClient.id
        ? {
          ...client,
          name: clientForm.name,
          company: clientForm.company,
          email: clientForm.email,
          phone: clientForm.phone,
          country: clientForm.country,
          is_active: clientForm.is_active
        }
        : client
    ));

    toast.success('Client updated successfully');
    setEditingClient(null);
    resetClientForm();
  };

  // Teams Management Handlers
  const handleAddDepartment = (department: Omit<Department, 'id'>) => {
    const newDept: Department = {
      ...department,
      id: Date.now()
    };
    setDepartments(prev => [...prev, newDept]);
    toast.success('Department added successfully');
  };

  const handleUpdateDepartment = (department: Department) => {
    setDepartments(prev => prev.map(d => d.id === department.id ? department : d));
    toast.success('Department updated successfully');
  };

  const handleDeleteDepartment = (id: number) => {
    setDepartments(prev => prev.filter(d => d.id !== id));
    // Также удаляем членов этого отдела
    setTeamMembers(prev => prev.filter(member => member.departmentId !== id));
    toast.success('Department deleted successfully');
  };

  const handleAddUserForTeams = (user: Omit<User, 'id'>) => {
    if (!user.email.trim() || !user.first_name.trim() || !user.last_name.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (users.some(u => u.email.toLowerCase() === user.email.toLowerCase())) {
      toast.error('Email already exists');
      return;
    }

    const newUser: User = {
      id: Date.now(),
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      date_joined: user.date_joined,
      leave_date: user.leave_date || '',
      is_active: user.is_active,
      position_id: user.position_id,
      department_id: user.department_id,
      role: user.role
    };

    setUsers(prev => [...prev, newUser]);
    toast.success('User added successfully');
  };

  const handleUpdateUserForTeams = (user: User) => {
    if (!user.email.trim() || !user.first_name.trim() || !user.last_name.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (users.some(u => u.id !== user.id && u.email.toLowerCase() === user.email.toLowerCase())) {
      toast.error('Email already exists');
      return;
    }

    setUsers(prev => prev.map(u => u.id === user.id ? user : u));
    toast.success('User updated successfully');
  };

  const handleAssignToDepartment = (userId: number, departmentId: number, role: TeamMember['role']) => {
    // Сначала удаляем пользователя из других отделов с такой же ролью manager
    setTeamMembers(prev => prev.filter(member =>
      !(member.userId === userId && member.role === 'manager')
    ));

    // Проверяем, есть ли уже такой участник в этом отделе
    const existingMember = teamMembers.find(member =>
      member.userId === userId && member.departmentId === departmentId
    );

    if (existingMember) {
      // Обновляем существующего участника
      setTeamMembers(prev => prev.map(member =>
        member.id === existingMember.id
          ? { ...member, role, updatedAt: new Date().toISOString() }
          : member
      ));
    } else {
      // Добавляем нового участника
      const newMember: TeamMember = {
        id: Date.now(),
        userId,
        departmentId,
        role,
        assignedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setTeamMembers(prev => [...prev, newMember]);
    }

    toast.success('User assigned to department successfully');
  };

  const handleRemoveFromDepartment = (userId: number, departmentId: number) => {
    setTeamMembers(prev => prev.filter(member =>
      !(member.userId === userId && member.departmentId === departmentId)
    ));
    toast.success('User removed from department');
  };

  // НОВЫЕ ФУНКЦИИ ДЛЯ TeamsTab
  const handleAddUsersToDepartment = (userIds: number[], departmentId: number) => {
    const newTeamMembers: TeamMember[] = userIds.map(userId => {
      const existingMember = teamMembers.find(
        m => m.userId === userId && m.departmentId === departmentId
      );

      if (existingMember) {
        return {
          ...existingMember,
          updatedAt: new Date().toISOString()
        };
      }

      return {
        id: Date.now() + userId, // Временный ID
        userId,
        departmentId,
        role: 'member',
        assignedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    });

    setTeamMembers(prev => {
      // Удаляем существующих участников для этих пользователей в этом отделе (если есть)
      const filtered = prev.filter(m =>
        !(userIds.includes(m.userId) && m.departmentId === departmentId)
      );
      return [...filtered, ...newTeamMembers];
    });

    // Обновляем department_id у пользователей
    setUsers(prev => prev.map(user =>
      userIds.includes(user.id)
        ? { ...user, department_id: departmentId }
        : user
    ));

    toast.success(`Added ${userIds.length} users to department`);
  };

  const handleSetDepartmentManager = (departmentId: number, managerId: number | null) => {
    setTeamMembers(prev => {
      // Убираем роль manager у всех пользователей в этом отделе
      const updatedMembers = prev.map(member =>
        member.departmentId === departmentId && member.role === 'manager'
          ? { ...member, role: 'member', updatedAt: new Date().toISOString() }
          : member
      );

      // Если указан новый менеджер, назначаем ему роль manager
      if (managerId) {
        const existingMemberIndex = updatedMembers.findIndex(
          m => m.userId === managerId && m.departmentId === departmentId
        );

        if (existingMemberIndex !== -1) {
          // Обновляем существующего участника команды
          updatedMembers[existingMemberIndex] = {
            ...updatedMembers[existingMemberIndex],
            role: 'manager',
            updatedAt: new Date().toISOString()
          };
        } else {
          // Добавляем нового участника команды как менеджера
          updatedMembers.push({
            id: prev.length > 0 ? Math.max(...prev.map(tm => tm.id)) + 1 : 1,
            userId: managerId,
            departmentId,
            role: 'manager',
            assignedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }
      }

      return updatedMembers;
    });

    if (managerId) {
      toast.success('Department manager set successfully');
    } else {
      toast.success('Department manager removed');
    }
  };

  // Calendar Management Handlers
  const handleUpdateCalendarConfig = (config: CountryCalendarConfig) => {
    setCalendarConfigs(prev =>
      prev.map(c => c.id === config.id ? config : c)
    );
    toast.success('Calendar configuration updated');
  };

  const handleAddHoliday = (countryId: number, holiday: Holiday) => {
    setCalendarConfigs(prev =>
      prev.map(config =>
        config.id === countryId
          ? {
            ...config,
            holidays: [...config.holidays, holiday],
            statistics: {
              ...config.statistics,
              yearlyWorkDays: Math.max(0, config.statistics.yearlyWorkDays - 1),
              yearlyHours: Math.max(0, config.statistics.yearlyHours - (config.weeklySchedule.workHoursPerDay * (holiday.is_halfday ? 0.5 : 1))),
              lastUpdated: new Date().toISOString()
            }
          }
          : config
      )
    );
    toast.success('Holiday added successfully');
  };

  const handleUpdateHoliday = (countryId: number, holiday: Holiday) => {
    setCalendarConfigs(prev =>
      prev.map(config =>
        config.id === countryId
          ? {
            ...config,
            holidays: config.holidays.map(h => h.id === holiday.id ? holiday : h),
            statistics: {
              ...config.statistics,
              lastUpdated: new Date().toISOString()
            }
          }
          : config
      )
    );
    toast.success('Holiday updated successfully');
  };

  const handleDeleteHoliday = (countryId: number, holidayId: number) => {
    setCalendarConfigs(prev =>
      prev.map(config =>
        config.id === countryId
          ? {
            ...config,
            holidays: config.holidays.filter(h => h.id !== holidayId)
          }
          : config
      )
    );
    toast.success('Holiday deleted successfully');
  };

  const handleAddWorkWeekend = (countryId: number, workWeekend: WorkWeekend) => {
    setCalendarConfigs(prev =>
      prev.map(config =>
        config.id === countryId
          ? {
            ...config,
            workWeekends: [...config.workWeekends, workWeekend],
            statistics: {
              ...config.statistics,
              yearlyWorkDays: config.statistics.yearlyWorkDays + 1,
              yearlyHours: config.statistics.yearlyHours + config.weeklySchedule.workHoursPerDay,
              lastUpdated: new Date().toISOString()
            }
          }
          : config
      )
    );
    toast.success('Work weekend added successfully');
  };

  const handleDeleteWorkWeekend = (countryId: number, workWeekendId: number) => {
    setCalendarConfigs(prev =>
      prev.map(config =>
        config.id === countryId
          ? {
            ...config,
            workWeekends: config.workWeekends.filter(ww => ww.id !== workWeekendId)
          }
          : config
      )
    );
    toast.success('Work weekend removed successfully');
  };

  const handleUpdateWeeklySchedule = (countryId: number, schedule: WeeklySchedule) => {
    setCalendarConfigs(prev =>
      prev.map(config => {
        if (config.id === countryId) {
          // Calculate new statistics based on updated schedule
          const workDaysCount = [
            schedule.monday,
            schedule.tuesday,
            schedule.wednesday,
            schedule.thursday,
            schedule.friday,
            schedule.saturday,
            schedule.sunday
          ].filter(Boolean).length;

          const weeklyHours = workDaysCount * schedule.workHoursPerDay;
          const yearlyWorkDays = Math.floor((365 - config.holidays.length) * (workDaysCount / 7));
          const yearlyHours = yearlyWorkDays * schedule.workHoursPerDay;

          return {
            ...config,
            weeklySchedule: schedule,
            statistics: {
              ...config.statistics,
              daysInWeek: workDaysCount,
              hoursInWeek: weeklyHours,
              yearlyWorkDays,
              yearlyHours,
              lastUpdated: new Date().toISOString()
            }
          };
        }
        return config;
      })
    );
    toast.success('Weekly schedule updated successfully');
  };

  // Обработчики редактирования
  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setProjectForm({
      name: project.name,
      code: project.code,
      color: project.color,
      client_id: project.client_id,
      project_manager: project.projectManager,
      country: project.country || '',
      department: project.department || '',
      description: project.description || ''
    });
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setUserForm({
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      password: '',
      date_joined: user.date_joined,
      leave_date: user.leave_date || '',
      is_active: user.is_active,
      position_id: user.position_id,
      department_id: user.department_id,
      role: user.role
    });
  };

  const handleEditClient = (client: Client) => {
    setEditingClient(client);
    setClientForm({
      name: client.name,
      company: client.company,
      email: client.email,
      phone: client.phone,
      country: client.country,
      is_active: client.is_active
    });
  };

  // Обработчики удаления
  const handleDeleteProject = (id: string) => {
    setProjectToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteUser = (id: number) => {
    setUserToDelete(id);
    setDeleteUserDialogOpen(true);
  };

  const handleDeleteClient = (id: number) => {
    setClientToDelete(id);
    setDeleteClientDialogOpen(true);
  };

  // Функции подтверждения удаления
  const confirmDeleteProject = () => {
    if (projectToDelete) {
      const entriesCount = entries.filter(e => e.projectId === projectToDelete).length;
      deleteProject(projectToDelete);
      toast.success(`Project deleted successfully${entriesCount > 0 ? ` (${entriesCount} time entries removed)` : ''}`);
      setProjectToDelete(null);
    }
    setDeleteDialogOpen(false);
  };

  const confirmDeleteUser = () => {
    if (userToDelete) {
      setUsers(prev => prev.filter(user => user.id !== userToDelete));
      // Также удаляем все записи этого пользователя из команд
      setTeamMembers(prev => prev.filter(member => member.userId !== userToDelete));
      toast.success('User deleted successfully');
      setUserToDelete(null);
    }
    setDeleteUserDialogOpen(false);
  };

  const confirmDeleteClient = () => {
    if (clientToDelete) {
      setClients(prev => prev.filter(client => client.id !== clientToDelete));
      toast.success('Client deleted successfully');
      setClientToDelete(null);
    }
    setDeleteClientDialogOpen(false);
  };

  const handleAddCalendarConfig = (config: CountryCalendarConfig) => {
    setCalendarConfigs(prev => [...prev, config]);
    toast.success("Country added");
  };

  const handleDeleteCalendarConfig = (id: number) => {
    setCalendarConfigs(prev => prev.filter(c => c.id !== id));
    toast.success("Country deleted");
  };

  const handleAddButtonClick = () => {
    switch (activeTab) {
      case 'projects':
        setIsAddDialogOpen(true);
        break;
      case 'users':
        setIsAddUserDialogOpen(true);
        break;
      case 'clients':
        setIsAddClientDialogOpen(true);
        break;
      case 'calendar':
        // Calendar management handles its own dialogs
        break;
      case 'teams':
        // Teams handles its own dialogs
        break;
    }
  };

  return (
    <>
      <Card className="shadow-md">
        <AdminPanelHeader
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onAddClick={handleAddButtonClick}
        />
        <CardContent className="pt-6">
          {activeTab === 'projects' && (
            <ProjectsTable
              projects={projects}
              entries={entries}
              clients={clients}
              users={users}
              positions={positions}
              departments={departments}
              onEdit={handleEditProject}
              onDelete={handleDeleteProject}
            />
          )}

          {activeTab === 'users' && (
            <UsersTable
              users={users}
              positions={positions}
              departments={departments}
              onEdit={handleEditUser}
              onDelete={handleDeleteUser}
            />
          )}

          {activeTab === 'clients' && (
            <ClientsTable
              clients={clients}
              onEdit={handleEditClient}
              onDelete={handleDeleteClient}
            />
          )}

          {activeTab === 'calendar' && (
            <CalendarManagement
              configs={calendarConfigs}
              onUpdateConfig={handleUpdateCalendarConfig}
              onAddConfig={handleAddCalendarConfig}
              onDeleteConfig={handleDeleteCalendarConfig}
              onAddHoliday={handleAddHoliday}
              onUpdateHoliday={handleUpdateHoliday}
              onDeleteHoliday={handleDeleteHoliday}
              onAddWorkWeekend={handleAddWorkWeekend}
              onDeleteWorkWeekend={handleDeleteWorkWeekend}
              onUpdateWeeklySchedule={handleUpdateWeeklySchedule}
            />
          )}

          {activeTab === 'teams' && (
            <TeamsTab
              departments={departments}
              positions={positions}
              users={users}
              teamMembers={teamMembers}
              onAddDepartment={handleAddDepartment}
              onUpdateDepartment={handleUpdateDepartment}
              onDeleteDepartment={handleDeleteDepartment}
              onAddUser={handleAddUserForTeams}
              onUpdateUser={handleUpdateUserForTeams}
              onDeleteUser={handleDeleteUser}
              onAssignToDepartment={handleAssignToDepartment}
              onRemoveFromDepartment={handleRemoveFromDepartment}
              onAddUsersToDepartment={handleAddUsersToDepartment}
              onSetDepartmentManager={handleSetDepartmentManager}
            />
          )}
        </CardContent>
      </Card>

      {/* Диалог проекта */}
      <ProjectDialog
        open={isAddDialogOpen || !!editingProject}
        onOpenChange={(open: boolean) => {
          if (!open) {
            setIsAddDialogOpen(false);
            setEditingProject(null);
            resetProjectForm();
          }
        }}
        editingProject={editingProject}
        projectForm={projectForm}
        setProjectForm={setProjectForm}
        users={users}
        clients={clients}
        countries={COUNTRIES}
        predefinedColors={PREDEFINED_COLORS}
        onSave={editingProject ? handleUpdateProject : handleAddProject}
      />

      {/* Диалог пользователя */}
      <UserDialog
        open={isAddUserDialogOpen || !!editingUser}
        onOpenChange={(open: boolean) => {
          if (!open) {
            setIsAddUserDialogOpen(false);
            setEditingUser(null);
            resetUserForm();
          }
        }}
        editingUser={editingUser}
        userForm={userForm}
        setUserForm={setUserForm}
        positions={positions}
        departments={departments}
        onSave={editingUser ? handleUpdateUser : handleAddUser}
      />

      {/* Диалог клиента */}
      <ClientDialog
        open={isAddClientDialogOpen || !!editingClient}
        onOpenChange={(open: boolean) => {
          if (!open) {
            setIsAddClientDialogOpen(false);
            setEditingClient(null);
            resetClientForm();
          }
        }}
        editingClient={editingClient}
        clientForm={clientForm}
        setClientForm={setClientForm}
        countries={COUNTRIES}
        onSave={editingClient ? handleUpdateClient : handleAddClient}
      />

      {/* Диалог подтверждения удаления проекта */}
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Project"
        description="Are you sure you want to delete this project? All associated time entries will also be removed. This action cannot be undone."
        onConfirm={confirmDeleteProject}
      />

      {/* Диалог подтверждения удаления пользователя */}
      <DeleteConfirmationDialog
        open={deleteUserDialogOpen}
        onOpenChange={setDeleteUserDialogOpen}
        title="Delete User"
        description="Are you sure you want to delete this user? This action cannot be undone."
        onConfirm={confirmDeleteUser}
      />

      {/* Диалог подтверждения удаления клиента */}
      <DeleteConfirmationDialog
        open={deleteClientDialogOpen}
        onOpenChange={setDeleteClientDialogOpen}
        title="Delete Client"
        description="Are you sure you want to delete this client? This action cannot be undone."
        onConfirm={confirmDeleteClient}
      />
    </>
  );
}