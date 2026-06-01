import axios from 'axios'
import { api } from '../consts/api';
import { useUserStore } from '../store/UsersStore';
import { EditDate, LetterBody, ReminderBody, TimeBody } from '../types/timeEntrys';
import { TimeEntry } from '../components/TimeTrackerContext';
import { CalendarEvent } from '../types/calendar';


export const sendTimeEntry = async (body: TimeBody, isSingleDate?: boolean, file?: File) => {
    const token = useUserStore.getState().access_token;
    console.log(token);

    if (!token) {
        throw new Error("No access token available");
    }

    // Формируем URL с параметром, если isSingleDate === true
    let url = `${api}api/calendars/time-entries/`;
    if (isSingleDate) {
        url += `?single_date=true`;
    }

    let headers: Record<string, string> = {
        Authorization: `Bearer ${token}`,
    };

    let requestData: any = body;

    // Если есть файл, используем FormData
    if (file) {
        const formData = new FormData();

        // Добавляем файл
        formData.append('leave_document', file);

        // Добавляем все поля из body в FormData
        Object.keys(body).forEach(key => {
            const value = body[key as keyof TimeBody];
            if (value !== undefined && value !== null) {
                // Для объектов и массивов нужно преобразовать в JSON строку
                if (typeof value === 'object') {
                    formData.append(key, JSON.stringify(value));
                } else {
                    formData.append(key, String(value));
                }
            }
        });

        requestData = formData;
        headers['Content-Type'] = 'multipart/form-data';
    }

    const res = await axios.post(url, requestData, {
        headers,
    });

    return res.data;
}

export const getTimeEntry = async (start_date?: string, end_date?: string) => {
    const token = useUserStore.getState().access_token;
    console.log(token);

    if (!token) {
        throw new Error("No access token available");
    }

    // Формируем URL с query параметрами
    let url = `${api}api/calendars/time-entries/`;
    const params = new URLSearchParams();

    if (start_date) {
        params.append('start_date', start_date);
    }

    if (end_date) {
        params.append('end_date', end_date);
    }

    const queryString = params.toString();
    if (queryString) {
        url += `?${queryString}`;
    }

    const res = await axios(url, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

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

export const getHolidayCalendar = async () => {
    const token = useUserStore.getState().access_token;
    console.log(token);

    if (!token) {
        throw new Error("No access token available");
    }

    const res = await axios(`${api}api/calendars/calendars/holidays/`,

        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );
    return res.data;
}

export const getWorkingWeekends = async () => {
    const token = useUserStore.getState().access_token;
    console.log(token);

    if (!token) {
        throw new Error("No access token available");
    }

    const res = await axios(`${api}api/calendars/calendars/working-weekends/`,

        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );
    return res.data;
}


export const sendReminder = async (body: ReminderBody) => {
    const token = useUserStore.getState().access_token;
    console.log(token);

    if (!token) {
        throw new Error("No access token available");
    }

    const res = await axios.post(`${api}api/accounts/users/send-reminders/`, body,

        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );
    return res.data;
}

export const sendLetter = async (letterBody: LetterBody) => {
    const token = useUserStore.getState().access_token;

    if (!token) {
        throw new Error("No access token available");
    }

    const res = await axios.post(`${api}api/accounts/users/send-message/`, letterBody,

        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );
    return res.data;
}

export const getTimeEntriesStats = async (year: string | number, month: string | number) => {
    const token = useUserStore.getState().access_token;
    console.log(token);

    if (!token) {
        throw new Error("No access token available");
    }

    const res = await axios(`${api}api/calendars/time-entries/dashboard/?year=${year}&month=${month}`,

        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );
    return res.data;
}