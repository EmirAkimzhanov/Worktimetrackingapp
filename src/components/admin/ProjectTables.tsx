import React, { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Edit, Trash2, FolderKanban, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { Project } from '../TimeTrackerContext';
import { Client, Department, Position, User } from '../../types/types';
import { useGetDepartments } from '../../hooks/useDepartments';
import { useStatus } from '../../hooks/useStatus';
import { useGetCountries } from '../../hooks/useCountries';
import { useGetClients } from '../../hooks/useClients';
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

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [projectToDelete, setProjectToDelete] = useState<{
        id: string;
        name: string;
        code: string;
        hasEntries: boolean;
    } | null>(null);
    const [expandedCodeDrawers, setExpandedCodeDrawers] = useState<Record<string, boolean>>({});

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

    const getLastCode = (codes: any[]) => {
        if (!codes || codes.length === 0) return null;
        return codes[codes.length - 1];
    };

    const toggleCodeDrawer = (projectId: string) => {
        setExpandedCodeDrawers(prev => ({
            ...prev,
            [projectId]: !prev[projectId]
        }));
    };

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

    const handleConfirmDelete = () => {
        if (projectToDelete) {
            deleteProject(projectToDelete.id, {
                onSuccess: () => {
                    getProjects();
                    setDeleteDialogOpen(false);
                    setProjectToDelete(null);
                },
                onError: (error) => {
                    console.error('Error deleting project:', error);
                    setDeleteDialogOpen(false);
                    setProjectToDelete(null);
                }
            });
        }
    };

    const handleCancelDelete = () => {
        setDeleteDialogOpen(false);
        setProjectToDelete(null);
    };

    const projects = store_projects || [];

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold tracking-tight">Projects</h2>
                    <p className="text-sm text-muted-foreground">Manage all projects in the organization</p>
                </div>
                <Button onClick={onAdd} size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Project
                </Button>
            </div>

            <div className="rounded-md border overflow-x-auto">
                <Table className="min-w-[800px]">
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[200px]">Project Code</TableHead>
                            <TableHead className="w-[180px]">Project Name</TableHead>
                            <TableHead className="w-[150px]">Client</TableHead>
                            <TableHead className="w-[150px]">Project Manager</TableHead>
                            <TableHead className="w-[80px]">Country</TableHead>
                            <TableHead className="w-[100px]">Department</TableHead>
                            <TableHead className="w-[60px] text-right">Entries</TableHead>
                            <TableHead className="w-[80px] text-right">Total Hours</TableHead>
                            <TableHead className="w-[70px]">Actions</TableHead>
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
                                const codes = (project as any).codes || [];
                                const lastCode = getLastCode(codes);
                                const isExpanded = expandedCodeDrawers[project.id] || false;
                                const hasMultipleCodes = codes.length > 1;

                                return (
                                    <React.Fragment key={project.id}>
                                        <TableRow className="hover:bg-slate-50">
                                            <TableCell className="py-2">
                                                <div className="flex items-center gap-1">
                                                    <FolderKanban className="w-3 h-3 text-slate-400 flex-shrink-0" />
                                                    <div className="flex flex-col gap-0.5">
                                                        {lastCode ? (
                                                            <div className="flex items-center gap-1">
                                                                <span className="font-mono text-xs">{lastCode.code}</span>
                                                                {hasMultipleCodes && (
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="h-5 w-5 p-0"
                                                                        onClick={() => toggleCodeDrawer(project.id)}
                                                                    >
                                                                        {isExpanded ? (
                                                                            <ChevronUp className="h-2.5 w-2.5" />
                                                                        ) : (
                                                                            <ChevronDown className="h-2.5 w-2.5" />
                                                                        )}
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <span className="text-xs text-muted-foreground">No codes</span>
                                                        )}

                                                        {isExpanded && hasMultipleCodes && (
                                                            <div className="mt-1 space-y-0.5 pl-2 border-l border-slate-200">
                                                                {codes.slice(0, -1).map((codeItem: any, index: number) => (
                                                                    <div key={codeItem.id || index} className="flex items-center gap-1">
                                                                        <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
                                                                        <span className="font-mono text-[10px] text-slate-600">
                                                                            {codeItem.code}
                                                                        </span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-2">
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="text-sm font-medium">{project.name}</span>
                                                    {project.description && (
                                                        <span className="text-[10px] text-muted-foreground truncate max-w-[150px]">
                                                            {project.description}
                                                        </span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-2">
                                                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                                    {getClientName((project as any).clientId)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="py-2">
                                                <span className="text-xs text-slate-700">
                                                    {getProjectManagerName((project as any).projectManager)}
                                                </span>
                                            </TableCell>
                                            <TableCell className="py-2">
                                                <span className="text-xs">{(project as any).country || '-'}</span>
                                            </TableCell>
                                            <TableCell className="py-2">
                                                <span className="text-xs">{getDepartmentName((project as any).department)}</span>
                                            </TableCell>
                                            <TableCell className="py-2 text-right text-xs">{stats.entriesCount}</TableCell>
                                            <TableCell className="py-2 text-right text-xs">{stats.totalHours}h</TableCell>
                                            <TableCell className="py-2">
                                                <div className="flex gap-0.5">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7"
                                                        onClick={() => onEdit(project)}
                                                    >
                                                        <Edit className="w-3.5 h-3.5" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7"
                                                        onClick={() => handleDeleteClick(project)}
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    </React.Fragment>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

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

// Добавьте эту функцию, если она отсутствует
function getDepartmentName(departmentId?: number) {
    if (!departmentId) return '-';
    return departmentId.toString(); // Замените на реальную логику получения имени департамента
}