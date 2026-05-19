import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Input } from '../../ui/input';
import {
    Edit, Trash2, FolderKanban, Plus, ChevronDown, ChevronUp,
    ChevronLeft, ChevronRight, Search, X, Download
} from 'lucide-react';
import { Project } from '../../TimeTrackerContext';
import { Client, Department, Position, User } from '../../../types/types';
import { useGetDepartments } from '../../../hooks/useDepartments';
import { useStatus } from '../../../hooks/useStatus';
import { useGetCountries } from '../../../hooks/useCountries';
import { useGetClients } from '../../../hooks/useClients';
import { useGetServiceLines } from '../../../hooks/useServiceLines';
import { useGetTaskTypes } from '../../../hooks/useTasks';
import { useDeleteProject, useGetProjects, useExportProjectsExcelMutation } from '../../../hooks/useProject';
import { useUserStore } from '../../../store/UsersStore';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '../../ui/alert-dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../../ui/select';

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}

interface ProjectsTableProps {
    entries: any[];
    clients: Client[];
    users: User[];
    positions: Position[];
    departments: Department[];
    onEdit: (project: Project) => void;
    onAdd: () => void;
}

interface Filters {
    code: string;
    client: string;
    manager: string;
    country: string;
    department: string;
    status: string;
}

type SortOption = {
    value: string;
    label: string;
};

const sortOptions: SortOption[] = [
    { value: 'code', label: 'Code (A-Z)' },
    { value: '-code', label: 'Code (Z-A)' },
    { value: 'client_name', label: 'Client (A-Z)' },
    { value: '-client_name', label: 'Client (Z-A)' },
    { value: 'manager_email', label: 'Manager (A-Z)' },
    { value: '-manager_email', label: 'Manager (Z-A)' },
    { value: 'country_code', label: 'Country (A-Z)' },
    { value: '-country_code', label: 'Country (Z-A)' },
    { value: 'department_name', label: 'Department (A-Z)' },
    { value: '-department_name', label: 'Department (Z-A)' },
    { value: 'status', label: 'Status (A-Z)' },
    { value: '-status', label: 'Status (Z-A)' },
];

export function ProjectsTable({
    entries,
    clients,
    users,
    departments,
    onEdit,
    onAdd,
}: ProjectsTableProps) {
    const { mutate: getDepartments } = useGetDepartments();
    const { mutate: getStatuses } = useStatus();
    const { mutate: getCountries } = useGetCountries();
    const { mutate: getClients } = useGetClients();
    const { mutate: getServiceLines } = useGetServiceLines();
    const { mutate: getTaskTypes } = useGetTaskTypes();
    const { mutate: getProjects, isPending: isLoadingProjects } = useGetProjects();
    const { mutate: deleteProject } = useDeleteProject();
    const { mutate: exportProjects, isPending: isExporting } = useExportProjectsExcelMutation();

    const store_projects = useUserStore((state) => state.projects);
    const store_departments = useUserStore((state) => state.departments);
    const store_pagination = useUserStore((state) => state.projectsPagination);
    const store_countries = useUserStore((state) => state.countries);
    const store_statuses = useUserStore((state) => state.statuses);

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [projectToDelete, setProjectToDelete] = useState<any>(null);
    const [expandedCodeDrawers, setExpandedCodeDrawers] = useState<Record<string, boolean>>({});
    const [currentPage, setCurrentPage] = useState(1);

    const [localFilters, setLocalFilters] = useState<Filters>({
        code: '',
        client: '',
        manager: '',
        country: '',
        department: '',
        status: '',
    });

    const debouncedCode = useDebounce(localFilters.code, 500);
    const debouncedClient = useDebounce(localFilters.client, 500);
    const debouncedManager = useDebounce(localFilters.manager, 500);
    const debouncedCountry = useDebounce(localFilters.country, 300);
    const debouncedDepartment = useDebounce(localFilters.department, 300);
    const debouncedStatus = useDebounce(localFilters.status, 300);

    const [ordering, setOrdering] = useState<string>('code');
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    const pageSize = 30;

    // Загрузка справочников при монтировании
    useEffect(() => {
        getDepartments();
        getStatuses();
        getServiceLines();
        getCountries();
        getClients();
        getTaskTypes();
    }, []);

    const loadProjects = useCallback((page: number) => {
        const params: any = {
            page,
            page_size: pageSize,
            ordering: ordering,
        };

        if (debouncedCode && debouncedCode.trim()) params.code = debouncedCode;
        if (debouncedClient && debouncedClient.trim()) params.client_name = debouncedClient;
        if (debouncedManager && debouncedManager.trim()) params.manager_email = debouncedManager;
        if (debouncedCountry && debouncedCountry.trim()) params.country_code = debouncedCountry;
        if (debouncedDepartment && debouncedDepartment.trim()) params.department_name = debouncedDepartment;
        if (debouncedStatus && debouncedStatus.trim()) params.status_name = debouncedStatus;

        console.log('📦 Final params to send:', params);
        getProjects(params);
        setCurrentPage(page);
    }, [debouncedCode, debouncedClient, debouncedManager, debouncedCountry, debouncedDepartment, debouncedStatus, ordering, pageSize, getProjects]);

    // Эффект для загрузки проектов при изменении фильтров
    useEffect(() => {
        if (!isInitialLoad) {
            loadProjects(1);
        } else {
            setIsInitialLoad(false);
            loadProjects(1);
        }
    }, [debouncedCode, debouncedClient, debouncedManager, debouncedCountry, debouncedDepartment, debouncedStatus, ordering]);

    // Функция для получения текущих параметров фильтрации
    const getCurrentFilterParams = useCallback(() => {
        const params: any = {};

        if (debouncedCode && debouncedCode.trim()) params.code = debouncedCode;
        if (debouncedClient && debouncedClient.trim()) params.client_name = debouncedClient;
        if (debouncedManager && debouncedManager.trim()) params.manager_email = debouncedManager;
        if (debouncedCountry && debouncedCountry.trim()) params.country_code = debouncedCountry;
        if (debouncedDepartment && debouncedDepartment.trim()) params.department_name = debouncedDepartment;
        if (debouncedStatus && debouncedStatus.trim()) params.status_name = debouncedStatus;
        if (ordering) params.ordering = ordering;

        // Добавляем пагинацию для экспорта (можно экспортировать все страницы или текущую)
        // params.page = currentPage;
        // params.page_size = pageSize;

        return params;
    }, [debouncedCode, debouncedClient, debouncedManager, debouncedCountry, debouncedDepartment, debouncedStatus, ordering]);

    // Функция для экспорта в Excel
    const handleExportExcel = () => {
        const filterParams = getCurrentFilterParams();
        console.log('📊 Exporting Excel with params:', filterParams);
        exportProjects(filterParams);
    };

    const handleFilterChange = (key: keyof Filters, value: string) => {
        console.log('CHANGE:', key, value);
        setLocalFilters(prev => ({ ...prev, [key]: value }));
    };

    const clearFilters = () => {
        const emptyFilters = {
            code: '',
            client: '',
            manager: '',
            country: '',
            department: '',
            status: '',
        };
        setLocalFilters(emptyFilters);
        setCurrentPage(1);
    };

    const getProjectStats = (projectId: string) => {
        const projectEntries = entries.filter(e => e.projectId === projectId);
        const totalHours = projectEntries.reduce((sum, e) => sum + (e.hours || 0), 0);
        return {
            entriesCount: projectEntries.length,
            totalHours: totalHours.toFixed(1),
            hasEntries: projectEntries.length > 0,
        };
    };

    const getProjectManagerName = (managerEmail?: string) => {
        if (!managerEmail) return 'Not assigned';
        const user = users?.find(u => u?.email === managerEmail);
        if (user) {
            const firstName = user.first_name || '';
            const lastName = user.last_name || '';
            const fullName = `${firstName} ${lastName}`.trim();
            return fullName || managerEmail;
        }
        return managerEmail;
    };

    const getDepartmentName = (departmentName?: string) => {
        if (!departmentName) return '-';

        const department = departmentsArray.find(
            (d: any) => d?.name === departmentName
        );

        return department?.name || departmentName;
    };

    // ✅ Безопасная функция получения последнего кода
    const getLastCode = (codes: any[]) => {
        if (!Array.isArray(codes) || codes.length === 0) return null;
        const last = codes[codes.length - 1];
        return last && typeof last === 'object' ? last : null;
    };

    const toggleCodeDrawer = (projectId: string) => {
        setExpandedCodeDrawers(prev => ({
            ...prev,
            [projectId]: !prev[projectId]
        }));
    };

    const handleDeleteClick = (project: any) => {
        const stats = getProjectStats(project.id);
        setProjectToDelete({
            id: project.id,
            ic: project.ic || '',
            code: project.codes?.[0]?.code || '',
            hasEntries: stats.hasEntries
        });
        setDeleteDialogOpen(true);
    };

    const handleConfirmDelete = () => {
        if (!projectToDelete) return;

        deleteProject(projectToDelete.id, {
            onSuccess: () => {
                loadProjects(currentPage);
                setDeleteDialogOpen(false);
                setProjectToDelete(null);
            },
            onError: (error) => {
                console.error('Error deleting project:', error);
                setDeleteDialogOpen(false);
                setProjectToDelete(null);
            }
        });
    };

    const projects = store_projects || [];
    const totalCount = store_pagination?.count || 0;
    const totalPages = Math.ceil(totalCount / pageSize);
    const hasNext = !!store_pagination?.next;
    const hasPrev = !!store_pagination?.previous;

    const handleNextPage = () => {
        if (hasNext) {
            loadProjects(currentPage + 1);
        }
    };

    const handlePrevPage = () => {
        if (hasPrev) {
            loadProjects(currentPage - 1);
        }
    };

    const handleGoToPage = (page: number) => {
        if (page >= 1 && page <= totalPages && page !== currentPage) {
            loadProjects(page);
        }
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
                <Button
                    key="1"
                    variant="outline"
                    size="sm"
                    onClick={() => handleGoToPage(1)}
                    disabled={isLoadingProjects}
                    className="min-w-[40px] hidden sm:inline-flex"
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
                    onClick={() => handleGoToPage(i)}
                    disabled={isLoadingProjects}
                    className="min-w-[40px]"
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
                    onClick={() => handleGoToPage(totalPages)}
                    disabled={isLoadingProjects}
                    className="min-w-[40px] hidden sm:inline-flex"
                >
                    {totalPages}
                </Button>
            );
        }

        return pages;
    };

    const activeFiltersCount = Object.values(localFilters).filter(v => v && v !== '' && v !== 'all').length;

    // ✅ Удаляем дубликаты проектов по id
    const uniqueProjects = useMemo(() => {
        const uniqueMap = new Map();
        if (Array.isArray(projects)) {
            projects.forEach((project: any) => {
                if (project && project.id && !uniqueMap.has(project.id)) {
                    uniqueMap.set(project.id, project);
                }
            });
        }
        return Array.from(uniqueMap.values());
    }, [projects]);

    // ✅ Функция для безопасного получения массива стран
    const getCountriesArray = useMemo(() => {
        if (!store_countries) return [];
        if (Array.isArray(store_countries)) {
            return store_countries.filter(c => c && c !== null);
        }
        if (typeof store_countries === 'object') {
            return Object.values(store_countries).filter(c => c && c !== null);
        }
        return [];
    }, [store_countries]);

    // ✅ Функция для безопасного получения массива департаментов
    const getDepartmentsArray = useMemo(() => {
        if (!store_departments) return [];
        if (Array.isArray(store_departments)) {
            return store_departments.filter(d => d && d !== null);
        }
        if (typeof store_departments === 'object') {
            return Object.values(store_departments).filter(d => d && d !== null);
        }
        return [];
    }, [store_departments]);

    // ✅ Функция для безопасного получения массива статусов
    const getStatusesArray = useMemo(() => {
        if (!store_statuses) return [];
        if (Array.isArray(store_statuses)) {
            return store_statuses.filter(s => s && s !== null);
        }
        if (typeof store_statuses === 'object') {
            return Object.values(store_statuses).filter(s => s && s !== null);
        }
        return [];
    }, [store_statuses]);

    // Показываем лоадер при первой загрузке
    if (isLoadingProjects && uniqueProjects.length === 0 && isInitialLoad) {
        return (
            <div className="space-y-4">
                <div className="flex justify-between">
                    <div>
                        <h2 className="text-xl font-bold">Projects</h2>
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={onAdd} size="sm">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Project
                        </Button>
                    </div>
                </div>
                <div className="rounded-md border p-8 text-center text-slate-500">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    Loading projects...
                </div>
            </div>
        );
    }

    const countriesArray = getCountriesArray;
    const departmentsArray = getDepartmentsArray;
    const statusesArray = getStatusesArray;

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold">Projects</h2>
                    <p className="text-sm text-muted-foreground">
                        Total: {totalCount} projects
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        onClick={handleExportExcel}
                        size="sm"
                        variant="outline"
                        disabled={isExporting || isLoadingProjects}
                    >
                        <Download className="w-4 h-4 mr-2" />
                        {isExporting ? 'Exporting...' : 'Export to Excel'}
                    </Button>
                    <Button onClick={onAdd} size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Project
                    </Button>
                </div>
            </div>

            {/* Filters Row */}
            <div className="flex items-center gap-2 flex-wrap">
                <div className="relative w-[140px]">
                    <Input
                        placeholder="Code..."
                        value={localFilters.code}
                        onChange={(e) => handleFilterChange('code', e.target.value)}
                        className="text-sm pl-7 h-8"
                        autoComplete="off"
                    />
                </div>
                <div className="relative w-[140px]">
                    <Input
                        placeholder="Client..."
                        value={localFilters.client}
                        onChange={(e) => handleFilterChange('client', e.target.value)}
                        className="text-sm pl-7 h-8"
                        autoComplete="off"
                    />
                </div>
                <div className="relative w-[140px]">
                    <Input
                        placeholder="Manager..."
                        value={localFilters.manager}
                        onChange={(e) => handleFilterChange('manager', e.target.value)}
                        className="text-sm pl-7 h-8"
                        autoComplete="off"
                    />
                </div>

                {/* Select для стран */}
                <Select
                    value={localFilters.country || "all"}
                    onValueChange={(value) => handleFilterChange('country', value === "all" ? "" : value)}
                >
                    <SelectTrigger className="h-8 w-[120px]">
                        <SelectValue placeholder="Country" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Countries</SelectItem>
                        {countriesArray.map((country: any, idx: number) => {
                            if (!country || country === null) return null;
                            return (
                                <SelectItem key={country.id || idx} value={country.code || String(country.id)}>
                                    {country.name || 'Unknown'}
                                </SelectItem>
                            );
                        })}
                    </SelectContent>
                </Select>

                {/* Select для департаментов */}
                <Select
                    value={localFilters.department || "all"}
                    onValueChange={(value) => handleFilterChange('department', value === "all" ? "" : value)}
                >
                    <SelectTrigger className="h-8 w-[140px]">
                        <SelectValue placeholder="Department" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Departments</SelectItem>
                        {departmentsArray.map((dept: any, idx: number) => {
                            if (!dept || dept === null) return null;
                            return (
                                <SelectItem key={dept.id || idx} value={dept.name || String(dept.id)}>
                                    {dept.name || 'Unknown'}
                                </SelectItem>
                            );
                        })}
                    </SelectContent>
                </Select>

                {/* Select для статусов */}
                <Select
                    value={localFilters.status || "all"}
                    onValueChange={(value) => handleFilterChange('status', value === "all" ? "" : value)}
                >
                    <SelectTrigger className="h-8 w-[140px]">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        {statusesArray.map((status: any, idx: number) => {
                            if (!status || status === null) return null;
                            return (
                                <SelectItem key={status.id || idx} value={status.name || String(status.id)}>
                                    {status.name || 'Unknown'}
                                </SelectItem>
                            );
                        })}
                    </SelectContent>
                </Select>

                <Select
                    value={ordering}
                    onValueChange={(value) => setOrdering(value)}
                >
                    <SelectTrigger className="h-8 w-[140px]">
                        <SelectValue placeholder="Sort by..." />
                    </SelectTrigger>
                    <SelectContent>
                        {sortOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {activeFiltersCount > 0 && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={clearFilters}
                        title="Clear all filters"
                        className="h-8 px-2"
                    >
                        <X className="w-4 h-4" />
                    </Button>
                )}
            </div>

            {/* Table */}
            <div className="rounded-md border overflow-x-auto">
                <Table className="w-full text-sm">
                    <TableHeader>
                        <TableRow>
                            <TableHead className="min-w-[100px]">Code</TableHead>
                            <TableHead className="min-w-[120px]">Client</TableHead>
                            <TableHead className="min-w-[150px]">Manager</TableHead>
                            <TableHead className="min-w-[100px]">Reccuring</TableHead>
                            <TableHead className="min-w-[100px]">Status</TableHead>
                            <TableHead className="min-w-[100px]">Country</TableHead>
                            <TableHead className="min-w-[120px]">Department</TableHead>
                            <TableHead className="min-w-[80px]">Actions</TableHead>
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {uniqueProjects.length === 0 && !isLoadingProjects ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                                    No projects found matching your filters
                                </TableCell>
                            </TableRow>
                        ) : (
                            uniqueProjects.map((project: any, index: number) => {
                                const codes = Array.isArray(project?.codes) ? project.codes : [];
                                const lastCode = getLastCode(codes);
                                const isExpanded = expandedCodeDrawers[project.id];
                                const uniqueKey = `${project.id}-${index}-${currentPage}`;

                                return (
                                    <React.Fragment key={uniqueKey}>
                                        <TableRow className="hover:bg-slate-50">
                                            <TableCell className="min-w-0">
                                                <div className="flex items-center gap-1 min-w-0">
                                                    <FolderKanban className="w-3 h-3 flex-shrink-0 text-slate-400" />
                                                    <span className="truncate text-xs font-mono">
                                                        {lastCode && lastCode.code ? lastCode.code : 'No code'}
                                                    </span>
                                                    {codes.length > 1 && (
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="h-5 w-5 p-0 flex-shrink-0"
                                                            onClick={() => toggleCodeDrawer(project.id)}
                                                        >
                                                            {isExpanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>

                                            <TableCell className="min-w-0">
                                                <Badge variant="outline" className="truncate block max-w-full text-xs font-normal">
                                                    {project?.client || 'Not assigned'}
                                                </Badge>
                                            </TableCell>

                                            <TableCell className="min-w-0">
                                                <span className="truncate block text-xs">
                                                    {getProjectManagerName(project?.manager)}
                                                </span>
                                            </TableCell>

                                            <TableCell className="min-w-0">
                                                <span className="truncate block text-xs">
                                                    {project?.is_code_recurring ? 'yes' : 'no'}
                                                </span>
                                            </TableCell>

                                            <TableCell className="min-w-0">
                                                <Badge variant="secondary" className="text-xs">
                                                    {project?.status_name || project?.status || '-'}
                                                </Badge>
                                            </TableCell>

                                            <TableCell>
                                                <Badge variant="outline" className="text-xs font-mono">
                                                    {project?.country || '-'}
                                                </Badge>
                                            </TableCell>

                                            <TableCell className="min-w-0">
                                                <span className="truncate block text-xs">
                                                    {getDepartmentName(project?.department)}
                                                </span>
                                            </TableCell>

                                            <TableCell>
                                                <div className="flex gap-1">
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-7 w-7"
                                                        onClick={() => onEdit(project)}
                                                    >
                                                        <Edit size={14} />
                                                    </Button>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-7 w-7"
                                                        onClick={() => handleDeleteClick(project)}
                                                    >
                                                        <Trash2 size={14} className="text-red-500" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>

                                        {isExpanded && codes.length > 1 && (
                                            <TableRow>
                                                <TableCell colSpan={8} className="bg-gray-50 p-2">
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {codes.map((c: any, codeIndex: number) => (
                                                            <Badge key={`${project.id}-code-${codeIndex}`} variant="secondary" className="text-xs font-mono">
                                                                {c?.code || 'Unknown'}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </React.Fragment>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Пагинация */}
            {totalPages > 0 && (
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4">
                    <div className="text-xs text-muted-foreground">
                        Showing {uniqueProjects.length} of {totalCount} projects
                    </div>

                    <div className="flex items-center gap-2 flex-wrap justify-center">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handlePrevPage}
                            disabled={!hasPrev || isLoadingProjects}
                        >
                            <ChevronLeft size={14} className="mr-1" />
                            Previous
                        </Button>

                        <div className="hidden md:flex gap-1">
                            {renderPageNumbers()}
                        </div>

                        <div className="flex md:hidden items-center gap-2">
                            <Select
                                value={currentPage.toString()}
                                onValueChange={(value) => handleGoToPage(parseInt(value))}
                                disabled={isLoadingProjects}
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

                        <div className="hidden sm:flex md:hidden items-center gap-2">
                            <span className="text-sm font-medium">{currentPage}</span>
                            <span className="text-sm text-muted-foreground">of {totalPages}</span>
                        </div>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleNextPage}
                            disabled={!hasNext || isLoadingProjects}
                        >
                            Next
                            <ChevronRight size={14} className="ml-1" />
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
                                    handleGoToPage(page);
                                }
                            }}
                            className="w-16 h-8 px-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={isLoadingProjects}
                        />
                    </div>
                </div>
            )}

            {totalPages > 0 && (
                <div className="text-center text-xs text-muted-foreground pt-2 border-t">
                    Page {currentPage} of {totalPages} • Total {totalCount} projects
                </div>
            )}

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Project?</AlertDialogTitle>
                        <AlertDialogDescription>
                            {projectToDelete && (
                                <>
                                    You are about to delete project{' '}
                                    <span className="font-semibold text-red-600">
                                        {projectToDelete.code} - {projectToDelete.ic || 'No IC'}
                                    </span>
                                    .
                                    {projectToDelete.hasEntries && (
                                        <div className="mt-3 p-3 bg-red-50 rounded-md">
                                            <p className="text-sm font-medium text-red-700">
                                                ⚠️ Warning: This project has time entries associated with it.
                                                Deleting this project will also remove all related time tracking data.
                                            </p>
                                        </div>
                                    )}
                                </>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmDelete} className="bg-red-600 hover:bg-red-700">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}