// src/components/admin/CalendarWeeklyScheduleTab.tsx
import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '../../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Label } from '../../ui/label';
import { Switch } from '../../ui/switch';
import { CountryCalendarConfig, WeeklySchedule } from '../../../types/types';
import { Save } from 'lucide-react';

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

    // Безопасно мерджим config.weeklySchedule с дефолтными значениями
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

    // Обновляем schedule когда меняется config
    useEffect(() => {
        setSchedule(initialSchedule);
    }, [initialSchedule]);

    const daysOfWeek = [
        { key: 'monday' as const, label: 'Monday' },
        { key: 'tuesday' as const, label: 'Tuesday' },
        { key: 'wednesday' as const, label: 'Wednesday' },
        { key: 'thursday' as const, label: 'Thursday' },
        { key: 'friday' as const, label: 'Friday' },
        { key: 'saturday' as const, label: 'Saturday' },
        { key: 'sunday' as const, label: 'Sunday' }
    ];

    const handleToggleDay = (dayKey: keyof WeeklySchedule) => {
        setSchedule(prev => ({
            ...prev,
            [dayKey]: {
                ...prev[dayKey],
                isWorkingDay: !prev[dayKey].isWorkingDay
            }
        }));
    };

    const handleSave = () => {
        if (config?.id) {
            onUpdateWeeklySchedule(config.id, schedule);
        } else {
            console.error('Cannot save: config.id is undefined');
        }
    };

    const calculateStatistics = () => {
        const workDays = daysOfWeek.filter(day => schedule[day.key]?.isWorkingDay).length;
        const dayOffs = 7 - workDays;

        return {
            workDays,
            dayOffs
        };
    };

    const stats = calculateStatistics();

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Weekly Schedule Configuration</h3>
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
                        </div>

                        <div className="pt-4 border-t">
                            <h4 className="font-medium mb-2">Standard Patterns:</h4>
                            <div className="space-y-2">
                                <Button
                                    variant="outline"
                                    className="w-full justify-start"
                                    onClick={() => {
                                        setSchedule({
                                            ...defaultSchedule,
                                            monday: { ...defaultSchedule.monday, isWorkingDay: true },
                                            tuesday: { ...defaultSchedule.tuesday, isWorkingDay: true },
                                            wednesday: { ...defaultSchedule.wednesday, isWorkingDay: true },
                                            thursday: { ...defaultSchedule.thursday, isWorkingDay: true },
                                            friday: { ...defaultSchedule.friday, isWorkingDay: true },
                                            saturday: { ...defaultSchedule.saturday, isWorkingDay: false },
                                            sunday: { ...defaultSchedule.sunday, isWorkingDay: false }
                                        });
                                    }}
                                >
                                    5-Day Week (Mon-Fri)
                                </Button>
                                <Button
                                    variant="outline"
                                    className="w-full justify-start"
                                    onClick={() => {
                                        setSchedule({
                                            ...defaultSchedule,
                                            monday: { ...defaultSchedule.monday, isWorkingDay: true },
                                            tuesday: { ...defaultSchedule.tuesday, isWorkingDay: true },
                                            wednesday: { ...defaultSchedule.wednesday, isWorkingDay: true },
                                            thursday: { ...defaultSchedule.thursday, isWorkingDay: true },
                                            friday: { ...defaultSchedule.friday, isWorkingDay: true },
                                            saturday: { ...defaultSchedule.saturday, isWorkingDay: true },
                                            sunday: { ...defaultSchedule.sunday, isWorkingDay: false }
                                        });
                                    }}
                                >
                                    6-Day Week (Mon-Sat)
                                </Button>
                                <Button
                                    variant="outline"
                                    className="w-full justify-start"
                                    onClick={() => {
                                        setSchedule({
                                            ...defaultSchedule,
                                            monday: { ...defaultSchedule.monday, isWorkingDay: true },
                                            tuesday: { ...defaultSchedule.tuesday, isWorkingDay: true },
                                            wednesday: { ...defaultSchedule.wednesday, isWorkingDay: true },
                                            thursday: { ...defaultSchedule.thursday, isWorkingDay: true },
                                            friday: { ...defaultSchedule.friday, isWorkingDay: true },
                                            saturday: { ...defaultSchedule.saturday, isWorkingDay: false },
                                            sunday: { ...defaultSchedule.sunday, isWorkingDay: true }
                                        });
                                    }}
                                >
                                    Flexible (Sun-Thu)
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}