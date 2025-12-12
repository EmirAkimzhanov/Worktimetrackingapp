import React from 'react';
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
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ClientFormData } from '../../types/types';

interface ClientDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editingClient: any;
    clientForm: ClientFormData;
    setClientForm: (form: ClientFormData) => void;
    countries: string[];
    onSave: () => void;
}

export function ClientDialog({
    open,
    onOpenChange,
    editingClient,
    clientForm,
    setClientForm,
    countries,
    onSave,
}: ClientDialogProps) {
    const resetForm = () => {
        setClientForm({
            name: '',
            company: '',
            email: '',
            phone: '',
            country: '',
            is_active: true
        });
    };

    const handleClose = () => {
        resetForm();
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
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
                            <Label htmlFor="client-email">Email *</Label>
                            <Input
                                id="client-email"
                                type="email"
                                value={clientForm.email}
                                onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })}
                                placeholder="Enter email address"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="client-phone">Phone</Label>
                            <Input
                                id="client-phone"
                                value={clientForm.phone}
                                onChange={(e) => setClientForm({ ...clientForm, phone: e.target.value })}
                                placeholder="Enter phone number"
                            />
                        </div>
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
                        onClick={onSave}
                        style={{ backgroundColor: '#1F4E78' }}
                    >
                        {editingClient ? 'Save Changes' : 'Add Client'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}