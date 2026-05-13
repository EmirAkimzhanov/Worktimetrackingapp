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