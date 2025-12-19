import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Edit, Trash2, Plus, Building, Copy, ChevronDown, Check, Hash, Building2, Globe } from 'lucide-react';
import { Client } from '../../types/types';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { toast } from 'sonner@2.0.3';

// Список секторов/отраслей для получения лейблов
const SECTOR_OPTIONS = [
    { value: 'technology', label: 'Technology & IT' },
    { value: 'finance', label: 'Finance & Banking' },
    { value: 'healthcare', label: 'Healthcare' },
    { value: 'manufacturing', label: 'Manufacturing' },
    { value: 'retail', label: 'Retail & E-commerce' },
    { value: 'telecommunications', label: 'Telecommunications' },
    { value: 'energy', label: 'Energy & Utilities' },
    { value: 'transportation', label: 'Transportation & Logistics' },
    { value: 'real_estate', label: 'Real Estate' },
    { value: 'education', label: 'Education' },
    { value: 'hospitality', label: 'Hospitality & Tourism' },
    { value: 'media', label: 'Media & Entertainment' },
    { value: 'agriculture', label: 'Agriculture' },
    { value: 'construction', label: 'Construction' },
    { value: 'consulting', label: 'Consulting' },
    { value: 'legal', label: 'Legal Services' },
    { value: 'pharmaceutical', label: 'Pharmaceutical' },
    { value: 'automotive', label: 'Automotive' },
    { value: 'aerospace', label: 'Aerospace & Defense' },
    { value: 'other', label: 'Other' },
];

interface ClientsTableProps {
    clients: Client[];
    onEdit: (client: Client) => void;
    onDelete: (id: number) => void;
    onAdd: () => void;
}

export function ClientsTable({ clients, onEdit, onDelete, onAdd }: ClientsTableProps) {
    const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

    console.log(clients);

    const copyToClipboard = async (email: string) => {
        try {
            await navigator.clipboard.writeText(email);
            setCopiedEmail(email);
            toast.success(`Copied: ${email}`);

            // Сброс состояния через 2 секунды
            setTimeout(() => {
                setCopiedEmail(null);
            }, 2000);
        } catch (err) {
            toast.error('Failed to copy email');
        }
    };

    // Функция для получения лейбла сектора по значению
    const getSectorLabel = (sectorValue: string): string => {
        if (!sectorValue) return 'Not specified';
        const sector = SECTOR_OPTIONS.find(s => s.value === sectorValue);
        return sector ? sector.label : sectorValue;
    };

    // Функция для разделения email строки на массив
    const getEmailsArray = (emailString: string): string[] => {
        if (!emailString) return [];

        // Разделяем по запятой и очищаем от пробелов
        return emailString
            .split(',')
            .map(email => email.trim())
            .filter(email => email.length > 0);
    };

    // Получаем первый email для отображения в основном поле
    const getFirstEmail = (emailString: string): string => {
        const emails = getEmailsArray(emailString);
        return emails.length > 0 ? emails[0] : 'No email';
    };

    // Получаем количество email
    const getEmailCount = (emailString: string): number => {
        return getEmailsArray(emailString).length;
    };

    // Функция для копирования personal number
    const copyPersonalNumber = async (personalNumber: string) => {
        if (!personalNumber) return;
        try {
            await navigator.clipboard.writeText(personalNumber);
            toast.success(`Copied personal number: ${personalNumber}`);
        } catch (err) {
            toast.error('Failed to copy personal number');
        }
    };

    return (
        <div className="space-y-4">
            {/* Заголовок с кнопкой Add */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Clients</h2>
                    <p className="text-muted-foreground">Manage all clients in the organization</p>
                </div>
                <Button onClick={onAdd} size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Client
                </Button>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Client</TableHead>
                            <TableHead>Company</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Country</TableHead>
                            <TableHead>Personal Number</TableHead>
                            <TableHead>Sector</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="w-24">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {clients.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={10} className="text-center text-slate-500 py-8">
                                    <div className="flex flex-col items-center justify-center gap-2">
                                        <Building className="w-12 h-12 text-slate-300" />
                                        <p className="text-lg font-medium">No clients found</p>
                                        <p className="text-sm text-slate-500">
                                            Click "Add Client" to create your first client
                                        </p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            clients.map(client => {
                                const emails = getEmailsArray(client.email);
                                const firstEmail = getFirstEmail(client.email);
                                const emailCount = getEmailCount(client.email);
                                const sectorLabel = getSectorLabel(client.sector);

                                return (
                                    <TableRow key={client.id} className="hover:bg-slate-50">
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                <Building className="w-4 h-4 text-slate-500" />
                                                <div>
                                                    <div>{client.name}</div>
                                                    {client.personal_number && (
                                                        <div className="text-xs text-gray-500">
                                                            ID: {client.personal_number}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-medium">{client.company}</div>
                                        </TableCell>
                                        <TableCell>
                                            {emailCount > 0 ? (
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            className="h-auto p-0 hover:bg-transparent justify-start text-left"
                                                        >
                                                            <div className="flex items-center gap-1 group">
                                                                <span className="text-blue-600 hover:text-blue-800 truncate max-w-[200px]">
                                                                    {firstEmail}
                                                                </span>
                                                                {emailCount > 1 && (
                                                                    <>
                                                                        <Badge
                                                                            variant="secondary"
                                                                            className="ml-2 text-xs h-5 px-1.5 flex-shrink-0"
                                                                        >
                                                                            +{emailCount - 1}
                                                                        </Badge>
                                                                        <ChevronDown className="w-3 h-3 text-gray-400 group-hover:text-gray-600 ml-1 flex-shrink-0" />
                                                                    </>
                                                                )}
                                                            </div>
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="start" className="w-64">
                                                        <div className="px-2 py-1.5 text-xs text-gray-500 border-b">
                                                            {emailCount} email{emailCount !== 1 ? 's' : ''}
                                                        </div>
                                                        {emails.map((email, index) => (
                                                            <DropdownMenuItem
                                                                key={index}
                                                                className="flex items-center justify-between gap-2 cursor-default"
                                                                onSelect={(e) => e.preventDefault()}
                                                            >
                                                                <div className="flex-1 min-w-0">
                                                                    <span className="truncate block">{email}</span>
                                                                </div>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-6 w-6 ml-2 flex-shrink-0"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        copyToClipboard(email);
                                                                    }}
                                                                >
                                                                    {copiedEmail === email ? (
                                                                        <Check className="w-3 h-3 text-green-600" />
                                                                    ) : (
                                                                        <Copy className="w-3 h-3 text-gray-500 hover:text-gray-700" />
                                                                    )}
                                                                </Button>
                                                            </DropdownMenuItem>
                                                        ))}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            ) : (
                                                <span className="text-gray-400 italic">No email</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <span className={client.phone ? '' : 'text-gray-400 italic'}>
                                                    {client.phone || '-'}
                                                </span>
                                                {client.phone && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6"
                                                        onClick={() => copyToClipboard(client.phone)}
                                                    >
                                                        <Copy className="w-3 h-3 text-gray-400 hover:text-gray-600" />
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {client.country ? (
                                                <Badge variant="outline" className="text-xs">
                                                    <div className="flex items-center gap-1">
                                                        <Globe className="w-3 h-3" />
                                                        {client.country}
                                                    </div>
                                                </Badge>
                                            ) : (
                                                <span className="text-gray-400 text-sm">Not specified</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                {client.personal_number ? (
                                                    <>
                                                        <div className="flex items-center gap-1">
                                                            <Hash className="w-3 h-3 text-gray-400" />
                                                            <span className="font-mono text-sm">{client.personal_number}</span>
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-6 w-6"
                                                            onClick={() => copyPersonalNumber(client.personal_number)}
                                                        >
                                                            <Copy className="w-3 h-3 text-gray-400 hover:text-gray-600" />
                                                        </Button>
                                                    </>
                                                ) : (
                                                    <span className="text-gray-400 italic text-sm">Not set</span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {client.sector ? (
                                                <Badge variant="secondary" className="text-xs">
                                                    <div className="flex items-center gap-1">
                                                        <Building2 className="w-3 h-3" />
                                                        <span className="truncate max-w-[150px]">{sectorLabel}</span>
                                                    </div>
                                                </Badge>
                                            ) : (
                                                <span className="text-gray-400 italic text-sm">Not specified</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm text-gray-600">
                                                {new Date(client.created_at).toLocaleDateString()}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={client.is_active ? 'default' : 'outline'}
                                                className={`${client.is_active ? 'bg-green-100 text-green-800 hover:bg-green-100' : 'bg-gray-100 text-gray-800 hover:bg-gray-100'}`}
                                            >
                                                {client.is_active ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => onEdit(client)}
                                                    title="Edit client"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => onDelete(client.id)}
                                                    title="Delete client"
                                                >
                                                    <Trash2 className="w-4 h-4 text-red-500" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}