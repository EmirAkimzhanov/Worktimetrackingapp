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
import { useQueryClient } from '@tanstack/react-query';

interface CalendarWeeklyScheduleTabProps {
    config: CountryCalendarConfig;
    onUpdateWeeklySchedule: (countryId: number, schedule: WeeklySchedule) => void;
}

export function CalendarWeeklyScheduleTab({
    config,
    onUpdateWeeklySchedule
}: CalendarWeeklyScheduleTabProps) {

    const defaultSchedule: WeeklySchedule = {
        monday: { isWorkingDay: true, startTime: '09:00', endTime: '18:00' },
        tuesday: { isWorkingDay: true, startTime: '09:00', endTime: '18:00' },
        wednesday: { isWorkingDay: true, startTime: '09:00', endTime: '18:00' },
        thursday: { isWorkingDay: true, startTime: '09:00', endTime: '18:00' },
        friday: { isWorkingDay: true, startTime: '09:00', endTime: '18:00' },
        saturday: { isWorkingDay: false, startTime: '09:00', endTime: '18:00' },
        sunday: { isWorkingDay: false, startTime: '09:00', endTime: '18:00' }
    };

    const queryClient = useQueryClient();
    const { mutate: setGlobalSettings } = useSetGlobalSettings();

    const countries = useUserStore((state) => state.countries);

    const correctCountryId = useMemo(() => {
        if (!countries?.length) return config.id;

        const country = countries.find(
            (c) =>
                c.name.toLowerCase() === config.country?.toLowerCase() ||
                c.code === config.countryCode ||
                c.id === config.id
        );

        return country?.id || config.id;
    }, [config, countries]);

    // ✅ НОВЫЙ ХУК (useQuery)
    const { data: globalSettings } = useGetGlobalSettings(correctCountryId.toString());

    const initialSchedule = useMemo(() => {
        if (!config?.weeklySchedule) return defaultSchedule;

        return {
            ...defaultSchedule,
            ...config.weeklySchedule,
        };
    }, [config]);

    const [schedule, setSchedule] = useState<WeeklySchedule>(initialSchedule);
    const [hoursPerDay, setHoursPerDay] = useState('8');

    const getTimeFromHours = (hours: number) => {
        const startHour = 9;
        const endHour = startHour + hours;
        return {
            startTime: `${startHour.toString().padStart(2, '0')}:00`,
            endTime: `${endHour.toString().padStart(2, '0')}:00`
        };
    };

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

    // ✅ обновление из сервера
    useEffect(() => {
        if (globalSettings) {
            const hours = globalSettings.hours_per_day;
            const workingDays = globalSettings.working_days;

            if (hours && workingDays) {
                setHoursPerDay(hours.toString());
                setSchedule(convertWorkingDaysToSchedule(workingDays, hours));
            }
        }
    }, [globalSettings]);

    const handleToggleDay = (dayKey: keyof WeeklySchedule) => {
        setSchedule(prev => ({
            ...prev,
            [dayKey]: {
                ...prev[dayKey],
                isWorkingDay: !prev[dayKey].isWorkingDay,
                ...(!prev[dayKey].isWorkingDay && getTimeFromHours(parseFloat(hoursPerDay)))
            }
        }));
    };

    const handleHoursChange = (value: string) => {
        setHoursPerDay(value);
        const hours = parseFloat(value);

        if (!isNaN(hours)) {
            const { startTime, endTime } = getTimeFromHours(hours);

            setSchedule(prev => {
                const updated = { ...prev };
                Object.keys(updated).forEach((key) => {
                    const day = key as keyof WeeklySchedule;
                    if (updated[day].isWorkingDay) {
                        updated[day] = {
                            ...updated[day],
                            startTime,
                            endTime
                        };
                    }
                });
                return updated;
            });
        }
    };

    const handleSave = () => {
        const workingDays = convertToWorkingDaysArray(schedule);
        const hours = parseFloat(hoursPerDay);

        setGlobalSettings(
            {
                country_id: config.id.toString(),
                globalSet: {
                    hours_per_day: hours,
                    working_days: workingDays
                }
            },
            {
                onSuccess: () => {
                    toast.success('Saved');

                    onUpdateWeeklySchedule(config.id, schedule);

                    // ✅ ВОТ ЭТО ЗАМЕНА getGlobalSettings()
                    queryClient.invalidateQueries({
                        queryKey: ['globalSettings', config.id.toString()],
                    });
                },
                onError: () => {
                    toast.error('Error');
                }
            }
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between">
                <h3 className="flex items-center gap-2 font-semibold">
                    <Clock className="w-5 h-5" />
                    Weekly Schedule
                </h3>

                <Button onClick={handleSave}>
                    <Save className="w-4 h-4 mr-2" />
                    Save
                </Button>
            </div>

            <Card>
                <CardContent className="space-y-4 pt-4">
                    <Input
                        type="number"
                        value={hoursPerDay}
                        onChange={(e) => handleHoursChange(e.target.value)}
                    />

                    {Object.entries(schedule).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                            <span>{key}</span>
                            <Switch
                                checked={value.isWorkingDay}
                                onCheckedChange={() =>
                                    handleToggleDay(key as keyof WeeklySchedule)
                                }
                            />
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    );
}