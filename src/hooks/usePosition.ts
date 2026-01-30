import { useMutation } from '@tanstack/react-query';
import { getCountries } from '../services/countries';
import { useUserStore } from '../store/UsersStore';
import { getPositions } from '../services/position';

export const useGetPositions = () => {
    const setPositions = useUserStore((state) => state.setPositions)
    return useMutation({
        mutationFn: () => getPositions(),
        onSuccess: (data) => {
            setPositions(data)
            console.log(data);
        },
        onError: (error) => {
            console.error("Send supports error:", error);
        },
    });
};