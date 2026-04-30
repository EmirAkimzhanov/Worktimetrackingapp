import { useMutation, useQuery } from "@tanstack/react-query";
import { useUserStore } from "../store/UsersStore";
import { createGrade, deleteGrade, editGrade } from "../services/grade";
import { getGlobalSettings, sendGlobalSettings } from "../services/globalSettings";
import { GlobalSet } from "../types/GlobalSettings";
import { useEffect } from "react";

// ========== КЭШ ДЛЯ ГЛОБАЛЬНЫХ НАСТРОЕК ==========

// Кэш для глобальных настроек по country_id
const globalSettingsCache = new Map<string, { data: GlobalSet; timestamp: number }>();
const CACHE_DURATION = 30 * 60 * 1000; // 30 минут

// Функции очистки кэша
const clearGlobalSettingsCache = (countryId?: string) => {
    if (countryId) {
        globalSettingsCache.delete(countryId);
        console.log(`Global settings cache cleared for country: ${countryId}`);
    } else {
        globalSettingsCache.clear();
        console.log('All global settings cache cleared');
    }
};

// Функция получения кэшированных данных
const getCachedGlobalSettings = (countryId: string): GlobalSet | null => {
    const now = Date.now();
    const cached = globalSettingsCache.get(countryId);

    if (cached && (now - cached.timestamp) < CACHE_DURATION) {
        console.log(`Returning cached global settings for country: ${countryId}`);
        return cached.data;
    }

    return null;
};

// ========== ХУКИ С КЭШИРОВАНИЕМ ==========

export const useGetGlobalSettings = (country_id: string) => {
    const setGlobalSettings = useUserStore((state) => state.setGlobalSettings);

    const query = useQuery({
        queryKey: ['globalSettings', country_id],
        queryFn: async () => {
            return await getGlobalSettings(country_id);
        },
        enabled: !!country_id,
    });

    // ✅ замена onSuccess из v4
    useEffect(() => {
        if (query.data) {
            setGlobalSettings(query.data);
        }
    }, [query.data, setGlobalSettings]);

    return query;
};

export const useSetGlobalSettings = () => {
    const setGlobalSettings = useUserStore((state) => state.setGlobalSettings)

    return useMutation({
        mutationFn: async ({ country_id, globalSet }: { country_id: string, globalSet: GlobalSet }) => {
            const result = await sendGlobalSettings(country_id, globalSet);
            // После сохранения обновляем кэш новыми данными
            globalSettingsCache.set(country_id, { data: result, timestamp: Date.now() });
            return result;
        },
        onSuccess: (data, { country_id }) => {
            setGlobalSettings(data);
            console.log(`Global settings saved for country ${country_id}:`, data);
        },
        onError: (error) => {
            console.error("Set global settings error:", error);
        },
    });
};

// ========== ДОПОЛНИТЕЛЬНЫЕ УТИЛИТЫ ==========

export const globalSettingsCacheUtils = {
    clearCache: clearGlobalSettingsCache,
    clearForCountry: (countryId: string) => clearGlobalSettingsCache(countryId),
    clearAll: () => clearGlobalSettingsCache(),
    getCache: (countryId: string) => globalSettingsCache.get(countryId),
    isCacheValid: (countryId: string) => {
        const cached = globalSettingsCache.get(countryId);
        if (!cached) return false;
        const now = Date.now();
        return (now - cached.timestamp) < CACHE_DURATION;
    },
    getCacheAge: (countryId: string) => {
        const cached = globalSettingsCache.get(countryId);
        if (!cached) return null;
        const now = Date.now();
        return Math.floor((now - cached.timestamp) / 1000); // в секундах
    },
    getAllCacheStats: () => {
        const now = Date.now();
        const stats: { [key: string]: { age: number; isValid: boolean } } = {};

        globalSettingsCache.forEach((value, key) => {
            const age = Math.floor((now - value.timestamp) / 1000);
            stats[key] = {
                age,
                isValid: age < CACHE_DURATION / 1000
            };
        });

        return {
            size: globalSettingsCache.size,
            items: stats,
            cacheDurationMinutes: CACHE_DURATION / 60000
        };
    }
};