// api/axiosConfig.ts
import axios from 'axios';
import { isTokenExpired } from '../utils/tokenUtils';
import { api } from '../consts/api';
import { useUserStore } from '../store/UsersStore';

let isRefreshing = false;
let failedQueue: Array<{ resolve: Function; reject: Function }> = [];

const processQueue = (error: any | null, token: string | null = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

export const setupInterceptors = (navigate: Function) => {
    // Только ОДИН response interceptor
    axios.interceptors.response.use(
        (response) => response,
        async (error) => {
            const originalRequest = error.config;

            // ✅ Пропускаем все auth запросы (login, refresh, register, activate)
            const isAuthRequest =
                originalRequest.url?.includes('/login') ||
                originalRequest.url?.includes('/refresh') ||
                originalRequest.url?.includes('/register') ||
                originalRequest.url?.includes('/activate');

            if (isAuthRequest) {
                console.log('🚫 Skipping interceptor for auth request:', originalRequest.url);
                return Promise.reject(error);
            }

            // Если ошибка 401 и это не повторный запрос
            if (error.response?.status === 401 && !originalRequest._retry) {
                originalRequest._retry = true;

                // Если уже идет обновление токена, добавляем в очередь
                if (isRefreshing) {
                    return new Promise((resolve, reject) => {
                        failedQueue.push({ resolve, reject });
                    }).then(token => {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        return axios(originalRequest);
                    }).catch(err => {
                        return Promise.reject(err);
                    });
                }

                isRefreshing = true;

                try {
                    const refreshToken = localStorage.getItem('refresh_token');

                    if (!refreshToken) {
                        console.error('❌ No refresh token available');
                        throw new Error('No refresh token');
                    }

                    console.log('🔄 Refreshing token due to 401...');

                    const response = await axios.post(`${api}api/accounts/refresh/`, {
                        refresh: refreshToken
                    });

                    const newAccessToken = response.data.access || response.data.access_token;
                    const newRefreshToken = response.data.refresh || response.data.refresh_token;

                    if (!newAccessToken) {
                        throw new Error('No access token in response');
                    }

                    // Сохраняем новые токены
                    localStorage.setItem('access_token', newAccessToken);
                    if (newRefreshToken) {
                        localStorage.setItem('refresh_token', newRefreshToken);
                        useUserStore.getState().setRefreshToken(newRefreshToken);
                    }

                    useUserStore.getState().setAccessToken(newAccessToken);

                    // Обновляем заголовок для повторного запроса
                    originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

                    // Обрабатываем очередь запросов
                    processQueue(null, newAccessToken);

                    // Повторяем оригинальный запрос
                    return axios(originalRequest);

                } catch (refreshError) {
                    console.error('❌ Token refresh failed:', refreshError);

                    // Очищаем все данные и перенаправляем на логин
                    processQueue(refreshError, null);
                    localStorage.clear();
                    useUserStore.getState().setAccessToken(null);
                    useUserStore.getState().setRefreshToken(null);
                    useUserStore.getState().setMe(null);

                    // Перенаправляем на страницу логина
                    navigate('/login');

                    return Promise.reject(refreshError);
                } finally {
                    isRefreshing = false;
                }
            }

            return Promise.reject(error);
        }
    );
};