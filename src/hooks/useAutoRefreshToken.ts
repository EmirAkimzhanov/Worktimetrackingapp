// hooks/useAutoRefreshToken.ts
import { useEffect, useRef } from 'react';
import { getTokenExpirationTime } from '../utils/tokenUtils';
import axios from 'axios';
import { useUserStore } from '../store/UsersStore';

export const useAutoRefreshToken = () => {
    const { access_token, refresh_token } = useUserStore();
    const refreshTimeoutRef = useRef<NodeJS.Timeout>();

    const scheduleRefresh = () => {
        if (!access_token) return;

        const expirationTime = getTokenExpirationTime(access_token);
        if (!expirationTime) return;

        const timeUntilExpiry = expirationTime - Date.now();
        const refreshTime = timeUntilExpiry - 5 * 60 * 1000; // За 5 минут до истечения

        if (refreshTime > 0) {
            refreshTimeoutRef.current = setTimeout(async () => {
                try {
                    // Вызов API для обновления токена
                    const response = await axios.post('/api/auth/refresh', {
                        refresh_token: localStorage.getItem('refresh_token')
                    });

                    const newAccessToken = response.data.access_token;
                    localStorage.setItem('access_token', newAccessToken);
                    useUserStore.getState().setAccessToken(newAccessToken);

                    // Перепланировать следующее обновление
                    scheduleRefresh();
                } catch (error) {
                    console.error('Failed to refresh token:', error);
                    // Редирект на логин
                    window.location.href = '/login';
                }
            }, refreshTime);
        }
    };

    useEffect(() => {
        scheduleRefresh();

        return () => {
            if (refreshTimeoutRef.current) {
                clearTimeout(refreshTimeoutRef.current);
            }
        };
    }, [access_token]);
};