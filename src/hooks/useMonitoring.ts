import { useMutation } from '@tanstack/react-query';
import { useUserStore } from '../store/UsersStore';
import { getMonitoring } from '../services/monitoring';

// ========== КЭШ ДЛЯ МОНИТОРИНГА ==========

// Кэш для мониторинга с ключом на основе параметров запроса
interface MonitoringParams {
    start_date: string;
    end_date: string;
    country: string;
}

interface CacheEntry {
    data: any;
    params: MonitoringParams;
    timestamp: number;
}

// Используем Map для кэширования разных комбинаций параметров
const monitoringCache = new Map<string, CacheEntry>();
const CACHE_DURATION = 30 * 60 * 1000; // 30 минут

// Функция для генерации ключа кэша на основе параметров
const getCacheKey = (params: MonitoringParams): string => {
    return `${params.country}_${params.start_date}_${params.end_date}`;
};

// Функция очистки кэша
const clearMonitoringCache = (params?: MonitoringParams) => {
    if (params) {
        const key = getCacheKey(params);
        monitoringCache.delete(key);
        console.log(`Monitoring cache cleared for: ${key}`);
    } else {
        monitoringCache.clear();
        console.log('All monitoring cache cleared');
    }
};

// Функция получения кэшированных данных
const getCachedMonitoring = (params: MonitoringParams): any | null => {
    const key = getCacheKey(params);
    const cached = monitoringCache.get(key);

    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
        console.log(`Returning cached monitoring data for: ${key}`);
        return cached.data;
    }

    return null;
};

// ========== ХУК С КЭШИРОВАНИЕМ ==========

export const useGetMonitoring = () => {
    const setMonitoring = useUserStore((state) => state.setMonitoring);

    return useMutation({
        mutationFn: async ({ start_date, end_date, country }: MonitoringParams) => {
            const params = { start_date, end_date, country };

            // Проверяем кэш
            const cached = getCachedMonitoring(params);
            if (cached) {
                return cached;
            }

            // Загружаем новые данные
            console.log(`Fetching fresh monitoring data for: ${country} from ${start_date} to ${end_date}`);
            const data = await getMonitoring(start_date, end_date, country);

            // Сохраняем в кэш
            const key = getCacheKey(params);
            monitoringCache.set(key, {
                data,
                params,
                timestamp: Date.now()
            });

            return data;
        },
        onSuccess: (data) => {
            setMonitoring(data);
            console.log('Monitoring data loaded:', data);
        },
        onError: (error: Error) => {
            console.error("Get monitoring error:", error.message);
        },
    });
};

// ========== ДОПОЛНИТЕЛЬНЫЕ УТИЛИТЫ ==========

export const monitoringCacheUtils = {
    clearCache: clearMonitoringCache,
    clearAll: () => clearMonitoringCache(),
    clearForParams: (params: MonitoringParams) => clearMonitoringCache(params),
    isCacheValid: (params: MonitoringParams) => {
        const key = getCacheKey(params);
        const cached = monitoringCache.get(key);

        if (!cached) return false;
        return (Date.now() - cached.timestamp) < CACHE_DURATION;
    },
    getCacheAge: (params: MonitoringParams) => {
        const key = getCacheKey(params);
        const cached = monitoringCache.get(key);

        if (!cached) return null;
        return Math.floor((Date.now() - cached.timestamp) / 1000); // в секундах
    },
    getCacheAgeInMinutes: (params: MonitoringParams) => {
        const key = getCacheKey(params);
        const cached = monitoringCache.get(key);

        if (!cached) return null;
        return Math.floor((Date.now() - cached.timestamp) / 60000); // в минутах
    },
    getAllCacheStats: () => {
        const now = Date.now();
        const stats: { [key: string]: { age: number; isValid: boolean; params: MonitoringParams } } = {};

        monitoringCache.forEach((entry, key) => {
            const age = Math.floor((now - entry.timestamp) / 1000);
            stats[key] = {
                age,
                isValid: age < CACHE_DURATION / 1000,
                params: entry.params
            };
        });

        return {
            size: monitoringCache.size,
            items: stats,
            cacheDurationMinutes: CACHE_DURATION / 60000
        };
    },
    preloadMonitoring: async (params: MonitoringParams) => {
        // Функция для предзагрузки данных мониторинга
        const key = getCacheKey(params);
        if (!monitoringCache.has(key)) {
            console.log(`Preloading monitoring data for: ${key}`);
            const data = await getMonitoring(params.start_date, params.end_date, params.country);
            monitoringCache.set(key, {
                data,
                params,
                timestamp: Date.now()
            });
            return data;
        }
        return monitoringCache.get(key)?.data;
    },
    removeExpired: () => {
        // Удаление устаревших записей из кэша
        const now = Date.now();
        let removedCount = 0;

        monitoringCache.forEach((entry, key) => {
            if ((now - entry.timestamp) >= CACHE_DURATION) {
                monitoringCache.delete(key);
                removedCount++;
            }
        });

        console.log(`Removed ${removedCount} expired cache entries`);
        return removedCount;
    }
};