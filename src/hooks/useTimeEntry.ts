import { useMutation } from '@tanstack/react-query';
import { deleteCalendar, deleteTimeEntry, editCalendar, editTimeEntry, getCalendar, getHolidayCalendar, getTimeEntry, getWorkingWeekends, sendCalendar, sendLetter, sendReminder, sendTimeEntry, getTimeEntriesStats, getLeaves, getTimeEntriesAttendance } from "../services/timeEntry";
import { EditDate, LetterBody, ReminderBody, TimeBody } from '../types/timeEntrys';
import { useUserStore } from '../store/UsersStore';
import { CalendarEvent } from '../types/calendar';
import { toast } from 'sonner';

// ========== КЭШ ДЛЯ TIME ENTRY И КАЛЕНДАРЯ ==========

// Исправляем объявление кэша для поддержки разных ключей
let timeEntriesCache: Record<string, { data: any; timestamp: number }> = {};
let calendarCache: { data: any; timestamp: number } | null = null;
let holidayCalendarCache: { data: any; timestamp: number } | null = null;
let timeEntriesStatsCache: { data: any; timestamp: number; year: string; month: string } | null = null;
let workingWeekendsCache: { data: any; timestamp: number } | null = null;
let leavesCache: { data: any; timestamp: number } | null = null;
let attendanceCache: { data: any; timestamp: number; page: number; pageSize: number } | null = null;

const CACHE_DURATION = 30 * 60 * 1000; // 30 минут
const STATS_CACHE_DURATION = 5 * 60 * 1000; // 5 минут для статистики
const ATTENDANCE_CACHE_DURATION = 30 * 60 * 1000; // 30 минут для attendance

// Функции очистки кэша
const clearTimeEntriesCache = () => {
    timeEntriesCache = {};
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

const clearWorkingWeekendsCache = () => {
    workingWeekendsCache = null;
    console.log('Working weekends cache cleared');
};

const clearLeavesCache = () => {
    leavesCache = null;
    console.log('Leaves cache cleared');
};

const clearAttendanceCache = () => {
    attendanceCache = null;
    console.log('Attendance cache cleared');
};

const clearAllTimeCaches = () => {
    clearTimeEntriesCache();
    clearCalendarCache();
    clearHolidayCalendarCache();
    clearTimeEntriesStatsCache();
    clearWorkingWeekendsCache();
    clearLeavesCache();
    clearAttendanceCache();
    console.log('All time-related caches cleared');
};

// Функции получения кэшированных данных
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

const getCachedWorkingWeekends = () => {
    const now = Date.now();
    if (workingWeekendsCache && (now - workingWeekendsCache.timestamp) < CACHE_DURATION) {
        console.log('Returning cached working weekends data');
        return workingWeekendsCache.data;
    }
    return null;
};

const getCachedLeaves = () => {
    const now = Date.now();
    if (leavesCache && (now - leavesCache.timestamp) < CACHE_DURATION) {
        console.log('Returning cached leaves data');
        return leavesCache.data;
    }
    return null;
};

const getCachedAttendance = (page: number, pageSize: number) => {
    const now = Date.now();
    if (attendanceCache &&
        attendanceCache.page === page &&
        attendanceCache.pageSize === pageSize &&
        (now - attendanceCache.timestamp) < ATTENDANCE_CACHE_DURATION) {
        console.log('Returning cached attendance data');
        return attendanceCache.data;
    }
    return null;
};

// ========== ХУКИ С КЭШИРОВАНИЕМ ==========
export const useSendTimeEntrys = () => {
    return useMutation({
        mutationFn: async (params: TimeBody | { body: TimeBody; file?: File }) => {
            let body: TimeBody;
            let file: File | undefined;

            if (params && typeof params === 'object' && 'body' in params) {
                body = params.body;
                file = params.file;
            } else {
                body = params as TimeBody;
                file = undefined;
            }

            if (!body || typeof body !== 'object') {
                throw new Error('Invalid time entry data: body is required');
            }

            if (!body.start_date || !body.end_date) {
                console.error('Missing required fields:', { start_date: body.start_date, end_date: body.end_date });
                throw new Error('Missing required fields: start_date and end_date are required');
            }

            const isSingleDate = body.start_date === body.end_date;
            const result = await sendTimeEntry(body, isSingleDate, file);

            clearTimeEntriesCache();
            clearTimeEntriesStatsCache();
            clearAttendanceCache();

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
        mutationFn: async (params?: { start_date?: string; end_date?: string; forceRefresh?: boolean }) => {
            const forceRefresh = params?.forceRefresh;
            const start_date = params?.start_date;
            const end_date = params?.end_date;

            const cacheKey = `${start_date || 'all'}_${end_date || 'all'}`;

            if (!forceRefresh && timeEntriesCache[cacheKey]) {
                const isCacheValid = Date.now() - timeEntriesCache[cacheKey].timestamp < CACHE_DURATION;
                if (isCacheValid) {
                    console.log('Returning cached time entries for key:', cacheKey);
                    return timeEntriesCache[cacheKey].data;
                }
            }

            console.log(forceRefresh ? 'Force refreshing time entries' : 'Fetching fresh time entries', { start_date, end_date });
            const data = await getTimeEntry(start_date, end_date);

            timeEntriesCache[cacheKey] = { data, timestamp: Date.now() };

            return data;
        },
        onSuccess: (data, params) => {
            setTimeEntries(data);
            console.log('Time entries loaded:', data, 'with params:', params);
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
            clearTimeEntriesCache();
            clearTimeEntriesStatsCache();
            clearAttendanceCache();
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
            clearTimeEntriesCache();
            clearTimeEntriesStatsCache();
            clearAttendanceCache();
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

// ========== ХУК ДЛЯ LEAVES ==========

export const useGetLeaves = () => {
    const setLeaves = useUserStore((state) => state.setLeaves);

    return useMutation({
        mutationFn: async (forceRefresh?: boolean) => {
            if (!forceRefresh) {
                const cached = getCachedLeaves();
                if (cached) {
                    return cached;
                }
            }

            console.log(forceRefresh ? 'Force refreshing leaves' : 'Fetching fresh leaves');
            const data = await getLeaves();
            leavesCache = { data, timestamp: Date.now() };
            return data;
        },
        onSuccess: (data) => {
            if (setLeaves) {
                setLeaves(data);
            }
            console.log('Leaves loaded:', data);
        },
        onError: (error) => {
            console.error("Get leaves error:", error);
        },
    });
};

// ========== ХУК ДЛЯ СТАТИСТИКИ TIME ENTRIES ==========

export const useGetTimeEntriesStats = () => {
    const setTimeEntriesStats = useUserStore((state) => state.setTimeEntriesStats);

    return useMutation({
        mutationFn: async ({ year, month, forceRefresh }: { year: string; month: string; forceRefresh?: boolean }) => {
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

// ========== ХУК ДЛЯ ATTENDANCE ==========
export const useGetTimeEntriesAttendance = () => {
    const setAttendance = useUserStore((state) => state.setAttendance);

    return useMutation({
        mutationFn: async (params: {
            page?: number;
            pageSize?: number;
            forceRefresh?: boolean;
            start_date?: string;
            end_date?: string;
            date?: string;
            user_department?: string;
            user_country_code?: string;
            position?: string;
            detailed_grade?: string;
            task_type?: string;
            status?: string;
            user_email?: string;
            user_name?: string;
            description?: string;
            country_id?: string;
        }) => {
            const { page = 1, pageSize = 20, forceRefresh, ...rest } = params;
            const data = await getTimeEntriesAttendance({ page, pageSize, ...rest });
            return data;
        },
        onSuccess: (data) => {
            if (setAttendance) setAttendance(data);
        },
        onError: (error) => {
            console.error("Get attendance error:", error);
        },
    });
};

// ========== ДОПОЛНИТЕЛЬНЫЕ УТИЛИТЫ ==========

export const timeCacheUtils = {
    clearTimeEntriesCache,
    clearCalendarCache,
    clearHolidayCalendarCache,
    clearTimeEntriesStatsCache,
    clearWorkingWeekendsCache,
    clearLeavesCache,
    clearAttendanceCache,
    clearAll: clearAllTimeCaches,

    isTimeEntriesCacheValid: (cacheKey?: string) => {
        if (cacheKey) {
            const cache = timeEntriesCache[cacheKey];
            if (!cache) return false;
            const now = Date.now();
            return (now - cache.timestamp) < CACHE_DURATION;
        }
        return Object.keys(timeEntriesCache).length > 0;
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

    isWorkingWeekendsCacheValid: () => {
        if (!workingWeekendsCache) return false;
        const now = Date.now();
        return (now - workingWeekendsCache.timestamp) < CACHE_DURATION;
    },

    isLeavesCacheValid: () => {
        if (!leavesCache) return false;
        const now = Date.now();
        return (now - leavesCache.timestamp) < CACHE_DURATION;
    },

    isAttendanceCacheValid: (page?: number, pageSize?: number) => {
        if (!attendanceCache) return false;
        if (page !== undefined && pageSize !== undefined &&
            (attendanceCache.page !== page || attendanceCache.pageSize !== pageSize)) {
            return false;
        }
        const now = Date.now();
        return (now - attendanceCache.timestamp) < ATTENDANCE_CACHE_DURATION;
    },

    isTimeEntriesStatsCacheValid: (year?: string, month?: string) => {
        if (!timeEntriesStatsCache) return false;
        if (year && month && (timeEntriesStatsCache.year !== year || timeEntriesStatsCache.month !== month)) {
            return false;
        }
        const now = Date.now();
        return (now - timeEntriesStatsCache.timestamp) < STATS_CACHE_DURATION;
    },

    getTimeEntriesCacheAge: (cacheKey?: string) => {
        if (cacheKey) {
            const cache = timeEntriesCache[cacheKey];
            if (!cache) return null;
            const now = Date.now();
            return Math.floor((now - cache.timestamp) / 1000);
        }
        return null;
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

    getWorkingWeekendsCacheAge: () => {
        if (!workingWeekendsCache) return null;
        const now = Date.now();
        return Math.floor((now - workingWeekendsCache.timestamp) / 1000);
    },

    getLeavesCacheAge: () => {
        if (!leavesCache) return null;
        const now = Date.now();
        return Math.floor((now - leavesCache.timestamp) / 1000);
    },

    getAttendanceCacheAge: () => {
        if (!attendanceCache) return null;
        const now = Date.now();
        return Math.floor((now - attendanceCache.timestamp) / 1000);
    },

    getTimeEntriesStatsCacheAge: () => {
        if (!timeEntriesStatsCache) return null;
        const now = Date.now();
        return Math.floor((now - timeEntriesStatsCache.timestamp) / 1000);
    },

    getTimeEntriesCacheAgeInMinutes: (cacheKey?: string) => {
        if (cacheKey) {
            const cache = timeEntriesCache[cacheKey];
            if (!cache) return null;
            const now = Date.now();
            return Math.floor((now - cache.timestamp) / 60000);
        }
        return null;
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

    getWorkingWeekendsCacheAgeInMinutes: () => {
        if (!workingWeekendsCache) return null;
        const now = Date.now();
        return Math.floor((now - workingWeekendsCache.timestamp) / 60000);
    },

    getLeavesCacheAgeInMinutes: () => {
        if (!leavesCache) return null;
        const now = Date.now();
        return Math.floor((now - leavesCache.timestamp) / 60000);
    },

    getAttendanceCacheAgeInMinutes: () => {
        if (!attendanceCache) return null;
        const now = Date.now();
        return Math.floor((now - attendanceCache.timestamp) / 60000);
    },

    getTimeEntriesStatsCacheAgeInMinutes: () => {
        if (!timeEntriesStatsCache) return null;
        const now = Date.now();
        return Math.floor((now - timeEntriesStatsCache.timestamp) / 60000);
    },

    getTimeEntriesCacheData: (cacheKey?: string) => {
        if (cacheKey) {
            return timeEntriesCache[cacheKey] ? timeEntriesCache[cacheKey].data : null;
        }
        return timeEntriesCache;
    },

    getCalendarCacheData: () => {
        return calendarCache ? calendarCache.data : null;
    },

    getHolidayCalendarCacheData: () => {
        return holidayCalendarCache ? holidayCalendarCache.data : null;
    },

    getWorkingWeekendsCacheData: () => {
        return workingWeekendsCache ? workingWeekendsCache.data : null;
    },

    getLeavesCacheData: () => {
        return leavesCache ? leavesCache.data : null;
    },

    getAttendanceCacheData: () => {
        return attendanceCache ? attendanceCache.data : null;
    },

    getTimeEntriesStatsCacheData: () => {
        return timeEntriesStatsCache ? timeEntriesStatsCache.data : null;
    },

    refreshTimeEntriesCache: async (start_date?: string, end_date?: string) => {
        const cacheKey = `${start_date || 'all'}_${end_date || 'all'}`;
        const data = await getTimeEntry(start_date, end_date);
        timeEntriesCache[cacheKey] = { data, timestamp: Date.now() };
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

    refreshWorkingWeekendsCache: async () => {
        const data = await getWorkingWeekends();
        workingWeekendsCache = { data, timestamp: Date.now() };
        console.log('Working weekends cache refreshed');
        return data;
    },

    refreshLeavesCache: async () => {
        const data = await getLeaves();
        leavesCache = { data, timestamp: Date.now() };
        console.log('Leaves cache refreshed');
        return data;
    },

    refreshAttendanceCache: async (page: number = 1, pageSize: number = 20) => {
        const data = await getTimeEntriesAttendance(page, pageSize);
        attendanceCache = { data, timestamp: Date.now(), page, pageSize };
        console.log('Attendance cache refreshed');
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

        const timeEntriesInfo = Object.keys(timeEntriesCache).length === 0 ? { exists: false } : {
            exists: true,
            keys: Object.keys(timeEntriesCache),
            entries: Object.entries(timeEntriesCache).map(([key, cache]) => ({
                key,
                isValid: (now - cache.timestamp) < CACHE_DURATION,
                ageInSeconds: Math.floor((now - cache.timestamp) / 1000),
                ageInMinutes: Math.floor((now - cache.timestamp) / 60000)
            }))
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

        const workingWeekendsInfo = !workingWeekendsCache ? { exists: false } : {
            exists: true,
            isValid: (now - workingWeekendsCache.timestamp) < CACHE_DURATION,
            ageInSeconds: Math.floor((now - workingWeekendsCache.timestamp) / 1000),
            ageInMinutes: Math.floor((now - workingWeekendsCache.timestamp) / 60000)
        };

        const leavesInfo = !leavesCache ? { exists: false } : {
            exists: true,
            isValid: (now - leavesCache.timestamp) < CACHE_DURATION,
            ageInSeconds: Math.floor((now - leavesCache.timestamp) / 1000),
            ageInMinutes: Math.floor((now - leavesCache.timestamp) / 60000)
        };

        const attendanceInfo = !attendanceCache ? { exists: false } : {
            exists: true,
            page: attendanceCache.page,
            pageSize: attendanceCache.pageSize,
            isValid: (now - attendanceCache.timestamp) < ATTENDANCE_CACHE_DURATION,
            ageInSeconds: Math.floor((now - attendanceCache.timestamp) / 1000),
            ageInMinutes: Math.floor((now - attendanceCache.timestamp) / 60000)
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
            workingWeekends: workingWeekendsInfo,
            leaves: leavesInfo,
            attendance: attendanceInfo,
            timeEntriesStats: statsInfo,
            cacheDurationMinutes: CACHE_DURATION / 60000,
            statsCacheDurationMinutes: STATS_CACHE_DURATION / 60000,
            attendanceCacheDurationMinutes: ATTENDANCE_CACHE_DURATION / 60000
        };
    }
};