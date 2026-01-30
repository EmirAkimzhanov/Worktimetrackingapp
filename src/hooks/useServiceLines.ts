import { useMutation } from '@tanstack/react-query';
import { useUserStore } from '../store/UsersStore';
import { getServiceLines } from '../services/serviceLines';


export const useGetServiceLines = () => {
    const setServiceLines = useUserStore((state) => state.setServiceLines);

    return useMutation({
        mutationFn: () => getServiceLines(),
        onSuccess: (data) => {
            setServiceLines(data);
            console.log('Country clients loaded:', data);
        },
        onError: (error: Error) => {
            console.error("Get country clients error:", error.message);
        },
    });
};
