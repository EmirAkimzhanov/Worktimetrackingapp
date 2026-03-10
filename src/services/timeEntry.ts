import axios from 'axios'
import { api } from '../consts/api';
import { useUserStore } from '../store/UsersStore';
import { EditDate, TimeBody } from '../types/timeEntrys';
import { TimeEntry } from '../components/TimeTrackerContext';
import { CalendarEvent } from '../types/calendar';


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

export const editTimeEntry = async (day_id: string, body: EditDate) => {
    const token = useUserStore.getState().access_token;
    console.log(token);

    if (!token) {
        throw new Error("No access token available");
    }

    const res = await axios.patch(`${api}api/calendars/time-entries/${day_id}/`, body,

        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );
    return res.data;
}


export const deleteTimeEntry = async (day_id: string) => {
    const token = useUserStore.getState().access_token;
    console.log(token);

    if (!token) {
        throw new Error("No access token available");
    }

    const res = await axios.delete(`${api}api/calendars/time-entries/${day_id}/`,

        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );
    return res.data;
}



export const getCalendar = async () => {
    const token = useUserStore.getState().access_token;
    console.log(token);

    if (!token) {
        throw new Error("No access token available");
    }

    const res = await axios(`${api}api/calendars/calendars/`,

        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );
    return res.data;
}

export const sendCalendar = async (body: CalendarEvent) => {
    const token = useUserStore.getState().access_token;
    if (!token) {
        throw new Error("No access token available");
    }

    const res = await axios.post(`${api}api/calendars/calendars/`, body,

        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );
    return res.data;
}

export const editCalendar = async (body: CalendarEvent, day_id: string) => {
    const token = useUserStore.getState().access_token;
    if (!token) {
        throw new Error("No access token available");
    }

    const res = await axios.patch(`${api}api/calendars/calendars/${day_id}/`, body,

        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );
    return res.data;
}

export const deleteCalendar = async (day_id: string) => {
    const token = useUserStore.getState().access_token;
    if (!token) {
        throw new Error("No access token available");
    }

    const res = await axios.delete(`${api}api/calendars/calendars/${day_id}/`,

        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );
    return res.data;
}