import React, { useState, useEffect } from 'react';
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
import { Checkbox } from '../ui/checkbox';
import { Project } from '../TimeTrackerContext';
import { ProjectFormData } from '../../types/types';
import { User, Client } from '../../types/types';
import { useGetDepartments } from '../../hooks/useDepartments';
import { useUserStore } from '../../store/UsersStore';
import { useEditProject, useGetProjects, useSendProject } from '../../hooks/useProject';
import { toast } from 'sonner';
import { useGetManagers } from '../../hooks/useManagers';

interface ProjectDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editingProject: Project | null;
    projectForm: ProjectFormData;
    setProjectForm: (form: ProjectFormData) => void;
    users?: User[];
    managers?: { id: number; first_name: string; last_name: string; email: string; is_active: boolean }[];
    predefinedColors: { name: string; value: string }[];
    onSave: () => void;
}

export function ProjectDialog({
    open,
    onOpenChange,
    editingProject,
    projectForm,
    setProjectForm,
    users = [],
    managers = [],
    predefinedColors = [],
    onSave,
}: ProjectDialogProps) {
    const [customColor, setCustomColor] = useState(projectForm.project_color || '#1F4E78');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { mutate: getDepartments, isPending: isDepartmentsLoading } = useGetDepartments();
    const store_departments = useUserStore((state) => state.departments);
    const { mutate: sendProject, isPending: isSending } = useSendProject();
    const store_statuses = useUserStore((state) => state.statuses);
    const store_clients = useUserStore((state) => state.clients);
    const store_countries = useUserStore((state) => state.countries);
    const store_service_lines = useUserStore((state) => state.service_lines);
    const store_task_types = useUserStore((state) => state.task_types);
    const { mutate: getProjects } = useGetProjects();
    const { mutate: editProject } = useEditProject();

    // Используем useQuery для получения менеджеров
    const { data: project_managers, isLoading: isLoadingManagers, error: managersError } = useGetManagers();

    // Загружаем все департаменты при открытии диалога
    useEffect(() => {
        if (open && (!store_departments || store_departments.length === 0)) {
            console.log('Fetching all departments...');
            getDepartments();
        }
    }, [open, store_departments, getDepartments]);

    // Отслеживаем изменения в store для отладки
    useEffect(() => {
        console.log('store_departments:', store_departments);
    }, [store_departments]);

    useEffect(() => {
        if (project_managers) {
            console.log('Project managers loaded:', project_managers);
        }
        if (managersError) {
            console.error('Error loading project managers:', managersError);
        }
    }, [project_managers, managersError]);

    // Получаем активные статусы из store
    const getActiveStatuses = () => {
        if (!store_statuses || !Array.isArray(store_statuses)) {
            return [];
        }
        return store_statuses.filter(status =>
            status.is_active !== undefined ? status.is_active : true
        );
    };

    // Получаем активных клиентов из store
    const getActiveStoreClients = () => {
        if (!store_clients || !Array.isArray(store_clients)) {
            return [];
        }
        return store_clients.filter(client =>
            client.is_active !== undefined ? client.is_active : true
        );
    };

    // Получаем активные страны из store
    const getActiveStoreCountries = () => {
        if (!store_countries || !Array.isArray(store_countries)) {
            return [];
        }
        return store_countries.filter(country =>
            country.is_active !== undefined ? country.is_active : true
        );
    };

    // Получаем активные сервис лайны из store
    const getActiveStoreServiceLines = () => {
        if (!store_service_lines || !Array.isArray(store_service_lines)) {
            return [];
        }
        return store_service_lines.filter(serviceLine =>
            serviceLine.is_active !== undefined ? serviceLine.is_active : true
        );
    };

    // Получаем активные таск тайпы из store
    const getActiveStoreTaskTypes = () => {
        if (!store_task_types || !Array.isArray(store_task_types)) {
            return [];
        }
        return store_task_types.filter(taskType =>
            taskType.is_active !== undefined ? taskType.is_active : true
        );
    };

    // Получаем активных менеджеров из project_managers
    const getActiveManagers = () => {
        if (!project_managers || !Array.isArray(project_managers)) {
            return [];
        }
        return project_managers.filter(manager => manager.is_active !== false);
    };

    const resetForm = () => {
        setProjectForm({
            name: '',
            description: '',
            project_color: '#1F4E78',
            status_id: undefined,
            country_id: undefined,
            manager_id: undefined,
            client_id: undefined,
            department_id: undefined,
            service_line_id: undefined,
            task_type_id: undefined,
            is_chargeable: true,
            is_code_recurring: false,
            status: undefined,
            country: undefined,
            manager: undefined,
            client: undefined,
            department: undefined,
            service_line: undefined,
            task_type: undefined
        });
        setCustomColor('#1F4E78');
    };

    // Синхронизируем customColor с project_color из формы
    useEffect(() => {
        if (projectForm.project_color) {
            setCustomColor(projectForm.project_color);
        }
    }, [projectForm.project_color]);

    const handleClose = () => {
        resetForm();
        onOpenChange(false);
    };

    const handleColorChange = (color: string) => {
        setProjectForm({ ...projectForm, project_color: color });
        setCustomColor(color);
    };

    const handleCustomColorChange = (color: string) => {
        setCustomColor(color);
        setProjectForm({ ...projectForm, project_color: color });
    };

    const handleDepartmentChange = (value: string) => {
        const departmentId = value !== "none" ? parseInt(value) : undefined;
        setProjectForm({
            ...projectForm,
            department_id: departmentId,
        });
    };

    // Функция для отправки проекта
    const handleSubmit = async () => {
        // Проверяем обязательные поля
        if (!projectForm.name || !projectForm.description) {
            toast.error('Please fill in all required fields');
            return;
        }

        setIsSubmitting(true);

        // Подготавливаем данные для отправки
        const projectData = {
            // Обязательные поля
            name: projectForm.name,
            description: projectForm.description,
            project_color: projectForm.project_color,
            is_chargeable: projectForm.is_chargeable,
            is_code_recurring: projectForm.is_code_recurring || false,

            // Опциональные поля
            status: projectForm.status_id ? Number(projectForm.status_id) : undefined,
            country: projectForm.country_id ? Number(projectForm.country_id) : undefined,
            manager: projectForm.manager_id ? Number(projectForm.manager_id) : undefined,
            client: projectForm.client_id ? Number(projectForm.client_id) : undefined,
            department: projectForm.department_id ? Number(projectForm.department_id) : undefined,
            service_line: projectForm.service_line_id ? Number(projectForm.service_line_id) : undefined,
            task_type: projectForm.task_type_id ? Number(projectForm.task_type_id) : undefined,
        };

        console.log('Sending project data:', projectData);

        // Если редактируем существующий проект
        if (editingProject) {
            editProject(
                { project_data: projectData, project_id: editingProject.id },
                {
                    onSuccess: (data) => {
                        console.log('Project updated successfully:', data);
                        toast.success('Project updated successfully');
                        getProjects();
                        onSave();
                        resetForm();
                        onOpenChange(false);
                    },
                    onError: (error) => {
                        console.error('Error updating project:', error);
                        toast.error(`Failed to update project: ${error.message || 'Unknown error'}`);
                    },
                    onSettled: () => {
                        setIsSubmitting(false);
                    }
                }
            );
        } else {
            // Если создаем новый проект
            sendProject(projectData, {
                onSuccess: (data) => {
                    console.log('Project created successfully:', data);
                    toast.success('Project created successfully');
                    getProjects();
                    onSave();
                    resetForm();
                    onOpenChange(false);
                },
                onError: (error) => {
                    console.error('Error creating project:', error);
                    toast.error(`Failed to create project: ${error.message || 'Unknown error'}`);
                },
                onSettled: () => {
                    setIsSubmitting(false);
                }
            });
        }
    };

    // Отображаем департаменты из store
    const renderDepartments = () => {
        if (!store_departments) {
            return <SelectItem value="none">Loading departments...</SelectItem>;
        }

        if (!Array.isArray(store_departments)) {
            return <SelectItem value="none">Error loading departments</SelectItem>;
        }

        if (store_departments.length === 0) {
            return <SelectItem value="none">No departments available</SelectItem>;
        }

        return store_departments.map((department) => (
            <SelectItem key={department.id} value={department.id.toString()}>
                {department.name || 'Unknown Department'}
            </SelectItem>
        ));
    };

    // Отображаем статусы из store
    const renderStatuses = () => {
        const activeStatuses = getActiveStatuses();

        if (activeStatuses.length === 0) {
            return <SelectItem value="none">No statuses available</SelectItem>;
        }

        return activeStatuses.map(status => (
            <SelectItem key={status.id} value={status.id.toString()}>
                {status.name}
            </SelectItem>
        ));
    };

    // Отображаем страны из store
    const renderCountries = () => {
        const activeCountries = getActiveStoreCountries();

        if (activeCountries.length === 0) {
            return <SelectItem value="none">No countries available</SelectItem>;
        }

        return activeCountries.map(country => (
            <SelectItem key={country.id} value={country.id.toString()}>
                {country.name} ({country.code})
            </SelectItem>
        ));
    };

    // Отображаем менеджеров из project_managers
    const renderManagers = () => {
        const activeManagers = getActiveManagers();

        if (isLoadingManagers) {
            return <SelectItem value="none" disabled>Loading managers...</SelectItem>;
        }

        if (activeManagers.length === 0) {
            return <SelectItem value="none" disabled>No managers available</SelectItem>;
        }

        return activeManagers.map(manager => (
            <SelectItem key={manager.id} value={manager.id.toString()}>
                {manager.first_name} {manager.last_name}
            </SelectItem>
        ));
    };

    // Отображаем клиентов из store
    const renderClients = () => {
        const activeClients = getActiveStoreClients();

        if (activeClients.length === 0) {
            return <SelectItem value="none">No clients available</SelectItem>;
        }

        return activeClients.map(client => (
            <SelectItem key={client.id} value={client.id.toString()}>
                {client.name}
                {client.company && ` (${client.company})`}
            </SelectItem>
        ));
    };

    // Отображаем сервис лайны из store
    const renderServiceLines = () => {
        const activeServiceLines = getActiveStoreServiceLines();

        if (activeServiceLines.length === 0) {
            return <SelectItem value="none">No service lines available</SelectItem>;
        }

        return activeServiceLines.map(serviceLine => (
            <SelectItem key={serviceLine.id} value={serviceLine.id.toString()}>
                {serviceLine.name}
            </SelectItem>
        ));
    };

    // Отображаем таск тайпы из store
    const renderTaskTypes = () => {
        const activeTaskTypes = getActiveStoreTaskTypes();

        if (activeTaskTypes.length === 0) {
            return <SelectItem value="none">No task types available</SelectItem>;
        }

        return activeTaskTypes.map(taskType => (
            <SelectItem key={taskType.id} value={taskType.id.toString()}>
                {taskType.name}
            </SelectItem>
        ));
    };

    const isFormValid = projectForm.name && projectForm.description;
    const isLoading = isSubmitting || isSending;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[85vh] overflow-y-auto" style={{ width: '1000px', maxWidth: 'calc(100vw - 2rem)' }}>
                <DialogHeader>
                    <DialogTitle>{editingProject ? 'Edit Project' : 'Add New Project'}</DialogTitle>
                    <DialogDescription>
                        {editingProject ? 'Update project details' : 'Create a new project'}
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    {/* Basic Information - Project Name, Recurring */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="project-name">Project Name *</Label>
                            <Input
                                id="project-name"
                                value={projectForm.name}
                                onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
                                placeholder="Enter project name"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="project-recurring">Recurring</Label>
                            <div className="flex items-center space-x-2 h-10">
                                <Checkbox
                                    id="project-recurring"
                                    checked={projectForm.is_code_recurring || false}
                                    onCheckedChange={(checked) =>
                                        setProjectForm({ ...projectForm, is_code_recurring: checked === true })
                                    }
                                />
                                <Label htmlFor="project-recurring" className="cursor-pointer text-sm">
                                    Project is recurring
                                </Label>
                            </div>
                        </div>
                    </div>

                    {/* Description и Color в одной строке */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="project-description">Project Description *</Label>
                            <Textarea
                                id="project-description"
                                value={projectForm.description}
                                onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                                placeholder="Enter project description..."
                                rows={3}
                                className="resize-none overflow-y-auto"
                                style={{ height: '80px' }}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">Project Color *</Label>
                            <div className="flex flex-wrap gap-1.5">
                                {predefinedColors.map(color => (
                                    <button
                                        key={color.value}
                                        type="button"
                                        onClick={() => handleColorChange(color.value)}
                                        className={`w-6 h-6 rounded transition-all hover:scale-110 ${projectForm.project_color === color.value
                                            ? 'ring-2 ring-offset-1 ring-slate-900'
                                            : 'ring-1 ring-slate-200'
                                            }`}
                                        style={{ backgroundColor: color.value }}
                                        title={color.name}
                                    />
                                ))}
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                                <Label htmlFor="custom-color" className="text-sm">Custom:</Label>
                                <Input
                                    id="custom-color"
                                    type="color"
                                    value={customColor}
                                    onChange={(e) => handleCustomColorChange(e.target.value)}
                                    className="w-8 h-8 p-0 rounded"
                                />
                                <Input
                                    type="text"
                                    value={customColor}
                                    onChange={(e) => handleCustomColorChange(e.target.value)}
                                    className="font-mono text-sm w-24 h-8"
                                    placeholder="#RRGGBB"
                                />
                                <div
                                    className="w-6 h-6 rounded border ml-1"
                                    style={{ backgroundColor: projectForm.project_color }}
                                    title="Selected color"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Status, Chargeable, Country, Department - все в одной строке */}
                    <div className="grid grid-cols-4 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="project-status">Status</Label>
                            <Select
                                value={projectForm.status_id?.toString() || "none"}
                                onValueChange={(value: string) => setProjectForm({
                                    ...projectForm,
                                    status_id: value !== "none" ? parseInt(value) : undefined
                                })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Select status</SelectItem>
                                    {renderStatuses()}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="project-chargeable">Chargeable</Label>
                            <div className="flex items-center space-x-2 h-10">
                                <Checkbox
                                    id="project-chargeable"
                                    checked={projectForm.is_chargeable}
                                    onCheckedChange={(checked) =>
                                        setProjectForm({ ...projectForm, is_chargeable: checked === true })
                                    }
                                />
                                <Label htmlFor="project-chargeable" className="cursor-pointer text-sm">
                                    Is chargeable
                                </Label>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="project-country">Country</Label>
                            <Select
                                value={projectForm.country_id?.toString() || "none"}
                                onValueChange={(value: string) => setProjectForm({
                                    ...projectForm,
                                    country_id: value !== "none" ? parseInt(value) : undefined
                                })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select country" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Select country</SelectItem>
                                    {renderCountries()}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="project-department">Department</Label>
                            <Select
                                value={projectForm.department_id?.toString() || "none"}
                                onValueChange={handleDepartmentChange}
                                disabled={isDepartmentsLoading}
                            >
                                <SelectTrigger>
                                    <SelectValue
                                        placeholder={
                                            isDepartmentsLoading
                                                ? "Loading departments..."
                                                : "Select department"
                                        }
                                    />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Select department</SelectItem>
                                    {renderDepartments()}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Project Team - 4 колонки: Manager, Client, Service Line, Task Type */}
                    <div className="grid grid-cols-4 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="project-manager">Project Manager</Label>
                            <Select
                                value={projectForm.manager_id?.toString() || "none"}
                                onValueChange={(value: string) => setProjectForm({
                                    ...projectForm,
                                    manager_id: value !== "none" ? parseInt(value) : undefined
                                })}
                                disabled={isLoadingManagers}
                            >
                                <SelectTrigger>
                                    {isLoadingManagers ? (
                                        <div className="flex items-center">
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                                            Loading managers...
                                        </div>
                                    ) : (
                                        <SelectValue placeholder="Select manager" />
                                    )}
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Select manager</SelectItem>
                                    {renderManagers()}
                                </SelectContent>
                            </Select>
                        </div>

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
                                    <SelectValue placeholder="Select client" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Select client</SelectItem>
                                    {renderClients()}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="project-service-line">Service Line</Label>
                            <Select
                                value={projectForm.service_line_id?.toString() || "none"}
                                onValueChange={(value: string) => setProjectForm({
                                    ...projectForm,
                                    service_line_id: value !== "none" ? parseInt(value) : undefined
                                })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select service line" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Select service line</SelectItem>
                                    {renderServiceLines()}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="project-task-type">Task Type</Label>
                            <Select
                                value={projectForm.task_type_id?.toString() || "none"}
                                onValueChange={(value: string) => setProjectForm({
                                    ...projectForm,
                                    task_type_id: value !== "none" ? parseInt(value) : undefined
                                })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select task type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Select task type</SelectItem>
                                    {renderTaskTypes()}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
                <DialogFooter className="pt-4 border-t">
                    <Button variant="outline" onClick={handleClose}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={!isFormValid || isLoading}
                        style={{ backgroundColor: '#1F4E78' }}
                        className="disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            'Saving...'
                        ) : editingProject ? (
                            'Save Changes'
                        ) : (
                            'Add Project'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}