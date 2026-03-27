import axios from 'axios'
import { api } from '../consts/api';
import { useUserStore } from '../store/UsersStore';


export const getDepartments = async (department_id?: string) => {
    const token = useUserStore.getState().access_token;

    if (!token) {
        throw new Error("No access token available");
    }

    let url: string;

    if (department_id) {
        url = `${api}api/accounts/departments/${department_id}`;
    } else {
        url = `${api}api/accounts/departments/`;
    }

    const res = await axios(url, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    return res.data;
}


export const getDepartmentRoles = async () => {
    const token = useUserStore.getState().access_token;

    if (!token) {
        throw new Error("No access token available");
    }

    const res = await axios(`${api}api/accounts/department-roles/`,

        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );
    return res.data;
}


export const editDepartmentMemberRole = async (
    userId: number,
    body: { department_role: number }
) => {
    const token = useUserStore.getState().access_token;

    const res = await axios.patch(
        `${api}api/accounts/users/${userId}/`,
        body,
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    return res.data;
};


export const createDepartment = async (
    body: { name: string }
) => {
    const token = useUserStore.getState().access_token;

    const res = await axios.post(
        `${api}api/accounts/departments/`,
        body,
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    return res.data;
};

export const editDepartmentName = async (
    department_id: number,
    body: { name: string }
) => {
    const token = useUserStore.getState().access_token;

    const res = await axios.patch(
        `${api}api/accounts/departments/${department_id}/`,
        body,
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    return res.data;
};

export const deleteDepartment = async (
    department_id: number,
) => {
    const token = useUserStore.getState().access_token;

    const res = await axios.delete(
        `${api}api/accounts/departments/${department_id}/`,
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    return res.data;
};


