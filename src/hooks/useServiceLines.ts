import { useMutation } from '@tanstack/react-query';
import { useUserStore } from '../store/UsersStore';
import { getServiceLines } from '../services/serviceLines';

// ========== КЭШ ДЛЯ СЕРВИСНЫХ ЛИНИЙ ==========

let serviceLinesCache: { data: any[]; timestamp: number } | null = null;
const CACHE_DURATION = 30 * 60 * 1000; // 30 минут

// Функция очистки кэша
const clearServiceLinesCache = () => {
    serviceLinesCache = null;
    console.log('Service lines cache cleared');
};

// Функция получения кэшированных данных
const getCachedServiceLines = () => {
    const now = Date.now();
    if (serviceLinesCache && (now - serviceLinesCache.timestamp) < CACHE_DURATION) {
        console.log('Returning cached service lines data');
        return serviceLinesCache.data;
    }
    return null;
};

// ========== ХУК С КЭШИРОВАНИЕМ ==========

export const useGetServiceLines = () => {
    const setServiceLines = useUserStore((state) => state.setServiceLines);

    return useMutation({
        mutationFn: async (forceRefresh?: boolean) => {
            // Проверяем кэш
            if (!forceRefresh) {
                const cached = getCachedServiceLines();
                if (cached) {
                    return cached;
                }
            }

            // Загружаем новые данные
            console.log(forceRefresh ? 'Force refreshing service lines' : 'Fetching fresh service lines');
            const data = await getServiceLines();
            serviceLinesCache = { data, timestamp: Date.now() };
            return data;
        },
        onSuccess: (data) => {
            setServiceLines(data);
            console.log('Service lines loaded:', data);
        },
        onError: (error: Error) => {
            console.error("Get service lines error:", error.message);
        },
    });
};

// ========== ДОПОЛНИТЕЛЬНЫЕ УТИЛИТЫ ==========

export const serviceLinesCacheUtils = {
    clearCache: clearServiceLinesCache,

    isCacheValid: () => {
        if (!serviceLinesCache) return false;
        const now = Date.now();
        return (now - serviceLinesCache.timestamp) < CACHE_DURATION;
    },

    getCacheAge: () => {
        if (!serviceLinesCache) return null;
        const now = Date.now();
        return Math.floor((now - serviceLinesCache.timestamp) / 1000); // в секундах
    },

    getCacheAgeInMinutes: () => {
        if (!serviceLinesCache) return null;
        const now = Date.now();
        return Math.floor((now - serviceLinesCache.timestamp) / 60000); // в минутах
    },

    getCacheSize: () => {
        return serviceLinesCache ? serviceLinesCache.data.length : 0;
    },

    getCacheData: () => {
        return serviceLinesCache ? serviceLinesCache.data : null;
    },

    refreshCache: async () => {
        // Принудительное обновление кэша
        const data = await getServiceLines();
        serviceLinesCache = { data, timestamp: Date.now() };
        console.log('Service lines cache refreshed');
        return data;
    },

    getCacheInfo: () => {
        if (!serviceLinesCache) {
            return { exists: false, isValid: false, age: null, size: 0 };
        }

        const now = Date.now();
        const ageInSeconds = Math.floor((now - serviceLinesCache.timestamp) / 1000);
        const isValid = ageInSeconds < CACHE_DURATION / 1000;

        return {
            exists: true,
            isValid,
            ageInSeconds,
            ageInMinutes: Math.floor(ageInSeconds / 60),
            size: serviceLinesCache.data.length,
            remainingSeconds: isValid ? Math.floor((CACHE_DURATION / 1000) - ageInSeconds) : 0,
            remainingMinutes: isValid ? Math.floor((CACHE_DURATION / 60000) - (ageInSeconds / 60)) : 0
        };
    },

    // Функция для автоматической очистки при изменениях в связанных модулях
    registerMutationListener: () => {
        // Эту функцию можно вызывать из других хуков (create, edit, delete)
        // чтобы автоматически очищать кэш сервисных линий
        clearServiceLinesCache();
    }
};

// ========== ОПЦИОНАЛЬНО: Автоматическая очистка при мутациях ==========
// Если есть хуки для создания/редактирования/удаления сервисных линий,
// добавьте в них очистку кэша:

/*
export const useCreateServiceLine = () => {
    return useMutation({
        mutationFn: (body: { name: string }) => createServiceLine(body),
        onSuccess: (data) => {
            // Очищаем кэш при создании новой сервисной линии
            serviceLinesCacheUtils.clearCache();
            console.log('Service line created:', data);
        },
        onError: (error: Error) => {
            console.error("Create service line error:", error.message);
        },
    });
};

export const useEditServiceLine = () => {
    return useMutation({
        mutationFn: ({ id, name }: { id: string; name: string }) => 
            editServiceLine(id, { name }),
        onSuccess: (data) => {
            // Очищаем кэш при редактировании
            serviceLinesCacheUtils.clearCache();
            console.log('Service line edited:', data);
        },
        onError: (error: Error) => {
            console.error("Edit service line error:", error.message);
        },
    });
};

export const useDeleteServiceLine = () => {
    return useMutation({
        mutationFn: (id: string) => deleteServiceLine(id),
        onSuccess: (data) => {
            // Очищаем кэш при удалении
            serviceLinesCacheUtils.clearCache();
            console.log('Service line deleted:', data);
        },
        onError: (error: Error) => {
            console.error("Delete service line error:", error.message);
        },
    });
};
*/