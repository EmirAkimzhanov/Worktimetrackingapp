// src/components/admin/WorkWeekendDialog.tsx
import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../ui/dialog';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';
import { WorkWeekend } from '../../../types/types';

interface WorkWeekendDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editingWorkWeekend: WorkWeekend | null;
    onSave: (workWeekend: Omit<WorkWeekend, 'id' | 'country_id'>) => void;
}

export function WorkWeekendDialog({
    open,
    onOpenChange,
    editingWorkWeekend,
    onSave
}: WorkWeekendDialogProps) {
    const [form, setForm] = useState({
        date: '',
        description: ''
    });

    useEffect(() => {
        if (open && editingWorkWeekend) {
            setForm({
                date: editingWorkWeekend.date,
                description: editingWorkWeekend.description || ''
            });
        } else if (open) {
            setForm({
                date: new Date().toISOString().split('T')[0],
                description: ''
            });
        }
    }, [open, editingWorkWeekend]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.date) return;
        onSave(form);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{editingWorkWeekend ? 'Edit Work Weekend' : 'Add Work Weekend'}</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="date">Date *</Label>
                        <Input
                            id="date"
                            type="date"
                            value={form.date}
                            onChange={(e) => setForm(prev => ({ ...prev, date: e.target.value }))}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description (Optional)</Label>
                        <Textarea
                            id="description"
                            value={form.description}
                            onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="e.g., Make-up working day, Special project day, etc."
                            rows={3}
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancel
                        </Button>
                        <Button type="submit">
                            {editingWorkWeekend ? 'Update' : 'Add'} Work Day
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}