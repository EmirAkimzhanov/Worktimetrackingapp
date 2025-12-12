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
import { UserFormData } from '../../types/types';
import { Position, Department } from '../../types/types';

interface UserDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editingUser: any;
    userForm: UserFormData;
    setUserForm: (form: UserFormData) => void;
    positions: Position[];
    departments: Department[];
    onSave: () => void;
}

export function UserDialog({
    open,
    onOpenChange,
    editingUser,
    userForm,
    setUserForm,
    positions,
    departments,
    onSave,
}: UserDialogProps) {
    const resetForm = () => {
        setUserForm({
            email: '',
            first_name: '',
            last_name: '',
            password: '',
            date_joined: new Date().toISOString().split('T')[0],
            leave_date: '',
            is_active: true,
            position_id: 1,
            department_id: 1,
            role: 'user'
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
                    <DialogTitle>{editingUser ? 'Edit User' : 'Add New User'}</DialogTitle>
                    <DialogDescription>
                        {editingUser ? 'Update user details' : 'Create a new user account'}
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="first_name">First Name *</Label>
                            <Input
                                id="first_name"
                                value={userForm.first_name}
                                onChange={(e) => setUserForm({ ...userForm, first_name: e.target.value })}
                                placeholder="Enter first name"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="last_name">Last Name *</Label>
                            <Input
                                id="last_name"
                                value={userForm.last_name}
                                onChange={(e) => setUserForm({ ...userForm, last_name: e.target.value })}
                                placeholder="Enter last name"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input
                            id="email"
                            type="email"
                            value={userForm.email}
                            onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                            placeholder="Enter email address"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">
                            {editingUser ? 'Password (leave blank to keep current)' : 'Password *'}
                        </Label>
                        <Input
                            id="password"
                            type="password"
                            value={userForm.password}
                            onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                            placeholder="Enter password"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="position">Position *</Label>
                            <Select
                                value={userForm.position_id.toString()}
                                onValueChange={(value: string) =>
                                    setUserForm({ ...userForm, position_id: parseInt(value) })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select position" />
                                </SelectTrigger>
                                <SelectContent>
                                    {positions.map(position => (
                                        <SelectItem key={position.id} value={position.id.toString()}>
                                            {position.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="department">Department *</Label>
                            <Select
                                value={userForm.department_id.toString()}
                                onValueChange={(value: string) =>
                                    setUserForm({ ...userForm, department_id: parseInt(value) })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select department" />
                                </SelectTrigger>
                                <SelectContent>
                                    {departments.map(department => (
                                        <SelectItem key={department.id} value={department.id.toString()}>
                                            {department.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="date_joined">Date Joined *</Label>
                            <Input
                                id="date_joined"
                                type="date"
                                value={userForm.date_joined}
                                onChange={(e) => setUserForm({ ...userForm, date_joined: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="leave_date">Leave Date (optional)</Label>
                            <Input
                                id="leave_date"
                                type="date"
                                value={userForm.leave_date || ''}
                                onChange={(e) => setUserForm({ ...userForm, leave_date: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="role">Role *</Label>
                            <Select
                                value={userForm.role}
                                onValueChange={(value: 'admin' | 'user' | 'manager') =>
                                    setUserForm({ ...userForm, role: value })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="user">User</SelectItem>
                                    <SelectItem value="manager">Manager</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2 flex items-center gap-2 pt-6">
                            <Switch
                                id="user-active"
                                checked={userForm.is_active}
                                onCheckedChange={(checked: boolean) => setUserForm({ ...userForm, is_active: checked })}
                            />
                            <Label htmlFor="user-active" className="cursor-pointer">
                                {userForm.is_active ? 'Active User' : 'Inactive User'}
                            </Label>
                        </div>
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
                        {editingUser ? 'Save Changes' : 'Add User'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}