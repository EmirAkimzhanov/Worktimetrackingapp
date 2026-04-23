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
import { useCreatePIE, useUpdatePIE, useGetPIE } from '../../../hooks/useRefBooks';

interface Pie {
    id: number;
    name: string;
}

interface PieDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editingPie: Pie | null;
    onSuccess?: () => void;
}

interface PieFormData {
    name: string;
}

export function PieDialog({
    open,
    onOpenChange,
    editingPie,
    onSuccess,
}: PieDialogProps) {
    const [formData, setFormData] = useState<PieFormData>({
        name: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const createPie = useCreatePIE();
    const updatePie = useUpdatePIE();
    const { refetch: refetchPies } = useGetPIE();

    useEffect(() => {
        if (open) {
            if (editingPie) {
                setFormData({ name: editingPie.name });
            } else {
                setFormData({ name: '' });
            }
        }
    }, [open, editingPie]);

    const handleClose = () => {
        setFormData({ name: '' });
        onOpenChange(false);
    };

    const handleSubmit = async () => {
        if (!formData.name.trim()) {
            toast.error('Please enter a pie name');
            return;
        }

        if (formData.name.length > 150) {
            toast.error('Max 150 characters');
            return;
        }

        setIsSubmitting(true);

        try {
            if (editingPie) {
                await updatePie.mutateAsync({
                    id: editingPie.id,
                    name: formData.name,
                });
                toast.success('Pie updated');
            } else {
                await createPie.mutateAsync({
                    name: formData.name,
                });
                toast.success('Pie created');
            }

            await refetchPies();
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
                        {editingPie ? 'Edit Pie' : 'Add Pie'}
                    </DialogTitle>

                    {/* ❗ FIX: убрали вложенные <p> */}
                    <DialogDescription asChild>
                        <div>
                            {editingPie
                                ? 'Update pie details'
                                : 'Create a new pie'}
                        </div>
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="pie-name">
                            Pie Name <span style={{ color: 'red' }}>*</span>
                        </Label>

                        <Input
                            id="pie-name"
                            value={formData.name}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    name: e.target.value,
                                })
                            }
                            placeholder="Enter pie name"
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

                    {editingPie && (
                        <div
                            style={{
                                padding: 12,
                                background: '#f8fafc',
                                borderRadius: 6,
                            }}
                        >
                            {/* ❗ FIX: никаких <p> внутри <p> */}
                            <div style={{ fontSize: 12, color: '#6b7280' }}>
                                Editing ID:{' '}
                                <span style={{ fontFamily: 'monospace' }}>
                                    #{editingPie.id}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter
                    className="display-flex pt-4  justify-between"
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
                        {isSubmitting ? 'Saving...' : editingPie ? 'Save' : 'Add'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default PieDialog;