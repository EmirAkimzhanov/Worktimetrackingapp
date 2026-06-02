import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Download, Filter, RefreshCw, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { toast } from 'sonner';
import { useGetReports, useGetReportsExcel } from '../../../hooks/useReport';
import { useUserStore } from '../../../store/UsersStore';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, subWeeks, subMonths } from 'date-fns';

interface TimesheetRecord {
    id: number;
    date: string;
    hours: number;
    user_email: string;
    country_code: string;
    user_department: string;
    detailed_grade: string;
    project_department: string;
    client_name: string;
    code: string;
    project_service_line: string;
    task_name: string;
    description: string;
}

interface DateRange {
    start: string;
    end: string;
}

interface Grade {
    id: number;
    name: string;
    position: number;
    short_name: string;
}

interface Position {
    id: number;
    name: string;
    grades: Grade[];
}

export function ReportsTab() {
    // Состояния для фильтров дат
    const [dateType, setDateType] = useState<string>('today');
    const [customDateRange, setCustomDateRange] = useState<DateRange>({
        start: format(new Date(), 'yyyy-MM-dd'),
        end: format(new Date(), 'yyyy-MM-dd')
    });

    // Фильтры (select) - изменено: вместо department теперь user_department и project_department
    const [selectedUserDepartment, setSelectedUserDepartment] = useState<string>('all');
    const [selectedProjectDepartment, setSelectedProjectDepartment] = useState<string>('all');
    const [selectedCountryCode, setSelectedCountryCode] = useState<string>('all');
    const [selectedDetailedGrade, setSelectedDetailedGrade] = useState<string>('all');

    // Поиски (input) для каждого поля
    const [searchUserEmail, setSearchUserEmail] = useState<string>('');
    const [searchClientName, setSearchClientName] = useState<string>('');
    const [searchCode, setSearchCode] = useState<string>('');
    const [searchUserDepartment, setSearchUserDepartment] = useState<string>('');
    const [searchProjectDepartment, setSearchProjectDepartment] = useState<string>('');
    const [searchPosition, setSearchPosition] = useState<string>('');
    const [searchProjectServiceLine, setSearchProjectServiceLine] = useState<string>('');
    const [searchDescription, setSearchDescription] = useState<string>('');
    const [searchTaskName, setSearchTaskName] = useState<string>('');

    // Пагинация
    const [rowsPerPage] = useState<number>(30);
    const [timesheetData, setTimesheetData] = useState<TimesheetRecord[]>([]);
    const [totalCount, setTotalCount] = useState<number>(0);
    const [currentPage, setCurrentPage] = useState<number>(1);

    // Получаем данные из store для фильтров
    const store_departments = useUserStore((state) => state.departments);
    const store_countries = useUserStore((state) => state.countries);
    const store_positions = useUserStore((state) => state.positions);

    // Получаем все грейды из positions
    const getAllGrades = useCallback(() => {
        const allGrades: Grade[] = [];
        if (store_positions && Array.isArray(store_positions)) {
            store_positions.forEach((position: Position) => {
                if (position.grades && Array.isArray(position.grades)) {
                    allGrades.push(...position.grades);
                }
            });
        }
        return allGrades;
    }, [store_positions]);

    const allGrades = getAllGrades();

    // Состояния для фильтров API
    const [apiFilters, setApiFilters] = useState<{
        start_date?: string;
        end_date?: string;
        user_department?: string;
        project_department?: string;
        country_code?: string;
        detailed_grade?: string;
        user_email?: string;
        client_name?: string;
        code?: string;
        position?: string;
        project_service_line?: string;
        description?: string;
        task_name?: string;
    }>({});

    const { data: reportsData, isLoading, refetch } = useGetReports({
        page: currentPage,
        page_size: rowsPerPage,
        ...apiFilters
    });

    const { mutate: exportExcel, isPending: isExporting } = useGetReportsExcel();

    // Обновляем данные при изменении параметров запроса
    useEffect(() => {
        refetch();
    }, [currentPage, apiFilters, refetch]);

    // Обрабатываем полученные данные
    useEffect(() => {
        if (reportsData && reportsData.results) {
            const transformedData: TimesheetRecord[] = reportsData.results.map((report: any, index: number) => ({
                id: report.id || index + 1,
                date: report.date,
                hours: report.hours || 0,
                user_email: report.user_email,
                country_code: report.country_code,
                user_department: report.user_department,
                detailed_grade: report.detailed_grade,
                project_department: report.project_department,
                client_name: report.client_name,
                code: report.code,
                project_service_line: report.project_service_line,
                task_name: report.task_name,
                description: report.description
            }));

            setTimesheetData(transformedData);
            setTotalCount(reportsData.count || 0);
        }
    }, [reportsData]);

    // Получение диапазона дат для API (ИСПРАВЛЕНО)
    const getDateRangeForAPI = useCallback(() => {
        const today = new Date();
        let start: Date;
        let end: Date;

        switch (dateType) {
            case 'today':
                start = new Date(today);
                end = new Date(today);
                break;
            case 'yesterday':
                start = subDays(today, 1);
                end = subDays(today, 1);
                break;
            case 'thisWeek':
                // Неделя с понедельника по воскресенье
                start = startOfWeek(today, { weekStartsOn: 1 });
                end = endOfWeek(today, { weekStartsOn: 1 });
                break;
            case 'lastWeek':
                // Прошлая неделя с понедельника по воскресенье
                const lastWeek = subWeeks(today, 1);
                start = startOfWeek(lastWeek, { weekStartsOn: 1 });
                end = endOfWeek(lastWeek, { weekStartsOn: 1 });
                break;
            case 'thisMonth':
                // Текущий месяц с 1 по последнее число
                start = startOfMonth(today);
                end = endOfMonth(today);
                break;
            case 'lastMonth':
                // Прошлый месяц с 1 по последнее число
                const lastMonth = subMonths(today, 1);
                start = startOfMonth(lastMonth);
                end = endOfMonth(lastMonth);
                break;
            case 'custom':
                start = new Date(customDateRange.start);
                end = new Date(customDateRange.end);
                break;
            default:
                start = new Date(today);
                end = new Date(today);
        }

        return {
            start_date: format(start, 'yyyy-MM-dd'),
            end_date: format(end, 'yyyy-MM-dd')
        };
    }, [dateType, customDateRange]);

    // Применение всех фильтров и поисков
    const applyFilters = useCallback(() => {
        const { start_date, end_date } = getDateRangeForAPI();

        const newFilters: typeof apiFilters = {
            start_date,
            end_date,
        };

        // Фильтры из select (точное совпадение) - заменено на user_department и project_department
        if (selectedUserDepartment !== 'all') {
            newFilters.user_department = selectedUserDepartment;
        }
        if (selectedProjectDepartment !== 'all') {
            newFilters.project_department = selectedProjectDepartment;
        }
        if (selectedCountryCode !== 'all') {
            newFilters.country_code = selectedCountryCode;
        }
        if (selectedDetailedGrade !== 'all') {
            newFilters.detailed_grade = selectedDetailedGrade;
        }

        // Поиски из input (частичное совпадение)
        if (searchUserEmail) newFilters.user_email = searchUserEmail;
        if (searchClientName) newFilters.client_name = searchClientName;
        if (searchCode) newFilters.code = searchCode;
        if (searchUserDepartment) newFilters.user_department = searchUserDepartment;
        if (searchProjectDepartment) newFilters.project_department = searchProjectDepartment;
        if (searchPosition) newFilters.position = searchPosition;
        if (searchProjectServiceLine) newFilters.project_service_line = searchProjectServiceLine;
        if (searchDescription) newFilters.description = searchDescription;
        if (searchTaskName) newFilters.task_name = searchTaskName;

        setApiFilters(newFilters);
        setCurrentPage(1);
    }, [
        getDateRangeForAPI,
        selectedUserDepartment, selectedProjectDepartment, selectedCountryCode, selectedDetailedGrade,
        searchUserEmail, searchClientName, searchCode,
        searchUserDepartment, searchProjectDepartment, searchPosition,
        searchProjectServiceLine, searchDescription, searchTaskName
    ]);

    // Сброс всех фильтров
    const resetFilters = () => {
        setDateType('today');
        setCustomDateRange({
            start: format(new Date(), 'yyyy-MM-dd'),
            end: format(new Date(), 'yyyy-MM-dd')
        });
        setSelectedUserDepartment('all');
        setSelectedProjectDepartment('all');
        setSelectedCountryCode('all');
        setSelectedDetailedGrade('all');
        setSearchUserEmail('');
        setSearchClientName('');
        setSearchCode('');
        setSearchUserDepartment('');
        setSearchProjectDepartment('');
        setSearchPosition('');
        setSearchProjectServiceLine('');
        setSearchDescription('');
        setSearchTaskName('');
        setCurrentPage(1);

        toast.success('All filters reset');
    };

    // Экспорт в Excel
    const handleExportExcel = () => {
        const { start_date, end_date } = getDateRangeForAPI();

        const exportParams: any = {
            start_date,
            end_date,
        };

        if (selectedUserDepartment !== 'all') exportParams.user_department = selectedUserDepartment;
        if (selectedProjectDepartment !== 'all') exportParams.project_department = selectedProjectDepartment;
        if (selectedCountryCode !== 'all') exportParams.country_code = selectedCountryCode;
        if (selectedDetailedGrade !== 'all') exportParams.detailed_grade = selectedDetailedGrade;
        if (searchUserEmail) exportParams.user_email = searchUserEmail;
        if (searchClientName) exportParams.client_name = searchClientName;
        if (searchCode) exportParams.code = searchCode;
        if (searchUserDepartment) exportParams.user_department = searchUserDepartment;
        if (searchProjectDepartment) exportParams.project_department = searchProjectDepartment;
        if (searchPosition) exportParams.position = searchPosition;
        if (searchProjectServiceLine) exportParams.project_service_line = searchProjectServiceLine;
        if (searchDescription) exportParams.description = searchDescription;
        if (searchTaskName) exportParams.task_name = searchTaskName;

        exportExcel(exportParams, {
            onSuccess: () => toast.success('Report exported successfully'),
            onError: () => toast.error('Failed to export report')
        });
    };

    // Автоматическое применение фильтров при изменении
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            applyFilters();
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [
        selectedUserDepartment, selectedProjectDepartment, selectedCountryCode, selectedDetailedGrade,
        searchUserEmail, searchClientName, searchCode,
        searchUserDepartment, searchProjectDepartment, searchPosition,
        searchProjectServiceLine, searchDescription, searchTaskName,
        dateType, customDateRange, applyFilters
    ]);

    const formatHours = (hours: number) => hours.toFixed(2);
    const totalPages = Math.ceil(totalCount / rowsPerPage);

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
                <Button key="1" variant="outline" size="sm" onClick={() => setCurrentPage(1)} disabled={isLoading} className="min-w-[32px] h-8 hidden sm:inline-flex">1</Button>
            );
            if (startPage > 2) pages.push(<span key="ellipsis1" className="px-1 text-muted-foreground hidden sm:inline">...</span>);
        }

        for (let i = startPage; i <= endPage; i++) {
            pages.push(
                <Button key={i} variant={currentPage === i ? "default" : "outline"} size="sm" onClick={() => setCurrentPage(i)} disabled={isLoading} className="min-w-[32px] h-8">
                    {i}
                </Button>
            );
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) pages.push(<span key="ellipsis2" className="px-1 text-muted-foreground hidden sm:inline">...</span>);
            pages.push(
                <Button key={totalPages} variant="outline" size="sm" onClick={() => setCurrentPage(totalPages)} disabled={isLoading} className="min-w-[32px] h-8 hidden sm:inline-flex">
                    {totalPages}
                </Button>
            );
        }

        return pages;
    };

    // Показываем кастомные даты если выбрано
    const showCustomDates = dateType === 'custom';

    return (
        <div className="space-y-6">
            {/* Заголовок */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Timesheet Reports</h2>
                    <p className="text-muted-foreground">Generate and export detailed timesheet reports</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading || isExporting}>
                    <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            {/* Карточка с фильтрами - сетка 5x3 */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Filter className="w-4 h-4" />
                        Filters & Search
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {/* Сетка 5 колонок */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 mb-4">
                        {/* User Department Filter - НОВЫЙ ФИЛЬТР */}
                        <div>
                            <Select value={selectedUserDepartment} onValueChange={setSelectedUserDepartment}>
                                <SelectTrigger className="h-9 text-sm">
                                    <SelectValue placeholder="User Department" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All User Depts</SelectItem>
                                    {(Array.isArray(store_departments) ? store_departments : Object.values(store_departments || {})).map((dept: any) => (
                                        <SelectItem key={dept.id} value={dept.name}>
                                            {dept.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Project Department Filter - НОВЫЙ ФИЛЬТР */}
                        <div>
                            <Select value={selectedProjectDepartment} onValueChange={setSelectedProjectDepartment}>
                                <SelectTrigger className="h-9 text-sm">
                                    <SelectValue placeholder="Project Department" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Project Depts</SelectItem>
                                    {(Array.isArray(store_departments) ? store_departments : Object.values(store_departments || {})).map((dept: any) => (
                                        <SelectItem key={dept.id} value={dept.name}>
                                            {dept.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Country Filter */}
                        <div>
                            <Select value={selectedCountryCode} onValueChange={setSelectedCountryCode}>
                                <SelectTrigger className="h-9 text-sm">
                                    <SelectValue placeholder="Country" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Countries</SelectItem>
                                    {(store_countries || []).map((c: any) => (
                                        <SelectItem key={c.id} value={c.code}>
                                            {c.code}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Grade Filter */}
                        <div>
                            <Select value={selectedDetailedGrade} onValueChange={setSelectedDetailedGrade}>
                                <SelectTrigger className="h-9 text-sm">
                                    <SelectValue placeholder="Grade" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Grades</SelectItem>
                                    {allGrades.map((g: Grade) => (
                                        <SelectItem key={g.id} value={g.name}>
                                            {g.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Date Range */}
                        <div>
                            <Select value={dateType} onValueChange={setDateType}>
                                <SelectTrigger className="h-9 text-sm">
                                    <SelectValue placeholder="Date" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="today">Today</SelectItem>
                                    <SelectItem value="yesterday">Yesterday</SelectItem>
                                    <SelectItem value="thisWeek">This Week</SelectItem>
                                    <SelectItem value="lastWeek">Last Week</SelectItem>
                                    <SelectItem value="thisMonth">This Month</SelectItem>
                                    <SelectItem value="lastMonth">Last Month</SelectItem>
                                    <SelectItem value="custom">Custom</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* User Email Search */}
                        <div>
                            <Input
                                className="h-9 text-sm"
                                placeholder="Email search"
                                value={searchUserEmail}
                                onChange={(e) => setSearchUserEmail(e.target.value)}
                            />
                        </div>

                        {/* Client Name Search */}
                        <div>
                            <Input
                                className="h-9 text-sm"
                                placeholder="Client search"
                                value={searchClientName}
                                onChange={(e) => setSearchClientName(e.target.value)}
                            />
                        </div>

                        {/* Project Code Search */}
                        <div>
                            <Input
                                className="h-9 text-sm"
                                placeholder="Code search"
                                value={searchCode}
                                onChange={(e) => setSearchCode(e.target.value)}
                            />
                        </div>

                        {/* User Department Search */}
                        <div>
                            <Input
                                className="h-9 text-sm"
                                placeholder="User dept search"
                                value={searchUserDepartment}
                                onChange={(e) => setSearchUserDepartment(e.target.value)}
                            />
                        </div>

                        {/* Project Department Search */}
                        <div>
                            <Input
                                className="h-9 text-sm"
                                placeholder="Project dept search"
                                value={searchProjectDepartment}
                                onChange={(e) => setSearchProjectDepartment(e.target.value)}
                            />
                        </div>

                        {/* Position Search */}
                        <div>
                            <Input
                                className="h-9 text-sm"
                                placeholder="Position search"
                                value={searchPosition}
                                onChange={(e) => setSearchPosition(e.target.value)}
                            />
                        </div>

                        {/* Service Line Search */}
                        <div>
                            <Input
                                className="h-9 text-sm"
                                placeholder="Service search"
                                value={searchProjectServiceLine}
                                onChange={(e) => setSearchProjectServiceLine(e.target.value)}
                            />
                        </div>

                        {/* Description Search */}
                        <div>
                            <Input
                                className="h-9 text-sm"
                                placeholder="Description search"
                                value={searchDescription}
                                onChange={(e) => setSearchDescription(e.target.value)}
                            />
                        </div>

                        {/* Task Name Search */}
                        <div>
                            <Input
                                className="h-9 text-sm"
                                placeholder="Task search"
                                value={searchTaskName}
                                onChange={(e) => setSearchTaskName(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Custom Dates Row (если выбрано custom) */}
                    {showCustomDates && (
                        <div className="grid grid-cols-2 gap-3 mb-4">
                            <Input
                                type="date"
                                className="h-9 text-sm"
                                value={customDateRange.start}
                                onChange={(e) => setCustomDateRange(prev => ({ ...prev, start: e.target.value }))}
                            />
                            <Input
                                type="date"
                                className="h-9 text-sm"
                                value={customDateRange.end}
                                onChange={(e) => setCustomDateRange(prev => ({ ...prev, end: e.target.value }))}
                            />
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-2 ">
                        <Button variant="outline" onClick={resetFilters} size="sm" className="h-8" disabled={isExporting}>
                            <X className="w-3 h-3 mr-1" />
                            Reset
                        </Button>
                        <Button onClick={handleExportExcel} size="sm" className="h-8" disabled={totalCount === 0 || isExporting}>
                            {isExporting ? (
                                <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                            ) : (
                                <Download className="w-3 h-3 mr-1" />
                            )}
                            Export
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Карточка с результатами */}
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">Report Results</CardTitle>
                        <div className="text-xs text-muted-foreground">
                            Showing {totalCount > 0 ? ((currentPage - 1) * rowsPerPage) + 1 : 0}-
                            {Math.min(currentPage * rowsPerPage, totalCount)} of {totalCount} records
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                            <span className="ml-2 text-sm">Loading...</span>
                        </div>
                    ) : timesheetData.length === 0 ? (
                        <div className="text-center py-8 text-sm text-muted-foreground">No records found.</div>
                    ) : (
                        <>
                            <div className="rounded-md border overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-gray-50">
                                            <TableHead className="text-xs">Date</TableHead>
                                            <TableHead className="text-xs">Hours</TableHead>
                                            <TableHead className="text-xs">User Email</TableHead>
                                            <TableHead className="text-xs">Client</TableHead>
                                            <TableHead className="text-xs">Code</TableHead>
                                            <TableHead className="text-xs">User Dept</TableHead>
                                            <TableHead className="text-xs">Project Dept</TableHead>
                                            <TableHead className="text-xs">Country</TableHead>
                                            <TableHead className="text-xs">Grade</TableHead>
                                            <TableHead className="text-xs">Service Line</TableHead>
                                            <TableHead className="text-xs">Task</TableHead>
                                            <TableHead className="text-xs">Description</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {timesheetData.map((record) => (
                                            <TableRow key={record.id} className="text-sm">
                                                <TableCell className="text-xs">{new Date(record.date).toLocaleDateString('en-GB')}</TableCell>
                                                <TableCell className="font-mono text-xs">{formatHours(record.hours)}</TableCell>
                                                <TableCell className="text-xs">{record.user_email}</TableCell>
                                                <TableCell className="font-medium text-xs">{record.client_name}</TableCell>
                                                <TableCell className="text-xs font-mono">{record.code}</TableCell>
                                                <TableCell><span className="px-1.5 py-0.5 bg-blue-50 rounded text-xs">{record.user_department}</span></TableCell>
                                                <TableCell><span className="px-1.5 py-0.5 bg-green-50 rounded text-xs">{record.project_department}</span></TableCell>
                                                <TableCell><span className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">{record.country_code}</span></TableCell>
                                                <TableCell><span className="px-1.5 py-0.5 bg-purple-50 rounded text-xs">{record.detailed_grade}</span></TableCell>
                                                <TableCell><span className="px-1.5 py-0.5 bg-orange-50 rounded text-xs">{record.project_service_line}</span></TableCell>
                                                <TableCell className="text-xs">{record.task_name}</TableCell>
                                                <TableCell className="text-xs max-w-[200px] truncate" title={record.description}>{record.description || '-'}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Пагинация */}
                            {totalPages > 1 && (
                                <div className="flex justify-between items-center mt-4">
                                    <div className="text-xs text-muted-foreground">Page {currentPage} of {totalPages}</div>
                                    <div className="flex gap-1">
                                        <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1 || isLoading} className="h-7 text-xs px-2">
                                            <ChevronLeft className="w-3 h-3" />
                                        </Button>
                                        <div className="hidden md:flex gap-1">{renderPageNumbers()}</div>
                                        <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages || isLoading} className="h-7 text-xs px-2">
                                            <ChevronRight className="w-3 h-3" />
                                        </Button>
                                    </div>
                                    <div className="flex gap-1 items-center">
                                        <span className="text-xs">Go:</span>
                                        <input type="number" min={1} max={totalPages} value={currentPage} onChange={(e) => { const page = parseInt(e.target.value); if (!isNaN(page) && page >= 1 && page <= totalPages) setCurrentPage(page); }} className="w-12 h-7 px-1 text-xs border rounded" disabled={isLoading} />
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