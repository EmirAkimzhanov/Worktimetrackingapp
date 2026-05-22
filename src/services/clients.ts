// services/clients.ts
import axios from 'axios'
import { api } from '../consts/api';
import { useUserStore } from '../store/UsersStore';
import { OnlyClient } from '../types/client';

export interface GetClientsParams {
    page?: number;
    page_size?: number;
    name?: string;
    group?: string;
    personal_number?: string;
    sector_name?: string;
    ordering?: string;
    all?: boolean; // Добавляем параметр all
}

// Интерфейс для параметров экспорта Excel
export interface GetClientsExcelParams {
    name?: string;
    group?: string;
    personal_number?: string;
    sector_name?: string;
    ordering?: string;
}

export const getCountryClients = async (country_id: string) => {
    const token = useUserStore.getState().access_token;

    if (!token) {
        throw new Error("No access token available");
    }

    const res = await axios(`${api}api/accounts/countries/${country_id}`,

        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );
    return res.data;
}

export const getClientProjects = async (client_id: string) => {
    const token = useUserStore.getState().access_token;

    if (!token) {
        throw new Error("No access token available");
    }

    const res = await axios(`${api}api/clients/clients/${client_id}`,

        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );
    return res.data;
}

export const getClients = async (params?: GetClientsParams) => {
    const token = useUserStore.getState().access_token;

    if (!token) {
        throw new Error("No access token available");
    }

    // Формируем query параметры
    const queryParams = new URLSearchParams();

    // Пагинация
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.page_size) queryParams.append('page_size', params.page_size.toString());

    // Фильтры
    if (params?.name) queryParams.append('name', params.name);
    if (params?.group) queryParams.append('group', params.group);
    if (params?.personal_number) queryParams.append('personal_number', params.personal_number);
    if (params?.sector_name) queryParams.append('sector_name', params.sector_name);

    // Сортировка
    if (params?.ordering) queryParams.append('ordering', params.ordering);

    // Параметр all - получаем всех клиентов без пагинации
    if (params?.all) queryParams.append('all', 'true');

    const url = `${api}api/clients/clients/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    console.log('📦 Fetching clients with params:', params);
    console.log('🔗 URL:', url);

    const res = await axios(url, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    return res.data;
}

// Функция для получения ВСЕХ клиентов (удобная обертка)
export const getAllClients = async () => {
    return getClients({ all: true });
}

// Функция для скачивания Excel файла с клиентами
export const getClientsExcel = async (params?: GetClientsExcelParams): Promise<Blob> => {
    const token = useUserStore.getState().access_token;

    if (!token) {
        throw new Error("No access token available");
    }

    // Формируем query параметры
    const queryParams = new URLSearchParams();

    // Фильтры (те же, что и в getClients, но без пагинации)
    if (params?.name) queryParams.append('name', params.name);
    if (params?.group) queryParams.append('group', params.group);
    if (params?.personal_number) queryParams.append('personal_number', params.personal_number);
    if (params?.sector_name) queryParams.append('sector_name', params.sector_name);
    if (params?.ordering) queryParams.append('ordering', params.ordering);

    try {
        const res = await axios.get(`${api}api/clients/clients/?export=excel`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
            params: Object.fromEntries(queryParams),
            responseType: 'blob'
        });

        if (!(res.data instanceof Blob)) {
            throw new Error('Invalid response format');
        }

        return res.data;
    } catch (error) {
        console.error('Error fetching clients Excel:', error);
        throw error;
    }
}

export const createClient = async (body: OnlyClient) => {
    const token = useUserStore.getState().access_token;

    if (!token) {
        throw new Error("No access token available");
    }

    const res = await axios.post(`${api}api/clients/clients/`, body,

        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );
    return res.data;
}

export const editClient = async (body: OnlyClient, client_id: string) => {
    const token = useUserStore.getState().access_token;

    if (!token) {
        throw new Error("No access token available");
    }

    const res = await axios.patch(`${api}api/clients/clients/${client_id}/`, body,

        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );
    return res.data;
}

export const deleteClient = async (client_id: string) => {
    const token = useUserStore.getState().access_token;

    if (!token) {
        throw new Error("No access token available");
    }

    const res = await axios.delete(`${api}api/clients/clients/${client_id}/`,

        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );
    return res.data;
}