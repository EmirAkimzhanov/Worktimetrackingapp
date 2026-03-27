import axios from 'axios'
import { api } from '../consts/api';
import { useUserStore } from '../store/UsersStore';
import { GlobalSet } from '../types/GlobalSettings';


export const getGlobalSettings = async (country_id: string) => {
    const token = useUserStore.getState().access_token;

    if (!token) {
        throw new Error("No access token available");
    }

    const res = await axios(
        `${api}api/calendars/settings/?country=${country_id}`,

        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        },
    );
    return res.data;
}


export const sendGlobalSettings = async (country_id: string, globSet: GlobalSet) => {
    const token = useUserStore.getState().access_token;

    if (!token) {
        throw new Error("No access token available");
    }

    const res = await axios.patch(
        `${api}api/calendars/settings/?country=${country_id}`, globSet,

        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        },
    );
    return res.data;
}
