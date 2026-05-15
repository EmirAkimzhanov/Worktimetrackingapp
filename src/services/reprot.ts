import axios from 'axios'
import { api } from '../consts/api';
import { useUserStore } from '../store/UsersStore';

// Интерфейс для параметров запроса отчётов
export interface GetReportsParams {
    // Пагинация
    page?: number;
    page_size?: number;

    // Период дат
    start_date?: string;
    end_date?: string;

    // Фильтры (точное совпадение)
    department?: string;        // department
    code?: string;              // code
    detailed_grade?: string;    // detailed_grade

    // Поиск (частичное совпадение)
    search?: string;            // Общий поиск по всем текстовым полям

    // Сортировка
    ordering?: string;          // Например: "-date", "user_email"

    // Другие возможные фильтры
    project_id?: number;
    user_id?: number;
    country_id?: number;
}

// Интерфейс для элемента отчёта
export interface ReportItem {
    id?: number;
    date: string;                    // "2024-01-15"
    user_email: string;
    client_name: string;
    code: string;                    // Код проекта
    user_department: string;
    project_department: string;      // department из фильтров
    country_code: string;
    position: string;
    detailed_grade: string;          // detailed_grade из фильтров
    project_service_line: string;
    description: string;
    task_name: string;
    hours?: number;                  // Отработанные часы
    project_id?: number;
    user_id?: number;
    [key: string]: any;              // Для дополнительных полей
}

// Интерфейс для ответа API
export interface ReportsResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: ReportItem[];
}

// Интерфейс для параметров с периодом дат
export interface DateRangeParams {
    start_date: string;
    end_date: string;
}

export const getReports = async (params?: GetReportsParams): Promise<ReportsResponse> => {
    const token = useUserStore.getState().access_token;

    if (!token) {
        throw new Error("No access token available");
    }

    // Очищаем параметры от undefined значений
    const cleanParams: Record<string, any> = {};
    if (params) {
        Object.keys(params).forEach(key => {
            const value = params[key as keyof GetReportsParams];
            if (value !== undefined && value !== null && value !== '') {
                cleanParams[key] = value;
            }
        });
    }

    const defaultParams = {
        page: 1,
        page_size: 30,
        ...cleanParams
    };

    try {
        const res = await axios.get<ReportsResponse>(`${api}api/calendars/time-entries/report/`, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            params: defaultParams,
        });

        return res.data;
    } catch (error) {
        console.error('Error fetching reports:', error);
        throw error;
    }
}

export const getReportsExcel = async (params?: GetReportsParams): Promise<Blob> => {
    const token = useUserStore.getState().access_token;

    if (!token) {
        throw new Error("No access token available");
    }

    // Очищаем параметры от undefined значений
    const cleanParams: Record<string, any> = {};
    if (params) {
        Object.keys(params).forEach(key => {
            const value = params[key as keyof GetReportsParams];
            if (value !== undefined && value !== null && value !== '') {
                cleanParams[key] = value;
            }
        });
    }

    try {
        const res = await axios.get(`${api}api/calendars/time-entries/report/`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
            params: {
                ...cleanParams,
                export: 'excel'
            },
            responseType: 'blob'
        });

        if (!(res.data instanceof Blob)) {
            throw new Error('Invalid response format');
        }

        return res.data;
    } catch (error) {
        console.error('Error fetching Excel report:', error);
        throw error;
    }
}

// Вспомогательная функция для скачивания Excel файла
export const downloadExcelReport = async (params?: GetReportsParams, filename?: string) => {
    try {
        const blob = await getReportsExcel(params);

        // Создаем URL для Blob
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;

        // Генерируем имя файла с датой
        const defaultFilename = `report_${new Date().toISOString().split('T')[0]}.xlsx`;
        link.download = filename || defaultFilename;

        // Триггерим скачивание
        document.body.appendChild(link);
        link.click();

        // Очищаем
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error downloading Excel report:', error);
        throw error;
    }
}

// Вспомогательная функция для получения отчёта за период
export const getReportsByDateRange = async (
    dateRange: DateRangeParams,
    additionalParams?: Omit<GetReportsParams, 'start_date' | 'end_date'>
): Promise<ReportsResponse> => {
    return getReports({
        start_date: dateRange.start_date,
        end_date: dateRange.end_date,
        ...additionalParams
    });
}

// Вспомогательная функция для скачивания Excel за период
export const downloadExcelByDateRange = async (
    dateRange: DateRangeParams,
    additionalParams?: Omit<GetReportsParams, 'start_date' | 'end_date'>,
    filename?: string
) => {
    return downloadExcelReport({
        start_date: dateRange.start_date,
        end_date: dateRange.end_date,
        ...additionalParams
    }, filename);
}