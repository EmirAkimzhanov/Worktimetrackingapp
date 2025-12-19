// components/monitoring/NotificationHistory.tsx
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TimeSheetNotification } from '@/types/types';
import { Mail, CheckCircle2, Clock, XCircle, Eye, RefreshCw } from 'lucide-react';

interface NotificationHistoryProps {
    notifications: TimeSheetNotification[];
}

export function NotificationHistory({ notifications }: NotificationHistoryProps) {
    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'sent':
                return (
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Sent
                    </Badge>
                );
            case 'pending':
                return (
                    <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                        <Clock className="w-3 h-3 mr-1" />
                        Pending
                    </Badge>
                );
            case 'failed':
                return (
                    <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
                        <XCircle className="w-3 h-3 mr-1" />
                        Failed
                    </Badge>
                );
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Notification History</h3>
                <Button variant="outline" className="gap-2">
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                </Button>
            </div>

            <div className="space-y-3">
                {notifications.length === 0 ? (
                    <Card>
                        <CardContent className="py-8 text-center text-gray-500">
                            <Mail className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                            <p>No notifications sent yet</p>
                        </CardContent>
                    </Card>
                ) : (
                    notifications.map((notification) => (
                        <Card key={notification.id}>
                            <CardContent className="p-4">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-2 flex-1">
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-medium">{notification.email_subject}</h4>
                                            {getStatusBadge(notification.status)}
                                        </div>
                                        <p className="text-sm text-gray-600 line-clamp-2">
                                            {notification.email_body}
                                        </p>
                                        <div className="flex items-center gap-4 text-sm text-gray-500">
                                            <span>Period: {notification.period_start} to {notification.period_end}</span>
                                            <span>Sent: {new Date(notification.sent_at).toLocaleString()}</span>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="icon" title="View Details">
                                        <Eye className="w-4 h-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}