import React, { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../ui/dialog';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';
import { Checkbox } from '../../ui/checkbox';
import { Workday, WorkdayFormData } from '../../../types/types';

interface WorkdayDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editingWorkday: Workday | null;
    workdayForm: WorkdayFormData;
    setWorkdayForm: React.Dispatch<React.SetStateAction<WorkdayFormData>>;
    onSave: () => void;
}

export function WorkdayDialog({
    open,
    onOpenChange,
    editingWorkday,
    workdayForm,
    setWorkdayForm,
    onSave
}: WorkdayDialogProps) {
    useEffect(() => {
        if (open && editingWorkday) {
            setWorkdayForm({
                date: editingWorkday.date,
                type: editingWorkday.type,
                description: editingWorkday.description || '',
                is_recurring: editingWorkday.is_recurring || false
            });
        }
    }, [open, editingWorkday, setWorkdayForm]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave();
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[500px] w-full mx-auto">
                <DialogHeader>
                    <DialogTitle className="text-lg font-semibold">
                        {editingWorkday ? 'Edit Day' : 'Add Special Day'}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="date" className="font-medium">
                            Date *
                        </Label>
                        <Input
                            id="date"
                            type="date"
                            value={workdayForm.date}
                            onChange={(e) => setWorkdayForm(prev => ({
                                ...prev,
                                date: e.target.value
                            }))}
                            required
                            className="w-full"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="font-medium">Type *</Label>
                        <div className="flex gap-2">
                            {(['workday', 'weekend', 'holiday'] as const).map((type) => (
                                <Button
                                    key={type}
                                    type="button"
                                    variant={workdayForm.type === type ? "default" : "outline"}
                                    className="flex-1"
                                    onClick={() => setWorkdayForm(prev => ({ ...prev, type }))}
                                >
                                    {type === 'workday' && 'Working Day'}
                                    {type === 'weekend' && 'Weekend'}
                                    {type === 'holiday' && 'Holiday'}
                                </Button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description" className="font-medium">
                            Description
                        </Label>
                        <Textarea
                            id="description"
                            value={workdayForm.description}
                            onChange={(e) => setWorkdayForm(prev => ({
                                ...prev,
                                description: e.target.value
                            }))}
                            placeholder="e.g., New Year's Day, Company Holiday, etc."
                            rows={3}
                            className="w-full resize-none"
                        />
                    </div>

                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="is_recurring"
                            checked={workdayForm.is_recurring}
                            onCheckedChange={(checked: boolean) => setWorkdayForm(prev => ({
                                ...prev,
                                is_recurring: checked as boolean
                            }))}
                        />
                        <Label
                            htmlFor="is_recurring"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                            Recurring annually
                        </Label>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="px-4"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="px-4"
                        >
                            {editingWorkday ? 'Update' : 'Add'} Day
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}