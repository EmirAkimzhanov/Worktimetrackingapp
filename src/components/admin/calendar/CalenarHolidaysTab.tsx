// src/components/admin/CalendarHolidaysTab.tsx
import React, { useEffect, useState, useMemo } from 'react';
import { Button } from '../../ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import { Badge } from '../../ui/badge';
import { Plus, Edit, Trash2, Calendar, Info } from 'lucide-react';
import { CountryCalendarConfig, Holiday, WorkWeekend } from '../../../types/types';
import { HolidayDialog } from './HolidayDialogProps ';
import { WorkWeekendDialog } from './WorkWeekendDialogProps ';
import { format, parseISO, isValid } from 'date-fns';
import { useEditCalendar, useGetCalendar, useSendCalendar } from '../../../hooks/useTimeEntry';
import { useUserStore } from '../../../store/UsersStore';
import { Calendar as CalendarType } from '../../../types/calendar';

interface CalendarHolidaysTabProps {
    config: CountryCalendarConfig;
    onAddHoliday: (countryId: number, holiday: Holiday) => void;
    onUpdateHoliday: (countryId: number, holiday: Holiday) => void;
    onDeleteHoliday: (countryId: number, holidayId: number) => void;
    onAddWorkWeekend: (countryId: number, workWeekend: WorkWeekend) => void;
    onDeleteWorkWeekend: (countryId: number, workWeekendId: number) => void;
}

export function CalendarHolidaysTab({
    config,
    onAddHoliday,
    onUpdateHoliday,
    onDeleteHoliday,
    onAddWorkWeekend,
    onDeleteWorkWeekend
}: CalendarHolidaysTabProps) {
    const [isHolidayDialogOpen, setIsHolidayDialogOpen] = useState(false);
    const [isWorkWeekendDialogOpen, setIsWorkWeekendDialogOpen] = useState(false);
    const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);
    const [editingWorkWeekend, setEditingWorkWeekend] = useState<WorkWeekend | null>(null);
    const { mutate: getCalendar } = useGetCalendar();
    const { mutate: sendCalendar } = useSendCalendar();
    const calendar = useUserStore((state) => state.calendar);
    const countries = useUserStore((state) => state.countries);
    const { mutate: editCalendar } = useEditCalendar();

    useEffect(() => {
        getCalendar();
    }, []);

    // Находим правильный ID страны из списка стран
    const correctCountryId = useMemo(() => {
        if (!countries || !countries.length) {
            return config.id;
        }

        // Находим страну по названию или коду из config
        const country = countries.find(c =>
            c.name.toLowerCase() === config.country?.toLowerCase() ||
            c.code === config.countryCode ||
            c.id === config.id
        );

        return country?.id || config.id;
    }, [config, countries]);

    const holidays = useMemo(() => {
        if (!calendar) return [];

        return calendar
            .filter(item =>
                item.day_type === 'holiday' &&
                item.country === correctCountryId
            )
            .map(item => ({
                id: item.id,
                date: item.date.includes('-')
                    ? item.date
                    : `${new Date().getFullYear()}-${item.date.padStart(5, '0')}`,
                name: item.holiday_name || 'Holiday',
                description: item.description,
                is_recurring: item.is_recurring,
                is_halfday: false,
                country_id: item.country,
            }));
    }, [calendar, correctCountryId]);

    const workWeekends = useMemo(() => {
        if (!calendar) return [];

        return calendar
            .filter(item =>
                item.day_type === 'working_weekend' &&
                item.country === correctCountryId
            )
            .map(item => ({
                id: item.id,
                date: item.date.includes('-')
                    ? item.date
                    : `${new Date().getFullYear()}-${item.date.padStart(5, '0')}`,
                description: item.description || 'Working day',
                country_id: item.country,
            }));
    }, [calendar, correctCountryId]);

    // Функция для форматирования даты
    const formatDate = (dateString: string) => {
        try {
            let dateToParse = dateString;
            if (!dateString.includes('-')) {
                dateToParse = `${new Date().getFullYear()}-${dateString}`;
            }

            const date = parseISO(dateToParse);
            if (isValid(date)) {
                return format(date, 'dd MMM yyyy');
            }
            return dateString;
        } catch {
            return dateString;
        }
    };


    // Обработчик сохранения праздника
    const handleSaveHoliday = (holiday: Omit<Holiday, 'id' | 'country_id'>) => {
        // Преобразуем данные для API
        const calendarData = {
            input_date: holiday.date,
            holiday_name: holiday.name || null,
            day_type: 'holiday', // Фиксированное значение для праздников
            description: holiday.description || '',
            is_recurring: holiday.is_recurring,
            country: correctCountryId
        };

        // Если редактируем существующий праздник
        if (editingHoliday && editingHoliday.id) {
            // Используем editCalendar для обновления (PATCH)
            editCalendar({
                body: calendarData,
                day_id: editingHoliday.id.toString() // Добавляем ID для обновления
            }, {
                onSuccess: () => {
                    // Вызываем callback если нужно
                    onUpdateHoliday(correctCountryId, {
                        ...holiday,
                        id: editingHoliday.id,
                        country_id: correctCountryId
                    });
                    getCalendar(); // Обновляем данные календаря
                },
                onError: (error) => {
                    console.error("Error updating holiday:", error);
                }
            });
        } else {
            // Для создания нового праздника используем sendCalendar (POST)
            sendCalendar(calendarData, {
                onSuccess: () => {
                    // Вызываем callback если нужно
                    onAddHoliday(correctCountryId, {
                        ...holiday,
                        id: Date.now(), // временный ID для UI
                        country_id: correctCountryId
                    });
                    getCalendar(); // Обновляем данные календаря
                },
                onError: (error) => {
                    console.error("Error creating holiday:", error);
                }
            });
        }

        setIsHolidayDialogOpen(false);
        setEditingHoliday(null);
    };

    const handleSaveWorkWeekend = (
        workWeekend: Omit<WorkWeekend, 'id' | 'country_id'>
    ) => {
        console.log('editingWorkWeekend:', editingWorkWeekend);

        const calendarData = {
            input_date: workWeekend.date,
            holiday_name: null,
            day_type: 'working_weekend',
            description: workWeekend.description || '',
            is_recurring: false,
            country: correctCountryId
        };

        if (editingWorkWeekend && editingWorkWeekend.id) {
            editCalendar(
                {
                    body: calendarData,
                    day_id: editingWorkWeekend.id.toString()
                },
                {
                    onSuccess: () => {

                        getCalendar();
                    },
                    onError: (error) => {
                        console.error("Error updating work weekend:", error);
                    }
                }
            );
        } else {
            sendCalendar(calendarData, {
                onSuccess: () => {
                    onAddWorkWeekend(correctCountryId, {
                        ...workWeekend,
                        id: Date.now(),
                        country_id: correctCountryId
                    });

                    getCalendar();
                },
                onError: (error) => {
                    console.error("Error creating work weekend:", error);
                }
            });
        }

        setIsWorkWeekendDialogOpen(false);
        setEditingWorkWeekend(null);
    };


    const handleDeleteHoliday = (countryId: number, holidayId: number) => {
        onDeleteHoliday(correctCountryId, holidayId);
    };

    // Обработчик удаления рабочего выходного
    const handleDeleteWorkWeekend = (countryId: number, workWeekendId: number) => {
        // TODO: Нужен хук useDeleteCalendar для удаления
        // Пока вызываем callback
        onDeleteWorkWeekend(correctCountryId, workWeekendId);
    };

    const handleEditCalendarItem = (item: CalendarType) => {
        if (item.day_type === 'holiday') {
            setEditingHoliday({
                id: item.id,
                date: item.date,
                name: item.holiday_name || '',
                description: item.description,
                is_recurring: item.is_recurring,
                is_halfday: false,
                country_id: item.country
            });
            setIsHolidayDialogOpen(true);
        } else if (item.day_type === 'working_weekend') {
            setEditingWorkWeekend({
                id: item.id,
                date: item.date,
                description: item.description || '',
                country_id: item.country
            });
            setIsWorkWeekendDialogOpen(true);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-semibold">Holidays & Special Days</h3>
                    <p className="text-sm text-muted-foreground">
                        For: {config.country} ({config.countryCode})
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsWorkWeekendDialogOpen(true)}
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Work Weekend
                    </Button>
                    <Button
                        size="sm"
                        onClick={() => setIsHolidayDialogOpen(true)}
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Holiday
                    </Button>
                </div>
            </div>

            {/* Holidays Table */}
            <div className="rounded-md border">
                <div className="px-4 py-3 border-b bg-gray-50 flex justify-between items-center">
                    <h4 className="font-medium">Holidays</h4>
                    <Badge variant="outline">
                        {holidays.length} holiday(s)
                    </Badge>
                </div>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-32">Date</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead className="w-40">Description</TableHead>
                            <TableHead className="w-24">Recurring</TableHead>
                            <TableHead className="w-32 text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {holidays.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                    <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                    <p>No holidays configured for {config.country}</p>
                                </TableCell>
                            </TableRow>
                        ) : (
                            holidays.map((holiday) => (
                                <TableRow key={holiday.id}>
                                    <TableCell className="font-medium">
                                        {formatDate(holiday.date)}
                                    </TableCell>
                                    <TableCell>{holiday.name}</TableCell>
                                    <TableCell>
                                        {holiday.description ? (
                                            <div className="flex items-center gap-1">
                                                <Info className="h-3 w-3 text-gray-400" />
                                                <span className="text-sm text-gray-600 line-clamp-2">
                                                    {holiday.description}
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="text-sm text-gray-400 italic">No description</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {holiday.is_recurring ? (
                                            <Badge variant="outline" className="border-green-200 text-green-700">
                                                Annual
                                            </Badge>
                                        ) : (
                                            <span className="text-muted-foreground">No</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    const calendarItem = calendar?.find(item =>
                                                        item.id === holiday.id && item.day_type === 'holiday'
                                                    );
                                                    if (calendarItem) {
                                                        handleEditCalendarItem(calendarItem);
                                                    }
                                                }}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDeleteHoliday(config.id, holiday.id)}
                                            >
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Work Weekends Table */}
            <div className="rounded-md border">
                <div className="px-4 py-3 border-b bg-gray-50 flex justify-between items-center">
                    <h4 className="font-medium">Work Weekends (Special Working Days)</h4>
                    <Badge variant="outline">
                        {workWeekends.length} work weekend(s)
                    </Badge>
                </div>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-32">Date</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead className="w-32 text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {workWeekends.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center py-6 text-muted-foreground">
                                    No work weekends configured for {config.country}
                                </TableCell>
                            </TableRow>
                        ) : (
                            workWeekends.map((workWeekend) => (
                                <TableRow key={workWeekend.id}>
                                    <TableCell className="font-medium">
                                        {formatDate(workWeekend.date)}
                                    </TableCell>
                                    <TableCell>
                                        {workWeekend.description ? (
                                            <div className="flex items-center gap-1">
                                                <Info className="h-3 w-3 text-gray-400" />
                                                <span className="text-sm text-gray-600">
                                                    {workWeekend.description}
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="text-sm text-gray-400 italic">Working day</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    const calendarItem = calendar?.find(item =>
                                                        item.id === workWeekend.id && item.day_type === 'working_weekend'
                                                    );
                                                    if (calendarItem) {
                                                        handleEditCalendarItem(calendarItem);
                                                    }
                                                }}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDeleteWorkWeekend(config.id, workWeekend.id)}
                                            >
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Dialogs */}
            <HolidayDialog
                open={isHolidayDialogOpen}
                onOpenChange={(open: boolean) => {
                    if (!open) {
                        setEditingHoliday(null);
                    }
                    setIsHolidayDialogOpen(open);
                }}
                editingHoliday={editingHoliday}
                onSave={handleSaveHoliday}
            />

            <WorkWeekendDialog
                open={isWorkWeekendDialogOpen}
                onOpenChange={(open: boolean) => {
                    if (!open) {
                        setEditingWorkWeekend(null);
                    }
                    setIsWorkWeekendDialogOpen(open);
                }}
                editingWorkWeekend={editingWorkWeekend}
                onSave={handleSaveWorkWeekend}
            />
        </div>
    );
}