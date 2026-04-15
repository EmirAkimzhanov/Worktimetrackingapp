import { useMutation } from '@tanstack/react-query';
import { useUserStore } from '../store/UsersStore';
import { getSectors } from '../services/sector';

// ========== КЭШ ДЛЯ СЕКТОРОВ ==========

let sectorsCache: { data: any[]; timestamp: number } | null = null;
const CACHE_DURATION = 30 * 60 * 1000; // 30 минут

// Функция очистки кэша
const clearSectorsCache = () => {
    sectorsCache = null;
    console.log('Sectors cache cleared');
};

// Функция получения кэшированных данных
const getCachedSectors = () => {
    const now = Date.now();
    if (sectorsCache && (now - sectorsCache.timestamp) < CACHE_DURATION) {
        console.log('Returning cached sectors data');
        return sectorsCache.data;
    }
    return null;
};

// ========== ХУК С КЭШИРОВАНИЕМ ==========

export const useGetSectors = () => {
    const setSectors = useUserStore((state) => state.setSectors);

    return useMutation({
        mutationFn: async (forceRefresh?: boolean) => {
            // Проверяем кэш
            if (!forceRefresh) {
                const cached = getCachedSectors();
                if (cached) {
                    return cached;
                }
            }

            // Загружаем новые данные
            console.log(forceRefresh ? 'Force refreshing sectors' : 'Fetching fresh sectors');
            const data = await getSectors();
            sectorsCache = { data, timestamp: Date.now() };
            return data;
        },
        onSuccess: (data) => {
            setSectors(data);
            console.log('Sectors loaded:', data);
        },
        onError: (error: Error) => {
            console.error("Get sectors error:", error.message);
        },
    });
};

// ========== ДОПОЛНИТЕЛЬНЫЕ УТИЛИТЫ ==========

export const sectorsCacheUtils = {
    clearCache: clearSectorsCache,

    isCacheValid: () => {
        if (!sectorsCache) return false;
        const now = Date.now();
        return (now - sectorsCache.timestamp) < CACHE_DURATION;
    },

    getCacheAge: () => {
        if (!sectorsCache) return null;
        const now = Date.now();
        return Math.floor((now - sectorsCache.timestamp) / 1000); // в секундах
    },

    getCacheAgeInMinutes: () => {
        if (!sectorsCache) return null;
        const now = Date.now();
        return Math.floor((now - sectorsCache.timestamp) / 60000); // в минутах
    },

    getCacheSize: () => {
        return sectorsCache ? sectorsCache.data.length : 0;
    },

    getCacheData: () => {
        return sectorsCache ? sectorsCache.data : null;
    },

    refreshCache: async () => {
        // Принудительное обновление кэша
        const data = await getSectors();
        sectorsCache = { data, timestamp: Date.now() };
        console.log('Sectors cache refreshed');
        return data;
    },

    getCacheInfo: () => {
        if (!sectorsCache) {
            return { exists: false, isValid: false, age: null, size: 0 };
        }

        const now = Date.now();
        const ageInSeconds = Math.floor((now - sectorsCache.timestamp) / 1000);
        const isValid = ageInSeconds < CACHE_DURATION / 1000;

        return {
            exists: true,
            isValid,
            ageInSeconds,
            ageInMinutes: Math.floor(ageInSeconds / 60),
            size: sectorsCache.data.length,
            data: sectorsCache.data
        };
    }
};