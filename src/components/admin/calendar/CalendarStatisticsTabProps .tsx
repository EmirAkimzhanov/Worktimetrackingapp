// src/components/admin/CalendarStatisticsTab.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { CountryCalendarConfig } from '../../../types/types';
import { Calendar, Clock, TrendingUp, Users } from 'lucide-react';

interface CalendarStatisticsTabProps {
    config: CountryCalendarConfig;
}

export function CalendarStatisticsTab({ config }: CalendarStatisticsTabProps) {
    // Проверяем наличие statistics и устанавливаем значения по умолчанию
    const stats = config.statistics || {
        yearlyWorkDays: 0,
        yearlyHours: 0,
        daysInWeek: 0,
        hoursInWeek: 0,
        vacationDays: 0,
        lastUpdated: new Date().toISOString()
    };

    // Проверяем наличие holidays
    const holidays = config.holidays || [];

    // Проверяем наличие workWeekends
    const workWeekends = config.workWeekends || [];

    return (
        <div className="space-y-6">
            <h3 className="text-lg font-semibold">Calendar Statistics</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Yearly Work Days</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.yearlyWorkDays || 0}</div>
                        <p className="text-xs text-muted-foreground">Days per year</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Yearly Hours</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.yearlyHours || 0}</div>
                        <p className="text-xs text-muted-foreground">Hours per year</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Weekly Schedule</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.daysInWeek || 0}/{stats.hoursInWeek || 0}</div>
                        <p className="text-xs text-muted-foreground">Days/Hours per week</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Vacation Days</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.vacationDays || 0}</div>
                        <p className="text-xs text-muted-foreground">Standard vacation</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Yearly Calculation</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="flex justify-between">
                            <span>Total calendar days:</span>
                            <span className="font-medium">365</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Weekends (calculated):</span>
                            <span className="font-medium">{104} days</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Holidays (configured):</span>
                            <span className="font-medium">{holidays.length} days</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t">
                            <span className="font-semibold">Available work days:</span>
                            <span className="font-semibold">{stats.yearlyWorkDays || 0} days</span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Recent Changes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            Last updated: {stats.lastUpdated
                                ? new Date(stats.lastUpdated).toLocaleDateString()
                                : 'Never'
                            }
                        </p>
                        {workWeekends.length > 0 && (
                            <div className="mt-4">
                                <p className="text-sm font-medium mb-2">Special work days:</p>
                                <ul className="text-sm space-y-1">
                                    {workWeekends.slice(0, 3).map((ww) => (
                                        <li key={ww.id} className="text-muted-foreground">
                                            {ww.date ? new Date(ww.date).toLocaleDateString() : 'Unknown date'}: {ww.description || 'Working day'}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {workWeekends.length === 0 && (
                            <p className="text-sm text-muted-foreground mt-4">No special work days configured</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}