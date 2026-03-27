import { useMutation } from '@tanstack/react-query';
import { addCountry, deleteCountry, editCountry, getCountries } from '../services/countries';
import { useUserStore } from '../store/UsersStore';
import { Country } from '../types/countries';

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

export const useAddCountry = () => {
    return useMutation({
        mutationFn: (country: Country) => addCountry(country),
        onSuccess: (data) => {
            console.log(data);
        },
        onError: (error) => {
            console.error("Send supports error:", error);
        },
    });
};

export const useDeleteCountry = () => {
    return useMutation({
        mutationFn: (id: string) => deleteCountry(id),
        onSuccess: (data) => {
            console.log(data);
        },
        onError: (error) => {
            console.error("Send supports error:", error);
        },
    });
};

export const useEditCountry = () => {
    return useMutation({
        mutationFn: ({ id, country }: { id: string, country: Country }) => editCountry(id, country),
        onSuccess: (data) => {
            console.log(data);
        },
        onError: (error) => {
            console.error("Send supports error:", error);
        },
    });
};