// src/components/admin/ReportsTab.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Label } from '../../ui/label';
import { Search, Download, Filter, Calendar, Users, Building, RefreshCw, ChevronLeft, ChevronRight, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { useGetReports, useGetReportsExcel } from '../../../hooks/useReport';
import { useUserStore } from '../../../store/UsersStore';
import axios from 'axios';
import { api } from '../../../consts/api';

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

interface Employee {
    id: number;
    name: string;
    department: string;
    email?: string;
    status: 'active' | 'inactive';
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
    const [rowsPerPage, setRowsPerPage] = useState<number>(25);
    const [searchQuery, setSearchQuery] = useState<string>('');

    // Состояния для данных
    const [timesheetData, setTimesheetData] = useState<TimesheetRecord[]>([]);
    const [filteredData, setFilteredData] = useState<TimesheetRecord[]>([]);
    const { mutate: getReports } = useGetReports();
    const store_reports = useUserStore((state) => state.reports);
    const { mutate: getReportsExcel } = useGetReportsExcel();

    const [departments, setDepartments] = useState<Department[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isExporting, setIsExporting] = useState<boolean>(false);

    // Пагинация
    const [currentPage, setCurrentPage] = useState<number>(1);
    const totalPages = Math.ceil(filteredData.length / rowsPerPage);

    useEffect(() => {
        getReports();
    }, []);

    // Обновление списка отделов из данных
    useEffect(() => {
        if (store_reports && store_reports.length > 0) {
            const uniqueDepartments = [...new Set(store_reports.map(report => report.user_department))];
            const departmentList = uniqueDepartments.map((dept, index) => ({
                id: index + 1,
                name: dept,
                code: dept
            }));
            setDepartments(departmentList);
        }
    }, [store_reports]);

    useEffect(() => {
        if (store_reports && store_reports.length > 0) {
            const transformedData: TimesheetRecord[] = store_reports.map((report, index) => ({
                id: index + 1,
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

            const uniqueEmployees = transformedData
                .filter((report, index, self) =>
                    index === self.findIndex(r => r.user_email === report.user_email)
                )
                .map((report, idx) => ({
                    id: idx + 1,
                    name: report.user_email.split('@')[0].replace(/\./g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                    department: report.user_department,
                    email: report.user_email,
                    status: 'active' as const
                }));

            setEmployees(uniqueEmployees);

            applyFilters(transformedData);
        }
    }, [store_reports]);

    const getDateRange = () => {
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

        return { start, end };
    };

    // Применение фильтров
    const applyFilters = (data?: TimesheetRecord[]) => {
        const recordsToFilter = data || timesheetData;
        const { start, end } = getDateRange();

        let filtered = recordsToFilter.filter(record => {
            const recordDate = new Date(record.date);
            recordDate.setHours(0, 0, 0, 0);

            // Фильтр по дате
            if (recordDate < start || recordDate > end) {
                return false;
            }

            // Фильтр по отделу
            if (selectedDepartment !== 'all' && record.user_department !== selectedDepartment) {
                return false;
            }

            // Фильтр по сотруднику
            if (selectedPerson !== 'all') {
                const selectedEmployee = employees.find(emp => emp.id.toString() === selectedPerson);
                if (selectedEmployee && record.user_email !== selectedEmployee.email) {
                    return false;
                }
            }

            // Фильтр по поиску
            if (searchQuery) {
                const searchLower = searchQuery.toLowerCase();
                return (
                    record.user_email.toLowerCase().includes(searchLower) ||
                    record.client_name?.toLowerCase().includes(searchLower) ||
                    record.code?.toLowerCase().includes(searchLower) ||
                    record.description?.toLowerCase().includes(searchLower) ||
                    record.task_name?.toLowerCase().includes(searchLower) ||
                    record.user_department?.toLowerCase().includes(searchLower) ||
                    record.project_service_line?.toLowerCase().includes(searchLower)
                );
            }

            return true;
        });

        setFilteredData(filtered);
        setCurrentPage(1);

        if (filtered.length === 0 && recordsToFilter.length > 0) {
            toast.warning('No records found with current filters');
        }
    };

    // Ручная загрузка данных
    const loadTimesheetData = async () => {
        setIsLoading(true);
        try {
            getReports();
            toast.success('Data loaded successfully');
        } catch (error) {
            console.error('Failed to load data:', error);
            toast.error('Failed to load data');
        } finally {
            setIsLoading(false);
        }
    };

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

        applyFilters(timesheetData);

        toast.success('Filters reset');
    };

    // Экспорт в Excel через API
    const exportToExcel = async () => {
        if (filteredData.length === 0) {
            toast.error('No data to export');
            return;
        }

        try {
            setIsExporting(true);

            const token = useUserStore.getState().access_token;

            if (!token) {
                toast.error('No access token available');
                return;
            }

            const response = await axios({
                url: `${api}api/calendars/time-entries/report/?export=excel`,
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                responseType: 'blob'
            });

            const blob = response.data;

            const contentDisposition = response.headers['content-disposition'];
            let filename = `timesheet_report_${new Date().toISOString().split('T')[0]}.xlsx`;

            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
                if (filenameMatch && filenameMatch[1]) {
                    filename = filenameMatch[1].replace(/['"]/g, '');
                }
            }

            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            toast.success('Report exported successfully');
        } catch (error) {
            console.error('Failed to export data:', error);

            if (axios.isAxiosError(error) && error.response?.data instanceof Blob) {
                try {
                    const errorText = await error.response.data.text();
                    const errorData = JSON.parse(errorText);
                    toast.error(errorData.message || 'Failed to export data');
                } catch {
                    toast.error('Failed to export data');
                }
            } else {
                toast.error('Failed to export data');
            }
        } finally {
            setIsExporting(false);
        }
    };

    // Получение данных для текущей страницы
    const getCurrentPageData = () => {
        const startIndex = (currentPage - 1) * rowsPerPage;
        const endIndex = startIndex + rowsPerPage;
        return filteredData.slice(startIndex, endIndex);
    };

    // Автоматическое применение фильтров при изменении настроек
    useEffect(() => {
        if (timesheetData.length > 0) {
            const timeoutId = setTimeout(() => {
                applyFilters();
            }, 300);

            return () => clearTimeout(timeoutId);
        }
    }, [dateType, customDateRange, selectedDepartment, selectedPerson, searchQuery]);

    // При изменении rowsPerPage сбрасываем на первую страницу
    useEffect(() => {
        setCurrentPage(1);
    }, [rowsPerPage]);

    // Форматирование часов
    const formatHours = (hours: number) => {
        return hours.toFixed(2);
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
                        onClick={loadTimesheetData}
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
                                onValueChange={(value) => setRowsPerPage(parseInt(value))}
                            >
                                <SelectTrigger id="rowsPerPage">
                                    <SelectValue placeholder="Rows per page" />
                                </SelectTrigger>
                                <SelectContent>
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
                            Reset Filters
                        </Button>
                        <Button
                            onClick={exportToExcel}
                            className="flex-1"
                            disabled={filteredData.length === 0 || isExporting}
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
                            Showing {filteredData.length > 0 ? ((currentPage - 1) * rowsPerPage) + 1 : 0}-
                            {Math.min(currentPage * rowsPerPage, filteredData.length)} of {filteredData.length} records
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                            <span className="ml-2">Loading data...</span>
                        </div>
                    ) : filteredData.length === 0 ? (
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
                                        {getCurrentPageData().map((record) => (
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

                            {/* Пагинация */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-between mt-4">
                                    <div className="text-sm text-muted-foreground">
                                        Page {currentPage} of {totalPages}
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                            disabled={currentPage === 1}
                                        >
                                            <ChevronLeft className="w-4 h-4 mr-1" />
                                            Previous
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                            disabled={currentPage === totalPages}
                                        >
                                            Next
                                            <ChevronRight className="w-4 h-4 ml-1" />
                                        </Button>
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