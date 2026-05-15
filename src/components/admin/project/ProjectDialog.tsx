import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '../../ui/dialog';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Checkbox } from '../../ui/checkbox';
import { Project } from '../../TimeTrackerContext';
import { ProjectFormData } from '../../../types/types';
import { User, Client } from '../../../types/types';
import { useGetDepartments } from '../../../hooks/useDepartments';
import { useUserStore } from '../../../store/UsersStore';
import { useEditProject, useGetProjects, useSendProject } from '../../../hooks/useProject';
import { toast } from 'sonner';
import { useGetManagers } from '../../../hooks/useManagers';
import { useGetServiceType } from '../../../hooks/useRefBooks';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'; // Add this import if you have it, or create a simple wrapper

// Simple VisuallyHidden component if you don't have @radix-ui/react-visually-hidden
const VisuallyHidden = ({ children }: { children: React.ReactNode }) => {
    return (
        <div style={{
            position: 'absolute',
            width: '1px',
            height: '1px',
            padding: '0',
            margin: '-1px',
            overflow: 'hidden',
            clip: 'rect(0, 0, 0, 0)',
            whiteSpace: 'nowrap',
            borderWidth: '0',
        }}>
            {children}
        </div>
    );
};

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
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isDataReady, setIsDataReady] = useState(false);

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
    const { data: serviceType } = useGetServiceType();
    const { data: project_managers, isLoading: isLoadingManagers, error: managersError } = useGetManagers();

    // Загружаем департаменты при открытии
    useEffect(() => {
        if (open && (!store_departments || store_departments.length === 0)) {
            getDepartments();
        }
    }, [open, store_departments, getDepartments]);

    // Функция для поиска ID по названию/коду
    const findIdByValue = (list: any[], value: string, key: string = 'name'): number | undefined => {
        if (!list || !value) return undefined;
        const item = list.find(item => {
            if (key === 'code') return item.code === value;
            return item.name === value || item.title === value;
        });
        return item?.id;
    };

    // Заполнение формы при редактировании с преобразованием названий в ID
    useEffect(() => {
        if (open && editingProject) {
            // Проверяем, что все необходимые справочники загружены
            const allDataLoaded = () => {
                if (!editingProject) return true;
                // Если есть поля с названиями, проверяем соответствующие списки
                if (editingProject.status && !store_statuses?.length) return false;
                if (editingProject.country && !store_countries?.length) return false;
                if (editingProject.manager && !project_managers?.length) return false;
                if (editingProject.client && !store_clients?.length) return false;
                if (editingProject.department && !store_departments?.length) return false;
                if (editingProject.service_line && !store_service_lines?.length) return false;
                if (editingProject.task_type && !store_task_types?.length) return false;
                if (editingProject.service_type && !serviceType?.length) return false;
                return true;
            };

            if (!allDataLoaded()) {
                // Если данные ещё загружаются, ждём
                setIsDataReady(false);
                return;
            }

            setIsDataReady(true);

            // Преобразуем названия в ID
            const statusId = editingProject.status
                ? findIdByValue(store_statuses, editingProject.status, 'name')
                : editingProject.status_id;

            // Для страны: может быть код (CH) или название. Пробуем найти по коду, потом по названию
            let countryId = editingProject.country_id;
            if (editingProject.country && !countryId) {
                countryId = findIdByValue(store_countries, editingProject.country, 'code');
                if (!countryId) countryId = findIdByValue(store_countries, editingProject.country, 'name');
            }

            // Для менеджера: ищем по email или по имени
            let managerId = editingProject.manager_id;
            if (editingProject.manager && !managerId) {
                const manager = project_managers?.find(m =>
                    m.email === editingProject.manager ||
                    `${m.first_name} ${m.last_name}` === editingProject.manager
                );
                managerId = manager?.id;
            }

            const clientId = editingProject.client
                ? findIdByValue(store_clients, editingProject.client, 'name')
                : editingProject.client_id;

            const departmentId = editingProject.department
                ? findIdByValue(store_departments, editingProject.department, 'name')
                : editingProject.department_id;

            const serviceLineId = editingProject.service_line
                ? findIdByValue(store_service_lines, editingProject.service_line, 'name')
                : editingProject.service_line_id;

            const taskTypeId = editingProject.task_type
                ? findIdByValue(store_task_types, editingProject.task_type, 'name')
                : editingProject.task_type_id;

            const serviceTypeId = editingProject.service_type
                ? findIdByValue(serviceType, editingProject.service_type, 'name')
                : editingProject.service_type_id;

            setProjectForm({
                ...projectForm,
                ic: editingProject.name || '',
                description: editingProject.description || '',
                project_color: editingProject.project_color || '#1F4E78',
                status_id: statusId,
                country_id: countryId,
                manager_id: managerId,
                client_id: clientId,
                department_id: departmentId,
                service_line_id: serviceLineId,
                task_type_id: taskTypeId,
                is_chargeable: editingProject.is_chargeable ?? true,
                is_code_recurring: editingProject.is_code_recurring ?? false,
                service_type_id: serviceTypeId,
                entity: editingProject.entity || '',
                agreement_date: editingProject.agreement_date || '',
            });
            setErrors({});
        } else if (!open) {
            setIsDataReady(false);
            resetForm();
        }
    }, [open, editingProject, store_statuses, store_countries, project_managers, store_clients, store_departments, store_service_lines, store_task_types, serviceType]);

    const resetForm = () => {
        setProjectForm({
            ic: '',
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
            service_type_id: undefined,
            entity: '',
            agreement_date: '',
        });
        setCustomColor('#1F4E78');
        setErrors({});
    };

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
        setProjectForm({ ...projectForm, department_id: departmentId });
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!projectForm.ic?.trim()) {
            newErrors.ic = 'Project name is required';
        }
        if (!projectForm.description?.trim()) {
            newErrors.description = 'Project description is required';
        }

        if (!editingProject) {
            if (!projectForm.service_type_id || projectForm.service_type_id === 0) {
                newErrors.service_type = 'Service type is required';
            }
            if (!projectForm.entity?.trim()) {
                newErrors.entity = 'Entity is required';
            }
            if (!projectForm.agreement_date) {
                newErrors.agreement_date = 'Agreement date is required';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = () => {
        if (!validateForm()) {
            toast.error('Please fill in all required fields');
            return;
        }

        setIsSubmitting(true);

        const projectData = {
            name: projectForm.ic,
            description: projectForm.description,
            project_color: projectForm.project_color,
            is_chargeable: projectForm.is_chargeable,
            is_code_recurring: projectForm.is_code_recurring || false,
            status: projectForm.status_id ? Number(projectForm.status_id) : undefined,
            country: projectForm.country_id ? Number(projectForm.country_id) : undefined,
            manager: projectForm.manager_id ? Number(projectForm.manager_id) : undefined,
            client: projectForm.client_id ? Number(projectForm.client_id) : undefined,
            department: projectForm.department_id ? Number(projectForm.department_id) : undefined,
            service_line: projectForm.service_line_id ? Number(projectForm.service_line_id) : undefined,
            task_type: projectForm.task_type_id ? Number(projectForm.task_type_id) : undefined,
            service_type: projectForm.service_type_id ? Number(projectForm.service_type_id) : undefined,
            entity: projectForm.entity || undefined,
            agreement_date: projectForm.agreement_date || undefined,
        };

        if (editingProject) {
            editProject(
                { project_data: projectData, project_id: editingProject.id },
                {
                    onSuccess: () => {
                        toast.success('Project updated successfully');
                        getProjects();
                        onOpenChange(false);
                        resetForm();
                        setIsSubmitting(false);
                    },
                    onError: (error) => {
                        toast.error(`Failed to update project: ${error.message || 'Unknown error'}`);
                        setIsSubmitting(false);
                    },
                }
            );
        } else {
            sendProject(projectData, {
                onSuccess: () => {
                    toast.success('Project created successfully');
                    getProjects();
                    onOpenChange(false);
                    resetForm();
                    setIsSubmitting(false);
                },
                onError: (error) => {
                    toast.error(`Failed to create project: ${error.message || 'Unknown error'}`);
                    setIsSubmitting(false);
                },
            });
        }
    };

    // --- Вспомогательные функции для рендеринга ---
    const getActiveStatuses = () => {
        if (!store_statuses || !Array.isArray(store_statuses)) return [];
        return store_statuses.filter(status => status.is_active !== false);
    };

    const getActiveStoreCountries = () => {
        if (!store_countries || !Array.isArray(store_countries)) return [];
        return store_countries.filter(country => country.is_active !== false);
    };

    const getActiveManagers = () => {
        if (!project_managers || !Array.isArray(project_managers)) return [];
        return project_managers;
    };

    const getActiveStoreClients = () => {
        if (!store_clients || !Array.isArray(store_clients)) return [];
        return store_clients.filter(client => client.is_active !== false);
    };

    const getActiveStoreServiceLines = () => {
        if (!store_service_lines || !Array.isArray(store_service_lines)) return [];
        return store_service_lines.filter(serviceLine => serviceLine.is_active !== false);
    };

    const getActiveStoreTaskTypes = () => {
        if (!store_task_types || !Array.isArray(store_task_types)) return [];
        return store_task_types.filter(taskType => taskType.is_active !== false);
    };

    const renderStatuses = () => {
        const activeStatuses = getActiveStatuses();
        if (activeStatuses.length === 0) return <SelectItem value="none" disabled>No statuses available</SelectItem>;
        return activeStatuses.map(status => (
            <SelectItem key={status.id} value={status.id.toString()}>{status.name}</SelectItem>
        ));
    };

    const renderCountries = () => {
        const activeCountries = getActiveStoreCountries();
        if (activeCountries.length === 0) return <SelectItem value="none" disabled>No countries available</SelectItem>;
        return activeCountries.map(country => (
            <SelectItem key={country.id} value={country.id.toString()}>{country.name} ({country.code})</SelectItem>
        ));
    };

    const renderManagers = () => {
        const activeManagers = getActiveManagers();

        if (isLoadingManagers) {
            return <SelectItem value="none" disabled>Loading managers...</SelectItem>;
        }

        if (!activeManagers || !Array.isArray(activeManagers) || activeManagers.length === 0) {
            return <SelectItem value="none" disabled>No managers available</SelectItem>;
        }

        return activeManagers.map(manager => (
            <SelectItem key={manager.id} value={manager.id.toString()}>
                {manager.first_name} {manager.last_name}
            </SelectItem>
        ));
    };

    const renderClients = () => {
        const activeClients = getActiveStoreClients();
        if (activeClients.length === 0) return <SelectItem value="none" disabled>No clients available</SelectItem>;
        return activeClients.map(client => (
            <SelectItem key={client.id} value={client.id.toString()}>{client.name}</SelectItem>
        ));
    };

    const renderServiceLines = () => {
        const activeServiceLines = getActiveStoreServiceLines();
        if (activeServiceLines.length === 0) return <SelectItem value="none" disabled>No service lines available</SelectItem>;
        return activeServiceLines.map(serviceLine => (
            <SelectItem key={serviceLine.id} value={serviceLine.id.toString()}>{serviceLine.name}</SelectItem>
        ));
    };

    const renderTaskTypes = () => {
        const activeTaskTypes = getActiveStoreTaskTypes();
        if (activeTaskTypes.length === 0) return <SelectItem value="none" disabled>No task types available</SelectItem>;
        return activeTaskTypes.map(taskType => (
            <SelectItem key={taskType.id} value={taskType.id.toString()}>{taskType.name}</SelectItem>
        ));
    };

    const renderServiceTypes = () => {
        if (!serviceType || !Array.isArray(serviceType) || serviceType.length === 0) {
            return <SelectItem value="none" disabled>No service types available</SelectItem>;
        }
        return serviceType.map((type: any) => (
            <SelectItem key={type.id} value={type.id.toString()}>{type.name}</SelectItem>
        ));
    };

    const renderDepartments = () => {
        if (!store_departments || !Array.isArray(store_departments)) {
            return <SelectItem value="none" disabled>Loading departments...</SelectItem>;
        }
        if (store_departments.length === 0) return <SelectItem value="none" disabled>No departments available</SelectItem>;
        return store_departments.map(department => (
            <SelectItem key={department.id} value={department.id.toString()}>{department.name}</SelectItem>
        ));
    };

    const isLoading = isSubmitting;

    // Если данные ещё не загружены, показываем индикатор загрузки
    if (open && editingProject && !isDataReady) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent>
                    {/* FIX: Add hidden DialogTitle for accessibility */}
                    <VisuallyHidden>
                        <DialogTitle>Loading Project Data</DialogTitle>
                    </VisuallyHidden>
                    <div className="flex justify-center items-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <span className="ml-2">Loading project data...</span>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

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
                    {/* Project Name и Recurring */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="project-name">IC *</Label>
                            <Input
                                id="project-name"
                                value={projectForm.ic || ''} // FIX: Ensure value is never undefined
                                onChange={(e) => {
                                    setProjectForm({ ...projectForm, ic: e.target.value });
                                    if (errors.ic) setErrors(prev => ({ ...prev, ic: '' }));
                                }}
                                placeholder="Enter ic"
                                className={errors.ic ? 'border-red-500' : ''}
                            />
                            {errors.ic && <p className="text-sm text-red-500">{errors.ic}</p>}
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

                    {/* Description и Color */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="project-description">Project Description *</Label>
                            <Textarea
                                id="project-description"
                                value={projectForm.description || ''} // FIX: Ensure value is never undefined
                                onChange={(e) => {
                                    setProjectForm({ ...projectForm, description: e.target.value });
                                    if (errors.description) setErrors(prev => ({ ...prev, description: '' }));
                                }}
                                placeholder="Enter project description..."
                                rows={3}
                                className={`resize-none overflow-y-auto ${errors.description ? 'border-red-500' : ''}`}
                                style={{ height: '80px' }}
                            />
                            {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
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

                    {/* Status, Chargeable, Country, Department */}
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
                                    checked={projectForm.is_chargeable || false}
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
                                    <SelectValue placeholder={isDepartmentsLoading ? "Loading departments..." : "Select department"} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Select department</SelectItem>
                                    {renderDepartments()}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Manager, Client, Service Line, Task Type */}
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

                    {/* Service Type, Entity, Agreement Date */}
                    <div className="grid grid-cols-4 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="service-type">Service Type {!editingProject && '*'}</Label>
                            <Select
                                value={projectForm.service_type_id?.toString() || "none"}
                                onValueChange={(value: string) => {
                                    setProjectForm({
                                        ...projectForm,
                                        service_type_id: value !== "none" ? parseInt(value) : undefined,
                                    });
                                    if (errors.service_type) setErrors(prev => ({ ...prev, service_type: '' }));
                                }}
                            >
                                <SelectTrigger id="service-type" className={errors.service_type ? 'border-red-500' : ''}>
                                    <SelectValue placeholder="Select service type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Select service type</SelectItem>
                                    {renderServiceTypes()}
                                </SelectContent>
                            </Select>
                            {errors.service_type && <p className="text-sm text-red-500">{errors.service_type}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="entity">Entity {!editingProject && '*'}</Label>
                            <Input
                                id="entity"
                                value={projectForm.entity || ''}
                                onChange={(e) => {
                                    setProjectForm({ ...projectForm, entity: e.target.value });
                                    if (errors.entity) setErrors(prev => ({ ...prev, entity: '' }));
                                }}
                                placeholder="Enter entity name"
                                className={errors.entity ? 'border-red-500' : ''}
                            />
                            {errors.entity && <p className="text-sm text-red-500">{errors.entity}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="agreement-date">Agreement Date {!editingProject && '*'}</Label>
                            <Input
                                id="agreement-date"
                                type="date"
                                value={projectForm.agreement_date || ''}
                                onChange={(e) => {
                                    setProjectForm({ ...projectForm, agreement_date: e.target.value });
                                    if (errors.agreement_date) setErrors(prev => ({ ...prev, agreement_date: '' }));
                                }}
                                className={errors.agreement_date ? 'border-red-500' : ''}
                            />
                            {errors.agreement_date && <p className="text-sm text-red-500">{errors.agreement_date}</p>}
                        </div>
                    </div>
                </div>

                <DialogFooter className="display-flex pt-4 justify-between">
                    <Button variant="outline" onClick={handleClose}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={isLoading}
                        style={{ backgroundColor: '#1F4E78' }}
                        className="disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Saving...' : editingProject ? 'Save Changes' : 'Add Project'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}