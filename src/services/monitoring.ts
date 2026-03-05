import axios from 'axios'
import { api } from '../consts/api';
import { useUserStore } from '../store/UsersStore';

export const getMonitoring = async (start_date: string, end_date: string, country: string) => {
    const token = useUserStore.getState().access_token;

    if (!token) {
        throw new Error("No access token available");
    }

    const res = await axios(`${api}api/calendars/time-entries/monitoring/?start_date=${start_date}&end_date=${end_date}&country_id=${country}`,
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );
    return res.data;
}

