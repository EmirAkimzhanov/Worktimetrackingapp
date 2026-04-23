// src/components/admin/country/CountryTable.tsx
import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Search, X } from 'lucide-react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '../../ui/table';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '../../ui/dialog';
import { Label } from '../../ui/label';
import { Badge } from '../../ui/badge';
import { toast } from 'sonner';
import { useUserStore } from '../../../store/UsersStore';
import { useAddCountry, useDeleteCountry, useEditCountry, useGetCountries } from '../../../hooks/useCountries';

interface Country {
    id: number;
    code: string;
    name: string;
    phoneCode: string;
    currency: string;
    currencySymbol: string;
    isActive: boolean;
    createdAt: string;
}

interface CountryTableProps {
    countries?: Country[];
    onEdit?: (country: Country) => void;
    onDelete?: (id: number) => void;
    onAdd?: (country: Omit<Country, 'id' | 'createdAt'>) => void;
}

export function CountryTable({
    countries: initialCountries = [],
    onEdit,
    onDelete,
    onAdd
}: CountryTableProps) {
    const countries = useUserStore((state) => state.countries);
    const [searchTerm, setSearchTerm] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [editingCountry, setEditingCountry] = useState<Country | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [isEditingLoading, setIsEditingLoading] = useState(false);

    const { mutate: getCountries } = useGetCountries();
    const { mutate: addCountry, isPending: isAdding } = useAddCountry();
    const { mutate: editCountry } = useEditCountry();
    const { mutate: deleteCountry, isPending: isDeleting } = useDeleteCountry();

    const [formData, setFormData] = useState({
        code: '',
        name: '',
    });

    // Загружаем страны при монтировании компонента
    useEffect(() => {
        getCountries();
    }, []);

    // Фильтрация стран по поиску
    const filteredCountries = countries.filter(country =>
        country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        country.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Сброс формы
    const resetForm = () => {
        setFormData({
            code: '',
            name: '',
        });
        setEditingCountry(null);
        setIsEditingLoading(false);
    };

    // Открытие диалога добавления
    const handleAddClick = () => {
        resetForm();
        setIsDialogOpen(true);
    };

    // Открытие диалога редактирования
    const handleEditClick = (country: Country) => {
        setEditingCountry(country);
        setFormData({
            code: country.code,
            name: country.name,
        });
        setIsDialogOpen(true);
    };

    // Открытие диалога удаления
    const handleDeleteClick = (id: number) => {
        setDeletingId(id);
        setIsDeleteDialogOpen(true);
    };

    // Сохранение (добавление или обновление)
    const handleSave = () => {
        // Валидация
        if (!formData.code.trim()) {
            toast.error('Country code is required');
            return;
        }
        if (!formData.name.trim()) {
            toast.error('Country name is required');
            return;
        }

        // Проверка на дубликат кода
        const existingCountry = countries.find(c =>
            c.code.toLowerCase() === formData.code.toLowerCase() &&
            (!editingCountry || c.id !== editingCountry.id)
        );

        if (existingCountry) {
            toast.error('Country code already exists');
            return;
        }

        if (editingCountry) {
            // Использование мутации для редактирования как в примере
            setIsEditingLoading(true);

            const updatedCountry = {
                id: editingCountry.id,
                code: formData.code.toUpperCase(),
                name: formData.name,
            };

            console.log('Updating country with id:', editingCountry.id);
            console.log('Updated country data:', updatedCountry);

            editCountry(
                {
                    id: String(editingCountry.id),
                    country: updatedCountry
                },
                {
                    onSuccess: () => {
                        console.log('Country updated successfully, refreshing list...');
                        // Обновляем список стран
                        getCountries(undefined, {
                            onSuccess: () => {
                                console.log('Countries list refreshed');
                                toast.success(`Country ${updatedCountry.name} updated successfully`);
                                setIsDialogOpen(false);
                                resetForm();
                            },
                            onError: (error) => {
                                console.error('Error refreshing countries:', error);
                                toast.error('Country updated but failed to refresh list');
                                setIsDialogOpen(false);
                                resetForm();
                            }
                        });
                        setIsEditingLoading(false);
                    },
                    onError: (error) => {
                        console.error('Error updating country:', error);
                        toast.error('Failed to update country');
                        setIsEditingLoading(false);
                    }
                }
            );
        } else {
            // Использование мутации для добавления
            addCountry(
                {
                    code: formData.code.toUpperCase(),
                    name: formData.name,
                },
                {
                    onSuccess: () => {
                        toast.success('Country added successfully');
                        setIsDialogOpen(false);
                        resetForm();
                        // Обновляем список стран после добавления
                        getCountries();
                    },
                    onError: (error) => {
                        toast.error('Failed to add country');
                        console.error(error);
                    }
                }
            );
        }
    };

    // Подтверждение удаления
    const confirmDelete = () => {
        if (deletingId) {
            // Использование мутации для удаления
            deleteCountry(deletingId, {
                onSuccess: () => {
                    toast.success('Country deleted successfully');
                    setIsDeleteDialogOpen(false);
                    setDeletingId(null);
                    // Обновляем список стран после удаления
                    getCountries();
                },
                onError: (error) => {
                    toast.error('Failed to delete country');
                    console.error(error);
                }
            });
        }
    };

    return (
        <div className="space-y-4">
            {/* Заголовок и поиск */}
            <div className="flex justify-between items-center" style={{ justifyContent: 'flex-end' }}>

                <Button onClick={handleAddClick} className="bg-primary hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Country
                </Button>
            </div>

            {/* Таблица стран с вертикальным скроллом */}
            <div className="border rounded-lg overflow-hidden">
                <div className="max-h-[500px] overflow-y-auto">
                    <Table>
                        <TableHeader className="sticky top-0 bg-white z-10">
                            <TableRow>
                                <TableHead className="w-20 bg-white">Code</TableHead>
                                <TableHead className="bg-white">Country Name</TableHead>
                                {/* <TableHead className="w-32 bg-white">Phone Code</TableHead> */}
                                {/* <TableHead className="w-32 bg-white">Currency</TableHead> */}
                                {/* <TableHead className="w-24 bg-white">Symbol</TableHead> */}
                                {/* <TableHead className="w-24 bg-white">Status</TableHead> */}
                                {/* <TableHead className="w-24 text-right bg-white">Actions</TableHead> */}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredCountries.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                                        No countries found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredCountries.map((country) => (
                                    <TableRow key={country.id}>
                                        <TableCell className="font-medium">{country.code}</TableCell>
                                        <TableCell>{country.name}</TableCell>
                                        <TableCell>{country.phoneCode}</TableCell>
                                        <TableCell>{country.currency}</TableCell>
                                        {/* <TableCell>{country.currencySymbol}</TableCell> */}
                                        {/* <TableCell>
                                            <Badge variant={country.isActive ? "default" : "secondary"}>
                                                {country.isActive ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </TableCell> */}
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleEditClick(country)}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDeleteClick(country.id)}
                                                    className="text-red-600 hover:text-red-700"
                                                >
                                                    <Trash2 className="h-4 w-4" />
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

            {/* Диалог добавления/редактирования - только код и название */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            {editingCountry ? 'Edit Country' : 'Add New Country'}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="code">Country Code *</Label>
                            <Input
                                id="code"
                                placeholder="e.g., KZ, KG, US"
                                value={formData.code}
                                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                maxLength={3}
                                disabled={isAdding || isEditingLoading}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="name">Country Name *</Label>
                            <Input
                                id="name"
                                placeholder="e.g., Kazakhstan, Kyrgyzstan"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                disabled={isAdding || isEditingLoading}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            style={{ marginRight: '20%' }}
                            variant="outline"
                            onClick={() => setIsDialogOpen(false)}
                            disabled={isAdding || isEditingLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSave}
                            className="bg-primary hover:bg-blue-700"
                            disabled={isAdding || isEditingLoading}
                        >
                            {isAdding || isEditingLoading ? 'Saving...' : (editingCountry ? 'Update' : 'Add')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Диалог подтверждения удаления */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Delete Country</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <p>Are you sure you want to delete this country? This action cannot be undone.</p>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsDeleteDialogOpen(false)}
                            disabled={isDeleting}
                        >
                            Cancel
                        </Button>
                        <Button
                            style={{ marginLeft: '15px' }}
                            variant="destructive"
                            onClick={confirmDelete}
                            disabled={isDeleting}
                        >
                            {isDeleting ? 'Deleting...' : 'Delete'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}