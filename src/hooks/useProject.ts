import { useMutation } from '@tanstack/react-query';
import { useUserStore } from '../store/UsersStore';
import { getProjectTasks } from '../services/project';


export const useGetProjectTasks = () => {
    const setProjectTasks = useUserStore((state) => state.setProjectTasks);

    return useMutation({
        mutationFn: (project_id: string) => getProjectTasks(project_id),
        onSuccess: (data) => {
            setProjectTasks(data);
            console.log('Country clients loaded:', data);
        },
        onError: (error: Error) => {
            console.error("Get country clients error:", error.message);
        },
    });
};

