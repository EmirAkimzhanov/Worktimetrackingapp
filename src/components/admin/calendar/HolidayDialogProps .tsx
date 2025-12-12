// src/components/admin/HolidayDialog.tsx
import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../ui/dialog';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Switch } from '../../ui/switch';
import { Holiday } from '../../../types/types';

interface HolidayDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editingHoliday: Holiday | null;
    onSave: (holiday: Omit<Holiday, 'id' | 'country_id'>) => void;
}

export function HolidayDialog({ open, onOpenChange, editingHoliday, onSave }: HolidayDialogProps) {
    const [form, setForm] = useState({
        date: '',
        name: '',
        is_halfday: false,
        is_recurring: true
    });

    useEffect(() => {
        if (open && editingHoliday) {
            setForm({
                date: editingHoliday.date,
                name: editingHoliday.name,
                is_halfday: editingHoliday.is_halfday,
                is_recurring: editingHoliday.is_recurring
            });
        } else if (open) {
            setForm({
                date: new Date().toISOString().split('T')[0],
                name: '',
                is_halfday: false,
                is_recurring: true
            });
        }
    }, [open, editingHoliday]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.date || !form.name.trim()) return;
        onSave(form);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{editingHoliday ? 'Edit Holiday' : 'Add Holiday'}</DialogTitle>
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
                        <Label htmlFor="name">Holiday Name *</Label>
                        <Input
                            id="name"
                            value={form.name}
                            onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="e.g., New Year's Day"
                            required
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>Half Day</Label>
                            <p className="text-sm text-muted-foreground">Working hours are reduced</p>
                        </div>
                        <Switch
                            checked={form.is_halfday}
                            onCheckedChange={(checked: boolean) => setForm(prev => ({ ...prev, is_halfday: checked }))}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>Recurring Annually</Label>
                            <p className="text-sm text-muted-foreground">Repeat every year</p>
                        </div>
                        <Switch
                            checked={form.is_recurring}
                            onCheckedChange={(checked: boolean) => setForm(prev => ({ ...prev, is_recurring: checked }))}
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
                            {editingHoliday ? 'Update' : 'Add'} Holiday
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}