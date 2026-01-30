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



