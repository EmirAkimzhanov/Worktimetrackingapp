import { useMutation } from '@tanstack/react-query';
import { useUserStore } from '../store/UsersStore';
import { createClient, deleteClient, editClient, getClientProjects, getClients, getCountryClients } from '../services/clients';
import { OnlyClient } from '../types/client';

// ========== КЭШ ДЛЯ РАЗНЫХ ТИПОВ ЗАПРОСОВ ==========

// Кэш для getCountryClients (по countryId)
const countryClientsCache = new Map<string, { data: any; timestamp: number }>();
// Кэш для getClients (с пагинацией)
let clientsCache: { data: any; timestamp: number; params?: any } | null = null;
// Кэш для getClientProjects (по clientId)
const clientProjectsCache = new Map<string, { data: any; timestamp: number }>();

const CACHE_DURATION = 30 * 60 * 1000; // 30 минут

// Функции очистки кэша
const clearCountryClientsCache = (countryId?: string) => {
    if (countryId) {
        countryClientsCache.delete(countryId);
    } else {
        countryClientsCache.clear();
    }
};

const clearClientsCache = () => {
    clientsCache = null;
};

const clearClientProjectsCache = (clientId?: string) => {
    if (clientId) {
        clientProjectsCache.delete(clientId);
    } else {
        clientProjectsCache.clear();
    }
};

// Очистка всех кэшей
const clearAllCaches = () => {
    countryClientsCache.clear();
    clientsCache = null;
    clientProjectsCache.clear();
};

// Функция получения кэшированных клиентов
const getCachedClients = (params?: { page?: number; page_size?: number }) => {
    const now = Date.now();
    if (clientsCache && (now - clientsCache.timestamp) < CACHE_DURATION) {
        if (JSON.stringify(clientsCache.params) === JSON.stringify(params)) {
            console.log('Returning cached clients data for params:', params);
            return clientsCache.data;
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
        mutationFn: async (params?: { page?: number; page_size?: number; forceRefresh?: boolean }) => {
            const { page = 1, page_size = 30, forceRefresh = false } = params || {};
            const queryParams = { page, page_size };

            // Проверяем кэш
            if (!forceRefresh) {
                const cached = getCachedClients(queryParams);
                if (cached) {
                    return cached;
                }
            }

            console.log(forceRefresh ? 'Force refreshing clients' : `Fetching fresh clients for page ${page}, page_size ${page_size}`);
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

// ========== ДОПОЛНИТЕЛЬНЫЕ УТИЛИТЫ ==========

// Экспортируем функции для ручной очистки кэша (если понадобится)
export const cacheUtils = {
    clearCountryClients: clearCountryClientsCache,
    clearClients: clearClientsCache,
    clearClientProjects: clearClientProjectsCache,
    clearAll: clearAllCaches,
    getCacheStats: () => ({
        countryClientsSize: countryClientsCache.size,
        clientsCached: !!clientsCache,
        clientsCacheParams: clientsCache?.params || null,
        clientProjectsSize: clientProjectsCache.size,
    }),
};