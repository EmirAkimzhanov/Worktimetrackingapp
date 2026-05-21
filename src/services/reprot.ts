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

    // Фильтры (точное совпадение) - ОБНОВЛЕНО
    user_department?: string;      // Отдел пользователя (вместо department)
    project_department?: string;   // Отдел проекта (новый параметр)
    code?: string;                 // code
    detailed_grade?: string;       // detailed_grade
    country_code?: string;         // Код страны
    position?: string;             // Позиция/должность

    // Поиск (частичное совпадение) - ДОБАВЛЕНЫ НОВЫЕ ПОЛЯ
    search?: string;               // Общий поиск по всем текстовым полям
    user_email?: string;           // Поиск по email пользователя
    client_name?: string;          // Поиск по имени клиента
    project_service_line?: string; // Поиск по сервисной линии
    description?: string;          // Поиск по описанию
    task_name?: string;            // Поиск по названию задачи

    // Сортировка
    ordering?: string;             // Например: "-date", "user_email"

    // Другие возможные фильтры
    project_id?: number;
    user_id?: number;
    country_id?: number;
}

// Интерфейс для элемента отчёта
export interface ReportItem {
    id?: number;
    date: string;                    // "2024-01-15"
    hours?: number;                  // Отработанные часы
    user_email: string;
    country_code: string;
    user_department: string;         // Отдел пользователя
    detailed_grade: string;          // Грейд
    project_department: string;      // Отдел проекта
    client_name: string;
    code: string;                    // Код проекта
    project_service_line: string;
    task_name: string;
    description: string;
    position?: string;               // Позиция
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

        // Генерируем имя файла с учетом фильтров
        let defaultFilename = `report_${new Date().toISOString().split('T')[0]}.xlsx`;

        // Добавляем информацию о фильтрах в имя файла
        if (params?.user_department) {
            defaultFilename = defaultFilename.replace('.xlsx', `_user_dept_${params.user_department}.xlsx`);
        }
        if (params?.project_department) {
            defaultFilename = defaultFilename.replace('.xlsx', `_project_dept_${params.project_department}.xlsx`);
        }
        if (params?.start_date && params?.end_date) {
            defaultFilename = `report_${params.start_date}_to_${params.end_date}${defaultFilename.includes('_user_dept') ? '' : '.xlsx'}`;
            if (defaultFilename.includes('_user_dept')) {
                defaultFilename = defaultFilename.replace('report_', `report_${params.start_date}_to_${params.end_date}_`);
            }
        } else if (params?.start_date) {
            defaultFilename = `report_from_${params.start_date}${defaultFilename.includes('_user_dept') ? '' : '.xlsx'}`;
        } else if (params?.end_date) {
            defaultFilename = `report_until_${params.end_date}${defaultFilename.includes('_user_dept') ? '' : '.xlsx'}`;
        }

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

// НОВАЯ: Вспомогательная функция для фильтрации по отделам
export const getReportsByDepartments = async (
    userDepartment?: string,
    projectDepartment?: string,
    additionalParams?: Omit<GetReportsParams, 'user_department' | 'project_department'>
): Promise<ReportsResponse> => {
    const params: GetReportsParams = { ...additionalParams };

    if (userDepartment) {
        params.user_department = userDepartment;
    }
    if (projectDepartment) {
        params.project_department = projectDepartment;
    }

    return getReports(params);
}

// НОВАЯ: Вспомогательная функция для экспорта по отделам
export const downloadExcelByDepartments = async (
    userDepartment?: string,
    projectDepartment?: string,
    additionalParams?: Omit<GetReportsParams, 'user_department' | 'project_department'>,
    filename?: string
) => {
    const params: GetReportsParams = { ...additionalParams };

    if (userDepartment) {
        params.user_department = userDepartment;
    }
    if (projectDepartment) {
        params.project_department = projectDepartment;
    }

    return downloadExcelReport(params, filename);
}

// НОВАЯ: Вспомогательная функция для получения уникальных значений полей
export const getUniqueFieldValues = async (
    field: 'user_department' | 'project_department' | 'country_code' | 'detailed_grade' | 'client_name'
): Promise<string[]> => {
    try {
        // Получаем все записи без пагинации (максимум 10000)
        const response = await getReports({
            page_size: 10000,
            page: 1
        });

        // Извлекаем уникальные значения
        const uniqueValues = new Set<string>();
        response.results.forEach(item => {
            const value = item[field];
            if (value && typeof value === 'string') {
                uniqueValues.add(value);
            }
        });

        return Array.from(uniqueValues).sort();
    } catch (error) {
        console.error(`Error fetching unique ${field} values:`, error);
        return [];
    }
}