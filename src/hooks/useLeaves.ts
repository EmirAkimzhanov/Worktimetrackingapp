import { useMutation } from '@tanstack/react-query';
import { useUserStore } from '../store/UsersStore';
import { getLeaves } from '../services/leave';


export const useGetLeaves = () => {
    const setLeaves = useUserStore((state) => state.setLeaves);

    return useMutation({
        mutationFn: () => getLeaves(),
        onSuccess: (data) => {
            setLeaves(data);
            console.log('Country clients loaded:', data);
        },
        onError: (error: Error) => {
            console.error("Get country clients error:", error.message);
        },
    });
};

