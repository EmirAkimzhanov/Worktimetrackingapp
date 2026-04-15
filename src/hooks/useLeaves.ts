import { useMutation } from '@tanstack/react-query';
import { useUserStore } from '../store/UsersStore';
import { getLeaves } from '../services/leave';

// ========== КЭШ ДЛЯ ОТПУСКОВ ==========

let leavesCache: { data: any; timestamp: number } | null = null;
const CACHE_DURATION = 30 * 60 * 1000; // 30 минут

// Функция очистки кэша
const clearLeavesCache = () => {
    leavesCache = null;
    console.log('Leaves cache cleared');
};

// Функция получения кэшированных данных
const getCachedLeaves = () => {
    const now = Date.now();
    if (leavesCache && (now - leavesCache.timestamp) < CACHE_DURATION) {
        console.log('Returning cached leaves data');
        return leavesCache.data;
    }
    return null;
};

// ========== ХУК С КЭШИРОВАНИЕМ ==========

export const useGetLeaves = () => {
    const setLeaves = useUserStore((state) => state.setLeaves);

    return useMutation({
        mutationFn: async (forceRefresh?: boolean) => {
            // Проверяем кэш
            if (!forceRefresh) {
                const cached = getCachedLeaves();
                if (cached) {
                    return cached;
                }
            }

            // Загружаем новые данные
            console.log(forceRefresh ? 'Force refreshing leaves' : 'Fetching fresh leaves');
            const data = await getLeaves();
            leavesCache = { data, timestamp: Date.now() };
            return data;
        },
        onSuccess: (data) => {
            setLeaves(data);
            console.log('Leaves loaded:', data);
        },
        onError: (error: Error) => {
            console.error("Get leaves error:", error.message);
        },
    });
};

// ========== ДОПОЛНИТЕЛЬНЫЕ УТИЛИТЫ ==========

export const leavesCacheUtils = {
    clearCache: clearLeavesCache,
    isCacheValid: () => {
        if (!leavesCache) return false;
        const now = Date.now();
        return (now - leavesCache.timestamp) < CACHE_DURATION;
    },
    getCacheAge: () => {
        if (!leavesCache) return null;
        const now = Date.now();
        return Math.floor((now - leavesCache.timestamp) / 1000); // в секундах
    },
    getCacheAgeInMinutes: () => {
        if (!leavesCache) return null;
        const now = Date.now();
        return Math.floor((now - leavesCache.timestamp) / 60000); // в минутах
    },
    getCacheData: () => {
        return leavesCache ? leavesCache.data : null;
    },
    refreshCache: async () => {
        // Принудительное обновление кэша
        const data = await getLeaves();
        leavesCache = { data, timestamp: Date.now() };
        console.log('Leaves cache refreshed');
        return data;
    }
};