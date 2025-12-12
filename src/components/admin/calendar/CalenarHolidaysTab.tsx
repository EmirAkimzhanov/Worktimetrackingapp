// src/components/admin/CalendarHolidaysTab.tsx
import React, { useState } from 'react';
import { Button } from '../../ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import { Badge } from '../../ui/badge';
import { Plus, Edit, Trash2, Calendar } from 'lucide-react';
import { CountryCalendarConfig, Holiday, WorkWeekend } from '../../../types/types';
import { HolidayDialog } from './HolidayDialogProps ';
import { WorkWeekendDialog } from './WorkWeekendDialogProps ';
import { format } from 'date-fns';

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

    const handleSaveHoliday = (holiday: Omit<Holiday, 'id' | 'country_id'>) => {
        if (editingHoliday) {
            onUpdateHoliday(config.id, { ...holiday, id: editingHoliday.id, country_id: config.id });
        } else {
            onAddHoliday(config.id, {
                ...holiday,
                id: Date.now(),
                country_id: config.id
            });
        }
        setIsHolidayDialogOpen(false);
        setEditingHoliday(null);
    };

    const handleSaveWorkWeekend = (workWeekend: Omit<WorkWeekend, 'id' | 'country_id'>) => {
        if (editingWorkWeekend) {
            // Для обновления нужно создать новый объект
            onDeleteWorkWeekend(config.id, editingWorkWeekend.id);
            onAddWorkWeekend(config.id, {
                ...workWeekend,
                id: Date.now(),
                country_id: config.id
            });
        } else {
            onAddWorkWeekend(config.id, {
                ...workWeekend,
                id: Date.now(),
                country_id: config.id
            });
        }
        setIsWorkWeekendDialogOpen(false);
        setEditingWorkWeekend(null);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Holidays & Special Days</h3>
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
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-32">Date</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead className="w-32">Type</TableHead>
                            <TableHead className="w-24">Recurring</TableHead>
                            <TableHead className="w-32 text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {config.holidays.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                    <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                    <p>No holidays configured</p>
                                </TableCell>
                            </TableRow>
                        ) : (
                            config.holidays.map((holiday) => (
                                <TableRow key={holiday.id}>
                                    <TableCell className="font-medium">
                                        {format(new Date(holiday.date), 'dd MMM yyyy')}
                                    </TableCell>
                                    <TableCell>{holiday.name}</TableCell>
                                    <TableCell>
                                        <Badge variant={holiday.is_halfday ? "outline" : "default"}>
                                            {holiday.is_halfday ? 'Half Day' : 'Full Day'}
                                        </Badge>
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
                                                    setEditingHoliday(holiday);
                                                    setIsHolidayDialogOpen(true);
                                                }}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => onDeleteHoliday(config.id, holiday.id)}
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
                <div className="px-4 py-3 border-b bg-gray-50">
                    <h4 className="font-medium">Work Weekends (Special Working Days)</h4>
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
                        {config.workWeekends.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center py-6 text-muted-foreground">
                                    No work weekends configured
                                </TableCell>
                            </TableRow>
                        ) : (
                            config.workWeekends.map((workWeekend) => (
                                <TableRow key={workWeekend.id}>
                                    <TableCell className="font-medium">
                                        {format(new Date(workWeekend.date), 'dd MMM yyyy')}
                                    </TableCell>
                                    <TableCell>{workWeekend.description || 'Working day'}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    setEditingWorkWeekend(workWeekend);
                                                    setIsWorkWeekendDialogOpen(true);
                                                }}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => onDeleteWorkWeekend(config.id, workWeekend.id)}
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