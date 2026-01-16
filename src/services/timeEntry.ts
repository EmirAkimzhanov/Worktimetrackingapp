import axios from 'axios'
import { api } from '../consts/api';
import { useUserStore } from '../store/UsersStore';
import { TimeBody } from '../types/timeEntrys';
import { TimeEntry } from '../components/TimeTrackerContext';


export const sendTimeEntry = async (body: TimeBody) => {
    const token = useUserStore.getState().access_token;
    console.log(token);

    if (!token) {
        throw new Error("No access token available");
    }

    const res = await axios.post(`${api}api/calendars/time-entries/`, body,

        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );
    return res.data;
}

export const getTimeEntry = async () => {
    const token = useUserStore.getState().access_token;
    console.log(token);

    if (!token) {
        throw new Error("No access token available");
    }

    const res = await axios(`${api}api/calendars/time-entries/`,

        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );
    return res.data;
}
