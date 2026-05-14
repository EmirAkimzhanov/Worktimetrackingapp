import { useMutation, useQuery } from '@tanstack/react-query';
import { useUserStore } from '../store/UsersStore';
import { getMonitoring, getMonitoringExcel } from '../services/monitoring';
import { useEffect } from 'react';

// ========== КЛЮЧИ ДЛЯ REACT QUERY ==========
const MONITORING_QUERY_KEY = 'monitoring';
const MONITORING_EXCEL_QUERY_KEY = 'monitoring-excel';

// ========== ХУК ДЛЯ ПОЛУЧЕНИЯ МОНИТОРИНГА С ПАГИНАЦИЕЙ (РУЧНОЙ ВЫЗОВ) ==========
export const useGetMonitoring = () => {
    const setMonitoring = useUserStore((state) => state.setMonitoring);

    return useMutation({
        mutationFn: async (params?: {
            page?: number;
            page_size?: number;
            start_date?: string;
            end_date?: string;
            country_id?: string | number;
            department?: string;
            user_id?: number;
            project_id?: number;
            ordering?: string;
        }) => {
            console.log('Fetching monitoring with params:', params);
            const data = await getMonitoring(params);
            return data;
        },
        onSuccess: (data) => {
            setMonitoring(data);
            console.log('Monitoring loaded:', data?.count, 'records');
        },
        onError: (error: Error) => {
            console.error("Get monitoring error:", error.message);
        },
    });
};

// ========== ХУК ДЛЯ ЭКСПОРТА МОНИТОРИНГА В EXCEL ==========
export const useGetMonitoringExcel = () => {
    return useMutation({
        mutationFn: async (params?: {
            start_date?: string;
            end_date?: string;
            country_id?: string | number;
            department?: string;
            user_id?: number;
            project_id?: number;
            ordering?: string;
        }) => {
            console.log('Exporting monitoring Excel with params:', params);
            const data = await getMonitoringExcel(params);
            return data;
        },
        onSuccess: (data, params) => {
            // Создаем ссылку для скачивания файла
            if (data instanceof Blob) {
                const url = window.URL.createObjectURL(data);
                const link = document.createElement('a');
                link.href = url;

                // Формируем имя файла
                let filename = 'monitoring.xlsx';
                if (params?.start_date && params?.end_date) {
                    filename = `monitoring_${params.start_date}_to_${params.end_date}.xlsx`;
                } else if (params?.start_date) {
                    filename = `monitoring_from_${params.start_date}.xlsx`;
                } else if (params?.end_date) {
                    filename = `monitoring_until_${params.end_date}.xlsx`;
                } else {
                    const date = new Date().toISOString().split('T')[0];
                    filename = `monitoring_${date}.xlsx`;
                }

                link.setAttribute('download', filename);
                document.body.appendChild(link);
                link.click();
                link.remove();
                window.URL.revokeObjectURL(url);

                console.log('Monitoring Excel downloaded:', filename);
            }
        },
        onError: (error: Error) => {
            console.error("Get monitoring Excel error:", error.message);
        },
    });
};

// ========== ХУК ДЛЯ ЗАГРУЗКИ ВСЕХ ДАННЫХ (БЕЗ ПАГИНАЦИИ) ==========
export const useGetAllMonitoring = () => {
    return useMutation({
        mutationFn: async (params?: {
            start_date?: string;
            end_date?: string;
            country_id?: string | number;
            department?: string;
            user_id?: number;
            project_id?: number;
            ordering?: string;
        }) => {
            let allResults: any[] = [];
            let currentPage = 1;
            let hasNext = true;
            const pageSize = 100;

            console.log('Fetching all monitoring...');

            while (hasNext) {
                const response = await getMonitoring({
                    ...params,
                    page: currentPage,
                    page_size: pageSize,
                });

                allResults = [...allResults, ...(response.results || [])];
                hasNext = !!response.next;
                currentPage++;

                console.log(`Loaded page ${currentPage - 1}, total: ${allResults.length}`);
            }

            console.log(`All monitoring loaded: ${allResults.length} records`);
            return {
                results: allResults,
                count: allResults.length,
            };
        },
        onError: (error: Error) => {
            console.error("Get all monitoring error:", error.message);
        },
    });
};

// ========== УТИЛИТЫ ДЛЯ РАБОТЫ С КЭШЕМ ==========
export const monitoringCacheUtils = {
    // Очистка кэша конкретного запроса
    clearMonitoringCache: (queryClient: any, params?: any) => {
        if (params) {
            queryClient.removeQueries({ queryKey: [MONITORING_QUERY_KEY, params] });
        } else {
            queryClient.removeQueries({ queryKey: [MONITORING_QUERY_KEY] });
        }
        console.log('Monitoring cache cleared');
    },

    // Очистка всего кэша мониторинга
    clearAllMonitoringCache: (queryClient: any) => {
        queryClient.removeQueries({ queryKey: [MONITORING_QUERY_KEY] });
        console.log('All monitoring caches cleared');
    },

    // Инвалидация (помечает данные как устаревшие)
    invalidateMonitoring: (queryClient: any, params?: any) => {
        if (params) {
            queryClient.invalidateQueries({ queryKey: [MONITORING_QUERY_KEY, params] });
        } else {
            queryClient.invalidateQueries({ queryKey: [MONITORING_QUERY_KEY] });
        }
        console.log('Monitoring invalidated');
    },

    // Получение кэшированных данных
    getCachedMonitoring: (queryClient: any, params?: any) => {
        if (params) {
            return queryClient.getQueryData([MONITORING_QUERY_KEY, params]);
        }
        return queryClient.getQueryData([MONITORING_QUERY_KEY]);
    },

    // Установка данных в кэш
    setCachedMonitoring: (queryClient: any, data: any, params?: any) => {
        if (params) {
            queryClient.setQueryData([MONITORING_QUERY_KEY, params], data);
        } else {
            queryClient.setQueryData([MONITORING_QUERY_KEY], data);
        }
        console.log('Monitoring cached');
    },
};