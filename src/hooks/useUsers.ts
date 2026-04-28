import { useMutation } from '@tanstack/react-query';
import { useUserStore } from '../store/UsersStore';
import { deleteUser, editUser, getUserGrades, getUsers, sendUsers } from '../services/users';
import { UserBody } from '../types/user';

// ========== КЭШ ДЛЯ ПОЛЬЗОВАТЕЛЕЙ ==========

let usersCache: { data: any; timestamp: number; params?: any } | null = null;
let userGradesCache: { data: any[]; timestamp: number } | null = null;

const CACHE_DURATION = 30 * 60 * 1000; // 30 минут

// Функции очистки кэша
const clearUsersCache = () => {
    usersCache = null;
    console.log('Users cache cleared');
};

const clearUserGradesCache = () => {
    userGradesCache = null;
    console.log('User grades cache cleared');
};

const clearAllUsersCaches = () => {
    clearUsersCache();
    clearUserGradesCache();
    console.log('All users caches cleared');
};

// Функции получения кэшированных данных
const getCachedUsers = (params?: { page?: number; page_size?: number }) => {
    const now = Date.now();
    if (usersCache && (now - usersCache.timestamp) < CACHE_DURATION) {
        if (JSON.stringify(usersCache.params) === JSON.stringify(params)) {
            console.log('Returning cached users data for params:', params);
            return usersCache.data;
        }
    }
    return null;
};

const getCachedUserGrades = () => {
    const now = Date.now();
    if (userGradesCache && (now - userGradesCache.timestamp) < CACHE_DURATION) {
        console.log('Returning cached user grades data');
        return userGradesCache.data;
    }
    return null;
};

// ========== ХУКИ С КЭШИРОВАНИЕМ ==========

export const useGetUsers = () => {
    const setUsers = useUserStore((state) => state.setUsers);
    const setUsersPagination = useUserStore((state) => state.setUsersPagination);

    return useMutation({
        mutationFn: async (params?: { page?: number; page_size?: number; forceRefresh?: boolean }) => {
            const { page = 1, page_size = 30, forceRefresh = false } = params || {};
            const queryParams = { page, page_size };

            // Проверяем кэш
            if (!forceRefresh) {
                const cached = getCachedUsers(queryParams);
                if (cached) {
                    return cached;
                }
            }

            // Загружаем новые данные
            console.log(forceRefresh ? 'Force refreshing users' : `Fetching fresh users for page ${page}, page_size ${page_size}`);
            const data = await getUsers(queryParams);
            usersCache = {
                data,
                timestamp: Date.now(),
                params: queryParams
            };
            return data;
        },
        onSuccess: (data, params) => {
            // Сохраняем users и пагинацию в store
            setUsers(data.results || data);
            if (setUsersPagination) {
                setUsersPagination({
                    count: data.count,
                    next: data.next,
                    previous: data.previous,
                    currentPage: params?.page || 1,
                    pageSize: params?.page_size || 30
                });
            }
            console.log('Users loaded:', data);
        },
        onError: (error: Error) => {
            console.error("Get users error:", error.message);
        },
    });
};

export const useGetUserGrades = () => {
    const setUserGrades = useUserStore((state) => state.setUserGrades);

    return useMutation({
        mutationFn: async (forceRefresh?: boolean) => {
            // Проверяем кэш
            if (!forceRefresh) {
                const cached = getCachedUserGrades();
                if (cached) {
                    return cached;
                }
            }

            // Загружаем новые данные
            console.log(forceRefresh ? 'Force refreshing user grades' : 'Fetching fresh user grades');
            const data = await getUserGrades();
            userGradesCache = { data, timestamp: Date.now() };
            return data;
        },
        onSuccess: (data) => {
            setUserGrades(data);
            console.log('User grades loaded:', data);
        },
        onError: (error: Error) => {
            console.error("Get user grades error:", error.message);
        },
    });
};

export const useSendUsers = () => {
    return useMutation({
        mutationFn: async (body: UserBody) => {
            const result = await sendUsers(body);
            // Очищаем кэш пользователей при создании нового
            clearUsersCache();
            return result;
        },
        onSuccess: (data) => {
            console.log('User created:', data);
        },
        onError: (error: Error) => {
            console.error("Create user error:", error.message);
        },
    });
};

export const useEditUsers = () => {
    return useMutation({
        mutationFn: async ({ body, user_id }: { body: UserBody, user_id: string }) => {
            const result = await editUser(body, user_id);
            // Очищаем кэш пользователей при редактировании
            clearUsersCache();
            return result;
        },
        onSuccess: (data) => {
            console.log('User edited:', data);
        },
        onError: (error: Error) => {
            console.error("Edit user error:", error.message);
        },
    });
};

export const useDeleteUsers = () => {
    return useMutation({
        mutationFn: async (user_id: string) => {
            const result = await deleteUser(user_id);
            // Очищаем кэш пользователей при удалении
            clearUsersCache();
            return result;
        },
        onSuccess: (data) => {
            console.log('User deleted:', data);
        },
        onError: (error: Error) => {
            console.error("Delete user error:", error.message);
        },
    });
};

// ========== ДОПОЛНИТЕЛЬНЫЕ УТИЛИТЫ ==========

export const usersCacheUtils = {
    clearUsersCache: clearUsersCache,
    clearUserGradesCache: clearUserGradesCache,
    clearAll: clearAllUsersCaches,

    isUsersCacheValid: (params?: { page?: number; page_size?: number }) => {
        if (!usersCache) return false;
        const now = Date.now();
        const isTimeValid = (now - usersCache.timestamp) < CACHE_DURATION;
        const isParamsValid = JSON.stringify(usersCache.params) === JSON.stringify(params);
        return isTimeValid && isParamsValid;
    },

    isUserGradesCacheValid: () => {
        if (!userGradesCache) return false;
        const now = Date.now();
        return (now - userGradesCache.timestamp) < CACHE_DURATION;
    },

    getUsersCacheAge: () => {
        if (!usersCache) return null;
        const now = Date.now();
        return Math.floor((now - usersCache.timestamp) / 1000); // в секундах
    },

    getUserGradesCacheAge: () => {
        if (!userGradesCache) return null;
        const now = Date.now();
        return Math.floor((now - userGradesCache.timestamp) / 1000);
    },

    getUsersCacheAgeInMinutes: () => {
        if (!usersCache) return null;
        const now = Date.now();
        return Math.floor((now - usersCache.timestamp) / 60000);
    },

    getUserGradesCacheAgeInMinutes: () => {
        if (!userGradesCache) return null;
        const now = Date.now();
        return Math.floor((now - userGradesCache.timestamp) / 60000);
    },

    getUsersCacheSize: () => {
        return usersCache ? (usersCache.data.results?.length || usersCache.data.length || 0) : 0;
    },

    getUserGradesCacheSize: () => {
        return userGradesCache ? userGradesCache.data.length : 0;
    },

    getUsersCacheData: () => {
        return usersCache ? usersCache.data : null;
    },

    getUserGradesCacheData: () => {
        return userGradesCache ? userGradesCache.data : null;
    },

    getCurrentCacheParams: () => {
        return usersCache ? usersCache.params : null;
    },

    refreshUsersCache: async (params?: { page?: number; page_size?: number }) => {
        const page = params?.page || 1;
        const page_size = params?.page_size || 30;
        const data = await getUsers({ page, page_size });
        usersCache = {
            data,
            timestamp: Date.now(),
            params: { page, page_size }
        };
        console.log(`Users cache refreshed for page ${page}, page_size ${page_size}`);
        return data;
    },

    refreshUserGradesCache: async () => {
        const data = await getUserGrades();
        userGradesCache = { data, timestamp: Date.now() };
        console.log('User grades cache refreshed');
        return data;
    },

    getCacheInfo: () => {
        const now = Date.now();

        const usersInfo = !usersCache ? { exists: false } : {
            exists: true,
            isValid: (now - usersCache.timestamp) < CACHE_DURATION,
            ageInSeconds: Math.floor((now - usersCache.timestamp) / 1000),
            ageInMinutes: Math.floor((now - usersCache.timestamp) / 60000),
            size: usersCache.data.results?.length || usersCache.data.length || 0,
            currentPage: usersCache.params?.page || 1,
            pageSize: usersCache.params?.page_size || 30
        };

        const userGradesInfo = !userGradesCache ? { exists: false } : {
            exists: true,
            isValid: (now - userGradesCache.timestamp) < CACHE_DURATION,
            ageInSeconds: Math.floor((now - userGradesCache.timestamp) / 1000),
            ageInMinutes: Math.floor((now - userGradesCache.timestamp) / 60000),
            size: userGradesCache.data.length
        };

        return {
            users: usersInfo,
            userGrades: userGradesInfo,
            cacheDurationMinutes: CACHE_DURATION / 60000
        };
    }
};