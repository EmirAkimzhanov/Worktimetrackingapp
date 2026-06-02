// components/admin/monitoring/MonitoringTable.tsx

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Badge } from '../../ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '../../ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '../../ui/dropdown-menu';
import { Search, MoreHorizontal, Mail, Eye, Calendar, AlertCircle, PenSquare, CheckSquare, Square, X, ChevronLeft, ChevronRight, Filter, User } from 'lucide-react';
import { TimeSheetMonitoring } from '../../../types/types';
import { format } from 'date-fns';
import { useSendLetter, useSendReminder } from '../../../hooks/useTimeEntry';
import { toast } from 'sonner';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '../../ui/alert-dialog';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '../../ui/dialog';
import { Label } from '../../ui/label';
import { Checkbox } from '../../ui/checkbox';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../../ui/select';

interface MonitoringTableProps {
    data: TimeSheetMonitoring[];
    totalCount?: number;
    currentPage?: number;
    pageSize?: number;
    onPageChange?: (page: number) => void;
    onPageSizeChange?: (pageSize: number) => void;
    onSendReminder: (userIds: number[], period: { start: string; end: string }) => void;
    onViewDetails: (userId: number) => void;
    periodStart?: string;
    periodEnd?: string;
    isLoading?: boolean;
    onFilterChange?: (filters: {
        user_email?: string;
        first_name?: string;
        last_name?: string;
        completion?: string;
        updated_after?: string;
        updated_before?: string;
    }) => void;
}

// Компонент для отображения детальной информации о пользователе
function UserDetailsDialog({
    user,
    periodStart,
    periodEnd,
    open,
    onOpenChange
}: {
    user: TimeSheetMonitoring | null;
    periodStart?: string;
    periodEnd?: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    if (!user) return null;

    const missingDaysList = user.missing_days || [];
    const submittedDaysList = user.submitted_days || [];
    const totalMissingHours = missingDaysList.reduce((sum, day) => sum + (day.missing_hours || 0), 0);

    const getStatusConfig = () => {
        if (user.completion >= 100) {
            return { label: 'Completed', color: 'text-green-600 bg-green-50', icon: CheckSquare };
        }
        if (user.completion === 0 || (missingDaysList.length > 0 && user.total_hours === 0)) {
            return { label: 'Missing', color: 'text-red-600 bg-red-50', icon: X };
        }
        return { label: 'Partial', color: 'text-yellow-600 bg-yellow-50', icon: AlertCircle };
    };

    const statusConfig = getStatusConfig();
    const StatusIcon = statusConfig.icon;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[90vw] md:max-w-[85vw] lg:max-w-[80vw] xl:max-w-[75vw] max-h-[40vh] overflow-y-auto">
                <DialogHeader className="pb-2">
                    <DialogTitle className="text-xl font-bold flex items-center justify-between">
                        <span>Time Sheet Details - {user.first_name} {user.last_name}</span>
                        <Badge className={`${statusConfig.color} border-0`}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {statusConfig.label}
                        </Badge>
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-3">
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 text-sm">
                        <div>
                            <label className="text-xs text-gray-500">User ID</label>
                            <p className="font-semibold">{user.user_id}</p>
                        </div>
                        <div>
                            <label className="text-xs text-gray-500">Name</label>
                            <p className="font-semibold">{user.first_name} {user.last_name}</p>
                        </div>
                        <div>
                            <label className="text-xs text-gray-500">Email</label>
                            <p className="font-semibold text-xs">{user.user_email}</p>
                        </div>
                        <div>
                            <label className="text-xs text-gray-500">Completion</label>
                            <div className="flex items-center gap-1">
                                <p className="font-semibold">{user.completion.toFixed(1)}%</p>
                                <div className="w-12 bg-gray-200 rounded-full h-1.5">
                                    <div
                                        className="h-1.5 rounded-full"
                                        style={{
                                            width: `${Math.min(user.completion, 100)}%`,
                                            backgroundColor: user.completion >= 100 ? '#10b981' : user.completion === 0 ? '#ef4444' : '#f59e0b'
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                        <div>
                            <label className="text-xs text-gray-500">Logged Hours</label>
                            <p className="font-semibold">{user.total_hours || 0}h</p>
                        </div>
                        <div>
                            <label className="text-xs text-gray-500">Required Hours</label>
                            <p className="font-semibold">{user.required_hours || 160}h</p>
                        </div>
                        {totalMissingHours > 0 && (
                            <div>
                                <label className="text-xs text-gray-500">Missing Hours</label>
                                <p className="font-semibold text-red-600">{totalMissingHours}h</p>
                            </div>
                        )}
                        <div>
                            <label className="text-xs text-gray-500">Last Updated</label>
                            <p className="font-semibold text-xs">
                                {user.last_updated ? format(new Date(user.last_updated), 'dd.MM.yyyy') : 'Never'}
                            </p>
                        </div>
                    </div>

                    {periodStart && periodEnd && (
                        <div className="flex items-center gap-4 text-xs text-gray-600 bg-gray-50 p-2 rounded-md">
                            <Calendar className="w-3 h-3" />
                            <span>Period: {format(new Date(periodStart), 'dd.MM.yyyy')} - {format(new Date(periodEnd), 'dd.MM.yyyy')}</span>
                            <span>•</span>
                            <span>Missing: {missingDaysList.length} days</span>
                            {submittedDaysList.length > 0 && (
                                <>
                                    <span>•</span>
                                    <span>Submitted: {submittedDaysList.length} days</span>
                                </>
                            )}
                        </div>
                    )}

                    {missingDaysList.length > 0 && (
                        <div className="border border-red-200 bg-red-50 rounded-md p-2">
                            <div className="flex items-center gap-2 mb-2">
                                <AlertCircle className="w-4 h-4 text-red-600" />
                                <h3 className="font-semibold text-red-900 text-sm">
                                    Missing Days ({missingDaysList.length} days)
                                </h3>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1 max-h-[120px] overflow-y-auto">
                                {missingDaysList.map((day, idx) => (
                                    <div key={idx} className="flex items-center justify-between text-xs p-1 bg-white rounded border border-red-100">
                                        <span className="font-mono text-red-800">
                                            {format(new Date(day.date), 'dd.MM')}
                                        </span>
                                        <span className="text-red-600 font-medium">
                                            -{day.missing_hours || 8}h
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {submittedDaysList.length > 0 && (
                        <div className="border border-green-200 bg-green-50 rounded-md p-2">
                            <div className="flex items-center gap-2 mb-2">
                                <CheckSquare className="w-4 h-4 text-green-600" />
                                <h3 className="font-semibold text-green-900 text-sm">
                                    Submitted Days ({submittedDaysList.length} days)
                                </h3>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1 max-h-[100px] overflow-y-auto">
                                {submittedDaysList.slice(0, 20).map((day, idx) => (
                                    <div key={idx} className="text-xs p-1 bg-white rounded border border-green-100">
                                        <span className="font-mono text-green-800">
                                            {typeof day === 'string'
                                                ? format(new Date(day), 'dd.MM')
                                                : format(new Date(day.date), 'dd.MM')}
                                        </span>
                                    </div>
                                ))}
                                {submittedDaysList.length > 20 && (
                                    <div className="text-xs p-1 text-gray-500">
                                        +{submittedDaysList.length - 20} more
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {user.completion > 0 && user.completion < 100 && (
                        <div className="bg-blue-50 border border-blue-200 rounded-md p-2">
                            <div className="flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-blue-600" />
                                <span className="text-xs text-blue-800">
                                    Progress: {submittedDaysList.length} of {missingDaysList.length + submittedDaysList.length} days completed
                                    {totalMissingHours > 0 && ` | ${totalMissingHours}h missing`}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="gap-2 pt-2">
                    <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export function MonitoringTable({
    data,
    totalCount = 0,
    currentPage = 1,
    pageSize = 30,
    onPageChange,
    onPageSizeChange,
    onSendReminder,
    onViewDetails,
    periodStart,
    periodEnd,
    isLoading = false,
    onFilterChange
}: MonitoringTableProps) {
    // Состояния для фильтров
    const [searchFirstName, setSearchFirstName] = useState('');
    const [searchLastName, setSearchLastName] = useState('');
    const [searchEmail, setSearchEmail] = useState('');
    const [completionFilter, setCompletionFilter] = useState<string>('all');
    const [updatedAfter, setUpdatedAfter] = useState('');
    const [updatedBefore, setUpdatedBefore] = useState('');

    const { mutate: sendReminder, isPending: isSending } = useSendReminder();
    const { mutate: sendLetter, isPending: isSendingLetter } = useSendLetter();

    const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());
    const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
    const [isSelectMode, setIsSelectMode] = useState(false);

    const [selectedUserForDetails, setSelectedUserForDetails] = useState<TimeSheetMonitoring | null>(null);
    const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

    const [selectedUser, setSelectedUser] = useState<{
        userId: number;
        email: string;
        startDate: string;
        endDate: string;
    } | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [letterDialogOpen, setLetterDialogOpen] = useState(false);
    const [letterData, setLetterData] = useState<{
        email: string;
        subject: string;
        body: string;
    }>({
        email: '',
        subject: '',
        body: ''
    });

    // Применение фильтров
    const applyFilters = () => {
        if (onFilterChange) {
            onFilterChange({
                first_name: searchFirstName || undefined,
                last_name: searchLastName || undefined,
                user_email: searchEmail || undefined,
                completion: completionFilter !== 'all' ? completionFilter : undefined,
                updated_after: updatedAfter || undefined,
                updated_before: updatedBefore || undefined,
            });
        }
    };

    // Сброс фильтров
    const resetFilters = () => {
        setSearchFirstName('');
        setSearchLastName('');
        setSearchEmail('');
        setCompletionFilter('all');
        setUpdatedAfter('');
        setUpdatedBefore('');

        if (onFilterChange) {
            onFilterChange({});
        }
    };

    // Автоматическое применение фильтров при изменении
    React.useEffect(() => {
        const timeoutId = setTimeout(() => {
            applyFilters();
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [searchFirstName, searchLastName, searchEmail, completionFilter, updatedAfter, updatedBefore]);

    const getStatus = (completion: number) => {
        if (completion >= 100) return 'completed';
        if (completion === 0) return 'missing';
        return 'partial';
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'partial':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'missing':
                return 'bg-red-100 text-red-800 border-red-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'completed':
                return 'Completed';
            case 'partial':
                return 'Partial';
            case 'missing':
                return 'Missing';
            default:
                return 'Unknown';
        }
    };

    const formatDateForReminder = (date: string) => {
        if (!date) return '';
        return format(new Date(date), 'yyyy-MM-dd');
    };

    const getIncompleteUsers = useMemo(() => {
        return data.filter(item => item.completion < 100);
    }, [data]);

    // Фильтрация данных на клиенте (поиск по имени, фамилии, email)
    const filteredData = useMemo(() => {
        let result = data;

        if (searchFirstName) {
            result = result.filter(item =>
                (item.first_name || '').toLowerCase().includes(searchFirstName.toLowerCase())
            );
        }

        if (searchLastName) {
            result = result.filter(item =>
                (item.last_name || '').toLowerCase().includes(searchLastName.toLowerCase())
            );
        }

        if (searchEmail) {
            result = result.filter(item =>
                item.user_email.toLowerCase().includes(searchEmail.toLowerCase())
            );
        }

        return result;
    }, [data, searchFirstName, searchLastName, searchEmail]);

    const toggleEmailSelection = (email: string) => {
        const newSelection = new Set(selectedEmails);
        if (newSelection.has(email)) {
            newSelection.delete(email);
        } else {
            newSelection.add(email);
        }
        setSelectedEmails(newSelection);
    };

    const selectAllIncomplete = () => {
        const allIncompleteEmails = getIncompleteUsers.map(user => user.user_email);
        setSelectedEmails(new Set(allIncompleteEmails));
    };

    const clearSelection = () => {
        setSelectedEmails(new Set());
    };

    const handleBulkSendReminder = () => {
        if (!periodStart || !periodEnd) {
            toast.error('Period dates are not available');
            return;
        }

        if (selectedEmails.size === 0) {
            toast.error('Please select at least one user');
            return;
        }

        setBulkDialogOpen(true);
    };

    const confirmBulkSendReminder = () => {
        const emailsArray = Array.from(selectedEmails);

        sendReminder({
            emails: emailsArray,
            start_date: formatDateForReminder(periodStart!),
            end_date: formatDateForReminder(periodEnd!)
        }, {
            onSuccess: (response) => {
                toast.success(`Reminders sent successfully to ${emailsArray.length} user(s)`);
                console.log('Bulk reminders sent:', response);

                const selectedUserIds = data
                    .filter(item => selectedEmails.has(item.user_email))
                    .map(item => item.user_id);

                onSendReminder(
                    selectedUserIds,
                    { start: periodStart!, end: periodEnd! }
                );

                setBulkDialogOpen(false);
                setSelectedEmails(new Set());
                setIsSelectMode(false);
            },
            onError: (error) => {
                toast.error(`Failed to send reminders: ${error.message}`);
                console.error('Error sending bulk reminders:', error);
                setBulkDialogOpen(false);
            }
        });
    };

    const handleSendReminder = (userId: number, email: string) => {
        if (!periodStart || !periodEnd) {
            toast.error('Period dates are not available');
            return;
        }

        setSelectedUser({
            userId,
            email,
            startDate: periodStart,
            endDate: periodEnd
        });
        setDialogOpen(true);
    };

    const confirmSendReminder = () => {
        if (selectedUser) {
            sendReminder({
                emails: [selectedUser.email],
                start_date: formatDateForReminder(selectedUser.startDate),
                end_date: formatDateForReminder(selectedUser.endDate)
            }, {
                onSuccess: (response) => {
                    toast.success(`Reminder sent successfully to ${selectedUser.email}`);
                    console.log('Reminder sent:', response);

                    // onSendReminder(
                    //     [selectedUser.userId],
                    //     { start: selectedUser.startDate, end: selectedUser.endDate }
                    // );

                    setDialogOpen(false);
                    setSelectedUser(null);
                },
                onError: (error) => {
                    toast.error(`Failed to send reminder: ${error.message}`);
                    console.error('Error sending reminder:', error);
                    setDialogOpen(false);
                    setSelectedUser(null);
                }
            });
        }
    };

    const handleViewDetails = (user: TimeSheetMonitoring) => {
        setSelectedUserForDetails(user);
        setDetailsDialogOpen(true);
        onViewDetails(user.user_id);
    };

    const handleSendLetter = (email: string) => {
        const defaultTemplate = `Dear Team Member,

I hope this message finds you well.

Best regards,
Administration`;

        setLetterData({
            email: email,
            subject: 'Important Notification',
            body: defaultTemplate
        });
        setLetterDialogOpen(true);
    };

    const handleSubmitLetter = () => {
        if (!letterData.subject.trim()) {
            toast.error('Please enter a subject');
            return;
        }
        if (!letterData.body.trim()) {
            toast.error('Please enter the letter content');
            return;
        }

        sendLetter(letterData, {
            onSuccess: (response) => {
                toast.success(`Letter sent successfully to ${letterData.email}`);
                console.log('Letter sent:', response);
                setLetterDialogOpen(false);
                setLetterData({
                    email: '',
                    subject: '',
                    body: ''
                });
            },
            onError: (error) => {
                toast.error(`Failed to send letter: ${error.message}`);
                console.error('Error sending letter:', error);
            }
        });
    };

    // Статистика
    const stats = useMemo(() => {
        const total = data.length;
        const completed = data.filter(item => item.completion >= 100).length;
        const partial = data.filter(item => item.completion > 0 && item.completion < 100).length;
        const missing = data.filter(item => item.completion === 0).length;
        return { total, completed, partial, missing };
    }, [data]);

    const totalPages = Math.ceil(totalCount / pageSize);

    const renderPageNumbers = () => {
        const pages = [];
        const maxVisiblePages = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        if (startPage > 1) {
            pages.push(
                <Button
                    key="1"
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange?.(1)}
                    disabled={isLoading}
                    className="min-w-[32px] h-8 hidden sm:inline-flex"
                >
                    1
                </Button>
            );
            if (startPage > 2) {
                pages.push(
                    <span key="ellipsis1" className="px-1 text-muted-foreground hidden sm:inline">
                        ...
                    </span>
                );
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            pages.push(
                <Button
                    key={i}
                    variant={currentPage === i ? "default" : "outline"}
                    size="sm"
                    onClick={() => onPageChange?.(i)}
                    disabled={isLoading}
                    className="min-w-[32px] h-8"
                >
                    {i}
                </Button>
            );
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                pages.push(
                    <span key="ellipsis2" className="px-1 text-muted-foreground hidden sm:inline">
                        ...
                    </span>
                );
            }
            pages.push(
                <Button
                    key={totalPages}
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange?.(totalPages)}
                    disabled={isLoading}
                    className="min-w-[32px] h-8 hidden sm:inline-flex"
                >
                    {totalPages}
                </Button>
            );
        }

        return pages;
    };

    // Всегда показываем карточку с фильтрами, даже если нет данных
    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <CardTitle>Time Sheet Monitoring</CardTitle>
                        <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className="bg-green-50">
                                Completed: {stats.completed}
                            </Badge>
                            <Badge variant="outline" className="bg-yellow-50">
                                Partial: {stats.partial}
                            </Badge>
                            <Badge variant="outline" className="bg-red-50">
                                Missing: {stats.missing}
                            </Badge>
                        </div>
                    </div>

                    {/* Фильтры - всегда показываем */}
                    <div className="flex flex-wrap gap-2 items-center mt-4">
                        {/* Поиск по First Name */}
                        <div className="relative w-[150px]">
                            {/* <User className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" /> */}
                            <Input
                                placeholder="First name..."
                                value={searchFirstName}
                                onChange={(e) => setSearchFirstName(e.target.value)}
                                className="pl-8 h-8 text-sm"
                            />
                        </div>

                        {/* Поиск по Last Name */}
                        <div className="relative w-[150px]">
                            {/* <User className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" /> */}
                            <Input
                                placeholder="Last name..."
                                value={searchLastName}
                                onChange={(e) => setSearchLastName(e.target.value)}
                                className="pl-8 h-8 text-sm"
                            />
                        </div>

                        {/* Поиск по email */}
                        <div className="relative w-[180px]">
                            {/* <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" /> */}
                            <Input
                                placeholder="Email..."
                                value={searchEmail}
                                onChange={(e) => setSearchEmail(e.target.value)}
                                className="pl-8 h-8 text-sm"
                            />
                        </div>

                        {/* Фильтр по статусу */}
                        <Select value={completionFilter} onValueChange={setCompletionFilter}>
                            <SelectTrigger className="w-[110px] h-8 text-sm">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                                <SelectItem value="partial">Partial</SelectItem>
                                <SelectItem value="missing">Missing</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Дата обновления после */}
                        <div className="flex items-center gap-1">
                            <span className="text-xs text-gray-500 whitespace-nowrap">After:</span>
                            <Input
                                type="date"
                                value={updatedAfter}
                                onChange={(e) => setUpdatedAfter(e.target.value)}
                                className="w-[120px] h-8 text-sm"
                            />
                        </div>

                        {/* Дата обновления до */}
                        <div className="flex items-center gap-1">
                            <span className="text-xs text-gray-500 whitespace-nowrap">Before:</span>
                            <Input
                                type="date"
                                value={updatedBefore}
                                onChange={(e) => setUpdatedBefore(e.target.value)}
                                className="w-[120px] h-8 text-sm"
                            />
                        </div>

                        {/* Кнопка сброса */}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={resetFilters}
                            className="h-8 px-2 text-sm"
                        >
                            <X className="w-3.5 h-3.5 mr-1" />
                            Reset
                        </Button>

                        {/* Разделитель */}
                        <div className="w-px h-6 bg-gray-300 mx-1" />

                        {/* Кнопки выбора и действий */}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsSelectMode(!isSelectMode)}
                            className="h-8 text-sm"
                        >
                            <Filter className="w-3.5 h-3.5 mr-1" />
                            {isSelectMode ? 'Cancel' : 'Select'}
                        </Button>

                        {isSelectMode && (
                            <>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={selectAllIncomplete}
                                    className="h-8 text-sm"
                                >
                                    All Incomplete
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={clearSelection}
                                    className="h-8 text-sm"
                                >
                                    Clear
                                </Button>
                                <Button
                                    onClick={handleBulkSendReminder}
                                    disabled={selectedEmails.size === 0 || isSending}
                                    className="bg-black hover:bg-gray-800 text-white h-8 text-sm px-3"
                                    style={{ backgroundColor: "black" }}
                                    size="sm"
                                >
                                    <Mail className="w-3.5 h-3.5 mr-1" />
                                    Send ({selectedEmails.size})
                                </Button>
                            </>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading && data.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-4"></div>
                            <p className="text-gray-500">Loading monitoring data...</p>
                        </div>
                    ) : !data || data.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <Calendar className="w-12 h-12 text-gray-400 mb-4" />
                            <p className="text-gray-500 text-lg">No monitoring data available</p>
                            <p className="text-gray-400 text-sm">Try adjusting your filters or date range</p>
                        </div>
                    ) : (
                        <>
                            <div className="rounded-md border overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            {isSelectMode && (
                                                <TableHead className="w-[50px]">Select</TableHead>
                                            )}
                                            <TableHead>First Name</TableHead>
                                            <TableHead>Last Name</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Required Hours</TableHead>
                                            <TableHead>Logged Hours</TableHead>
                                            <TableHead>Completion</TableHead>
                                            <TableHead>Missing Days</TableHead>
                                            <TableHead>Last Updated</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="w-[130px]">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredData.map((item) => {
                                            const status = getStatus(item.completion);
                                            const statusColor = getStatusColor(status);
                                            const statusText = getStatusText(status);
                                            const isIncomplete = item.completion < 100;

                                            return (
                                                <TableRow key={item.user_id}>
                                                    {isSelectMode && (
                                                        <TableCell>
                                                            <Checkbox
                                                                checked={selectedEmails.has(item.user_email)}
                                                                onCheckedChange={() => toggleEmailSelection(item.user_email)}
                                                                disabled={!isIncomplete}
                                                                className={!isIncomplete ? 'opacity-50' : ''}
                                                            />
                                                        </TableCell>
                                                    )}
                                                    <TableCell className="font-medium">
                                                        {item.first_name || '-'}
                                                    </TableCell>
                                                    <TableCell className="font-medium">
                                                        {item.last_name || '-'}
                                                    </TableCell>
                                                    <TableCell className="text-sm">
                                                        {item.user_email}
                                                    </TableCell>
                                                    <TableCell>{item.required_hours}h</TableCell>
                                                    <TableCell>{item.total_hours}h</TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-16 bg-gray-200 rounded-full h-2">
                                                                <div
                                                                    className="bg-blue-600 h-2 rounded-full"
                                                                    style={{ width: `${Math.min(item.completion, 100)}%` }}
                                                                />
                                                            </div>
                                                            <span className="text-sm">{item.completion.toFixed(1)}%</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        {item.missing_days_count > 0 ? (
                                                            <div className="flex items-center gap-1">
                                                                <AlertCircle className="w-4 h-4 text-red-500" />
                                                                <span className="text-sm font-medium text-red-600">
                                                                    {item.missing_days_count} days
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-sm text-green-600">None</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        {item.last_updated ? format(new Date(item.last_updated), 'dd.MM.yyyy HH:mm') : '-'}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge className={statusColor}>
                                                            {statusText}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="icon">
                                                                    <MoreHorizontal className="w-4 h-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuItem onClick={() => handleViewDetails(item)}>
                                                                    <Eye className="w-4 h-4 mr-2" />
                                                                    View Details
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    onClick={() => handleSendReminder(item.user_id, item.user_email)}
                                                                    disabled={item.completion >= 100 || isSending}
                                                                >
                                                                    <Mail className="w-4 h-4 mr-2" />
                                                                    Send Reminder
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    onClick={() => handleSendLetter(item.user_email)}
                                                                    disabled={isSendingLetter}
                                                                >
                                                                    <PenSquare className="w-4 h-4 mr-2" />
                                                                    Send Letter
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Пагинация */}
                            {totalPages > 1 && (
                                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-4">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-muted-foreground">
                                            Rows per page:
                                        </span>
                                        <Select
                                            value={pageSize.toString()}
                                            onValueChange={(value) => onPageSizeChange?.(parseInt(value))}
                                            disabled={isLoading}
                                        >
                                            <SelectTrigger className="w-[70px] h-8">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="10">10</SelectItem>
                                                <SelectItem value="25">25</SelectItem>
                                                <SelectItem value="50">50</SelectItem>
                                                <SelectItem value="100">100</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="text-sm text-muted-foreground">
                                        Showing {filteredData.length} of {totalCount} records
                                    </div>

                                    <div className="flex items-center gap-2 flex-wrap justify-center">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => onPageChange?.(Math.max(currentPage - 1, 1))}
                                            disabled={currentPage === 1 || isLoading}
                                            className="h-8"
                                        >
                                            <ChevronLeft className="w-4 h-4 mr-1" />
                                            Previous
                                        </Button>

                                        <div className="hidden md:flex gap-1">
                                            {renderPageNumbers()}
                                        </div>

                                        <div className="flex md:hidden items-center gap-2">
                                            <Select
                                                value={currentPage.toString()}
                                                onValueChange={(value) => onPageChange?.(parseInt(value))}
                                                disabled={isLoading}
                                            >
                                                <SelectTrigger className="w-[100px] h-8">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                                        <SelectItem key={page} value={page.toString()}>
                                                            Page {page} of {totalPages}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="hidden sm:flex md:hidden items-center gap-2 text-sm">
                                            <span className="font-medium">{currentPage}</span>
                                            <span className="text-muted-foreground">of {totalPages}</span>
                                        </div>

                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => onPageChange?.(Math.min(currentPage + 1, totalPages))}
                                            disabled={currentPage === totalPages || isLoading}
                                            className="h-8"
                                        >
                                            Next
                                            <ChevronRight className="w-4 h-4 ml-1" />
                                        </Button>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                                            Go to page:
                                        </span>
                                        <input
                                            type="number"
                                            min={1}
                                            max={totalPages}
                                            value={currentPage}
                                            onChange={(e) => {
                                                const page = parseInt(e.target.value);
                                                if (!isNaN(page) && page >= 1 && page <= totalPages) {
                                                    onPageChange?.(page);
                                                }
                                            }}
                                            className="w-16 h-8 px-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            disabled={isLoading}
                                        />
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>

            <UserDetailsDialog
                user={selectedUserForDetails}
                periodStart={periodStart}
                periodEnd={periodEnd}
                open={detailsDialogOpen}
                onOpenChange={setDetailsDialogOpen}
            />

            <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Send Reminder?</AlertDialogTitle>
                        <AlertDialogDescription>
                            {selectedUser && (
                                <>
                                    You are about to send a time sheet reminder to:
                                    <div className="mt-3 p-3 bg-blue-50 rounded-md">
                                        <p className="font-medium text-gray-900">{selectedUser.email}</p>
                                    </div>
                                    <div className="mt-3 space-y-1">
                                        <p className="text-sm">
                                            <span className="font-medium">Period:</span>{' '}
                                            {formatDateForReminder(selectedUser.startDate)} - {formatDateForReminder(selectedUser.endDate)}
                                        </p>
                                        <p className="text-sm text-amber-600 mt-2">
                                            This action cannot be undone. The user will receive an email reminder.
                                        </p>
                                    </div>
                                </>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmSendReminder}
                            className="bg-black hover:bg-gray-800 text-white focus:ring-black"
                            style={{ backgroundColor: "black" }}
                        >
                            Send Reminder
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Send Bulk Reminders?</AlertDialogTitle>
                        <AlertDialogDescription>
                            You are about to send time sheet reminders to:
                            <div className="mt-3 p-3 bg-blue-50 rounded-md max-h-[200px] overflow-y-auto">
                                {Array.from(selectedEmails).map((email, index) => (
                                    <p key={index} className="font-medium text-gray-900 text-sm py-1">
                                        {email}
                                    </p>
                                ))}
                            </div>
                            <div className="mt-3 space-y-1">
                                <p className="text-sm">
                                    <span className="font-medium">Total recipients:</span> {selectedEmails.size} user(s)
                                </p>
                                <p className="text-sm">
                                    <span className="font-medium">Period:</span>{' '}
                                    {formatDateForReminder(periodStart!)} - {formatDateForReminder(periodEnd!)}
                                </p>
                                <p className="text-sm text-amber-600 mt-2">
                                    This action cannot be undone. All selected users will receive an email reminder.
                                </p>
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmBulkSendReminder}
                            className="bg-black hover:bg-gray-800 text-white focus:ring-black"
                            style={{ backgroundColor: "black" }}
                        >
                            Send to {selectedEmails.size} User(s)
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Dialog open={letterDialogOpen} onOpenChange={setLetterDialogOpen}>
                <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold">Compose Email</DialogTitle>
                        <DialogDescription className="text-sm">
                            Write and send an email to the user.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-3">
                        <div className="grid gap-1.5">
                            <Label htmlFor="email" className="text-xs font-semibold">
                                Recipient <span className="text-red-500">*</span>
                            </Label>
                            <div className="p-2 bg-gray-50 rounded-md border border-gray-200">
                                <p className="text-gray-700 font-mono text-sm">{letterData.email}</p>
                            </div>
                        </div>

                        <div className="grid gap-1.5">
                            <Label htmlFor="subject" className="text-xs font-semibold">
                                Subject <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="subject"
                                placeholder="Enter email subject..."
                                value={letterData.subject}
                                onChange={(e) => setLetterData({ ...letterData, subject: e.target.value })}
                                className="border-gray-300 focus:border-black focus:ring-black text-sm py-1.5 h-9"
                            />
                        </div>

                        <div className="grid gap-1.5">
                            <Label htmlFor="body" className="text-xs font-semibold">
                                Email Content <span className="text-red-500">*</span>
                            </Label>

                            <div className="flex gap-1 mb-1 p-1.5 bg-gray-50 rounded-md border border-gray-200">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        const textarea = document.getElementById('body') as HTMLTextAreaElement;
                                        if (textarea) {
                                            const start = textarea.selectionStart;
                                            const end = textarea.selectionEnd;
                                            const selectedText = letterData.body.substring(start, end);

                                            if (selectedText) {
                                                const newText = letterData.body.substring(0, start) +
                                                    '**' + selectedText + '**' +
                                                    letterData.body.substring(end);
                                                setLetterData({ ...letterData, body: newText });

                                                setTimeout(() => {
                                                    textarea.focus();
                                                    textarea.setSelectionRange(start + 2, end + 2);
                                                }, 0);
                                            } else {
                                                const newText = letterData.body.substring(0, start) +
                                                    '****' +
                                                    letterData.body.substring(start);
                                                setLetterData({ ...letterData, body: newText });

                                                setTimeout(() => {
                                                    textarea.focus();
                                                    textarea.setSelectionRange(start + 2, start + 2);
                                                }, 0);
                                            }
                                        }
                                    }}
                                    className="text-xs h-7 px-2 font-bold"
                                >
                                    <strong>B</strong>
                                </Button>

                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        const textarea = document.getElementById('body') as HTMLTextAreaElement;
                                        if (textarea) {
                                            const start = textarea.selectionStart;
                                            const end = textarea.selectionEnd;
                                            const selectedText = letterData.body.substring(start, end);

                                            if (selectedText) {
                                                const newText = letterData.body.substring(0, start) +
                                                    '*' + selectedText + '*' +
                                                    letterData.body.substring(end);
                                                setLetterData({ ...letterData, body: newText });

                                                setTimeout(() => {
                                                    textarea.focus();
                                                    textarea.setSelectionRange(start + 1, end + 1);
                                                }, 0);
                                            } else {
                                                const newText = letterData.body.substring(0, start) +
                                                    '**' +
                                                    letterData.body.substring(start);
                                                setLetterData({ ...letterData, body: newText });

                                                setTimeout(() => {
                                                    textarea.focus();
                                                    textarea.setSelectionRange(start + 1, start + 1);
                                                }, 0);
                                            }
                                        }
                                    }}
                                    className="text-xs h-7 px-2 italic"
                                >
                                    <em>I</em>
                                </Button>

                                <div className="w-px h-5 bg-gray-300 mx-1"></div>

                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        const textarea = document.getElementById('body') as HTMLTextAreaElement;
                                        if (textarea) {
                                            const start = textarea.selectionStart;
                                            const signature = '\n\nBest regards,\nAdministration';
                                            const newText = letterData.body.substring(0, start) +
                                                signature +
                                                letterData.body.substring(start);
                                            setLetterData({ ...letterData, body: newText });

                                            setTimeout(() => {
                                                textarea.focus();
                                                textarea.setSelectionRange(start + signature.length, start + signature.length);
                                            }, 0);
                                        }
                                    }}
                                    className="text-xs h-7 px-2"
                                >
                                    Signature
                                </Button>
                            </div>

                            <textarea
                                id="body"
                                value={letterData.body}
                                onChange={(e) => setLetterData({ ...letterData, body: e.target.value })}
                                placeholder="Write your email content here... Use **bold** or *italic* formatting."
                                rows={10}
                                className="w-full px-3 py-2 text-sm font-mono border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent resize-y"
                                style={{ minHeight: '200px', lineHeight: '1.5' }}
                            />

                            <div className="text-xs text-gray-500 mt-1">
                                <span>💡 Tip: Use **text** for bold, *text* for italic, or select text and use the buttons above</span>
                            </div>

                            <div className="flex justify-between items-center text-xs text-gray-500 mt-1">
                                <div className="flex gap-3">
                                    <span>Chars: {letterData.body.length}</span>
                                    <span>Words: {letterData.body.trim().split(/\s+/).filter(w => w.length > 0).length}</span>
                                </div>
                                <div className="flex gap-1">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            if (window.confirm('Clear all content?')) {
                                                setLetterData({ ...letterData, body: '' });
                                            }
                                        }}
                                        className="text-xs h-6 px-2 text-red-600 hover:text-red-700"
                                    >
                                        Clear
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            navigator.clipboard.writeText(letterData.body);
                                            toast.success('Copied to clipboard');
                                        }}
                                        className="text-xs h-6 px-2"
                                    >
                                        Copy
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {letterData.body && (
                            <div className="grid gap-1.5">
                                <Label className="text-xs font-semibold">Preview</Label>
                                <div className="p-3 bg-gray-50 rounded-md border border-gray-200 max-h-[120px] overflow-y-auto">
                                    <div className="whitespace-pre-wrap text-sm">
                                        {letterData.body.split('\n').map((line, i) => {
                                            const formatted = line
                                                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                                .replace(/\*(.*?)\*/g, '<em>$1</em>');
                                            return (
                                                <p key={i}
                                                    dangerouslySetInnerHTML={{ __html: formatted || '\u00A0' }}
                                                    style={{ margin: 0 }}
                                                />
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="gap-2 mt-2">
                        <Button
                            variant="outline"
                            onClick={() => setLetterDialogOpen(false)}
                            className="px-4 h-8 text-sm"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmitLetter}
                            disabled={isSendingLetter || !letterData.subject.trim() || !letterData.body.trim()}
                            className="bg-black hover:bg-gray-800 text-white focus:ring-black px-4 h-8 text-sm"
                            style={{ backgroundColor: "black" }}
                        >
                            {isSendingLetter ? (
                                <>
                                    <span className="mr-1">⏳</span>
                                    Sending...
                                </>
                            ) : (
                                <>
                                    ✉️ Send
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}