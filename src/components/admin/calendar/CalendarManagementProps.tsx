import React, { useState, useMemo } from 'react';
import { Button } from '../../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Calendar, Settings, FileText, BarChart } from 'lucide-react';
import { CountryCalendarConfig, Holiday, WorkWeekend, WeeklySchedule } from '../../../types/types';
import { CalendarHolidaysTab } from './CalenarHolidaysTab';
import { CalendarWeeklyScheduleTab } from './CalendarWeeklyScheduleTabProps ';
import { CalendarStatisticsTab } from './CalendarStatisticsTabProps ';
import { CalendarSettingsDialog } from './CalendarSettingsDialog';

interface CalendarManagementProps {
    configs: CountryCalendarConfig[];
    onUpdateConfig: (config: CountryCalendarConfig) => void;
    onAddConfig?: (config: CountryCalendarConfig) => void; // Сделаем опциональным
    onDeleteConfig?: (id: number) => void; // Сделаем опциональным
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
    onAddConfig, // Может быть undefined
    onDeleteConfig, // Может быть undefined
    onAddHoliday,
    onUpdateHoliday,
    onDeleteHoliday,
    onAddWorkWeekend,
    onDeleteWorkWeekend,
    onUpdateWeeklySchedule
}: CalendarManagementProps) {
    const [activeTab, setActiveTab] = useState('holidays');
    const [selectedCountryId, setSelectedCountryId] = useState<number | 'general'>('general');
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // Используем useMemo для пересчета при изменении configs
    const selectedConfig = useMemo(() => {
        return selectedCountryId === 'general'
            ? configs.find(c => c.countryCode === 'GENERAL')
            : configs.find(c => c.id === selectedCountryId);
    }, [configs, selectedCountryId]);

    const generalConfig = useMemo(() => {
        return configs.find(c => c.countryCode === 'GENERAL');
    }, [configs]);

    // Используем useMemo для пересчета списка стран при изменении configs
    const countries = useMemo(() => {
        return [
            { id: 'general' as const, name: 'General', code: 'GENERAL' },
            ...configs
                .filter(c => c.countryCode !== 'GENERAL') // Исключаем GENERAL из списка стран
                .map(c => ({
                    id: c.id,
                    name: c.country,
                    code: c.countryCode
                }))
        ];
    }, [configs]);

    const handleTabChange = (value: string) => {
        if (['holidays', 'weekly', 'statistics'].includes(value)) {
            setActiveTab(value);
        }
    };

    const handleCountrySelect = (id: number | 'general') => {
        setSelectedCountryId(id);
    };

    // Добавим обработчик для добавления конфигурации с проверкой
    const handleAddConfig = (config: CountryCalendarConfig) => {
        console.log('CalendarManagement: Adding config', config);
        if (onAddConfig) {
            onAddConfig(config);
            // После добавления новой страны, можно автоматически выбрать ее
            setSelectedCountryId(config.id);
        } else {
            console.error('onAddConfig is not provided');
            alert('Cannot add country: Add function is not available');
        }
    };

    // Добавим обработчик для удаления конфигурации с проверкой
    const handleDeleteConfig = (id: number) => {
        console.log('CalendarManagement: Deleting config with id', id);
        if (onDeleteConfig) {
            onDeleteConfig(id);
            // Если удаляем выбранную страну, переключаемся на General
            if (selectedCountryId === id) {
                setSelectedCountryId('general');
            }
        } else {
            console.error('onDeleteConfig is not provided');
            alert('Cannot delete country: Delete function is not available');
        }
    };

    const currentConfig = selectedConfig || generalConfig;

    if (!currentConfig) {
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
                                {countries.map((country) => (
                                    <Button
                                        key={country.id === 'general' ? 'general' : country.id}
                                        variant={selectedCountryId === country.id ? "secondary" : "ghost"}
                                        className="w-full justify-start"
                                        onClick={() => handleCountrySelect(country.id)}
                                    >
                                        {country.name}
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
                            <Tabs value={activeTab} onValueChange={handleTabChange}>
                                <TabsList>
                                    <TabsTrigger value="holidays" className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4" />
                                        Holidays & Work Weekends
                                    </TabsTrigger>
                                    <TabsTrigger value="weekly" className="flex items-center gap-2">
                                        <FileText className="w-4 h-4" />
                                        Weekly Schedule
                                    </TabsTrigger>
                                    <TabsTrigger value="statistics" className="flex items-center gap-2">
                                        <BarChart className="w-4 h-4" />
                                        Statistics
                                    </TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </CardHeader>
                        <CardContent>
                            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                                <TabsContent value="holidays" className="space-y-4">
                                    <CalendarHolidaysTab
                                        config={currentConfig}
                                        onAddHoliday={onAddHoliday}
                                        onUpdateHoliday={onUpdateHoliday}
                                        onDeleteHoliday={onDeleteHoliday}
                                        onAddWorkWeekend={onAddWorkWeekend}
                                        onDeleteWorkWeekend={onDeleteWorkWeekend}
                                    />
                                </TabsContent>

                                <TabsContent value="weekly" className="space-y-4">
                                    <CalendarWeeklyScheduleTab
                                        config={currentConfig}
                                        onUpdateWeeklySchedule={onUpdateWeeklySchedule}
                                    />
                                </TabsContent>

                                <TabsContent value="statistics" className="space-y-4">
                                    <CalendarStatisticsTab
                                        config={currentConfig}
                                    />
                                </TabsContent>
                            </Tabs>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Показываем CalendarSettingsDialog только если функции добавления/удаления доступны */}
            {onAddConfig && onDeleteConfig ? (
                <CalendarSettingsDialog
                    open={isSettingsOpen}
                    onOpenChange={setIsSettingsOpen}
                    configs={configs}
                    onAddConfig={handleAddConfig}
                    onUpdateConfig={onUpdateConfig}
                    onDeleteConfig={handleDeleteConfig}
                />
            ) : (
                // Альтернативный вариант диалога без функций управления странами
                <CalendarSettingsDialog
                    open={isSettingsOpen}
                    onOpenChange={setIsSettingsOpen}
                    configs={configs}
                    onUpdateConfig={onUpdateConfig}
                    onAddConfig={undefined}
                    onDeleteConfig={undefined}
                />
            )}
        </div>
    );
}