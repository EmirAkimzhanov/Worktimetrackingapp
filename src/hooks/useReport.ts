import { useMutation } from '@tanstack/react-query';
import { useUserStore } from '../store/UsersStore';
import { getReports, getReportsExcel } from '../services/reprot';


export const useGetReports = () => {
    const setReports = useUserStore((state) => state.setReports);

    return useMutation({
        mutationFn: () => getReports(),
        onSuccess: (data) => {
            setReports(data);
            console.log('Country clients loaded:', data);
        },
        onError: (error: Error) => {
            console.error("Get country clients error:", error.message);
        },
    });
};

export const useGetReportsExcel = () => {

    return useMutation({
        mutationFn: () => getReportsExcel(),
        onSuccess: (data) => {
            console.log('Country clients loaded:', data);
        },
        onError: (error: Error) => {
            console.error("Get country clients error:", error.message);
        },
    });
};