import { useMutation } from "@tanstack/react-query";
import { useUserStore } from "../store/UsersStore";
import { getProjectTasks } from "../services/project";
import {
    createTask,
    DeleteTask,
    EditTask,
    getInternalTasks,
    getTasks,
    getTaskTypes,
} from "../services/task";

// ========== КЭШ ДЛЯ ЗАДАЧ ==========

let internalTasksCache: { data: any[]; timestamp: number } | null = null;
let tasksCache: { data: any[]; timestamp: number } | null = null;
let taskTypesCache: { data: any[]; timestamp: number } | null = null;

const CACHE_DURATION = 30 * 60 * 1000; // 30 минут

// Функции очистки кэша
const clearInternalTasksCache = () => {
    internalTasksCache = null;
    console.log('Internal tasks cache cleared');
};

const clearTasksCache = () => {
    tasksCache = null;
    console.log('Tasks cache cleared');
};

const clearTaskTypesCache = () => {
    taskTypesCache = null;
    console.log('Task types cache cleared');
};

const clearAllTasksCaches = () => {
    clearInternalTasksCache();
    clearTasksCache();
    clearTaskTypesCache();
    console.log('All tasks caches cleared');
};

// Функции получения кэшированных данных
const getCachedInternalTasks = () => {
    const now = Date.now();
    if (internalTasksCache && (now - internalTasksCache.timestamp) < CACHE_DURATION) {
        console.log('Returning cached internal tasks data');
        return internalTasksCache.data;
    }
    return null;
};

const getCachedTasks = () => {
    const now = Date.now();
    if (tasksCache && (now - tasksCache.timestamp) < CACHE_DURATION) {
        console.log('Returning cached tasks data');
        return tasksCache.data;
    }
    return null;
};

const getCachedTaskTypes = () => {
    const now = Date.now();
    if (taskTypesCache && (now - taskTypesCache.timestamp) < CACHE_DURATION) {
        console.log('Returning cached task types data');
        return taskTypesCache.data;
    }
    return null;
};

// ========== ХУКИ С КЭШИРОВАНИЕМ ==========

export const useGetInterbalTasks = () => {
    const setInternalTasks = useUserStore((state) => state.setInternalTasks);

    return useMutation({
        mutationFn: async (forceRefresh?: boolean) => {
            if (!forceRefresh) {
                const cached = getCachedInternalTasks();
                if (cached) {
                    return cached;
                }
            }

            console.log(forceRefresh ? 'Force refreshing internal tasks' : 'Fetching fresh internal tasks');
            const data = await getInternalTasks();
            internalTasksCache = { data, timestamp: Date.now() };
            return data;
        },
        onSuccess: (data) => {
            setInternalTasks(data);
            console.log("Internal tasks loaded:", data);
        },
        onError: (error: Error) => {
            console.error("Get internal tasks error:", error.message);
        },
    });
};

export const useGetTaskTypes = () => {
    const setTaskTypesStore = useUserStore((state) => state.setTaskTypes);

    return useMutation({
        mutationFn: async (forceRefresh?: boolean) => {
            if (!forceRefresh) {
                const cached = getCachedTaskTypes();
                if (cached) {
                    return cached;
                }
            }

            console.log(forceRefresh ? 'Force refreshing task types' : 'Fetching fresh task types');
            const data = await getTaskTypes();
            taskTypesCache = { data, timestamp: Date.now() };
            return data;
        },
        onSuccess: (data) => {
            setTaskTypesStore(data);
            console.log("Task types loaded:", data);
        },
        onError: (error: Error) => {
            console.error("Get task types error:", error.message);
        },
    });
};

export const useGetTasks = () => {
    const setTasks = useUserStore((state) => state.setTasks);

    return useMutation({
        mutationFn: async (forceRefresh?: boolean) => {
            if (!forceRefresh) {
                const cached = getCachedTasks();
                if (cached) {
                    return cached;
                }
            }

            console.log(forceRefresh ? 'Force refreshing tasks' : 'Fetching fresh tasks');
            const data = await getTasks();
            tasksCache = { data, timestamp: Date.now() };
            return data;
        },
        onSuccess: (data) => {
            setTasks(data);
            console.log("Tasks loaded:", data);
        },
        onError: (error: Error) => {
            console.error("Get tasks error:", error.message);
        },
    });
};

export const useEditTask = () => {
    return useMutation({
        mutationFn: async (params: { task_id: string; body: { name: string } }) => {
            const result = await EditTask(params.task_id, params.body);
            // Очищаем все кэши задач при редактировании
            clearTasksCache();
            clearInternalTasksCache();
            return result;
        },
        onSuccess: (data) => {
            console.log("Task edited:", data);
        },
        onError: (error: Error) => {
            console.error("Edit task error:", error.message);
        },
    });
};

export const useDeleteTask = () => {
    return useMutation({
        mutationFn: async (task_id: string) => {
            const result = await DeleteTask(task_id);
            // Очищаем все кэши задач при удалении
            clearTasksCache();
            clearInternalTasksCache();
            return result;
        },
        onSuccess: (data) => {
            console.log("Task deleted:", data);
        },
        onError: (error: Error) => {
            console.error("Delete task error:", error.message);
        },
    });
};

export const useCreateTask = () => {
    return useMutation({
        mutationFn: async (body: { name: string; task_type: number }) => {
            const result = await createTask(body);
            // Очищаем все кэши задач при создании
            clearTasksCache();
            clearInternalTasksCache();
            return result;
        },
        onSuccess: (data) => {
            console.log("Task created:", data);
        },
        onError: (error: Error) => {
            console.error("Create task error:", error.message);
        },
    });
};

// ========== ДОПОЛНИТЕЛЬНЫЕ УТИЛИТЫ ==========

export const tasksCacheUtils = {
    clearInternalTasksCache: clearInternalTasksCache,
    clearTasksCache: clearTasksCache,
    clearTaskTypesCache: clearTaskTypesCache,
    clearAll: clearAllTasksCaches,

    isInternalTasksCacheValid: () => {
        if (!internalTasksCache) return false;
        const now = Date.now();
        return (now - internalTasksCache.timestamp) < CACHE_DURATION;
    },

    isTasksCacheValid: () => {
        if (!tasksCache) return false;
        const now = Date.now();
        return (now - tasksCache.timestamp) < CACHE_DURATION;
    },

    isTaskTypesCacheValid: () => {
        if (!taskTypesCache) return false;
        const now = Date.now();
        return (now - taskTypesCache.timestamp) < CACHE_DURATION;
    },

    getInternalTasksCacheAge: () => {
        if (!internalTasksCache) return null;
        const now = Date.now();
        return Math.floor((now - internalTasksCache.timestamp) / 1000);
    },

    getTasksCacheAge: () => {
        if (!tasksCache) return null;
        const now = Date.now();
        return Math.floor((now - tasksCache.timestamp) / 1000);
    },

    getTaskTypesCacheAge: () => {
        if (!taskTypesCache) return null;
        const now = Date.now();
        return Math.floor((now - taskTypesCache.timestamp) / 1000);
    },

    getInternalTasksCacheAgeInMinutes: () => {
        if (!internalTasksCache) return null;
        const now = Date.now();
        return Math.floor((now - internalTasksCache.timestamp) / 60000);
    },

    getTasksCacheAgeInMinutes: () => {
        if (!tasksCache) return null;
        const now = Date.now();
        return Math.floor((now - tasksCache.timestamp) / 60000);
    },

    getTaskTypesCacheAgeInMinutes: () => {
        if (!taskTypesCache) return null;
        const now = Date.now();
        return Math.floor((now - taskTypesCache.timestamp) / 60000);
    },

    getInternalTasksCacheSize: () => {
        return internalTasksCache ? internalTasksCache.data.length : 0;
    },

    getTasksCacheSize: () => {
        return tasksCache ? tasksCache.data.length : 0;
    },

    getTaskTypesCacheSize: () => {
        return taskTypesCache ? taskTypesCache.data.length : 0;
    },

    refreshInternalTasksCache: async () => {
        const data = await getInternalTasks();
        internalTasksCache = { data, timestamp: Date.now() };
        console.log('Internal tasks cache refreshed');
        return data;
    },

    refreshTasksCache: async () => {
        const data = await getTasks();
        tasksCache = { data, timestamp: Date.now() };
        console.log('Tasks cache refreshed');
        return data;
    },

    refreshTaskTypesCache: async () => {
        const data = await getTaskTypes();
        taskTypesCache = { data, timestamp: Date.now() };
        console.log('Task types cache refreshed');
        return data;
    },

    getCacheInfo: () => {
        const now = Date.now();

        const internalTasksInfo = !internalTasksCache ? { exists: false } : {
            exists: true,
            isValid: (now - internalTasksCache.timestamp) < CACHE_DURATION,
            ageInSeconds: Math.floor((now - internalTasksCache.timestamp) / 1000),
            ageInMinutes: Math.floor((now - internalTasksCache.timestamp) / 60000),
            size: internalTasksCache.data.length
        };

        const tasksInfo = !tasksCache ? { exists: false } : {
            exists: true,
            isValid: (now - tasksCache.timestamp) < CACHE_DURATION,
            ageInSeconds: Math.floor((now - tasksCache.timestamp) / 1000),
            ageInMinutes: Math.floor((now - tasksCache.timestamp) / 60000),
            size: tasksCache.data.length
        };

        const taskTypesInfo = !taskTypesCache ? { exists: false } : {
            exists: true,
            isValid: (now - taskTypesCache.timestamp) < CACHE_DURATION,
            ageInSeconds: Math.floor((now - taskTypesCache.timestamp) / 1000),
            ageInMinutes: Math.floor((now - taskTypesCache.timestamp) / 60000),
            size: taskTypesCache.data.length
        };

        return {
            internalTasks: internalTasksInfo,
            tasks: tasksInfo,
            taskTypes: taskTypesInfo,
            cacheDurationMinutes: CACHE_DURATION / 60000
        };
    }
};