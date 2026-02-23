import axios from 'axios'
import { api } from '../consts/api';
import { useUserStore } from '../store/UsersStore';


export const getLeaves = async () => {
    const token = useUserStore.getState().access_token;

    if (!token) {
        throw new Error("No access token available");
    }

    const res = await axios(`${api}api/projects/tasks/leave/`,

        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );
    return res.data;
}