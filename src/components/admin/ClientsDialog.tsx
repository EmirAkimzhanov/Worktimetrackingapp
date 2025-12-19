import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '../ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { ClientFormData } from '../../types/types';
import { AlertCircle, Info, Hash, Building2 } from 'lucide-react';

interface ClientDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editingClient: any;
    clientForm: ClientFormData;
    setClientForm: (form: ClientFormData) => void;
    countries: string[];
    onSave: () => void;
}

// Список секторов/отраслей
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

export function ClientDialog({
    open,
    onOpenChange,
    editingClient,
    clientForm,
    setClientForm,
    countries,
    onSave,
}: ClientDialogProps) {
    const [showEmailHelp, setShowEmailHelp] = useState(false);
    const [emailError, setEmailError] = useState('');

    const resetForm = () => {
        setClientForm({
            name: '',
            company: '',
            email: '',
            phone: '',
            country: '',
            personal_number: '',
            sector: '',
            is_active: true
        });
        setEmailError('');
        setShowEmailHelp(false);
    };

    const handleClose = () => {
        resetForm();
        onOpenChange(false);
    };

    const validateEmails = (emailString: string): boolean => {
        if (!emailString.trim()) {
            setEmailError('Email is required');
            return false;
        }

        const emails = emailString.split(',').map(email => email.trim()).filter(email => email.length > 0);

        if (emails.length === 0) {
            setEmailError('At least one email is required');
            return false;
        }

        // Проверяем каждый email на валидность
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const invalidEmails = emails.filter(email => !emailRegex.test(email));

        if (invalidEmails.length > 0) {
            setEmailError(`Invalid email format: ${invalidEmails.join(', ')}`);
            return false;
        }

        setEmailError('');
        return true;
    };

    const handleEmailChange = (value: string) => {
        setClientForm({ ...clientForm, email: value });
        // Проверяем валидность только если пользователь уже что-то ввел
        if (value.trim()) {
            validateEmails(value);
        } else {
            setEmailError('');
        }
    };

    const handleSave = () => {
        if (validateEmails(clientForm.email)) {
            onSave();
        }
    };

    const formatEmailExample = () => {
        const emails = clientForm.email.split(',').map(email => email.trim()).filter(email => email.length > 0);
        if (emails.length > 0) {
            return emails.join(', ');
        }
        return 'client1@company.com, client2@company.com, client3@company.com';
    };

    // Автоматически рассчитываем высоту Textarea в зависимости от содержимого
    const calculateTextareaHeight = (text: string): number => {
        const lineCount = text.split('\n').length;
        const emailCount = text.split(',').length;
        const totalLines = Math.max(lineCount, Math.ceil(emailCount / 2));
        const minHeight = 40; // минимальная высота в пикселях
        const lineHeight = 24; // высота строки в пикселях
        return Math.max(minHeight, totalLines * lineHeight);
    };

    // Функция для форматирования personal number (опционально)
    const formatPersonalNumber = (value: string) => {
        // Удаляем все нецифровые символы
        const numbers = value.replace(/\D/g, '');

        // Ограничиваем длину
        const limited = numbers.slice(0, 20);

        // Можно добавить форматирование по необходимости
        // Например: 123-456-7890
        if (limited.length <= 3) return limited;
        if (limited.length <= 6) return `${limited.slice(0, 3)}-${limited.slice(3)}`;
        return `${limited.slice(0, 3)}-${limited.slice(3, 6)}-${limited.slice(6, 10)}`;
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{editingClient ? 'Edit Client' : 'Add New Client'}</DialogTitle>
                    <DialogDescription>
                        {editingClient ? 'Update client details' : 'Create a new client'}
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="client-name">Client Name *</Label>
                            <Input
                                id="client-name"
                                value={clientForm.name}
                                onChange={(e) => setClientForm({ ...clientForm, name: e.target.value })}
                                placeholder="Enter client name"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="client-company">Company *</Label>
                            <Input
                                id="client-company"
                                value={clientForm.company}
                                onChange={(e) => setClientForm({ ...clientForm, company: e.target.value })}
                                placeholder="Enter company name"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="personal-number" className="flex items-center gap-2">
                                <Hash className="w-4 h-4" />
                                Personal Number
                            </Label>
                            <Input
                                id="personal-number"
                                value={clientForm.personal_number || ''}
                                onChange={(e) => {
                                    const formatted = formatPersonalNumber(e.target.value);
                                    setClientForm({ ...clientForm, personal_number: formatted });
                                }}
                                placeholder="Enter personal number (e.g., 123-456-789)"
                                maxLength={20}
                            />
                            <p className="text-xs text-gray-500">
                                Internal reference number (optional)
                            </p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="sector" className="flex items-center gap-2">
                                <Building2 className="w-4 h-4" />
                                Sector *
                            </Label>
                            <Select
                                value={clientForm.sector || "none"}
                                onValueChange={(value: string) =>
                                    setClientForm({ ...clientForm, sector: value !== "none" ? value : "" })
                                }
                            >
                                <SelectTrigger id="sector">
                                    <SelectValue placeholder="Select industry sector" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Select sector</SelectItem>
                                    {SECTOR_OPTIONS.map(sector => (
                                        <SelectItem key={sector.value} value={sector.value}>
                                            {sector.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="client-email">Email Address(es) *</Label>
                            <button
                                type="button"
                                onClick={() => setShowEmailHelp(!showEmailHelp)}
                                className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                            >
                                <Info className="w-4 h-4" />
                                How to add multiple emails
                            </button>
                        </div>

                        <div className="relative">
                            <Textarea
                                id="client-email"
                                value={clientForm.email}
                                onChange={(e) => handleEmailChange(e.target.value)}
                                placeholder="Enter email addresses separated by commas"
                                className={`resize-y min-h-[40px] max-h-[200px] overflow-y-auto ${emailError ? 'border-red-500' : ''
                                    }`}
                                style={{
                                    height: `${calculateTextareaHeight(clientForm.email)}px`
                                }}
                                rows={1}
                            />
                            <div className="absolute right-2 top-2 text-xs text-gray-400">
                                {clientForm.email.split(',').filter(e => e.trim()).length} email(s)
                            </div>
                        </div>

                        {showEmailHelp && (
                            <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                                <div className="flex items-start gap-2">
                                    <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                                    <div className="space-y-2">
                                        <p className="text-sm font-medium text-blue-800">Adding Multiple Email Addresses</p>
                                        <ul className="text-sm text-blue-700 space-y-1 list-disc pl-4">
                                            <li>Separate multiple email addresses with commas ( , )</li>
                                            <li>Example: <code className="bg-blue-100 px-1 rounded">john@company.com, jane@company.com, support@company.com</code></li>
                                            <li>Each email will be validated and must be in correct format</li>
                                            <li>Spaces before and after commas are automatically trimmed</li>
                                            <li>All emails will be associated with this client</li>
                                            <li>You can also use new lines for better readability</li>
                                        </ul>
                                        <div className="text-xs text-blue-600 mt-2">
                                            <p className="font-medium">Current format:</p>
                                            <div className="bg-white p-2 rounded border mt-1 font-mono text-xs overflow-x-auto">
                                                {formatEmailExample()}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {emailError && (
                            <div className="flex items-center gap-2 text-red-600 text-sm">
                                <AlertCircle className="w-4 h-4" />
                                <span>{emailError}</span>
                            </div>
                        )}

                        {clientForm.email && !emailError && (
                            <div className="text-sm text-green-600">
                                <div className="flex items-center gap-1">
                                    <Info className="w-4 h-4" />
                                    <span>
                                        {clientForm.email.split(',').filter(e => e.trim()).length}
                                        email{clientForm.email.split(',').filter(e => e.trim()).length !== 1 ? 's' : ''}
                                        will be added
                                    </span>
                                </div>
                                <div className="mt-1 text-xs text-gray-600">
                                    <p className="font-medium">Email preview:</p>
                                    <div className="flex flex-wrap gap-1 mt-1 max-h-32 overflow-y-auto p-1 border rounded">
                                        {clientForm.email.split(',').map((email, index) => (
                                            email.trim() && (
                                                <span
                                                    key={index}
                                                    className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs inline-flex items-center gap-1"
                                                >
                                                    <span className="truncate max-w-[200px]">{email.trim()}</span>
                                                </span>
                                            )
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="client-phone">Phone</Label>
                            <Input
                                id="client-phone"
                                value={clientForm.phone}
                                onChange={(e) => setClientForm({ ...clientForm, phone: e.target.value })}
                                placeholder="Enter phone number"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="client-country">Country</Label>
                            <Select
                                value={clientForm.country || "none"}
                                onValueChange={(value: string) => setClientForm({ ...clientForm, country: value !== "none" ? value : "" })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select country (optional)" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Select country</SelectItem>
                                    {countries.map(country => (
                                        <SelectItem key={country} value={country}>
                                            {country}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2 flex items-center gap-2">
                        <Switch
                            id="client-active"
                            checked={clientForm.is_active}
                            onCheckedChange={(checked: boolean) => setClientForm({ ...clientForm, is_active: checked })}
                        />
                        <Label htmlFor="client-active" className="cursor-pointer">
                            {clientForm.is_active ? 'Active Client' : 'Inactive Client'}
                        </Label>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={handleClose}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        style={{ backgroundColor: '#1F4E78' }}
                        disabled={!!emailError || !clientForm.sector || clientForm.sector === "none"}
                    >
                        {editingClient ? 'Save Changes' : 'Add Client'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}