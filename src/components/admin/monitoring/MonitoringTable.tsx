// components/monitoring/MonitoringTable.tsx
import React, { useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Mail,
    Eye,
    MoreVertical,
    Filter,
    Search,
    Calendar,
    Download,
    Send,
    AlertCircle,
    CheckCircle2,
    Clock,
    XCircle
} from 'lucide-react';
import { TimeSheetMonitoring } from '@/types/types';
import { toast } from 'sonner@2.0.3';

interface MonitoringTableProps {
    data: TimeSheetMonitoring[];
    onSendReminder: (userIds: string[], period: { start: string; end: string }) => void;
    onViewDetails: (userId: string) => void;
}

export function MonitoringTable({ data, onSendReminder, onViewDetails }: MonitoringTableProps) {
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [isNotificationDialogOpen, setIsNotificationDialogOpen] = useState(false);
    const [notificationSubject, setNotificationSubject] = useState('');
    const [notificationMessage, setNotificationMessage] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    const filteredData = data.filter(item => {
        const matchesSearch =
            item.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.user_email.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = statusFilter === 'all' || item.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const toggleUserSelection = (userId: string) => {
        setSelectedUsers(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const toggleSelectAll = () => {
        if (selectedUsers.length === filteredData.length) {
            setSelectedUsers([]);
        } else {
            setSelectedUsers(filteredData.map(item => item.user_id));
        }
    };

    const handleSendReminder = () => {
        if (selectedUsers.length === 0) {
            toast.error('Please select at least one user');
            return;
        }

        // Находим первый период для примера
        const period = {
            start: data[0]?.period_start || '',
            end: data[0]?.period_end || ''
        };

        // Используем кастомный диалог для настройки уведомления
        setNotificationSubject(`Time Sheet Reminder: ${period.start} to ${period.end}`);
        setNotificationMessage(`Dear Team Member,\n\nThis is a reminder to complete your time sheet for the period ${period.start} to ${period.end}.\n\nPlease ensure all hours are logged accurately.\n\nBest regards,\nManagement Team`);
        setIsNotificationDialogOpen(true);
    };

    const confirmSendNotification = () => {
        if (selectedUsers.length === 0) {
            toast.error('No users selected');
            return;
        }

        if (!notificationSubject.trim() || !notificationMessage.trim()) {
            toast.error('Please fill in subject and message');
            return;
        }

        // Отправляем уведомления
        onSendReminder(selectedUsers, {
            start: data[0]?.period_start || '',
            end: data[0]?.period_end || ''
        });

        // Имитируем отправку
        toast.success(`Reminders sent to ${selectedUsers.length} user(s)`);

        // Сбрасываем выбор
        setSelectedUsers([]);
        setIsNotificationDialogOpen(false);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'completed':
                return (
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Completed
                    </Badge>
                );
            case 'partial':
                return (
                    <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                        <Clock className="w-3 h-3 mr-1" />
                        Partial
                    </Badge>
                );
            case 'missing':
                return (
                    <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Missing
                    </Badge>
                );
            case 'overdue':
                return (
                    <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
                        <XCircle className="w-3 h-3 mr-1" />
                        Overdue
                    </Badge>
                );
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const getCompletionColor = (percentage: number) => {
        if (percentage >= 90) return 'text-green-600';
        if (percentage >= 70) return 'text-amber-600';
        return 'text-red-600';
    };

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                            placeholder="Search users..."
                            className="pl-8 w-64"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="gap-2">
                                <Filter className="w-4 h-4" />
                                Status: {statusFilter === 'all' ? 'All' : statusFilter}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => setStatusFilter('all')}>
                                All Statuses
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setStatusFilter('completed')}>
                                Completed
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setStatusFilter('partial')}>
                                Partial
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setStatusFilter('missing')}>
                                Missing
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setStatusFilter('overdue')}>
                                Overdue
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                <div className="flex items-center gap-2">
                    {selectedUsers.length > 0 && (
                        <Badge variant="secondary" className="mr-2">
                            {selectedUsers.length} selected
                        </Badge>
                    )}
                    <Button
                        variant="outline"
                        className="gap-2"
                        onClick={handleSendReminder}
                        disabled={selectedUsers.length === 0}
                    >
                        <Send className="w-4 h-4" />
                        Send Reminder
                    </Button>
                    <Button variant="outline" className="gap-2">
                        <Download className="w-4 h-4" />
                        Export
                    </Button>
                </div>
            </div>

            {/* Table */}
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-12">
                                <Checkbox
                                    checked={selectedUsers.length === filteredData.length && filteredData.length > 0}
                                    onCheckedChange={toggleSelectAll}
                                />
                            </TableHead>
                            <TableHead>User</TableHead>
                            <TableHead>Period</TableHead>
                            <TableHead>Hours</TableHead>
                            <TableHead>Completion</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Last Updated</TableHead>
                            <TableHead>Missing Days</TableHead>
                            <TableHead className="w-20">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredData.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                                    No users found matching your criteria
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredData.map((item) => (
                                <TableRow key={item.id} className="hover:bg-slate-50">
                                    <TableCell>
                                        <Checkbox
                                            checked={selectedUsers.includes(item.user_id)}
                                            onCheckedChange={() => toggleUserSelection(item.user_id)}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <div>
                                            <div className="font-medium">{item.user_name}</div>
                                            <div className="text-sm text-gray-500">{item.user_email}</div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1">
                                            <Calendar className="w-4 h-4 text-gray-400" />
                                            <span className="text-sm">
                                                {item.period_start} to {item.period_end}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-medium">
                                            {item.total_hours_logged} / {item.total_hours_required}h
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <div className="w-32 bg-gray-200 rounded-full h-2">
                                                <div
                                                    className={`h-2 rounded-full ${item.completion_percentage >= 90 ? 'bg-green-500' :
                                                            item.completion_percentage >= 70 ? 'bg-amber-500' :
                                                                'bg-red-500'
                                                        }`}
                                                    style={{ width: `${item.completion_percentage}%` }}
                                                />
                                            </div>
                                            <span className={`font-medium ${getCompletionColor(item.completion_percentage)}`}>
                                                {item.completion_percentage}%
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {getStatusBadge(item.status)}
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm text-gray-600">
                                            {new Date(item.last_updated).toLocaleString()}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {item.missing_days.length > 0 ? (
                                            <div className="flex flex-wrap gap-1 max-w-[200px]">
                                                {item.missing_days.slice(0, 3).map((day, index) => (
                                                    <Badge key={index} variant="outline" className="text-xs">
                                                        {day}
                                                    </Badge>
                                                ))}
                                                {item.missing_days.length > 3 && (
                                                    <Badge variant="outline" className="text-xs">
                                                        +{item.missing_days.length - 3} more
                                                    </Badge>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-sm text-gray-400">None</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => onViewDetails(item.user_id)}
                                                title="View Details"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => {
                                                    setSelectedUsers([item.user_id]);
                                                    handleSendReminder();
                                                }}
                                                title="Send Reminder"
                                            >
                                                <Mail className="w-4 h-4" />
                                            </Button>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreVertical className="w-4 h-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => onViewDetails(item.user_id)}>
                                                        View Time Sheet
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => {
                                                        setSelectedUsers([item.user_id]);
                                                        handleSendReminder();
                                                    }}>
                                                        Send Reminder
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem>Export Data</DropdownMenuItem>
                                                    <DropdownMenuItem className="text-red-600">
                                                        Mark as Reviewed
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Notification Dialog */}
            <Dialog open={isNotificationDialogOpen} onOpenChange={setIsNotificationDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Send Time Sheet Reminder</DialogTitle>
                        <DialogDescription>
                            Send email reminders to {selectedUsers.length} selected user(s)
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="subject">Email Subject *</Label>
                            <Input
                                id="subject"
                                value={notificationSubject}
                                onChange={(e) => setNotificationSubject(e.target.value)}
                                placeholder="Enter email subject"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="message">Email Message *</Label>
                            <Textarea
                                id="message"
                                value={notificationMessage}
                                onChange={(e) => setNotificationMessage(e.target.value)}
                                placeholder="Enter email message"
                                rows={6}
                                className="resize-y"
                            />
                            <p className="text-sm text-gray-500">
                                Available variables: {"{user_name}"}, {"{period_start}"}, {"{period_end}"}, {"{completion_percentage}"}
                            </p>
                        </div>
                        <div className="rounded-md bg-gray-50 p-4">
                            <h4 className="font-medium mb-2">Selected Users ({selectedUsers.length}):</h4>
                            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                                {data
                                    .filter(item => selectedUsers.includes(item.user_id))
                                    .map(item => (
                                        <Badge key={item.user_id} variant="secondary">
                                            {item.user_name} ({item.user_email})
                                        </Badge>
                                    ))
                                }
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsNotificationDialogOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={confirmSendNotification}
                            style={{ backgroundColor: '#1F4E78' }}
                            className="gap-2"
                        >
                            <Send className="w-4 h-4" />
                            Send Reminders
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}