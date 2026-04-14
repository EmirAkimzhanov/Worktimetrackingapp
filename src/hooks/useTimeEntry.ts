import { useMutation } from '@tanstack/react-query';
import { deleteCalendar, deleteTimeEntry, editCalendar, editTimeEntry, getCalendar, getHolidayCalendar, getTimeEntry, sendCalendar, sendLetter, sendReminder, sendTimeEntry } from "../services/timeEntry";
import { EditDate, LetterBody, ReminderBody, TimeBody } from '../types/timeEntrys';
import { useUserStore } from '../store/UsersStore';
import { CalendarEvent } from '../types/calendar';

export const useSendTimeEntrys = () => {
    return useMutation({
        mutationFn: (body: TimeBody) => sendTimeEntry(body),
        onSuccess: (data) => {
            console.log(data);
        },
        onError: (error) => {
            console.error("Send supports error:", error);
        },
    });
};

export const useGetTimeEntrys = () => {
    const setTimeEntries = useUserStore((state) => state.setTimeEntries)
    return useMutation({
        mutationFn: () => getTimeEntry(),
        onSuccess: (data) => {
            setTimeEntries(data);
            console.log(data);
        },
        onError: (error) => {
            console.error("Send supports error:", error);
        },
    });
};

export const useEditTimeEntry = () => {
    return useMutation({
        mutationFn: ({ day_id, body }: { day_id: string, body: EditDate }) => editTimeEntry(day_id, body),
        onSuccess: (data) => {
            console.log(data);
        },
        onError: (error) => {
            console.error("Send supports error:", error);
        },
    });
};

export const useDeleteTimeEntry = () => {
    return useMutation({
        mutationFn: (day_id: string) => deleteTimeEntry(day_id),
        onSuccess: (data) => {
            console.log(data);
        },
        onError: (error) => {
            console.error("Send supports error:", error);
        },
    });
};

export const useGetCalendar = () => {
    const setCalendar = useUserStore((state) => state.setCalendar)
    return useMutation({
        mutationFn: () => getCalendar(),
        onSuccess: (data) => {
            setCalendar(data);
        },
        onError: (error) => {
            console.error("Send supports error:", error);
        },
    });
};

export const useSendCalendar = () => {
    return useMutation({
        mutationFn: (body: CalendarEvent) => sendCalendar(body),

        onError: (error) => {
            console.error("Send supports error:", error);
        },
    });
};

export const useEditCalendar = () => {
    return useMutation({
        mutationFn: ({ body, day_id }: { body: CalendarEvent, day_id: string }) => editCalendar(body, day_id),

        onError: (error) => {
            console.error("Send supports error:", error);
        },
    });
};

export const useDeleteCalendar = () => {
    return useMutation({
        mutationFn: (day_id: string) => deleteCalendar(day_id),

        onError: (error) => {
            console.error("Send supports error:", error);
        },
    });
};


export const useGetHolidayTimeEntrys = () => {
    const setCalendarHolidays = useUserStore((state) => state.setCalendarHolidays)
    return useMutation({
        mutationFn: () => getHolidayCalendar(),
        onSuccess: (data) => {
            setCalendarHolidays(data);
        },
        onError: (error) => {
            console.error("Send supports error:", error);
        },
    });
};

export const useSendReminder = () => {
    return useMutation({
        mutationFn: (body: ReminderBody) => sendReminder(body),
        onSuccess: (data) => {
        },
        onError: (error) => {
            console.error("Send supports error:", error);
        },
    });
};

export const useSendLetter = () => {
    return useMutation({
        mutationFn: (letterBody: LetterBody) => sendLetter(letterBody),
        onSuccess: (data) => {
        },
        onError: (error) => {
            console.error("Send supports error:", error);
        },
    });
};