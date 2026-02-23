import { useMutation } from '@tanstack/react-query';
import { useUserStore } from '../store/UsersStore';
import { getProjectTasks, sendProject } from '../services/project';
import { getStatuses } from '../services/status';

export const useStatus = () => {
    const setStatuses = useUserStore((state) => state.setStatuses);

    return useMutation({
        mutationFn: () => getStatuses(),
        onSuccess: (data) => {
            setStatuses(data);
            console.log('Country clients loaded:', data);
        },
        onError: (error: Error) => {
            console.error("Get country clients error:", error.message);
        },
    });
};