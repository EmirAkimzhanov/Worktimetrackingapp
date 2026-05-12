// api/projects.ts
import axios from 'axios'
import { api } from '../consts/api';
import { useUserStore } from '../store/UsersStore';
import { ProjectBody } from '../types/project';

export const getProjectTasks = async (project_id: string) => {
    const token = useUserStore.getState().access_token;

    if (!token) {
        throw new Error("No access token available");
    }

    const res = await axios(`${api}api/projects/projects/${project_id}`,
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );
    return res.data;
}

export const sendProject = async (project_data: ProjectBody) => {
    const token = useUserStore.getState().access_token;

    if (!token) {
        throw new Error("No access token available");
    }

    const res = await axios.post(`${api}api/projects/projects/`, project_data,
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );
    return res.data;
}

export const deleteProject = async (project_id: string) => {
    const token = useUserStore.getState().access_token;

    if (!token) {
        throw new Error("No access token available");
    }

    const res = await axios.delete(`${api}api/projects/projects/${project_id}/`,
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );
    return res.data;
}

export const editProject = async (project_data: ProjectBody, project_id: string) => {
    const token = useUserStore.getState().access_token;

    if (!token) {
        throw new Error("No access token available");
    }

    const res = await axios.patch(`${api}api/projects/projects/${project_id}/`, project_data,
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );
    return res.data;
}

export const getProjects = async (params?: {
    page?: number;
    page_size?: number;
    code?: string;
    client_name?: string;
    manager_email?: string;
    country_code?: string;
    department_name?: string;
    ordering?: string;
}) => {
    const token = useUserStore.getState().access_token;

    if (!token) {
        throw new Error("No access token available");
    }

    // Формируем query параметры
    const queryParams = new URLSearchParams();

    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.page_size) queryParams.append('page_size', params.page_size.toString());
    if (params?.code) queryParams.append('code', params.code);
    if (params?.client_name) queryParams.append('client_name', params.client_name);
    if (params?.manager_email) queryParams.append('manager_email', params.manager_email);
    if (params?.country_code) queryParams.append('country_code', params.country_code);
    if (params?.department_name) queryParams.append('department_name', params.department_name);
    if (params?.ordering) queryParams.append('ordering', params.ordering);

    const url = `${api}api/projects/projects/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    const res = await axios(url, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    return res.data;
}