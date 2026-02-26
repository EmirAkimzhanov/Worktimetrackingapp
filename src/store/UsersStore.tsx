import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Countries } from "../types/countries";
import { CountryWithClients, MainEntity, OnlyClient } from "../types/client";
import { Project, ProjectBody, ProjectTasks } from "../types/project";
import { Task, TasksArray } from "../types/task";
import { LeaveArray } from "../types/leave";
import { TimeEntry } from "../types/timeEntrys";
import { Department, Position } from "../types/types";
import { DepartmentWithMembers } from "../types/departments";
import { Status, StatusesArray } from "../types/statuses";
import { ServiceLines } from "../types/serviceLines";
import { DepartmentRole } from "../types/user";
import { DepartmentsResponse } from "../types/deaprtments";
import { Calendar } from "../types/calendar";

// Определяем тип для роли (можно заменить на импорт из types, если есть)
export interface Role {
  id: number;
  name: string;
  description?: string;
  permissions?: string[];
}

interface User {
  id: number;
  username: string;
  email: string;
  name: string;
  role: string;
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

  time_entries: TimeEntry[] | null;

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

  setUser: (
    user: User,
    tokens: { access_token: string; refresh_token: string },
  ) => void;

  setAccessToken: (token: string) => void;
  setRefreshToken: (token: string) => void;
  updateUser: (updates: Partial<User>) => void;

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

  setTimeEntries: (timeEntries: TimeEntry[] | null) => void;

  setDepartments: (departments: Department[] | null) => void;

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

  setDepartmentWorkers: (
    department_workers: DepartmentsResponse | null,
  ) => void;

  // ✅ ТОЛЬКО 1 СЕТ ФУНКЦИЯ ДЛЯ КАЛЕНДАРЯ
  setCalendar: (calendar: Calendar[] | null) => void;

  // ✅ ТОЛЬКО 1 СЕТ ФУНКЦИЯ ДЛЯ TASKS
  setTasks: (tasks: Task[] | null) => void;

  // ✅ ТОЛЬКО 1 СЕТ ФУНКЦИЯ ДЛЯ ROLES
  setRoles: (roles: Role[] | null) => void;

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

      client_projects: null,
      project_tasks: null,
      internal_tasks: null,
      leaves: null,
      time_entries: null,

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
      roles: null, // ✅ Инициализируем roles

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

      setSelectedCountry: (country) => set({ selectedCountry: country }),

      setClientProjects: (clientProjects) =>
        set({ client_projects: clientProjects }),

      setProjectTasks: (projectTasks) => set({ project_tasks: projectTasks }),

      clearProjectTasks: () => set({ project_tasks: null }),

      setInternalTasks: (tasks) => set({ internal_tasks: tasks }),

      clearInternalTasks: () => set({ internal_tasks: null }),

      setLeaves: (leaves) => set({ leaves }),

      setTimeEntries: (timeEntries) => set({ time_entries: timeEntries }),

      setDepartments: (departments) => set({ departments }),

      setDepartmentMembers: (departmentMembers) =>
        set({ department_members: departmentMembers }),

      setStatuses: (statuses) => set({ statuses }),

      setClients: (clients) => set({ clients }),

      setServiceLines: (service_lines) => set({ service_lines }),

      setTaskTypes: (task_types) => set({ task_types }),

      setProjects: (projects) => set({ projects }),

      setUsers: (users) => set({ users }),

      setDepartmentRoles: (department_roles) => set({ department_roles }),

      setUserGrades: (user_grades) => set({ user_grades }),

      setPositions: (positions) => set({ positions }),

      setSectors: (sectors) => set({ sectors }),

      setDepartmentWorkers: (department_workers) => set({ department_workers }),

      // ✅ ТОЛЬКО 1 СЕТ ФУНКЦИЯ ДЛЯ КАЛЕНДАРЯ
      setCalendar: (calendar) => set({ calendar }),

      // ✅ ТОЛЬКО 1 СЕТ ФУНКЦИЯ ДЛЯ TASKS
      setTasks: (tasks) => set({ tasks }),

      // ✅ ТОЛЬКО 1 СЕТ ФУНКЦИЯ ДЛЯ ROLES
      setRoles: (roles) => set({ roles }),

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

      // ✅ Хелпер функции для tasks
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

      // ✅ Хелпер функции для roles
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
          internal_tasks: null,
          leaves: null,
          time_entries: null,
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
          roles: null, // ✅ Очищаем roles при выходе
        });
      },
    }),
    {
      name: "user-storage",
      partialize: (state) => ({
        access_token: state.access_token,
        refresh_token: state.refresh_token,
        user: state.user,
        selectedCountry: state.selectedCountry,
        client_projects: state.client_projects,
        project_tasks: state.project_tasks,
        internal_tasks: state.internal_tasks,
        leaves: state.leaves,
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
        roles: state.roles, // ✅ Добавляем roles в persist
      }),
    },
  ),
);
