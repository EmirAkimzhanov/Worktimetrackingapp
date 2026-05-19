import { useMutation } from '@tanstack/react-query';
import { useUserStore } from '../store/UsersStore';
import { deleteUser, editUser, getUserGrades, getUsers, getUsersExcel, GetUsersExcelParams, sendUsers } from '../services/users';
import { UserBody } from '../types/user';

// ========== ТИПЫ ==========

interface GetUsersParams {
    page?: number;
    page_size?: number;
    forceRefresh?: boolean;
    first_name?: string;
    last_name?: string;
    email?: string;
    position_name?: string;
    department_name?: string;
    department_role_name?: string;
    grade_name?: string;
    country_code?: string;
    role_name?: string;
    joined_after?: string;
    joined_before?: string;
    is_active?: string;
    ordering?: string;
}

interface CacheEntry {
    data: any;
    timestamp: number;
    params?: GetUsersParams;
}

// ========== КЭШ ДЛЯ ПОЛЬЗОВАТЕЛЕЙ ==========

let usersCache: CacheEntry | null = null;
let userGradesCache: { data: any[]; timestamp: number } | null = null;

const CACHE_DURATION = 30 * 60 * 1000; // 30 минут

// Функция для генерации ключа кэша на основе параметров
const getCacheKey = (params?: GetUsersParams) => {
    if (!params) return 'default';
    const {
        page,
        page_size,
        first_name,
        last_name,
        email,
        position_name,
        department_name,
        department_role_name,
        grade_name,
        country_code,
        role_name,
        joined_after,
        joined_before,
        is_active,
        ordering
    } = params;
    return JSON.stringify({
        page: page || 1,
        page_size: page_size || 30,
        first_name: first_name || '',
        last_name: last_name || '',
        email: email || '',
        position_name: position_name || '',
        department_name: department_name || '',
        department_role_name: department_role_name || '',
        grade_name: grade_name || '',
        country_code: country_code || '',
        role_name: role_name || '',
        joined_after: joined_after || '',
        joined_before: joined_before || '',
        is_active: is_active || '',
        ordering: ordering || ''
    });
};

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
const getCachedUsers = (params?: GetUsersParams) => {
    const now = Date.now();
    if (usersCache && (now - usersCache.timestamp) < CACHE_DURATION) {
        const cacheKey = getCacheKey(usersCache.params);
        const currentKey = getCacheKey(params);

        if (cacheKey === currentKey) {
            console.log('Returning cached users data for params:', params);
            return usersCache.data;
        } else {
            console.log('Cache params mismatch, fetching fresh data');
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
        mutationFn: async (params?: GetUsersParams) => {
            const {
                page = 1,
                page_size = 30,
                forceRefresh = false,
                first_name,
                last_name,
                email,
                position_name,
                department_name,
                department_role_name,
                grade_name,
                country_code,
                role_name,
                joined_after,
                joined_before,
                is_active,
                ordering
            } = params || {};

            const queryParams = {
                page,
                page_size,
                ...(first_name && { first_name }),
                ...(last_name && { last_name }),
                ...(email && { email }),
                ...(position_name && { position_name }),
                ...(department_name && { department_name }),
                ...(department_role_name && { department_role_name }),
                ...(grade_name && { grade_name }),
                ...(country_code && { country_code }),
                ...(role_name && { role_name }),
                ...(joined_after && { joined_after }),
                ...(joined_before && { joined_before }),
                ...(is_active && { is_active }),
                ...(ordering && { ordering })
            };

            console.log('🔍 Query params before cache check:', queryParams);

            // Проверяем кэш
            if (!forceRefresh) {
                const cached = getCachedUsers(queryParams);
                if (cached) {
                    // Сохраняем в store даже из кэша
                    setUsers(cached.results || cached);
                    if (setUsersPagination) {
                        setUsersPagination({
                            count: cached.count,
                            next: cached.next,
                            previous: cached.previous,
                            currentPage: page,
                            pageSize: page_size
                        });
                    }
                    return cached;
                }
            }

            console.log(forceRefresh ? 'Force refreshing users' : `Fetching fresh users with params:`, queryParams);
            const data = await getUsers(queryParams);

            // Сохраняем в кэш с параметрами
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

    isUsersCacheValid: (params?: GetUsersParams) => {
        if (!usersCache) return false;
        const now = Date.now();
        const isTimeValid = (now - usersCache.timestamp) < CACHE_DURATION;
        const cacheKey = getCacheKey(usersCache.params);
        const currentKey = getCacheKey(params);
        return isTimeValid && cacheKey === currentKey;
    },

    isUserGradesCacheValid: () => {
        if (!userGradesCache) return false;
        const now = Date.now();
        return (now - userGradesCache.timestamp) < CACHE_DURATION;
    },

    getUsersCacheAge: () => {
        if (!usersCache) return null;
        const now = Date.now();
        return Math.floor((now - usersCache.timestamp) / 1000);
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

    refreshUsersCache: async (params?: GetUsersParams) => {
        const {
            page = 1,
            page_size = 30,
            first_name,
            last_name,
            email,
            position_name,
            department_name,
            department_role_name,
            grade_name,
            country_code,
            role_name,
            joined_after,
            joined_before,
            is_active,
            ordering
        } = params || {};

        const queryParams = {
            page,
            page_size,
            ...(first_name && { first_name }),
            ...(last_name && { last_name }),
            ...(email && { email }),
            ...(position_name && { position_name }),
            ...(department_name && { department_name }),
            ...(department_role_name && { department_role_name }),
            ...(grade_name && { grade_name }),
            ...(country_code && { country_code }),
            ...(role_name && { role_name }),
            ...(joined_after && { joined_after }),
            ...(joined_before && { joined_before }),
            ...(is_active && { is_active }),
            ...(ordering && { ordering })
        };

        const data = await getUsers(queryParams);
        usersCache = {
            data,
            timestamp: Date.now(),
            params: queryParams
        };
        console.log(`Users cache refreshed with params:`, queryParams);
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
            pageSize: usersCache.params?.page_size || 30,
            params: usersCache.params
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

export const useExportUsersExcel = () => {
    return useMutation({
        mutationFn: async (params?: GetUsersExcelParams) => {
            const blob = await getUsersExcel(params);
            return { blob, params };
        },
        onSuccess: ({ blob, params }) => {
            // Формируем имя файла с текущей датой
            const now = new Date();
            const dateStr = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
            const filename = `users_export_${dateStr}.xlsx`;

            // Создаем URL для скачивания
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            console.log(`Users exported successfully with params:`, params);
            toast.success('Пользователи успешно экспортированы в Excel');
        },
        onError: (error: Error) => {
            console.error("Export users to Excel error:", error.message);
            toast.error('Ошибка при экспорте пользователей');
        },
    });
};