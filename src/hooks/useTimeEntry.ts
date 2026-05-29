import { useMutation } from '@tanstack/react-query';
import { deleteCalendar, deleteTimeEntry, editCalendar, editTimeEntry, getCalendar, getHolidayCalendar, getTimeEntry, getWorkingWeekends, sendCalendar, sendLetter, sendReminder, sendTimeEntry, getTimeEntriesStats } from "../services/timeEntry";
import { EditDate, LetterBody, ReminderBody, TimeBody } from '../types/timeEntrys';
import { useUserStore } from '../store/UsersStore';
import { CalendarEvent } from '../types/calendar';
import { toast } from 'sonner';

// ========== КЭШ ДЛЯ TIME ENTRY И КАЛЕНДАРЯ ==========

let timeEntriesCache: { data: any; timestamp: number } | null = null;
let calendarCache: { data: any; timestamp: number } | null = null;
let holidayCalendarCache: { data: any; timestamp: number } | null = null;
let timeEntriesStatsCache: { data: any; timestamp: number; year: string; month: string } | null = null;

const CACHE_DURATION = 30 * 60 * 1000; // 30 минут
const STATS_CACHE_DURATION = 5 * 60 * 1000; // 5 минут для статистики

// Функции очистки кэша
const clearTimeEntriesCache = () => {
    timeEntriesCache = null;
    console.log('Time entries cache cleared');
};

const clearCalendarCache = () => {
    calendarCache = null;
    console.log('Calendar cache cleared');
};

const clearHolidayCalendarCache = () => {
    holidayCalendarCache = null;
    console.log('Holiday calendar cache cleared');
};

const clearTimeEntriesStatsCache = () => {
    timeEntriesStatsCache = null;
    console.log('Time entries stats cache cleared');
};

const clearAllTimeCaches = () => {
    clearTimeEntriesCache();
    clearCalendarCache();
    clearHolidayCalendarCache();
    clearTimeEntriesStatsCache();
    console.log('All time-related caches cleared');
};

// Функции получения кэшированных данных
const getCachedTimeEntries = () => {
    const now = Date.now();
    if (timeEntriesCache && (now - timeEntriesCache.timestamp) < CACHE_DURATION) {
        console.log('Returning cached time entries data');
        return timeEntriesCache.data;
    }
    return null;
};

const getCachedCalendar = () => {
    const now = Date.now();
    if (calendarCache && (now - calendarCache.timestamp) < CACHE_DURATION) {
        console.log('Returning cached calendar data');
        return calendarCache.data;
    }
    return null;
};

const getCachedHolidayCalendar = () => {
    const now = Date.now();
    if (holidayCalendarCache && (now - holidayCalendarCache.timestamp) < CACHE_DURATION) {
        console.log('Returning cached holiday calendar data');
        return holidayCalendarCache.data;
    }
    return null;
};

let workingWeekendsCache: { data: any; timestamp: number } | null = null;

const clearWorkingWeekendsCache = () => {
    workingWeekendsCache = null;
    console.log('Working weekends cache cleared');
};

const getCachedWorkingWeekends = () => {
    const now = Date.now();
    if (workingWeekendsCache && (now - workingWeekendsCache.timestamp) < CACHE_DURATION) {
        console.log('Returning cached working weekends data');
        return workingWeekendsCache.data;
    }
    return null;
};

// ========== ХУКИ С КЭШИРОВАНИЕМ ==========

export const useSendTimeEntrys = () => {
    return useMutation({
        mutationFn: async (body: TimeBody) => {
            // Автоматически определяем single_date если start_date равен end_date
            const isSingleDate = body.start_date === body.end_date;
            const result = await sendTimeEntry(body, isSingleDate);
            // Очищаем кэш при создании новой записи времени
            clearTimeEntriesCache();
            clearTimeEntriesStatsCache(); // Очищаем кэш статистики
            return result;
        },
        onSuccess: (data) => {
            console.log('Time entry created:', data);
        },
        onError: (error) => {
            console.error("Send time entry error:", error);
        },
    });
};

export const useGetTimeEntrys = () => {
    const setTimeEntries = useUserStore((state) => state.setTimeEntries);

    return useMutation({
        mutationFn: async (forceRefresh?: boolean) => {
            // Если forceRefresh = true, игнорируем кэш
            if (!forceRefresh && timeEntriesCache) {
                const isCacheValid = Date.now() - timeEntriesCache.timestamp < CACHE_DURATION;
                if (isCacheValid) {
                    console.log('Returning cached time entries');
                    return timeEntriesCache.data;
                }
            }

            console.log(forceRefresh ? 'Force refreshing time entries' : 'Fetching fresh time entries');
            const data = await getTimeEntry();
            timeEntriesCache = { data, timestamp: Date.now() };
            return data;
        },
        onSuccess: (data) => {
            setTimeEntries(data);
            console.log('Time entries loaded:', data);
        },
        onError: (error) => {
            console.error("Get time entries error:", error);
        },
    });
};

export const useEditTimeEntry = () => {
    return useMutation({
        mutationFn: async ({ day_id, body }: { day_id: string, body: EditDate }) => {
            const result = await editTimeEntry(day_id, body);
            // Очищаем кэш при редактировании
            clearTimeEntriesCache();
            clearTimeEntriesStatsCache(); // Очищаем кэш статистики
            return result;
        },
        onSuccess: (data) => {
            console.log('Time entry edited:', data);
        },
        onError: (error) => {
            console.error("Edit time entry error:", error);
        },
    });
};

export const useDeleteTimeEntry = () => {
    return useMutation({
        mutationFn: async (day_id: string) => {
            const result = await deleteTimeEntry(day_id);
            // Очищаем кэш при удалении
            clearTimeEntriesCache();
            clearTimeEntriesStatsCache(); // Очищаем кэш статистики
            return result;
        },
        onSuccess: (data) => {
            console.log('Time entry deleted:', data);
        },
        onError: (error) => {
            console.error("Delete time entry error:", error);
        },
    });
};

export const useGetCalendar = () => {
    const setCalendar = useUserStore((state) => state.setCalendar);

    return useMutation({
        mutationFn: async (forceRefresh?: boolean) => {
            if (!forceRefresh) {
                const cached = getCachedCalendar();
                if (cached) {
                    return cached;
                }
            }

            console.log(forceRefresh ? 'Force refreshing calendar' : 'Fetching fresh calendar');
            const data = await getCalendar();
            calendarCache = { data, timestamp: Date.now() };
            return data;
        },
        onSuccess: (data) => {
            setCalendar(data);
            console.log('Calendar loaded:', data);
        },
        onError: (error) => {
            console.error("Get calendar error:", error);
        },
    });
};

export const useGetWorkingWeekends = () => {
    const setWorkingWeekends = useUserStore((state) => state.setWorkingWeekends);

    return useMutation({
        mutationFn: async (forceRefresh?: boolean) => {
            if (!forceRefresh) {
                const cached = getCachedWorkingWeekends();
                if (cached) {
                    return cached;
                }
            }

            console.log(forceRefresh ? 'Force refreshing working weekends' : 'Fetching fresh working weekends');
            const data = await getWorkingWeekends();
            workingWeekendsCache = { data, timestamp: Date.now() };
            return data;
        },
        onSuccess: (data) => {
            setWorkingWeekends(data);
            console.log('Working weekends loaded:', data);
        },
        onError: (error) => {
            console.error("Get working weekends error:", error);
        },
    });
};

export const useSendCalendar = () => {
    return useMutation({
        mutationFn: async (body: CalendarEvent) => {
            const result = await sendCalendar(body);
            // Очищаем кэш календаря при создании события
            clearCalendarCache();
            return result;
        },
        onError: (error: any) => {
            let errorMessage = error.message;

            if (error.response?.data) {
                if (typeof error.response.data === 'object') {
                    errorMessage = error.response.data.message ||
                        error.response.data.error ||
                        error.response.data.detail ||
                        JSON.stringify(error.response.data);
                }
                else if (typeof error.response.data === 'string') {
                    errorMessage = error.response.data;
                }
            }

            toast(errorMessage);
        },
    });
};

export const useEditCalendar = () => {
    const getCalendarMutation = useGetCalendar();

    return useMutation({
        mutationFn: async ({ body, day_id }: { body: CalendarEvent, day_id: string }) => {
            const result = await editCalendar(body, day_id);
            clearCalendarCache();
            return result;
        },
        onSuccess: async () => {
            await getCalendarMutation.mutateAsync(true);
        },
        onError: (error: any) => {
            let errorMessage = error.message;

            if (error.response?.data) {
                if (typeof error.response.data === 'object') {
                    errorMessage = error.response.data.message ||
                        error.response.data.error ||
                        error.response.data.detail ||
                        JSON.stringify(error.response.data);
                }
                else if (typeof error.response.data === 'string') {
                    errorMessage = error.response.data;
                }
            }

            toast(errorMessage);
        },
    });
};

export const useDeleteCalendar = () => {
    return useMutation({
        mutationFn: async (day_id: string) => {
            const result = await deleteCalendar(day_id);
            clearCalendarCache();
            return result;
        },
        onError: (error) => {
            console.error("Delete calendar error:", error);
        },
    });
};

export const useGetHolidayTimeEntrys = () => {
    const setCalendarHolidays = useUserStore((state) => state.setCalendarHolidays);

    return useMutation({
        mutationFn: async (forceRefresh?: boolean) => {
            if (!forceRefresh) {
                const cached = getCachedHolidayCalendar();
                if (cached) {
                    return cached;
                }
            }

            console.log(forceRefresh ? 'Force refreshing holiday calendar' : 'Fetching fresh holiday calendar');
            const data = await getHolidayCalendar();
            holidayCalendarCache = { data, timestamp: Date.now() };
            return data;
        },
        onSuccess: (data) => {
            setCalendarHolidays(data);
            console.log('Holiday calendar loaded:', data);
        },
        onError: (error) => {
            console.error("Get holiday calendar error:", error);
        },
    });
};

export const useSendReminder = () => {
    return useMutation({
        mutationFn: async (body: ReminderBody) => {
            const result = await sendReminder(body);
            return result;
        },
        onSuccess: () => {
            console.log('Reminder sent');
        },
        onError: (error) => {
            console.error("Send reminder error:", error);
        },
    });
};

export const useSendLetter = () => {
    return useMutation({
        mutationFn: async (letterBody: LetterBody) => {
            const result = await sendLetter(letterBody);
            return result;
        },
        onSuccess: () => {
            console.log('Letter sent');
        },
        onError: (error) => {
            console.error("Send letter error:", error);
        },
    });
};

// ========== НОВЫЙ ХУК ДЛЯ СТАТИСТИКИ TIME ENTRIES ==========

export const useGetTimeEntriesStats = () => {
    const setTimeEntriesStats = useUserStore((state) => state.setTimeEntriesStats);

    return useMutation({
        mutationFn: async ({ year, month, forceRefresh }: { year: string; month: string; forceRefresh?: boolean }) => {
            // Проверяем кэш
            if (!forceRefresh && timeEntriesStatsCache &&
                timeEntriesStatsCache.year === year &&
                timeEntriesStatsCache.month === month) {
                const isCacheValid = Date.now() - timeEntriesStatsCache.timestamp < STATS_CACHE_DURATION;
                if (isCacheValid) {
                    console.log('Returning cached stats data');
                    return timeEntriesStatsCache.data;
                }
            }

            console.log(forceRefresh ? 'Force refreshing stats' : 'Fetching fresh stats');
            // Используем существующую функцию из сервиса (которая использует вашу константу api)
            const data = await getTimeEntriesStats(year, month);
            timeEntriesStatsCache = { data, timestamp: Date.now(), year, month };
            return data;
        },
        onSuccess: (data) => {
            setTimeEntriesStats(data);
            console.log('Time entries stats loaded:', data);
        },
        onError: (error) => {
            console.error("Get time entries stats error:", error);
        },
    });
};

// ========== ДОПОЛНИТЕЛЬНЫЕ УТИЛИТЫ ==========

export const timeCacheUtils = {
    clearTimeEntriesCache,
    clearCalendarCache,
    clearHolidayCalendarCache,
    clearTimeEntriesStatsCache,
    clearAll: clearAllTimeCaches,

    isTimeEntriesCacheValid: () => {
        if (!timeEntriesCache) return false;
        const now = Date.now();
        return (now - timeEntriesCache.timestamp) < CACHE_DURATION;
    },

    isCalendarCacheValid: () => {
        if (!calendarCache) return false;
        const now = Date.now();
        return (now - calendarCache.timestamp) < CACHE_DURATION;
    },

    isHolidayCalendarCacheValid: () => {
        if (!holidayCalendarCache) return false;
        const now = Date.now();
        return (now - holidayCalendarCache.timestamp) < CACHE_DURATION;
    },

    isTimeEntriesStatsCacheValid: (year?: string, month?: string) => {
        if (!timeEntriesStatsCache) return false;
        if (year && month && (timeEntriesStatsCache.year !== year || timeEntriesStatsCache.month !== month)) {
            return false;
        }
        const now = Date.now();
        return (now - timeEntriesStatsCache.timestamp) < STATS_CACHE_DURATION;
    },

    getTimeEntriesCacheAge: () => {
        if (!timeEntriesCache) return null;
        const now = Date.now();
        return Math.floor((now - timeEntriesCache.timestamp) / 1000);
    },

    getCalendarCacheAge: () => {
        if (!calendarCache) return null;
        const now = Date.now();
        return Math.floor((now - calendarCache.timestamp) / 1000);
    },

    getHolidayCalendarCacheAge: () => {
        if (!holidayCalendarCache) return null;
        const now = Date.now();
        return Math.floor((now - holidayCalendarCache.timestamp) / 1000);
    },

    getTimeEntriesStatsCacheAge: () => {
        if (!timeEntriesStatsCache) return null;
        const now = Date.now();
        return Math.floor((now - timeEntriesStatsCache.timestamp) / 1000);
    },

    getTimeEntriesCacheAgeInMinutes: () => {
        if (!timeEntriesCache) return null;
        const now = Date.now();
        return Math.floor((now - timeEntriesCache.timestamp) / 60000);
    },

    getCalendarCacheAgeInMinutes: () => {
        if (!calendarCache) return null;
        const now = Date.now();
        return Math.floor((now - calendarCache.timestamp) / 60000);
    },

    getHolidayCalendarCacheAgeInMinutes: () => {
        if (!holidayCalendarCache) return null;
        const now = Date.now();
        return Math.floor((now - holidayCalendarCache.timestamp) / 60000);
    },

    getTimeEntriesStatsCacheAgeInMinutes: () => {
        if (!timeEntriesStatsCache) return null;
        const now = Date.now();
        return Math.floor((now - timeEntriesStatsCache.timestamp) / 60000);
    },

    getTimeEntriesCacheData: () => {
        return timeEntriesCache ? timeEntriesCache.data : null;
    },

    getCalendarCacheData: () => {
        return calendarCache ? calendarCache.data : null;
    },

    getHolidayCalendarCacheData: () => {
        return holidayCalendarCache ? holidayCalendarCache.data : null;
    },

    getTimeEntriesStatsCacheData: () => {
        return timeEntriesStatsCache ? timeEntriesStatsCache.data : null;
    },

    refreshTimeEntriesCache: async () => {
        const data = await getTimeEntry();
        timeEntriesCache = { data, timestamp: Date.now() };
        console.log('Time entries cache refreshed');
        return data;
    },

    refreshCalendarCache: async () => {
        const data = await getCalendar();
        calendarCache = { data, timestamp: Date.now() };
        console.log('Calendar cache refreshed');
        return data;
    },

    refreshHolidayCalendarCache: async () => {
        const data = await getHolidayCalendar();
        holidayCalendarCache = { data, timestamp: Date.now() };
        console.log('Holiday calendar cache refreshed');
        return data;
    },

    refreshTimeEntriesStatsCache: async (year: string, month: string) => {
        const data = await getTimeEntriesStats(year, month);
        timeEntriesStatsCache = { data, timestamp: Date.now(), year, month };
        console.log('Time entries stats cache refreshed');
        return data;
    },

    getCacheInfo: () => {
        const now = Date.now();

        const timeEntriesInfo = !timeEntriesCache ? { exists: false } : {
            exists: true,
            isValid: (now - timeEntriesCache.timestamp) < CACHE_DURATION,
            ageInSeconds: Math.floor((now - timeEntriesCache.timestamp) / 1000),
            ageInMinutes: Math.floor((now - timeEntriesCache.timestamp) / 60000)
        };

        const calendarInfo = !calendarCache ? { exists: false } : {
            exists: true,
            isValid: (now - calendarCache.timestamp) < CACHE_DURATION,
            ageInSeconds: Math.floor((now - calendarCache.timestamp) / 1000),
            ageInMinutes: Math.floor((now - calendarCache.timestamp) / 60000)
        };

        const holidayInfo = !holidayCalendarCache ? { exists: false } : {
            exists: true,
            isValid: (now - holidayCalendarCache.timestamp) < CACHE_DURATION,
            ageInSeconds: Math.floor((now - holidayCalendarCache.timestamp) / 1000),
            ageInMinutes: Math.floor((now - holidayCalendarCache.timestamp) / 60000)
        };

        const statsInfo = !timeEntriesStatsCache ? { exists: false } : {
            exists: true,
            year: timeEntriesStatsCache.year,
            month: timeEntriesStatsCache.month,
            isValid: (now - timeEntriesStatsCache.timestamp) < STATS_CACHE_DURATION,
            ageInSeconds: Math.floor((now - timeEntriesStatsCache.timestamp) / 1000),
            ageInMinutes: Math.floor((now - timeEntriesStatsCache.timestamp) / 60000)
        };

        return {
            timeEntries: timeEntriesInfo,
            calendar: calendarInfo,
            holidayCalendar: holidayInfo,
            timeEntriesStats: statsInfo,
            cacheDurationMinutes: CACHE_DURATION / 60000,
            statsCacheDurationMinutes: STATS_CACHE_DURATION / 60000
        };
    }
};