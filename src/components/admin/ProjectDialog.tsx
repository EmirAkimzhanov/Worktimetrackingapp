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
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Project } from '../TimeTrackerContext';
import { ProjectFormData } from '../../types/types';
import { User, Client } from '../../types/types';

interface ProjectDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editingProject: Project | null;
    projectForm: ProjectFormData;
    setProjectForm: (form: ProjectFormData) => void;
    users: User[];
    clients: Client[];
    countries: string[];
    predefinedColors: { name: string; value: string }[];
    onSave: () => void;
}

export function ProjectDialog({
    open,
    onOpenChange,
    editingProject,
    projectForm,
    setProjectForm,
    users,
    clients,
    countries,
    predefinedColors,
    onSave,
}: ProjectDialogProps) {
    const getActiveUsers = () => users.filter(u => u.is_active);
    const getActiveClients = () => clients.filter(c => c.is_active);

    const resetForm = () => {
        setProjectForm({
            name: '',
            code: '',
            color: '#1F4E78',
            client_id: undefined,
            project_manager: undefined,
            country: '',
            department: '',
            description: ''
        });
    };

    const handleClose = () => {
        resetForm();
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>{editingProject ? 'Edit Project' : 'Add New Project'}</DialogTitle>
                    <DialogDescription>
                        {editingProject ? 'Update project details' : 'Create a new project'}
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="project-code">Project Code *</Label>
                            <Input
                                id="project-code"
                                value={projectForm.code}
                                onChange={(e) => setProjectForm({ ...projectForm, code: e.target.value.toUpperCase() })}
                                placeholder="e.g., PROJ-001"
                                className="font-mono"
                            />
                            <p className="text-xs text-slate-500">Must be unique across all projects</p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="project-name">Project Name *</Label>
                            <Input
                                id="project-name"
                                value={projectForm.name}
                                onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
                                placeholder="Enter project name"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="project-country">Country *</Label>
                            <Select
                                value={projectForm.country || "none"}
                                onValueChange={(value: string) => setProjectForm({ ...projectForm, country: value !== "none" ? value : "" })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select country" />
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
                        <div className="space-y-2">
                            <Label htmlFor="project-department">Department *</Label>
                            <Input
                                id="project-department"
                                value={projectForm.department}
                                onChange={(e) => setProjectForm({ ...projectForm, department: e.target.value })}
                                placeholder="e.g., IT, Marketing, Sales"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="project-client">Client</Label>
                            <Select
                                value={projectForm.client_id?.toString() || "none"}
                                onValueChange={(value: string) => setProjectForm({
                                    ...projectForm,
                                    client_id: value !== "none" ? parseInt(value) : undefined
                                })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select client (optional)" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Not assigned</SelectItem>
                                    {getActiveClients().map(client => (
                                        <SelectItem key={client.id} value={client.id.toString()}>
                                            {client.company} ({client.name})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="project-manager">Project Manager</Label>
                            <Select
                                value={projectForm.project_manager?.toString() || "none"}
                                onValueChange={(value: string) => setProjectForm({
                                    ...projectForm,
                                    project_manager: value !== "none" ? parseInt(value) : undefined
                                })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select project manager (optional)" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Not assigned</SelectItem>
                                    {getActiveUsers().map(user => (
                                        <SelectItem key={user.id} value={user.id.toString()}>
                                            {user.first_name} {user.last_name} ({user.position_id})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Project Color *</Label>
                        <div className="grid grid-cols-8 gap-2">
                            {predefinedColors.map(color => (
                                <button
                                    key={color.value}
                                    type="button"
                                    onClick={() => setProjectForm({ ...projectForm, color: color.value })}
                                    className={`p-3 rounded-lg border-2 transition-all hover:scale-105 ${projectForm.color === color.value ? 'border-slate-900 ring-2 ring-slate-300' : 'border-slate-200'
                                        }`}
                                    style={{ backgroundColor: color.value }}
                                    title={color.name}
                                />
                            ))}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                            <Label htmlFor="custom-color" className="text-xs">Custom:</Label>
                            <Input
                                id="custom-color"
                                type="color"
                                value={projectForm.color}
                                onChange={(e) => setProjectForm({ ...projectForm, color: e.target.value })}
                                className="w-20 h-10"
                            />
                            <span className="text-xs text-slate-500 font-mono">{projectForm.color}</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="project-description">Project Description</Label>
                        <Textarea
                            id="project-description"
                            value={projectForm.description}
                            onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                            placeholder="Enter project description..."
                            rows={3}
                        />
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
                        {editingProject ? 'Save Changes' : 'Add Project'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}