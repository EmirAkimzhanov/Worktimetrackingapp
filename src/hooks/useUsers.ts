import { useMutation } from '@tanstack/react-query';
import { useUserStore } from '../store/UsersStore';
import { deleteUser, editUser, getUserGrades, getUsers, sendUsers } from '../services/users';
import { UserBody } from '../types/user';


export const useGetUsers = () => {
    const setUsers = useUserStore((state) => state.setUsers);

    return useMutation({
        mutationFn: () => getUsers(),
        onSuccess: (data) => {
            setUsers(data);
            console.log('Country clients loaded:', data);
        },
        onError: (error: Error) => {
            console.error("Get country clients error:", error.message);
        },
    });
};

export const useGetUserGrades = () => {
    const setUserGrades = useUserStore((state) => state.setUserGrades);

    return useMutation({
        mutationFn: () => getUserGrades(),
        onSuccess: (data) => {
            setUserGrades(data);
            console.log('Country clients loaded:', data);
        },
        onError: (error: Error) => {
            console.error("Get country clients error:", error.message);
        },
    });
};


export const useSendUsers = () => {

    return useMutation({
        mutationFn: (body: UserBody) => sendUsers(body),
        onSuccess: (data) => {
            console.log('Country clients loaded:', data);
        },
        onError: (error: Error) => {
            console.error("Get country clients error:", error.message);
        },
    });
};

export const useEditUsers = () => {

    return useMutation({
        mutationFn: ({ body, user_id }: { body: UserBody, user_id: string }) => editUser(body, user_id),
        onSuccess: (data) => {
            console.log('Country clients loaded:', data);
        },
        onError: (error: Error) => {
            console.error("Get country clients error:", error.message);
        },
    });
};

export const useDeleteUsers = () => {

    return useMutation({
        mutationFn: (user_id: string) => deleteUser(user_id),
        onSuccess: (data) => {
            console.log('Country clients loaded:', data);
        },
        onError: (error: Error) => {
            console.error("Get country clients error:", error.message);
        },
    });
};
