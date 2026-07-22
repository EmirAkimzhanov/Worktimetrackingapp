import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Download, RefreshCw, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useGetTimeEntriesAttendance } from '../../../hooks/useTimeEntry';
import { useUserStore } from '../../../store/UsersStore';
import {
    format,
    startOfWeek,
    endOfWeek,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    isWeekend,
    startOfYear,
    endOfYear
} from 'date-fns';

interface AttendanceRecord {
    id: number;
    full_name: string;
    department: string;
    position: string;
    grade: string;
    [key: string]: string | number; // для динамических полей 1, 2, 3, ...
}

interface Country {
    id: number;
    name: string;
    code: string;
}

type PeriodType = 'month' | 'week';

export function AttendanceReports() {
    // Состояния для периода
    const [periodType, setPeriodType] = useState<PeriodType>('month');
    const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), 'yyyy-MM'));
    const [selectedWeek, setSelectedWeek] = useState<string>(() => {
        const now = new Date();
        const weekStart = startOfWeek(now, { weekStartsOn: 1 });
        return format(weekStart, 'yyyy-MM-dd');
    });
    const [selectedYear, setSelectedYear] = useState<string>(format(new Date(), 'yyyy'));

    // Выбор страны
    const [selectedCountryId, setSelectedCountryId] = useState<string>('');

    // Пагинация
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [rowsPerPage] = useState<number>(50);

    const attendance = useUserStore((state) => state.attendance);
    const attendanceCount = useUserStore((state) => state.attendance_count) || 0;
    const countries = useUserStore((state) => state.countries);

    const countriesArray: Country[] = Array.isArray(countries) ? countries : [];

    // Получение параметров для API
    const getDateParamsForAPI = useCallback(() => {
        const today = new Date();
        let start: Date;
        let end: Date;

        switch (periodType) {
            case 'month': {
                const [year, month] = selectedMonth.split('-').map(Number);
                start = new Date(year, month - 1, 1);
                end = new Date(year, month, 0);
                break;
            }
            case 'week': {
                const weekStart = new Date(selectedWeek);
                start = startOfWeek(weekStart, { weekStartsOn: 1 });
                end = endOfWeek(weekStart, { weekStartsOn: 1 });
                break;
            }
            case 'year': {
                const year = parseInt(selectedYear);
                start = startOfYear(new Date(year, 0, 1));
                end = endOfYear(new Date(year, 0, 1));
                break;
            }
            default:
                start = startOfMonth(today);
                end = endOfMonth(today);
        }

        return {
            start_date: format(start, 'yyyy-MM-dd'),
            end_date: format(end, 'yyyy-MM-dd')
        };
    }, [periodType, selectedMonth, selectedWeek, selectedYear]);

    const dateParams = useMemo(() => getDateParamsForAPI(), [getDateParamsForAPI]);

    const canSendRequest = useMemo(() => {
        return selectedCountryId !== '' && selectedCountryId !== 'all';
    }, [selectedCountryId]);

    const { mutate, isLoading, data } = useGetTimeEntriesAttendance();

    const loadAttendance = useCallback(() => {
        if (!canSendRequest) {
            toast.info('Please select a country to view attendance data');
            return;
        }

        mutate({
            page: currentPage,
            pageSize: rowsPerPage,
            start_date: dateParams.start_date,
            end_date: dateParams.end_date,
            country_id: selectedCountryId,
        });
    }, [mutate, currentPage, rowsPerPage, dateParams, selectedCountryId, canSendRequest]);

    useEffect(() => {
        if (canSendRequest) {
            loadAttendance();
        }
    }, [loadAttendance, canSendRequest]);

    // Получение данных - теперь это массив объектов с полями 1, 2, 3, ...
    const rawData: AttendanceRecord[] = data?.results || attendance || [];

    // Получение списка дней в периоде
    const getDaysInPeriod = useCallback(() => {
        const start = new Date(dateParams.start_date);
        const end = new Date(dateParams.end_date);
        return eachDayOfInterval({ start, end });
    }, [dateParams]);

    const daysInPeriod = getDaysInPeriod();

    // Получение выбранной страны
    const selectedCountry = useMemo(() => {
        return countriesArray.find(c => String(c.id) === selectedCountryId);
    }, [countriesArray, selectedCountryId]);

    const totalPages = Math.ceil(attendanceCount / rowsPerPage);

    // Экспорт в Excel
    const handleExportExcel = () => {
        toast.success('Exporting attendance reports...');
    };

    // Рендер страниц пагинации
    const renderPageNumbers = () => {
        const pages = [];
        const maxVisiblePages = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        if (startPage > 1) {
            pages.push(
                <Button key="page-1" variant="outline" size="sm" onClick={() => setCurrentPage(1)} disabled={isLoading} className="min-w-[32px] h-8 hidden sm:inline-flex">
                    1
                </Button>
            );
            if (startPage > 2) {
                pages.push(<span key="ellipsis-start" className="px-1 text-muted-foreground hidden sm:inline">...</span>);
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            pages.push(
                <Button
                    key={`page-${i}`}
                    variant={currentPage === i ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(i)}
                    disabled={isLoading}
                    className="min-w-[32px] h-8"
                >
                    {i}
                </Button>
            );
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                pages.push(<span key="ellipsis-end" className="px-1 text-muted-foreground hidden sm:inline">...</span>);
            }
            pages.push(
                <Button
                    key={`page-${totalPages}`}
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={isLoading}
                    className="min-w-[32px] h-8 hidden sm:inline-flex"
                >
                    {totalPages}
                </Button>
            );
        }

        return pages;
    };

    const getPeriodLabel = () => {
        switch (periodType) {
            case 'month': {
                const [year, month] = selectedMonth.split('-').map(Number);
                return format(new Date(year, month - 1, 1), 'MMMM yyyy');
            }
            case 'week': {
                const weekStart = new Date(selectedWeek);
                const start = startOfWeek(weekStart, { weekStartsOn: 1 });
                const end = endOfWeek(weekStart, { weekStartsOn: 1 });
                return `${format(start, 'dd MMM')} - ${format(end, 'dd MMM yyyy')}`;
            }
            case 'year': {
                return selectedYear;
            }
            default:
                return '';
        }
    };

    const isDayWeekend = (date: Date) => {
        return isWeekend(date);
    };

    // Проверка, есть ли значение в ячейке
    const hasValue = (value: any) => {
        return value !== '' && value !== null && value !== undefined;
    };

    // Получение цвета для ячейки
    const getCellStyle = (value: string) => {
        if (!hasValue(value)) {
            return 'bg-white text-gray-300';
        }
        if (value === 'Е') {
            return 'bg-green-100 text-green-800 font-bold';
        }
        if (value === 'Б') {
            return 'bg-red-100 text-red-800 font-bold';
        }
        if (value === 'О') {
            return 'bg-yellow-100 text-yellow-800 font-bold';
        }
        if (value === 'П') {
            return 'bg-blue-100 text-blue-800 font-bold';
        }
        return 'bg-gray-50 text-gray-600';
    };

    // Получение текста для статуса
    const getStatusText = (value: string) => {
        if (value === 'Е') return 'Present';
        if (value === 'Б') return 'Absent';
        if (value === 'О') return 'Vacation';
        if (value === 'П') return 'Holiday';
        return value;
    };

    return (
        <div className="space-y-6">
            {/* Заголовок */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Attendance Reports</h2>
                    <p className="text-muted-foreground">View attendance records by period and country</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={loadAttendance} disabled={isLoading || !canSendRequest}>
                        <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Карточка с фильтрами */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4" />
                        Filters
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="text-xs text-muted-foreground mb-1 block">Period Type</label>
                            <div className="flex gap-1">
                                <Button
                                    variant={periodType === 'month' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setPeriodType('month')}
                                    className="flex-1"
                                >
                                    Month
                                </Button>
                                <Button
                                    variant={periodType === 'week' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setPeriodType('week')}
                                    className="flex-1"
                                >
                                    Week
                                </Button>

                            </div>
                        </div>

                        <div>
                            <label className="text-xs text-muted-foreground mb-1 block">
                                {periodType === 'month' && 'Month'}
                                {periodType === 'week' && 'Week'}
                                {periodType === 'year' && 'Year'}
                            </label>
                            {periodType === 'month' && (
                                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                                    <SelectTrigger className="h-9 text-sm">
                                        <SelectValue placeholder="Select month" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Array.from({ length: 12 }, (_, i) => {
                                            const date = new Date(new Date().getFullYear(), i, 1);
                                            return {
                                                value: format(date, 'yyyy-MM'),
                                                label: format(date, 'MMMM yyyy')
                                            };
                                        }).map((month) => (
                                            <SelectItem key={month.value} value={month.value}>
                                                {month.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                            {periodType === 'week' && (
                                <Select value={selectedWeek} onValueChange={setSelectedWeek}>
                                    <SelectTrigger className="h-9 text-sm">
                                        <SelectValue placeholder="Select week" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Array.from({ length: 52 }, (_, i) => {
                                            const date = new Date();
                                            date.setDate(date.getDate() - (i * 7));
                                            const weekStart = startOfWeek(date, { weekStartsOn: 1 });
                                            const weekEnd = endOfWeek(date, { weekStartsOn: 1 });
                                            return {
                                                value: format(weekStart, 'yyyy-MM-dd'),
                                                label: `${format(weekStart, 'dd MMM')} - ${format(weekEnd, 'dd MMM yyyy')}`
                                            };
                                        }).map((week) => (
                                            <SelectItem key={week.value} value={week.value}>
                                                {week.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                            {periodType === 'year' && (
                                <Select value={selectedYear} onValueChange={setSelectedYear}>
                                    <SelectTrigger className="h-9 text-sm">
                                        <SelectValue placeholder="Select year" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Array.from({ length: 5 }, (_, i) => {
                                            const year = new Date().getFullYear() - i;
                                            return {
                                                value: String(year),
                                                label: String(year)
                                            };
                                        }).map((year) => (
                                            <SelectItem key={year.value} value={year.value}>
                                                {year.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>

                        <div>
                            <label className="text-xs text-muted-foreground mb-1 block">Country *</label>
                            <Select value={selectedCountryId} onValueChange={setSelectedCountryId}>
                                <SelectTrigger className="h-9 text-sm border-red-200">
                                    <SelectValue placeholder="Select country" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Countries</SelectItem>
                                    {countriesArray.map((country: Country) => (
                                        <SelectItem key={`country-${country.id}`} value={String(country.id)}>
                                            {country.name} ({country.code})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {!selectedCountryId && (
                                <p className="text-xs text-red-500 mt-1">Please select a country</p>
                            )}
                        </div>
                    </div>

                    {canSendRequest && selectedCountry && (
                        <div className="mt-4 p-2 bg-blue-50 rounded-md">
                            <p className="text-sm text-blue-700">
                                <span className="font-medium">Selected period:</span> {getPeriodLabel()}
                                <span className="ml-3">
                                    <span className="font-medium">Country:</span> {selectedCountry.name} ({selectedCountry.code})
                                </span>
                                <span className="ml-3">
                                    <span className="font-medium">Employees:</span> {rawData.length}
                                </span>
                            </p>
                        </div>
                    )}

                    <div className="flex gap-2 pt-4">
                        <Button onClick={handleExportExcel} size="sm" className="h-8" disabled={rawData.length === 0 || !canSendRequest}>
                            <Download className="w-3 h-3 mr-1" />
                            Export
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Результаты */}
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">
                            Attendance Records
                            <span className="text-sm font-normal text-muted-foreground ml-2">
                                ({rawData.length} employees, {daysInPeriod.length} days)
                            </span>
                        </CardTitle>
                        <div className="text-xs text-muted-foreground">
                            Showing {rawData.length} employees
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {!canSendRequest ? (
                        <div className="text-center py-8 text-sm text-muted-foreground">
                            <CalendarIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                            Please select a country to view attendance records.
                        </div>
                    ) : isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                            <span className="ml-2 text-sm">Loading...</span>
                        </div>
                    ) : rawData.length === 0 ? (
                        <div className="text-center py-8 text-sm text-muted-foreground">
                            <CalendarIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                            No attendance records found for the selected period and country.
                        </div>
                    ) : (
                        <>
                            <div className="rounded-md border overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-gray-50">
                                            <TableHead className="text-xs sticky left-0 bg-gray-50 z-10 min-w-[40px]">№</TableHead>
                                            <TableHead className="text-xs sticky left-[40px] bg-gray-50 z-10 min-w-[180px]">Full Name</TableHead>
                                            <TableHead className="text-xs sticky left-[220px] bg-gray-50 z-10 min-w-[120px]">Department</TableHead>
                                            <TableHead className="text-xs sticky left-[340px] bg-gray-50 z-10 min-w-[120px]">Position</TableHead>
                                            <TableHead className="text-xs sticky left-[460px] bg-gray-50 z-10 min-w-[100px]">Grade</TableHead>
                                            {daysInPeriod.map((date, index) => (
                                                <TableHead
                                                    key={`header-${index}`}
                                                    className={`text-xs text-center min-w-[36px] ${isDayWeekend(date) ? 'bg-red-50' : ''}`}
                                                >
                                                    <div className="flex flex-col items-center">
                                                        <span className="text-[10px] text-muted-foreground">
                                                            {format(date, 'E')}
                                                        </span>
                                                        <span className="font-medium">
                                                            {format(date, 'dd')}
                                                        </span>
                                                    </div>
                                                </TableHead>
                                            ))}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {rawData.map((record: AttendanceRecord, idx) => (
                                            <TableRow key={`row-${record.id}`} className="hover:bg-gray-50">
                                                <TableCell className="text-xs sticky left-0 bg-white z-10 text-center">
                                                    {idx + 1}
                                                </TableCell>
                                                <TableCell className="text-xs sticky left-[40px] bg-white z-10 font-medium">
                                                    {record.full_name}
                                                </TableCell>
                                                <TableCell className="text-xs sticky left-[220px] bg-white z-10">
                                                    {record.department || '-'}
                                                </TableCell>
                                                <TableCell className="text-xs sticky left-[340px] bg-white z-10">
                                                    {record.position || '-'}
                                                </TableCell>
                                                <TableCell className="text-xs sticky left-[460px] bg-white z-10">
                                                    {record.grade || '-'}
                                                </TableCell>
                                                {daysInPeriod.map((date, dayIdx) => {
                                                    const dayNumber = format(date, 'd');
                                                    const value = record[dayNumber] || '';
                                                    const isWeekend = isDayWeekend(date);

                                                    return (
                                                        <TableCell
                                                            key={`cell-${record.id}-${dayIdx}`}
                                                            className={`text-xs text-center p-1 ${isWeekend ? 'bg-red-50' : ''}`}
                                                            title={hasValue(value) ? getStatusText(value as string) : ''}
                                                        >
                                                            {hasValue(value) ? (
                                                                <span className={`font-bold ${getCellStyle(value as string)} px-1 rounded`}>
                                                                    {value}
                                                                </span>
                                                            ) : (
                                                                <span className="text-gray-300">-</span>
                                                            )}
                                                        </TableCell>
                                                    );
                                                })}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                                <div className="flex items-center gap-4 flex-wrap">
                                    <span>Legend:</span>
                                    <span className="flex items-center gap-1">
                                        <span className="inline-block w-4 h-4 bg-green-100 rounded border"></span>
                                        <span>Е - Present</span>
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <span className="inline-block w-4 h-4 bg-red-100 rounded border"></span>
                                        <span>Б - Absent</span>
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <span className="inline-block w-4 h-4 bg-yellow-100 rounded border"></span>
                                        <span>О - Vacation</span>
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <span className="inline-block w-4 h-4 bg-blue-100 rounded border"></span>
                                        <span>П - Holiday</span>
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <span className="inline-block w-4 h-4 bg-red-50 rounded border"></span>
                                        <span>Weekend</span>
                                    </span>
                                </div>
                                <div>
                                    Showing {rawData.length} employees
                                </div>
                            </div>

                            {totalPages > 1 && (
                                <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mt-4">
                                    <div className="text-xs text-muted-foreground">
                                        Page {currentPage} of {totalPages}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                            disabled={currentPage === 1 || isLoading}
                                            className="h-7 text-xs px-2"
                                        >
                                            <ChevronLeft className="w-3 h-3" />
                                        </Button>
                                        <div className="flex gap-1">{renderPageNumbers()}</div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                            disabled={currentPage === totalPages || isLoading}
                                            className="h-7 text-xs px-2"
                                        >
                                            <ChevronRight className="w-3 h-3" />
                                        </Button>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <span className="text-xs">Go to:</span>
                                        <input
                                            type="number"
                                            min={1}
                                            max={totalPages}
                                            value={currentPage}
                                            onChange={(e) => {
                                                const page = parseInt(e.target.value);
                                                if (!isNaN(page) && page >= 1 && page <= totalPages) {
                                                    setCurrentPage(page);
                                                }
                                            }}
                                            className="w-14 h-7 px-1 text-xs border rounded text-center"
                                            disabled={isLoading}
                                        />
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}