// src/components/admin/CalendarSettingsDialog.tsx
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../ui/dialog';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { CountryCalendarConfig } from '../../../types/types';
import { Plus, Trash2, Globe } from 'lucide-react';

interface CalendarSettingsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    configs: CountryCalendarConfig[];
    onAddConfig: (config: CountryCalendarConfig) => void; // Изменено название
    onUpdateConfig: (config: CountryCalendarConfig) => void;
    onDeleteConfig: (id: number) => void; // Добавлена функция для удаления
}

export function CalendarSettingsDialog({
    open,
    onOpenChange,
    configs,
    onAddConfig, // Используем новую функцию
    onUpdateConfig,
    onDeleteConfig // Добавляем функцию удаления
}: CalendarSettingsDialogProps) {
    const [countryName, setCountryName] = useState('');
    const [countryCode, setCountryCode] = useState('');
    const [workHours, setWorkHours] = useState('8');
    const [vacationDays, setVacationDays] = useState('25');

    useEffect(() => {
        if (open) {
            // Reset form when dialog opens
            setCountryName('');
            setCountryCode('');
            setWorkHours('8');
            setVacationDays('25');
        }
    }, [open]);

    // В функции handleAddCountry добавьте console.log
    const handleAddCountry = () => {
        if (!countryName.trim() || !countryCode.trim()) {
            alert('Please enter both country name and code');
            return;
        }

        // Проверяем, существует ли уже такая страна
        const existingCountry = configs.find(
            config =>
                config.country.toLowerCase() === countryName.toLowerCase() ||
                config.countryCode === countryCode.toUpperCase()
        );

        if (existingCountry) {
            alert('This country or country code already exists');
            return;
        }

        const newConfig: CountryCalendarConfig = {
            id: Date.now(),
            country: countryName,
            countryCode: countryCode.toUpperCase(),
            weeklySchedule: {
                id: Date.now(),
                country_id: Date.now(),
                monday: true,
                tuesday: true,
                wednesday: true,
                thursday: true,
                friday: true,
                saturday: false,
                sunday: false,
                workHoursPerDay: parseFloat(workHours) || 8
            },
            holidays: [],
            workWeekends: [],
            statistics: {
                yearlyWorkDays: 250,
                yearlyHours: 2000,
                daysInWeek: 5,
                hoursInWeek: 40,
                vacationDays: parseInt(vacationDays) || 25,
                lastUpdated: new Date().toISOString()
            }
        };

        console.log('Adding new country config:', newConfig); // <-- Добавьте эту строку
        onAddConfig(newConfig);

        // Очищаем форму после добавления
        setCountryName('');
        setCountryCode('');
    };

    const handleUpdateGeneralSettings = () => {
        const generalConfig = configs.find(c => c.countryCode === 'GENERAL');
        if (generalConfig) {
            const updatedConfig: CountryCalendarConfig = {
                ...generalConfig,
                weeklySchedule: {
                    ...generalConfig.weeklySchedule,
                    workHoursPerDay: parseFloat(workHours) || 8
                },
                statistics: {
                    ...generalConfig.statistics,
                    vacationDays: parseInt(vacationDays) || 25,
                    lastUpdated: new Date().toISOString()
                }
            };
            onUpdateConfig(updatedConfig);
            alert('Global settings updated successfully');
        }
    };

    const handleDeleteCountry = (countryId: number) => {
        if (window.confirm('Are you sure you want to delete this country configuration?')) {
            onDeleteConfig(countryId);
        }
    };

    const existingCountries = configs.filter(c => c.countryCode !== 'GENERAL');

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[600px] max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Globe className="w-5 h-5" />
                        Calendar Settings
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* General Settings */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg">Global Settings</h3>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="defaultWorkHours">Default Work Hours per Day</Label>
                                <Input
                                    id="defaultWorkHours"
                                    type="number"
                                    min="1"
                                    max="24"
                                    step="0.5"
                                    value={workHours}
                                    onChange={(e) => setWorkHours(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="vacationDays">Default Vacation Days</Label>
                                <Input
                                    id="vacationDays"
                                    type="number"
                                    min="0"
                                    max="60"
                                    value={vacationDays}
                                    onChange={(e) => setVacationDays(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <Button onClick={handleUpdateGeneralSettings}>
                                Save Global Settings
                            </Button>
                        </div>
                    </div>

                    {/* Country Management */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg">Country Management</h3>

                        {/* Add New Country */}
                        <div className="space-y-4 p-4 border rounded-lg">
                            <div className="flex items-center gap-4">
                                <div className="space-y-2 flex-1">
                                    <Label htmlFor="countryName">Country Name *</Label>
                                    <Input
                                        id="countryName"
                                        value={countryName}
                                        onChange={(e) => setCountryName(e.target.value)}
                                        placeholder="e.g., Kazakhstan"
                                    />
                                </div>

                                <div className="space-y-2 w-32">
                                    <Label htmlFor="countryCode">Country Code *</Label>
                                    <Input
                                        id="countryCode"
                                        value={countryCode}
                                        onChange={(e) => setCountryCode(e.target.value.toUpperCase())}
                                        placeholder="e.g., KZ"
                                        maxLength={3}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <Button
                                    onClick={handleAddCountry}
                                    className="gap-2"
                                    disabled={!countryName.trim() || !countryCode.trim()}
                                >
                                    <Plus className="w-4 h-4" />
                                    Add Country
                                </Button>
                            </div>
                        </div>

                        {/* Existing Countries List */}
                        <div className="space-y-2">
                            <Label>Existing Countries</Label>
                            {existingCountries.length === 0 ? (
                                <div className="text-center py-6 text-muted-foreground border rounded-lg">
                                    No additional countries configured
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {existingCountries.map((country) => (
                                        <div
                                            key={country.id}
                                            className="flex items-center justify-between p-3 border rounded-lg"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="font-medium">{country.country}</div>
                                                <div className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm">
                                                    {country.countryCode}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {country.weeklySchedule.workHoursPerDay}h/day
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDeleteCountry(country.id)}
                                                disabled={country.holidays.length > 0 || country.workWeekends.length > 0}
                                                title={
                                                    country.holidays.length > 0 || country.workWeekends.length > 0
                                                        ? "Cannot delete country with holidays or work weekends"
                                                        : "Delete country"
                                                }
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}