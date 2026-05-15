import { useMutation, useQuery, UseQueryOptions } from '@tanstack/react-query';
import { useUserStore } from '../store/UsersStore';
import { getReports, getReportsExcel, GetReportsParams, ReportsResponse, ReportItem } from '../services/reprot';
import { useEffect } from 'react';

// ========== КЛЮЧИ ДЛЯ REACT QUERY ==========
const REPORTS_QUERY_KEY = 'reports';
const REPORTS_EXCEL_QUERY_KEY = 'reports-excel';

// ========== ХУК ДЛЯ ПОЛУЧЕНИЯ ОТЧЕТОВ С ПАГИНАЦИЕЙ ==========
export const useGetReports = (params?: GetReportsParams, options?: UseQueryOptions<ReportsResponse>) => {
    const setReports = useUserStore((state) => state.setReports);
    const storeReports = useUserStore((state) => state.reports);

    // Очищаем параметры от undefined и пустых значений
    const cleanParams = params ? Object.fromEntries(
        Object.entries(params).filter(([_, value]) => value !== undefined && value !== null && value !== '')
    ) : undefined;

    const query = useQuery<ReportsResponse>({
        queryKey: [REPORTS_QUERY_KEY, cleanParams],
        queryFn: async () => {
            console.log('Fetching reports with params:', cleanParams);
            const data = await getReports(cleanParams as GetReportsParams);
            return data;
        },
        staleTime: 5 * 60 * 1000, // 5 минут данные считаются свежими
        gcTime: 10 * 60 * 1000, // 10 минут кэш хранится в памяти
        refetchOnWindowFocus: false,
        refetchOnMount: true,
        ...options,
    });

    // Сохраняем данные в store при их получении
    useEffect(() => {
        if (query.data) {
            // Трансформируем данные в нужный формат для store
            const reportsData = {
                timeReports: query.data.results || [],
                projectReports: [],
                userReports: [],
                financialReports: [],
                totalCount: query.data.count,
                currentPage: cleanParams?.page || 1,
                pageSize: cleanParams?.page_size || 30,
            };
            setReports(reportsData as any);
            console.log('Reports loaded:', query.data?.count, 'records');
        }
    }, [query.data, setReports, cleanParams?.page, cleanParams?.page_size]);

    return query;
};

// ========== ХУК ДЛЯ ЭКСПОРТА ОТЧЕТОВ В EXCEL ==========
export const useGetReportsExcel = () => {
    return useMutation({
        mutationFn: async (params?: GetReportsParams) => {
            console.log('Exporting reports Excel with params:', params);

            // Очищаем параметры от undefined и пустых значений
            const cleanParams = params ? Object.fromEntries(
                Object.entries(params).filter(([_, value]) => value !== undefined && value !== null && value !== '')
            ) : undefined;

            const data = await getReportsExcel(cleanParams as GetReportsParams);
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

                // Добавляем информацию о фильтрах в имя файла (опционально)
                if (params?.department) {
                    filename = filename.replace('.xlsx', `_dept_${params.department}.xlsx`);
                }
                if (params?.code) {
                    filename = filename.replace('.xlsx', `_code_${params.code}.xlsx`);
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
        mutationFn: async (params?: Omit<GetReportsParams, 'page' | 'page_size'>) => {
            let allResults: ReportItem[] = [];
            let currentPage = 1;
            let hasNext = true;
            const pageSize = 100;

            console.log('Fetching all reports with params:', params);

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

            // Трансформируем данные в нужный формат
            const reportsData = {
                timeReports: allResults,
                projectReports: [],
                userReports: [],
                financialReports: [],
                totalCount: allResults.length,
                currentPage: 1,
                pageSize: allResults.length,
            };

            return reportsData;
        },
        onError: (error: Error) => {
            console.error("Get all reports error:", error.message);
        },
    });
};

// ========== ХУК ДЛЯ ПОЛУЧЕНИЯ ТОЛЬКО RESULTS (БЕЗ ТРАНСФОРМАЦИИ) ==========
export const useGetReportsResults = (params?: GetReportsParams, options?: UseQueryOptions<ReportsResponse>) => {
    const query = useQuery<ReportsResponse>({
        queryKey: [REPORTS_QUERY_KEY, 'results', params],
        queryFn: async () => {
            console.log('Fetching reports results with params:', params);
            const data = await getReports(params);
            return data;
        },
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        refetchOnWindowFocus: false,
        refetchOnMount: true,
        ...options,
    });

    return query;
};

// ========== УТИЛИТЫ ДЛЯ РАБОТЫ С КЭШЕМ ==========
export const reportsCacheUtils = {
    // Очистка кэша конкретного запроса
    clearReportsCache: (queryClient: any, params?: GetReportsParams) => {
        if (params) {
            const cleanParams = Object.fromEntries(
                Object.entries(params).filter(([_, value]) => value !== undefined && value !== null && value !== '')
            );
            queryClient.removeQueries({ queryKey: [REPORTS_QUERY_KEY, cleanParams] });
            queryClient.removeQueries({ queryKey: [REPORTS_QUERY_KEY, 'results', cleanParams] });
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
    invalidateReports: (queryClient: any, params?: GetReportsParams) => {
        if (params) {
            const cleanParams = Object.fromEntries(
                Object.entries(params).filter(([_, value]) => value !== undefined && value !== null && value !== '')
            );
            queryClient.invalidateQueries({ queryKey: [REPORTS_QUERY_KEY, cleanParams] });
            queryClient.invalidateQueries({ queryKey: [REPORTS_QUERY_KEY, 'results', cleanParams] });
        } else {
            queryClient.invalidateQueries({ queryKey: [REPORTS_QUERY_KEY] });
        }
        console.log('Reports invalidated');
    },

    // Получение кэшированных данных
    getCachedReports: (queryClient: any, params?: GetReportsParams) => {
        if (params) {
            const cleanParams = Object.fromEntries(
                Object.entries(params).filter(([_, value]) => value !== undefined && value !== null && value !== '')
            );
            return queryClient.getQueryData([REPORTS_QUERY_KEY, cleanParams]);
        }
        return queryClient.getQueryData([REPORTS_QUERY_KEY]);
    },

    // Установка данных в кэш
    setCachedReports: (queryClient: any, data: any, params?: GetReportsParams) => {
        if (params) {
            const cleanParams = Object.fromEntries(
                Object.entries(params).filter(([_, value]) => value !== undefined && value !== null && value !== '')
            );
            queryClient.setQueryData([REPORTS_QUERY_KEY, cleanParams], data);
        } else {
            queryClient.setQueryData([REPORTS_QUERY_KEY], data);
        }
        console.log('Reports cached');
    },
};
