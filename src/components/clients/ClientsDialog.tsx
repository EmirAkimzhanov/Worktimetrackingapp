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
import { useCreateClients, useEditClients, useGetClients } from '../../hooks/useClients';
import { useGetPIE } from '../../hooks/useRefBooks';

interface ClientFormData {
    manager: number;
    sector: number;
    name: string;
    group: string;
    personal_number: string;
    client_code: string;
    bvd: string;
    pie: number;
    country: number;
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
    const store_countries = useUserStore((state) => state.countries);
    const { mutate: createClient, isLoading: isCreating } = useCreateClients();
    const { mutate: getClients } = useGetClients();
    const { mutate: editClient, isLoading: isEditing } = useEditClients();
    const { data: pieOptions } = useGetPIE();

    useEffect(() => {
        if (editingClient && open) {
            // Функция для поиска ID сектора по названию
            const getSectorId = (sectorName: string) => {
                if (!sectorName) return 0;
                const sector = store_sectors?.find(s => s.name === sectorName);
                return sector?.id || 0;
            };

            // Функция для поиска ID страны по коду
            const getCountryId = (countryCode: string) => {
                if (!countryCode) return 0;
                const country = store_countries?.find(c => c.code === countryCode || c.name === countryCode);
                return country?.id || 0;
            };

            // Функция для поиска ID PIE по названию или ID
            const getPieId = (pieValue: any) => {
                if (!pieValue) return 0;
                // Если pie приходит как объект с id
                if (typeof pieValue === 'object' && pieValue.id) return pieValue.id;
                // Если pie приходит как число
                if (typeof pieValue === 'number') return pieValue;
                // Если pie приходит как строка с названием
                if (typeof pieValue === 'string') {
                    const pie = pieOptions?.find((p: any) => p.name === pieValue || p.title === pieValue);
                    return pie?.id || 0;
                }
                return 0;
            };

            setClientForm({
                manager: editingClient.manager || editingClient.manager_id || 0,
                sector: getSectorId(editingClient.sector),
                name: editingClient.name || '',
                group: editingClient.group || '',
                personal_number: editingClient.personal_number || '',
                client_code: editingClient.client_code || editingClient.clients_code || '',
                bvd: editingClient.bvd || '',
                pie: getPieId(editingClient.pie),
                country: getCountryId(editingClient.country),
            });
        } else if (!open) {
            resetForm();
        }
    }, [editingClient, open, setClientForm, store_sectors, store_countries, pieOptions]);

    const getFormValue = (key: keyof ClientFormData) => {
        return clientForm?.[key] ?? (key === 'manager' || key === 'sector' || key === 'country' || key === 'pie' ? 0 : '');
    };

    const resetForm = () => {
        setClientForm({
            manager: 0,
            sector: 0,
            name: '',
            group: '',
            personal_number: '',
            client_code: '',
            bvd: '',
            pie: 0,
            country: 0,
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
        if (!getFormValue('client_code')?.toString().trim()) {
            newErrors.client_code = 'Client code is required';
        }
        if (!getFormValue('pie') || getFormValue('pie') === 0) {
            newErrors.pie = 'PIE is required';
        }
        if (!getFormValue('country') || getFormValue('country') === 0) {
            newErrors.country = 'Country is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = () => {
        if (validateForm()) {
            if (editingClient && editingClient.id) {
                const clientData = {
                    name: getFormValue('name'),
                    personal_number: getFormValue('personal_number'),
                    group: getFormValue('group'),
                    manager: getFormValue('manager') || 0,
                    sector: getFormValue('sector') || 0,
                    client_code: getFormValue('client_code'),
                    bvd: getFormValue('bvd'),
                    pie: getFormValue('pie'),
                    country_id: getFormValue('country') === 0 ? null : getFormValue('country'),
                };

                editClient(
                    { body: clientData, client_id: editingClient.id },
                    {
                        onSuccess: () => {
                            getClients();
                            resetForm();
                            onOpenChange(false);
                        },
                        onError: (error) => {
                            console.error('Error editing client:', error);
                        }
                    }
                );
            } else {
                const clientData = {
                    name: getFormValue('name'),
                    personal_number: getFormValue('personal_number'),
                    group: getFormValue('group'),
                    sector: getFormValue('sector') || 0,
                    client_code: getFormValue('client_code'),
                    bvd: getFormValue('bvd'),
                    pie: getFormValue('pie'),
                    country: getFormValue('country') === 0 ? null : getFormValue('country'),
                };

                createClient(clientData, {
                    onSuccess: () => {
                        getClients();
                        resetForm();
                        onOpenChange(false);
                    },
                    onError: (error) => {
                        console.error('Error creating client:', error);
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
        const sectorOptions = store_sectors.map((sector) => ({
            value: sector.id,
            label: sector.name
        }));
        return [{ value: 0, label: 'Not selected' }, ...sectorOptions];
    };

    const getCountryOptions = () => {
        if (!store_countries || store_countries.length === 0) {
            return [
                { value: 0, label: 'Select country' },
                { value: 1, label: 'Kazakhstan' },
                { value: 2, label: 'Kyrgyzstan' },
                { value: 3, label: 'United States' },
                { value: 4, label: 'United Kingdom' },
                { value: 5, label: 'Germany' },
            ];
        }
        const countryOptions = store_countries.map((country) => ({
            value: country.id,
            label: country.name
        }));
        return [{ value: 0, label: 'Select country' }, ...countryOptions];
    };

    const getPieOptions = () => {
        if (!pieOptions || pieOptions.length === 0) {
            return [{ value: 0, label: 'No PIE available' }];
        }
        return [
            { value: 0, label: 'Select PIE' },
            ...pieOptions.map((item: any) => ({
                value: item.id,
                label: item.name || item.title || `PIE ${item.id}`
            }))
        ];
    };

    // Добавим отладочный вывод
    useEffect(() => {
        if (editingClient && open) {
            console.log('Editing client data:', editingClient);
            console.log('Sectors available:', store_sectors);
            console.log('Countries available:', store_countries);
            console.log('PIE options:', pieOptions);
            console.log('Form data after mapping:', clientForm);
        }
    }, [editingClient, open, store_sectors, store_countries, pieOptions, clientForm]);

    const sectorOptions = getSectorOptions();
    const countryOptions = getCountryOptions();
    const pieSelectOptions = getPieOptions();
    const isLoading = isCreating || isEditing;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{editingClient ? 'Edit Client' : 'Add New Client'}</DialogTitle>
                    <DialogDescription>
                        {editingClient ? 'Update client information' : 'Fill in the new client information'}
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="client-name">Name *</Label>
                            <Input
                                id="client-name"
                                value={getFormValue('name')}
                                onChange={(e) => handleInputChange('name', e.target.value)}
                                placeholder="Enter client name"
                                className={errors.name ? 'border-red-500' : ''}
                            />
                            {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
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
                            {errors.personal_number && <p className="text-sm text-red-500">{errors.personal_number}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="client-code">Client Code *</Label>
                            <Input
                                id="client-code"
                                value={getFormValue('client_code')}
                                onChange={(e) => handleInputChange('client_code', e.target.value)}
                                placeholder="Enter client code"
                                className={errors.client_code ? 'border-red-500' : ''}
                            />
                            {errors.client_code && <p className="text-sm text-red-500">{errors.client_code}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="bvd">BVD</Label>
                            <Input
                                id="bvd"
                                value={getFormValue('bvd')}
                                onChange={(e) => handleInputChange('bvd', e.target.value)}
                                placeholder="Enter BVD"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="group">Group</Label>
                            <Input
                                id="group"
                                value={getFormValue('group')}
                                onChange={(e) => handleInputChange('group', e.target.value)}
                                placeholder="Enter group name"
                            />
                        </div>

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

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="pie">PIE *</Label>
                            <Select
                                value={getFormValue('pie')?.toString()}
                                onValueChange={(value: string) =>
                                    handleInputChange('pie', parseInt(value) || 0)
                                }
                            >
                                <SelectTrigger id="pie" className="w-full">
                                    <SelectValue placeholder="Select PIE" />
                                </SelectTrigger>
                                <SelectContent className="w-full">
                                    {pieSelectOptions.map((option) => (
                                        <SelectItem key={option.value} value={option.value.toString()}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.pie && <p className="text-sm text-red-500">{errors.pie}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="country">Country *</Label>
                            <Select
                                value={getFormValue('country')?.toString()}
                                onValueChange={(value: string) =>
                                    handleInputChange('country', parseInt(value) || 0)
                                }
                            >
                                <SelectTrigger id="country" className="w-full">
                                    <SelectValue placeholder="Select country" />
                                </SelectTrigger>
                                <SelectContent className="w-full">
                                    {countryOptions.map((country) => (
                                        <SelectItem key={country.value} value={country.value.toString()}>
                                            {country.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.country && <p className="text-sm text-red-500">{errors.country}</p>}
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button style={{ marginRight: '50%' }} variant="outline" onClick={handleClose}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        style={{ backgroundColor: '#1F4E78' }}
                        disabled={
                            !getFormValue('name')?.toString().trim() ||
                            !getFormValue('personal_number')?.toString().trim() ||
                            !getFormValue('client_code')?.toString().trim() ||
                            !getFormValue('pie') || getFormValue('pie') === 0 ||
                            !getFormValue('country') || getFormValue('country') === 0 ||
                            isLoading
                        }
                    >
                        {isLoading ? 'Saving...' : editingClient ? 'Save Changes' : 'Add Client'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}