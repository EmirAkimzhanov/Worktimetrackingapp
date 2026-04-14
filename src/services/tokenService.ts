// services/tokenService.ts
import { isTokenExpired, getTokenExpirationTime } from '../utils/tokenUtils';

class TokenService {
    private refreshTimer: NodeJS.Timeout | null = null;

    // Проверка текущих токенов
    checkTokens(): { accessValid: boolean; refreshValid: boolean } {
        const accessToken = localStorage.getItem('access_token');
        const refreshToken = localStorage.getItem('refresh_token');

        return {
            accessValid: accessToken ? !isTokenExpired(accessToken) : false,
            refreshValid: refreshToken ? !isTokenExpired(refreshToken) : false
        };
    }

    // Запуск таймера для автоматического обновления
    startTokenMonitoring(onTokenExpired: () => void, onTokenRefresh: () => void) {
        const accessToken = localStorage.getItem('access_token');
        if (!accessToken) return;

        const expirationTime = getTokenExpirationTime(accessToken);
        if (!expirationTime) return;

        const timeUntilExpiry = expirationTime - Date.now();
        const timeUntilRefresh = timeUntilExpiry - 5 * 60 * 1000; // За 5 минут до истечения

        if (timeUntilRefresh > 0) {
            // Запланировать обновление токена за 5 минут до истечения
            this.refreshTimer = setTimeout(() => {
                onTokenRefresh();
            }, timeUntilRefresh);
        } else if (timeUntilExpiry > 0) {
            // Если до истечения меньше 5 минут, обновить сейчас
            onTokenRefresh();
        } else {
            // Токен уже истек
            onTokenExpired();
        }
    }

    stopTokenMonitoring() {
        if (this.refreshTimer) {
            clearTimeout(this.refreshTimer);
            this.refreshTimer = null;
        }
    }
}

export const tokenService = new TokenService();