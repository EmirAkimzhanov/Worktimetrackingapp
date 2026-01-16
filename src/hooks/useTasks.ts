import { useMutation } from '@tanstack/react-query';
import { useUserStore } from '../store/UsersStore';
import { getProjectTasks } from '../services/project';
import { getInternalTasks } from '../services/task';


export const useGetInterbalTasks = () => {
    const setInternalTasks = useUserStore((state) => state.setInternalTasks);

    return useMutation({
        mutationFn: () => getInternalTasks(),
        onSuccess: (data) => {
            setInternalTasks(data);
            console.log('Country clients loaded:', data);
        },
        onError: (error: Error) => {
            console.error("Get country clients error:", error.message);
        },
    });
};

