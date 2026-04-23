import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Edit, Trash2, Plus, PieChart } from 'lucide-react';
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
import { useGetProjectStatuses, useDeleteProjectStatus } from '../../../hooks/useRefBooks';
import { toast } from 'sonner';
import ProjectStatusDialog from './ProjectStatusDialog';

interface ProjectStatus {
    id: number;
    name: string;
}

interface ProjectStatusTableProps {
    onEdit?: (status: ProjectStatus) => void;
    onAdd?: () => void;
    onDelete?: (id: number) => void;
}

export function ProjectStatusTable({
    onEdit,
    onAdd,
    onDelete,
}: ProjectStatusTableProps) {
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [statusToDelete, setStatusToDelete] = useState<ProjectStatus | null>(null);
    const [formDialogOpen, setFormDialogOpen] = useState(false);
    const [editingStatus, setEditingStatus] = useState<ProjectStatus | null>(null);

    const { data: projectStatuses, isLoading, error, refetch } = useGetProjectStatuses();
    const deleteProjectStatus = useDeleteProjectStatus();

    const handleDeleteClick = (status: ProjectStatus) => {
        setStatusToDelete(status);
        setDeleteDialogOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (statusToDelete) {
            try {
                await deleteProjectStatus.mutateAsync(statusToDelete.id);
                await refetch();
                toast.success('Project status deleted successfully');
                setDeleteDialogOpen(false);
                setStatusToDelete(null);
            } catch (error: any) {
                console.error('Error deleting project status:', error);
                toast.error(error?.message || 'Failed to delete project status');
            }
        }
    };

    const handleCancelDelete = () => {
        setDeleteDialogOpen(false);
        setStatusToDelete(null);
    };

    const handleAddClick = () => {
        setEditingStatus(null);
        setFormDialogOpen(true);
    };

    const handleEditClick = (status: ProjectStatus) => {
        setEditingStatus(status);
        setFormDialogOpen(true);
    };

    const handleFormSuccess = async () => {
        await refetch();
        setFormDialogOpen(false);
        setEditingStatus(null);
    };

    const safeData = Array.isArray(projectStatuses) ? projectStatuses : [];

    if (error) {
        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold tracking-tight">Project statuses</h2>
                        <p className="text-sm text-muted-foreground">Manage all project statuses in the collection</p>
                    </div>
                    <Button onClick={handleAddClick} size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Project Status
                    </Button>
                </div>
                <div className="rounded-md border p-8 text-center">
                    <p className="text-red-500">Error loading project statuses: {error.message}</p>
                    <Button onClick={() => refetch()} variant="outline" className="mt-4">
                        Retry
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold tracking-tight">Project statuses</h2>
                        <p className="text-sm text-muted-foreground">Manage all project statuses in the collection</p>
                    </div>
                    <Button onClick={handleAddClick} size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Project Status
                    </Button>
                </div>

                <div className="rounded-md border overflow-x-auto">
                    <Table className="min-w-[600px]">
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[100px] text-left">ID</TableHead>
                                <TableHead className="text-left">Name</TableHead>
                                <TableHead className="w-[70px] text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center text-slate-500 py-8">
                                        Loading project statuses...
                                    </TableCell>
                                </TableRow>
                            ) : safeData.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center text-slate-500 py-8">
                                        <div className="flex flex-col items-center gap-2">
                                            <PieChart className="w-8 h-8 text-slate-300" />
                                            <span>No project statuses found. Click "Add Project Status" to create your first project status.</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                safeData.map((status) => (
                                    <TableRow key={status.id} className="hover:bg-slate-50">
                                        <TableCell className="py-2 text-left">
                                            <Badge variant="outline" className="font-mono text-xs inline-flex">
                                                #{status.id}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="py-2 text-left">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium">{status.name}</span>
                                                <PieChart className="w-4 h-4 text-slate-400" />
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-2">
                                            <div className="flex gap-0.5 justify-end">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7"
                                                    onClick={() => handleEditClick(status)}
                                                >
                                                    <Edit className="w-3.5 h-3.5" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7"
                                                    onClick={() => handleDeleteClick(status)}
                                                >
                                                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {deleteDialogOpen && (
                    <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Delete project status?</AlertDialogTitle>

                                <AlertDialogDescription asChild>
                                    <div>
                                        {statusToDelete && (
                                            <>
                                                You are about to delete project status #{statusToDelete.id} - {statusToDelete.name}.

                                                <div className="mt-3 text-sm text-amber-600">
                                                    This action cannot be undone. All project status data will be permanently removed.
                                                </div>

                                                <div className="mt-2 p-3 bg-red-50 rounded-md">
                                                    <div className="text-sm font-medium text-red-700">
                                                        ⚠️ Warning: Deleting this project status will remove it from all associated records.
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </AlertDialogDescription>
                            </AlertDialogHeader>

                            <AlertDialogFooter className="display-flex pt-4 justify-between">
                                <AlertDialogCancel onClick={handleCancelDelete}>
                                    Cancel
                                </AlertDialogCancel>

                                <AlertDialogAction
                                    onClick={handleConfirmDelete}
                                    className="bg-red-600 hover:bg-red-700 text-white"
                                >
                                    Delete Project Status
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )}
            </div>

            <ProjectStatusDialog
                open={formDialogOpen}
                onOpenChange={setFormDialogOpen}
                editingProjectStatus={editingStatus}
                onSuccess={handleFormSuccess}
            />
        </>
    );
}