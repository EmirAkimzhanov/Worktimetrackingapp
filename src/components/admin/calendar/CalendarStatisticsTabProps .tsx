import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { CountryCalendarConfig } from '../../../types/types';
import { Calendar, Clock, Info } from 'lucide-react';
import { useUserStore } from '../../../store/UsersStore';
import { format, parseISO, isValid } from 'date-fns';

interface CalendarStatisticsTabProps {
    config: CountryCalendarConfig;
}

export function CalendarStatisticsTab({ config }: CalendarStatisticsTabProps) {
    const calendar = useUserStore((state) => state.calendar);

    const calendarArray = useMemo(() => {
        if (!calendar) return [];
        if (Array.isArray(calendar)) return calendar.filter(c => c && c !== null);
        if (typeof calendar === 'object') return Object.values(calendar).filter(c => c && c !== null);
        return [];
    }, [calendar]);

    const holidays = useMemo(() =>
        calendarArray.filter(item => item.day_type === 'holiday' && item.country === config.id),
        [calendarArray, config.id]
    );

    const workWeekends = useMemo(() =>
        calendarArray.filter(item => item.day_type === 'working_weekend' && item.country === config.id),
        [calendarArray, config.id]
    );

    const weeklySchedule = config.weeklySchedule || {};
    const workingDaysPerWeek = Object.values(weeklySchedule).filter((d: any) => d?.isWorkingDay).length;

    const formatDate = (dateString: string) => {
        if (!dateString) return 'Unknown date';
        try {
            const date = parseISO(dateString);
            return isValid(date) ? format(date, 'dd MMM yyyy') : dateString;
        } catch {
            return dateString;
        }
    };

    return (
        <div className="space-y-6">
            <h3 className="text-lg font-semibold">Calendar Statistics</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Holidays</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{holidays.length}</div>
                        <p className="text-xs text-muted-foreground">Configured holidays</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Work Weekends</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{workWeekends.length}</div>
                        <p className="text-xs text-muted-foreground">Special working days</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Working Days/Week</CardTitle>
                        <Info className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{workingDaysPerWeek}</div>
                        <p className="text-xs text-muted-foreground">Days per week</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Holidays ({holidays.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {holidays.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No holidays configured</p>
                        ) : (
                            <ul className="space-y-2">
                                {holidays.map(h => (
                                    <li key={h.id} className="flex justify-between text-sm">
                                        <span className="font-medium">{h.holiday_name || 'Holiday'}</span>
                                        <span className="text-muted-foreground">{formatDate(h.date)}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Work Weekends ({workWeekends.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {workWeekends.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No work weekends configured</p>
                        ) : (
                            <ul className="space-y-2">
                                {workWeekends.map(w => (
                                    <li key={w.id} className="flex justify-between text-sm">
                                        <span className="font-medium">{w.description || 'Working day'}</span>
                                        <span className="text-muted-foreground">{formatDate(w.date)}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}