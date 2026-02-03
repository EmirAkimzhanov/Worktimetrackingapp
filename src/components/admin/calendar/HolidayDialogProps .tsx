import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../ui/dialog';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Switch } from '../../ui/switch';
import { Badge } from '../../ui/badge';
import { Calendar, Info } from 'lucide-react';
import { Holiday } from '../../../types/types';
import { format, parseISO, isValid } from 'date-fns';

interface HolidayDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editingHoliday: Holiday | null;
    onSave: (holiday: Omit<Holiday, 'id' | 'country_id'>) => void;
}

export function HolidayDialog({
    open,
    onOpenChange,
    editingHoliday,
    onSave
}: HolidayDialogProps) {
    const [form, setForm] = useState({
        date: '',
        name: '',
        description: '',
        is_halfday: false,
        is_recurring: true
    });

    const [originalData, setOriginalData] = useState<typeof form | null>(null);
    const [hasChanges, setHasChanges] = useState(false);

    // Функция для форматирования даты
    const formatDate = (dateString: string) => {
        try {
            const date = parseISO(dateString);
            if (isValid(date)) {
                return format(date, 'dd MMM yyyy');
            }
            return dateString;
        } catch {
            return dateString;
        }
    };

    // Загружаем данные только когда открывается диалог
    useEffect(() => {
        if (open) {
            if (editingHoliday) {
                // Преобразуем дату в формат YYYY-MM-DD для input type="date"
                const originalDate = editingHoliday.date || '';
                const formattedDate = originalDate.includes('-')
                    ? originalDate
                    : `${new Date().getFullYear()}-${originalDate}`;

                const newFormData = {
                    date: formattedDate,
                    name: editingHoliday.name || '',
                    description: editingHoliday.description || '',
                    is_halfday: editingHoliday.is_halfday || false,
                    is_recurring: editingHoliday.is_recurring !== undefined
                        ? editingHoliday.is_recurring
                        : true
                };

                // Сохраняем оригинальные данные для сравнения
                setOriginalData(newFormData);
                setForm(newFormData);
                setHasChanges(false);
            } else {
                // Для нового праздника - текущая дата, остальные поля пустые
                setForm({
                    date: new Date().toISOString().split('T')[0],
                    name: '',
                    description: '',
                    is_halfday: false,
                    is_recurring: true
                });
                setOriginalData(null);
                setHasChanges(false);
            }
        }
    }, [open, editingHoliday]);

    // Проверяем изменения при обновлении формы
    useEffect(() => {
        if (originalData && editingHoliday) {
            const isChanged =
                form.date !== originalData.date ||
                form.name !== originalData.name ||
                form.description !== originalData.description ||
                form.is_halfday !== originalData.is_halfday ||
                form.is_recurring !== originalData.is_recurring;

            setHasChanges(isChanged);
        } else {
            setHasChanges(!!form.name.trim() || !!form.description.trim());
        }
    }, [form, originalData, editingHoliday]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!form.date || !form.name.trim()) {
            return;
        }

        onSave({
            date: form.date,
            name: form.name.trim(),
            description: form.description.trim(),
            is_halfday: form.is_halfday,
            is_recurring: form.is_recurring
        });
    };

    const handleInputChange = (field: string, value: any) => {
        setForm(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const resetToOriginal = () => {
        if (originalData) {
            setForm(originalData);
            setHasChanges(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        {editingHoliday ? 'Edit Holiday' : 'Add Holiday'}
                    </DialogTitle>
                </DialogHeader>

                {/* Отображение предыдущих значений */}
                {editingHoliday && originalData && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-md border">
                        <div className="flex items-center gap-2 mb-2">
                            <Info className="h-4 w-4 text-gray-500" />
                            <span className="text-sm font-medium text-gray-700">Original values</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                                <span className="text-gray-500">Date:</span>
                                <span className="ml-2 font-medium">{formatDate(originalData.date)}</span>
                            </div>
                            <div>
                                <span className="text-gray-500">Name:</span>
                                <span className="ml-2 font-medium">{originalData.name || '-'}</span>
                            </div>
                            <div className="col-span-2">
                                <span className="text-gray-500">Description:</span>
                                <span className="ml-2 font-medium">{originalData.description || 'No description'}</span>
                            </div>
                            <div>
                                <span className="text-gray-500">Half Day:</span>
                                <Badge
                                    variant="outline"
                                    className="ml-2"
                                >
                                    {originalData.is_halfday ? 'Yes' : 'No'}
                                </Badge>
                            </div>
                            <div>
                                <span className="text-gray-500">Recurring:</span>
                                <Badge
                                    variant="outline"
                                    className="ml-2"
                                >
                                    {originalData.is_recurring ? 'Annual' : 'One-time'}
                                </Badge>
                            </div>
                        </div>
                        {hasChanges && (
                            <div className="mt-3 pt-3 border-t">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={resetToOriginal}
                                    className="text-sm"
                                >
                                    Reset to original
                                </Button>
                            </div>
                        )}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="date" className="flex items-center gap-2">
                            Date *
                            {originalData && form.date !== originalData.date && (
                                <Badge variant="outline" className="text-xs">
                                    Changed
                                </Badge>
                            )}
                        </Label>
                        <Input
                            id="date"
                            type="date"
                            value={form.date}
                            onChange={(e) => handleInputChange('date', e.target.value)}
                            required
                            className="w-full"
                        />
                        {originalData && form.date !== originalData.date && (
                            <p className="text-xs text-muted-foreground">
                                Original: {formatDate(originalData.date)}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="name" className="flex items-center gap-2">
                            Holiday Name *
                            {originalData && form.name !== originalData.name && (
                                <Badge variant="outline" className="text-xs">
                                    Changed
                                </Badge>
                            )}
                        </Label>
                        <Input
                            id="name"
                            value={form.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            placeholder="e.g., New Year's Day"
                            required
                            className="w-full"
                        />
                        {originalData && form.name !== originalData.name && (
                            <p className="text-xs text-muted-foreground">
                                Original: {originalData.name}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description" className="flex items-center gap-2">
                            Description
                            {originalData && form.description !== originalData.description && (
                                <Badge variant="outline" className="text-xs">
                                    Changed
                                </Badge>
                            )}
                        </Label>
                        <Input
                            id="description"
                            value={form.description}
                            onChange={(e) => handleInputChange('description', e.target.value)}
                            placeholder="Optional description or notes"
                            className="w-full"
                        />
                        {originalData && form.description !== originalData.description && (
                            <p className="text-xs text-muted-foreground">
                                Original: {originalData.description || 'No description'}
                            </p>
                        )}
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                                <Label>Half Day</Label>
                                {originalData && form.is_halfday !== originalData.is_halfday && (
                                    <Badge variant="outline" className="text-xs">
                                        Changed
                                    </Badge>
                                )}
                            </div>
                            <p className="text-sm text-muted-foreground">Working hours are reduced</p>
                            {originalData && form.is_halfday !== originalData.is_halfday && (
                                <p className="text-xs text-muted-foreground">
                                    Original: {originalData.is_halfday ? 'Yes' : 'No'}
                                </p>
                            )}
                        </div>
                        <Switch
                            checked={form.is_halfday}
                            onCheckedChange={(checked: boolean) => handleInputChange('is_halfday', checked)}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                                <Label>Recurring Annually</Label>
                                {originalData && form.is_recurring !== originalData.is_recurring && (
                                    <Badge variant="outline" className="text-xs">
                                        Changed
                                    </Badge>
                                )}
                            </div>
                            <p className="text-sm text-muted-foreground">Repeat every year</p>
                            {originalData && form.is_recurring !== originalData.is_recurring && (
                                <p className="text-xs text-muted-foreground">
                                    Original: {originalData.is_recurring ? 'Annual' : 'One-time'}
                                </p>
                            )}
                        </div>
                        <Switch
                            checked={form.is_recurring}
                            onCheckedChange={(checked: boolean) => handleInputChange('is_recurring', checked)}
                        />
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
                            disabled={!hasChanges && !!editingHoliday}
                            className="px-4"
                        >
                            {editingHoliday ? 'Update Holiday' : 'Add Holiday'}
                            {hasChanges && editingHoliday && ' (Modified)'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}