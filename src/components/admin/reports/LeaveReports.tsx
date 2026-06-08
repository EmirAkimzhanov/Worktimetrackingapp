import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Download, Filter, RefreshCw, ChevronLeft, ChevronRight, X, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { useGetLeaves } from '../../../hooks/useReport';
import { useUserStore } from '../../../store/UsersStore';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { api } from '../../../consts/api';

interface LeaveDocument {
    id: number;
    name: string;
    url: string;
}

interface LeaveRecord {
    date: string;
    user_email: string;
    user_country_code: string;
    user_department: string;
    position: string;
    detailed_grade: string;
    task_type: string;
    task: string;
    hours: number;
    description: string;
    leave_document: LeaveDocument | null;
}

interface DateRange {
    start: string;
    end: string;
}

interface Position {
    id: number;
    name: string;
    position: number;
    short_name: string;
}

interface Grade {
    id: number;
    name: string;
    position: number;
    short_name: string;
}

interface Country {
    id: number;
    name: string;
    code: string;
}

export function LeaveReports() {
    // Состояния для фильтров дат
    const [dateType, setDateType] = useState<string>('thisMonth');
    const [customDateRange, setCustomDateRange] = useState<DateRange>({
        start: format(new Date(), 'yyyy-MM-dd'),
        end: format(new Date(), 'yyyy-MM-dd')
    });
    const [specificDate, setSpecificDate] = useState<string>('');

    // Фильтры (select)
    const [selectedUserDepartment, setSelectedUserDepartment] = useState<string>('all');
    const [selectedUserCountryCode, setSelectedUserCountryCode] = useState<string>('all');
    const [selectedPosition, setSelectedPosition] = useState<string>('all');
    const [selectedDetailedGrade, setSelectedDetailedGrade] = useState<string>('all');
    const [selectedLeaveType, setSelectedLeaveType] = useState<string>('all');
    const [selectedTaskName, setSelectedTaskName] = useState<string>('all');

    // Поиски (input)
    const [searchUserEmail, setSearchUserEmail] = useState<string>('');
    const [searchDescription, setSearchDescription] = useState<string>('');
    const [searchTaskName, setSearchTaskName] = useState<string>('');

    // Пагинация
    const [rowsPerPage] = useState<number>(30);
    const [currentPage, setCurrentPage] = useState<number>(1);

    const store_departments = useUserStore((state) => state.departments);
    const leaves_reports = useUserStore((state) => state.leaves_reports);

    // Данные из store для фильтров с безопасной проверкой на null
    const countries = useUserStore((state) => state.countries);
    const positions = useUserStore((state) => state.positions);
    const grades = useUserStore((state) => state.user_grades);

    // Безопасное получение массивов
    const countriesArray = Array.isArray(countries) ? countries : [];
    const positionsArray = Array.isArray(positions) ? positions : [];
    const gradesArray = Array.isArray(grades) ? grades : [];
    const departmentsArray = Array.isArray(store_departments)
        ? store_departments
        : (store_departments ? Object.values(store_departments) : []);

    // Получение параметров дат для API
    const getDateParamsForAPI = useCallback(() => {
        if (dateType === 'specificDate') {
            return { date: specificDate };
        }

        const today = new Date();
        let start: Date;
        let end: Date;

        switch (dateType) {
            case 'today':
                start = new Date(today);
                end = new Date(today);
                break;
            case 'thisWeek':
                start = startOfWeek(today, { weekStartsOn: 1 });
                end = endOfWeek(today, { weekStartsOn: 1 });
                break;
            case 'thisMonth':
                start = startOfMonth(today);
                end = endOfMonth(today);
                break;
            case 'lastMonth':
                const lastMonth = subMonths(today, 1);
                start = startOfMonth(lastMonth);
                end = endOfMonth(lastMonth);
                break;
            case 'custom':
                start = new Date(customDateRange.start);
                end = new Date(customDateRange.end);
                break;
            default:
                start = startOfMonth(today);
                end = endOfMonth(today);
        }

        return {
            start_date: format(start, 'yyyy-MM-dd'),
            end_date: format(end, 'yyyy-MM-dd')
        };
    }, [dateType, customDateRange, specificDate]);

    // Формируем параметры для запроса
    const dateParams = getDateParamsForAPI();

    // ХУК ВЫЗЫВАЕТСЯ ВСЕГДА В ОДНОМ МЕСТЕ (не внутри условий)
    const { isLoading, refetch } = useGetLeaves({
        page: currentPage,
        page_size: rowsPerPage,
        start_date: dateParams.start_date,
        end_date: dateParams.end_date,
        date: dateParams.date,
        user_department: selectedUserDepartment !== 'all' ? selectedUserDepartment : undefined,
        user_country_code: selectedUserCountryCode !== 'all' ? selectedUserCountryCode : undefined,
        position: selectedPosition !== 'all' ? selectedPosition : undefined,
        detailed_grade: selectedDetailedGrade !== 'all' ? selectedDetailedGrade : undefined,
        leave_type: selectedLeaveType !== 'all' ? selectedLeaveType : undefined,
        task_name: selectedTaskName !== 'all' ? selectedTaskName : undefined,
        user_email: searchUserEmail || undefined,
        description: searchDescription || undefined,
        task_name_search: searchTaskName || undefined,
    });

    // Сброс всех фильтров
    const resetFilters = () => {
        setDateType('thisMonth');
        setCustomDateRange({
            start: format(new Date(), 'yyyy-MM-dd'),
            end: format(new Date(), 'yyyy-MM-dd')
        });
        setSpecificDate('');
        setSelectedUserDepartment('all');
        setSelectedUserCountryCode('all');
        setSelectedPosition('all');
        setSelectedDetailedGrade('all');
        setSelectedLeaveType('all');
        setSelectedTaskName('all');
        setSearchUserEmail('');
        setSearchDescription('');
        setSearchTaskName('');
        setCurrentPage(1);
        toast.success('All filters reset');
    };

    // Экспорт в Excel
    const handleExportExcel = () => {
        toast.success('Exporting leave reports...');
        // TODO: Реализовать экспорт
    };

    // Скачивание документа
    const handleDownloadDocument = async (leaveDoc: LeaveDocument) => {
        if (!leaveDoc || !leaveDoc.url) {
            toast.error('No document available');
            return;
        }

        try {
            const token = useUserStore.getState().access_token;
            const baseUrl = `${window.location.origin}`;

            let fileUrl = leaveDoc.url;
            if (!fileUrl.startsWith('http')) {
                const cleanBaseUrl = baseUrl.replace(/\/$/, '');
                const cleanFileUrl = fileUrl.replace(/^\//, '');
                fileUrl = `${cleanBaseUrl}/${cleanFileUrl}`;
            }

            const response = await fetch(fileUrl, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to download document');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = window.document.createElement('a');
            link.href = url;
            link.download = leaveDoc.name;
            window.document.body.appendChild(link);
            link.click();
            window.URL.revokeObjectURL(url);
            window.document.body.removeChild(link);
            toast.success('Document downloaded successfully');
        } catch (error) {
            console.error('Download error:', error);
            toast.error('Failed to download document');
        }
    };

    // Открытие документа в новой вкладке
    const handleViewDocument = (leaveDoc: LeaveDocument) => {
        if (!leaveDoc || !leaveDoc.url) {
            toast.error('No document available');
            return;
        }

        const token = useUserStore.getState().access_token;
        const baseUrl = `${window.location.origin}`;

        let fileUrl = leaveDoc.url;
        if (!fileUrl.startsWith('http')) {
            const cleanBaseUrl = baseUrl.replace(/\/$/, '');
            const cleanFileUrl = fileUrl.replace(/^\//, '');
            fileUrl = `${cleanBaseUrl}/${cleanFileUrl}`;
        }

        window.open(`${fileUrl}?token=${token}`, '_blank');
    };

    const showCustomDates = dateType === 'custom';
    const showSpecificDate = dateType === 'specificDate';
    const leaveData = leaves_reports?.leaves || [];
    const totalCount = leaves_reports?.total_count || 0;
    const totalPages = Math.ceil(totalCount / rowsPerPage);

    // Получаем уникальные значения для фильтров из данных (как запасной вариант)
    const getUniquePositionsFromData = () => {
        const uniquePositions = new Set<string>();
        leaveData.forEach(record => {
            if (record.position) uniquePositions.add(record.position);
        });
        return Array.from(uniquePositions);
    };

    const getUniqueGradesFromData = () => {
        const uniqueGrades = new Set<string>();
        leaveData.forEach(record => {
            if (record.detailed_grade) uniqueGrades.add(record.detailed_grade);
        });
        return Array.from(uniqueGrades);
    };

    const getUniqueTasks = () => {
        const tasks = new Set<string>();
        leaveData.forEach(record => {
            if (record.task) tasks.add(record.task);
        });
        return Array.from(tasks);
    };

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
                <Button key="page-1" variant="outline" size="sm" onClick={() => setCurrentPage(1)} disabled={isLoading} className="min-w-[32px] h-8 hidden sm:inline-flex">1</Button>
            );
            if (startPage > 2) pages.push(<span key="ellipsis-start" className="px-1 text-muted-foreground hidden sm:inline">...</span>);
        }

        for (let i = startPage; i <= endPage; i++) {
            pages.push(
                <Button key={`page-${i}`} variant={currentPage === i ? "default" : "outline"} size="sm" onClick={() => setCurrentPage(i)} disabled={isLoading} className="min-w-[32px] h-8">
                    {i}
                </Button>
            );
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) pages.push(<span key="ellipsis-end" className="px-1 text-muted-foreground hidden sm:inline">...</span>);
            pages.push(
                <Button key={`page-${totalPages}`} variant="outline" size="sm" onClick={() => setCurrentPage(totalPages)} disabled={isLoading} className="min-w-[32px] h-8 hidden sm:inline-flex">
                    {totalPages}
                </Button>
            );
        }

        return pages;
    };

    return (
        <div className="space-y-6">
            {/* Заголовок */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Leave Reports</h2>
                    <p className="text-muted-foreground">Generate and export detailed leave reports</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
                    <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            {/* Карточка с фильтрами */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Filter className="w-4 h-4" />
                        Filters & Search
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {/* Основная сетка фильтров */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 mb-4">
                        {/* Date Range */}
                        <div key="filter-date-range">
                            <Select value={dateType || "all"} onValueChange={setDateType}>
                                <SelectTrigger className="h-9 text-sm">
                                    <SelectValue placeholder="Date Range" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="today">Today</SelectItem>
                                    <SelectItem value="thisWeek">This Week</SelectItem>
                                    <SelectItem value="thisMonth">This Month</SelectItem>
                                    <SelectItem value="lastMonth">Last Month</SelectItem>
                                    <SelectItem value="custom">Custom Range</SelectItem>
                                    <SelectItem value="specificDate">Specific Date</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* User Department */}
                        <div key="filter-department">
                            <Select value={selectedUserDepartment || "all"} onValueChange={setSelectedUserDepartment}>
                                <SelectTrigger className="h-9 text-sm">
                                    <SelectValue placeholder="Department" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Departments</SelectItem>
                                    {departmentsArray.map((dept: any) => (
                                        <SelectItem key={`dept-${dept.id}`} value={dept.name}>
                                            {dept.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* User Country - используем данные из store */}
                        <div key="filter-country">
                            <Select value={selectedUserCountryCode || "all"} onValueChange={setSelectedUserCountryCode}>
                                <SelectTrigger className="h-9 text-sm">
                                    <SelectValue placeholder="Country" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Countries</SelectItem>
                                    {countriesArray.map((country: Country) => (
                                        <SelectItem key={`country-${country.id}`} value={country.code}>
                                            {country.name} ({country.code})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Position - используем данные из store */}
                        <div key="filter-position">
                            <Select value={selectedPosition || "all"} onValueChange={setSelectedPosition}>
                                <SelectTrigger className="h-9 text-sm">
                                    <SelectValue placeholder="Position" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Positions</SelectItem>
                                    {positionsArray.map((pos: Position) => (
                                        <SelectItem key={`pos-${pos.id}`} value={pos.name}>
                                            {pos.name}
                                        </SelectItem>
                                    ))}
                                    {/* Запасной вариант из данных, если в store пусто */}
                                    {positionsArray.length === 0 && getUniquePositionsFromData().map((pos) => (
                                        <SelectItem key={`pos-data-${pos}`} value={pos}>
                                            {pos}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Grade - используем данные из store */}
                        <div key="filter-grade">
                            <Select value={selectedDetailedGrade || "all"} onValueChange={setSelectedDetailedGrade}>
                                <SelectTrigger className="h-9 text-sm">
                                    <SelectValue placeholder="Grade" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Grades</SelectItem>
                                    {gradesArray.map((grade: Grade) => (
                                        <SelectItem key={`grade-${grade.id}`} value={grade.name}>
                                            {grade.name}
                                        </SelectItem>
                                    ))}
                                    {/* Запасной вариант из данных, если в store пусто */}
                                    {gradesArray.length === 0 && getUniqueGradesFromData().map((grade) => (
                                        <SelectItem key={`grade-data-${grade}`} value={grade}>
                                            {grade}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Leave Type */}
                        <div key="filter-leave-type">
                            <Select value={selectedLeaveType || "all"} onValueChange={setSelectedLeaveType}>
                                <SelectTrigger className="h-9 text-sm">
                                    <SelectValue placeholder="Leave Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Types</SelectItem>
                                    <SelectItem value="Leave">Leave</SelectItem>
                                    <SelectItem value="Sick Leave">Sick Leave</SelectItem>
                                    <SelectItem value="Annual Leave">Annual Leave</SelectItem>
                                    <SelectItem value="Unpaid Leave">Unpaid Leave</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Task Name Select */}
                        <div key="filter-task">
                            <Select value={selectedTaskName || "all"} onValueChange={setSelectedTaskName}>
                                <SelectTrigger className="h-9 text-sm">
                                    <SelectValue placeholder="Task" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Tasks</SelectItem>
                                    {getUniqueTasks().map((task) => (
                                        <SelectItem key={`task-${task}`} value={task}>
                                            {task}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Task Name Search */}
                        <div key="filter-task-search">
                            <Input
                                className="h-9 text-sm"
                                placeholder="Task name search"
                                value={searchTaskName}
                                onChange={(e) => setSearchTaskName(e.target.value)}
                            />
                        </div>

                        {/* User Email Search */}
                        <div key="filter-email">
                            <Input
                                className="h-9 text-sm"
                                placeholder="Email search"
                                value={searchUserEmail}
                                onChange={(e) => setSearchUserEmail(e.target.value)}
                            />
                        </div>

                        {/* Description Search */}
                        <div key="filter-description">
                            <Input
                                className="h-9 text-sm"
                                placeholder="Description search"
                                value={searchDescription}
                                onChange={(e) => setSearchDescription(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Specific Date Input - отдельная строка с отступами */}
                    {showSpecificDate && (
                        <div className="mb-4 mt-2" key="specific-date-container">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                <div>
                                    <label className="text-xs text-muted-foreground mb-1 block">Specific Date</label>
                                    <Input
                                        type="date"
                                        className="h-9 text-sm"
                                        value={specificDate}
                                        onChange={(e) => setSpecificDate(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Custom Dates Range - отдельная строка с отступами */}
                    {showCustomDates && (
                        <div className="mb-4 mt-2" key="custom-dates-container" style={{ display: 'flex' }}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs text-muted-foreground mb-1 block">Start Date</label>
                                    <Input
                                        type="date"
                                        className="h-9 text-sm"
                                        value={customDateRange.start}
                                        onChange={(e) => setCustomDateRange(prev => ({ ...prev, start: e.target.value }))}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground mb-1 block">End Date</label>
                                    <Input
                                        type="date"
                                        className="h-9 text-sm"
                                        value={customDateRange.end}
                                        onChange={(e) => setCustomDateRange(prev => ({ ...prev, end: e.target.value }))}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-2" key="action-buttons">
                        <Button variant="outline" onClick={resetFilters} size="sm" className="h-8">
                            <X className="w-3 h-3 mr-1" />
                            Reset
                        </Button>
                        <Button onClick={handleExportExcel} size="sm" className="h-8" disabled={totalCount === 0}>
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
                        <CardTitle className="text-lg">Leave Reports Results</CardTitle>
                        <div className="text-xs text-muted-foreground">
                            Showing {totalCount > 0 ? ((currentPage - 1) * rowsPerPage) + 1 : 0}-
                            {Math.min(currentPage * rowsPerPage, totalCount)} of {totalCount} records
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8" key="loading">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                            <span className="ml-2 text-sm">Loading...</span>
                        </div>
                    ) : leaveData.length === 0 ? (
                        <div className="text-center py-8 text-sm text-muted-foreground" key="no-data">
                            No leave records found.
                        </div>
                    ) : (
                        <React.Fragment key="data-table">
                            <div className="rounded-md border overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-gray-50" key="table-header">
                                            <TableHead className="text-xs">Date</TableHead>
                                            <TableHead className="text-xs">User Email</TableHead>
                                            <TableHead className="text-xs">Country</TableHead>
                                            <TableHead className="text-xs">Department</TableHead>
                                            <TableHead className="text-xs">Position</TableHead>
                                            <TableHead className="text-xs">Grade</TableHead>
                                            <TableHead className="text-xs">Leave Type</TableHead>
                                            <TableHead className="text-xs">Task</TableHead>
                                            <TableHead className="text-xs">Hours</TableHead>
                                            <TableHead className="text-xs">Description</TableHead>
                                            <TableHead className="text-xs">Document</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {leaveData.map((record: LeaveRecord, index: number) => (
                                            <TableRow key={`leave-record-${record.date}-${record.user_email}-${index}`} className="text-sm">
                                                <TableCell className="text-xs">
                                                    {record.date ? new Date(record.date).toLocaleDateString('en-GB') : '-'}
                                                </TableCell>
                                                <TableCell className="text-xs">{record.user_email || '-'}</TableCell>
                                                <TableCell className="text-xs">{record.user_country_code || '-'}</TableCell>
                                                <TableCell className="text-xs">
                                                    <span className="px-1.5 py-0.5 bg-blue-50 rounded text-xs">
                                                        {record.user_department || '-'}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-xs">{record.position || '-'}</TableCell>
                                                <TableCell className="text-xs">
                                                    <span className="px-1.5 py-0.5 bg-purple-50 rounded text-xs">
                                                        {record.detailed_grade || '-'}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-xs">
                                                    <span className="px-1.5 py-0.5 bg-green-50 rounded text-xs">
                                                        {record.task_type || '-'}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-xs">{record.task || '-'}</TableCell>
                                                <TableCell className="font-mono text-xs font-semibold">
                                                    {record.hours || 0}h
                                                </TableCell>
                                                <TableCell className="text-xs max-w-[200px] truncate" title={record.description}>
                                                    {record.description || '-'}
                                                </TableCell>
                                                <TableCell className="text-xs">
                                                    {record.leave_document ? (
                                                        <div className="flex gap-1">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-7 w-7 p-0"
                                                                onClick={() => handleDownloadDocument(record.leave_document!)}
                                                                title="Download document"
                                                            >
                                                                <Download className="w-3 h-3" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-7 w-7 p-0"
                                                                onClick={() => handleViewDocument(record.leave_document!)}
                                                                title="View document"
                                                            >
                                                                <ExternalLink className="w-3 h-3" />
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-400">No file</span>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Пагинация */}
                            {totalPages > 1 && (
                                <div className="flex justify-between items-center mt-4" key="pagination">
                                    <div className="text-xs text-muted-foreground">Page {currentPage} of {totalPages}</div>
                                    <div className="flex gap-1">
                                        <Button
                                            key="prev-button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                            disabled={currentPage === 1 || isLoading}
                                            className="h-7 text-xs px-2"
                                        >
                                            <ChevronLeft className="w-3 h-3" />
                                        </Button>
                                        <div className="hidden md:flex gap-1">{renderPageNumbers()}</div>
                                        <Button
                                            key="next-button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                            disabled={currentPage === totalPages || isLoading}
                                            className="h-7 text-xs px-2"
                                        >
                                            <ChevronRight className="w-3 h-3" />
                                        </Button>
                                    </div>
                                    <div className="flex gap-1 items-center" key="go-to-page">
                                        <span className="text-xs">Go:</span>
                                        <input
                                            key="page-input"
                                            type="number"
                                            min={1}
                                            max={totalPages}
                                            value={currentPage}
                                            onChange={(e) => {
                                                const page = parseInt(e.target.value);
                                                if (!isNaN(page) && page >= 1 && page <= totalPages) setCurrentPage(page);
                                            }}
                                            className="w-12 h-7 px-1 text-xs border rounded"
                                            disabled={isLoading}
                                        />
                                    </div>
                                </div>
                            )}
                        </React.Fragment>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}