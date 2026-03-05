import { useMutation } from '@tanstack/react-query';
import { useUserStore } from '../store/UsersStore';
import { getMonitoring } from '../services/monitoring';

export const useGetMonitoring = () => {
    const setMonitoring = useUserStore((state) => state.setMonitoring);

    return useMutation({
        mutationFn: ({ start_date, end_date, country }: {
            start_date: string;
            end_date: string;
            country: string;
        }) => getMonitoring(start_date, end_date, country),
        onSuccess: (data) => {
            setMonitoring(data);
            console.log('Monitoring data loaded:', data);
        },
        onError: (error: Error) => {
            console.error("Get monitoring error:", error.message);
        },
    });
};