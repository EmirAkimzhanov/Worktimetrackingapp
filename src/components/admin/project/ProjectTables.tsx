import React, { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Edit, Trash2, FolderKanban, Plus, ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { Project } from '../../TimeTrackerContext';
import { Client, Department, Position, User } from '../../../types/types';
import { useGetDepartments } from '../../../hooks/useDepartments';
import { useStatus } from '../../../hooks/useStatus';
import { useGetCountries } from '../../../hooks/useCountries';
import { useGetClients } from '../../../hooks/useClients';
import { useGetServiceLines } from '../../../hooks/useServiceLines';
import { useGetTaskTypes } from '../../../hooks/useTasks';
import { useDeleteProject, useGetProjects } from '../../../hooks/useProject';
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

interface ProjectsTableProps {
    entries: any[];
    clients: Client[];
    users: User[];
    positions: Position[];
    departments: Department[];
    onEdit: (project: Project) => void;
    onAdd: () => void;
}

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

    const store_projects = useUserStore((state) => state.projects);
    const store_departments = useUserStore((state) => state.departments);
    const store_pagination = useUserStore((state) => state.projectsPagination);

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [projectToDelete, setProjectToDelete] = useState<any>(null);
    const [expandedCodeDrawers, setExpandedCodeDrawers] = useState<Record<string, boolean>>({});
    const [currentPage, setCurrentPage] = useState(1);
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

    // Загрузка первой страницы проектов
    useEffect(() => {
        loadProjects(1);
    }, []);

    const loadProjects = (page: number) => {
        getProjects({ page, page_size: pageSize });
        setCurrentPage(page);
    };

    const getProjectStats = (projectId: string) => {
        const projectEntries = entries.filter(e => e.projectId === projectId);
        const totalHours = projectEntries.reduce((sum, e) => sum + e.hours, 0);
        return {
            entriesCount: projectEntries.length,
            totalHours: totalHours.toFixed(1),
            hasEntries: projectEntries.length > 0,
        };
    };

    const getProjectManagerName = (managerEmail?: string) => {
        if (!managerEmail) return 'Not assigned';
        const user = users.find(u => u.email === managerEmail);
        return user ? `${user.first_name} ${user.last_name}` : managerEmail;
    };

    const getDepartmentName = (departmentName?: string) => {
        if (!departmentName) return '-';
        const department = store_departments?.find(d => d.name === departmentName);
        return department ? department.name : departmentName;
    };

    const getLastCode = (codes: any[]) => codes?.[codes.length - 1];

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
                // После удаления перезагружаем текущую страницу
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

    // Функция для отображения номеров страниц
    const renderPageNumbers = () => {
        const pages = [];
        const maxVisiblePages = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        // Добавляем первую страницу и эллипсис если нужно
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

        // Основные страницы
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

        // Добавляем последнюю страницу и эллипсис если нужно
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

    // Показываем лоадер при первой загрузке
    if (isLoadingProjects && projects.length === 0) {
        return (
            <div className="space-y-4">
                <div className="flex justify-between">
                    <div>
                        <h2 className="text-xl font-bold">Projects</h2>
                    </div>
                    <Button onClick={onAdd} size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Project
                    </Button>
                </div>
                <div className="rounded-md border p-8 text-center text-slate-500">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    Loading projects...
                </div>
            </div>
        );
    }

    if (projects.length === 0 && !isLoadingProjects) {
        return (
            <div className="space-y-4">
                <div className="flex justify-between">
                    <div>
                        <h2 className="text-xl font-bold">Projects</h2>
                    </div>
                    <Button onClick={onAdd} size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Project
                    </Button>
                </div>
                <div className="rounded-md border p-8 text-center text-slate-500">
                    No projects found. Click "Add Project" to create your first project.
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold">Projects</h2>
                    <p className="text-sm text-muted-foreground">
                        Total: {totalCount} projects
                    </p>
                </div>
                <Button onClick={onAdd} size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Project
                </Button>
            </div>

            <div className="rounded-md border overflow-x-auto">
                <Table className="table-fixed w-full text-sm">
                    <colgroup>
                        <col style={{ width: '140px' }} />
                        <col style={{ width: '100px' }} />
                        <col style={{ width: '140px' }} />
                        <col style={{ width: '130px' }} />
                        <col style={{ width: '60px' }} />
                        <col style={{ width: '100px' }} />
                        <col style={{ width: '70px' }} />
                    </colgroup>

                    <TableHeader>
                        <TableRow>
                            <TableHead>Code</TableHead>
                            <TableHead>IC</TableHead>
                            <TableHead>Client</TableHead>
                            <TableHead>Manager</TableHead>
                            <TableHead>Country</TableHead>
                            <TableHead>Department</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {projects.map((project: any) => {
                            const codes = project.codes || [];
                            const lastCode = getLastCode(codes);
                            const isExpanded = expandedCodeDrawers[project.id];

                            return (
                                <React.Fragment key={project.id}>
                                    <TableRow className="hover:bg-slate-50">
                                        <TableCell className="min-w-0">
                                            <div className="flex items-center gap-1 min-w-0">
                                                <FolderKanban className="w-3 h-3 flex-shrink-0 text-slate-400" />
                                                <span className="truncate text-xs font-mono">
                                                    {lastCode?.code || 'No code'}
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
                                            <span className="truncate block text-xs font-mono">
                                                {project.ic || '-'}
                                            </span>
                                        </TableCell>

                                        <TableCell className="min-w-0">
                                            <Badge variant="outline" className="truncate block max-w-full text-xs font-normal">
                                                {project.client || 'Not assigned'}
                                            </Badge>
                                        </TableCell>

                                        <TableCell className="min-w-0">
                                            <span className="truncate block text-xs">
                                                {getProjectManagerName(project.manager)}
                                            </span>
                                        </TableCell>

                                        <TableCell>
                                            <span className="text-xs font-mono">{project.country || '-'}</span>
                                        </TableCell>

                                        <TableCell className="min-w-0">
                                            <span className="truncate block text-xs">
                                                {getDepartmentName(project.department)}
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
                                            <TableCell colSpan={7} className="bg-gray-50 p-2">
                                                <div className="flex flex-wrap gap-1.5">
                                                    {codes.map((c: any, index: number) => (
                                                        <Badge key={index} variant="secondary" className="text-xs font-mono">
                                                            {c.code}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>

            {/* Улучшенная пагинация без кнопок First/Last */}
            {totalPages > 0 && (
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4">
                    <div className="text-xs text-muted-foreground">
                        Showing {projects.length} of {totalCount} projects
                    </div>

                    <div className="flex items-center gap-2 flex-wrap justify-center">
                        {/* Кнопка "Предыдущая" */}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handlePrevPage}
                            disabled={!hasPrev || isLoadingProjects}
                        >
                            <ChevronLeft size={14} className="mr-1" />
                            Previous
                        </Button>

                        {/* Номера страниц (десктоп) */}
                        <div className="hidden md:flex gap-1">
                            {renderPageNumbers()}
                        </div>

                        {/* Выпадающий список для перехода (мобильные) */}
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

                        {/* Индикатор страницы (планшеты) */}
                        <div className="hidden sm:flex md:hidden items-center gap-2">
                            <span className="text-sm font-medium">{currentPage}</span>
                            <span className="text-sm text-muted-foreground">of {totalPages}</span>
                        </div>

                        {/* Кнопка "Следующая" */}
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

                    {/* Прямой ввод номера страницы */}
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

            {/* Дополнительная статистика пагинации */}
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