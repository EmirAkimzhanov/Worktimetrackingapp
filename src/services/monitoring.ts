import axios from 'axios'
import { api } from '../consts/api';
import { useUserStore } from '../store/UsersStore';

export interface GetMonitoringParams {
    page?: number;
    page_size?: number;
    start_date?: string;
    end_date?: string;
    country_id?: string | number;
    department?: string;
    first_name?: string;
    last_name?: string;
    user_id?: number;
    project_id?: number;
    ordering?: string;
    // Новые параметры
    user_email?: string;
    updated_after?: string;  // ISO дата и время
    updated_before?: string; // ISO дата и время
    completion?: 'missing' | 'partial' | 'completed'; // Статус заполнения
}

export interface MonitoringItem {
    id: number;
    user_email: string;
    user_name: string;
    department: string;
    country_code: string;
    date: string;
    hours_logged: number;
    hours_required: number;
    completion_percentage: number;
    completion_status: 'missing' | 'partial' | 'completed';
    last_updated: string;
    project_count: number;
    task_count: number;
    [key: string]: any;
}

export interface MonitoringResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: MonitoringItem[];
}

export const getMonitoring = async (params?: GetMonitoringParams): Promise<MonitoringResponse> => {
    const token = useUserStore.getState().access_token;

    if (!token) {
        throw new Error("No access token available");
    }

    // Очищаем параметры от undefined и пустых значений
    const cleanParams: Record<string, any> = {};
    if (params) {
        Object.keys(params).forEach(key => {
            const value = params[key as keyof GetMonitoringParams];
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
        const res = await axios.get<MonitoringResponse>(`${api}api/calendars/time-entries/monitoring/`, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            params: defaultParams,
        });

        return res.data;
    } catch (error) {
        console.error('Error fetching monitoring:', error);
        throw error;
    }
}

export const getMonitoringExcel = async (params?: Omit<GetMonitoringParams, 'page' | 'page_size'>): Promise<Blob> => {
    const token = useUserStore.getState().access_token;

    if (!token) {
        throw new Error("No access token available");
    }

    // Очищаем параметры от undefined и пустых значений
    const cleanParams: Record<string, any> = {};
    if (params) {
        Object.keys(params).forEach(key => {
            const value = params[key as keyof Omit<GetMonitoringParams, 'page' | 'page_size'>];
            if (value !== undefined && value !== null && value !== '') {
                cleanParams[key] = value;
            }
        });
    }

    try {
        const res = await axios.get(`${api}api/calendars/time-entries/monitoring/`, {
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
        console.error('Error fetching monitoring Excel:', error);
        throw error;
    }
}

// Вспомогательная функция для скачивания Excel файла
export const downloadMonitoringExcel = async (params?: Omit<GetMonitoringParams, 'page' | 'page_size'>, filename?: string) => {
    try {
        const blob = await getMonitoringExcel(params);

        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;

        const defaultFilename = `monitoring_${new Date().toISOString().split('T')[0]}.xlsx`;
        link.download = filename || defaultFilename;

        document.body.appendChild(link);
        link.click();

        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error downloading monitoring Excel:', error);
        throw error;
    }
}

// Типы для completion статусов
export const COMPLETION_STATUS = {
    MISSING: 'missing' as const,
    PARTIAL: 'partial' as const,
    COMPLETED: 'completed' as const,
} as const;

export type CompletionStatus = typeof COMPLETION_STATUS[keyof typeof COMPLETION_STATUS];

// Опции для селекта completion
export const COMPLETION_OPTIONS = [
    { value: 'missing', label: 'Missing', description: 'No time entries logged' },
    { value: 'partial', label: 'Partial', description: 'Some time entries logged but incomplete' },
    { value: 'completed', label: 'Completed', description: 'All required hours logged' },
] as const;