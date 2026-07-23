import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
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
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    isWeekend,
    addMonths,
    subMonths,
    startOfDay,
    differenceInDays,
    isSameDay,
    isAfter,
    isBefore,
    getDay,
    setMonth,
    setYear,
    getMonth,
    getYear,
} from 'date-fns';

interface AttendanceRecord {
    id: number;
    full_name: string;
    department: string;
    position: string;
    grade: string;
    working_days: number;
    worked_days: number;
    worked_hours: number;
    weekends_holidays: number;
    paid_leaves: number;
    non_paid_leaves: number;
    business_trips: number;
    sick_leaves: number;
    day_offs: number;
    maternity_leave_days: number;
    skipped_days: number;
    [key: string]: string | number;
}

interface Country {
    id: number;
    name: string;
    code: string;
}

// ========== DATE RANGE PICKER ==========

interface DateRangePickerProps {
    startDate: Date | null;
    endDate: Date | null;
    onChange: (start: Date, end: Date) => void;
}

function DateRangePicker({ startDate, endDate, onChange }: DateRangePickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [viewMonth, setViewMonth] = useState(startDate || new Date());
    const [hoverDate, setHoverDate] = useState<Date | null>(null);
    const [selecting, setSelecting] = useState<'start' | 'end'>('start');
    const [tempStart, setTempStart] = useState<Date | null>(startDate);
    const [tempEnd, setTempEnd] = useState<Date | null>(endDate);
    const pickerRef = useRef<HTMLDivElement>(null);
    const isSelectingRef = useRef(false);

    const yearOptions = useMemo(() => {
        const currentYear = new Date().getFullYear();
        return Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);
    }, []);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
                if (!isSelectingRef.current) {
                    setIsOpen(false);
                }
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const daysInMonth = useMemo(() => {
        const start = startOfMonth(viewMonth);
        const end = endOfMonth(viewMonth);
        return eachDayOfInterval({ start, end });
    }, [viewMonth]);

    const firstDayOffset = useMemo(() => {
        const day = getDay(startOfMonth(viewMonth));
        return day === 0 ? 6 : day - 1;
    }, [viewMonth]);

    const handleDayClick = (date: Date) => {
        if (selecting === 'start') {
            setTempStart(date);
            setTempEnd(null);
            setSelecting('end');
        } else {
            if (tempStart) {
                let start = tempStart;
                let end = date;
                if (isBefore(end, start)) [start, end] = [end, start];
                if (differenceInDays(end, start) > 31) {
                    toast.error('Date range cannot exceed one month');
                    return;
                }
                setTempStart(start);
                setTempEnd(end);
                onChange(start, end);
                setSelecting('start');
                setIsOpen(false);
            }
        }
    };

    const isInRange = (date: Date) => {
        const s = tempStart;
        const e = tempEnd || hoverDate;
        if (!s || !e) return false;
        const [from, to] = isBefore(s, e) ? [s, e] : [e, s];
        return isAfter(date, from) && isBefore(date, to);
    };

    const isStartDay = (date: Date) => tempStart ? isSameDay(date, tempStart) : false;
    const isEndDay = (date: Date) => tempEnd ? isSameDay(date, tempEnd) : false;

    const getDisplayValue = () => {
        if (startDate && endDate) {
            return `${format(startDate, 'dd.MM.yyyy')} – ${format(endDate, 'dd.MM.yyyy')}`;
        }
        return 'Select date range';
    };

    const applyPreset = (start: Date, end: Date) => {
        onChange(start, end);
        setTempStart(start);
        setTempEnd(end);
        setIsOpen(false);
    };

    const handleYearChange = (year: string) => {
        const newDate = setYear(viewMonth, parseInt(year));
        setViewMonth(newDate);
    };

    const handleMonthChange = (month: string) => {
        const newDate = setMonth(viewMonth, parseInt(month));
        setViewMonth(newDate);
    };

    const weekDays = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
    const monthOptions = useMemo(() => {
        return Array.from({ length: 12 }, (_, i) => ({
            value: String(i),
            label: format(new Date(2000, i, 1), 'MMM')
        }));
    }, []);

    return (
        <div className="relative" ref={pickerRef}>
            <button
                onClick={() => {
                    setIsOpen(!isOpen);
                    setSelecting('start');
                    setTempStart(startDate);
                    setTempEnd(endDate);
                    if (startDate) setViewMonth(startDate);
                }}
                className="flex items-center gap-2 h-9 px-3 text-sm border rounded-md bg-white hover:bg-gray-50 w-full text-left"
            >
                <CalendarIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className={startDate ? 'text-gray-900' : 'text-gray-400'}>
                    {getDisplayValue()}
                </span>
            </button>

            {isOpen && (
                <div
                    className="absolute top-11 left-0 z-50 bg-white border rounded-xl shadow-xl p-4 w-[320px]"
                    onMouseDown={(e) => {
                        // Предотвращаем закрытие при клике внутри календаря
                        e.stopPropagation();
                    }}
                >
                    <div className="flex items-center gap-2 mb-3">
                        <Select
                            value={String(getYear(viewMonth))}
                            onValueChange={handleYearChange}
                            onOpenChange={(open) => {
                                isSelectingRef.current = open;
                            }}
                        >
                            <SelectTrigger
                                className="h-8 text-sm flex-1"
                                onMouseDown={(e) => e.stopPropagation()}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {yearOptions.map((year) => (
                                    <SelectItem
                                        key={year}
                                        value={String(year)}
                                        onMouseDown={(e) => e.stopPropagation()}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        {year}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select
                            value={String(getMonth(viewMonth))}
                            onValueChange={handleMonthChange}
                            onOpenChange={(open) => {
                                isSelectingRef.current = open;
                            }}
                        >
                            <SelectTrigger
                                className="h-8 text-sm flex-1"
                                onMouseDown={(e) => e.stopPropagation()}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {monthOptions.map((month) => (
                                    <SelectItem
                                        key={month.value}
                                        value={month.value}
                                        onMouseDown={(e) => e.stopPropagation()}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        {month.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Button
                            variant="outline"
                            size="sm"
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => {
                                e.stopPropagation();
                                setViewMonth(new Date());
                            }}
                            className="h-8 text-xs"
                        >
                            Today
                        </Button>
                    </div>

                    <div className="grid grid-cols-7 mb-1">
                        {weekDays.map(d => (
                            <div key={d} className="text-center text-[11px] text-gray-400 font-medium py-1">{d}</div>
                        ))}
                    </div>

                    <div className="grid grid-cols-7">
                        {Array.from({ length: firstDayOffset }).map((_, i) => <div key={`e-${i}`} />)}
                        {daysInMonth.map((date) => {
                            const weekend = isWeekend(date);
                            const inRange = isInRange(date);
                            const isS = isStartDay(date);
                            const isE = isEndDay(date);

                            let className = 'h-8 w-full text-xs flex items-center justify-center rounded transition-colors';

                            if (isS && isE) {
                                className += ' bg-blue-600 text-white hover:bg-blue-700';
                            } else if (isS) {
                                className += ' bg-blue-600 text-white rounded-l-full hover:bg-blue-700';
                            } else if (isE) {
                                className += ' bg-blue-600 text-white rounded-r-full hover:bg-blue-700';
                            } else if (inRange) {
                                className += ' bg-blue-100 text-blue-800 hover:bg-blue-200';
                            } else if (weekend) {
                                className += ' text-red-400 hover:bg-red-50';
                            } else {
                                className += ' text-gray-900 hover:bg-gray-100';
                            }

                            return (
                                <button
                                    key={date.toISOString()}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    onClick={() => handleDayClick(date)}
                                    onMouseEnter={() => selecting === 'end' && setHoverDate(date)}
                                    onMouseLeave={() => setHoverDate(null)}
                                    className={className}
                                >
                                    {format(date, 'd')}
                                </button>
                            );
                        })}
                    </div>

                    <div className="mt-3 pt-3 border-t text-xs text-gray-400 text-center">
                        {selecting === 'start' ? 'Click to select start date' : 'Click to select end date (max 1 month)'}
                    </div>

                    <div className="mt-2 flex flex-wrap gap-1">
                        <button
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => {
                                e.stopPropagation();
                                applyPreset(startOfMonth(new Date()), endOfMonth(new Date()));
                            }}
                            className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded"
                        >
                            This month
                        </button>
                        <button
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => {
                                e.stopPropagation();
                                const last = subMonths(new Date(), 1);
                                applyPreset(startOfMonth(last), endOfMonth(last));
                            }}
                            className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded"
                        >
                            Last month
                        </button>
                        <button
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => {
                                e.stopPropagation();
                                const today = new Date();
                                const day = getDay(today);
                                const diff = day === 0 ? 6 : day - 1;
                                const s = new Date(today);
                                s.setDate(today.getDate() - diff);
                                applyPreset(startOfDay(s), startOfDay(today));
                            }}
                            className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded"
                        >
                            This week
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// ========== HELPERS ==========

const getCellStyle = (value: string) => {
    const map: Record<string, string> = {
        'Е': 'bg-green-100 text-green-800',
        'Б': 'bg-red-100 text-red-800',
        'О': 'bg-yellow-100 text-yellow-800',
        'П': 'bg-red-200 text-red-900',
        'Р': 'bg-pink-100 text-pink-800',
        'К': 'bg-purple-100 text-purple-800',
        'А': 'bg-gray-100 text-gray-800',
        'ОБС': 'bg-orange-100 text-orange-800',
        'УР': 'bg-indigo-100 text-indigo-800',
        'У': 'bg-teal-100 text-teal-800',
        'ДО': 'bg-blue-100 text-blue-800',
        'ПР': 'bg-blue-200 text-blue-900',
    };
    return map[value] || 'bg-gray-50 text-gray-600';
};

const getStatusText = (value: string) => {
    const map: Record<string, string> = {
        'Е': 'Weekends & Holidays', 'Б': 'Sick Leave', 'О': 'Vacation',
        'П': 'Absenteeism', 'Р': 'Maternity Leave', 'К': 'Business Trip',
        'А': 'Unpaid Social Leave', 'ОБС': 'Unpaid Leave', 'УР': 'Childcare Leave',
        'У': 'Study/Training', 'ДО': 'Extra Leave', 'ПР': 'Public Holiday',
    };
    return map[value] || value;
};

const LEGEND = [
    { code: 'Е', label: 'Weekends & Holidays', color: 'bg-green-100' },
    { code: 'Б', label: 'Sick Leave', color: 'bg-red-100' },
    { code: 'О', label: 'Vacation', color: 'bg-yellow-100' },
    { code: 'П', label: 'Absenteeism', color: 'bg-red-200' },
    { code: 'Р', label: 'Maternity Leave', color: 'bg-pink-100' },
    { code: 'К', label: 'Business Trip', color: 'bg-purple-100' },
    { code: 'А', label: 'Unpaid Social Leave', color: 'bg-gray-100' },
    { code: 'ОБС', label: 'Unpaid Leave', color: 'bg-orange-100' },
    { code: 'УР', label: 'Childcare Leave', color: 'bg-indigo-100' },
    { code: 'У', label: 'Study/Training', color: 'bg-teal-100' },
    { code: 'ДО', label: 'Extra Leave', color: 'bg-blue-100' },
    { code: 'ПР', label: 'Public Holiday', color: 'bg-blue-200' },
];

// ========== MAIN COMPONENT ==========

export function AttendanceReports() {
    const [startDate, setStartDate] = useState<Date | null>(startOfMonth(new Date()));
    const [endDate, setEndDate] = useState<Date | null>(endOfMonth(new Date()));
    const [selectedCountryId, setSelectedCountryId] = useState<string>('');
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [rowsPerPage] = useState<number>(50);

    const attendance = useUserStore((state) => state.attendance);
    const attendanceCount = useUserStore((state) => state.attendance_count) || 0;
    const countries = useUserStore((state) => state.countries);
    const countriesArray: Country[] = Array.isArray(countries) ? countries : [];

    const dateParams = useMemo(() => ({
        start_date: startDate ? format(startDate, 'yyyy-MM-dd') : '',
        end_date: endDate ? format(endDate, 'yyyy-MM-dd') : '',
    }), [startDate, endDate]);

    const canSendRequest = useMemo(() => {
        return selectedCountryId !== '' && selectedCountryId !== 'all' && !!startDate && !!endDate;
    }, [selectedCountryId, startDate, endDate]);

    const { mutate, isPending: isLoading, data } = useGetTimeEntriesAttendance();

    const loadAttendance = useCallback(() => {
        if (!canSendRequest) {
            toast.info('Please select a country and date range');
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
        if (canSendRequest) loadAttendance();
    }, [loadAttendance, canSendRequest]);

    const rawData: AttendanceRecord[] = data?.results || (Array.isArray(attendance) ? attendance : []) || [];

    const daysInPeriod = useMemo(() => {
        if (!startDate || !endDate) return [];
        return eachDayOfInterval({ start: startDate, end: endDate });
    }, [startDate, endDate]);

    const selectedCountry = useMemo(() => countriesArray.find(c => String(c.id) === selectedCountryId), [countriesArray, selectedCountryId]);
    const totalPages = Math.ceil(attendanceCount / rowsPerPage);

    const handleDateRangeChange = (start: Date, end: Date) => {
        setStartDate(start);
        setEndDate(end);
        setCurrentPage(1);
    };

    const renderPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;
        let sp = Math.max(1, currentPage - Math.floor(maxVisible / 2));
        let ep = Math.min(totalPages, sp + maxVisible - 1);
        if (ep - sp + 1 < maxVisible) sp = Math.max(1, ep - maxVisible + 1);

        if (sp > 1) {
            pages.push(<Button key="1" variant="outline" size="sm" onClick={() => setCurrentPage(1)} disabled={isLoading} className="min-w-[32px] h-8">1</Button>);
            if (sp > 2) pages.push(<span key="e1" className="px-1 text-muted-foreground">...</span>);
        }
        for (let i = sp; i <= ep; i++) {
            pages.push(<Button key={i} variant={currentPage === i ? 'default' : 'outline'} size="sm" onClick={() => setCurrentPage(i)} disabled={isLoading} className="min-w-[32px] h-8">{i}</Button>);
        }
        if (ep < totalPages) {
            if (ep < totalPages - 1) pages.push(<span key="e2" className="px-1 text-muted-foreground">...</span>);
            pages.push(<Button key={totalPages} variant="outline" size="sm" onClick={() => setCurrentPage(totalPages)} disabled={isLoading} className="min-w-[32px] h-8">{totalPages}</Button>);
        }
        return pages;
    };

    const aggregationColumns = [
        { key: 'working_days', label: 'Working Days' },
        { key: 'worked_days', label: 'Worked Days' },
        { key: 'worked_hours', label: 'Worked Hours' },
        { key: 'weekends_holidays', label: 'Weekends & Holidays' },
        { key: 'paid_leaves', label: 'Paid Leaves' },
        { key: 'non_paid_leaves', label: 'Non-Paid Leaves' },
        { key: 'business_trips', label: 'Business Trips' },
        { key: 'sick_leaves', label: 'Sick Leaves' },
        { key: 'day_offs', label: 'Day Offs' },
        { key: 'maternity_leave_days', label: 'Maternity Leave' },
        { key: 'skipped_days', label: 'Skipped Days' },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Attendance Reports</h2>
                    <p className="text-muted-foreground">View attendance records by date range and country</p>
                </div>
                <Button variant="outline" size="sm" onClick={loadAttendance} disabled={isLoading || !canSendRequest}>
                    <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4" />
                        Filters
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-muted-foreground mb-1 block">Date Range * (max 1 month)</label>
                            <DateRangePicker startDate={startDate} endDate={endDate} onChange={handleDateRangeChange} />
                            {startDate && endDate && (
                                <p className="text-xs text-gray-500 mt-1">{differenceInDays(endDate, startDate) + 1} days selected</p>
                            )}
                        </div>

                        <div>
                            <label className="text-xs text-muted-foreground mb-1 block">Country *</label>
                            <Select value={selectedCountryId} onValueChange={setSelectedCountryId}>
                                <SelectTrigger className={`h-9 text-sm ${!selectedCountryId ? 'border-red-300' : ''}`}>
                                    <SelectValue placeholder="Select country" />
                                </SelectTrigger>
                                <SelectContent>
                                    {countriesArray.map(c => (
                                        <SelectItem key={c.id} value={String(c.id)}>{c.name} ({c.code})</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {!selectedCountryId && <p className="text-xs text-red-500 mt-1">Please select a country</p>}
                        </div>
                    </div>

                    {canSendRequest && selectedCountry && startDate && endDate && (
                        <div className="mt-4 p-2 bg-blue-50 rounded-md">
                            <p className="text-sm text-blue-700">
                                <span className="font-medium">Period:</span> {format(startDate, 'dd.MM.yyyy')} – {format(endDate, 'dd.MM.yyyy')}
                                <span className="mx-2">·</span>
                                <span className="font-medium">Country:</span> {selectedCountry.name} ({selectedCountry.code})
                                <span className="mx-2">·</span>
                                <span className="font-medium">Employees:</span> {rawData.length}
                            </p>
                        </div>
                    )}

                    <div className="flex gap-2 pt-4">
                        <Button size="sm" className="h-8" disabled={rawData.length === 0 || !canSendRequest}>
                            <Download className="w-3 h-3 mr-1" />
                            Export
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">
                            Attendance Records
                            <span className="text-sm font-normal text-muted-foreground ml-2">
                                ({rawData.length} employees, {daysInPeriod.length} days)
                            </span>
                        </CardTitle>
                        <div className="text-xs text-muted-foreground">Showing {rawData.length} employees</div>
                    </div>
                </CardHeader>
                <CardContent>
                    {!canSendRequest ? (
                        <div className="text-center py-8 text-sm text-muted-foreground">
                            <CalendarIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                            Please select a date range and country to view attendance records.
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
                                                <TableHead key={`h-${index}`} className={`text-xs text-center min-w-[36px] ${isWeekend(date) ? 'bg-red-50' : ''}`}>
                                                    <div className="flex flex-col items-center">
                                                        <span className="text-[10px] text-muted-foreground">{format(date, 'E')}</span>
                                                        <span className="font-medium">{format(date, 'dd')}</span>
                                                    </div>
                                                </TableHead>
                                            ))}
                                            {aggregationColumns.map((col) => (
                                                <TableHead key={col.key} className="text-xs text-center min-w-[80px] bg-gray-50">
                                                    {col.label}
                                                </TableHead>
                                            ))}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {rawData.map((record: AttendanceRecord, idx) => (
                                            <TableRow key={`row-${record.id}`} className="hover:bg-gray-50">
                                                <TableCell className="text-xs sticky left-0 bg-white z-10 text-center">{idx + 1}</TableCell>
                                                <TableCell className="text-xs sticky left-[40px] bg-white z-10 font-medium">{record.full_name}</TableCell>
                                                <TableCell className="text-xs sticky left-[220px] bg-white z-10">{record.department || '-'}</TableCell>
                                                <TableCell className="text-xs sticky left-[340px] bg-white z-10">{record.position || '-'}</TableCell>
                                                <TableCell className="text-xs sticky left-[460px] bg-white z-10">{record.grade || '-'}</TableCell>
                                                {daysInPeriod.map((date, dayIdx) => {
                                                    const dayNumber = format(date, 'd');
                                                    const value = String(record[dayNumber] || '');
                                                    const weekend = isWeekend(date);
                                                    const hasVal = value !== '' && value !== 'undefined';

                                                    return (
                                                        <TableCell
                                                            key={`c-${record.id}-${dayIdx}`}
                                                            className={`text-xs text-center p-1 ${weekend ? 'bg-red-50' : ''}`}
                                                            title={hasVal ? getStatusText(value) : ''}
                                                        >
                                                            {hasVal ? (
                                                                <span className={`font-bold text-[11px] px-1 py-0.5 rounded ${getCellStyle(value)}`}>
                                                                    {value}
                                                                </span>
                                                            ) : (
                                                                <span className="text-gray-300 text-[11px]">-</span>
                                                            )}
                                                        </TableCell>
                                                    );
                                                })}
                                                {aggregationColumns.map((col) => (
                                                    <TableCell key={`${record.id}-${col.key}`} className="text-xs text-center font-medium">
                                                        {record[col.key] !== undefined && record[col.key] !== null ? record[col.key] : '-'}
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
                                <span className="font-medium">Legend:</span>
                                {LEGEND.map(item => (
                                    <span key={item.code} className="flex items-center gap-1">
                                        <span className={`inline-block w-4 h-4 ${item.color} rounded border`}></span>
                                        <span>{item.code} — {item.label}</span>
                                    </span>
                                ))}
                            </div>

                            {totalPages > 1 && (
                                <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mt-4">
                                    <div className="text-xs text-muted-foreground">Page {currentPage} of {totalPages}</div>
                                    <div className="flex items-center gap-1">
                                        <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1 || isLoading} className="h-7 px-2">
                                            <ChevronLeft className="w-3 h-3" />
                                        </Button>
                                        <div className="flex gap-1">{renderPageNumbers()}</div>
                                        <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages || isLoading} className="h-7 px-2">
                                            <ChevronRight className="w-3 h-3" />
                                        </Button>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <span className="text-xs">Go to:</span>
                                        <input
                                            type="number" min={1} max={totalPages} value={currentPage}
                                            onChange={(e) => { const p = parseInt(e.target.value); if (!isNaN(p) && p >= 1 && p <= totalPages) setCurrentPage(p); }}
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