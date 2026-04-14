// hooks/useTokenMonitor.ts
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { isTokenExpired } from '../utils/tokenUtils';
import { useUserStore } from '../store/UsersStore';

export const useTokenMonitor = () => {
    const navigate = useNavigate();
    const { access_token, refresh_token, logout } = useUserStore();

    useEffect(() => {
        const checkTokenExpiration = () => {
            if (access_token && isTokenExpired(access_token)) {
                // Токен истек
                console.log('Token expired, logging out...');
                logout();
                navigate('/login');
            }
        };

        // Проверка каждую минуту
        const interval = setInterval(checkTokenExpiration, 60000);

        // Немедленная проверка
        checkTokenExpiration();

        return () => clearInterval(interval);
    }, [access_token, navigate, logout]);
};