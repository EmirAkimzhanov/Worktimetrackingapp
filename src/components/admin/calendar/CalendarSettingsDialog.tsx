// src/components/admin/CalendarSettingsDialog.tsx
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../ui/dialog';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { CountryCalendarConfig } from '../../../types/types';
import { Plus, Globe, X } from 'lucide-react';
import { useAddCountry, useGetCountries } from '../../../hooks/useCountries';
import { toast } from 'sonner';

interface CalendarSettingsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    configs: CountryCalendarConfig[];
    onAddConfig: (config: CountryCalendarConfig) => void;
    onUpdateConfig: (config: CountryCalendarConfig) => void;
    onDeleteConfig: (id: number) => void;
}

export function CalendarSettingsDialog({
    open,
    onOpenChange,
    configs,
    onAddConfig,
    onUpdateConfig,
    onDeleteConfig
}: CalendarSettingsDialogProps) {
    const [countryName, setCountryName] = useState('');
    const [countryCode, setCountryCode] = useState('');

    const { mutate: addCountry } = useAddCountry();
    const { mutate: getCountries } = useGetCountries();

    const handleAddCountry = () => {
        if (!countryName.trim() || !countryCode.trim()) {
            toast.error('Please enter both country name and code');
            return;
        }

        const existingCountry = configs.find(
            config =>
                config.country.toLowerCase() === countryName.toLowerCase() ||
                config.countryCode === countryCode.toUpperCase()
        );

        if (existingCountry) {
            toast.error('This country or country code is already configured');
            return;
        }

        toast.promise(
            new Promise((resolve, reject) => {
                addCountry(
                    {
                        name: countryName.trim(),
                        code: countryCode.toUpperCase()
                    },
                    {
                        onSuccess: (data) => {
                            getCountries();
                            resolve(data);
                        },
                        onError: reject
                    }
                );
            }),
            {
                loading: "Adding country...",
                success: "Country added successfully",
                error: "Failed to add country"
            }
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Plus className="w-4 h-4" />

                        Add New Country
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="flex items-center gap-3">
                        <div className="space-y-1 flex-1">
                            <Label htmlFor="countryName" className="text-sm">Name</Label>
                            <Input
                                id="countryName"
                                value={countryName}
                                onChange={(e) => setCountryName(e.target.value)}
                                placeholder="e.g., Kazakhstan"
                                className="h-9"
                            />
                        </div>

                        <div className="space-y-1 w-24">
                            <Label htmlFor="countryCode" className="text-sm">Code</Label>
                            <Input
                                id="countryCode"
                                value={countryCode}
                                onChange={(e) => setCountryCode(e.target.value.toUpperCase())}
                                placeholder="KZ"
                                maxLength={3}
                                className="h-9 uppercase"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button
                            variant="outline"
                            size="default"
                            onClick={() => onOpenChange(false)}
                            className="gap-1"
                        >
                            <X className="w-4 h-4" />
                            Cancel
                        </Button>
                        <Button
                            size="default"
                            onClick={handleAddCountry}
                            className="gap-1"
                            disabled={!countryName.trim() || !countryCode.trim()}
                        >
                            <Plus className="w-4 h-4" />
                            Add Country
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}