import axios from 'axios'
import { api } from '../consts/api';
import { useUserStore } from '../store/UsersStore';

interface GetReportsParams {
    page?: number;
    page_size?: number;
    start_date?: string;
    end_date?: string;
    project_id?: number;
    user_id?: number;
    country_id?: number;
    ordering?: string;
}

export const getReports = async (params?: GetReportsParams) => {
    const token = useUserStore.getState().access_token;

    if (!token) {
        throw new Error("No access token available");
    }

    const defaultParams = {
        page: 1,
        page_size: 30,
        ...params
    };

    const res = await axios(`${api}api/calendars/time-entries/report/`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
        params: defaultParams,
    });

    // Ответ содержит: { count: number, next: string, previous: string, results: [] }
    return res.data;
}

export const getReportsExcel = async (params?: GetReportsParams) => {
    const token = useUserStore.getState().access_token;

    if (!token) {
        throw new Error("No access token available");
    }

    const res = await axios(`${api}api/calendars/time-entries/report/?export=excel`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
        params: params,
        responseType: 'blob'
    });

    return res.data;
}