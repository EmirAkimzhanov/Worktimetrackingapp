import { useMutation } from '@tanstack/react-query';
import { useUserStore } from '../store/UsersStore';
import { getReports, getReportsExcel } from '../services/reprot';

// ========== КЭШ ДЛЯ ОТЧЕТОВ ==========

// Кэш для отчетов
let reportsCache: { data: any; timestamp: number } | null = null;

// Кэш для Excel отчетов (обычно не кэшируем, но добавим для единообразия)
let reportsExcelCache: { data: any; timestamp: number } | null = null;

const CACHE_DURATION = 30 * 60 * 1000; // 30 минут

// Функции очистки кэша
const clearReportsCache = () => {
    reportsCache = null;
    console.log('Reports cache cleared');
};

const clearReportsExcelCache = () => {
    reportsExcelCache = null;
    console.log('Reports Excel cache cleared');
};

const clearAllReportsCaches = () => {
    clearReportsCache();
    clearReportsExcelCache();
    console.log('All reports caches cleared');
};

// Функции получения кэшированных данных
const getCachedReports = () => {
    const now = Date.now();
    if (reportsCache && (now - reportsCache.timestamp) < CACHE_DURATION) {
        console.log('Returning cached reports data');
        return reportsCache.data;
    }
    return null;
};

const getCachedReportsExcel = () => {
    const now = Date.now();
    if (reportsExcelCache && (now - reportsExcelCache.timestamp) < CACHE_DURATION) {
        console.log('Returning cached reports Excel data');
        return reportsExcelCache.data;
    }
    return null;
};

// ========== ХУКИ С КЭШИРОВАНИЕМ ==========

export const useGetReports = () => {
    const setReports = useUserStore((state) => state.setReports);

    return useMutation({
        mutationFn: async (forceRefresh?: boolean) => {
            // Проверяем кэш
            if (!forceRefresh) {
                const cached = getCachedReports();
                if (cached) {
                    return cached;
                }
            }

            // Загружаем новые данные
            console.log(forceRefresh ? 'Force refreshing reports' : 'Fetching fresh reports');
            const data = await getReports();
            reportsCache = { data, timestamp: Date.now() };
            return data;
        },
        onSuccess: (data) => {
            setReports(data);
            console.log('Reports loaded:', data);
        },
        onError: (error: Error) => {
            console.error("Get reports error:", error.message);
        },
    });
};

export const useGetReportsExcel = () => {
    return useMutation({
        mutationFn: async (forceRefresh?: boolean) => {
            // Для Excel отчетов обычно не нужно кэширование, но добавим по желанию
            if (!forceRefresh) {
                const cached = getCachedReportsExcel();
                if (cached) {
                    console.log('Returning cached reports Excel data');
                    return cached;
                }
            }

            // Загружаем новые данные
            console.log(forceRefresh ? 'Force refreshing reports Excel' : 'Fetching fresh reports Excel');
            const data = await getReportsExcel();

            // Для Excel отчетов обычно не кэшируем, так как файлы могут быть большими
            // Но если нужно, раскомментируйте следующую строку
            // reportsExcelCache = { data, timestamp: Date.now() };

            return data;
        },
        onSuccess: (data) => {
            console.log('Reports Excel loaded');
        },
        onError: (error: Error) => {
            console.error("Get reports Excel error:", error.message);
        },
    });
};

// ========== ДОПОЛНИТЕЛЬНЫЕ УТИЛИТЫ ==========

export const reportsCacheUtils = {
    clearReportsCache: clearReportsCache,
    clearReportsExcelCache: clearReportsExcelCache,
    clearAll: clearAllReportsCaches,

    isReportsCacheValid: () => {
        if (!reportsCache) return false;
        const now = Date.now();
        return (now - reportsCache.timestamp) < CACHE_DURATION;
    },

    isReportsExcelCacheValid: () => {
        if (!reportsExcelCache) return false;
        const now = Date.now();
        return (now - reportsExcelCache.timestamp) < CACHE_DURATION;
    },

    getReportsCacheAge: () => {
        if (!reportsCache) return null;
        const now = Date.now();
        return Math.floor((now - reportsCache.timestamp) / 1000); // в секундах
    },

    getReportsCacheAgeInMinutes: () => {
        if (!reportsCache) return null;
        const now = Date.now();
        return Math.floor((now - reportsCache.timestamp) / 60000); // в минутах
    },

    getReportsExcelCacheAge: () => {
        if (!reportsExcelCache) return null;
        const now = Date.now();
        return Math.floor((now - reportsExcelCache.timestamp) / 1000);
    },

    refreshReportsCache: async () => {
        const data = await getReports();
        reportsCache = { data, timestamp: Date.now() };
        console.log('Reports cache refreshed');
        return data;
    },

    refreshReportsExcelCache: async () => {
        const data = await getReportsExcel();
        reportsExcelCache = { data, timestamp: Date.now() };
        console.log('Reports Excel cache refreshed');
        return data;
    }
};