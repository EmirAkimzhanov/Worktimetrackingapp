import { useMutation } from '@tanstack/react-query';
import { useUserStore } from '../store/UsersStore';
import { getProjectTasks, sendProject } from '../services/project';
import { getAccountsStatuses, getStatuses } from '../services/status';

// ========== КЭШ ДЛЯ СТАТУСОВ ==========

let statusesCache: { data: any[]; timestamp: number } | null = null;
const CACHE_DURATION = 30 * 60 * 1000; // 30 минут

// Функция очистки кэша
const clearStatusesCache = () => {
    statusesCache = null;
    console.log('Statuses cache cleared');
};

// Функция получения кэшированных данных
const getCachedStatuses = () => {
    const now = Date.now();
    if (statusesCache && (now - statusesCache.timestamp) < CACHE_DURATION) {
        console.log('Returning cached statuses data');
        return statusesCache.data;
    }
    return null;
};

// ========== КЭШ ДЛЯ СТАТУСОВ АККАУНТОВ ==========

let accountsStatusesCache: { data: any[]; timestamp: number } | null = null;

// Функция очистки кэша статусов аккаунтов
const clearAccountsStatusesCache = () => {
    accountsStatusesCache = null;
    console.log('Accounts statuses cache cleared');
};

// Функция получения кэшированных данных статусов аккаунтов
const getCachedAccountsStatuses = () => {
    const now = Date.now();
    if (accountsStatusesCache && (now - accountsStatusesCache.timestamp) < CACHE_DURATION) {
        console.log('Returning cached accounts statuses data');
        return accountsStatusesCache.data;
    }
    return null;
};

// ========== ХУК С КЭШИРОВАНИЕМ ДЛЯ СТАТУСОВ АККАУНТОВ ==========

export const useGetAccountsStatuses = () => {
    const setAccountsStatuses = useUserStore((state) => state.setAccountsStatuses);

    return useMutation({
        mutationFn: async (forceRefresh?: boolean) => {
            // Проверяем кэш
            if (!forceRefresh) {
                const cached = getCachedAccountsStatuses();
                if (cached) {
                    return cached;
                }
            }

            // Загружаем новые данные
            console.log(forceRefresh ? 'Force refreshing accounts statuses' : 'Fetching fresh accounts statuses');
            const data = await getAccountsStatuses();
            accountsStatusesCache = { data, timestamp: Date.now() };
            return data;
        },
        onSuccess: (data) => {
            if (setAccountsStatuses) {
                setAccountsStatuses(data);
            }
            console.log('Accounts statuses loaded:', data);
        },
        onError: (error: Error) => {
            console.error("Get accounts statuses error:", error.message);
        },
    });
};

// ========== ХУК С КЭШИРОВАНИЕМ ДЛЯ ОБЫЧНЫХ СТАТУСОВ ==========

export const useStatus = () => {
    const setStatuses = useUserStore((state) => state.setStatuses);

    return useMutation({
        mutationFn: async (forceRefresh?: boolean) => {
            // Проверяем кэш
            if (!forceRefresh) {
                const cached = getCachedStatuses();
                if (cached) {
                    return cached;
                }
            }

            // Загружаем новые данные
            console.log(forceRefresh ? 'Force refreshing statuses' : 'Fetching fresh statuses');
            const data = await getStatuses();
            statusesCache = { data, timestamp: Date.now() };
            return data;
        },
        onSuccess: (data) => {
            setStatuses(data);
            console.log('Statuses loaded:', data);
        },
        onError: (error: Error) => {
            console.error("Get statuses error:", error.message);
        },
    });
};

// ========== ДОПОЛНИТЕЛЬНЫЕ УТИЛИТЫ ==========

export const statusesCacheUtils = {
    clearCache: clearStatusesCache,

    isCacheValid: () => {
        if (!statusesCache) return false;
        const now = Date.now();
        return (now - statusesCache.timestamp) < CACHE_DURATION;
    },

    getCacheAge: () => {
        if (!statusesCache) return null;
        const now = Date.now();
        return Math.floor((now - statusesCache.timestamp) / 1000); // в секундах
    },

    getCacheAgeInMinutes: () => {
        if (!statusesCache) return null;
        const now = Date.now();
        return Math.floor((now - statusesCache.timestamp) / 60000); // в минутах
    },

    getCacheSize: () => {
        return statusesCache ? statusesCache.data.length : 0;
    },

    getCacheData: () => {
        return statusesCache ? statusesCache.data : null;
    },

    refreshCache: async () => {
        // Принудительное обновление кэша
        const data = await getStatuses();
        statusesCache = { data, timestamp: Date.now() };
        console.log('Statuses cache refreshed');
        return data;
    },

    getCacheInfo: () => {
        if (!statusesCache) {
            return { exists: false, isValid: false, age: null, size: 0 };
        }

        const now = Date.now();
        const ageInSeconds = Math.floor((now - statusesCache.timestamp) / 1000);
        const isValid = ageInSeconds < CACHE_DURATION / 1000;

        return {
            exists: true,
            isValid,
            ageInSeconds,
            ageInMinutes: Math.floor(ageInSeconds / 60),
            size: statusesCache.data.length,
            remainingSeconds: isValid ? Math.floor((CACHE_DURATION / 1000) - ageInSeconds) : 0,
            remainingMinutes: isValid ? Math.floor((CACHE_DURATION / 60000) - (ageInSeconds / 60)) : 0,
            data: statusesCache.data
        };
    },

    // Функция для автоматической очистки при изменениях в связанных модулях
    clearOnMutation: () => {
        clearStatusesCache();
    }
};

// ========== УТИЛИТЫ ДЛЯ СТАТУСОВ АККАУНТОВ ==========

export const accountsStatusesCacheUtils = {
    clearCache: clearAccountsStatusesCache,

    isCacheValid: () => {
        if (!accountsStatusesCache) return false;
        const now = Date.now();
        return (now - accountsStatusesCache.timestamp) < CACHE_DURATION;
    },

    getCacheAge: () => {
        if (!accountsStatusesCache) return null;
        const now = Date.now();
        return Math.floor((now - accountsStatusesCache.timestamp) / 1000);
    },

    getCacheAgeInMinutes: () => {
        if (!accountsStatusesCache) return null;
        const now = Date.now();
        return Math.floor((now - accountsStatusesCache.timestamp) / 60000);
    },

    getCacheSize: () => {
        return accountsStatusesCache ? accountsStatusesCache.data.length : 0;
    },

    getCacheData: () => {
        return accountsStatusesCache ? accountsStatusesCache.data : null;
    },

    refreshCache: async () => {
        const data = await getAccountsStatuses();
        accountsStatusesCache = { data, timestamp: Date.now() };
        console.log('Accounts statuses cache refreshed');
        return data;
    },

    getCacheInfo: () => {
        if (!accountsStatusesCache) {
            return { exists: false, isValid: false, age: null, size: 0 };
        }

        const now = Date.now();
        const ageInSeconds = Math.floor((now - accountsStatusesCache.timestamp) / 1000);
        const isValid = ageInSeconds < CACHE_DURATION / 1000;

        return {
            exists: true,
            isValid,
            ageInSeconds,
            ageInMinutes: Math.floor(ageInSeconds / 60),
            size: accountsStatusesCache.data.length,
            remainingSeconds: isValid ? Math.floor((CACHE_DURATION / 1000) - ageInSeconds) : 0,
            remainingMinutes: isValid ? Math.floor((CACHE_DURATION / 60000) - (ageInSeconds / 60)) : 0,
            data: accountsStatusesCache.data
        };
    },

    clearOnMutation: () => {
        clearAccountsStatusesCache();
    }
};

// ========== ОПЦИОНАЛЬНО: Автоматическая очистка при мутациях ==========
// Если есть хуки для создания/редактирования/удаления статусов,
// добавьте в них очистку кэша:

/*
export const useCreateStatus = () => {
    return useMutation({
        mutationFn: (body: { name: string; color?: string }) => createStatus(body),
        onSuccess: (data) => {
            // Очищаем кэш при создании нового статуса
            statusesCacheUtils.clearCache();
            console.log('Status created:', data);
        },
        onError: (error: Error) => {
            console.error("Create status error:", error.message);
        },
    });
};

export const useEditStatus = () => {
    return useMutation({
        mutationFn: ({ statusId, body }: { statusId: string; body: { name: string; color?: string } }) => 
            editStatus(statusId, body),
        onSuccess: (data) => {
            // Очищаем кэш при редактировании статуса
            statusesCacheUtils.clearCache();
            console.log('Status edited:', data);
        },
        onError: (error: Error) => {
            console.error("Edit status error:", error.message);
        },
    });
};

export const useDeleteStatus = () => {
    return useMutation({
        mutationFn: (statusId: string) => deleteStatus(statusId),
        onSuccess: (data) => {
            // Очищаем кэш при удалении статуса
            statusesCacheUtils.clearCache();
            console.log('Status deleted:', data);
        },
        onError: (error: Error) => {
            console.error("Delete status error:", error.message);
        },
    });
};
*/