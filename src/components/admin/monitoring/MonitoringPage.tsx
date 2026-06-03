// app/monitoring/page.tsx
import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
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
import { format, startOfMonth, endOfMonth, subMonths, setDate } from 'date-fns';
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

    // Сохраняем параметры для запроса
    const [requestParams, setRequestParams] = useState<any>(null);

    // Флаг, что страна выбрана (для активации фильтров)
    const isCountrySelected = !!selectedCountry;

    const { mutate: exportExcel, isPending: isExporting } = useGetMonitoringExcel();
    const { mutate: getCountries } = useGetCountries();
    const { mutate: sendReminder } = useSendReminder();
    const countries = useUserStore((state) => state.countries);

    // Загружаем страны при монтировании
    useEffect(() => {
        getCountries();
    }, [getCountries]);

    // Функция для отправки запроса
    const sendRequest = useCallback((
        countryId: string,
        start: string,
        end: string,
        page: number = 1,
        pageSizeValue: number = 25,
        currentFilters: any = filters
    ) => {
        if (!countryId) {
            toast.error('Please select a country');
            return;
        }

        const params = {
            start_date: start,
            end_date: end,
            country_id: parseInt(countryId),
            first_name: currentFilters.first_name,
            last_name: currentFilters.last_name,
            user_email: currentFilters.user_email,
            completion: currentFilters.completion as any,
            updated_after: currentFilters.updated_after,
            updated_before: currentFilters.updated_before,
            page: page,
            page_size: pageSizeValue,
        };

        setRequestParams(params);
        setIsDataLoaded(true);
    }, [filters]);

    // Функции для установки предустановленных периодов с автоматической отправкой
    const setCurrentMonth = () => {
        if (!isCountrySelected) {
            toast.error('Please select a country first');
            return;
        }
        const now = new Date();
        const start = startOfMonth(now);
        const end = endOfMonth(now);
        const startStr = format(start, 'yyyy-MM-dd');
        const endStr = format(end, 'yyyy-MM-dd');
        setStartDate(startStr);
        setEndDate(endStr);
        // Отправляем запрос сразу
        sendRequest(selectedCountry, startStr, endStr, 1, pageSize, filters);
    };

    const setPreviousMonth = () => {
        if (!isCountrySelected) {
            toast.error('Please select a country first');
            return;
        }
        const now = new Date();
        const previous = subMonths(now, 1);
        const start = startOfMonth(previous);
        const end = endOfMonth(previous);
        const startStr = format(start, 'yyyy-MM-dd');
        const endStr = format(end, 'yyyy-MM-dd');
        setStartDate(startStr);
        setEndDate(endStr);
        // Отправляем запрос сразу
        sendRequest(selectedCountry, startStr, endStr, 1, pageSize, filters);
    };

    const setPreviousMonthUntil15th = () => {
        if (!isCountrySelected) {
            toast.error('Please select a country first');
            return;
        }
        const now = new Date();
        const previousMonth = subMonths(now, 1);
        const start = startOfMonth(previousMonth);
        const end = setDate(start, 15);
        const startStr = format(start, 'yyyy-MM-dd');
        const endStr = format(end, 'yyyy-MM-dd');
        setStartDate(startStr);
        setEndDate(endStr);
        // Отправляем запрос сразу
        sendRequest(selectedCountry, startStr, endStr, 1, pageSize, filters);
    };

    const setCurrentMonthUntil15th = () => {
        if (!isCountrySelected) {
            toast.error('Please select a country first');
            return;
        }
        const now = new Date();
        const start = startOfMonth(now);
        const end = setDate(start, 15);
        const startStr = format(start, 'yyyy-MM-dd');
        const endStr = format(end, 'yyyy-MM-dd');
        setStartDate(startStr);
        setEndDate(endStr);
        // Отправляем запрос сразу
        sendRequest(selectedCountry, startStr, endStr, 1, pageSize, filters);
    };

    // Ручная загрузка данных по кнопке Load Data
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

        // Отправляем запрос с текущими датами
        sendRequest(selectedCountry, startDate, endDate, 1, pageSize, filters);
    };

    // Обработчик изменения фильтров из MonitoringTable
    const handleFilterChange = (newFilters: typeof filters) => {
        setFilters(newFilters);
    };

    // Обработчик изменения страницы
    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        // Если данные уже загружены, отправляем запрос с новыми параметрами страницы
        if (requestParams) {
            const updatedParams = {
                ...requestParams,
                page: page,
                page_size: pageSize,
            };
            setRequestParams(updatedParams);
        }
    };

    // Обработчик изменения размера страницы
    const handlePageSizeChange = (size: number) => {
        setPageSize(size);
        setCurrentPage(1);
        // Если данные уже загружены, отправляем запрос с новыми параметрами
        if (requestParams) {
            const updatedParams = {
                ...requestParams,
                page: 1,
                page_size: size,
            };
            setRequestParams(updatedParams);
        }
    };

    // Функция для применения фильтров (при изменении фильтров в таблице)
    const handleApplyFilters = () => {
        if (requestParams) {
            // Переотправляем запрос с текущими датами и новыми фильтрами
            sendRequest(selectedCountry, startDate, endDate, 1, pageSize, filters);
        }
    };

    // Используем хук с enabled параметром
    const {
        data: monitoringData,
        isLoading: isMonitoringLoading,
        refetch
    } = useGetMonitoring(requestParams, { enabled: !!requestParams });

    // Обновляем данные при изменении requestParams
    useEffect(() => {
        if (requestParams) {
            refetch();
        }
    }, [requestParams, refetch]);

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
                if (requestParams) {
                    refetch();
                }
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
        if (!requestParams) {
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
                    disabled={!requestParams || displayData.length === 0 || isExporting}
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
                                disabled={!isCountrySelected}
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
                                disabled={!isCountrySelected}
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

                    {/* Кнопки быстрых фильтров по датам */}
                    <div className="flex flex-wrap gap-2 mt-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={setCurrentMonth}
                            disabled={!isCountrySelected || isMonitoringLoading}
                            className="text-xs"
                        >
                            Current Month
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={setPreviousMonth}
                            disabled={!isCountrySelected || isMonitoringLoading}
                            className="text-xs"
                        >
                            Previous Month
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={setCurrentMonthUntil15th}
                            disabled={!isCountrySelected || isMonitoringLoading}
                            className="text-xs"
                        >
                            Current Month (until 15th)
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={setPreviousMonthUntil15th}
                            disabled={!isCountrySelected || isMonitoringLoading}
                            className="text-xs"
                        >
                            Previous Month (until 15th)
                        </Button>
                    </div>

                    {/* Отображение выбранного периода */}
                    {startDate && endDate && isCountrySelected && (
                        <div className="text-sm text-gray-600 bg-blue-50 p-2 rounded-md mt-4">
                            <span className="font-medium">Selected period: </span>
                            {getDisplayPeriod()}
                        </div>
                    )}

                    {/* Подсказка, если страна не выбрана */}
                    {!isCountrySelected && (
                        <div className="text-sm text-amber-600 bg-amber-50 p-2 rounded-md mt-4">
                            ⚠️ Please select a country first to enable date filters and load data
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
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
                onSendReminder={handleSendReminder}
                onViewDetails={handleViewDetails}
                periodStart={startDate}
                periodEnd={endDate}
                isLoading={isMonitoringLoading}
                onFilterChange={handleFilterChange}
                onApplyFilters={handleApplyFilters}
            />
        </div>
    );
}