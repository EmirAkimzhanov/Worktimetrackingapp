import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Edit, Trash2, Plus, Building } from 'lucide-react';
import { Client } from '../../types/types';

interface ClientsTableProps {
    clients: Client[];
    onEdit: (client: Client) => void;
    onDelete: (id: number) => void;
    onAdd: () => void; // Добавлен новый проп
}

export function ClientsTable({ clients, onEdit, onDelete, onAdd }: ClientsTableProps) {
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
                            <TableHead>Created</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="w-24">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {clients.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center text-slate-500 py-8">
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
                            clients.map(client => (
                                <TableRow key={client.id} className="hover:bg-slate-50">
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            <Building className="w-4 h-4 text-slate-500" />
                                            {client.name}
                                        </div>
                                    </TableCell>
                                    <TableCell>{client.company}</TableCell>
                                    <TableCell className="text-blue-600">{client.email}</TableCell>
                                    <TableCell>{client.phone}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="text-xs">
                                            {client.country}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-sm">{client.created_at}</span>
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
                                            >
                                                <Edit className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => onDelete(client.id)}
                                            >
                                                <Trash2 className="w-4 h-4 text-red-500" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}