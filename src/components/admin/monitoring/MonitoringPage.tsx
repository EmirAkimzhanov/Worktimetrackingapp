// app/monitoring/page.tsx
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { MonitoringTable } from '../monitoring/MonitoringTable';
import { NotificationHistory } from '../monitoring/NotificationHistory';
import { SettingsPanel } from '../monitoring/SettingsPanel';
import { Calendar, Bell, Settings, Download, Filter } from 'lucide-react';
import { TimeSheetMonitoring, TimeSheetNotification } from '../../../types/types';

// Моковые данные для демонстрации
const mockMonitoringData: TimeSheetMonitoring[] = [
    {
        id: '1',
        user_id: 'user1',
        user_name: 'John Doe',
        user_email: 'john@company.com',
        period_start: '2024-01-01',
        period_end: '2024-01-07',
        total_hours_required: 40,
        total_hours_logged: 38,
        completion_percentage: 95,
        status: 'partial',
        last_updated: '2024-01-07 17:30:00',
        missing_days: ['2024-01-03']
    },
    {
        id: '2',
        user_id: 'user2',
        user_name: 'Jane Smith',
        user_email: 'jane@company.com',
        period_start: '2024-01-01',
        period_end: '2024-01-07',
        total_hours_required: 40,
        total_hours_logged: 40,
        completion_percentage: 100,
        status: 'completed',
        last_updated: '2024-01-07 18:00:00',
        missing_days: []
    },
    {
        id: '3',
        user_id: 'user3',
        user_name: 'Bob Johnson',
        user_email: 'bob@company.com',
        period_start: '2024-01-01',
        period_end: '2024-01-07',
        total_hours_required: 40,
        total_hours_logged: 20,
        completion_percentage: 50,
        status: 'missing',
        last_updated: '2024-01-05 12:00:00',
        missing_days: ['2024-01-04', '2024-01-05', '2024-01-06']
    },
    {
        id: '4',
        user_id: 'user4',
        user_name: 'Alice Brown',
        user_email: 'alice@company.com',
        period_start: '2024-01-01',
        period_end: '2024-01-07',
        total_hours_required: 40,
        total_hours_logged: 0,
        completion_percentage: 0,
        status: 'overdue',
        last_updated: '2024-01-01 09:00:00',
        missing_days: ['2024-01-01', '2024-01-02', '2024-01-03', '2024-01-04', '2024-01-05', '2024-01-06']
    }
];

const mockNotifications: TimeSheetNotification[] = [
    {
        id: '1',
        user_id: 'user4',
        period_start: '2024-01-01',
        period_end: '2024-01-07',
        sent_at: '2024-01-08 09:00:00',
        status: 'sent',
        email_subject: 'Reminder: Time Sheet Submission Required',
        email_body: 'Please submit your time sheet for the period 2024-01-01 to 2024-01-07'
    },
    {
        id: '2',
        user_id: 'user3',
        period_start: '2024-01-01',
        period_end: '2024-01-07',
        sent_at: '2024-01-07 18:30:00',
        status: 'sent',
        email_subject: 'Time Sheet Partially Filled',
        email_body: 'Your time sheet is only 50% complete for the period 2024-01-01 to 2024-01-07'
    }
];

export default function MonitoringPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Time Sheet Monitoring</h1>
                    <p className="text-muted-foreground">
                        Track and manage time sheet completion across your team
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {/* <Button variant="outline" className="gap-2">
                        <Filter className="w-4 h-4" />
                        Filter
                    </Button>
                    <Button variant="outline" className="gap-2">
                        <Download className="w-4 h-4" />
                        Export
                    </Button> */}
                    {/* <Button className="gap-2" style={{ backgroundColor: '#1F4E78' }}>
                        <Calendar className="w-4 h-4" />
                        Generate Report
                    </Button> */}
                </div>
            </div>

            {/* Dashboard Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Total Users
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">24</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Active team members
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Current Period
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">85%</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Overall completion rate
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Pending Actions
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-600">3</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Need attention
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Overdue
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">2</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Past due date
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
                        data={mockMonitoringData}
                        onSendReminder={(userIds, period) => {
                            console.log('Send reminder to:', userIds, 'for period:', period);
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