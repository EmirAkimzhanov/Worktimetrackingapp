// hooks/useClients.ts
import { useMutation } from '@tanstack/react-query';
import { useUserStore } from '../store/UsersStore';
import { createClient, deleteClient, editClient, getClientProjects, getClients, getCountryClients, GetClientsParams, getClientsExcel, GetClientsExcelParams } from '../services/clients';
import { OnlyClient } from '../types/client';
import { toast } from 'sonner';

// ========== ТИПЫ ==========

interface CacheEntry {
    data: any;
    timestamp: number;
    params?: GetClientsParams;
}

// ========== КЭШ ДЛЯ РАЗНЫХ ТИПОВ ЗАПРОСОВ ==========

// Кэш для getCountryClients (по countryId)
const countryClientsCache = new Map<string, { data: any; timestamp: number }>();
// Кэш для getClients (с пагинацией и фильтрами)
let clientsCache: CacheEntry | null = null;
// Кэш для getClientProjects (по clientId)
const clientProjectsCache = new Map<string, { data: any; timestamp: number }>();

const CACHE_DURATION = 30 * 60 * 1000; // 30 минут

// Функция для генерации ключа кэша на основе параметров
const getCacheKey = (params?: GetClientsParams) => {
    if (!params) return 'default';
    const {
        page,
        page_size,
        name,
        group,
        personal_number,
        sector_name,
        ordering
    } = params;
    return JSON.stringify({
        page: page || 1,
        page_size: page_size || 30,
        name: name || '',
        group: group || '',
        personal_number: personal_number || '',
        sector_name: sector_name || '',
        ordering: ordering || ''
    });
};

// Функции очистки кэша
const clearCountryClientsCache = (countryId?: string) => {
    if (countryId) {
        countryClientsCache.delete(countryId);
        console.log(`Country clients cache cleared for country: ${countryId}`);
    } else {
        countryClientsCache.clear();
        console.log('All country clients cache cleared');
    }
};

const clearClientsCache = () => {
    clientsCache = null;
    console.log('Clients cache cleared');
};

const clearClientProjectsCache = (clientId?: string) => {
    if (clientId) {
        clientProjectsCache.delete(clientId);
        console.log(`Client projects cache cleared for client: ${clientId}`);
    } else {
        clientProjectsCache.clear();
        console.log('All client projects cache cleared');
    }
};

// Очистка всех кэшей
const clearAllCaches = () => {
    countryClientsCache.clear();
    clientsCache = null;
    clientProjectsCache.clear();
    console.log('All clients caches cleared');
};

// Функция получения кэшированных клиентов
const getCachedClients = (params?: GetClientsParams) => {
    const now = Date.now();
    if (clientsCache && (now - clientsCache.timestamp) < CACHE_DURATION) {
        const cacheKey = getCacheKey(clientsCache.params);
        const currentKey = getCacheKey(params);

        if (cacheKey === currentKey) {
            console.log('Returning cached clients data for params:', params);
            return clientsCache.data;
        } else {
            console.log('Cache params mismatch, fetching fresh data');
        }
    }
    return null;
};

// ========== ХУКИ С КЭШИРОВАНИЕМ ==========

export const useGetCountryClients = () => {
    const setCountries = useUserStore((state) => state.setCountries);

    return useMutation({
        mutationFn: async (countryId: string) => {
            // Проверяем кэш
            const now = Date.now();
            const cached = countryClientsCache.get(countryId);

            if (cached && (now - cached.timestamp) < CACHE_DURATION) {
                console.log(`Using cached data for country ${countryId}`);
                return cached.data;
            }

            // Загружаем новые данные
            console.log(`Fetching fresh data for country ${countryId}`);
            const data = await getCountryClients(countryId);
            countryClientsCache.set(countryId, { data, timestamp: now });
            return data;
        },
        onSuccess: (data, countryId) => {
            useUserStore.getState().setSelectedCountry(data);
            setCountries(data);
            console.log('Country clients loaded:', data);
        },
        onError: (error: Error) => {
            console.error("Get country clients error:", error.message);
        },
    });
};

export const useGetCLientProjecs = () => {
    const setClientProjects = useUserStore((state) => state.setClientProjects);

    return useMutation({
        mutationFn: async (clientId: string) => {
            // Проверяем кэш
            const now = Date.now();
            const cached = clientProjectsCache.get(clientId);

            if (cached && (now - cached.timestamp) < CACHE_DURATION) {
                console.log(`Using cached projects for client ${clientId}`);
                return cached.data;
            }

            // Загружаем новые данные
            console.log(`Fetching fresh projects for client ${clientId}`);
            const data = await getClientProjects(clientId);
            clientProjectsCache.set(clientId, { data, timestamp: now });
            return data;
        },
        onSuccess: (data) => {
            setClientProjects(data);
            console.log('Client projects loaded:', data);
        },
        onError: (error: Error) => {
            console.error("Get client projects error:", error.message);
        },
    });
};

export const useGetClients = () => {
    const setClients = useUserStore((state) => state.setClients);
    const setClientsPagination = useUserStore((state) => state.setClientsPagination);

    return useMutation({
        mutationFn: async (params?: GetClientsParams) => {
            const {
                page = 1,
                page_size = 30,
                forceRefresh = false,
                name,
                group,
                personal_number,
                sector_name,
                ordering
            } = params || {};

            const queryParams = {
                page,
                page_size,
                ...(name && { name }),
                ...(group && { group }),
                ...(personal_number && { personal_number }),
                ...(sector_name && { sector_name }),
                ...(ordering && { ordering })
            };

            console.log('🔍 Query params before cache check:', queryParams);

            // Проверяем кэш
            if (!forceRefresh) {
                const cached = getCachedClients(queryParams);
                if (cached) {
                    // Сохраняем в store даже из кэша
                    setClients(cached.results || cached);
                    if (setClientsPagination) {
                        setClientsPagination({
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

            console.log(forceRefresh ? 'Force refreshing clients' : `Fetching fresh clients with params:`, queryParams);
            const data = await getClients(queryParams);

            // Сохраняем в кэш с параметрами
            clientsCache = {
                data,
                timestamp: Date.now(),
                params: queryParams
            };

            return data;
        },
        onSuccess: (data, params) => {
            // Сохраняем clients и пагинацию в store
            setClients(data.results || data);
            if (setClientsPagination) {
                setClientsPagination({
                    count: data.count,
                    next: data.next,
                    previous: data.previous,
                    currentPage: params?.page || 1,
                    pageSize: params?.page_size || 30
                });
            }
            console.log('Clients loaded:', data);
        },
        onError: (error: Error) => {
            console.error("Get clients error:", error.message);
        },
    });
};

export const useCreateClients = () => {
    return useMutation({
        mutationFn: (body: OnlyClient) => createClient(body),
        onSuccess: (data) => {
            // Очищаем все кэши при создании нового клиента
            clearAllCaches();
            console.log('Client created:', data);
        },
        onError: (error: Error) => {
            console.error("Create client error:", error.message);
        },
    });
};

export const useEditClients = () => {
    return useMutation({
        mutationFn: ({ body, client_id }: { body: OnlyClient, client_id: string }) => editClient(body, client_id),
        onSuccess: (data, variables) => {
            // Очищаем кэши при редактировании
            clearAllCaches();
            console.log('Client edited:', data);
        },
        onError: (error: Error) => {
            console.error("Edit client error:", error.message);
        },
    });
};

export const useDeleteClients = () => {
    return useMutation({
        mutationFn: (client_id: string) => deleteClient(client_id),
        onSuccess: (data, client_id) => {
            // Очищаем кэши при удалении
            clearAllCaches();
            console.log('Client deleted:', data);
        },
        onError: (error: Error) => {
            console.error("Delete client error:", error.message);
        },
    });
};

// ========== ХУК ДЛЯ ЭКСПОРТА В EXCEL ==========

export const useExportClientsExcel = () => {
    return useMutation({
        mutationFn: async (params?: GetClientsExcelParams) => {
            const blob = await getClientsExcel(params);
            return { blob, params };
        },
        onSuccess: ({ blob, params }) => {
            // Формируем имя файла с текущей датой
            const now = new Date();
            const dateStr = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
            const filename = `clients_export_${dateStr}.xlsx`;

            // Создаем URL для скачивания
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            console.log(`Clients exported successfully with params:`, params);
            toast.success('Клиенты успешно экспортированы в Excel');
        },
        onError: (error: Error) => {
            console.error("Export clients to Excel error:", error.message);
            toast.error('Ошибка при экспорте клиентов');
        },
    });
};

// ========== ДОПОЛНИТЕЛЬНЫЕ УТИЛИТЫ ==========

export const cacheUtils = {
    clearCountryClients: clearCountryClientsCache,
    clearClients: clearClientsCache,
    clearClientProjects: clearClientProjectsCache,
    clearAll: clearAllCaches,

    isClientsCacheValid: (params?: GetClientsParams) => {
        if (!clientsCache) return false;
        const now = Date.now();
        const isTimeValid = (now - clientsCache.timestamp) < CACHE_DURATION;
        const cacheKey = getCacheKey(clientsCache.params);
        const currentKey = getCacheKey(params);
        return isTimeValid && cacheKey === currentKey;
    },

    getClientsCacheAge: () => {
        if (!clientsCache) return null;
        const now = Date.now();
        return Math.floor((now - clientsCache.timestamp) / 1000);
    },

    getClientsCacheSize: () => {
        return clientsCache ? (clientsCache.data.results?.length || clientsCache.data.length || 0) : 0;
    },

    getCurrentCacheParams: () => {
        return clientsCache?.params || null;
    },

    refreshClientsCache: async (params?: GetClientsParams) => {
        const {
            page = 1,
            page_size = 30,
            name,
            group,
            personal_number,
            sector_name,
            ordering
        } = params || {};

        const queryParams = {
            page,
            page_size,
            ...(name && { name }),
            ...(group && { group }),
            ...(personal_number && { personal_number }),
            ...(sector_name && { sector_name }),
            ...(ordering && { ordering })
        };

        const data = await getClients(queryParams);
        clientsCache = {
            data,
            timestamp: Date.now(),
            params: queryParams
        };
        console.log(`Clients cache refreshed with params:`, queryParams);
        return data;
    },

    getCacheStats: () => ({
        countryClientsSize: countryClientsCache.size,
        clientsCached: !!clientsCache,
        clientsCacheParams: clientsCache?.params || null,
        clientsCacheAge: clientsCache ? Math.floor((Date.now() - clientsCache.timestamp) / 1000) : null,
        clientProjectsSize: clientProjectsCache.size,
    }),

    getCacheInfo: () => {
        const now = Date.now();
        const clientsInfo = !clientsCache ? { exists: false } : {
            exists: true,
            isValid: (now - clientsCache.timestamp) < CACHE_DURATION,
            ageInSeconds: Math.floor((now - clientsCache.timestamp) / 1000),
            ageInMinutes: Math.floor((now - clientsCache.timestamp) / 60000),
            size: clientsCache.data.results?.length || clientsCache.data.length || 0,
            currentPage: clientsCache.params?.page || 1,
            pageSize: clientsCache.params?.page_size || 30,
            params: clientsCache.params
        };

        return {
            clients: clientsInfo,
            countryClientsCount: countryClientsCache.size,
            clientProjectsCount: clientProjectsCache.size,
            cacheDurationMinutes: CACHE_DURATION / 60000
        };
    }
};