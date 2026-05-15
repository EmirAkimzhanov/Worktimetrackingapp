// app/monitoring/page.tsx
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { MonitoringTable } from '../monitoring/MonitoringTable';
import { Calendar, RefreshCw } from 'lucide-react';
import { useGetMonitoring, useGetMonitoringExcel } from '../../../hooks/useMonitoring';
import { useGetCountries } from '../../../hooks/useCountries';
import { useUserStore } from '../../../store/UsersStore';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useSendReminder } from '../../../hooks/useTimeEntry';

export default function MonitoringPage() {
    // Основные фильтры (обязательные)
    const [selectedCountry, setSelectedCountry] = useState<string>('');
    const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));

    // Состояния для пагинации
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);

    // Дополнительные фильтры (передаются в MonitoringTable)
    const [filters, setFilters] = useState<{
        first_name?: string;
        last_name?: string;
        user_email?: string;
        completion?: string;
        updated_after?: string;
        updated_before?: string;
    }>({});

    // Флаг, что данные были загружены хотя бы раз
    const [isDataLoaded, setIsDataLoaded] = useState(false);
    // Флаг, нужно ли загружать данные (включено только после нажатия кнопки)
    const [shouldLoad, setShouldLoad] = useState(false);

    // Формируем параметры для запроса (только если shouldLoad = true)
    const queryParams = shouldLoad ? {
        start_date: startDate,
        end_date: endDate,
        country_id: selectedCountry ? parseInt(selectedCountry) : undefined,
        first_name: filters.first_name,
        last_name: filters.last_name,
        user_email: filters.user_email,
        completion: filters.completion as any,
        updated_after: filters.updated_after,
        updated_before: filters.updated_before,
        page: currentPage,
        page_size: pageSize,
    } : undefined;

    // ХУК - запрос выполняется только когда enabled = true
    const {
        data: monitoringData,
        isLoading: isMonitoringLoading,
        refetch
    } = useGetMonitoring(queryParams, { enabled: shouldLoad });

    const { mutate: exportExcel, isPending: isExporting } = useGetMonitoringExcel();
    const { mutate: getCountries } = useGetCountries();
    const { mutate: sendReminder } = useSendReminder();
    const countries = useUserStore((state) => state.countries);

    // Загружаем страны при монтировании
    useEffect(() => {
        getCountries();
    }, [getCountries]);

    // Обновляем флаг загрузки данных
    useEffect(() => {
        if (monitoringData && monitoringData.results && monitoringData.results.length > 0) {
            setIsDataLoaded(true);
        }
    }, [monitoringData]);

    const handleLoadMonitoring = () => {
        if (!selectedCountry) {
            toast.error('Please select a country');
            return;
        }

        if (!startDate || !endDate) {
            toast.error('Please select date range');
            return;
        }

        const start = new Date(startDate);
        const end = new Date(endDate);

        if (start > end) {
            toast.error('Start date must be before end date');
            return;
        }

        setCurrentPage(1);
        setShouldLoad(true); // Включаем загрузку данных
    };

    // Обработчик изменения фильтров из MonitoringTable
    const handleFilterChange = (newFilters: typeof filters) => {
        setFilters(newFilters);
        if (shouldLoad) {
            setCurrentPage(1); // Сбрасываем на первую страницу при изменении фильтров, если данные уже загружены
        }
    };

    // Обновляем данные при изменении пагинации или фильтров (только если данные уже загружены)
    useEffect(() => {
        if (shouldLoad) {
            refetch();
        }
    }, [currentPage, pageSize, filters, shouldLoad, refetch]);

    // Данные для отображения
    const displayData = monitoringData?.results || [];
    const totalCount = monitoringData?.count || 0;

    const getDisplayPeriod = () => {
        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
            return `${format(start, 'dd.MM.yyyy')} - ${format(end, 'dd.MM.yyyy')} (${days} days)`;
        }
        return 'Select date range';
    };

    const handleSendReminder = (userIds: number[], period: { start: string; end: string }) => {
        sendReminder({
            emails: userIds.map(id => id.toString()),
            start_date: period.start,
            end_date: period.end
        }, {
            onSuccess: () => {
                toast.success(`Reminders sent to ${userIds.length} user(s)`);
                // Обновляем данные после отправки
                refetch();
            },
            onError: (error) => {
                toast.error(`Failed to send reminders: ${error.message}`);
            }
        });
    };

    const handleViewDetails = (userId: number) => {
        console.log('View details for user:', userId);
    };

    const handleExportExcel = () => {
        if (!shouldLoad || !isDataLoaded) {
            toast.error('Please load data first');
            return;
        }

        exportExcel({
            start_date: startDate,
            end_date: endDate,
            country_id: selectedCountry ? parseInt(selectedCountry) : undefined,
            first_name: filters.first_name,
            last_name: filters.last_name,
            user_email: filters.user_email,
            completion: filters.completion as any,
            updated_after: filters.updated_after,
            updated_before: filters.updated_before,
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Time Sheet Monitoring</h1>
                    <p className="text-muted-foreground">
                        Track and manage time sheet completion across your team
                    </p>
                </div>
                <Button
                    variant="outline"
                    onClick={handleExportExcel}
                    disabled={!isDataLoaded || displayData.length === 0 || isExporting}
                    className="gap-2"
                >
                    {isExporting ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                        <Calendar className="w-4 h-4" />
                    )}
                    Export Excel
                </Button>
            </div>

            {/* Фильтры мониторинга - только основные (страна и даты) */}
            <Card className="shadow-md hover:shadow-lg transition-shadow border-t-4" style={{ borderTopColor: '#1F4E78' }}>
                <CardHeader style={{ backgroundColor: '#F1F5F9' }} className="border-b">
                    <CardTitle className="flex items-center gap-2" style={{ color: '#1F4E78' }}>
                        <Calendar className="w-5 h-5" />
                        Monitoring Filters
                    </CardTitle>
                    <CardDescription>
                        Select country and date range to monitor time sheets
                    </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="flex flex-wrap gap-3 items-end">
                        <div className="flex-1 min-w-[150px]">
                            <Label htmlFor="country" className="text-sm mb-1 block">Country *</Label>
                            <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                                <SelectTrigger id="country" className="h-9">
                                    <SelectValue placeholder="Select country" />
                                </SelectTrigger>
                                <SelectContent>
                                    {countries?.map((country: any) => (
                                        <SelectItem key={country.id} value={country.id.toString()}>
                                            {country.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex-1 min-w-[150px]">
                            <Label htmlFor="startDate" className="text-sm mb-1 block">Start Date *</Label>
                            <Input
                                id="startDate"
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                required
                                className="h-9"
                            />
                        </div>

                        <div className="flex-1 min-w-[150px]">
                            <Label htmlFor="endDate" className="text-sm mb-1 block">End Date *</Label>
                            <Input
                                id="endDate"
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                required
                                className="h-9"
                            />
                        </div>

                        <div>
                            <Label className="text-sm mb-1 block invisible">Action</Label>
                            <Button
                                onClick={handleLoadMonitoring}
                                disabled={!selectedCountry || !startDate || !endDate || isMonitoringLoading}
                                className="gap-2 h-9 px-4 whitespace-nowrap"
                                style={{ backgroundColor: '#1F4E78' }}
                            >
                                {isMonitoringLoading ? (
                                    <>
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                        Loading...
                                    </>
                                ) : (
                                    <>
                                        <Calendar className="w-4 h-4" />
                                        Load Data
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>

                    {/* Отображение выбранного периода */}
                    {startDate && endDate && (
                        <div className="text-sm text-gray-600 bg-blue-50 p-2 rounded-md mt-4">
                            <span className="font-medium">Selected period: </span>
                            {getDisplayPeriod()}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Monitoring Table - здесь находятся все дополнительные фильтры */}
            <MonitoringTable
                data={displayData}
                totalCount={totalCount}
                currentPage={currentPage}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
                onSendReminder={handleSendReminder}
                onViewDetails={handleViewDetails}
                periodStart={startDate}
                periodEnd={endDate}
                isLoading={isMonitoringLoading}
                onFilterChange={handleFilterChange}
            />
        </div>
    );
}