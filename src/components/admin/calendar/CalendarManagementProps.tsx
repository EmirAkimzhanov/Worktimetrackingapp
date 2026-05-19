import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '../../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Calendar, Settings, FileText, BarChart, Edit2, Trash2, Plus } from 'lucide-react';
import { CountryCalendarConfig, Holiday, WorkWeekend, WeeklySchedule } from '../../../types/types';
import { CalendarHolidaysTab } from './CalenarHolidaysTab';
import { CalendarWeeklyScheduleTab } from './CalendarWeeklyScheduleTabProps ';
import { CalendarStatisticsTab } from './CalendarStatisticsTabProps ';
import { CalendarSettingsDialog } from './CalendarSettingsDialog';
import { DeleteConfirmationDialog } from '../DeleteConfiramtion';
import { EditCountryDialog } from './EditCountryDialog';
import { useUserStore } from '../../../store/UsersStore';
import { useAddCountry, useDeleteCountry, useGetCountries } from '../../../hooks/useCountries';
import { toast } from 'sonner';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../../ui/select';

interface CalendarManagementProps {
    configs: CountryCalendarConfig[];
    onUpdateConfig: (config: CountryCalendarConfig) => void;
    onAddConfig: (config: CountryCalendarConfig) => void;
    onDeleteConfig: (id: number) => void;
    onAddHoliday: (holiday: Omit<Holiday, 'id'>) => void;
    onUpdateHoliday: (holiday: Holiday) => void;
    onDeleteHoliday: (id: number) => void;
    onAddWorkWeekend: (workWeekend: Omit<WorkWeekend, 'id'>) => void;
    onDeleteWorkWeekend: (id: number) => void;
    onUpdateWeeklySchedule: (schedule: WeeklySchedule) => void;
}

export function CalendarManagement({
    configs,
    onUpdateConfig,
    onAddConfig,
    onDeleteConfig,
    onAddHoliday,
    onUpdateHoliday,
    onDeleteHoliday,
    onAddWorkWeekend,
    onDeleteWorkWeekend,
    onUpdateWeeklySchedule
}: CalendarManagementProps) {
    const [activeTab, setActiveTab] = useState<'holidays' | 'weekly' | 'statistics'>('holidays');
    const [selectedCountryId, setSelectedCountryId] = useState<number | null>(null);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [countryToDelete, setCountryToDelete] = useState<{ id: number; name: string } | null>(null);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [countryToEdit, setCountryToEdit] = useState<{ id: number; name: string; code: string } | null>(null);

    const store_countries = useUserStore((state) => state.countries);
    const calendars = useUserStore((state) => state.calendar); // Массив с праздниками
    const { mutate: addCountry } = useAddCountry();
    const { mutate: deleteCountry } = useDeleteCountry();
    const { mutate: getCountries } = useGetCountries();

    const countriesFromStore = store_countries || [];

    // Функция для проверки наличия праздников у страны из calendars
    const hasHolidaysForCountry = (countryId: number): boolean => {
        if (!calendars || calendars.length === 0) return false;
        const hasHolidays = calendars.some(calendar => calendar.country === countryId);
        console.log(`Country ${countryId} has holidays in calendars: ${hasHolidays}, calendars length: ${calendars.length}`);
        return hasHolidays;
    };

    // Функция для получения праздников страны из calendars
    const getHolidaysForCountry = (countryId: number): Holiday[] => {
        if (!calendars || calendars.length === 0) return [];
        const holidays = calendars.filter(calendar => calendar.country === countryId);
        console.log(`Getting holidays for country ${countryId}: ${holidays.length} holidays`);
        return holidays;
    };

    // Формируем список стран для отображения с правильным статусом hasConfig
    const displayedCountries = useMemo(() => {
        if (!countriesFromStore.length) return [];

        console.log('Building displayedCountries with calendars:', calendars);
        console.log('Countries from store:', countriesFromStore);

        const countriesList = countriesFromStore.map(storeCountry => {
            // Проверяем наличие конфигурации в configs
            const existingConfig = configs.find(config => config.id === storeCountry.id);

            // Проверяем наличие праздников напрямую из calendars
            const hasHolidays = hasHolidaysForCountry(storeCountry.id);

            // Проверяем рабочие выходные
            const hasWorkWeekends = existingConfig?.workWeekends && existingConfig.workWeekends.length > 0;

            // Проверяем недельное расписание
            const hasWeeklySchedule = existingConfig?.weeklySchedule &&
                Object.values(existingConfig.weeklySchedule).some(day => day !== undefined);

            // Страна считается сконфигурированной, если:
            // 1. Есть конфиг в системе ИЛИ
            // 2. Есть праздники в calendars ИЛИ
            // 3. Есть рабочие выходные ИЛИ
            // 4. Есть недельное расписание
            const hasConfig = !!existingConfig || hasHolidays || hasWorkWeekends || hasWeeklySchedule;

            console.log(`Country: ${storeCountry.name} (ID: ${storeCountry.id})`, {
                existingConfig: !!existingConfig,
                hasHolidays,
                hasWorkWeekends,
                hasWeeklySchedule,
                hasConfig
            });

            return {
                storeId: storeCountry.id,
                name: storeCountry.name,
                code: storeCountry.code,
                hasConfig: hasConfig,
                config: existingConfig || null
            };
        });

        // Сортируем: сначала страны с конфигурацией, потом без
        const sorted = countriesList.sort((a, b) => {
            if (a.hasConfig && !b.hasConfig) return -1;
            if (!a.hasConfig && b.hasConfig) return 1;
            return a.name.localeCompare(b.name);
        });

        console.log('Final displayedCountries:', sorted.map(c => ({ name: c.name, hasConfig: c.hasConfig })));

        return sorted;
    }, [configs, countriesFromStore, calendars]);

    // Текущая конфигурация для выбранной страны
    const currentConfig = useMemo(() => {
        if (!selectedCountryId) return null;

        const displayedCountry = displayedCountries.find(c => c.storeId === selectedCountryId);
        if (!displayedCountry) return null;

        // Получаем существующую конфигурацию или создаем новую
        const existingConfig = configs.find(c => c.id === selectedCountryId);
        const countryHolidays = getHolidaysForCountry(selectedCountryId);

        if (existingConfig) {
            return {
                ...existingConfig,
                holidays: countryHolidays, // Всегда используем актуальные праздники из calendars
            };
        }

        // Создаем новую конфигурацию если нет существующей
        return {
            id: selectedCountryId,
            country: displayedCountry.name,
            countryCode: displayedCountry.code,
            holidays: countryHolidays,
            workWeekends: [],
            weeklySchedule: {
                monday: { isWorkingDay: true, startTime: '09:00', endTime: '18:00' },
                tuesday: { isWorkingDay: true, startTime: '09:00', endTime: '18:00' },
                wednesday: { isWorkingDay: true, startTime: '09:00', endTime: '18:00' },
                thursday: { isWorkingDay: true, startTime: '09:00', endTime: '18:00' },
                friday: { isWorkingDay: true, startTime: '09:00', endTime: '18:00' },
                saturday: { isWorkingDay: false, startTime: '09:00', endTime: '18:00' },
                sunday: { isWorkingDay: false, startTime: '09:00', endTime: '18:00' }
            }
        } as CountryCalendarConfig;
    }, [selectedCountryId, displayedCountries, configs, calendars]);

    useEffect(() => {
        if (displayedCountries.length > 0 && selectedCountryId === null) {
            // Выбираем первую страну с конфигурацией, если есть, иначе первую в списке
            const firstConfigured = displayedCountries.find(c => c.hasConfig);
            setSelectedCountryId(firstConfigured?.storeId || displayedCountries[0].storeId);
        }
    }, [displayedCountries, selectedCountryId]);

    // Отладочный эффект для проверки данных
    useEffect(() => {
        console.log('=== CalendarManagement Debug ===');
        console.log('calendars (holidays):', calendars);
        console.log('configs:', configs);
        console.log('countriesFromStore:', countriesFromStore);
        console.log('displayedCountries:', displayedCountries);
        console.log('selectedCountryId:', selectedCountryId);
        console.log('currentConfig:', currentConfig);
        console.log('================================');
    }, [calendars, configs, countriesFromStore, displayedCountries, selectedCountryId, currentConfig]);

    const allAvailableCountries = useMemo(() => {
        return countriesFromStore.map(country => ({
            id: country.id,
            name: country.name,
            code: country.code
        }));
    }, [countriesFromStore]);

    const availableCountriesForAdding = useMemo(() => {
        const existingCountryIds = new Set(configs.map(c => c.id));
        return countriesFromStore
            .filter(country => !existingCountryIds.has(country.id))
            .map(country => ({
                id: country.id,
                name: country.name,
                code: country.code
            }));
    }, [configs, countriesFromStore]);

    const handleCountrySelect = (storeId: number) => {
        setSelectedCountryId(storeId);
    };

    const handleAddConfig = (config: CountryCalendarConfig) => {
        if (onAddConfig) {
            const country = countriesFromStore.find(c => c.id === config.id);
            const correctedConfig = country ? {
                ...config,
                id: country.id,
                country: country.name,
                countryCode: country.code,
                holidays: getHolidaysForCountry(country.id)
            } : config;
            onAddConfig(correctedConfig);
            setSelectedCountryId(correctedConfig.id);
            toast.success(`Country ${correctedConfig.country} added successfully`);
        } else {
            toast.error('Cannot add country: Add function is not available');
        }
    };

    const handleDeleteConfig = (id: number) => {
        if (onDeleteConfig) {
            const country = displayedCountries.find(c => c.storeId === id);
            if (window.confirm(`Are you sure you want to delete ${country?.name} configuration?`)) {
                onDeleteConfig(id);
                const remainingCountries = displayedCountries.filter(c => c.storeId !== id && c.hasConfig);
                if (remainingCountries.length > 0) {
                    setSelectedCountryId(remainingCountries[0].storeId);
                } else if (displayedCountries.length > 0) {
                    setSelectedCountryId(displayedCountries[0].storeId);
                }
                toast.success(`Country ${country?.name} configuration deleted successfully`);
            }
        } else {
            toast.error('Cannot delete country: Delete function is not available');
        }
    };

    const handleDeleteClick = (country: { storeId: number; name: string }) => {
        setCountryToDelete({ id: country.storeId, name: country.name });
        setDeleteDialogOpen(true);
    };

    const confirmDeleteCountry = () => {
        if (!countryToDelete) return;

        deleteCountry(countryToDelete.id, {
            onSuccess: () => {
                getCountries();
                if (selectedCountryId === countryToDelete.id) {
                    const remainingCountries = displayedCountries.filter(c => c.storeId !== countryToDelete.id);
                    if (remainingCountries.length > 0) {
                        setSelectedCountryId(remainingCountries[0].storeId);
                    } else {
                        setSelectedCountryId(null);
                    }
                }
                toast.success(`Country ${countryToDelete.name} deleted successfully`);
                setDeleteDialogOpen(false);
                setCountryToDelete(null);
            },
            onError: (error) => {
                console.error('Error deleting country:', error);
                toast.error('Failed to delete country');
                setDeleteDialogOpen(false);
                setCountryToDelete(null);
            }
        });
    };

    const handleEditCountry = (country: { storeId: number; name: string; code: string }) => {
        setCountryToEdit(country);
        setEditDialogOpen(true);
    };

    const handleSaveCountry = (updatedCountry: { id: number; name: string; code: string }) => {
        console.log('Country updated:', updatedCountry);
        toast.success(`Country ${updatedCountry.name} updated successfully (demo)`);
        setEditDialogOpen(false);
        setCountryToEdit(null);
    };

    if (!countriesFromStore.length) {
        return (
            <div className="flex flex-col items-center justify-center p-8 space-y-4">
                <p className="text-lg font-medium">No countries available</p>
                <p className="text-muted-foreground">Please load countries data first</p>
            </div>
        );
    }

    const currentSelectedCountry = selectedCountryId ? displayedCountries.find(c => c.storeId === selectedCountryId) : null;

    return (
        <>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold">Calendar Management</h2>
                        <p className="text-muted-foreground">Configure holidays, working days and weekly schedules</p>
                    </div>
                </div>

                {/* SELECTOR для стран */}
                <div className="flex items-center gap-4">
                    <div className="w-80">
                        <Select
                            value={selectedCountryId?.toString() || ''}
                            onValueChange={(value) => handleCountrySelect(Number(value))}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select a country..." />
                            </SelectTrigger>
                            <SelectContent>
                                {displayedCountries.map((country) => (
                                    <SelectItem
                                        key={country.storeId}
                                        value={country.storeId.toString()}
                                    >
                                        <div className="flex items-center justify-between w-full gap-2">
                                            <span>{country.name}</span>
                                            {!country.hasConfig && (
                                                <span className="text-xs text-muted-foreground">
                                                    (no config)
                                                </span>
                                            )}
                                            {country.hasConfig && (
                                                <span className="text-xs text-green-600">
                                                    ✓ configured
                                                </span>
                                            )}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Main Content */}
                <div>
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold">
                                        {currentSelectedCountry?.name || 'Select Country'}
                                    </h3>
                                    {selectedCountryId && currentConfig && (
                                        <p className="text-sm text-muted-foreground">
                                            Country Code: {currentConfig.countryCode} |
                                            Holidays: {currentConfig.holidays?.length || 0}
                                        </p>
                                    )}
                                </div>

                                <div className="flex gap-1 bg-muted p-1 rounded-md">
                                    <button
                                        onClick={() => setActiveTab('holidays')}
                                        className={`
                                            flex items-center gap-2 px-4 py-2 rounded-sm text-sm font-medium transition-colors
                                            ${activeTab === 'holidays'
                                                ? " text-black shadow"
                                                : "text-muted-foreground hover:bg-muted/70"}
                                        `}
                                    >
                                        <Calendar className="w-4 h-4" />
                                        Holidays & Work Weekends
                                    </button>

                                    <button
                                        onClick={() => setActiveTab('weekly')}
                                        className={`
                                            flex items-center gap-2 px-4 py-2 rounded-sm text-sm font-medium transition-colors
                                            ${activeTab === 'weekly'
                                                ? " text-black shadow"
                                                : "text-muted-foreground hover:bg-muted/70"}
                                        `}
                                    >
                                        <FileText className="w-4 h-4" />
                                        Weekly Schedule
                                    </button>

                                    <button
                                        onClick={() => setActiveTab('statistics')}
                                        className={`
                                            flex items-center gap-2 px-4 py-2 rounded-sm text-sm font-medium transition-colors
                                            ${activeTab === 'statistics'
                                                ? " text-black shadow"
                                                : "text-muted-foreground hover:bg-muted/70"}
                                        `}
                                    >
                                        <BarChart className="w-4 h-4" />
                                        Statistics
                                    </button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {currentConfig ? (
                                <>
                                    {activeTab === 'holidays' && (
                                        <div className="space-y-4">
                                            <CalendarHolidaysTab
                                                config={currentConfig}
                                                onAddHoliday={onAddHoliday}
                                                onUpdateHoliday={onUpdateHoliday}
                                                onDeleteHoliday={onDeleteHoliday}
                                                onAddWorkWeekend={onAddWorkWeekend}
                                                onDeleteWorkWeekend={onDeleteWorkWeekend}
                                                isReadOnly={!currentSelectedCountry?.hasConfig}
                                            />
                                        </div>
                                    )}

                                    {activeTab === 'weekly' && (
                                        <div className="space-y-4">
                                            <CalendarWeeklyScheduleTab
                                                config={currentConfig}
                                                onUpdateWeeklySchedule={onUpdateWeeklySchedule}
                                                isReadOnly={!currentSelectedCountry?.hasConfig}
                                            />
                                        </div>
                                    )}

                                    {activeTab === 'statistics' && (
                                        <div className="space-y-4">
                                            <CalendarStatisticsTab
                                                config={currentConfig}
                                            />
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    <p>Please select a country from the list.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <CalendarSettingsDialog
                    open={isSettingsOpen}
                    onOpenChange={setIsSettingsOpen}
                    configs={configs}
                    onAddConfig={onAddConfig ? handleAddConfig : undefined}
                    onUpdateConfig={onUpdateConfig}
                    onDeleteConfig={onDeleteConfig ? handleDeleteConfig : undefined}
                    availableCountries={availableCountriesForAdding}
                    allCountries={allAvailableCountries}
                />
            </div>

            <DeleteConfirmationDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                title="Delete Country"
                description={`Are you sure you want to delete ${countryToDelete?.name}? All associated data will also be removed. This action cannot be undone.`}
                onConfirm={confirmDeleteCountry}
            />

            {countryToEdit && (
                <EditCountryDialog
                    open={editDialogOpen}
                    onOpenChange={setEditDialogOpen}
                    country={countryToEdit}
                    onSave={handleSaveCountry}
                />
            )}
        </>
    );
}