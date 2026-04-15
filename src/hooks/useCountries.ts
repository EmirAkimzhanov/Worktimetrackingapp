import { useMutation } from '@tanstack/react-query';
import { addCountry, deleteCountry, editCountry, getCountries } from '../services/countries';
import { useUserStore } from '../store/UsersStore';
import { Country } from '../types/countries';

// ========== КЭШ ДЛЯ СТРАН ==========

let countriesCache: { data: Country[]; timestamp: number } | null = null;
const CACHE_DURATION = 30 * 60 * 1000; // 30 минут

// Функция очистки кэша
const clearCountriesCache = () => {
    countriesCache = null;
    console.log('Countries cache cleared');
};

// Функция получения кэшированных данных
const getCachedCountries = () => {
    const now = Date.now();
    if (countriesCache && (now - countriesCache.timestamp) < CACHE_DURATION) {
        console.log('Returning cached countries data');
        return countriesCache.data;
    }
    return null;
};

// ========== ХУКИ С КЭШИРОВАНИЕМ ==========

export const useGetCountries = () => {
    const setCountries = useUserStore((state) => state.setCountries);

    return useMutation({
        mutationFn: async () => {
            // Проверяем кэш
            const cached = getCachedCountries();
            if (cached) {
                return cached;
            }

            // Загружаем новые данные
            const data = await getCountries();
            countriesCache = { data, timestamp: Date.now() };
            return data;
        },
        onSuccess: (data) => {
            setCountries(data);
            console.log('Countries loaded:', data);
        },
        onError: (error) => {
            console.error("Get countries error:", error);
        },
    });
};

export const useAddCountry = () => {
    return useMutation({
        mutationFn: (country: Country) => addCountry(country),
        onSuccess: (data) => {
            // Очищаем кэш при добавлении страны
            clearCountriesCache();
            console.log('Country added:', data);
        },
        onError: (error) => {
            console.error("Add country error:", error);
        },
    });
};

export const useDeleteCountry = () => {
    return useMutation({
        mutationFn: (id: string) => deleteCountry(id),
        onSuccess: (data) => {
            // Очищаем кэш при удалении страны
            clearCountriesCache();
            console.log('Country deleted:', data);
        },
        onError: (error) => {
            console.error("Delete country error:", error);
        },
    });
};

export const useEditCountry = () => {
    return useMutation({
        mutationFn: ({ id, country }: { id: string, country: Country }) => editCountry(id, country),
        onSuccess: (data) => {
            // Очищаем кэш при редактировании страны
            clearCountriesCache();
            console.log('Country edited:', data);
        },
        onError: (error) => {
            console.error("Edit country error:", error);
        },
    });
};

// ========== ДОПОЛНИТЕЛЬНЫЕ УТИЛИТЫ ==========

// Экспортируем функцию для ручной очистки кэша (если понадобится)
export const countriesCacheUtils = {
    clearCache: clearCountriesCache,
    getCache: () => countriesCache,
    isCacheValid: () => {
        if (!countriesCache) return false;
        const now = Date.now();
        return (now - countriesCache.timestamp) < CACHE_DURATION;
    },
    getCacheAge: () => {
        if (!countriesCache) return null;
        const now = Date.now();
        return Math.floor((now - countriesCache.timestamp) / 1000); // в секундах
    }
};