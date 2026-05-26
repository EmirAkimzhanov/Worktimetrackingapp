import React, { useEffect, useState, useMemo } from "react";
import { Button } from "../../ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../../ui/table";
import { Badge } from "../../ui/badge";
import { Plus, Edit, Trash2, Calendar, Info } from "lucide-react";
import {
    CountryCalendarConfig,
    Holiday,
    WorkWeekend,
} from "../../../types/types";
import { HolidayDialog } from "./HolidayDialogProps ";
import { WorkWeekendDialog } from "./WorkWeekendDialogProps ";
import { format, parseISO, isValid } from "date-fns";
import {
    useDeleteCalendar,
    useEditCalendar,
    useGetCalendar,
    useGetHolidayTimeEntrys,
    useGetTimeEntrys,
    useSendCalendar,
} from "../../../hooks/useTimeEntry";
import { useUserStore } from "../../../store/UsersStore";
import { Calendar as CalendarType } from "../../../types/calendar";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "../../ui/alert-dialog";
import { toast } from "sonner@2.0.3";
import { useGetGlobalSettings } from "../../../hooks/useGlobalSettings";

interface CalendarHolidaysTabProps {
    config: CountryCalendarConfig;
    countryId: number;
    onAddHoliday: (countryId: number, holiday: Holiday) => void;
    onUpdateHoliday: (countryId: number, holiday: Holiday) => void;
    onDeleteHoliday: (countryId: number, holidayId: number) => void;
    onAddWorkWeekend: (countryId: number, workWeekend: WorkWeekend) => void;
    onDeleteWorkWeekend: (countryId: number, workWeekendId: number) => void;
}

export function CalendarHolidaysTab({
    config,
    countryId,
    onAddHoliday,
    onUpdateHoliday,
    onDeleteHoliday,
    onAddWorkWeekend,
    onDeleteWorkWeekend,
}: CalendarHolidaysTabProps) {
    const [isHolidayDialogOpen, setIsHolidayDialogOpen] = useState(false);
    const [isWorkWeekendDialogOpen, setIsWorkWeekendDialogOpen] = useState(false);
    const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);
    const [editingWorkWeekend, setEditingWorkWeekend] =
        useState<WorkWeekend | null>(null);
    const { mutate: getCalendar } = useGetCalendar();
    const { mutate: sendCalendar } = useSendCalendar();
    const calendar = useUserStore((state) => state.calendar);
    const { mutate: editCalendar } = useEditCalendar();
    const { mutate: deleteCalendar } = useDeleteCalendar();
    const { mutate: getGlobalSettings } = useGetGlobalSettings();
    const { mutate: getTimeEntrys } = useGetTimeEntrys();
    const { mutate: getHolidays } = useGetHolidayTimeEntrys();

    // Состояние для попапа подтверждения удаления
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<{
        id: number;
        name: string;
        type: "holiday" | "workWeekend";
    } | null>(null);



    // ✅ Безопасное преобразование calendar в массив
    const calendarArray = useMemo(() => {
        if (!calendar) return [];
        if (Array.isArray(calendar)) return calendar.filter(c => c && c !== null);
        if (typeof calendar === 'object') return Object.values(calendar).filter(c => c && c !== null);
        return [];
    }, [calendar]);


    useEffect(() => {
        getCalendar();
        // Загружаем time entries при монтировании
    }, [countryId]);

    const holidays = useMemo(() => {
        if (!calendarArray || calendarArray.length === 0 || !countryId) return [];

        return calendarArray
            .filter(
                (item) =>
                    item && item.day_type === "holiday" && item.country === countryId,
            )
            .map((item) => ({
                id: item.id,
                date: item.date && item.date.includes("-")
                    ? item.date
                    : `${new Date().getFullYear()}-${item.date?.padStart(5, "0") || ""}`,
                name: item.holiday_name || "Holiday",
                description: item.description,
                is_recurring: item.is_recurring || false,
                is_halfday: false,
                country_id: item.country,
            }));
    }, [calendarArray, countryId]);

    // ✅ Исправлено: используем calendarArray вместо calendar
    const workWeekends = useMemo(() => {
        if (!calendarArray || calendarArray.length === 0) return [];

        return calendarArray
            .filter(
                (item) =>
                    item && item.day_type === "working_weekend" &&
                    item.country === countryId,
            )
            .map((item) => ({
                id: item.id,
                date: item.date && item.date.includes("-")
                    ? item.date
                    : `${new Date().getFullYear()}-${item.date?.padStart(5, "0") || ""}`,
                description: item.description || "Working day",
                country_id: item.country,
            }));
    }, [calendarArray, countryId]);

    // Функция для форматирования даты
    const formatDate = (dateString: string) => {
        if (!dateString) return "Invalid date";

        try {
            let dateToParse = dateString;
            if (!dateString.includes("-")) {
                dateToParse = `${new Date().getFullYear()}-${dateString}`;
            }

            const date = parseISO(dateToParse);
            if (isValid(date)) {
                return format(date, "dd MMM yyyy");
            }
            return dateString;
        } catch {
            return dateString;
        }
    };

    // Функция для обновления всех данных после изменений
    const refreshAllData = () => {
        getCalendar(undefined, {
            onSuccess: () => {
                console.log("Calendar refreshed successfully");
            },
            onError: (error) => {
                console.error("Failed to refresh calendar:", error);
            }
        });

        getTimeEntrys(true, {
            onSuccess: (data) => {
                console.log("Time entries refreshed successfully:", data?.length);
            },
            onError: (error) => {
                console.error("Failed to refresh time entries:", error);
            }
        });
        getHolidays(true, {
            onSuccess: (data) => {
                console.log("Holidays refreshed successfully:", data?.length);
            },
            onError: (error) => {
                console.error("Failed to refresh holidays:", error);
            }
        });
    };

    // Функция удаления элемента календаря по day_id
    const deleteCalendarItem = (day_id: number) => {
        deleteCalendar(day_id, {
            onSuccess: () => {
                toast.success("Item deleted successfully");
                refreshAllData();
                setDeleteDialogOpen(false);
                setItemToDelete(null);
            },
            onError: (error) => {
                console.error("Error deleting calendar item:", error);
                toast.error("Failed to delete item");
                setDeleteDialogOpen(false);
                setItemToDelete(null);
            },
        });
    };

    // Обработчик открытия диалога подтверждения удаления
    const handleDeleteClick = (item: {
        id: number;
        name: string;
        type: "holiday" | "workWeekend";
    }) => {
        setItemToDelete(item);
        setDeleteDialogOpen(true);
    };

    // Обработчик подтверждения удаления
    const handleConfirmDelete = () => {
        if (itemToDelete) {
            deleteCalendarItem(itemToDelete.id);
        }
    };

    // Обработчик отмены удаления
    const handleCancelDelete = () => {
        setDeleteDialogOpen(false);
        setItemToDelete(null);
    };

    // Обработчик сохранения праздника
    const handleSaveHoliday = (holiday: Omit<Holiday, "id" | "country_id">) => {
        const calendarData = {
            input_date: holiday.date,
            holiday_name: holiday.name || null,
            day_type: "holiday" as const,
            description: holiday.description || "",
            is_recurring: holiday.is_recurring,
            country: countryId,
        };

        if (editingHoliday && editingHoliday.id) {
            editCalendar(
                {
                    body: calendarData,
                    day_id: editingHoliday.id.toString(),
                },
                {
                    onSuccess: () => {
                        onUpdateHoliday(countryId, {
                            ...holiday,
                            id: editingHoliday.id,
                            country_id: countryId,
                        });
                        refreshAllData();
                        toast.success("Holiday updated successfully");
                        setIsHolidayDialogOpen(false);
                        setEditingHoliday(null);
                    },
                    onError: (error) => {
                        console.error("Error updating holiday:", error);
                        toast.error("Failed to update holiday");
                    },
                },
            );
        } else {
            sendCalendar(calendarData, {
                onSuccess: () => {
                    onAddHoliday(countryId, {
                        ...holiday,
                        id: Date.now(),
                        country_id: countryId,
                    });
                    refreshAllData();
                    toast.success("Holiday added successfully");
                    setIsHolidayDialogOpen(false);
                    setEditingHoliday(null);
                },
                onError: (error) => {
                    console.error("Error creating holiday:", error);
                    toast.error("Failed to add holiday");
                },
            });
        }
    };

    const handleSaveWorkWeekend = (
        workWeekend: Omit<WorkWeekend, "id" | "country_id">,
    ) => {
        const calendarData = {
            input_date: workWeekend.date,
            holiday_name: null,
            day_type: "working_weekend" as const,
            description: workWeekend.description || "",
            is_recurring: false,
            country: countryId,
        };

        if (editingWorkWeekend && editingWorkWeekend.id) {
            editCalendar(
                {
                    body: calendarData,
                    day_id: editingWorkWeekend.id.toString(),
                },
                {
                    onSuccess: () => {
                        refreshAllData();
                        toast.success("Work weekend updated successfully");
                        setIsWorkWeekendDialogOpen(false);
                        setEditingWorkWeekend(null);
                    },
                    onError: (error) => {
                        console.error("Error updating work weekend:", error);
                    },
                },
            );
        } else {
            sendCalendar(calendarData, {
                onSuccess: () => {
                    onAddWorkWeekend(countryId, {
                        ...workWeekend,
                        id: Date.now(),
                        country_id: countryId,
                    });
                    refreshAllData();
                    toast.success("Work weekend added successfully");
                    setIsWorkWeekendDialogOpen(false);
                    setEditingWorkWeekend(null);
                },
                onError: (error) => {
                    console.error("Error creating work weekend:", error);
                    // toast.error("Failed to add work weekend");
                },
            });
        }
    };

    const handleDeleteHoliday = (countryId: number, holidayId: number) => {
        handleDeleteClick({
            id: holidayId,
            name: holidays.find((h) => h.id === holidayId)?.name || "Holiday",
            type: "holiday",
        });
    };

    const handleDeleteWorkWeekend = (
        countryId: number,
        workWeekendId: number,
    ) => {
        handleDeleteClick({
            id: workWeekendId,
            name: "Work weekend",
            type: "workWeekend",
        });
    };

    const handleEditCalendarItem = (item: CalendarType) => {
        if (item.day_type === "holiday") {
            setEditingHoliday({
                id: item.id,
                date: item.date,
                name: item.holiday_name || "",
                description: item.description,
                is_recurring: item.is_recurring,
                is_halfday: false,
                country_id: item.country,
            });
            setIsHolidayDialogOpen(true);
        } else if (item.day_type === "working_weekend") {
            setEditingWorkWeekend({
                id: item.id,
                date: item.date,
                description: item.description || "",
                country_id: item.country,
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
                    <Button size="sm" onClick={() => setIsHolidayDialogOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Holiday
                    </Button>
                </div>
            </div>

            {/* Holidays Table */}
            <div className="rounded-md border">
                <div className="px-4 py-3 border-b bg-gray-50 flex justify-between items-center">
                    <h4 className="font-medium">Holidays</h4>
                    <Badge variant="outline">{holidays.length} holiday(s)</Badge>
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
                                <TableCell
                                    colSpan={5}
                                    className="text-center py-8 text-muted-foreground"
                                >
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
                                            <span className="text-sm text-gray-400 italic">
                                                No description
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {holiday.is_recurring ? (
                                            <Badge
                                                variant="outline"
                                                className="border-green-200 text-green-700"
                                            >
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
                                                    const calendarItem = calendarArray?.find(
                                                        (item) =>
                                                            item && item.id === holiday.id &&
                                                            item.day_type === "holiday",
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
                                                onClick={() =>
                                                    handleDeleteHoliday(config.id, holiday.id)
                                                }
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
                    <Badge variant="outline">{workWeekends.length} work weekend(s)</Badge>
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
                                <TableCell
                                    colSpan={3}
                                    className="text-center py-6 text-muted-foreground"
                                >
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
                                            <span className="text-sm text-gray-400 italic">
                                                Working day
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    const calendarItem = calendarArray?.find(
                                                        (item) =>
                                                            item && item.id === workWeekend.id &&
                                                            item.day_type === "working_weekend",
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
                                                onClick={() =>
                                                    handleDeleteWorkWeekend(config.id, workWeekend.id)
                                                }
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

            {/* Диалог подтверждения удаления */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription asChild>
                            <div>
                                {itemToDelete && (
                                    <>
                                        This action cannot be undone. This will permanently delete{" "}
                                        <span className="font-semibold text-red-600">
                                            {itemToDelete.type === "holiday"
                                                ? itemToDelete.name
                                                : "this work weekend"}
                                        </span>{" "}
                                        from the calendar.
                                        <div className="mt-3 p-3 bg-red-50 rounded-md">
                                            <span className="text-sm text-red-700 font-medium">
                                                ⚠️ Warning: This change will affect all users and cannot be recovered.
                                            </span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={handleCancelDelete}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmDelete}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

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