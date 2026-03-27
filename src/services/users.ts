import axios from 'axios'
import { api } from '../consts/api';
import { useUserStore } from '../store/UsersStore';
import { UserBody } from '../types/user';


export const getUsers = async () => {
    const token = useUserStore.getState().access_token;

    if (!token) {
        throw new Error("No access token available");
    }

    const res = await axios(`${api}api/accounts/users/`,

        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );
    return res.data;
}

export const getUserGrades = async () => {
    const token = useUserStore.getState().access_token;

    if (!token) {
        throw new Error("No access token available");
    }

    const res = await axios(`${api}api/accounts/grades/`,

        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );
    return res.data;
}

export const sendUsers = async (body: UserBody) => {
    const token = useUserStore.getState().access_token;

    if (!token) {
        throw new Error("No access token available");
    }

    const res = await axios.post(`${api}api/accounts/users/`, body,

        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );
    return res.data;
}

export const editUser = async (body: UserBody, user_id: string) => {
    const token = useUserStore.getState().access_token;

    if (!token) {
        throw new Error("No access token available");
    }

    const res = await axios.patch(`${api}api/accounts/users/${user_id}/`, body,

        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );
    return res.data;
}

export const deleteUser = async (user_id: string) => {
    const token = useUserStore.getState().access_token;

    if (!token) {
        throw new Error("No access token available");
    }

    const res = await axios.delete(`${api}api/accounts/users/${user_id}/`,

        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );
    return res.data;
}


