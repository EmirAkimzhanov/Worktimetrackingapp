import { useMutation } from '@tanstack/react-query';
import { useUserStore } from '../store/UsersStore';
import { createClient, deleteClient, editClient, getClientProjects, getClients, getCountryClients } from '../services/clients';
import { OnlyClient } from '../types/client';

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

export const useGetClients = () => {
    const setCLients = useUserStore((state) => state.setClients);

    return useMutation({
        mutationFn: () => getClients(),
        onSuccess: (data) => {
            useUserStore.getState().setSelectedCountry(data);
            setCLients(data);
            console.log('Country clients loaded:', data);
        },
        onError: (error: Error) => {
            console.error("Get country clients error:", error.message);
        },
    });
};

export const useCreateClients = () => {

    return useMutation({
        mutationFn: (body: OnlyClient) => createClient(body),
        onSuccess: (data) => {
            console.log('Country clients loaded:', data);
        },
        onError: (error: Error) => {
            console.error("Get country clients error:", error.message);
        },
    });
};

export const useEditClients = () => {

    return useMutation({
        mutationFn: ({ body, client_id }: { body: OnlyClient, client_id: string }) => editClient(body, client_id),
        onSuccess: (data) => {
            console.log('Country clients loaded:', data);
        },
        onError: (error: Error) => {
            console.error("Get country clients error:", error.message);
        },
    });
};

export const useDeleteClients = () => {

    return useMutation({
        mutationFn: (client_id: string) => deleteClient(client_id),
        onSuccess: (data) => {
            console.log('Country clients loaded:', data);
        },
        onError: (error: Error) => {
            console.error("Get country clients error:", error.message);
        },
    });
};

