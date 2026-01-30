import { useMutation } from '@tanstack/react-query';
import { useUserStore } from '../store/UsersStore';
import { getSectors } from '../services/sector';

export const useGetSectors = () => {
    const setSectors = useUserStore((state) => state.setSectors);
    return useMutation({
        mutationFn: () => getSectors(),
        onSuccess: (data) => {
            setSectors(data);
            console.log('Country clients loaded:', data);
        },
        onError: (error: Error) => {
            console.error("Get country clients error:", error.message);
        },
    });
};