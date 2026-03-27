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
import { EditCountryDialog } from './EditCountryDialog'; // Импортируем диалог
import { useUserStore } from '../../../store/UsersStore';
import { useAddCountry, useDeleteCountry, useGetCountries } from '../../../hooks/useCountries';
import { toast } from 'sonner';

interface CalendarManagementProps {
    configs: CountryCalendarConfig[];
    onUpdateConfig: (config: CountryCalendarConfig) => void;
    onAddConfig?: (config: CountryCalendarConfig) => void;
    onDeleteConfig?: (id: number) => void;
    onAddHoliday: (countryId: number, holiday: Holiday) => void;
    onUpdateHoliday: (countryId: number, holiday: Holiday) => void;
    onDeleteHoliday: (countryId: number, holidayId: number) => void;
    onAddWorkWeekend: (countryId: number, workWeekend: WorkWeekend) => void;
    onDeleteWorkWeekend: (countryId: number, workWeekendId: number) => void;
    onUpdateWeeklySchedule: (countryId: number, schedule: WeeklySchedule) => void;
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
    // Добавляем состояния для диалога редактирования
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [countryToEdit, setCountryToEdit] = useState<{ id: number; name: string; code: string } | null>(null);

    const store_countries = useUserStore((state) => state.countries);
    const { mutate: addCountry } = useAddCountry();
    const { mutate: deleteCountry } = useDeleteCountry();
    const { mutate: getCountries } = useGetCountries();

    // Получаем страны из стора
    const countriesFromStore = store_countries || [];

    // Исправляем конфиги чтобы они использовали правильные ID из стора
    const correctedConfigs = useMemo(() => {
        return configs.map(config => {
            // Находим соответствующую страну в сторе
            const matchingCountry = countriesFromStore.find(c =>
                c.code === config.countryCode ||
                c.name.toLowerCase() === config.country?.toLowerCase() ||
                c.id === config.id
            );

            if (matchingCountry && config.id !== matchingCountry.id) {
                return {
                    ...config,
                    id: matchingCountry.id, // Исправляем ID
                    country: matchingCountry.name, // Обновляем название
                    countryCode: matchingCountry.code // Обновляем код
                };
            }

            return config;
        });
    }, [configs, countriesFromStore]);

    // Синхронизируем ID стран - используем те же ID что и в сторе
    const displayedCountries = useMemo(() => {
        if (!countriesFromStore.length) return [];

        // Создаем список стран для отображения
        const countriesList = countriesFromStore.map(storeCountry => {
            // Находим конфиг для этой страны (используем исправленные конфиги)
            const existingConfig = correctedConfigs.find(config => config.id === storeCountry.id);

            return {
                storeId: storeCountry.id,
                name: storeCountry.name,
                code: storeCountry.code,
                hasConfig: !!existingConfig,
                config: existingConfig
            };
        });

        // Сортируем: сначала страны с конфигами, потом без
        return countriesList.sort((a, b) => {
            if (a.hasConfig && !b.hasConfig) return -1;
            if (!a.hasConfig && b.hasConfig) return 1;
            return a.name.localeCompare(b.name);
        });
    }, [correctedConfigs, countriesFromStore]);

    // Автоматически выбираем первую страну при загрузке
    useEffect(() => {
        if (displayedCountries.length > 0 && selectedCountryId === null) {
            const firstCountry = displayedCountries[0];
            setSelectedCountryId(firstCountry.storeId);
        }
    }, [displayedCountries, selectedCountryId]);

    // Получаем текущий конфиг для выбранной страны
    const currentConfig = useMemo(() => {
        if (!selectedCountryId) return null;

        // Находим отображаемую страну по ID из стора
        const displayedCountry = displayedCountries.find(c => c.storeId === selectedCountryId);
        if (!displayedCountry) return null;

        // Если у страны есть конфиг, возвращаем его
        if (displayedCountry.config) {
            return {
                ...displayedCountry.config,
                id: displayedCountry.storeId,
                country: displayedCountry.name,
                countryCode: displayedCountry.code
            };
        }

        // Если конфига нет, создаем временный конфиг
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

    // Получаем все доступные страны для диалога настроек
    const allAvailableCountries = useMemo(() => {
        return countriesFromStore.map(country => ({
            id: country.id,
            name: country.name,
            code: country.code
        }));
    }, [countriesFromStore]);

    // Получаем страны, которые еще не добавлены в конфиги
    const availableCountriesForAdding = useMemo(() => {
        const existingCountryIds = new Set(
            correctedConfigs.map(c => c.id)
        );

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
            // Убедимся что конфиг имеет правильный ID
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
                getCountries(); // Обновляем список стран
                if (selectedCountryId === countryToDelete.id) {
                    // Если удалили выбранную страну, выбираем первую доступную
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

    // Функция для открытия диалога редактирования
    const handleEditCountry = (country: { storeId: number; name: string; code: string }) => {
        setCountryToEdit(country);
        setEditDialogOpen(true);
    };

    // Функция для сохранения изменений (пока просто закрываем диалог)
    const handleSaveCountry = (updatedCountry: { id: number; name: string; code: string }) => {
        // Здесь пока просто показываем сообщение и закрываем диалог
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

    return (
        <>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold">Calendar Management</h2>
                        <p className="text-muted-foreground">Configure holidays, working days and weekly schedules</p>
                    </div>
                    <Button
                        variant="outline"
                        onClick={() => setIsSettingsOpen(true)}
                    >
                        <Plus className="w-4 h-4" />

                        Add new country
                    </Button>
                </div>

                <div className="flex gap-4">
                    {/* Country Selector */}
                    <div style={{ width: "40%" }}>
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-medium">Countries</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-1">
                                    {displayedCountries.map((country) => (
                                        <div
                                            key={country.storeId}
                                            className="relative group"
                                        >
                                            <Button
                                                variant={selectedCountryId === country.storeId ? "secondary" : "ghost"}
                                                className="w-full justify-start pr-16"
                                                onClick={() => handleCountrySelect(country.storeId)}
                                            >
                                                <div className="flex items-center justify-between w-full">
                                                    <span>{country.name}</span>
                                                </div>
                                            </Button>
                                            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleEditCountry(country);
                                                    }}
                                                >
                                                    <Edit2 className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-100"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteClick(country);
                                                    }}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-lg font-semibold">
                                            {displayedCountries.find(c => c.storeId === selectedCountryId)?.name || 'Select Country'}
                                        </h3>
                                        {selectedCountryId && currentConfig && (
                                            <p className="text-sm text-muted-foreground">
                                                Country Code: {currentConfig.countryCode}
                                            </p>
                                        )}
                                    </div>

                                    {/* Табы */}
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
                                                    isReadOnly={!displayedCountries.find(c => c.storeId === selectedCountryId)?.hasConfig}
                                                />
                                            </div>
                                        )}

                                        {activeTab === 'weekly' && (
                                            <div className="space-y-4">
                                                <CalendarWeeklyScheduleTab
                                                    config={currentConfig}
                                                    onUpdateWeeklySchedule={onUpdateWeeklySchedule}
                                                    isReadOnly={!displayedCountries.find(c => c.storeId === selectedCountryId)?.hasConfig}
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
                </div>

                {/* CalendarSettingsDialog */}
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

            {/* Delete Confirmation Dialog */}
            <DeleteConfirmationDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                title="Delete Country"
                description={`Are you sure you want to delete ${countryToDelete?.name}? All associated data will also be removed. This action cannot be undone.`}
                onConfirm={confirmDeleteCountry}
            />

            {/* Edit Country Dialog */}
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