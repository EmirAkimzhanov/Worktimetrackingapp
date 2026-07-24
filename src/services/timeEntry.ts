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




export const getTimeEntriesAttendance = async (params: {
    page?: number;
    pageSize?: number;
    start_date?: string;
    end_date?: string;
    date?: string;
    user_department?: string;
    user_country_code?: string;
    position?: string;
    detailed_grade?: string;
    task_type?: string;
    status?: string;
    user_email?: string;
    user_name?: string;
    description?: string;
    country_id: string | number;
}) => {
    const token = useUserStore.getState().access_token;

    if (!token) {
        throw new Error("No access token available");
    }

    const { page = 1, pageSize = 20, ...rest } = params;

    const urlParams = new URLSearchParams();
    urlParams.append('page', String(page));
    urlParams.append('page_size', String(pageSize));

    Object.entries(rest).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            urlParams.append(key, String(value));
        }
    });

    const res = await axios(
        `${api}api/calendars/time-entries/attendance/?${urlParams.toString()}`,
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    return res.data;
};

export const exportAttendanceExcel = async (params: {
    start_date: string;
    end_date: string;
    country_id?: string;
}): Promise<Blob> => {
    const token = useUserStore.getState().access_token;

    if (!token) throw new Error('No access token available');

    const { start_date, end_date, ...rest } = params;
    const urlParams = new URLSearchParams();
    urlParams.append('export', 'excel');
    urlParams.append('start_date', start_date);
    urlParams.append('end_date', end_date);

    Object.entries(rest).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            urlParams.append(key, String(value));
        }
    });

    const res = await axios.get(
        `${api}api/calendars/time-entries/attendance/?${urlParams.toString()}`,
        {
            headers: { Authorization: `Bearer ${token}` },
            responseType: 'blob',
        }
    );

    return res.data;
};

// В services/timeEntry.ts
export const getLeaves = async (params?: {
    page?: number;
    page_size?: number;
    start_date?: string;
    end_date?: string;
    date?: string;
    user_email?: string;
    user_country_code?: string;
    user_department?: string;
    position?: string;
    detailed_grade?: string;
    description?: string;
    task_name?: string;
    country_code?: string;
    leave_type?: string;
    status?: string;
}) => {
    const token = useUserStore.getState().access_token;

    if (!token) {
        throw new Error("No access token available");
    }

    const queryParams = new URLSearchParams();

    // Пагинация
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.page_size) queryParams.append('page_size', params.page_size.toString());

    // Фильтры по датам
    if (params?.start_date) queryParams.append('start_date', params.start_date);
    if (params?.end_date) queryParams.append('end_date', params.end_date);
    if (params?.date) queryParams.append('date', params.date);

    // Фильтры по пользователю
    if (params?.user_email) queryParams.append('user_email', params.user_email);
    if (params?.user_country_code) queryParams.append('user_country_code', params.user_country_code);
    if (params?.user_department) queryParams.append('user_department', params.user_department);

    // Фильтры по должности и грейду
    if (params?.position) queryParams.append('position', params.position);
    if (params?.detailed_grade) queryParams.append('detailed_grade', params.detailed_grade);

    // Фильтры по описанию и задаче
    if (params?.description) queryParams.append('description', params.description);
    if (params?.task_name) queryParams.append('task_name', params.task_name);

    // Дополнительные фильтры
    if (params?.country_code) queryParams.append('country_code', params.country_code);
    if (params?.leave_type) queryParams.append('leave_type', params.leave_type);
    if (params?.status) queryParams.append('status', params.status);

    const url = `${api}/api/calendars/time-entries/leaves/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    const res = await axios(url, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    return res.data;
};