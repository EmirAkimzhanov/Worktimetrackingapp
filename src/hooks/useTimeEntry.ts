import { useMutation } from '@tanstack/react-query';
import { getTimeEntry, sendTimeEntry } from "../services/timeEntry";
import { TimeBody } from '../types/timeEntrys';
import { useUserStore } from '../store/UsersStore';

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