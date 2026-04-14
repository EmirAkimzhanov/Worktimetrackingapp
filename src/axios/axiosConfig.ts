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
    // Request interceptor
    axios.interceptors.request.use(
        async (config) => {
            // ✅ Пропускаем запрос на обновление токена
            if (config.url?.includes('/refresh/')) {
                return config;
            }

            const accessToken = localStorage.getItem('access_token');

            // Добавляем заголовок авторизации всегда, если токен есть
            if (accessToken && !isTokenExpired(accessToken)) {
                config.headers.Authorization = `Bearer ${accessToken}`;
                return config;
            }

            // Если токен истек, пытаемся обновить
            if (accessToken && isTokenExpired(accessToken)) {
                if (!isRefreshing) {
                    isRefreshing = true;

                    try {
                        const refreshToken = localStorage.getItem('refresh_token');
                        console.log('🔄 Refreshing token...');

                        const response = await axios.post(`${api}api/accounts/refresh/`, {
                            refresh: refreshToken
                        });

                        const newAccessToken = response.data.access || response.data.access_token;
                        const newRefreshToken = response.data.refresh || response.data.refresh_token;

                        if (newAccessToken) {
                            // Сохраняем новые токены
                            localStorage.setItem('access_token', newAccessToken);
                            if (newRefreshToken) {
                                localStorage.setItem('refresh_token', newRefreshToken);
                            }

                            // Обновляем store
                            useUserStore.getState().setAccessToken(newAccessToken);
                            if (newRefreshToken) {
                                useUserStore.getState().setRefreshToken(newRefreshToken);
                            }

                            console.log('✅ Token refreshed successfully');

                            // Обновляем заголовок текущего запроса
                            config.headers.Authorization = `Bearer ${newAccessToken}`;

                            processQueue(null, newAccessToken);
                            return config;
                        } else {
                            throw new Error('No access token in response');
                        }
                    } catch (error) {
                        console.error('❌ Token refresh failed:', error);
                        processQueue(error, null);
                        localStorage.clear();
                        useUserStore.getState().setAccessToken(null);
                        useUserStore.getState().setRefreshToken(null);
                        useUserStore.getState().setMe(null);
                        navigate('/login');
                        return Promise.reject(error);
                    } finally {
                        isRefreshing = false;
                    }
                } else {
                    // Ждем обновления токена
                    return new Promise((resolve, reject) => {
                        failedQueue.push({ resolve, reject });
                    }).then((token) => {
                        config.headers.Authorization = `Bearer ${token}`;
                        return config;
                    }).catch((error) => {
                        return Promise.reject(error);
                    });
                }
            }

            return config;
        },
        (error) => Promise.reject(error)
    );

    // Response interceptor для обработки ошибки 401
    axios.interceptors.response.use(
        (response) => response,
        async (error) => {
            const originalRequest = error.config;

            // ✅ Пропускаем запрос на обновление токена
            if (originalRequest.url?.includes('/refresh/')) {
                return Promise.reject(error);
            }

            // Если ошибка 401 и это не повторный запрос
            if (error.response?.status === 401 && !originalRequest._retry) {
                originalRequest._retry = true;

                try {
                    const refreshToken = localStorage.getItem('refresh_token');
                    console.log('🔄 Refreshing token due to 401...');

                    const response = await axios.post(`${api}api/accounts/refresh/`, {
                        refresh: refreshToken
                    });

                    const newAccessToken = response.data.access || response.data.access_token;
                    const newRefreshToken = response.data.refresh || response.data.refresh_token;

                    if (newAccessToken) {
                        localStorage.setItem('access_token', newAccessToken);
                        if (newRefreshToken) {
                            localStorage.setItem('refresh_token', newRefreshToken);
                        }

                        useUserStore.getState().setAccessToken(newAccessToken);
                        if (newRefreshToken) {
                            useUserStore.getState().setRefreshToken(newRefreshToken);
                        }

                        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

                        // Повторяем оригинальный запрос
                        return axios(originalRequest);
                    } else {
                        throw new Error('No access token in response');
                    }
                } catch (refreshError) {
                    console.error('❌ Token refresh failed on 401:', refreshError);
                    localStorage.clear();
                    useUserStore.getState().setAccessToken(null);
                    useUserStore.getState().setRefreshToken(null);
                    useUserStore.getState().setMe(null);
                    navigate('/login');
                    return Promise.reject(refreshError);
                }
            }

            return Promise.reject(error);
        }
    );
};