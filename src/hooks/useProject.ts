import { useMutation } from '@tanstack/react-query';
import { useUserStore } from '../store/UsersStore';
import { deleteProject, editProject, getProjects, getProjectTasks, sendProject } from '../services/project';
import { ProjectBody } from '../types/project';

// ========== КЭШ ДЛЯ ПРОЕКТОВ ==========

// Кэш для всех проектов (с пагинацией)
let projectsCache: { data: any; timestamp: number; params?: any } | null = null;

// Кэш для задач проекта (по project_id)
const projectTasksCache = new Map<string, { data: any; timestamp: number }>();

const CACHE_DURATION = 30 * 60 * 1000; // 30 минут

// Функции очистки кэша
const clearProjectsCache = () => {
    projectsCache = null;
    console.log('Projects cache cleared');
};

const clearProjectTasksCache = (projectId?: string) => {
    if (projectId) {
        projectTasksCache.delete(projectId);
        console.log(`Project tasks cache cleared for project: ${projectId}`);
    } else {
        projectTasksCache.clear();
        console.log('All project tasks cache cleared');
    }
};

const clearAllProjectsCaches = () => {
    clearProjectsCache();
    clearProjectTasksCache();
    console.log('All projects caches cleared');
};

// Функции получения кэшированных данных
const getCachedProjects = (params?: { page?: number; page_size?: number }) => {
    const now = Date.now();
    if (projectsCache && (now - projectsCache.timestamp) < CACHE_DURATION) {
        // Проверяем, совпадают ли параметры кэша с запрашиваемыми
        if (JSON.stringify(projectsCache.params) === JSON.stringify(params)) {
            console.log('Returning cached projects data for params:', params);
            return projectsCache.data;
        }
    }
    return null;
};

const getCachedProjectTasks = (projectId: string) => {
    const now = Date.now();
    const cached = projectTasksCache.get(projectId);
    if (cached && (now - cached.timestamp) < CACHE_DURATION) {
        console.log(`Returning cached tasks for project: ${projectId}`);
        return cached.data;
    }
    return null;
};

// ========== ХУКИ С КЭШИРОВАНИЕМ ==========

export const useGetProjectTasks = () => {
    const setProjectTasks = useUserStore((state) => state.setProjectTasks);

    return useMutation({
        mutationFn: async (project_id: string) => {
            // Проверяем кэш
            const cached = getCachedProjectTasks(project_id);
            if (cached) {
                return cached;
            }

            // Загружаем новые данные
            console.log(`Fetching fresh tasks for project: ${project_id}`);
            const data = await getProjectTasks(project_id);
            projectTasksCache.set(project_id, { data, timestamp: Date.now() });
            return data;
        },
        onSuccess: (data, project_id) => {
            setProjectTasks(data);
            console.log(`Project tasks loaded for project ${project_id}:`, data);
        },
        onError: (error: Error) => {
            console.error("Get project tasks error:", error.message);
        },
    });
};

export const useSendProject = () => {
    return useMutation({
        mutationFn: async (project_data: ProjectBody) => {
            const result = await sendProject(project_data);
            // Очищаем кэш проектов при создании нового
            clearProjectsCache();
            return result;
        },
        onSuccess: (data) => {
            console.log('Project created:', data);
        },
        onError: (error: Error) => {
            console.error("Create project error:", error.message);
        },
    });
};

export const useEditProject = () => {
    return useMutation({
        mutationFn: async ({ project_data, project_id }: { project_data: ProjectBody; project_id: string }) => {
            const result = await editProject(project_data, project_id);
            // Очищаем все кэши при редактировании проекта
            clearAllProjectsCaches();
            return result;
        },
        onSuccess: (data) => {
            console.log('Project edited:', data);
        },
        onError: (error: Error) => {
            console.error("Edit project error:", error.message);
        },
    });
};

export const useGetProjects = () => {
    const setProjects = useUserStore((state) => state.setProjects);
    const setProjectsPagination = useUserStore((state) => state.setProjectsPagination);

    return useMutation({
        mutationFn: async (params?: { page?: number; page_size?: number; forceRefresh?: boolean }) => {
            const { page = 1, page_size = 30, forceRefresh = false } = params || {};
            const queryParams = { page, page_size };

            // Проверяем кэш
            if (!forceRefresh) {
                const cached = getCachedProjects(queryParams);
                if (cached) {
                    return cached;
                }
            }

            console.log(forceRefresh ? 'Force refreshing projects' : `Fetching fresh projects for page ${page}, page_size ${page_size}`);
            const data = await getProjects(queryParams);

            // Сохраняем в кэш с параметрами
            projectsCache = {
                data,
                timestamp: Date.now(),
                params: queryParams
            };

            return data;
        },
        onSuccess: (data, params) => {
            // Сохраняем projects и пагинацию в store
            setProjects(data.results || data);
            if (setProjectsPagination) {
                setProjectsPagination({
                    count: data.count,
                    next: data.next,
                    previous: data.previous,
                    currentPage: params?.page || 1,
                    pageSize: params?.page_size || 30
                });
            }
            console.log('Projects loaded:', data);
        },
        onError: (error: Error) => {
            console.error("Get projects error:", error.message);
        },
    });
};

export const useDeleteProject = () => {
    return useMutation({
        mutationFn: async (project_id: string) => {
            const result = await deleteProject(project_id);
            // Очищаем все кэши при удалении проекта
            clearAllProjectsCaches();
            return result;
        },
        onSuccess: (data) => {
            console.log('Project deleted:', data);
        },
        onError: (error: Error) => {
            console.error("Delete project error:", error.message);
        },
    });
};

// ========== ДОПОЛНИТЕЛЬНЫЕ УТИЛИТЫ ==========

export const projectsCacheUtils = {
    clearProjectsCache: clearProjectsCache,
    clearProjectTasksCache: clearProjectTasksCache,
    clearAll: clearAllProjectsCaches,

    isProjectsCacheValid: (params?: { page?: number; page_size?: number }) => {
        if (!projectsCache) return false;
        const now = Date.now();
        const isTimeValid = (now - projectsCache.timestamp) < CACHE_DURATION;
        const isParamsValid = JSON.stringify(projectsCache.params) === JSON.stringify(params);
        return isTimeValid && isParamsValid;
    },

    isProjectTasksCacheValid: (projectId: string) => {
        const cached = projectTasksCache.get(projectId);
        if (!cached) return false;
        const now = Date.now();
        return (now - cached.timestamp) < CACHE_DURATION;
    },

    getProjectsCacheAge: () => {
        if (!projectsCache) return null;
        const now = Date.now();
        return Math.floor((now - projectsCache.timestamp) / 1000); // в секундах
    },

    getProjectTasksCacheAge: (projectId: string) => {
        const cached = projectTasksCache.get(projectId);
        if (!cached) return null;
        const now = Date.now();
        return Math.floor((now - cached.timestamp) / 1000);
    },

    getProjectsCacheSize: () => {
        return projectsCache ? (projectsCache.data.results?.length || projectsCache.data.length || 0) : 0;
    },

    getProjectTasksCacheStats: () => {
        const now = Date.now();
        const stats: { [key: string]: { age: number; isValid: boolean } } = {};

        projectTasksCache.forEach((entry, key) => {
            const age = Math.floor((now - entry.timestamp) / 1000);
            stats[key] = {
                age,
                isValid: age < CACHE_DURATION / 1000
            };
        });

        return {
            size: projectTasksCache.size,
            items: stats
        };
    },

    refreshProjectsCache: async (params?: { page?: number; page_size?: number }) => {
        const page = params?.page || 1;
        const page_size = params?.page_size || 30;
        const data = await getProjects({ page, page_size });
        projectsCache = {
            data,
            timestamp: Date.now(),
            params: { page, page_size }
        };
        console.log(`Projects cache refreshed for page ${page}, page_size ${page_size}`);
        return data;
    },

    refreshProjectTasksCache: async (projectId: string) => {
        const data = await getProjectTasks(projectId);
        projectTasksCache.set(projectId, { data, timestamp: Date.now() });
        console.log(`Project tasks cache refreshed for: ${projectId}`);
        return data;
    }
};