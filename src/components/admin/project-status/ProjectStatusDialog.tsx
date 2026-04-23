import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '../../ui/dialog';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { toast } from 'sonner';
import { useCreateProjectStatus, useUpdateProjectStatuses, useGetProjectStatuses } from '../../../hooks/useRefBooks';

interface ProjectStatus {
    id: number;
    name: string;
}

interface ProjectStatusDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editingProjectStatus: ProjectStatus | null;
    onSuccess?: () => void;
}

interface ProjectStatusFormData {
    name: string;
}

export function ProjectStatusDialog({
    open,
    onOpenChange,
    editingProjectStatus,
    onSuccess,
}: ProjectStatusDialogProps) {
    const [formData, setFormData] = useState<ProjectStatusFormData>({
        name: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const createProjectStatus = useCreateProjectStatus();
    const updateProjectStatus = useUpdateProjectStatuses();
    const { refetch: refetchProjectStatus } = useGetProjectStatuses();

    useEffect(() => {
        if (open) {
            if (editingProjectStatus) {
                setFormData({ name: editingProjectStatus.name });
            } else {
                setFormData({ name: '' });
            }
        }
    }, [open, editingProjectStatus]);

    const handleClose = () => {
        setFormData({ name: '' });
        onOpenChange(false);
    };

    const handleSubmit = async () => {
        if (!formData.name.trim()) {
            toast.error('Please enter a project status name');
            return;
        }

        if (formData.name.length > 150) {
            toast.error('Max 150 characters');
            return;
        }

        setIsSubmitting(true);

        try {
            if (editingProjectStatus) {
                await updateProjectStatus.mutateAsync({
                    id: editingProjectStatus.id,
                    name: formData.name,
                });
                toast.success('Project status updated');
            } else {
                await createProjectStatus.mutateAsync({
                    name: formData.name,
                });
                toast.success('Project status created');
            }

            await refetchProjectStatus();
            onSuccess?.();
            handleClose();
        } catch (error: any) {
            console.error(error);
            toast.error(error?.message || 'Error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const isFormValid =
        formData.name.trim().length > 0 &&
        formData.name.length <= 150;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="max-h-[85vh] overflow-y-auto"
                style={{ width: 500, maxWidth: 'calc(100vw - 2rem)' }}
            >
                <DialogHeader>
                    <DialogTitle>
                        {editingProjectStatus ? 'Edit project status' : 'Add project status'}
                    </DialogTitle>

                    <DialogDescription asChild>
                        <div>
                            {editingProjectStatus
                                ? 'Update project status details'
                                : 'Create a new project status'}
                        </div>
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="project-status-name">
                            Project Status Name <span style={{ color: 'red' }}>*</span>
                        </Label>

                        <Input
                            id="project-status-name"
                            value={formData.name}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    name: e.target.value,
                                })
                            }
                            placeholder="Enter project status name"
                            maxLength={150}
                            autoFocus
                        />

                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                fontSize: 12,
                                color: '#6b7280',
                            }}
                        >
                            <span>Min: 1</span>
                            <span>{formData.name.length}/150</span>
                        </div>
                    </div>

                    {editingProjectStatus && (
                        <div
                            style={{
                                padding: 12,
                                background: '#f8fafc',
                                borderRadius: 6,
                            }}
                        >
                            <div style={{ fontSize: 12, color: '#6b7280' }}>
                                Editing ID:{' '}
                                <span style={{ fontFamily: 'monospace' }}>
                                    #{editingProjectStatus.id}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter
                    className="display-flex pt-4 justify-between"
                    style={{
                        paddingTop: 16,
                    }}
                >
                    <Button
                        variant="outline"
                        onClick={handleClose}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </Button>

                    <Button
                        onClick={handleSubmit}
                        disabled={!isFormValid || isSubmitting}
                        style={{ backgroundColor: '#1F4E78' }}
                    >
                        {isSubmitting ? 'Saving...' : editingProjectStatus ? 'Save' : 'Add'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default ProjectStatusDialog;