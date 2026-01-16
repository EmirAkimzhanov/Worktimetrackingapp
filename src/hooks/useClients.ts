import { useMutation } from '@tanstack/react-query';
import { useUserStore } from '../store/UsersStore';
import { getClientProjects, getCountryClients } from '../services/clients';

export const useGetCountryClients = () => {
    const setCountries = useUserStore((state) => state.setCountries);

    return useMutation({
        mutationFn: (countryId: string) => getCountryClients(countryId),
        onSuccess: (data) => {
            useUserStore.getState().setSelectedCountry(data);
            setCountries(data);
            console.log('Country clients loaded:', data);
        },
        onError: (error: Error) => {
            console.error("Get country clients error:", error.message);
        },
    });
};

export const useGetCLientProjecs = () => {
    const setClientProjects = useUserStore((state) => state.setClientProjects);

    return useMutation({
        mutationFn: (clientId: string) => getClientProjects(clientId),
        onSuccess: (data) => {
            setClientProjects(data);
            console.log('Country clients loaded:', data);
        },
        onError: (error: Error) => {
            console.error("Get country clients error:", error.message);
        },
    });
};

