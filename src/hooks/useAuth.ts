// hooks/useAuth.ts
import { useMutation } from "@tanstack/react-query";
import { activateAccount, login } from "../services/auth";
import { useNavigate } from "react-router-dom";
import { useUserStore } from "../store/UsersStore";
import { Activate } from "../types/auth";

export const useLogin = () => {
    const navigate = useNavigate();

    return useMutation({
        mutationFn: login,
        onSuccess: (data) => {
            console.log('Login success full data:', data);

            if (!data) {
                console.error('Login response is empty');
                throw new Error('Login response is empty');
            }

            const accessToken = data.access || data.access_token;
            const refreshToken = data.refresh || data.refresh_token;

            if (!accessToken || !refreshToken) {
                console.error('Tokens are missing in response:', data);
                throw new Error('Invalid response from server');
            }

            localStorage.setItem('access_token', accessToken);
            localStorage.setItem('refresh_token', refreshToken);

            useUserStore.getState().setAccessToken(accessToken);
            useUserStore.getState().setRefreshToken(refreshToken);
            const userEmail = localStorage.getItem('login_email') || '';
            useUserStore.getState().setUser(
                {
                    id: 1,
                    username: userEmail.split('@')[0],
                    email: userEmail,
                    name: userEmail.split('@')[0],
                    role: 'user'
                },
                {
                    access_token: accessToken,
                    refresh_token: refreshToken
                }
            );

            console.log('Token saved to store:', useUserStore.getState().access_token);

            navigate('/');
        },
        onError: (error) => {
            console.error("Login error:", error);

            let errorMessage = 'Login failed. Please try again.';

            if (error.message.includes('401') || error.message.includes('Invalid credentials')) {
                errorMessage = 'Invalid email or password. Please check your credentials.';
            } else if (error.message.includes('Network Error') || error.message.includes('Failed to fetch')) {
                errorMessage = 'Network error. Please check your internet connection.';
            } else if (error.message.includes('500')) {
                errorMessage = 'Server error. Please try again later.';
            } else if (error.message.includes('Missing tokens')) {
                errorMessage = 'Invalid server response. Please contact support.';
            }

            throw new Error(errorMessage);
        },
    });
};


export const useActivateAccount = () => {

    return useMutation({
        mutationFn: (body: Activate) => activateAccount(body),
        onSuccess: (data) => {
        },
        onError: (error: Error) => {
            console.error("activate error:", error.message);
        },
    });
};