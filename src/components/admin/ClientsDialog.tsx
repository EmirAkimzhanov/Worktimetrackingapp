import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useUserStore } from '../../store/UsersStore';
import { useCreateClients, useDeleteClients, useEditClients, useGetClients } from '../../hooks/useClients';

interface ClientFormData {
    manager: number;
    sector: number;
    name: string;
    group: string;
    personal_number: string;
}

interface ClientDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editingClient: any;
    clientForm: ClientFormData;
    setClientForm: (form: ClientFormData) => void;
    onSave: () => void;
    managers?: Array<{ value: number; label: string }>;
}

export function ClientDialog({
    open,
    onOpenChange,
    editingClient,
    clientForm,
    setClientForm,
    onSave,
    managers = [
        { value: 0, label: 'Not assigned' },
        { value: 1, label: 'John Smith' },
        { value: 2, label: 'Sarah Johnson' },
        { value: 3, label: 'Michael Brown' },
    ],
}: ClientDialogProps) {
    const [errors, setErrors] = useState<Record<string, string>>({});

    const store_sectors = useUserStore((state) => state.sectors);
    const { mutate: createClient, isLoading: isCreating } = useCreateClients();
    const { mutate: getClients } = useGetClients();
    const { mutate: editClient, isLoading: isEditing } = useEditClients();
    const { mutate: deleteCLient } = useDeleteClients();

    // Эффект для заполнения формы данными редактируемого клиента
    useEffect(() => {
        if (editingClient && open) {
            // Преобразуем данные клиента в формат формы
            const sectorId = editingClient.sector_id || editingClient.sector || 0;

            setClientForm({
                manager: editingClient.manager || editingClient.manager_id || 0,
                sector: sectorId,
                name: editingClient.name || '',
                group: editingClient.group || '',
                personal_number: editingClient.personal_number || '',
            });
        } else if (!open) {
            // Сброс формы при закрытии диалога
            resetForm();
        }
    }, [editingClient, open, setClientForm]);

    const getFormValue = (key: keyof ClientFormData) => {
        return clientForm?.[key] ?? (key === 'manager' || key === 'sector' ? 0 : '');
    };

    const resetForm = () => {
        setClientForm({
            manager: 0,
            sector: 0,
            name: '',
            group: '',
            personal_number: '',
        });
        setErrors({});
    };

    const handleClose = () => {
        resetForm();
        onOpenChange(false);
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!getFormValue('name')?.toString().trim()) {
            newErrors.name = 'Name is required';
        }

        if (!getFormValue('personal_number')?.toString().trim()) {
            newErrors.personal_number = 'Personal number is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = () => {
        if (validateForm()) {
            // Если редактируем существующего клиента, вызываем editClient
            if (editingClient && editingClient.id) {
                const clientData = {
                    name: getFormValue('name'),
                    personal_number: getFormValue('personal_number'),
                    group: getFormValue('group'),
                    manager: getFormValue('manager') || 0,
                    sector: getFormValue('sector') || 0,
                    // Добавьте другие поля, если нужно
                };

                editClient(
                    { body: clientData, client_id: editingClient.id },
                    {
                        onSuccess: () => {
                            // Обновляем список клиентов после успешного редактирования
                            getClients();
                            resetForm();
                            onOpenChange(false);
                            // Здесь можно добавить уведомление об успешном редактировании
                        },
                        onError: (error) => {
                            // Здесь можно обработать ошибку
                            console.error('Error editing client:', error);
                            // Можно добавить уведомление об ошибке
                        }
                    }
                );
            } else {
                // Если создаем нового клиента, вызываем createClient
                const clientData = {
                    name: getFormValue('name'),
                    personal_number: getFormValue('personal_number'),
                    group: getFormValue('group'),
                    manager: getFormValue('manager') || 0,
                    sector: getFormValue('sector') || 0,
                    // Добавьте другие поля, если нужно
                };

                createClient(clientData, {
                    onSuccess: () => {
                        // Обновляем список клиентов после успешного создания
                        getClients();
                        resetForm();
                        onOpenChange(false);
                        // Здесь можно добавить уведомление об успешном создании
                    },
                    onError: (error) => {
                        // Здесь можно обработать ошибку
                        console.error('Error creating client:', error);
                        // Можно добавить уведомление об ошибке
                    }
                });
            }
        }
    };

    const handleInputChange = (field: keyof ClientFormData, value: string | number) => {
        setClientForm({
            ...clientForm,
            [field]: value
        });
    };

    // Transform store_sectors to dropdown options
    const getSectorOptions = () => {
        if (!store_sectors || store_sectors.length === 0) {
            return [
                { value: 0, label: 'Not selected' },
                { value: 1, label: 'Technology' },
                { value: 2, label: 'Finance' },
                { value: 3, label: 'Healthcare' },
                { value: 4, label: 'Manufacturing' },
                { value: 5, label: 'Retail' },
            ];
        }

        // Transform sectors from store to dropdown format
        const sectorOptions = store_sectors.map((sector, index) => ({
            value: sector.id || index + 1,
            label: sector.name || `Sector ${index + 1}`
        }));

        // Add "Not selected" option at the beginning
        return [
            { value: 0, label: 'Not selected' },
            ...sectorOptions
        ];
    };

    const sectorOptions = getSectorOptions();

    const isLoading = isCreating || isEditing;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>{editingClient ? 'Edit Client' : 'Add New Client'}</DialogTitle>
                    <DialogDescription>
                        {editingClient ? 'Update client information' : 'Fill in the new client information'}
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="client-name">Name *</Label>
                        <Input
                            id="client-name"
                            value={getFormValue('name')}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            placeholder="Enter client name"
                            className={errors.name ? 'border-red-500' : ''}
                        />
                        {errors.name && (
                            <p className="text-sm text-red-500">{errors.name}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="personal-number">Personal Number *</Label>
                        <Input
                            id="personal-number"
                            value={getFormValue('personal_number')}
                            onChange={(e) => handleInputChange('personal_number', e.target.value)}
                            placeholder="Enter personal number"
                            className={errors.personal_number ? 'border-red-500' : ''}
                        />
                        {errors.personal_number && (
                            <p className="text-sm text-red-500">{errors.personal_number}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="group">Group</Label>
                        <Input
                            id="group"
                            value={getFormValue('group')}
                            onChange={(e) => handleInputChange('group', e.target.value)}
                            placeholder="Enter group name"
                        />
                    </div>

                    {/* <div className="space-y-2">
                        <Label htmlFor="manager">Manager</Label>
                        <Select
                            value={getFormValue('manager')?.toString()}
                            onValueChange={(value: string) =>
                                handleInputChange('manager', parseInt(value) || 0)
                            }
                        >
                            <SelectTrigger id="manager">
                                <SelectValue placeholder="Select manager" />
                            </SelectTrigger>
                            <SelectContent>
                                {managers.map((manager) => (
                                    <SelectItem key={manager.value} value={manager.value.toString()}>
                                        {manager.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div> */}

                    <div className="space-y-2">
                        <Label htmlFor="sector">Sector</Label>
                        <Select
                            value={getFormValue('sector')?.toString()}
                            onValueChange={(value: string) =>
                                handleInputChange('sector', parseInt(value) || 0)
                            }
                        >
                            <SelectTrigger id="sector" className="w-full">
                                <SelectValue placeholder="Select sector" />
                            </SelectTrigger>
                            <SelectContent className="w-full">
                                {sectorOptions.map((sector) => (
                                    <SelectItem key={sector.value} value={sector.value.toString()}>
                                        {sector.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={handleClose}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        style={{ backgroundColor: '#1F4E78' }}
                        disabled={!getFormValue('name')?.toString().trim() ||
                            !getFormValue('personal_number')?.toString().trim() ||
                            isLoading}
                    >
                        {isLoading ? (
                            'Saving...'
                        ) : editingClient ? (
                            'Save Changes'
                        ) : (
                            'Add Client'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}