import { useMutation } from '@tanstack/react-query';
import { getCountries } from '../services/countries';
import { useUserStore } from '../store/UsersStore';

export const useGetCountries = () => {
    const setCountries = useUserStore((state) => state.setCountries)
    return useMutation({
        mutationFn: () => getCountries(),
        onSuccess: (data) => {
            setCountries(data)
            console.log(data);
        },
        onError: (error) => {
            console.error("Send supports error:", error);
        },
    });
};