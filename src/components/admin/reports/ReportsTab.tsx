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

interface TimesheetRecord {
    id: number;
    date: string;
    hour: string;
    client: string;
    project: string;
    task: string;
    email: string;
    details: string;
    grade: string;
    detailedGrade: string;
    businessUnitUser: string;
    serviceLine: string;
    businessUnitProject: string;
    chargeable: boolean;
    employeeName: string;
    department: string;
    employeeId: string;
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
    const [departments, setDepartments] = useState<Department[]>([
        { id: 1, name: 'AOS & Tax', code: 'AOS' },
        { id: 2, name: 'Admin', code: 'ADM' },
        { id: 3, name: 'Audit', code: 'AUD' },
        { id: 4, name: 'CONS', code: 'CONS' },
        { id: 5, name: 'Compass support', code: 'CMP' }
    ]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    // Пагинация
    const [currentPage, setCurrentPage] = useState<number>(1);
    const totalPages = Math.ceil(filteredData.length / rowsPerPage);

    // Получить даты на основе выбранного типа
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
                start.setDate(start.getDate() - start.getDay());
                end = new Date(start);
                end.setDate(end.getDate() + 6);
                break;
            case 'lastWeek':
                start = new Date(today);
                start.setDate(start.getDate() - start.getDay() - 7);
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

    // Генерация моковых данных
    const generateMockData = (): TimesheetRecord[] => {
        const clients = ['Microsoft', 'Google', 'Apple', 'Amazon', 'Tesla', 'Meta', 'Netflix', 'IBM', 'Oracle', 'Salesforce'];
        const projects = ['Project Alpha', 'Project Beta', 'Project Gamma', 'Project Delta', 'Project Epsilon', 'Project Zeta', 'Project Theta'];
        const tasks = ['Development', 'Design', 'Testing', 'Meeting', 'Documentation', 'Research', 'Code Review', 'Deployment'];
        const grades = ['A', 'B', 'C', 'D'];
        const detailedGrades = ['Excellent', 'Good', 'Average', 'Needs Improvement', 'Outstanding'];
        const serviceLines = ['Consulting', 'Development', 'Support', 'Training', 'Maintenance', 'Implementation'];
        const businessUnits = ['EU Business Unit', 'US Business Unit', 'APAC Business Unit', 'MEA Business Unit'];

        const employeesList: Employee[] = [
            { id: 1, name: 'Emile A. Montgomery', department: 'AOS & Tax', email: 'emile.montgomery@company.com', status: 'active' },
            { id: 2, name: 'Terry Eisenberg', department: 'Audit', email: 'terry.eisenberg@company.com', status: 'active' },
            { id: 3, name: 'Turgut Drinksteller', department: 'CONS', email: 'turgut.drinksteller@company.com', status: 'active' },
            { id: 4, name: 'Agertin Eckalena', department: 'Admin', email: 'agertin.eckalena@company.com', status: 'active' },
            { id: 5, name: 'Adolf Grynkysse', department: 'Compass support', email: 'adolf.grynkysse@company.com', status: 'active' },
            { id: 6, name: 'Ching\'s Unladayer', department: 'Admin', email: 'ching.unladayer@company.com', status: 'active' },
            { id: 7, name: 'Dyreusen Ynutzova', department: 'Admin', email: 'dyreusen.ynutzova@company.com', status: 'active' },
            { id: 8, name: 'Karisa Zakirova', department: 'Admin', email: 'karisa.zakirova@company.com', status: 'active' },
        ];

        const data: TimesheetRecord[] = [];

        // Генерируем данные за последние 30 дней
        for (let i = 0; i < 200; i++) {
            const dateOffset = Math.floor(Math.random() * 30);
            const recordDate = new Date();
            recordDate.setDate(recordDate.getDate() - dateOffset);

            const employee = employeesList[Math.floor(Math.random() * employeesList.length)];
            const hours = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'][Math.floor(Math.random() * 10)];
            const client = clients[Math.floor(Math.random() * clients.length)];
            const project = projects[Math.floor(Math.random() * projects.length)];
            const task = tasks[Math.floor(Math.random() * tasks.length)];
            const grade = grades[Math.floor(Math.random() * grades.length)];
            const detailedGrade = detailedGrades[Math.floor(Math.random() * detailedGrades.length)];
            const serviceLine = serviceLines[Math.floor(Math.random() * serviceLines.length)];
            const businessUnit = businessUnits[Math.floor(Math.random() * businessUnits.length)];
            const chargeable = Math.random() > 0.3;

            const detailsOptions = [
                `Completed ${task.toLowerCase()} tasks for ${client}`,
                `Worked on ${project} deliverables`,
                `Attended client meeting for ${client}`,
                `Developed features for ${project}`,
                `Tested functionality for ${project}`,
                `Reviewed code for ${project}`,
                `Created documentation for ${task.toLowerCase()}`,
                `Provided support for ${client}`
            ];

            data.push({
                id: i + 1,
                date: recordDate.toISOString().split('T')[0],
                hour: hours,
                client,
                project,
                task,
                email: employee.email || '',
                details: detailsOptions[Math.floor(Math.random() * detailsOptions.length)],
                grade,
                detailedGrade,
                businessUnitUser: `${businessUnit} - ${employee.name}`,
                serviceLine,
                businessUnitProject: `${businessUnit} - ${project}`,
                chargeable,
                employeeName: employee.name,
                department: employee.department,
                employeeId: employee.id.toString()
            });
        }

        return data;
    };

    // Загрузка данных
    const loadTimesheetData = async () => {
        setIsLoading(true);
        try {
            const mockData = generateMockData();
            setTimesheetData(mockData);

            // Загрузка сотрудников
            const mockEmployees: Employee[] = [
                { id: 1, name: 'Emile A. Montgomery', department: 'AOS & Tax', email: 'emile.montgomery@company.com', status: 'active' },
                { id: 2, name: 'Terry Eisenberg', department: 'Audit', email: 'terry.eisenberg@company.com', status: 'active' },
                { id: 3, name: 'Turgut Drinksteller', department: 'CONS', email: 'turgut.drinksteller@company.com', status: 'active' },
                { id: 4, name: 'Agertin Eckalena', department: 'Admin', email: 'agertin.eckalena@company.com', status: 'active' },
                { id: 5, name: 'Adolf Grynkysse', department: 'Compass support', email: 'adolf.grynkysse@company.com', status: 'active' },
                { id: 6, name: 'Ching\'s Unladayer', department: 'Admin', email: 'ching.unladayer@company.com', status: 'active' },
                { id: 7, name: 'Dyreusen Ynutzova', department: 'Admin', email: 'dyreusen.ynutzova@company.com', status: 'active' },
                { id: 8, name: 'Karisa Zakirova', department: 'Admin', email: 'karisa.zakirova@company.com', status: 'active' },
            ];

            setEmployees(mockEmployees);

            // Сразу применить фильтры после загрузки данных
            applyFilters(mockData);

            toast.success('Data loaded successfully');
        } catch (error) {
            console.error('Failed to load data:', error);
            toast.error('Failed to load data');
        } finally {
            setIsLoading(false);
        }
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
            if (selectedDepartment !== 'all' && record.department !== selectedDepartment) {
                return false;
            }

            // Фильтр по сотруднику
            if (selectedPerson !== 'all' && record.employeeId !== selectedPerson) {
                return false;
            }

            // Фильтр по поиску
            if (searchQuery) {
                const searchLower = searchQuery.toLowerCase();
                return (
                    record.employeeName.toLowerCase().includes(searchLower) ||
                    record.client.toLowerCase().includes(searchLower) ||
                    record.project.toLowerCase().includes(searchLower) ||
                    record.email.toLowerCase().includes(searchLower) ||
                    record.details.toLowerCase().includes(searchLower) ||
                    record.task.toLowerCase().includes(searchLower)
                );
            }

            return true;
        });

        setFilteredData(filtered);
        setCurrentPage(1);

        if (filtered.length === 0) {
            toast.warning('No records found with current filters');
        } else {
            toast.success(`Found ${filtered.length} records`);
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

        // Показать все данные
        setFilteredData(timesheetData);

        toast.success('Filters reset');
    };

    // Экспорт в Excel
    const exportToExcel = () => {
        const dataToExport = filteredData.slice(
            (currentPage - 1) * rowsPerPage,
            currentPage * rowsPerPage
        );

        if (dataToExport.length === 0) {
            toast.error('No data to export');
            return;
        }

        const csvContent = [
            ['Date', 'Hour', 'Client', 'Project', 'Task', 'Email', 'Details', 'Grade', 'Detailed Grade', 'Business Unit User', 'Service Line', 'Business Unit Project', 'Chargeable'],
            ...dataToExport.map(record => [
                record.date,
                record.hour,
                record.client,
                record.project,
                record.task,
                record.email,
                record.details,
                record.grade,
                record.detailedGrade,
                record.businessUnitUser,
                record.serviceLine,
                record.businessUnitProject,
                record.chargeable ? 'Yes' : 'No'
            ])
        ].map(row => row.join(',')).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `timesheet_report_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success('Report exported successfully');
    };

    // Получение данных для текущей страницы
    const getCurrentPageData = () => {
        const startIndex = (currentPage - 1) * rowsPerPage;
        const endIndex = startIndex + rowsPerPage;
        return filteredData.slice(startIndex, endIndex);
    };

    // Инициализация
    useEffect(() => {
        loadTimesheetData();
    }, []);

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

    // Рендер статуса chargeable
    const renderChargeable = (chargeable: boolean) => {
        return chargeable ? (
            <div className="flex items-center justify-center">
                <Check className="w-4 h-4 text-green-600" />
            </div>
        ) : (
            <div className="flex items-center justify-center">
                <X className="w-4 h-4 text-gray-400" />
            </div>
        );
    };

    // Рендер оценки
    const renderGrade = (grade: string) => {
        const gradeColors: Record<string, string> = {
            'A': 'text-green-600 bg-green-50 border-green-200',
            'B': 'text-blue-600 bg-blue-50 border-blue-200',
            'C': 'text-yellow-600 bg-yellow-50 border-yellow-200',
            'D': 'text-red-600 bg-red-50 border-red-200'
        };

        const colorClass = gradeColors[grade] || 'text-gray-600 bg-gray-50 border-gray-200';

        return (
            <span className={`px-2 py-1 rounded border text-xs font-bold ${colorClass}`}>
                {grade}
            </span>
        );
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
                        disabled={isLoading}
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
                        >
                            Reset Filters
                        </Button>
                        <Button
                            // variant="secondary"
                            onClick={exportToExcel}
                            className="flex-1"
                            disabled={filteredData.length === 0}
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Export to Excel
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
                            Showing {((currentPage - 1) * rowsPerPage) + 1}-
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
                                            <TableHead className="min-w-[80px]">Hour</TableHead>
                                            <TableHead className="min-w-[120px]">Client</TableHead>
                                            <TableHead className="min-w-[120px]">Project</TableHead>
                                            <TableHead className="min-w-[100px]">Task</TableHead>
                                            <TableHead className="min-w-[150px]">Email</TableHead>
                                            <TableHead className="min-w-[200px]">Details</TableHead>
                                            <TableHead className="min-w-[80px]">Grade</TableHead>
                                            <TableHead className="min-w-[120px]">Detailed Grade</TableHead>
                                            <TableHead className="min-w-[150px]">Business Unit User</TableHead>
                                            <TableHead className="min-w-[120px]">Service Line</TableHead>
                                            <TableHead className="min-w-[150px]">Business Unit Project</TableHead>
                                            <TableHead className="min-w-[100px]">Chargeable</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {getCurrentPageData().map((record) => (
                                            <TableRow key={record.id} className="hover:bg-gray-50">
                                                <TableCell className="font-medium">
                                                    {new Date(record.date).toLocaleDateString('en-GB')}
                                                </TableCell>
                                                <TableCell className="font-mono">
                                                    {record.hour}
                                                </TableCell>
                                                <TableCell className="font-medium">
                                                    {record.client}
                                                </TableCell>
                                                <TableCell>
                                                    <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                                                        {record.project}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                                                        {record.task}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-sm text-gray-600">
                                                    {record.email}
                                                </TableCell>
                                                <TableCell className="text-sm max-w-[200px] truncate" title={record.details}>
                                                    {record.details}
                                                </TableCell>
                                                <TableCell>
                                                    {renderGrade(record.grade)}
                                                </TableCell>
                                                <TableCell className="text-sm">
                                                    {record.detailedGrade}
                                                </TableCell>
                                                <TableCell className="text-sm">
                                                    <span className="px-2 py-1 bg-green-50 text-green-700 rounded text-xs">
                                                        {record.businessUnitUser}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded text-xs">
                                                        {record.serviceLine}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-sm">
                                                    <span className="px-2 py-1 bg-orange-50 text-orange-700 rounded text-xs">
                                                        {record.businessUnitProject}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    {renderChargeable(record.chargeable)}
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