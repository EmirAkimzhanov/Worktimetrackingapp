import { useMutation } from '@tanstack/react-query';
import { deleteCalendar, editCalendar, getCalendar, getTimeEntry, sendCalendar, sendTimeEntry } from "../services/timeEntry";
import { TimeBody } from '../types/timeEntrys';
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