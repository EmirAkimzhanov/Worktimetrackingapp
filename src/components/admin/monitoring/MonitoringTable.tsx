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
import { Search, MoreHorizontal, Mail, Eye, Calendar, AlertCircle } from 'lucide-react';
import { TimeSheetMonitoring } from '../../../types/types';
import { format } from 'date-fns';

interface MonitoringTableProps {
    data: TimeSheetMonitoring[];
    onSendReminder: (userIds: number[], period: { start: string; end: string }) => void;
    onViewDetails: (userId: number) => void;
}

export function MonitoringTable({ data, onSendReminder, onViewDetails }: MonitoringTableProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    // Определяем статус на основе процента завершения (только 3 статуса)
    const getStatus = (completion: number) => {
        if (completion >= 100) return 'completed';
        if (completion === 0) return 'missing';
        return 'partial';
    };

    // Получаем цвет статуса
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

    // Получаем текст статуса
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

    // Фильтрация данных
    const filteredData = useMemo(() => {
        return data.filter(item => {
            // Поиск по email
            const matchesSearch = item.user_email.toLowerCase().includes(searchTerm.toLowerCase());

            // Фильтр по статусу
            const status = getStatus(item.completion);
            const matchesStatus = statusFilter === 'all' || status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [data, searchTerm, statusFilter]);

    // Статистика (только 3 категории)
    const stats = useMemo(() => {
        const total = data.length;
        const completed = data.filter(item => item.completion >= 100).length;
        const partial = data.filter(item => item.completion > 0 && item.completion < 100).length;
        const missing = data.filter(item => item.completion === 0).length;

        return {
            total,
            completed,
            partial,
            missing
        };
    }, [data]);

    if (!data || data.length === 0) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                    <Calendar className="w-12 h-12 text-gray-400 mb-4" />
                    <p className="text-gray-500 text-lg">No monitoring data available</p>
                    <p className="text-gray-400 text-sm">Select country and date range to load data</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle>Time Sheet Monitoring</CardTitle>
                    <div className="flex items-center gap-2">
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
                <div className="flex items-center gap-4 mt-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                            placeholder="Search by email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <select
                        className="px-3 py-2 border rounded-md text-sm"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">All Status</option>
                        <option value="completed">Completed</option>
                        <option value="partial">Partial</option>
                        <option value="missing">Missing</option>
                    </select>
                </div>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead>Required Hours</TableHead>
                                <TableHead>Logged Hours</TableHead>
                                <TableHead>Completion</TableHead>
                                <TableHead>Missing Days</TableHead>
                                <TableHead>Last Updated</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="w-[100px]">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredData.map((item) => {
                                const status = getStatus(item.completion);
                                const statusColor = getStatusColor(status);
                                const statusText = getStatusText(status);

                                return (
                                    <TableRow key={item.user_id}>
                                        <TableCell>
                                            <div>
                                                <div className="font-medium">{item.user_email}</div>
                                                <div className="text-sm text-gray-500">
                                                    ID: {item.user_id}
                                                </div>
                                            </div>
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
                                            {format(new Date(item.last_updated), 'dd.MM.yyyy HH:mm')}
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
                                                    <DropdownMenuItem onClick={() => onViewDetails(item.user_id)}>
                                                        <Eye className="w-4 h-4 mr-2" />
                                                        View Details
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => onSendReminder(
                                                            [item.user_id],
                                                            { start: '', end: '' }
                                                        )}
                                                        disabled={item.completion >= 100}
                                                    >
                                                        <Mail className="w-4 h-4 mr-2" />
                                                        Send Reminder
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
            </CardContent>
        </Card>
    );
}