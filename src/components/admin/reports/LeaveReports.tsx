import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { useGetLeaveTasks } from '../../../hooks/useTasks';

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

// Группированная запись
interface GroupedLeaveRecord {
    id: string; // Уникальный ключ для группировки
    user_email: string;
    user_country_code: string;
    user_department: string;
    position: string;
    detailed_grade: string;
    task_type: string;
    task: string;
    description: string;
    leave_document: LeaveDocument | null;
    dates: string[]; // Массив дат
    total_hours: number; // Суммарное количество часов
    records: LeaveRecord[]; // Исходные записи для детализации
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

interface LeaveTask {
    id: number;
    name: string;
    task_type?: number;
}

export function LeaveReports() {
    // Состояния для фильтров дат
    const [dateType, setDateType] = useState<string>('thisMonth');
    const [customDateRange, setCustomDateRange] = useState<DateRange>({
        start: format(new Date(), 'yyyy-MM-dd'),
        end: format(new Date(), 'yyyy-MM-dd')
    });
    const [specificDate, setSpecificDate] = useState<string>('');

    // Состояние для управления группировкой
    const [groupByDocument, setGroupByDocument] = useState<boolean>(true);
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

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
    const leave_tasks = useUserStore((state) => state.leave_tasks);
    const { mutate: getLeaveTasks } = useGetLeaveTasks();

    // Безопасное получение массивов
    const countriesArray = Array.isArray(countries) ? countries : [];
    const positionsArray = Array.isArray(positions) ? positions : [];
    const gradesArray = Array.isArray(grades) ? grades : [];
    const departmentsArray = Array.isArray(store_departments)
        ? store_departments
        : (store_departments ? Object.values(store_departments) : []);

    // Загружаем задачи для отпусков при монтировании компонента
    useEffect(() => {
        getLeaveTasks();
    }, [getLeaveTasks]);

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

    // Функция группировки записей
    const groupRecordsByDocument = useCallback((records: LeaveRecord[]): GroupedLeaveRecord[] => {
        const groups = new Map<string, GroupedLeaveRecord>();

        records.forEach((record) => {
            // Определяем ключ для группировки
            let groupKey: string;

            if (record.leave_document && groupByDocument) {
                // Если есть документ и включена группировка - группируем по ID документа
                groupKey = `doc_${record.leave_document.id}`;
            } else {
                // Если нет документа или группировка выключена - создаем уникальный ключ для каждой записи
                groupKey = `record_${record.date}_${record.user_email}_${Math.random()}`;
            }

            if (groups.has(groupKey)) {
                // Обновляем существующую группу
                const existing = groups.get(groupKey)!;
                existing.dates.push(record.date);
                existing.total_hours += record.hours;
                existing.records.push(record);
                // Сортируем даты
                existing.dates.sort();
            } else {
                // Создаем новую группу
                groups.set(groupKey, {
                    id: groupKey,
                    user_email: record.user_email,
                    user_country_code: record.user_country_code,
                    user_department: record.user_department,
                    position: record.position,
                    detailed_grade: record.detailed_grade,
                    task_type: record.task_type,
                    task: record.task,
                    description: record.description,
                    leave_document: record.leave_document,
                    dates: [record.date],
                    total_hours: record.hours,
                    records: [record]
                });
            }
        });

        return Array.from(groups.values());
    }, [groupByDocument]);

    // Получаем сырые данные
    const rawLeaveData = leaves_reports?.leaves || [];
    const totalCount = leaves_reports?.total_count || 0;
    const totalPages = Math.ceil(totalCount / rowsPerPage);

    // Группируем данные
    const groupedData = useMemo(() => {
        return groupRecordsByDocument(rawLeaveData);
    }, [rawLeaveData, groupRecordsByDocument]);

    // Переключение разворачивания группы
    const toggleGroup = (groupId: string) => {
        setExpandedGroups(prev => {
            const newSet = new Set(prev);
            if (newSet.has(groupId)) {
                newSet.delete(groupId);
            } else {
                newSet.add(groupId);
            }
            return newSet;
        });
    };

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
        setExpandedGroups(new Set());
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

    // Форматирование списка дат для отображения
    const formatDatesList = (dates: string[]): string => {
        if (dates.length === 1) {
            return new Date(dates[0]).toLocaleDateString('en-GB');
        }
        if (dates.length <= 3) {
            return dates.map(d => new Date(d).toLocaleDateString('en-GB')).join(', ');
        }
        return `${new Date(dates[0]).toLocaleDateString('en-GB')} ... ${new Date(dates[dates.length - 1]).toLocaleDateString('en-GB')} (${dates.length} days)`;
    };

    // Получаем уникальные значения для фильтров из данных (как запасной вариант)
    const getUniquePositionsFromData = () => {
        const uniquePositions = new Set<string>();
        rawLeaveData.forEach(record => {
            if (record.position) uniquePositions.add(record.position);
        });
        return Array.from(uniquePositions);
    };

    const getUniqueGradesFromData = () => {
        const uniqueGrades = new Set<string>();
        rawLeaveData.forEach(record => {
            if (record.detailed_grade) uniqueGrades.add(record.detailed_grade);
        });
        return Array.from(uniqueGrades);
    };

    // Получаем уникальные задачи из данных (как запасной вариант)
    const getUniqueTasksFromData = () => {
        const tasks = new Set<string>();
        rawLeaveData.forEach(record => {
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
                <div className="flex gap-2">
                    <Button
                        variant={groupByDocument ? "default" : "outline"}
                        size="sm"
                        onClick={() => setGroupByDocument(!groupByDocument)}
                        disabled={isLoading}
                    >
                        {groupByDocument ? "✓ Group by Document" : "Group by Document"}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
                        <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Карточка с фильтрами (без изменений) */}
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



                        {/* Task Name Select - используем данные из leave_tasks */}
                        <div key="filter-task">
                            <Select value={selectedTaskName || "all"} onValueChange={setSelectedTaskName}>
                                <SelectTrigger className="h-9 text-sm">
                                    <SelectValue placeholder="Task" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Tasks</SelectItem>
                                    {leave_tasks && leave_tasks.length > 0 ? (
                                        leave_tasks.map((task: LeaveTask) => (
                                            <SelectItem key={`task-${task.id}`} value={task.name}>
                                                {task.name}
                                            </SelectItem>
                                        ))
                                    ) : (
                                        // Запасной вариант из данных, если leave_tasks пуст
                                        getUniqueTasksFromData().map((task) => (
                                            <SelectItem key={`task-data-${task}`} value={task}>
                                                {task}
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
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
                        <CardTitle className="text-lg">
                            Leave Reports Results
                            {groupByDocument && groupedData.length !== rawLeaveData.length && (
                                <span className="text-sm font-normal text-muted-foreground ml-2">
                                    (Grouped: {groupedData.length} groups from {rawLeaveData.length} records)
                                </span>
                            )}
                        </CardTitle>
                        <div className="text-xs text-muted-foreground">
                            Showing {groupByDocument ? groupedData.length : rawLeaveData.length} items
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8" key="loading">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                            <span className="ml-2 text-sm">Loading...</span>
                        </div>
                    ) : (groupByDocument ? groupedData.length === 0 : rawLeaveData.length === 0) ? (
                        <div className="text-center py-8 text-sm text-muted-foreground" key="no-data">
                            No leave records found.
                        </div>
                    ) : (
                        <React.Fragment key="data-table">
                            <div className="rounded-md border overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-gray-50" key="table-header">
                                            <TableHead className="text-xs w-8"></TableHead>
                                            <TableHead className="text-xs">Dates</TableHead>
                                            <TableHead className="text-xs">User Email</TableHead>
                                            <TableHead className="text-xs">Country</TableHead>
                                            <TableHead className="text-xs">Department</TableHead>
                                            <TableHead className="text-xs">Position</TableHead>
                                            <TableHead className="text-xs">Grade</TableHead>
                                            <TableHead className="text-xs">Leave Type</TableHead>
                                            <TableHead className="text-xs">Task</TableHead>
                                            <TableHead className="text-xs">Total Hours</TableHead>
                                            <TableHead className="text-xs">Description</TableHead>
                                            <TableHead className="text-xs">Document</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {(groupByDocument ? groupedData : rawLeaveData.map(r => ({
                                            ...r,
                                            id: `single_${r.date}_${r.user_email}`,
                                            dates: [r.date],
                                            total_hours: r.hours,
                                            records: [r]
                                        } as GroupedLeaveRecord))).map((item: GroupedLeaveRecord) => (
                                            <React.Fragment key={item.id}>
                                                <TableRow
                                                    className={`text-sm ${item.records.length > 1 ? 'cursor-pointer hover:bg-gray-50' : ''}`}
                                                    onClick={() => item.records.length > 1 && toggleGroup(item.id)}
                                                >
                                                    <TableCell className="text-xs">
                                                        {item.records.length > 1 && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-6 w-6 p-0"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    toggleGroup(item.id);
                                                                }}
                                                            >
                                                                {expandedGroups.has(item.id) ? '▼' : '▶'}
                                                            </Button>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-xs font-mono">
                                                        {formatDatesList(item.dates)}
                                                        {item.records.length > 1 && (
                                                            <span className="ml-1 text-xs text-muted-foreground">
                                                                ({item.records.length} days)
                                                            </span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-xs">{item.user_email || '-'}</TableCell>
                                                    <TableCell className="text-xs">{item.user_country_code || '-'}</TableCell>
                                                    <TableCell className="text-xs">
                                                        <span className="px-1.5 py-0.5 bg-blue-50 rounded text-xs">
                                                            {item.user_department || '-'}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-xs">{item.position || '-'}</TableCell>
                                                    <TableCell className="text-xs">
                                                        <span className="px-1.5 py-0.5 bg-purple-50 rounded text-xs">
                                                            {item.detailed_grade || '-'}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-xs">
                                                        <span className="px-1.5 py-0.5 bg-green-50 rounded text-xs">
                                                            {item.task_type || '-'}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-xs">{item.task || '-'}</TableCell>
                                                    <TableCell className="font-mono text-xs font-semibold">
                                                        {item.total_hours || 0}h
                                                        {item.records.length > 1 && (
                                                            <span className="text-xs text-muted-foreground ml-1">
                                                                (avg: {(item.total_hours / item.records.length).toFixed(1)}h)
                                                            </span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-xs max-w-[200px] truncate" title={item.description}>
                                                        {item.description || '-'}
                                                    </TableCell>
                                                    <TableCell className="text-xs">
                                                        {item.leave_document ? (
                                                            <div className="flex gap-1">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-7 w-7 p-0"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleDownloadDocument(item.leave_document!);
                                                                    }}
                                                                    title="Download document"
                                                                >
                                                                    <Download className="w-3 h-3" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-7 w-7 p-0"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleViewDocument(item.leave_document!);
                                                                    }}
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

                                                {/* Детали для развернутой группы */}
                                                {expandedGroups.has(item.id) && item.records.length > 1 && (
                                                    <TableRow className="bg-gray-50">
                                                        <TableCell colSpan={12} className="p-0">
                                                            <div className="p-3 pl-8">
                                                                <div className="text-sm font-medium mb-2">Detailed records:</div>
                                                                <Table>
                                                                    <TableHeader>
                                                                        <TableRow className="bg-gray-100">
                                                                            <TableHead className="text-xs">Date</TableHead>
                                                                            <TableHead className="text-xs">Hours</TableHead>
                                                                            <TableHead className="text-xs">Description</TableHead>
                                                                        </TableRow>
                                                                    </TableHeader>
                                                                    <TableBody>
                                                                        {item.records.map((record, idx) => (
                                                                            <TableRow key={`detail-${idx}`}>
                                                                                <TableCell className="text-xs">
                                                                                    {new Date(record.date).toLocaleDateString('en-GB')}
                                                                                </TableCell>
                                                                                <TableCell className="text-xs font-mono">{record.hours}h</TableCell>
                                                                                <TableCell className="text-xs">{record.description || '-'}</TableCell>
                                                                            </TableRow>
                                                                        ))}
                                                                    </TableBody>
                                                                </Table>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </React.Fragment>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Пагинация */}
                            {totalPages > 1 && !groupByDocument && (
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

                            {/* Информация для сгруппированного режима */}
                            {groupByDocument && groupedData.length > 0 && (
                                <div className="mt-4 text-xs text-muted-foreground text-center">
                                    * Records with the same document ID are grouped together. Click on a grouped row to see details.
                                </div>
                            )}
                        </React.Fragment>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}