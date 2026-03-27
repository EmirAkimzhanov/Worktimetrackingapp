import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '../../ui/dialog';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { useEditCountry, useGetCountries } from '../../../hooks/useCountries';
import { toast } from 'sonner';

interface EditCountryDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    country: {
        storeId: number;  // Используем storeId
        name: string;
        code: string;
    };
    onSave: (updatedCountry: { id: number; name: string; code: string }) => void;
}

export function EditCountryDialog({
    open,
    onOpenChange,
    country,
    onSave
}: EditCountryDialogProps) {
    const [countryName, setCountryName] = useState(country.name);
    const [countryCode, setCountryCode] = useState(country.code);
    const [errors, setErrors] = useState<{ name?: string; code?: string }>({});
    const [isLoading, setIsLoading] = useState(false);
    const { mutate: editCountry } = useEditCountry();
    const { mutate: getCountries } = useGetCountries();

    useEffect(() => {
        if (open) {
            setCountryName(country.name);
            setCountryCode(country.code);
            setErrors({});
            setIsLoading(false);
        }
    }, [open, country]);

    const validateForm = () => {
        const newErrors: { name?: string; code?: string } = {};

        if (!countryName.trim()) {
            newErrors.name = 'Country name is required';
        }

        if (!countryCode.trim()) {
            newErrors.code = 'Country code is required';
        } else if (countryCode.length < 2 || countryCode.length > 3) {
            newErrors.code = 'Country code must be 2-3 characters';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = () => {
        if (validateForm()) {
            setIsLoading(true);

            const updatedCountry = {
                id: country.storeId, // Используем storeId
                name: countryName.trim(),
                code: countryCode.trim().toUpperCase()
            };

            console.log('Updating country with storeId:', country.storeId);
            console.log('Updated country data:', updatedCountry);

            // Call the editCountry mutation
            editCountry(
                {
                    id: String(country.storeId), // Используем storeId
                    country: updatedCountry
                },
                {
                    onSuccess: () => {
                        console.log('Country updated successfully, refreshing list...');
                        // Обновляем список стран
                        getCountries(undefined, {
                            onSuccess: () => {
                                console.log('Countries list refreshed');
                            }
                        });
                        // Вызываем onSave callback
                        onSave(updatedCountry);
                        // Показываем успешное сообщение
                        toast.success(`Country ${updatedCountry.name} updated successfully`);
                        // Закрываем диалог
                        onOpenChange(false);
                        setIsLoading(false);
                    },
                    onError: (error) => {
                        console.error('Error updating country:', error);
                        toast.error('Failed to update country');
                        setIsLoading(false);
                    }
                }
            );
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit Country</DialogTitle>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="country-name">
                            Country Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="country-name"
                            value={countryName}
                            onChange={(e) => setCountryName(e.target.value)}
                            placeholder="Enter country name"
                            className={errors.name ? 'border-red-500' : ''}
                            disabled={isLoading}
                            autoFocus
                        />
                        {errors.name && (
                            <p className="text-sm text-red-500">{errors.name}</p>
                        )}
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="country-code">
                            Country Code <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="country-code"
                            value={countryCode}
                            onChange={(e) => setCountryCode(e.target.value.toUpperCase())}
                            placeholder="e.g., US, GB, KZ"
                            maxLength={3}
                            disabled={isLoading}
                            className={`uppercase ${errors.code ? 'border-red-500' : ''}`}
                        />
                        {errors.code && (
                            <p className="text-sm text-red-500">{errors.code}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                            2-3 character country code (ISO format)
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Saving...' : 'Save Changes'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}