import axios from 'axios'
import { api } from '../consts/api';
import { useUserStore } from '../store/UsersStore';

interface GetMonitoringParams {
    page?: number;
    page_size?: number;
    start_date?: string;
    end_date?: string;
    country_id?: string | number;
    department?: string;
    user_id?: number;
    project_id?: number;
    ordering?: string;
}

export const getMonitoring = async (params?: GetMonitoringParams) => {
    const token = useUserStore.getState().access_token;

    if (!token) {
        throw new Error("No access token available");
    }

    const defaultParams = {
        page: 1,
        page_size: 30,
        ...params
    };

    const res = await axios(`${api}api/calendars/time-entries/monitoring/`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
        params: defaultParams,
    });

    // Ответ содержит: { count: number, next: string, previous: string, results: [] }
    return res.data;
}

export const getMonitoringExcel = async (params?: Omit<GetMonitoringParams, 'page' | 'page_size'>) => {
    const token = useUserStore.getState().access_token;

    if (!token) {
        throw new Error("No access token available");
    }

    const res = await axios(`${api}api/calendars/time-entries/monitoring/?export=excel`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
        params: params,
        responseType: 'blob'
    });

    return res.data;
}