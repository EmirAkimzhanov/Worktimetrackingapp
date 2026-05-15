// hooks/useMonitoring.ts
import { useMutation, useQuery } from '@tanstack/react-query';
import { useUserStore } from '../store/UsersStore';
import { getMonitoring, getMonitoringExcel, GetMonitoringParams, MonitoringResponse } from '../services/monitoring';
import { useEffect } from 'react';

// ========== КЛЮЧИ ДЛЯ REACT QUERY ==========
const MONITORING_QUERY_KEY = 'monitoring';
const MONITORING_EXCEL_QUERY_KEY = 'monitoring-excel';

// ========== ХУК ДЛЯ ПОЛУЧЕНИЯ МОНИТОРИНГА С ПАГИНАЦИЕЙ ==========
export const useGetMonitoring = (params?: GetMonitoringParams, options?: { enabled?: boolean }) => {
    const setMonitoring = useUserStore((state) => state.setMonitoring);

    // Очищаем параметры от undefined и пустых значений
    const cleanParams = params ? Object.fromEntries(
        Object.entries(params).filter(([_, value]) => value !== undefined && value !== null && value !== '')
    ) : undefined;

    const query = useQuery<MonitoringResponse>({
        queryKey: [MONITORING_QUERY_KEY, cleanParams],
        queryFn: async () => {
            console.log('Fetching monitoring with params:', cleanParams);
            const data = await getMonitoring(cleanParams as GetMonitoringParams);
            return data;
        },
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        refetchOnWindowFocus: false,
        refetchOnMount: false, // Отключаем автоматическую загрузку при монтировании
        enabled: options?.enabled ?? false, // По умолчанию запрос не выполняется
    });

    // Сохраняем данные в store при их получении
    useEffect(() => {
        if (query.data) {
            // Трансформируем данные в нужный формат для store
            const transformedData = (query.data.results || []).map((item: any) => ({
                id: item.id,
                title: item.user_email || '',
                start_date: item.date || '',
                end_date: item.date || '',
                country: item.country_code || '',
                department: item.department || '',
                user_email: item.user_email || '',
                user_name: item.user_name || '',
                hours_logged: item.hours_logged || 0,
                hours_required: item.hours_required || 0,
                completion_percentage: item.completion_percentage || 0,
                completion_status: item.completion_status || 'missing',
                last_updated: item.last_updated || '',
                project_count: item.project_count || 0,
                task_count: item.task_count || 0,
                ...item
            }));
            setMonitoring(transformedData as any);
            console.log('Monitoring loaded:', query.data?.count, 'records');
        }
    }, [query.data, setMonitoring]);

    return query;
};

// ========== ХУК ДЛЯ ЭКСПОРТА МОНИТОРИНГА В EXCEL ==========
export const useGetMonitoringExcel = () => {
    return useMutation({
        mutationFn: async (params?: Omit<GetMonitoringParams, 'page' | 'page_size'>) => {
            console.log('Exporting monitoring Excel with params:', params);

            const cleanParams = params ? Object.fromEntries(
                Object.entries(params).filter(([_, value]) => value !== undefined && value !== null && value !== '')
            ) : undefined;

            const data = await getMonitoringExcel(cleanParams as Omit<GetMonitoringParams, 'page' | 'page_size'>);
            return data;
        },
        onSuccess: (data, params) => {
            if (data instanceof Blob) {
                const url = window.URL.createObjectURL(data);
                const link = document.createElement('a');
                link.href = url;

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

                if (params?.completion) {
                    filename = filename.replace('.xlsx', `_${params.completion}.xlsx`);
                }
                if (params?.user_email) {
                    filename = filename.replace('.xlsx', `_${params.user_email}.xlsx`);
                }
                if (params?.first_name) {
                    filename = filename.replace('.xlsx', `_${params.first_name}.xlsx`);
                }
                if (params?.last_name) {
                    filename = filename.replace('.xlsx', `_${params.last_name}.xlsx`);
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
    const setMonitoring = useUserStore((state) => state.setMonitoring);

    return useMutation({
        mutationFn: async (params?: Omit<GetMonitoringParams, 'page' | 'page_size'>) => {
            let allResults: any[] = [];
            let currentPage = 1;
            let hasNext = true;
            const pageSize = 100;

            console.log('Fetching all monitoring with params:', params);

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

            const transformedData = allResults.map((item: any) => ({
                id: item.id,
                title: item.user_email || '',
                start_date: item.date || '',
                end_date: item.date || '',
                country: item.country_code || '',
                department: item.department || '',
                user_email: item.user_email || '',
                user_name: item.user_name || '',
                hours_logged: item.hours_logged || 0,
                hours_required: item.hours_required || 0,
                completion_percentage: item.completion_percentage || 0,
                completion_status: item.completion_status || 'missing',
                last_updated: item.last_updated || '',
                project_count: item.project_count || 0,
                task_count: item.task_count || 0,
                ...item
            }));

            return transformedData;
        },
        onSuccess: (data) => {
            setMonitoring(data as any);
            console.log('All monitoring saved to store:', data.length, 'records');
        },
        onError: (error: Error) => {
            console.error("Get all monitoring error:", error.message);
        },
    });
};

// ========== УТИЛИТЫ ДЛЯ РАБОТЫ С КЭШЕМ ==========
export const monitoringCacheUtils = {
    clearMonitoringCache: (queryClient: any, params?: GetMonitoringParams) => {
        if (params) {
            const cleanParams = Object.fromEntries(
                Object.entries(params).filter(([_, value]) => value !== undefined && value !== null && value !== '')
            );
            queryClient.removeQueries({ queryKey: [MONITORING_QUERY_KEY, cleanParams] });
        } else {
            queryClient.removeQueries({ queryKey: [MONITORING_QUERY_KEY] });
        }
        console.log('Monitoring cache cleared');
    },

    clearAllMonitoringCache: (queryClient: any) => {
        queryClient.removeQueries({ queryKey: [MONITORING_QUERY_KEY] });
        console.log('All monitoring caches cleared');
    },

    invalidateMonitoring: (queryClient: any, params?: GetMonitoringParams) => {
        if (params) {
            const cleanParams = Object.fromEntries(
                Object.entries(params).filter(([_, value]) => value !== undefined && value !== null && value !== '')
            );
            queryClient.invalidateQueries({ queryKey: [MONITORING_QUERY_KEY, cleanParams] });
        } else {
            queryClient.invalidateQueries({ queryKey: [MONITORING_QUERY_KEY] });
        }
        console.log('Monitoring invalidated');
    },

    getCachedMonitoring: (queryClient: any, params?: GetMonitoringParams) => {
        if (params) {
            const cleanParams = Object.fromEntries(
                Object.entries(params).filter(([_, value]) => value !== undefined && value !== null && value !== '')
            );
            return queryClient.getQueryData([MONITORING_QUERY_KEY, cleanParams]);
        }
        return queryClient.getQueryData([MONITORING_QUERY_KEY]);
    },

    setCachedMonitoring: (queryClient: any, data: any, params?: GetMonitoringParams) => {
        if (params) {
            const cleanParams = Object.fromEntries(
                Object.entries(params).filter(([_, value]) => value !== undefined && value !== null && value !== '')
            );
            queryClient.setQueryData([MONITORING_QUERY_KEY, cleanParams], data);
        } else {
            queryClient.setQueryData([MONITORING_QUERY_KEY], data);
        }
        console.log('Monitoring cached');
    },
};