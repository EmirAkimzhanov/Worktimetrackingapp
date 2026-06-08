// src/store/userStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Countries } from "../types/countries";
import { CountryWithClients, MainEntity, OnlyClient } from "../types/client";
import { Project, ProjectBody, ProjectTasks } from "../types/project";
import { Task, TasksArray } from "../types/task";
import { LeaveArray } from "../types/leave";
import { LeaveReportsData } from "../types/leaveReport";
import { Holidays, TimeEntry, WorkingWeekends } from "../types/timeEntrys";
import { Department, Position } from "../types/types";
import { DepartmentWithMembers } from "../types/departments";
import { Status, StatusesArray } from "../types/statuses";
import { ServiceLines } from "../types/serviceLines";
import { DepartmentRole } from "../types/user";
import { DepartmentsResponse } from "../types/deaprtments";
import { Calendar } from "../types/calendar";
import { Monitoring } from "../types/monitoring";
import { GlobalSettings } from "../types/settings";
import { Me } from "../types/auth";
import { Manager } from "../types/managers";
import { getWorkingWeekends } from "../services/timeEntry";

// Определяем тип для роли (можно заменить на импорт из types, если есть)
export interface Role {
  id: number;
  name: string;
  description?: string;
  permissions?: string[];
}

// Типы для отчетов
export interface TimeReport {
  id: number;
  userId: number;
  userName: string;
  date: string;
  hours: number;
  projectId?: number;
  projectName?: string;
  taskId?: number;
  taskName?: string;
  status: 'approved' | 'pending' | 'rejected';
  approvedBy?: number;
  approvedAt?: string;
}

export interface ProjectReport {
  id: number;
  projectId: number;
  projectName: string;
  clientId: number;
  clientName: string;
  totalHours: number;
  billableHours: number;
  nonBillableHours: number;
  utilization: number;
  teamMembers: number;
  startDate: string;
  endDate: string;
  status: 'active' | 'completed' | 'on_hold';
}

export interface UserReport {
  userId: number;
  userName: string;
  userEmail: string;
  departmentId?: number;
  departmentName?: string;
  position?: string;
  totalHoursWorked: number;
  overtimeHours: number;
  leaveDays: number;
  sickDays: number;
  utilization: number;
  periodStart: string;
  periodEnd: string;
}

export interface FinancialReport {
  id: number;
  period: string;
  revenue: number;
  costs: number;
  profit: number;
  margin: number;
  projectsCount: number;
  clientsCount: number;
  billableHours: number;
  nonBillableHours: number;
}

export interface ReportFilters {
  startDate?: string;
  endDate?: string;
  userId?: number;
  projectId?: number;
  clientId?: number;
  departmentId?: number;
  status?: string;
}

export interface ReportSummary {
  totalHours: number;
  totalProjects: number;
  totalUsers: number;
  totalRevenue: number;
  averageUtilization: number;
  billablePercentage: number;
}

export interface UsersPagination {
  count: number;
  next: string | null;
  previous: string | null;
  currentPage: number;
  pageSize: number;
}

export interface ClientsPagination {
  count: number;
  next: string | null;
  previous: string | null;
  currentPage: number;
  pageSize: number;
}

export type ReportType = 'time' | 'project' | 'user' | 'financial' | 'custom';

// Единый тип для всех отчетов
export interface ReportsData {
  timeReports: TimeReport[] | null;
  projectReports: ProjectReport[] | null;
  userReports: UserReport[] | null;
  financialReports: FinancialReport[] | null;
  reportFilters: ReportFilters | null;
  reportSummary: ReportSummary | null;
}

// Тип для статистики time entries
export interface TimeEntriesStats {
  total_hours: number;
  expected_hours: number;
  completion_rate: number;
  worked_days: number;
  total_working_days: number;
  total_records: number;
}

interface User {
  id: number;
  username: string;
  email: string;
  name: string;
  role: string;
}

interface ProjectsPagination {
  count: number;
  next: string | null;
  previous: string | null;
  currentPage: number;
  pageSize: number;
}

interface UserState {
  access_token: string | null;
  refresh_token: string | null;
  user: User | null;

  countries: Countries | null;
  selectedCountry: CountryWithClients | null;

  client_projects: MainEntity | null;
  project_tasks: ProjectTasks | null;

  internal_tasks: TasksArray | null;

  leaves: LeaveArray | null;
  leaves_reports: LeaveReportsData | null;

  time_entries: TimeEntry[] | null;

  time_entry: TimeEntry | null;

  time_entries_stats: TimeEntriesStats | null;

  departments: Department[] | null;

  department_members: DepartmentWithMembers | null;

  statuses: StatusesArray | null;

  clients: OnlyClient[] | null;

  service_lines: ServiceLines[] | null;

  task_types: ServiceLines[] | null;

  projects: ProjectBody[] | null;

  users: User[] | null;

  department_roles: DepartmentRole[] | null;

  user_grades: DepartmentRole[] | null;

  positions: Position[] | null;

  sectors: Status[] | null;

  department_workers: DepartmentsResponse | null;

  calendar: Calendar[] | null;

  tasks: Task[] | null;

  roles: Role[] | null;

  reports: ReportsData | null;

  monitoring: Monitoring[] | null;

  globalSettings: GlobalSettings | null;

  calendar_holidays: Holidays[] | null;

  me: Me | null;

  managers: Manager[] | null;

  accounts_statuses: Status[] | null;

  currentMonth: string | null;
  currentYear: string | null;

  workingWeekends: WorkingWeekends[] | null;

  projectsPagination: ProjectsPagination | null;
  usersPagination: UsersPagination | null;
  clientsPagination: ClientsPagination | null;

  setUser: (
    user: User,
    tokens: { access_token: string; refresh_token: string },
  ) => void;

  setAccessToken: (token: string) => void;
  setRefreshToken: (token: string) => void;
  updateUser: (updates: Partial<User>) => void;

  setMe: (me: Me) => void;

  setManagers: (managers: Manager[] | null) => void;

  setTimeEntry: (time_entry: TimeEntry | null) => void;

  setTimeEntriesStats: (time_entries_stats: TimeEntriesStats | null) => void;

  setCountries: (countries: Countries) => void;
  setSelectedCountry: (country: CountryWithClients | null) => void;

  setClientProjects: (clientProjects: MainEntity | null) => void;
  setProjectTasks: (projectTasks: ProjectTasks | null) => void;
  clearProjectTasks: () => void;

  setInternalTasks: (tasks: TasksArray | null) => void;
  clearInternalTasks: () => void;
  getInternalTaskById: (taskId: number) => Task | undefined;
  getInternalTasksByType: (taskType: string) => Task[];

  setLeaves: (leaves: LeaveArray | null) => void;
  setLeavesReports: (leaves_reports: LeaveReportsData | null) => void;

  setCurrentMonth: (currentMonth: string | null) => void;
  setCurrentYear: (currentYear: string | null) => void;

  setProjectsPagination: (pagination: ProjectsPagination | null) => void;
  setUsersPagination: (pagination: UsersPagination | null) => void;
  setClientsPagination: (pagination: ClientsPagination | null) => void;

  setTimeEntries: (timeEntries: TimeEntry[] | null) => void;

  setDepartments: (departments: Department[] | null) => void;

  setWorkingWeekends: (workingWeekends: WorkingWeekends[] | null) => void;

  setAccountsStatuses: (accountsStatuses: Status[] | null) => void;

  setDepartmentMembers: (
    departmentMembers: DepartmentWithMembers | null,
  ) => void;

  setStatuses: (statuses: StatusesArray | null) => void;

  setClients: (clients: OnlyClient[] | null) => void;

  setServiceLines: (service_lines: ServiceLines[] | null) => void;

  setTaskTypes: (task_types: ServiceLines[] | null) => void;

  setProjects: (projects: ProjectBody[] | null) => void;

  setUsers: (users: User[] | null) => void;

  setDepartmentRoles: (department_roles: DepartmentRole[] | null) => void;

  setUserGrades: (user_grades: DepartmentRole[] | null) => void;

  setPositions: (positions: Position[] | null) => void;

  setSectors: (sectors: Status[] | null) => void;

  setGlobalSettings: (globalSettings: GlobalSettings | null) => void;

  setDepartmentWorkers: (
    department_workers: DepartmentsResponse | null,
  ) => void;

  setCalendar: (calendar: Calendar[] | null) => void;

  setTasks: (tasks: Task[] | null) => void;

  setRoles: (roles: Role[] | null) => void;

  setCalendarHolidays: (calendar_holidays: Holidays[] | null) => void;

  setMonitoring: (monitoring: Monitoring[] | null) => void;

  // ✅ ОДНА ФУНКЦИЯ ДЛЯ ОТЧЕТОВ
  setReports: (reports: ReportsData | null) => void;

  // ✅ Хелпер функции для работы с tasks
  getTaskById: (taskId: number) => Task | undefined;
  getTasksByType: (taskType: string) => Task[];
  addTask: (task: Task) => void;
  updateTask: (taskId: number, updates: Partial<Task>) => void;
  removeTask: (taskId: number) => void;

  // ✅ Хелпер функции для работы с roles
  getRoleById: (roleId: number) => Role | undefined;
  getRoleByName: (roleName: string) => Role | undefined;
  addRole: (role: Role) => void;
  updateRole: (roleId: number, updates: Partial<Role>) => void;
  removeRole: (roleId: number) => void;

  // ✅ Хелпер функции для работы с отчетами
  getTimeReportById: (reportId: number) => TimeReport | undefined;
  getProjectReportById: (projectId: number) => ProjectReport | undefined;
  getUserReportByUserId: (userId: number) => UserReport | undefined;
  getReportsByDateRange: (type: ReportType, startDate: string, endDate: string) => any[];
  getReportsByUser: (userId: number) => {
    timeReports: TimeReport[];
    userReport: UserReport | undefined;
  };
  getReportsByProject: (projectId: number) => {
    projectReport: ProjectReport | undefined;
    timeReports: TimeReport[];
  };
  generateReportSummary: (type: ReportType, filters?: ReportFilters) => ReportSummary;
  clearAllReports: () => void;

  logout: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      access_token: null,
      refresh_token: null,
      user: null,

      countries: null,
      selectedCountry: null,

      workingWeekends: null,

      client_projects: null,
      project_tasks: null,
      internal_tasks: null,
      leaves: null,
      leaves_reports: null,
      time_entries: null,
      time_entry: null,
      time_entries_stats: null,
      accounts_statuses: null,

      managers: null,
      departments: null,
      department_members: null,
      statuses: null,
      clients: null,
      service_lines: null,
      task_types: null,
      projects: null,
      users: null,
      department_roles: null,
      user_grades: null,
      positions: null,
      sectors: null,
      department_workers: null,
      calendar: null,
      tasks: null,
      roles: null,
      monitoring: null,
      globalSettings: null,
      calendar_holidays: null,
      me: null,
      projectsPagination: null,
      usersPagination: null,
      clientsPagination: null,
      currentMonth: null,
      currentYear: null,
      reports: {
        timeReports: null,
        projectReports: null,
        userReports: null,
        financialReports: null,
        reportFilters: null,
        reportSummary: null,
        globalSettings: null,
      },

      setUser: (userData, tokens) =>
        set({
          user: userData,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
        }),

      setAccessToken: (token) => set({ access_token: token }),
      setRefreshToken: (token) => set({ refresh_token: token }),

      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),

      setCountries: (countries) => set({ countries }),

      setMe: (me) => set({ me }),

      setWorkingWeekends: (workingWeekends) => set({ workingWeekends }),

      setManagers: (managers) => set({ managers }),

      setAccountsStatuses: (accounts_statuses) => set({ accounts_statuses }),

      setMonitoring: (monitoring) => set({ monitoring }),

      setSelectedCountry: (country) => set({ selectedCountry: country }),

      setGlobalSettings: (globalSettings) => set({ globalSettings }),

      setCurrentMonth: (currentMonth) => set({ currentMonth }),

      setCurrentYear: (currentYear) => set({ currentYear }),

      setClientProjects: (clientProjects) =>
        set({ client_projects: clientProjects }),

      setProjectTasks: (projectTasks) => set({ project_tasks: projectTasks }),

      clearProjectTasks: () => set({ project_tasks: null }),

      setInternalTasks: (tasks) => set({ internal_tasks: tasks }),

      clearInternalTasks: () => set({ internal_tasks: null }),

      setLeaves: (leaves) => set({ leaves }),

      setLeavesReports: (leaves_reports) => set({ leaves_reports }),

      setCalendarHolidays: (calendar_holidays) => set({ calendar_holidays }),

      setTimeEntries: (timeEntries) => set({ time_entries: timeEntries }),

      setTimeEntry: (timeEntry) => set({ time_entry: timeEntry }),

      setTimeEntriesStats: (stats) => set({ time_entries_stats: stats }),

      setDepartments: (departments) => set({ departments }),

      setUsersPagination: (pagination) => set({ usersPagination: pagination }),

      setClientsPagination: (pagination) => set({ clientsPagination: pagination }),

      setDepartmentMembers: (departmentMembers) =>
        set({ department_members: departmentMembers }),

      setStatuses: (statuses) => set({ statuses }),

      setClients: (clients) => set({ clients }),

      setServiceLines: (service_lines) => set({ service_lines }),

      setTaskTypes: (task_types) => set({ task_types }),

      setProjects: (projects) => set({ projects }),

      setUsers: (users) => set({ users }),

      setProjectsPagination: (pagination) => set({ projectsPagination: pagination }),

      setDepartmentRoles: (department_roles) => set({ department_roles }),

      setUserGrades: (user_grades) => set({ user_grades }),

      setPositions: (positions) => set({ positions }),

      setSectors: (sectors) => set({ sectors }),

      setDepartmentWorkers: (department_workers) => set({ department_workers }),

      setCalendar: (calendar) => set({ calendar }),

      setTasks: (tasks) => set({ tasks }),

      setRoles: (roles) => set({ roles }),

      setReports: (reports) => set({ reports }),

      getInternalTaskById: (taskId: number) => {
        const state = get();
        if (!state.internal_tasks) return undefined;
        return state.internal_tasks.find((task) => task.id === taskId);
      },

      getInternalTasksByType: (taskType: string) => {
        const state = get();
        if (!state.internal_tasks) return [];
        return state.internal_tasks.filter(
          (task) => task.task_type === taskType,
        );
      },

      getTaskById: (taskId: number) => {
        const state = get();
        if (!state.tasks) return undefined;
        return state.tasks.find((task) => task.id === taskId);
      },

      getTasksByType: (taskType: string) => {
        const state = get();
        if (!state.tasks) return [];
        return state.tasks.filter((task) => task.task_type === taskType);
      },

      addTask: (task: Task) => {
        const state = get();
        const currentTasks = state.tasks || [];
        set({ tasks: [...currentTasks, task] });
      },

      updateTask: (taskId: number, updates: Partial<Task>) => {
        const state = get();
        if (!state.tasks) return;

        const updatedTasks = state.tasks.map((task) =>
          task.id === taskId ? { ...task, ...updates } : task,
        );
        set({ tasks: updatedTasks });
      },

      removeTask: (taskId: number) => {
        const state = get();
        if (!state.tasks) return;

        const filteredTasks = state.tasks.filter((task) => task.id !== taskId);
        set({ tasks: filteredTasks });
      },

      getRoleById: (roleId: number) => {
        const state = get();
        if (!state.roles) return undefined;
        return state.roles.find((role) => role.id === roleId);
      },

      getRoleByName: (roleName: string) => {
        const state = get();
        if (!state.roles) return undefined;
        return state.roles.find(
          (role) => role.name.toLowerCase() === roleName.toLowerCase(),
        );
      },

      addRole: (role: Role) => {
        const state = get();
        const currentRoles = state.roles || [];
        set({ roles: [...currentRoles, role] });
      },

      updateRole: (roleId: number, updates: Partial<Role>) => {
        const state = get();
        if (!state.roles) return;

        const updatedRoles = state.roles.map((role) =>
          role.id === roleId ? { ...role, ...updates } : role,
        );
        set({ roles: updatedRoles });
      },

      removeRole: (roleId: number) => {
        const state = get();
        if (!state.roles) return;

        const filteredRoles = state.roles.filter((role) => role.id !== roleId);
        set({ roles: filteredRoles });
      },

      getTimeReportById: (reportId: number) => {
        const state = get();
        return state.reports?.timeReports?.find((report) => report.id === reportId);
      },

      getProjectReportById: (projectId: number) => {
        const state = get();
        return state.reports?.projectReports?.find((report) => report.projectId === projectId);
      },

      getUserReportByUserId: (userId: number) => {
        const state = get();
        return state.reports?.userReports?.find((report) => report.userId === userId);
      },

      getReportsByDateRange: (type: ReportType, startDate: string, endDate: string) => {
        const state = get();

        switch (type) {
          case 'time':
            return state.reports?.timeReports?.filter(
              (report) => report.date >= startDate && report.date <= endDate
            ) || [];

          case 'project':
            return state.reports?.projectReports?.filter(
              (report) => report.startDate >= startDate && report.endDate <= endDate
            ) || [];

          case 'user':
            return state.reports?.userReports?.filter(
              (report) => report.periodStart >= startDate && report.periodEnd <= endDate
            ) || [];

          case 'financial':
            return state.reports?.financialReports?.filter(
              (report) => report.period >= startDate && report.period <= endDate
            ) || [];

          default:
            return [];
        }
      },

      getReportsByUser: (userId: number) => {
        const state = get();
        return {
          timeReports: state.reports?.timeReports?.filter((report) => report.userId === userId) || [],
          userReport: state.reports?.userReports?.find((report) => report.userId === userId)
        };
      },

      getReportsByProject: (projectId: number) => {
        const state = get();
        return {
          projectReport: state.reports?.projectReports?.find((report) => report.projectId === projectId),
          timeReports: state.reports?.timeReports?.filter((report) => report.projectId === projectId) || []
        };
      },

      generateReportSummary: (type: ReportType, filters?: ReportFilters) => {
        const state = get();
        let summary: ReportSummary = {
          totalHours: 0,
          totalProjects: 0,
          totalUsers: 0,
          totalRevenue: 0,
          averageUtilization: 0,
          billablePercentage: 0
        };

        switch (type) {
          case 'time': {
            const reports = filters
              ? state.reports?.timeReports?.filter(r => {
                if (filters.startDate && r.date < filters.startDate) return false;
                if (filters.endDate && r.date > filters.endDate) return false;
                if (filters.userId && r.userId !== filters.userId) return false;
                if (filters.projectId && r.projectId !== filters.projectId) return false;
                return true;
              })
              : state.reports?.timeReports;

            if (reports) {
              summary.totalHours = reports.reduce((sum, r) => sum + r.hours, 0);
              summary.totalUsers = new Set(reports.map(r => r.userId)).size;
              summary.totalProjects = new Set(reports.map(r => r.projectId).filter(Boolean)).size;

              const billableHours = reports
                .filter(r => r.status === 'approved')
                .reduce((sum, r) => sum + r.hours, 0);

              summary.billablePercentage = summary.totalHours > 0
                ? (billableHours / summary.totalHours) * 100
                : 0;
            }
            break;
          }

          case 'project': {
            const reports = filters
              ? state.reports?.projectReports?.filter(r => {
                if (filters.startDate && r.startDate < filters.startDate) return false;
                if (filters.endDate && r.endDate > filters.endDate) return false;
                if (filters.projectId && r.projectId !== filters.projectId) return false;
                if (filters.clientId && r.clientId !== filters.clientId) return false;
                return true;
              })
              : state.reports?.projectReports;

            if (reports) {
              summary.totalProjects = reports.length;
              summary.totalHours = reports.reduce((sum, r) => sum + r.totalHours, 0);

              const totalBillable = reports.reduce((sum, r) => sum + r.billableHours, 0);
              summary.billablePercentage = summary.totalHours > 0
                ? (totalBillable / summary.totalHours) * 100
                : 0;

              summary.averageUtilization = reports.length > 0
                ? reports.reduce((sum, r) => sum + r.utilization, 0) / reports.length
                : 0;
            }
            break;
          }

          case 'user': {
            const reports = filters
              ? state.reports?.userReports?.filter(r => {
                if (filters.startDate && r.periodStart < filters.startDate) return false;
                if (filters.endDate && r.periodEnd > filters.endDate) return false;
                if (filters.userId && r.userId !== filters.userId) return false;
                if (filters.departmentId && r.departmentId !== filters.departmentId) return false;
                return true;
              })
              : state.reports?.userReports;

            if (reports) {
              summary.totalUsers = reports.length;
              summary.totalHours = reports.reduce((sum, r) => sum + r.totalHoursWorked, 0);
              summary.averageUtilization = reports.length > 0
                ? reports.reduce((sum, r) => sum + r.utilization, 0) / reports.length
                : 0;
            }
            break;
          }

          case 'financial': {
            const reports = filters
              ? state.reports?.financialReports?.filter(r => {
                if (filters.startDate && r.period < filters.startDate) return false;
                if (filters.endDate && r.period > filters.endDate) return false;
                return true;
              })
              : state.reports?.financialReports;

            if (reports) {
              summary.totalRevenue = reports.reduce((sum, r) => sum + r.revenue, 0);
              summary.totalProjects = reports.reduce((sum, r) => sum + r.projectsCount, 0);

              const totalHours = reports.reduce((sum, r) => sum + r.billableHours + r.nonBillableHours, 0);
              const totalBillable = reports.reduce((sum, r) => sum + r.billableHours, 0);

              summary.billablePercentage = totalHours > 0 ? (totalBillable / totalHours) * 100 : 0;
            }
            break;
          }
        }

        set((state) => ({
          reports: state.reports ? { ...state.reports, reportSummary: summary } : null
        }));

        return summary;
      },

      clearAllReports: () =>
        set({
          reports: {
            timeReports: null,
            projectReports: null,
            userReports: null,
            financialReports: null,
            reportFilters: null,
            reportSummary: null
          }
        }),

      logout: () => {
        localStorage.removeItem("authToken");
        localStorage.removeItem("refreshToken");

        set({
          user: null,
          access_token: null,
          refresh_token: null,
          selectedCountry: null,
          client_projects: null,
          project_tasks: null,
          workingWeekends: null,
          internal_tasks: null,
          leaves: null,
          leaves_reports: null,
          time_entries: null,
          time_entry: null,
          time_entries_stats: null,
          departments: null,
          department_members: null,
          accounts_statuses: null,
          statuses: null,
          clients: null,
          service_lines: null,
          task_types: null,
          projects: null,
          users: null,
          department_roles: null,
          user_grades: null,
          positions: null,
          sectors: null,
          department_workers: null,
          calendar: null,
          tasks: null,
          roles: null,
          monitoring: null,
          calendar_holidays: null,
          me: null,
          managers: null,
          projectsPagination: null,
          usersPagination: null,
          clientsPagination: null,
          currentMonth: null,
          currentYear: null,
          reports: {
            timeReports: null,
            projectReports: null,
            userReports: null,
            financialReports: null,
            reportFilters: null,
            reportSummary: null
          },
        });
      },
    }),
    {
      name: "user-storage",
      partialize: (state) => ({
        access_token: state.access_token,
        refresh_token: state.refresh_token,
        user: state.user,
        me: state.me,
        accounts_statuses: state.accounts_statuses,
        workingWeekends: state.workingWeekends,
        time_entry: state.time_entry,
        time_entries_stats: state.time_entries_stats,
        projectsPagination: state.projectsPagination,
        managers: state.managers,
        selectedCountry: state.selectedCountry,
        client_projects: state.client_projects,
        project_tasks: state.project_tasks,
        internal_tasks: state.internal_tasks,
        leaves: state.leaves,
        leaves_reports: state.leaves_reports,
        time_entries: state.time_entries,
        departments: state.departments,
        department_members: state.department_members,
        statuses: state.statuses,
        clients: state.clients,
        service_lines: state.service_lines,
        task_types: state.task_types,
        users: state.users,
        department_roles: state.department_roles,
        user_grades: state.user_grades,
        positions: state.positions,
        sectors: state.sectors,
        department_workers: state.department_workers,
        calendar: state.calendar,
        tasks: state.tasks,
        roles: state.roles,
        reports: state.reports,
        monitoring: state.monitoring,
        globalSettings: state.globalSettings,
        calendar_holidays: state.calendar_holidays,
        currentMonth: state.currentMonth,
        currentYear: state.currentYear,
      }),
    },
  ),
);