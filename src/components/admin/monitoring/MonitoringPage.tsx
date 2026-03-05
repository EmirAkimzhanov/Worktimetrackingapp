// app/monitoring/page.tsx
import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { MonitoringTable } from '../monitoring/MonitoringTable';
import { NotificationHistory } from '../monitoring/NotificationHistory';
import { SettingsPanel } from '../monitoring/SettingsPanel';
import { Calendar, Bell, Settings, RefreshCw } from 'lucide-react';
import { TimeSheetMonitoring, TimeSheetNotification } from '../../../types/types';
import { useGetMonitoring } from '../../../hooks/useMonitoring';
import { useGetCountries } from '../../../hooks/useCountries';
import { useUserStore } from '../../../store/UsersStore';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { CalendarRange } from 'lucide-react';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { toast } from 'sonner';
import { format } from 'date-fns';

// Моковые уведомления пока оставим, так как для них еще нет API
const mockNotifications: TimeSheetNotification[] = [
    {
        id: '1',
        user_id: 4,
        period_start: '2024-01-01',
        period_end: '2024-01-07',
        sent_at: '2024-01-08 09:00:00',
        status: 'sent',
        email_subject: 'Reminder: Time Sheet Submission Required',
        email_body: 'Please submit your time sheet for the period 2024-01-01 to 2024-01-07'
    },
    {
        id: '2',
        user_id: 3,
        period_start: '2024-01-01',
        period_end: '2024-01-07',
        sent_at: '2024-01-07 18:30:00',
        status: 'sent',
        email_subject: 'Time Sheet Partially Filled',
        email_body: 'Your time sheet is only 50% complete for the period 2024-01-01 to 2024-01-07'
    }
];

// Функция для определения статуса на основе completion (только 3 статуса)
const getStatusFromCompletion = (completion: number) => {
    if (completion >= 100) return 'completed';
    if (completion === 0) return 'missing';
    return 'partial'; // от 1 до 99
};

export default function MonitoringPage() {
    const [selectedCountry, setSelectedCountry] = useState<string>('');
    const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));

    const { mutate: getMonitoring, isPending: isMonitoringLoading } = useGetMonitoring();
    const { mutate: getCountries } = useGetCountries();
    const countries = useUserStore((state) => state.countries);
    const monitoring = useUserStore((state) => state.monitoring);

    useEffect(() => {
        getCountries();
    }, [getCountries]);

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

        getMonitoring({
            start_date: startDate,
            end_date: endDate,
            country: selectedCountry
        }, {
            onError: (error) => {
                toast.error(`Failed to load monitoring data: ${error.message}`);
            }
        });
    };

    // Используем реальные данные из store
    const displayData = monitoring || [];

    const getDisplayPeriod = () => {
        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
            return `${format(start, 'dd.MM.yyyy')} - ${format(end, 'dd.MM.yyyy')} (${days} days)`;
        }
        return 'Select date range';
    };

    // Вычисляем статистику на основе реальных данных (только 3 категории)
    const stats = useMemo(() => {
        if (!displayData || displayData.length === 0) {
            return {
                totalUsers: 0,
                averageCompletion: 0,
                completed: 0,
                partial: 0,
                missing: 0
            };
        }

        const totalCompletion = displayData.reduce((sum, item) => sum + item.completion, 0);
        const averageCompletion = totalCompletion / displayData.length;

        const completed = displayData.filter(item => item.completion >= 100).length;
        const partial = displayData.filter(item => item.completion > 0 && item.completion < 100).length;
        const missing = displayData.filter(item => item.completion === 0).length;

        return {
            totalUsers: displayData.length,
            averageCompletion: Math.round(averageCompletion * 10) / 10,
            completed,
            partial,
            missing
        };
    }, [displayData]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Time Sheet Monitoring</h1>
                    <p className="text-muted-foreground">
                        Track and manage time sheet completion across your team
                    </p>
                </div>
            </div>

            {/* Фильтры мониторинга */}
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
                    <div className="space-y-4">
                        {/* Выбор страны */}
                        <div className="space-y-2">
                            <Label htmlFor="country">Country *</Label>
                            <Select
                                value={selectedCountry}
                                onValueChange={setSelectedCountry}
                            >
                                <SelectTrigger id="country" className="w-full md:w-[300px]">
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

                        {/* Выбор диапазона дат */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <CalendarRange className="w-4 h-4 text-gray-500" />
                                <span className="text-sm font-medium">Date Range</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="startDate">Start Date *</Label>
                                    <Input
                                        id="startDate"
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        required
                                        className="w-full"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="endDate">End Date *</Label>
                                    <Input
                                        id="endDate"
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        required
                                        className="w-full"
                                    />
                                </div>
                            </div>

                            {/* Отображение выбранного периода */}
                            {startDate && endDate && (
                                <div className="text-sm text-gray-600 bg-blue-50 p-2 rounded-md">
                                    <span className="font-medium">Selected period: </span>
                                    {getDisplayPeriod()}
                                </div>
                            )}
                        </div>

                        {/* Кнопка загрузки */}
                        <div className="flex items-center justify-end pt-4">
                            <Button
                                onClick={handleLoadMonitoring}
                                disabled={!selectedCountry || !startDate || !endDate || isMonitoringLoading}
                                className="gap-2 px-6"
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
                                        Load Monitoring Data
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Dashboard Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Total Users
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalUsers}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Active team members
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Completion Rate
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {stats.averageCompletion}%
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Average completion rate
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Completed
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {stats.completed}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Fully completed
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Missing
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">
                            {stats.missing}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            No entries
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content Tabs */}
            <Tabs defaultValue="monitoring" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="monitoring" className="gap-2">
                        <Calendar className="w-4 h-4" />
                        Monitoring
                    </TabsTrigger>
                    <TabsTrigger value="notifications" className="gap-2">
                        <Bell className="w-4 h-4" />
                        Notifications
                    </TabsTrigger>
                    <TabsTrigger value="settings" className="gap-2">
                        <Settings className="w-4 h-4" />
                        Settings
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="monitoring" className="space-y-4">
                    <MonitoringTable
                        data={displayData}
                        onSendReminder={(userIds, period) => {
                            console.log('Send reminder to:', userIds, 'for period:', period);
                            toast.success(`Reminder sent to ${userIds.length} user(s)`);
                        }}
                        onViewDetails={(userId) => {
                            console.log('View details for user:', userId);
                        }}
                    />
                </TabsContent>

                <TabsContent value="notifications" className="space-y-4">
                    <NotificationHistory notifications={mockNotifications} />
                </TabsContent>

                <TabsContent value="settings" className="space-y-4">
                    <SettingsPanel />
                </TabsContent>
            </Tabs>
        </div>
    );
}