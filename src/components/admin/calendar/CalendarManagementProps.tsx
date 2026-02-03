import React, { useState, useMemo } from 'react';
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
    const [selectedCountryId, setSelectedCountryId] = useState<number | 'general'>('general');
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const store_countries = useUserStore((state) => state.countries);

    // Получаем страны из стора
    const countriesFromStore = store_countries || [];

    const selectedConfig = useMemo(() => {
        return selectedCountryId === 'general'
            ? configs.find(c => c.countryCode === 'GENERAL')
            : configs.find(c => c.id === selectedCountryId);
    }, [configs, selectedCountryId]);

    const generalConfig = useMemo(() => {
        return configs.find(c => c.countryCode === 'GENERAL');
    }, [configs]);

    // Создаем список стран для отображения из store_countries
    const displayedCountries = useMemo(() => {
        // Базовый список: General + все страны из стора
        const result = [
            { id: 'general' as const, name: 'General', code: 'GENERAL' }
        ];

        // Для каждой страны из стора создаем объект для отображения
        countriesFromStore.forEach(storeCountry => {
            // Находим соответствующий конфиг для этой страны
            const configForCountry = configs.find(config =>
                config.countryCode === storeCountry.code ||
                config.country === storeCountry.name
            );

            // Если есть конфиг, используем его ID, иначе создаем временный отрицательный ID
            const countryId = configForCountry ? configForCountry.id : -storeCountry.id;

            result.push({
                id: countryId,
                name: storeCountry.name,
                code: storeCountry.code
            });
        });

        return result;
    }, [configs, countriesFromStore]);

    // Проверяем, есть ли конфиг для выбранной страны
    const currentConfig = useMemo(() => {
        if (selectedCountryId === 'general') {
            return generalConfig;
        } else {
            // Находим конфиг по ID
            const config = configs.find(c => c.id === selectedCountryId);

            // Если не нашли по ID, возможно это временный отрицательный ID
            if (!config && selectedCountryId < 0) {
                // Находим страну по абсолютному значению ID
                const storeCountryId = Math.abs(selectedCountryId);
                const storeCountry = countriesFromStore.find(c => c.id === storeCountryId);

                if (storeCountry) {
                    // Создаем пустой конфиг для страны без конфигурации
                    return {
                        id: selectedCountryId,
                        country: storeCountry.name,
                        countryCode: storeCountry.code,
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
                }
            }

            return config;
        }
    }, [selectedCountryId, configs, generalConfig, countriesFromStore]);

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
        const existingCountryCodes = new Set(
            configs
                .filter(c => c.countryCode !== 'GENERAL')
                .map(c => c.countryCode)
        );

        return countriesFromStore
            .filter(country => !existingCountryCodes.has(country.code))
            .map(country => ({
                id: country.id,
                name: country.name,
                code: country.code
            }));
    }, [configs, countriesFromStore]);

    const handleCountrySelect = (id: number | 'general') => {
        setSelectedCountryId(id);
    };

    const handleAddConfig = (config: CountryCalendarConfig) => {
        console.log('CalendarManagement: Adding config', config);
        if (onAddConfig) {
            onAddConfig(config);
            // После добавления обновляем выбранную страну на только что добавленную
            const addedConfig = configs.find(c => c.countryCode === config.countryCode);
            if (addedConfig) {
                setSelectedCountryId(addedConfig.id);
            }
        } else {
            console.error('onAddConfig is not provided');
            alert('Cannot add country: Add function is not available');
        }
    };

    const handleDeleteConfig = (id: number) => {
        console.log('CalendarManagement: Deleting config with id', id);
        if (onDeleteConfig) {
            onDeleteConfig(id);
            if (selectedCountryId === id) {
                setSelectedCountryId('general');
            }
        } else {
            console.error('onDeleteConfig is not provided');
            alert('Cannot delete country: Delete function is not available');
        }
    };

    if (!currentConfig && selectedCountryId !== 'general') {
        return (
            <div className="flex flex-col items-center justify-center p-8 space-y-4">
                <p className="text-lg font-medium">No calendar configuration available for this country</p>
                <p className="text-muted-foreground">You can add calendar configuration in Global Settings</p>
                <Button onClick={() => setIsSettingsOpen(true)}>
                    <Settings className="w-4 h-4 mr-2" />
                    Go to Global Settings
                </Button>
            </div>
        );
    }

    if (!currentConfig && selectedCountryId === 'general' && !generalConfig) {
        return (
            <div className="flex items-center justify-center p-8">
                <p>No calendar configurations available</p>
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
                                {displayedCountries.map((country) => {
                                    // Проверяем, есть ли конфиг для этой страны
                                    const hasConfig = country.id === 'general'
                                        ? !!generalConfig
                                        : country.id > 0; // Положительный ID означает, что есть конфиг

                                    return (
                                        <Button
                                            key={country.id === 'general' ? 'general' : country.id}
                                            variant={selectedCountryId === country.id ? "secondary" : "ghost"}
                                            className="w-full justify-start"
                                            onClick={() => handleCountrySelect(country.id)}
                                        >
                                            <div className="flex items-center justify-between w-full">
                                                <span>{country.name}</span>
                                                {country.id !== 'general' && !hasConfig && (
                                                    <span className="text-xs text-muted-foreground ml-2">(No config)</span>
                                                )}
                                            </div>
                                        </Button>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content */}
                <div className="flex-1">
                    <Card>
                        <CardHeader>
                            {/* Заголовок с названием страны */}
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold">
                                        {selectedCountryId === 'general'
                                            ? 'General Calendar Configuration'
                                            : displayedCountries.find(c => c.id === selectedCountryId)?.name || 'Country Calendar'}
                                    </h3>
                                    {selectedCountryId !== 'general' && currentConfig && (
                                        <p className="text-sm text-muted-foreground">
                                            Country Code: {currentConfig.countryCode}
                                        </p>
                                    )}
                                </div>

                                {/* Табы как в AdminPanel - простые кнопки */}
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
                                                ? "border-b-black text-black shadow"
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
                            {/* Контент табов */}
                            {activeTab === 'holidays' && currentConfig && (
                                <div className="space-y-4">
                                    <CalendarHolidaysTab
                                        config={currentConfig}
                                        onAddHoliday={onAddHoliday}
                                        onUpdateHoliday={onUpdateHoliday}
                                        onDeleteHoliday={onDeleteHoliday}
                                        onAddWorkWeekend={onAddWorkWeekend}
                                        onDeleteWorkWeekend={onDeleteWorkWeekend}
                                        isReadOnly={selectedCountryId < 0} // Только для чтения если нет конфига
                                    />
                                </div>
                            )}

                            {activeTab === 'weekly' && currentConfig && (
                                <div className="space-y-4">
                                    <CalendarWeeklyScheduleTab
                                        config={currentConfig}
                                        onUpdateWeeklySchedule={onUpdateWeeklySchedule}
                                        isReadOnly={selectedCountryId < 0} // Только для чтения если нет конфига
                                    />
                                </div>
                            )}

                            {activeTab === 'statistics' && currentConfig && (
                                <div className="space-y-4">
                                    <CalendarStatisticsTab
                                        config={currentConfig}
                                    />
                                </div>
                            )}

                            {!currentConfig && (
                                <div className="text-center py-8 text-muted-foreground">
                                    <p>No calendar configuration available for this country.</p>
                                    <Button
                                        onClick={() => setIsSettingsOpen(true)}
                                        className="mt-4"
                                    >
                                        Add Calendar Configuration
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* CalendarSettingsDialog */}
            {onAddConfig && onDeleteConfig ? (
                <CalendarSettingsDialog
                    open={isSettingsOpen}
                    onOpenChange={setIsSettingsOpen}
                    configs={configs}
                    onAddConfig={handleAddConfig}
                    onUpdateConfig={onUpdateConfig}
                    onDeleteConfig={handleDeleteConfig}
                    availableCountries={availableCountriesForAdding}
                    allCountries={allAvailableCountries}
                />
            ) : (
                <CalendarSettingsDialog
                    open={isSettingsOpen}
                    onOpenChange={setIsSettingsOpen}
                    configs={configs}
                    onUpdateConfig={onUpdateConfig}
                    onAddConfig={undefined}
                    onDeleteConfig={undefined}
                    availableCountries={availableCountriesForAdding}
                    allCountries={allAvailableCountries}
                />
            )}
        </div>
    );
}