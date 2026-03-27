// src/components/admin/CalendarWeeklyScheduleTab.tsx
import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '../../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Label } from '../../ui/label';
import { Switch } from '../../ui/switch';
import { Input } from '../../ui/input';
import { CountryCalendarConfig, WeeklySchedule } from '../../../types/types';
import { Save, Clock } from 'lucide-react';
import { useSetGlobalSettings, useGetGlobalSettings } from '../../../hooks/useGlobalSettings';
import { toast } from 'sonner';
import { useUserStore } from '../../../store/UsersStore';

interface CalendarWeeklyScheduleTabProps {
    config: CountryCalendarConfig;
    onUpdateWeeklySchedule: (countryId: number, schedule: WeeklySchedule) => void;
}

export function CalendarWeeklyScheduleTab({
    config,
    onUpdateWeeklySchedule
}: CalendarWeeklyScheduleTabProps) {
    // Создаем безопасный schedule с значениями по умолчанию
    const defaultSchedule: WeeklySchedule = {
        monday: { isWorkingDay: true, startTime: '09:00', endTime: '18:00' },
        tuesday: { isWorkingDay: true, startTime: '09:00', endTime: '18:00' },
        wednesday: { isWorkingDay: true, startTime: '09:00', endTime: '18:00' },
        thursday: { isWorkingDay: true, startTime: '09:00', endTime: '18:00' },
        friday: { isWorkingDay: true, startTime: '09:00', endTime: '18:00' },
        saturday: { isWorkingDay: false, startTime: '09:00', endTime: '18:00' },
        sunday: { isWorkingDay: false, startTime: '09:00', endTime: '18:00' }
    };

    const { mutate: setGlobalSettings } = useSetGlobalSettings();
    const { mutate: getGlobalSettings } = useGetGlobalSettings();
    const globSet = useUserStore((state) => state.globalSettings);
    const countries = useUserStore((state) => state.countries);

    // Находим правильный ID страны
    const correctCountryId = useMemo(() => {
        if (!countries || !countries.length) {
            return config.id;
        }

        const country = countries.find(
            (c) =>
                c.name.toLowerCase() === config.country?.toLowerCase() ||
                c.code === config.countryCode ||
                c.id === config.id,
        );

        return country?.id || config.id;
    }, [config, countries]);

    // Фильтруем globalSettings для текущей страны
    const currentCountrySettings = useMemo(() => {
        if (!globSet) return null;
        // Проверяем, что country совпадает с correctCountryId
        if (globSet.country === correctCountryId) {
            return globSet;
        }
        return null;
    }, [globSet, correctCountryId]);

    const initialSchedule = useMemo(() => {
        if (!config?.weeklySchedule) {
            return defaultSchedule;
        }

        return {
            ...defaultSchedule,
            ...config.weeklySchedule,
            // Убедимся что каждый день имеет обязательные поля
            monday: {
                isWorkingDay: true,
                startTime: '09:00',
                endTime: '18:00',
                ...config.weeklySchedule.monday
            },
            tuesday: {
                isWorkingDay: true,
                startTime: '09:00',
                endTime: '18:00',
                ...config.weeklySchedule.tuesday
            },
            wednesday: {
                isWorkingDay: true,
                startTime: '09:00',
                endTime: '18:00',
                ...config.weeklySchedule.wednesday
            },
            thursday: {
                isWorkingDay: true,
                startTime: '09:00',
                endTime: '18:00',
                ...config.weeklySchedule.thursday
            },
            friday: {
                isWorkingDay: true,
                startTime: '09:00',
                endTime: '18:00',
                ...config.weeklySchedule.friday
            },
            saturday: {
                isWorkingDay: false,
                startTime: '09:00',
                endTime: '18:00',
                ...config.weeklySchedule.saturday
            },
            sunday: {
                isWorkingDay: false,
                startTime: '09:00',
                endTime: '18:00',
                ...config.weeklySchedule.sunday
            }
        };
    }, [config]);

    const [schedule, setSchedule] = useState<WeeklySchedule>(initialSchedule);
    const [hoursPerDay, setHoursPerDay] = useState('8');

    // Функция для конвертации массива рабочих дней в WeeklySchedule
    const convertWorkingDaysToSchedule = (workingDays: number[], hours: number): WeeklySchedule => {
        const { startTime, endTime } = getTimeFromHours(hours);

        return {
            monday: { isWorkingDay: workingDays.includes(0), startTime, endTime },
            tuesday: { isWorkingDay: workingDays.includes(1), startTime, endTime },
            wednesday: { isWorkingDay: workingDays.includes(2), startTime, endTime },
            thursday: { isWorkingDay: workingDays.includes(3), startTime, endTime },
            friday: { isWorkingDay: workingDays.includes(4), startTime, endTime },
            saturday: { isWorkingDay: workingDays.includes(5), startTime, endTime },
            sunday: { isWorkingDay: workingDays.includes(6), startTime, endTime }
        };
    };

    // Функция для конвертации WeeklySchedule в массив рабочих дней
    const convertToWorkingDaysArray = (schedule: WeeklySchedule): number[] => {
        const workingDays: number[] = [];

        if (schedule.monday.isWorkingDay) workingDays.push(0);
        if (schedule.tuesday.isWorkingDay) workingDays.push(1);
        if (schedule.wednesday.isWorkingDay) workingDays.push(2);
        if (schedule.thursday.isWorkingDay) workingDays.push(3);
        if (schedule.friday.isWorkingDay) workingDays.push(4);
        if (schedule.saturday.isWorkingDay) workingDays.push(5);
        if (schedule.sunday.isWorkingDay) workingDays.push(6);

        return workingDays;
    };

    // Функция для конвертации часов в startTime и endTime
    const getTimeFromHours = (hours: number) => {
        const startHour = 9; // Начинаем с 9:00
        const endHour = startHour + hours;
        return {
            startTime: `${startHour.toString().padStart(2, '0')}:00`,
            endTime: `${endHour.toString().padStart(2, '0')}:00`
        };
    };

    // Загружаем globalSettings при монтировании и при смене страны
    useEffect(() => {
        if (correctCountryId) {
            const countryIdString = correctCountryId.toString();
            console.log('Calling getGlobalSettings with country_id:', countryIdString);
            getGlobalSettings(countryIdString);
        }
    }, [correctCountryId, getGlobalSettings]);

    // Обновляем состояние когда приходят globalSettings для текущей страны
    useEffect(() => {
        if (currentCountrySettings) {
            console.log('Received globalSettings for current country:', currentCountrySettings);
            const hours = currentCountrySettings.hours_per_day;
            const workingDays = currentCountrySettings.working_days;

            if (hours && workingDays && Array.isArray(workingDays)) {
                setHoursPerDay(hours.toString());
                const newSchedule = convertWorkingDaysToSchedule(workingDays, hours);
                setSchedule(newSchedule);
            }
        }
    }, [currentCountrySettings]);

    // Обновляем schedule когда меняется config (только если нет currentCountrySettings)
    useEffect(() => {
        if (!currentCountrySettings) {
            setSchedule(initialSchedule);
            // Загружаем часы из первого рабочего дня
            const firstWorkingDay = Object.values(initialSchedule).find(day => day.isWorkingDay);
            if (firstWorkingDay) {
                const start = firstWorkingDay.startTime.split(':').map(Number);
                const end = firstWorkingDay.endTime.split(':').map(Number);
                const hours = end[0] - start[0];
                setHoursPerDay(hours.toString());
            }
        }
    }, [initialSchedule, currentCountrySettings]);

    const daysOfWeek = [
        { key: 'monday' as const, label: 'Monday', index: 0 },
        { key: 'tuesday' as const, label: 'Tuesday', index: 1 },
        { key: 'wednesday' as const, label: 'Wednesday', index: 2 },
        { key: 'thursday' as const, label: 'Thursday', index: 3 },
        { key: 'friday' as const, label: 'Friday', index: 4 },
        { key: 'saturday' as const, label: 'Saturday', index: 5 },
        { key: 'sunday' as const, label: 'Sunday', index: 6 }
    ];

    const handleToggleDay = (dayKey: keyof WeeklySchedule) => {
        setSchedule(prev => ({
            ...prev,
            [dayKey]: {
                ...prev[dayKey],
                isWorkingDay: !prev[dayKey].isWorkingDay,
                // Применяем общее время для нового рабочего дня
                ...(!prev[dayKey].isWorkingDay && getTimeFromHours(parseFloat(hoursPerDay)))
            }
        }));
    };

    const handleHoursChange = (value: string) => {
        setHoursPerDay(value);
        const hours = parseFloat(value);
        if (!isNaN(hours) && hours > 0) {
            const { startTime, endTime } = getTimeFromHours(hours);
            // Применяем новое время ко всем рабочим дням
            setSchedule(prev => {
                const newSchedule = { ...prev };
                daysOfWeek.forEach(day => {
                    if (newSchedule[day.key].isWorkingDay) {
                        newSchedule[day.key] = {
                            ...newSchedule[day.key],
                            startTime: startTime,
                            endTime: endTime
                        };
                    }
                });
                return newSchedule;
            });
        }
    };

    const handleSave = () => {
        if (!config?.id) {
            console.error('Cannot save: config.id is undefined');
            toast.error('Country ID not found');
            return;
        }

        // Конвертируем schedule в нужный формат
        const workingDays = convertToWorkingDaysArray(schedule);
        const hours = parseFloat(hoursPerDay);

        const globalSet = {
            hours_per_day: hours,
            working_days: workingDays
        };

        console.log('Отправляем на сервер:', {
            country_id: config.id.toString(),
            globalSet
        });

        setGlobalSettings(
            {
                country_id: config.id.toString(),
                globalSet: globalSet
            },
            {
                onSuccess: (response) => {
                    console.log('Успешно сохранено:', response);
                    toast.success('Schedule saved successfully');
                    // Обновляем локальное состояние через пропс
                    onUpdateWeeklySchedule(config.id, schedule);
                },
                onError: (error) => {
                    console.error('Ошибка при сохранении:', error);
                    toast.error('Failed to save schedule');
                }
            }
        );
    };

    const calculateStatistics = () => {
        const workDays = daysOfWeek.filter(day => schedule[day.key]?.isWorkingDay).length;
        const dayOffs = 7 - workDays;

        const hours = parseFloat(hoursPerDay);
        const totalHours = (hours * workDays).toFixed(1);

        return {
            workDays,
            dayOffs,
            hoursPerDay: hours.toFixed(1),
            totalHours
        };
    };

    const stats = calculateStatistics();

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Weekly Schedule Configuration
                </h3>
                <Button onClick={handleSave}>
                    <Save className="w-4 h-4 mr-2" />
                    Save Schedule
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Schedule Configuration */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-base">Work Days Configuration</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Hours Per Day Settings */}
                        <div className="p-4 bg-muted/30 rounded-lg space-y-3">
                            <Label className="font-semibold">Working Hours (applies to all working days)</Label>
                            <div className="space-y-1">
                                <Label className="text-xs">Hours per Day</Label>
                                <Input
                                    type="number"
                                    min="1"
                                    max="24"
                                    step="0.5"
                                    value={hoursPerDay}
                                    onChange={(e) => handleHoursChange(e.target.value)}
                                    className="h-8"
                                />
                            </div>
                        </div>

                        {/* Days Selection */}
                        <div className="space-y-3">
                            {daysOfWeek.map((day) => {
                                const daySchedule = schedule[day.key];

                                return (
                                    <div key={day.key} className="flex items-center justify-between p-3 border rounded-lg">
                                        <div className="flex flex-col">
                                            <span className="font-medium">{day.label}</span>
                                            <span className={`text-sm ${daySchedule?.isWorkingDay ? 'text-green-600' : 'text-red-600'}`}>
                                                {daySchedule?.isWorkingDay ? 'Working Day' : 'Day Off'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Switch
                                                checked={daySchedule?.isWorkingDay || false}
                                                onCheckedChange={() => handleToggleDay(day.key)}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* Statistics */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Schedule Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Working Days per Week:</span>
                                <span className="font-semibold">{stats.workDays} days</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Days Off per Week:</span>
                                <span className="font-semibold">{stats.dayOffs} days</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Hours per Day:</span>
                                <span className="font-semibold">{stats.hoursPerDay} hours</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Total Weekly Hours:</span>
                                <span className="font-semibold">{stats.totalHours} hours</span>
                            </div>
                        </div>

                        <div className="pt-4 border-t">
                            <h4 className="font-medium mb-2">Standard Patterns:</h4>
                            <div className="space-y-2">
                                <Button
                                    variant="outline"
                                    className="w-full justify-start"
                                    onClick={() => {
                                        handleHoursChange('8');
                                        setSchedule({
                                            ...defaultSchedule,
                                            monday: { ...defaultSchedule.monday, isWorkingDay: true, startTime: '09:00', endTime: '17:00' },
                                            tuesday: { ...defaultSchedule.tuesday, isWorkingDay: true, startTime: '09:00', endTime: '17:00' },
                                            wednesday: { ...defaultSchedule.wednesday, isWorkingDay: true, startTime: '09:00', endTime: '17:00' },
                                            thursday: { ...defaultSchedule.thursday, isWorkingDay: true, startTime: '09:00', endTime: '17:00' },
                                            friday: { ...defaultSchedule.friday, isWorkingDay: true, startTime: '09:00', endTime: '17:00' },
                                            saturday: { ...defaultSchedule.saturday, isWorkingDay: false, startTime: '09:00', endTime: '17:00' },
                                            sunday: { ...defaultSchedule.sunday, isWorkingDay: false, startTime: '09:00', endTime: '17:00' }
                                        });
                                    }}
                                >
                                    5-Day Week (8 hours)
                                </Button>
                                <Button
                                    variant="outline"
                                    className="w-full justify-start"
                                    onClick={() => {
                                        handleHoursChange('6');
                                        setSchedule({
                                            ...defaultSchedule,
                                            monday: { ...defaultSchedule.monday, isWorkingDay: true, startTime: '09:00', endTime: '15:00' },
                                            tuesday: { ...defaultSchedule.tuesday, isWorkingDay: true, startTime: '09:00', endTime: '15:00' },
                                            wednesday: { ...defaultSchedule.wednesday, isWorkingDay: true, startTime: '09:00', endTime: '15:00' },
                                            thursday: { ...defaultSchedule.thursday, isWorkingDay: true, startTime: '09:00', endTime: '15:00' },
                                            friday: { ...defaultSchedule.friday, isWorkingDay: true, startTime: '09:00', endTime: '15:00' },
                                            saturday: { ...defaultSchedule.saturday, isWorkingDay: false, startTime: '09:00', endTime: '15:00' },
                                            sunday: { ...defaultSchedule.sunday, isWorkingDay: false, startTime: '09:00', endTime: '15:00' }
                                        });
                                    }}
                                >
                                    5-Day Week (6 hours)
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}