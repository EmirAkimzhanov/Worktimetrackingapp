import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '../../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Calendar, Settings, FileText, BarChart } from 'lucide-react';
import { CountryCalendarConfig, Holiday, WorkWeekend, WeeklySchedule } from '../../../types/types';
import { CalendarHolidaysTab } from './CalenarHolidaysTab';
import { CalendarWeeklyScheduleTab } from './CalendarWeeklyScheduleTabProps ';
import { CalendarStatisticsTab } from './CalendarStatisticsTabProps ';
import { CalendarSettingsDialog } from './CalendarSettingsDialog';
import { useUserStore } from '../../../store/UsersStore';

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
    const store_countries = useUserStore((state) => state.countries);

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
        } else {
            alert('Cannot add country: Add function is not available');
        }
    };

    const handleDeleteConfig = (id: number) => {
        if (onDeleteConfig) {
            onDeleteConfig(id);
            const remainingCountries = displayedCountries.filter(c => c.storeId !== id && c.hasConfig);
            if (remainingCountries.length > 0) {
                setSelectedCountryId(remainingCountries[0].storeId);
            } else if (displayedCountries.length > 0) {
                setSelectedCountryId(displayedCountries[0].storeId);
            }
        } else {
            alert('Cannot delete country: Delete function is not available');
        }
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
                    <Settings className="w-4 h-4 mr-2" />
                    Global Settings
                </Button>
            </div>

            <div className="flex gap-4">
                {/* Country Selector */}
                <div className="w-64">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Countries</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-1">
                                {displayedCountries.map((country) => (
                                    <Button
                                        key={country.storeId}
                                        variant={selectedCountryId === country.storeId ? "secondary" : "ghost"}
                                        className="w-full justify-start"
                                        onClick={() => handleCountrySelect(country.storeId)}
                                    >
                                        <div className="flex items-center justify-between w-full">
                                            <span>{country.name}</span>
                                            {!country.hasConfig && (
                                                <span className="text-xs text-muted-foreground ml-2">(No config)</span>
                                            )}
                                        </div>
                                    </Button>
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
    );
}