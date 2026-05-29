import React from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { Button } from './ui/button';

interface DeleteConfirmationDialogsProps {
    deleteDialogOpen: boolean;
    setDeleteDialogOpen: (open: boolean) => void;
    bulkDeleteDialogOpen: boolean;
    setBulkDeleteDialogOpen: (open: boolean) => void;
    selectedEntriesCount: number;
    isDeleting: boolean;
    isBulkDeleting: boolean;
    onConfirmDelete: () => void;
    onConfirmBulkDelete: () => void;
}

export function DeleteConfirmationDialogs({
    deleteDialogOpen,
    setDeleteDialogOpen,
    bulkDeleteDialogOpen,
    setBulkDeleteDialogOpen,
    selectedEntriesCount,
    isDeleting,
    isBulkDeleting,
    onConfirmDelete,
    onConfirmBulkDelete
}: DeleteConfirmationDialogsProps) {
    return (
        <>
            {/* Диалог подтверждения одиночного удаления */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Time Entry</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this time entry? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={onConfirmDelete}
                            disabled={isDeleting}
                            className="bg-red-500 hover:bg-red-600"
                            style={{ backgroundColor: '#EF4444' }}
                        >
                            {isDeleting ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Диалог массового удаления */}
            <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Selected Entries</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete {selectedEntriesCount} selected entries? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isBulkDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={onConfirmBulkDelete}
                            disabled={isBulkDeleting}
                            className="bg-red-500 hover:bg-red-600"
                            style={{ backgroundColor: '#EF4444' }}
                        >
                            {isBulkDeleting ? 'Deleting...' : 'Delete All'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}