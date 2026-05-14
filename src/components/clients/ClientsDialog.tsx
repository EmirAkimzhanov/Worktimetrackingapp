import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
    const isInitializedRef = useRef(false);

    const store_sectors = useUserStore((state) => state.sectors);
    const store_countries = useUserStore((state) => state.countries);
    const { mutate: createClient, isLoading: isCreating } = useCreateClients();
    const { mutate: getClients } = useGetClients();
    const { mutate: editClient, isLoading: isEditing } = useEditClients();
    const { data: pieOptions } = useGetPIE();

    // ✅ Функция для преобразования store_countries в массив
    const getCountriesArray = useMemo(() => {
        if (!store_countries) return [];
        if (Array.isArray(store_countries)) return store_countries;
        if (typeof store_countries === 'object') {
            return Object.values(store_countries).filter(item => item !== null);
        }
        return [];
    }, [store_countries]);

    // ✅ Функция для преобразования store_sectors в массив
    const getSectorsArray = useMemo(() => {
        if (!store_sectors) return [];
        if (Array.isArray(store_sectors)) return store_sectors;
        if (typeof store_sectors === 'object') {
            return Object.values(store_sectors).filter(item => item !== null);
        }
        return [];
    }, [store_sectors]);

    // ✅ Безопасное преобразование значения в число
    const safeToNumber = useCallback((value: any, defaultValue: number = 0): number => {
        if (value === null || value === undefined) return defaultValue;
        if (typeof value === 'number') return value;
        if (typeof value === 'string') {
            const parsed = parseInt(value);
            return isNaN(parsed) ? defaultValue : parsed;
        }
        if (typeof value === 'object' && value.id) return value.id;
        return defaultValue;
    }, []);

    // ✅ Функции для поиска ID с проверками
    const getSectorId = useCallback((sectorName: string) => {
        if (!sectorName) return 0;
        const sectorsArray = getSectorsArray;
        if (!Array.isArray(sectorsArray) || sectorsArray.length === 0) return 0;
        const sector = sectorsArray.find(s => s && (s.name === sectorName || s.id === sectorName));
        return sector?.id || 0;
    }, [getSectorsArray]);

    const getCountryId = useCallback((countryCode: string) => {
        if (!countryCode) return 0;
        const countriesArray = getCountriesArray;
        if (!Array.isArray(countriesArray) || countriesArray.length === 0) return 0;
        const country = countriesArray.find(c => c && (c.code === countryCode || c.name === countryCode || c.id === countryCode));
        return country?.id || 0;
    }, [getCountriesArray]);

    const getPieId = useCallback((pieValue: any) => {
        if (!pieValue) return 0;
        if (!pieOptions || !Array.isArray(pieOptions)) return 0;

        if (typeof pieValue === 'object' && pieValue.id) return pieValue.id;
        if (typeof pieValue === 'number') return pieValue;
        if (typeof pieValue === 'string') {
            const pie = pieOptions.find((p: any) => p && (p.name === pieValue || p.title === pieValue));
            return pie?.id || 0;
        }
        return 0;
    }, [pieOptions]);

    // ✅ Заполнение формы при редактировании
    useEffect(() => {
        if (editingClient && open && !isInitializedRef.current) {
            isInitializedRef.current = true;

            setClientForm({
                manager: safeToNumber(editingClient.manager || editingClient.manager_id, 0),
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
            isInitializedRef.current = false;
            resetForm();
        }
    }, [editingClient, open, setClientForm, getSectorId, getCountryId, getPieId, safeToNumber]);

    // ✅ Безопасное получение значения формы
    const getFormValue = useCallback((key: keyof ClientFormData) => {
        const value = clientForm?.[key];

        if (value === undefined || value === null) {
            if (['manager', 'sector', 'country', 'pie'].includes(key)) return 0;
            return '';
        }

        return value;
    }, [clientForm]);

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
        if (!validateForm()) return;

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
                        if (onSave) onSave();
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
                    if (onSave) onSave();
                },
                onError: (error) => {
                    console.error('Error creating client:', error);
                }
            });
        }
    };

    const handleInputChange = useCallback((field: keyof ClientFormData, value: string | number) => {
        setClientForm(prev => ({
            ...prev,
            [field]: value
        }));

        // Очищаем ошибку для этого поля
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    }, [setClientForm, errors]);

    const getSectorOptions = useCallback(() => {
        const sectorsArray = getSectorsArray;

        if (!Array.isArray(sectorsArray) || sectorsArray.length === 0) {
            return [
                { value: 0, label: 'Not selected' },
                { value: 1, label: 'Technology' },
                { value: 2, label: 'Finance' },
                { value: 3, label: 'Healthcare' },
                { value: 4, label: 'Manufacturing' },
                { value: 5, label: 'Retail' },
            ];
        }

        const sectorOptions = sectorsArray
            .filter(sector => sector && sector.id && sector.name)
            .map((sector) => ({
                value: sector.id,
                label: sector.name
            }));

        return [{ value: 0, label: 'Not selected' }, ...sectorOptions];
    }, [getSectorsArray]);

    const getCountryOptions = useCallback(() => {
        const countriesArray = getCountriesArray;

        if (!Array.isArray(countriesArray) || countriesArray.length === 0) {
            return [
                { value: 0, label: 'Select country' },
                { value: 1, label: 'Kazakhstan' },
                { value: 2, label: 'Kyrgyzstan' },
                { value: 3, label: 'United States' },
                { value: 4, label: 'United Kingdom' },
                { value: 5, label: 'Germany' },
            ];
        }

        const countryOptions = countriesArray
            .filter(country => country && country.id && country.name)
            .map((country) => ({
                value: country.id,
                label: country.name
            }));

        return [{ value: 0, label: 'Select country' }, ...countryOptions];
    }, [getCountriesArray]);

    const getPieOptions = useCallback(() => {
        if (!pieOptions || !Array.isArray(pieOptions) || pieOptions.length === 0) {
            return [{ value: 0, label: 'No PIE available' }];
        }
        return [
            { value: 0, label: 'Select PIE' },
            ...pieOptions
                .filter(item => item && (item.id || item.value))
                .map((item: any) => ({
                    value: item.id || item.value,
                    label: item.name || item.title || `PIE ${item.id || item.value}`
                }))
        ];
    }, [pieOptions]);

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
                                disabled={isLoading}
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
                                disabled={isLoading}
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
                                disabled={isLoading}
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
                                disabled={isLoading}
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
                                disabled={isLoading}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="sector">Sector</Label>
                            <Select
                                value={String(getFormValue('sector') ?? 0)}
                                onValueChange={(value: string) =>
                                    handleInputChange('sector', parseInt(value) || 0)
                                }
                                disabled={isLoading}
                            >
                                <SelectTrigger id="sector" className="w-full">
                                    <SelectValue placeholder="Select sector" />
                                </SelectTrigger>
                                <SelectContent className="w-full">
                                    {sectorOptions.map((sector, index) => {
                                        if (!sector || sector.value === undefined || sector.value === null) return null;

                                        return (
                                            <SelectItem
                                                key={`sector-${sector.value}-${index}`}
                                                value={String(sector.value)}
                                            >
                                                {sector.label}
                                            </SelectItem>
                                        );
                                    })}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="pie">PIE *</Label>
                            <Select
                                value={String(getFormValue('pie') ?? 0)}
                                onValueChange={(value: string) =>
                                    handleInputChange('pie', parseInt(value) || 0)
                                }
                                disabled={isLoading || !pieSelectOptions.length}
                            >
                                <SelectTrigger id="pie" className="w-full">
                                    <SelectValue placeholder="Select PIE" />
                                </SelectTrigger>
                                <SelectContent className="w-full">
                                    {pieSelectOptions.map((option, index) => {
                                        if (!option || option.value === undefined || option.value === null) return null;

                                        return (
                                            <SelectItem
                                                key={`pie-${option.value}-${index}`}
                                                value={String(option.value)}
                                            >
                                                {option.label}
                                            </SelectItem>
                                        );
                                    })}
                                </SelectContent>
                            </Select>
                            {errors.pie && <p className="text-sm text-red-500">{errors.pie}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="country">Country *</Label>
                            <Select
                                value={String(getFormValue('country') ?? 0)}
                                onValueChange={(value: string) =>
                                    handleInputChange('country', parseInt(value) || 0)
                                }
                                disabled={isLoading}
                            >
                                <SelectTrigger id="country" className="w-full">
                                    <SelectValue placeholder="Select country" />
                                </SelectTrigger>
                                <SelectContent className="w-full">
                                    {countryOptions.map((country, index) => {
                                        if (!country || country.value === undefined || country.value === null) return null;

                                        return (
                                            <SelectItem
                                                key={`country-${country.value}-${index}`}
                                                value={String(country.value)}
                                            >
                                                {country.label}
                                            </SelectItem>
                                        );
                                    })}
                                </SelectContent>
                            </Select>
                            {errors.country && <p className="text-sm text-red-500">{errors.country}</p>}
                        </div>
                    </div>
                </div>
                <DialogFooter className="flex justify-between">
                    <Button variant="outline" onClick={handleClose} disabled={isLoading}>
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