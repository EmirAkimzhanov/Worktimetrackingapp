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

// ... (остальные импорты)

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
    const { mutate: addCountry } = useAddCountry();
    const { mutate: deleteCountry } = useDeleteCountry();
    const { mutate: getCountries } = useGetCountries();

    const countriesFromStore = store_countries || [];

    const correctedConfigs = useMemo(() => {
        return configs.map(config => {
            const matchingCountry = countriesFromStore.find(c =>
                c.code === config.countryCode ||
                c.name.toLowerCase() === config.country?.toLowerCase() ||
                c.id === config.id
            );
            if (matchingCountry && config.id !== matchingCountry.id) {
                return {
                    ...config,
                    id: matchingCountry.id,
                    country: matchingCountry.name,
                    countryCode: matchingCountry.code
                };
            }
            return config;
        });
    }, [configs, countriesFromStore]);

    const displayedCountries = useMemo(() => {
        if (!countriesFromStore.length) return [];

        const countriesList = countriesFromStore.map(storeCountry => {
            const existingConfig = correctedConfigs.find(config => config.id === storeCountry.id);
            return {
                storeId: storeCountry.id,
                name: storeCountry.name,
                code: storeCountry.code,
                hasConfig: !!existingConfig,
                config: existingConfig
            };
        });

        return countriesList.sort((a, b) => {
            if (a.hasConfig && !b.hasConfig) return -1;
            if (!a.hasConfig && b.hasConfig) return 1;
            return a.name.localeCompare(b.name);
        });
    }, [correctedConfigs, countriesFromStore]);

    useEffect(() => {
        if (displayedCountries.length > 0 && selectedCountryId === null) {
            setSelectedCountryId(displayedCountries[0].storeId);
        }
    }, [displayedCountries, selectedCountryId]);

    const currentConfig = useMemo(() => {
        if (!selectedCountryId) return null;

        const displayedCountry = displayedCountries.find(c => c.storeId === selectedCountryId);
        if (!displayedCountry) return null;

        if (displayedCountry.config) {
            return {
                ...displayedCountry.config,
                id: displayedCountry.storeId,
                country: displayedCountry.name,
                countryCode: displayedCountry.code
            };
        }

        return {
            id: selectedCountryId,
            country: displayedCountry.name,
            countryCode: displayedCountry.code,
            holidays: [],
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
    }, [selectedCountryId, displayedCountries]);

    const allAvailableCountries = useMemo(() => {
        return countriesFromStore.map(country => ({
            id: country.id,
            name: country.name,
            code: country.code
        }));
    }, [countriesFromStore]);

    const availableCountriesForAdding = useMemo(() => {
        const existingCountryIds = new Set(correctedConfigs.map(c => c.id));
        return countriesFromStore
            .filter(country => !existingCountryIds.has(country.id))
            .map(country => ({
                id: country.id,
                name: country.name,
                code: country.code
            }));
    }, [correctedConfigs, countriesFromStore]);

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
                countryCode: country.code
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

    // Текущая выбранная страна для отображения в кнопках
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
                        <select
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={selectedCountryId || ''}
                            onChange={(e) => handleCountrySelect(Number(e.target.value))}
                        >
                            {displayedCountries.map((country) => (
                                <option key={country.storeId} value={country.storeId}>
                                    {country.name} {!country.hasConfig && '(no config)'}
                                </option>
                            ))}
                        </select>
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
                                            Country Code: {currentConfig.countryCode}
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
                    configs={correctedConfigs}
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