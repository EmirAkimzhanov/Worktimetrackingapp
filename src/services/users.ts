// services/users.ts
import axios from 'axios'
import { api } from '../consts/api';
import { useUserStore } from '../store/UsersStore';
import { UserBody } from '../types/user';

export interface GetUsersParams {
    page?: number;
    page_size?: number;
    first_name?: string;
    last_name?: string;
    email?: string;
    position_name?: string;
    department_name?: string;
    department_role_name?: string;
    grade_name?: string;
    country_code?: string;
    role_name?: string;
    joined_after?: string;
    joined_before?: string;
    status_name?: string;
    ordering?: string;
}

// Интерфейс для параметров экспорта Excel
export interface GetUsersExcelParams {
    first_name?: string;
    last_name?: string;
    email?: string;
    position_name?: string;
    department_name?: string;
    department_role_name?: string;
    grade_name?: string;
    country_code?: string;
    role_name?: string;
    joined_after?: string;
    joined_before?: string;
    status_name?: string;
    ordering?: string;
}

export const getUsers = async (params?: GetUsersParams) => {
    const token = useUserStore.getState().access_token;

    if (!token) {
        throw new Error("No access token available");
    }

    const queryParams = new URLSearchParams();

    // Пагинация
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.page_size) queryParams.append('page_size', params.page_size.toString());

    // Фильтры
    if (params?.first_name) queryParams.append('first_name', params.first_name);
    if (params?.last_name) queryParams.append('last_name', params.last_name);
    if (params?.email) queryParams.append('email', params.email);
    if (params?.position_name) queryParams.append('position_name', params.position_name);
    if (params?.department_name) queryParams.append('department_name', params.department_name);
    if (params?.department_role_name) queryParams.append('department_role_name', params.department_role_name);
    if (params?.grade_name) queryParams.append('grade_name', params.grade_name);
    if (params?.country_code) queryParams.append('country_code', params.country_code);
    if (params?.role_name) queryParams.append('role_name', params.role_name);
    if (params?.joined_after) queryParams.append('joined_after', params.joined_after);
    if (params?.joined_before) queryParams.append('joined_before', params.joined_before);
    if (params?.status_name) queryParams.append('status_name', params.status_name);

    // Сортировка
    if (params?.ordering) queryParams.append('ordering', params.ordering);

    const url = `${api}api/accounts/users/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    console.log('📦 Fetching users with params:', params);
    console.log('🔗 URL:', url);

    const res = await axios(url, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    return res.data;
}

// Функция для скачивания Excel файла с пользователями
export const getUsersExcel = async (params?: GetUsersExcelParams): Promise<Blob> => {
    const token = useUserStore.getState().access_token;

    if (!token) {
        throw new Error("No access token available");
    }

    // Формируем query параметры
    const queryParams = new URLSearchParams();

    // Фильтры (те же, что и в getUsers)
    if (params?.first_name) queryParams.append('first_name', params.first_name);
    if (params?.last_name) queryParams.append('last_name', params.last_name);
    if (params?.email) queryParams.append('email', params.email);
    if (params?.position_name) queryParams.append('position_name', params.position_name);
    if (params?.department_name) queryParams.append('department_name', params.department_name);
    if (params?.department_role_name) queryParams.append('department_role_name', params.department_role_name);
    if (params?.grade_name) queryParams.append('grade_name', params.grade_name);
    if (params?.country_code) queryParams.append('country_code', params.country_code);
    if (params?.role_name) queryParams.append('role_name', params.role_name);
    if (params?.joined_after) queryParams.append('joined_after', params.joined_after);
    if (params?.joined_before) queryParams.append('joined_before', params.joined_before);
    if (params?.status_name) queryParams.append('status_name', params.status_name);
    if (params?.ordering) queryParams.append('ordering', params.ordering);

    try {
        const res = await axios.get(`${api}api/accounts/users/?export=excel`, {
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
        console.error('Error fetching users Excel:', error);
        throw error;
    }
}

export const getUserGrades = async () => {
    const token = useUserStore.getState().access_token;

    if (!token) {
        throw new Error("No access token available");
    }

    const res = await axios(`${api}api/accounts/grades/`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    return res.data;
}

export const sendUsers = async (body: UserBody) => {
    const token = useUserStore.getState().access_token;

    if (!token) {
        throw new Error("No access token available");
    }

    const res = await axios.post(`${api}api/accounts/users/`, body, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    return res.data;
}

export const editUser = async (body: UserBody, user_id: string) => {
    const token = useUserStore.getState().access_token;

    if (!token) {
        throw new Error("No access token available");
    }

    const res = await axios.patch(`${api}api/accounts/users/${user_id}/`, body, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    return res.data;
}

export const deleteUser = async (user_id: string) => {
    const token = useUserStore.getState().access_token;

    if (!token) {
        throw new Error("No access token available");
    }

    const res = await axios.delete(`${api}api/accounts/users/${user_id}/`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    return res.data;
}