import React, { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Edit, Trash2, FolderKanban, Plus } from 'lucide-react';
import { Project } from '../TimeTrackerContext';
import { Client, Department, Position, User } from '../../types/types';
import { useGetDepartments } from '../../hooks/useDepartments';
import { useStatus } from '../../hooks/useStatus';
import { useGetCountries } from '../../hooks/useCountries';
import { useGetClients, useGetCountryClients } from '../../hooks/useClients';
import { useGetServiceLines } from '../../hooks/useServiceLines';
import { useGetTaskTypes } from '../../hooks/useTasks';
import { useDeleteProject, useGetProjects } from '../../hooks/useProject';
import { useUserStore } from '../../store/UsersStore';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '../ui/alert-dialog';

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
    positions,
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
    const { mutate: getProjects } = useGetProjects();
    const { mutate: deleteProject } = useDeleteProject();
    const store_projects = useUserStore((state) => state.projects);

    // Состояние для попапа подтверждения удаления
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [projectToDelete, setProjectToDelete] = useState<{
        id: string;
        name: string;
        code: string;
        hasEntries: boolean;
    } | null>(null);

    useEffect(() => {
        getDepartments();
        getStatuses();
        getServiceLines();
        getCountries();
        getClients();
        getTaskTypes();
        getProjects();
    }, []);

    const getProjectStats = (projectId: string) => {
        const projectEntries = entries.filter(e => e.projectId === projectId);
        const totalHours = projectEntries.reduce((sum, e) => sum + e.hours, 0);
        return {
            entriesCount: projectEntries.length,
            totalHours: totalHours.toFixed(1),
            hasEntries: projectEntries.length > 0,
        };
    };

    const getClientName = (clientId?: number) => {
        if (!clientId) return 'Not assigned';
        return clients.find(c => c.id === clientId)?.company || 'Unknown';
    };

    const getProjectManagerName = (projectManagerId?: number) => {
        if (!projectManagerId) return 'Not assigned';
        const user = users.find(u => u.id === projectManagerId);
        return user ? `${user.first_name} ${user.last_name}` : 'Unknown';
    };

    const getDepartmentName = (departmentId?: number) => {
        if (!departmentId) return '-';
        return departments.find(d => d.id === departmentId)?.name || 'Unknown';
    };

    // Функция для открытия попапа удаления
    const handleDeleteClick = (project: Project) => {
        const stats = getProjectStats(project.id);

        setProjectToDelete({
            id: project.id,
            name: project.name,
            code: project.code,
            hasEntries: stats.hasEntries
        });
        setDeleteDialogOpen(true);
    };

    // Функция для подтверждения удаления
    const handleConfirmDelete = () => {
        if (projectToDelete) {
            deleteProject(projectToDelete.id, {
                onSuccess: () => {
                    // После успешного удаления обновляем список проектов
                    getProjects();
                    // Закрываем попап
                    setDeleteDialogOpen(false);
                    setProjectToDelete(null);
                },
                onError: (error) => {
                    console.error('Error deleting project:', error);
                    // Можно добавить уведомление об ошибке
                    setDeleteDialogOpen(false);
                    setProjectToDelete(null);
                }
            });
        }
    };

    // Функция для отмены удаления
    const handleCancelDelete = () => {
        setDeleteDialogOpen(false);
        setProjectToDelete(null);
    };

    // Используем projects из store с проверкой на null
    const projects = store_projects || [];

    return (
        <div className="space-y-4">
            {/* Заголовок с кнопкой Add */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Projects</h2>
                    <p className="text-muted-foreground">Manage all projects in the organization</p>
                </div>
                <Button onClick={onAdd} size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Project
                </Button>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Project Code</TableHead>
                            <TableHead>Project Name</TableHead>
                            <TableHead>Client</TableHead>
                            <TableHead>Project Manager</TableHead>
                            <TableHead>Country</TableHead>
                            <TableHead>Department</TableHead>
                            <TableHead className="text-right">Entries</TableHead>
                            <TableHead className="text-right">Total Hours</TableHead>
                            <TableHead className="w-24">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {projects.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={9} className="text-center text-slate-500 py-8">
                                    {store_projects === null ? 'Loading projects...' : 'No projects found. Click "Add Project" to create your first project.'}
                                </TableCell>
                            </TableRow>
                        ) : (
                            projects.map(project => {
                                const stats = getProjectStats(project.id);
                                return (
                                    <TableRow key={project.id} className="hover:bg-slate-50">
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <FolderKanban className="w-4 h-4 text-slate-500" />
                                                <span className="font-mono">{project.code}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>{project.name}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="text-xs">
                                                {getClientName((project as any).clientId)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-sm text-slate-700">
                                                {getProjectManagerName((project as any).projectManager)}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-sm">{(project as any).country || '-'}</span>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-sm">{(project as any).department || '-'}</span>
                                        </TableCell>
                                        <TableCell className="text-right">{stats.entriesCount}</TableCell>
                                        <TableCell className="text-right">{stats.totalHours}h</TableCell>
                                        <TableCell>
                                            <div className="flex gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => onEdit(project)}
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDeleteClick(project)}
                                                >
                                                    <Trash2 className="w-4 h-4 text-red-500" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Попап подтверждения удаления проекта */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Project?</AlertDialogTitle>
                        <AlertDialogDescription>
                            {projectToDelete && (
                                <>
                                    You are about to delete project{" "}
                                    <span className="font-semibold text-red-600">
                                        {projectToDelete.code} - {projectToDelete.name}
                                    </span>
                                    .

                                    <div className="mt-3 space-y-2">
                                        <p className="text-sm text-amber-600">
                                            This action cannot be undone. All project data will be permanently removed.
                                        </p>

                                        {projectToDelete.hasEntries && (
                                            <div className="p-3 bg-red-50 rounded-md">
                                                <p className="text-sm font-medium text-red-700">
                                                    ⚠️ Warning: This project has time entries associated with it.
                                                    Deleting this project will also remove all related time tracking data.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={handleCancelDelete}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmDelete}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            Delete Project
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}