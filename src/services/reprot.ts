import axios from 'axios'
import { api } from '../consts/api';
import { useUserStore } from '../store/UsersStore';

export const getReports = async () => {
    const token = useUserStore.getState().access_token;

    if (!token) {
        throw new Error("No access token available");
    }

    const res = await axios(`${api}api/calendars/time-entries/report/`,
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );
    return res.data;
}

export const getReportsExcel = async () => {
    const token = useUserStore.getState().access_token;

    if (!token) {
        throw new Error("No access token available");
    }

    const res = await axios(`${api}api/calendars/time-entries/report/?export=excel`,
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
            responseType: 'blob' // Важно! Указываем, что ожидаем бинарные данные
        }
    );

    return res.data; // Это будет Blob
}