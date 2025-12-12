// src/components/admin/CalendarWeeklyScheduleTab.tsx
import React, { useState } from 'react';
import { Button } from '../../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Label } from '../../ui/label';
import { Input } from '../../ui/input';
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
    const [schedule, setSchedule] = useState(config.weeklySchedule);
    const [workHours, setWorkHours] = useState(config.weeklySchedule.workHoursPerDay.toString());

    const daysOfWeek = [
        { key: 'monday', label: 'Monday' },
        { key: 'tuesday', label: 'Tuesday' },
        { key: 'wednesday', label: 'Wednesday' },
        { key: 'thursday', label: 'Thursday' },
        { key: 'friday', label: 'Friday' },
        { key: 'saturday', label: 'Saturday' },
        { key: 'sunday', label: 'Sunday' }
    ] as const;

    const handleToggleDay = (dayKey: keyof WeeklySchedule) => {
        setSchedule(prev => ({
            ...prev,
            [dayKey]: !prev[dayKey]
        }));
    };

    const handleSave = () => {
        onUpdateWeeklySchedule(config.id, {
            ...schedule,
            workHoursPerDay: parseFloat(workHours) || 8
        });
    };

    const calculateStatistics = () => {
        const workDays = daysOfWeek.filter(day => schedule[day.key]).length;
        const weeklyHours = workDays * (parseFloat(workHours) || 8);

        return {
            workDays,
            weeklyHours,
            workHoursPerDay: parseFloat(workHours) || 8
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
                    <CardContent className="space-y-6">
                        <div className="space-y-4">
                            <Label>Daily Work Hours</Label>
                            <div className="flex items-center gap-4">
                                <Input
                                    type="number"
                                    min="1"
                                    max="24"
                                    step="0.5"
                                    value={workHours}
                                    onChange={(e) => setWorkHours(e.target.value)}
                                    className="w-32"
                                />
                                <span className="text-sm text-muted-foreground">hours per day</span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <Label>Working Days of the Week</Label>
                            <div className="space-y-3">
                                {daysOfWeek.map((day) => (
                                    <div key={day.key} className="flex items-center justify-between p-3 border rounded-lg">
                                        <span className="font-medium">{day.label}</span>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-sm ${schedule[day.key] ? 'text-green-600' : 'text-red-600'}`}>
                                                {schedule[day.key] ? 'Working Day' : 'Day Off'}
                                            </span>
                                            <Switch
                                                checked={schedule[day.key]}
                                                onCheckedChange={() => handleToggleDay(day.key)}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
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
                                <span className="text-sm text-muted-foreground">Hours per Day:</span>
                                <span className="font-semibold">{stats.workHoursPerDay} hours</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Weekly Total Hours:</span>
                                <span className="font-semibold">{stats.weeklyHours} hours</span>
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
                                            ...schedule,
                                            monday: true,
                                            tuesday: true,
                                            wednesday: true,
                                            thursday: true,
                                            friday: true,
                                            saturday: false,
                                            sunday: false
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
                                            ...schedule,
                                            monday: true,
                                            tuesday: true,
                                            wednesday: true,
                                            thursday: true,
                                            friday: true,
                                            saturday: true,
                                            sunday: false
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
                                            ...schedule,
                                            monday: true,
                                            tuesday: true,
                                            wednesday: true,
                                            thursday: true,
                                            friday: true,
                                            saturday: false,
                                            sunday: true
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