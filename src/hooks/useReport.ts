import { useMutation, useQuery } from '@tanstack/react-query';
import { useUserStore } from '../store/UsersStore';
import { getReports, getReportsExcel } from '../services/reprot';
import { useEffect } from 'react';

// ========== КЛЮЧИ ДЛЯ REACT QUERY ==========
const REPORTS_QUERY_KEY = 'reports';
const REPORTS_EXCEL_QUERY_KEY = 'reports-excel';

// ========== ХУК ДЛЯ ПОЛУЧЕНИЯ ОТЧЕТОВ С ПАГИНАЦИЕЙ ==========
export const useGetReports = (params?: {
    page?: number;
    page_size?: number;
    start_date?: string;
    end_date?: string;
    project_id?: number;
    user_id?: number;
    country_id?: number;
    ordering?: string;
}) => {
    const setReports = useUserStore((state) => state.setReports);
    const storeReports = useUserStore((state) => state.reports);

    const query = useQuery({
        queryKey: [REPORTS_QUERY_KEY, params],
        queryFn: async () => {
            console.log('Fetching reports with params:', params);
            const data = await getReports(params);
            return data;
        },
        staleTime: 5 * 60 * 1000, // 5 минут данные считаются свежими
        gcTime: 10 * 60 * 1000, // 10 минут кэш хранится в памяти
        refetchOnWindowFocus: false,
        refetchOnMount: true,
    });

    // Сохраняем данные в store при их получении
    useEffect(() => {
        if (query.data) {
            setReports(query.data);
            console.log('Reports loaded:', query.data?.count, 'records');
        }
    }, [query.data, setReports]);

    return query;
};

// ========== ХУК ДЛЯ ЭКСПОРТА ОТЧЕТОВ В EXCEL ==========
export const useGetReportsExcel = () => {
    return useMutation({
        mutationFn: async (params?: {
            page?: number;
            page_size?: number;
            start_date?: string;
            end_date?: string;
            project_id?: number;
            user_id?: number;
            country_id?: number;
            ordering?: string;
        }) => {
            console.log('Exporting reports Excel with params:', params);
            const data = await getReportsExcel(params);
            return data;
        },
        onSuccess: (data, params) => {
            // Создаем ссылку для скачивания файла
            if (data instanceof Blob) {
                const url = window.URL.createObjectURL(data);
                const link = document.createElement('a');
                link.href = url;

                // Формируем имя файла
                let filename = 'reports.xlsx';
                if (params?.start_date && params?.end_date) {
                    filename = `reports_${params.start_date}_to_${params.end_date}.xlsx`;
                } else if (params?.start_date) {
                    filename = `reports_from_${params.start_date}.xlsx`;
                } else if (params?.end_date) {
                    filename = `reports_until_${params.end_date}.xlsx`;
                } else {
                    const date = new Date().toISOString().split('T')[0];
                    filename = `reports_${date}.xlsx`;
                }

                link.setAttribute('download', filename);
                document.body.appendChild(link);
                link.click();
                link.remove();
                window.URL.revokeObjectURL(url);

                console.log('Reports Excel downloaded:', filename);
            }
        },
        onError: (error: Error) => {
            console.error("Get reports Excel error:", error.message);
        },
    });
};

// ========== ХУК ДЛЯ ЗАГРУЗКИ ВСЕХ ОТЧЕТОВ (БЕЗ ПАГИНАЦИИ) ==========
export const useGetAllReports = () => {
    return useMutation({
        mutationFn: async (params?: {
            start_date?: string;
            end_date?: string;
            project_id?: number;
            user_id?: number;
            country_id?: number;
            ordering?: string;
        }) => {
            let allResults: any[] = [];
            let currentPage = 1;
            let hasNext = true;
            const pageSize = 100;

            console.log('Fetching all reports...');

            while (hasNext) {
                const response = await getReports({
                    ...params,
                    page: currentPage,
                    page_size: pageSize,
                });

                allResults = [...allResults, ...(response.results || [])];
                hasNext = !!response.next;
                currentPage++;

                console.log(`Loaded page ${currentPage - 1}, total: ${allResults.length}`);
            }

            console.log(`All reports loaded: ${allResults.length} records`);
            return {
                results: allResults,
                count: allResults.length,
            };
        },
        onError: (error: Error) => {
            console.error("Get all reports error:", error.message);
        },
    });
};

// ========== УТИЛИТЫ ДЛЯ РАБОТЫ С КЭШЕМ ==========
export const reportsCacheUtils = {
    // Очистка кэша конкретного запроса
    clearReportsCache: (queryClient: any, params?: any) => {
        if (params) {
            queryClient.removeQueries({ queryKey: [REPORTS_QUERY_KEY, params] });
        } else {
            queryClient.removeQueries({ queryKey: [REPORTS_QUERY_KEY] });
        }
        console.log('Reports cache cleared');
    },

    // Очистка всего кэша отчетов
    clearAllReportsCache: (queryClient: any) => {
        queryClient.removeQueries({ queryKey: [REPORTS_QUERY_KEY] });
        console.log('All reports caches cleared');
    },

    // Инвалидация (помечает данные как устаревшие)
    invalidateReports: (queryClient: any, params?: any) => {
        if (params) {
            queryClient.invalidateQueries({ queryKey: [REPORTS_QUERY_KEY, params] });
        } else {
            queryClient.invalidateQueries({ queryKey: [REPORTS_QUERY_KEY] });
        }
        console.log('Reports invalidated');
    },

    // Получение кэшированных данных
    getCachedReports: (queryClient: any, params?: any) => {
        if (params) {
            return queryClient.getQueryData([REPORTS_QUERY_KEY, params]);
        }
        return queryClient.getQueryData([REPORTS_QUERY_KEY]);
    },

    // Установка данных в кэш
    setCachedReports: (queryClient: any, data: any, params?: any) => {
        if (params) {
            queryClient.setQueryData([REPORTS_QUERY_KEY, params], data);
        } else {
            queryClient.setQueryData([REPORTS_QUERY_KEY], data);
        }
        console.log('Reports cached');
    },
};