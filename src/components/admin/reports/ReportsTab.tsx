import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Label } from '../../ui/label';
import { Search, Download, Filter, Calendar, Users, Building, RefreshCw, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { toast } from 'sonner';
import { useGetReports, useGetReportsExcel } from '../../../hooks/useReport';
import { useUserStore } from '../../../store/UsersStore';

interface TimesheetRecord {
    id: number;
    date: string;
    hours: number;
    user_email: string;
    country_code: string;
    user_department: string;
    position: string;
    detailed_grade: string;
    project_department: string;
    client_name: string;
    code: string;
    project_service_line: string;
    task_type_name: string;
    task_name: string;
    description: string;
}

interface Department {
    id: number;
    name: string;
    code: string;
}

interface DateRange {
    start: string;
    end: string;
}

export function ReportsTab() {
    // Состояния для фильтров
    const [dateType, setDateType] = useState<string>('today');
    const [customDateRange, setCustomDateRange] = useState<DateRange>({
        start: new Date().toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });
    const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
    const [selectedPerson, setSelectedPerson] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [rowsPerPage, setRowsPerPage] = useState<number>(5);

    // Состояния для данных с пагинацией от API
    const [timesheetData, setTimesheetData] = useState<TimesheetRecord[]>([]);
    const [totalCount, setTotalCount] = useState<number>(0);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [employees, setEmployees] = useState<{ id: number; name: string; department: string; email: string }[]>([]);

    // Состояния для фильтров API
    const [apiFilters, setApiFilters] = useState<{
        start_date?: string;
        end_date?: string;
        department?: string;
        user_email?: string;
        search?: string;
    }>({});

    const { data: reportsData, isLoading, refetch } = useGetReports({
        page: currentPage,
        page_size: rowsPerPage,
        start_date: apiFilters.start_date,
        end_date: apiFilters.end_date,
        department: apiFilters.department,
        user_email: apiFilters.user_email,
        search: apiFilters.search,
    });

    const { mutate: exportExcel, isPending: isExporting } = useGetReportsExcel();

    // Обновляем данные при изменении параметров запроса
    useEffect(() => {
        refetch();
    }, [currentPage, rowsPerPage, apiFilters, refetch]);

    // Обрабатываем полученные данные
    useEffect(() => {
        if (reportsData) {
            const transformedData: TimesheetRecord[] = (reportsData.results || []).map((report: any, index: number) => ({
                id: report.id || index + 1,
                date: report.date,
                hours: report.hours,
                user_email: report.user_email,
                country_code: report.country_code,
                user_department: report.user_department,
                position: report.position,
                detailed_grade: report.detailed_grade,
                project_department: report.project_department,
                client_name: report.client_name,
                code: report.code,
                project_service_line: report.project_service_line,
                task_type_name: report.task_type_name,
                task_name: report.task_name,
                description: report.description
            }));

            setTimesheetData(transformedData);
            setTotalCount(reportsData.count || 0);

            // Обновляем списки отделов и сотрудников при первой загрузке
            if (reportsData.results && reportsData.results.length > 0 && departments.length === 0) {
                const uniqueDepartments = [...new Set(reportsData.results.map((report: any) => report.user_department))];
                const departmentList = uniqueDepartments.map((dept, index) => ({
                    id: index + 1,
                    name: dept,
                    code: dept
                }));
                setDepartments(departmentList);

                const uniqueEmployees = reportsData.results
                    .filter((report: any, index: number, self: any[]) =>
                        index === self.findIndex((r: any) => r.user_email === report.user_email)
                    )
                    .map((report: any, idx: number) => ({
                        id: idx + 1,
                        name: report.user_email.split('@')[0].replace(/\./g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
                        department: report.user_department,
                        email: report.user_email
                    }));
                setEmployees(uniqueEmployees);
            }
        }
    }, [reportsData]);

    // Получение диапазона дат для API
    const getDateRangeForAPI = useCallback(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        let start: Date;
        let end: Date;

        switch (dateType) {
            case 'today':
                start = new Date(today);
                end = new Date(today);
                break;
            case 'yesterday':
                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);
                start = yesterday;
                end = yesterday;
                break;
            case 'thisWeek':
                start = new Date(today);
                const dayOfWeek = start.getDay();
                start.setDate(start.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1));
                end = new Date(start);
                end.setDate(end.getDate() + 6);
                break;
            case 'lastWeek':
                start = new Date(today);
                start.setDate(start.getDate() - start.getDay() - 6);
                end = new Date(start);
                end.setDate(end.getDate() + 6);
                break;
            case 'thisMonth':
                start = new Date(today.getFullYear(), today.getMonth(), 1);
                end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                break;
            case 'lastMonth':
                start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                end = new Date(today.getFullYear(), today.getMonth(), 0);
                break;
            case 'custom':
                start = new Date(customDateRange.start);
                end = new Date(customDateRange.end);
                break;
            default:
                start = new Date(today);
                end = new Date(today);
        }

        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);

        return {
            start_date: start.toISOString().split('T')[0],
            end_date: end.toISOString().split('T')[0]
        };
    }, [dateType, customDateRange]);

    // Применение фильтров
    const applyFilters = useCallback(() => {
        const { start_date, end_date } = getDateRangeForAPI();

        const newFilters: typeof apiFilters = {
            start_date,
            end_date,
        };

        if (selectedDepartment !== 'all') {
            newFilters.department = selectedDepartment;
        }

        if (selectedPerson !== 'all') {
            const selectedEmployee = employees.find(emp => emp.id.toString() === selectedPerson);
            if (selectedEmployee) {
                newFilters.user_email = selectedEmployee.email;
            }
        }

        if (searchQuery) {
            newFilters.search = searchQuery;
        }

        setApiFilters(newFilters);
        setCurrentPage(1);
    }, [dateType, customDateRange, selectedDepartment, selectedPerson, searchQuery, employees, getDateRangeForAPI]);

    // Сброс фильтров
    const resetFilters = () => {
        setDateType('today');
        setCustomDateRange({
            start: new Date().toISOString().split('T')[0],
            end: new Date().toISOString().split('T')[0]
        });
        setSelectedDepartment('all');
        setSelectedPerson('all');
        setSearchQuery('');
        setCurrentPage(1);

        const { start_date, end_date } = getDateRangeForAPI();
        setApiFilters({ start_date, end_date });

        toast.success('Filters reset');
    };

    // Экспорт в Excel
    const handleExportExcel = () => {
        const { start_date, end_date } = getDateRangeForAPI();

        const exportParams: any = {
            start_date,
            end_date,
        };

        if (selectedDepartment !== 'all') {
            exportParams.department = selectedDepartment;
        }

        if (selectedPerson !== 'all') {
            const selectedEmployee = employees.find(emp => emp.id.toString() === selectedPerson);
            if (selectedEmployee) {
                exportParams.user_email = selectedEmployee.email;
            }
        }

        if (searchQuery) {
            exportParams.search = searchQuery;
        }

        exportExcel(exportParams);
    };

    // Автоматическое применение фильтров при изменении
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            applyFilters();
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [dateType, customDateRange, selectedDepartment, selectedPerson, searchQuery, applyFilters]);

    // Форматирование часов
    const formatHours = (hours: number) => {
        return hours.toFixed(2);
    };

    const totalPages = Math.ceil(totalCount / rowsPerPage);

    // Функция для отображения номеров страниц
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
                <Button
                    key="1"
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(1)}
                    disabled={isLoading}
                    className="min-w-[32px] h-8 hidden sm:inline-flex"
                >
                    1
                </Button>
            );
            if (startPage > 2) {
                pages.push(
                    <span key="ellipsis1" className="px-1 text-muted-foreground hidden sm:inline">
                        ...
                    </span>
                );
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            pages.push(
                <Button
                    key={i}
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
                pages.push(
                    <span key="ellipsis2" className="px-1 text-muted-foreground hidden sm:inline">
                        ...
                    </span>
                );
            }
            pages.push(
                <Button
                    key={totalPages}
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

    return (
        <div className="space-y-6">
            {/* Заголовок */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Timesheet Reports</h2>
                    <p className="text-muted-foreground">Generate and export detailed timesheet reports</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => refetch()}
                        disabled={isLoading || isExporting}
                    >
                        <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Карточка с фильтрами */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2">
                        <Filter className="w-5 h-5" />
                        Filters
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6" style={{ padding: '15px 0' }}>
                        {/* Выбор даты */}
                        <div className="space-y-2">
                            <Label htmlFor="dateType" className="text-sm font-medium">
                                <Calendar className="w-4 h-4 inline mr-1" />
                                Date Selection
                            </Label>
                            <Select value={dateType} onValueChange={setDateType}>
                                <SelectTrigger id="dateType">
                                    <SelectValue placeholder="Select date range" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="today">Today</SelectItem>
                                    <SelectItem value="yesterday">Yesterday</SelectItem>
                                    <SelectItem value="thisWeek">This Week</SelectItem>
                                    <SelectItem value="lastWeek">Last Week</SelectItem>
                                    <SelectItem value="thisMonth">This Month</SelectItem>
                                    <SelectItem value="lastMonth">Last Month</SelectItem>
                                    <SelectItem value="custom">Custom Range</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Пользовательский диапазон дат */}
                        {dateType === 'custom' && (
                            <>
                                <div className="space-y-2">
                                    <Label htmlFor="startDate" className="text-sm font-medium">
                                        Start Date
                                    </Label>
                                    <Input
                                        id="startDate"
                                        type="date"
                                        value={customDateRange.start}
                                        onChange={(e) => setCustomDateRange(prev => ({
                                            ...prev,
                                            start: e.target.value
                                        }))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="endDate" className="text-sm font-medium">
                                        End Date
                                    </Label>
                                    <Input
                                        id="endDate"
                                        type="date"
                                        value={customDateRange.end}
                                        onChange={(e) => setCustomDateRange(prev => ({
                                            ...prev,
                                            end: e.target.value
                                        }))}
                                    />
                                </div>
                            </>
                        )}

                        {/* Фильтр по отделу */}
                        <div className="space-y-2">
                            <Label htmlFor="department" className="text-sm font-medium">
                                <Building className="w-4 h-4 inline mr-1" />
                                Department
                            </Label>
                            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                                <SelectTrigger id="department">
                                    <SelectValue placeholder="Select department" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Departments</SelectItem>
                                    {departments.map(dept => (
                                        <SelectItem key={dept.id} value={dept.name}>
                                            {dept.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Фильтр по сотруднику */}
                        <div className="space-y-2">
                            <Label htmlFor="person" className="text-sm font-medium">
                                <Users className="w-4 h-4 inline mr-1" />
                                Person
                            </Label>
                            <Select value={selectedPerson} onValueChange={setSelectedPerson}>
                                <SelectTrigger id="person">
                                    <SelectValue placeholder="Select person" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All People</SelectItem>
                                    {employees.map(employee => (
                                        <SelectItem key={employee.id} value={employee.id.toString()}>
                                            {employee.name} ({employee.department})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Записей на странице */}
                        <div className="space-y-2">
                            <Label htmlFor="rowsPerPage" className="text-sm font-medium">
                                Rows per page
                            </Label>
                            <Select
                                value={rowsPerPage.toString()}
                                onValueChange={(value) => {
                                    setRowsPerPage(parseInt(value));
                                    setCurrentPage(1);
                                }}
                            >
                                <SelectTrigger id="rowsPerPage">
                                    <SelectValue placeholder="Rows per page" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="5">5</SelectItem>
                                    <SelectItem value="10">10</SelectItem>
                                    <SelectItem value="25">25</SelectItem>
                                    <SelectItem value="50">50</SelectItem>
                                    <SelectItem value="100">100</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Поиск */}
                        <div className="space-y-2">
                            <Label htmlFor="search" className="text-sm font-medium">
                                <Search className="w-4 h-4 inline mr-1" />
                                Search
                            </Label>
                            <Input
                                id="search"
                                placeholder="Search in all fields..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Кнопки действий */}
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={resetFilters}
                            className="flex-1"
                            disabled={isExporting}
                        >
                            <X className="w-4 h-4 mr-2" />
                            Reset Filters
                        </Button>
                        <Button
                            onClick={handleExportExcel}
                            className="flex-1"
                            disabled={totalCount === 0 || isExporting}
                        >
                            {isExporting ? (
                                <>
                                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                    Exporting...
                                </>
                            ) : (
                                <>
                                    <Download className="w-4 h-4 mr-2" />
                                    Export to Excel
                                </>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Карточка с результатами */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-xl">
                            Report Results
                        </CardTitle>
                        <div className="text-sm text-muted-foreground">
                            Showing {totalCount > 0 ? ((currentPage - 1) * rowsPerPage) + 1 : 0}-
                            {Math.min(currentPage * rowsPerPage, totalCount)} of {totalCount} records
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                            <span className="ml-2">Loading data...</span>
                        </div>
                    ) : timesheetData.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No records found. Try adjusting your filters or click "Reset Filters".
                        </div>
                    ) : (
                        <>
                            <div className="rounded-md border overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="min-w-[100px]">Date</TableHead>
                                            <TableHead className="min-w-[80px]">Hours</TableHead>
                                            <TableHead className="min-w-[180px]">User Email</TableHead>
                                            <TableHead className="min-w-[120px]">Department</TableHead>
                                            <TableHead className="min-w-[80px]">Country</TableHead>
                                            <TableHead className="min-w-[100px]">Position</TableHead>
                                            <TableHead className="min-w-[120px]">Detailed Grade</TableHead>
                                            <TableHead className="min-w-[150px]">Client</TableHead>
                                            <TableHead className="min-w-[200px]">Project Code</TableHead>
                                            <TableHead className="min-w-[150px]">Service Line</TableHead>
                                            <TableHead className="min-w-[100px]">Task Type</TableHead>
                                            <TableHead className="min-w-[150px]">Task Name</TableHead>
                                            <TableHead className="min-w-[250px]">Description</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {timesheetData.map((record) => (
                                            <TableRow key={record.id} className="hover:bg-gray-50">
                                                <TableCell className="font-medium">
                                                    {new Date(record.date).toLocaleDateString('en-GB')}
                                                </TableCell>
                                                <TableCell className="font-mono font-medium">
                                                    {formatHours(record.hours)}
                                                </TableCell>
                                                <TableCell className="text-sm text-gray-600">
                                                    {record.user_email}
                                                </TableCell>
                                                <TableCell>
                                                    <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                                                        {record.user_department}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-mono">
                                                        {record.country_code}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    {record.position}
                                                </TableCell>
                                                <TableCell>
                                                    {record.detailed_grade}
                                                </TableCell>
                                                <TableCell className="font-medium">
                                                    {record.client_name}
                                                </TableCell>
                                                <TableCell className="text-xs font-mono">
                                                    <span className="px-2 py-1 bg-gray-50 rounded text-gray-600">
                                                        {record.code}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded text-xs">
                                                        {record.project_service_line}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                                                        {record.task_type_name}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    {record.task_name}
                                                </TableCell>
                                                <TableCell className="text-sm max-w-[250px] truncate" title={record.description}>
                                                    {record.description || '-'}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Пагинация с номерами страниц */}
                            {totalPages > 1 && (
                                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-4">
                                    <div className="text-sm text-muted-foreground">
                                        Page {currentPage} of {totalPages}
                                    </div>

                                    <div className="flex items-center gap-2 flex-wrap justify-center">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                            disabled={currentPage === 1 || isLoading}
                                            className="h-8"
                                        >
                                            <ChevronLeft className="w-4 h-4 mr-1" />
                                            Previous
                                        </Button>

                                        <div className="hidden md:flex gap-1">
                                            {renderPageNumbers()}
                                        </div>

                                        <div className="flex md:hidden items-center gap-2">
                                            <Select
                                                value={currentPage.toString()}
                                                onValueChange={(value) => setCurrentPage(parseInt(value))}
                                                disabled={isLoading}
                                            >
                                                <SelectTrigger className="w-[100px] h-8">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                                        <SelectItem key={page} value={page.toString()}>
                                                            Page {page} of {totalPages}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="hidden sm:flex md:hidden items-center gap-2 text-sm">
                                            <span className="font-medium">{currentPage}</span>
                                            <span className="text-muted-foreground">of {totalPages}</span>
                                        </div>

                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                            disabled={currentPage === totalPages || isLoading}
                                            className="h-8"
                                        >
                                            Next
                                            <ChevronRight className="w-4 h-4 ml-1" />
                                        </Button>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                                            Go to page:
                                        </span>
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
                                            className="w-16 h-8 px-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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