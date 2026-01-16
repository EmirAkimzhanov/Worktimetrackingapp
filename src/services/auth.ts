// services/auth.ts
import { api } from '../consts/api';
import axios from 'axios';

interface LoginCredentials {
    email: string;
    password: string;
}

interface LoginResponse {
    access: string;          // токен доступа
    refresh: string;         // refresh токен
    access_token?: string;   // для обратной совместимости
    refresh_token?: string;  // для обратной совместимости
}

export const login = async (credentials: LoginCredentials): Promise<LoginResponse> => {
    try {
        const response = await axios.post(`${api}api/accounts/login/`, credentials);

        console.log('Login response:', response.data); // Для отладки

        if (!response.data) {
            throw new Error('No data in response');
        }

        const { access, refresh, access_token, refresh_token } = response.data;

        // Используем новые имена полей, если они есть, иначе старые
        const accessToken = access || access_token;
        const refreshToken = refresh || refresh_token;

        // Валидация токенов
        if (!accessToken || !refreshToken) {
            console.error('Tokens received:', { access, refresh, access_token, refresh_token });
            throw new Error('Missing tokens in response');
        }

        // Возвращаем данные в ожидаемом формате
        return {
            access: accessToken,
            refresh: refreshToken,
            access_token: accessToken,  // для обратной совместимости
            refresh_token: refreshToken // для обратной совместимости
        };
    } catch (error: any) {
        console.error('Login service error:', error);

        if (error.response) {
            const { status, data } = error.response;

            if (status === 401) {
                throw new Error('Invalid credentials');
            } else if (status === 400) {
                throw new Error(data.message || 'Invalid request');
            } else if (status >= 500) {
                throw new Error('Server error');
            }
        } else if (error.request) {
            throw new Error('Network error');
        }

        throw error;
    }
};