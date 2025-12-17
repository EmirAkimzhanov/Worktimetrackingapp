import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Edit, Trash2, FolderKanban, Plus } from 'lucide-react';
import { Project } from '../TimeTrackerContext';
import { Client, Department, Position, User } from '../../types/types';

interface ProjectsTableProps {
    projects: Project[];
    entries: any[];
    clients: Client[];
    users: User[];
    positions: Position[];
    departments: Department[];
    onEdit: (project: Project) => void;
    onDelete: (id: string) => void;
    onAdd: () => void; // Добавлен новый проп
}

export function ProjectsTable({
    projects,
    entries,
    clients,
    users,
    positions,
    departments,
    onEdit,
    onDelete,
    onAdd, // Добавлен новый проп
}: ProjectsTableProps) {
    const getProjectStats = (projectId: string) => {
        const projectEntries = entries.filter(e => e.projectId === projectId);
        const totalHours = projectEntries.reduce((sum, e) => sum + e.hours, 0);
        return {
            entriesCount: projectEntries.length,
            totalHours: totalHours.toFixed(1),
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
                                    No projects found. Click "Add Project" to create your first project.
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
                                                    onClick={() => onDelete(project.id)}
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
        </div>
    );
}