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
import { useGetPIE, useDeletePIE, useGetServiceType, useDeleteServiceType } from '../../../hooks/useRefBooks';
import { toast } from 'sonner';
import { ServiceTypeDialog } from './ServiceDialog';

interface Pie {
    id: number;
    name: string;
}

interface PieTableProps {
    onEdit?: (pie: Pie) => void;
    onAdd?: () => void;
    onDelete?: (id: number) => void;
}

export function ServiceTable({
    onEdit,
    onAdd,
    onDelete,
}: PieTableProps) {
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [pieToDelete, setPieToDelete] = useState<Pie | null>(null);
    const [formDialogOpen, setFormDialogOpen] = useState(false);
    const [editingPie, setEditingPie] = useState<Pie | null>(null);

    // Получаем данные из хука
    const { data: serviceType, isLoading, error, refetch } = useGetServiceType();
    const deleteService = useDeleteServiceType();

    const handleDeleteClick = (serviceType: Pie) => {
        setPieToDelete(serviceType);
        setDeleteDialogOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (pieToDelete) {
            try {
                await deleteService.mutateAsync(pieToDelete.id);
                await refetch();
                toast.success('Service type deleted successfully');
                setDeleteDialogOpen(false);
                setPieToDelete(null);
            } catch (error: any) {
                console.error('Error deleting service type:', error);
                toast.error(error?.message || 'Failed to delete service type');
            }
        }
    };

    const handleCancelDelete = () => {
        setDeleteDialogOpen(false);
        setPieToDelete(null);
    };

    const handleAddClick = () => {
        setEditingPie(null);
        setFormDialogOpen(true);
    };

    const handleEditClick = (serviceType: Pie) => {
        setEditingPie(serviceType);
        setFormDialogOpen(true);
    };

    const handleFormSuccess = async () => {
        await refetch();
        setFormDialogOpen(false);
        setEditingPie(null);
    };

    // Безопасная проверка данных
    const safeData = Array.isArray(serviceType) ? serviceType : [];

    if (error) {
        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold tracking-tight">Service types</h2>
                        <p className="text-sm text-muted-foreground">Manage all service types in the collection</p>
                    </div>
                    <Button onClick={handleAddClick} size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Service type
                    </Button>
                </div>
                <div className="rounded-md border p-8 text-center">
                    <p className="text-red-500">Error loading pies: {error.message}</p>
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
                        <h2 className="text-xl font-bold tracking-tight">Service types</h2>
                        <p className="text-sm text-muted-foreground">Manage all service types in the collection</p>
                    </div>
                    <Button onClick={handleAddClick} size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Service-type
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
                                        Loading pies...
                                    </TableCell>
                                </TableRow>
                            ) : safeData.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center text-slate-500 py-8">
                                        <div className="flex flex-col items-center gap-2">
                                            <PieChart className="w-8 h-8 text-slate-300" />
                                            <span>No pies found. Click "Add Service type" to create your first pie.</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                safeData.map((serviceType) => (
                                    <TableRow key={serviceType.id} className="hover:bg-slate-50">
                                        <TableCell className="py-2 text-left">
                                            <Badge variant="outline" className="font-mono text-xs inline-flex">
                                                #{serviceType.id}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="py-2 text-left">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium">{serviceType.name}</span>
                                                <PieChart className="w-4 h-4 text-slate-400" />
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-2">
                                            <div className="flex gap-0.5 justify-end">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7"
                                                    onClick={() => handleEditClick(serviceType)}
                                                >
                                                    <Edit className="w-3.5 h-3.5" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7"
                                                    onClick={() => handleDeleteClick(serviceType)}
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

                {/* Используем обычный AlertDialog без дополнительных оберток */}
                {deleteDialogOpen && (
                    <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Delete Service type?</AlertDialogTitle>

                                {/* 🔥 фикс DOM ошибки */}
                                <AlertDialogDescription asChild>
                                    <div>
                                        {pieToDelete && (
                                            <>
                                                You are about to delete pie #{pieToDelete.id} - {pieToDelete.name}.

                                                <div className="mt-3 text-sm text-amber-600">
                                                    This action cannot be undone. All pie data will be permanently removed.
                                                </div>

                                                <div className="mt-2 p-3 bg-red-50 rounded-md">
                                                    <div className="text-sm font-medium text-red-700">
                                                        ⚠️ Warning: Deleting this pie will remove it from all associated records.
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </AlertDialogDescription>
                            </AlertDialogHeader>

                            <AlertDialogFooter
                                className="display-flex pt-4  justify-between"

                            >
                                <AlertDialogCancel onClick={handleCancelDelete}>
                                    Cancel
                                </AlertDialogCancel>

                                <AlertDialogAction
                                    onClick={handleConfirmDelete}
                                    className="bg-red-600 hover:bg-red-700 text-white"
                                >
                                    Delete Pie
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )}
            </div>

            {/* Диалоговое окно для добавления/редактирования */}
            <ServiceTypeDialog
                open={formDialogOpen}
                onOpenChange={setFormDialogOpen}
                editingPie={editingPie}
                onSuccess={handleFormSuccess}
            />
        </>
    );
}