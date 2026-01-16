// stores/userStore.ts (минимальная версия)
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Countries } from "../types/countries";
import { CountryWithClients, MainEntity } from "../types/client";
import { Project, ProjectTasks } from "../types/project";
import { Task, TasksArray } from "../types/task";
import { LeaveArray } from "../types/leave";
import { TimeEntry } from "../types/timeEntrys";

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

  time_entries: TimeEntry[] | null; // Изменено на массив

  setUser: (
    user: User,
    tokens: { access_token: string; refresh_token: string }
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

  // Leaves management - только setLeaves
  setLeaves: (leaves: LeaveArray | null) => void;

  // Time entries management - ТОЛЬКО setTimeEntries
  setTimeEntries: (timeEntries: TimeEntry[] | null) => void;

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
      time_entries: null, // Инициализация

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

      setSelectedCountry: (country) =>
        set({ selectedCountry: country }),

      setClientProjects: (clientProjects) =>
        set({ client_projects: clientProjects }),

      setProjectTasks: (projectTasks) =>
        set({ project_tasks: projectTasks }),

      clearProjectTasks: () =>
        set({ project_tasks: null }),

      setInternalTasks: (tasks) =>
        set({ internal_tasks: tasks }),

      clearInternalTasks: () =>
        set({ internal_tasks: null }),

      // Leaves management - только setLeaves
      setLeaves: (leaves) =>
        set({ leaves }),

      // Time entries management - ТОЛЬКО setTimeEntries
      setTimeEntries: (timeEntries) =>
        set({ time_entries: timeEntries }),

      getTaskById: (taskId: number) => {
        const state = get();
        if (!state.project_tasks?.tasks) return undefined;

        return state.project_tasks.tasks.find(task => task.id === taskId);
      },

      getInternalTaskById: (taskId: number) => {
        const state = get();
        if (!state.internal_tasks) return undefined;

        return state.internal_tasks.find(task => task.id === taskId);
      },

      getInternalTasksByType: (taskType: string) => {
        const state = get();
        if (!state.internal_tasks) return [];

        return state.internal_tasks.filter(task => task.task_type === taskType);
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
      }),
    }
  )
);