import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Switch } from './ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Search, X, ListTodo, Briefcase, Plane, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { useGetCLientProjecs, useGetCountryClients } from '../hooks/useClients';
import { useGetProjectTasks } from '../hooks/useProject';
import { useEditTimeEntry, useGetTimeEntriesStats } from '../hooks/useTimeEntry';
import { useUserStore } from '../store/UsersStore';

interface ProjectOption {
    value: string;
    label: string;
    code: string;
    project_id?: number;
}

interface EditTimeEntryDialogProps {
    open: boolean;
    editingEntry: any;
    onClose: () => void;
    onSuccess: () => void;
    updateEntry: (id: string, data: any) => void;
}

export function EditTimeEntryDialog({
    open,
    editingEntry,
    onClose,
    onSuccess,
    updateEntry
}: EditTimeEntryDialogProps) {
    // Состояния для формы редактирования
    const [editProjectId, setEditProjectId] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [editDate, setEditDate] = useState('');
    const [editHours, setEditHours] = useState('');
    const [editTaskType, setEditTaskType] = useState('');
    const [editTaskId, setEditTaskId] = useState('');
    const [editCountry, setEditCountry] = useState('');
    const [editClient, setEditClient] = useState('');
    const [editWeekendsIncluded, setEditWeekendsIncluded] = useState(false);
    const [editHolidaysIncluded, setEditHolidaysIncluded] = useState(false);
    const [editLeaveTypeId, setEditLeaveTypeId] = useState('');

    // Состояния для EXTERNAL блока
    const [editClientSearch, setEditClientSearch] = useState('');
    const [isLoadingEditProjects, setIsLoadingEditProjects] = useState(false);
    const [isLoadingEditTasks, setIsLoadingEditTasks] = useState(false);
    const [editProjectOptions, setEditProjectOptions] = useState<ProjectOption[]>([]);
    const [editProjectTaskOptions, setEditProjectTaskOptions] = useState<Array<{ value: string, label: string, task_type: string }>>([]);
    const [isLoadingEditClients, setIsLoadingEditClients] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingCountries, setIsLoadingCountries] = useState(true);

    // Локальное состояние для стран
    const [countryOptions, setCountryOptions] = useState<Array<{ value: string, label: string, code: string }>>([]);

    const { mutate: editTimeEntry } = useEditTimeEntry();
    const { mutate: getClientProjects } = useGetCLientProjecs();
    const { mutate: getProjectTasks } = useGetProjectTasks();
    const { mutate: getClients } = useGetCountryClients();
    const { mutate: getTimeEntriesStats } = useGetTimeEntriesStats();

    const countriesFromStore = useUserStore((state) => state.countries);
    const internal_tasks = useUserStore((state) => state.internal_tasks);
    const leaves = useUserStore((state) => state.leaves);
    const selectedCountry = useUserStore((state) => state.selectedCountry);
    const clients = selectedCountry?.clients ?? [];
    const setCurrentMonth = useUserStore((state) => state.setCurrentMonth);
    const setCurrentYear = useUserStore((state) => state.setCurrentYear);

    // Функция для обновления статистики по дате
    const refreshStatsForDate = (dateString: string) => {
        const targetDate = new Date(dateString);
        const year = targetDate.getFullYear();
        const month = targetDate.getMonth(); // 0-11
        const monthForApi = month + 1; // API ожидает 1-12

        console.log('Refreshing stats after edit for:', { year, month, monthForApi });

        // Обновляем store с текущим месяцем и годом
        setCurrentMonth(month.toString());
        setCurrentYear(year.toString());

        // Отправляем запрос на статистику
        getTimeEntriesStats(
            { year: year.toString(), month: monthForApi.toString() },
            {
                onSuccess: (data) => {
                    console.log('Stats refreshed after edit:', data);
                },
                onError: (error) => {
                    console.error('Failed to refresh stats after edit:', error);
                }
            }
        );
    };

    // Загружаем страны
    useEffect(() => {
        if (countriesFromStore && Array.isArray(countriesFromStore)) {
            if (countriesFromStore.length > 0) {
                const options = countriesFromStore
                    .filter(country => country && country.id != null && country.name)
                    .map((country: any) => ({
                        value: String(country.id),
                        label: country.name,
                        code: country.code || ''
                    }));
                setCountryOptions(options);
                setIsLoadingCountries(false);
            } else {
                setIsLoadingCountries(false);
            }
        }
    }, [countriesFromStore]);

    // Опции клиентов
    const allClientOptions = useMemo(() => {
        if (!clients || !Array.isArray(clients)) return [];
        return clients
            .filter(client => client && client.id != null && client.name)
            .map(client => ({
                value: String(client.id),
                label: client.name
            }));
    }, [clients]);

    const editClientOptions = useMemo(() => {
        if (!editClientSearch.trim()) return allClientOptions;
        const searchLower = editClientSearch.toLowerCase();
        return allClientOptions.filter(option =>
            option.label.toLowerCase().includes(searchLower)
        );
    }, [allClientOptions, editClientSearch]);

    const internalTaskOptions = useMemo(() => {
        if (!internal_tasks || !Array.isArray(internal_tasks)) return [];
        return internal_tasks
            .filter((task: any) => task && task.id != null && task.name)
            .map((task: any) => ({
                value: String(task.id),
                label: task.name || 'Unnamed Task',
                task_type: task.task_type || ''
            }));
    }, [internal_tasks]);

    const leaveOptions = useMemo(() => {
        if (!leaves || !Array.isArray(leaves)) return [];
        return leaves
            .filter((leave: any) => leave && leave.id != null && leave.name)
            .map((leave: any) => ({
                value: String(leave.id),
                label: leave.name || 'Unnamed Leave',
                task_type: leave.task_type || ''
            }));
    }, [leaves]);

    // Загрузка данных при открытии диалога
    useEffect(() => {
        if (editingEntry && open) {
            initializeFormData();
        }
    }, [editingEntry, open]);

    // Повторная попытка загрузки external данных когда появятся страны
    useEffect(() => {
        if (open && editingEntry?.type === 'external' && !isLoadingCountries && countryOptions.length > 0 && !editCountry) {
            loadExternalData();
        }
    }, [open, editingEntry, isLoadingCountries, countryOptions]);

    const initializeFormData = () => {
        if (!editingEntry) return;

        setEditDate(editingEntry.date || editingEntry.startDate);
        setEditHours(editingEntry.hours?.toString() || '');
        setEditDescription(editingEntry.description || '');
        setEditTaskType(editingEntry.task_type || '');
        setEditWeekendsIncluded(editingEntry.weekends_included || false);
        setEditHolidaysIncluded(editingEntry.holidays_included || false);
        setEditClientSearch('');

        if (editingEntry.type === 'internal') {
            const matchedInternalTask = internalTaskOptions.find(t =>
                t.label === editingEntry.task || t.label === editingEntry.taskName
            );
            setEditTaskId(matchedInternalTask ? matchedInternalTask.value : '');
        } else if (editingEntry.type === 'vacation') {
            const matchedLeave = leaveOptions.find(l =>
                l.label === editingEntry.task || l.label === editingEntry.taskName
            );
            setEditLeaveTypeId(matchedLeave ? matchedLeave.value : '');
        } else if (editingEntry.type === 'external') {
            if (!isLoadingCountries && countryOptions.length > 0) {
                loadExternalData();
            }
        }
    };

    const loadExternalData = () => {
        if (!editingEntry) return;

        const matchedCountry = countryOptions.find(c =>
            c.label === String(editingEntry.country_name) ||
            c.code === String(editingEntry.country) ||
            c.value === String(editingEntry.country)
        );

        const countryId = matchedCountry ? matchedCountry.value : '';
        setEditCountry(countryId);
        setEditClient('');
        setEditProjectId('');
        setEditProjectOptions([]);
        setEditProjectTaskOptions([]);

        if (countryId) {
            setIsLoadingEditClients(true);
            getClients(countryId, {
                onSuccess: (clientsData) => {
                    setIsLoadingEditClients(false);

                    let clientsList = [];
                    if (Array.isArray(clientsData)) {
                        clientsList = clientsData;
                    } else if (clientsData?.clients && Array.isArray(clientsData.clients)) {
                        clientsList = clientsData.clients;
                    } else if (clientsData?.data && Array.isArray(clientsData.data)) {
                        clientsList = clientsData.data;
                    } else {
                        clientsList = [];
                    }

                    const matchedClient = clientsList.find((c: any) => {
                        if (c.name === String(editingEntry.client)) return true;
                        if (String(c.id) === String(editingEntry.client)) return true;
                        return false;
                    });

                    if (matchedClient) {
                        setEditClient(String(matchedClient.id));
                        loadProjectsForClient(String(matchedClient.id));
                    }
                },
                onError: () => {
                    setIsLoadingEditClients(false);
                    toast.error('Failed to load clients');
                }
            });
        }
    };

    const loadProjectsForClient = (clientId: string) => {
        setIsLoadingEditProjects(true);
        getClientProjects(clientId, {
            onSuccess: (data: any) => {
                let projectCodes = [];
                if (data?.project_codes && Array.isArray(data.project_codes)) {
                    projectCodes = data.project_codes;
                } else if (Array.isArray(data)) {
                    projectCodes = data;
                } else {
                    projectCodes = [];
                }

                const options = projectCodes.map((pc: any) => ({
                    value: String(pc.id),
                    label: data.name || pc.name || 'Project',
                    code: pc.code,
                    project_id: pc.project || pc.project_id
                }));

                setEditProjectOptions(options);
                setIsLoadingEditProjects(false);

                const matchedProject = options.find((p: any) => p.code === String(editingEntry.project_code));
                if (matchedProject) {
                    setEditProjectId(matchedProject.value);
                    if (matchedProject.project_id) {
                        loadTasksForProject(String(matchedProject.project_id));
                    }
                }
            },
            onError: () => {
                setIsLoadingEditProjects(false);
                toast.error('Failed to load projects');
            }
        });
    };

    const loadTasksForProject = (projectId: string) => {
        setIsLoadingEditTasks(true);
        getProjectTasks(projectId, {
            onSuccess: (data: any) => {
                let tasksList = [];
                if (data?.tasks && Array.isArray(data.tasks)) {
                    tasksList = data.tasks;
                } else if (Array.isArray(data)) {
                    tasksList = data;
                } else {
                    tasksList = [];
                }

                const tasks = tasksList.map((task: any) => ({
                    value: String(task.id),
                    label: task.name || 'Unnamed Task',
                    task_type: task.task_type || ''
                }));

                setEditProjectTaskOptions(tasks);
                setIsLoadingEditTasks(false);

                const matchedTask = tasks.find((t: any) =>
                    String(t.value) === String(editingEntry.task) ||
                    t.label === String(editingEntry.task)
                );

                if (matchedTask) {
                    setEditTaskId(matchedTask.value);
                }
            },
            onError: () => {
                setIsLoadingEditTasks(false);
                toast.error('Failed to load tasks');
            }
        });
    };

    const handleEditClientChange = (clientId: string) => {
        setEditClient(clientId);
        setEditProjectId('');
        setEditTaskId('');
        setEditProjectOptions([]);
        setEditProjectTaskOptions([]);
        setEditClientSearch('');

        if (clientId) {
            setIsLoadingEditProjects(true);
            getClientProjects(clientId, {
                onSuccess: (data: any) => {
                    let projectCodes = [];
                    if (data?.project_codes && Array.isArray(data.project_codes)) {
                        projectCodes = data.project_codes;
                    } else if (Array.isArray(data)) {
                        projectCodes = data;
                    } else {
                        projectCodes = [];
                    }

                    const options = projectCodes.map((pc: any) => ({
                        value: String(pc.id),
                        label: data.name || pc.name || 'Project',
                        code: pc.code,
                        project_id: pc.project || pc.project_id
                    }));

                    setEditProjectOptions(options);
                    setIsLoadingEditProjects(false);
                },
                onError: (error) => {
                    console.error('Failed to load projects:', error);
                    toast.error('Failed to load projects');
                    setIsLoadingEditProjects(false);
                }
            });
        }
    };

    const handleEditProjectChange = (selectedCodeId: string) => {
        setEditProjectId(selectedCodeId);
        setEditTaskId('');
        setEditProjectTaskOptions([]);

        const selectedProjectCode = editProjectOptions.find(p => p.value === selectedCodeId);
        const projectIdForTasks = selectedProjectCode?.project_id;

        if (projectIdForTasks) {
            setIsLoadingEditTasks(true);
            getProjectTasks(String(projectIdForTasks), {
                onSuccess: (data: any) => {
                    let tasksList = [];
                    if (data?.tasks && Array.isArray(data.tasks)) {
                        tasksList = data.tasks;
                    } else if (Array.isArray(data)) {
                        tasksList = data;
                    } else {
                        tasksList = [];
                    }

                    const tasks = tasksList.map((task: any) => ({
                        value: String(task.id),
                        label: task.name || 'Unnamed Task',
                        task_type: task.task_type || ''
                    }));

                    setEditProjectTaskOptions(tasks);
                    setIsLoadingEditTasks(false);
                },
                onError: (error) => {
                    console.error('Failed to load tasks:', error);
                    toast.error('Failed to load tasks');
                    setIsLoadingEditTasks(false);
                }
            });
        }
    };

    const handleUpdate = () => {
        if (!editingEntry) return;

        const hoursNum = parseFloat(editHours);
        if (isNaN(hoursNum) || hoursNum < 0.5 || hoursNum > 24) {
            toast.error('Hours must be between 0.5 and 24');
            return;
        }

        setIsSubmitting(true);

        const editData: any = {
            date: editDate,
            hours: hoursNum,
            description: editDescription,
        };

        if (editingEntry?.type === 'internal' && editTaskId) {
            editData.task = parseInt(editTaskId);
            const selectedTask = internalTaskOptions.find(t => t.value === editTaskId);
            if (selectedTask?.task_type) {
                editData.task_type = selectedTask.task_type;
            }
        } else if (editingEntry?.type === 'vacation' && editLeaveTypeId) {
            editData.task = parseInt(editLeaveTypeId);
            const selectedLeave = leaveOptions.find(l => l.value === editLeaveTypeId);
            if (selectedLeave?.task_type) {
                editData.task_type = selectedLeave.task_type;
            }
        } else if (editingEntry?.type === 'external') {
            if (editTaskId) {
                editData.task = parseInt(editTaskId);
                const selectedTask = editProjectTaskOptions.find(t => t.value === editTaskId);
                if (selectedTask?.task_type) {
                    editData.task_type = selectedTask.task_type;
                }
            }
            if (editCountry && editCountry !== editingEntry.country) {
                editData.country = parseInt(editCountry);
            }
            if (editClient && editClient !== editingEntry.client) {
                editData.client = parseInt(editClient);
            }
            if (editProjectId && editProjectId !== editingEntry.projectId) {
                editData.project_code = parseInt(editProjectId);
            }
        }

        if (editWeekendsIncluded !== editingEntry.weekends_included) {
            editData.weekends_included = editWeekendsIncluded;
        }

        if (editHolidaysIncluded !== editingEntry.holidays_included) {
            editData.holidays_included = editHolidaysIncluded;
        }

        editTimeEntry(
            {
                day_id: editingEntry.id,
                body: editData,
            },
            {
                onSuccess: (data) => {
                    console.log('Entry updated successfully:', data);
                    updateEntry(editingEntry.id, {
                        projectId: editProjectId,
                        projectName: editingEntry.projectName,
                        projectColor: editingEntry.projectColor,
                        projectCode: editingEntry.projectCode,
                        description: editDescription,
                        date: editDate,
                        hours: hoursNum,
                    });
                    toast.success('Entry updated successfully');

                    // ✅ Обновляем статистику после успешного редактирования
                    refreshStatsForDate(editDate);

                    onClose();
                    onSuccess();
                },
                onError: (error: any) => {
                    console.error('Failed to update entry:', error);
                    toast.error(error?.message || 'Failed to update entry. Please try again.');
                },
                onSettled: () => {
                    setIsSubmitting(false);
                }
            }
        );
    };

    const getEntryIcon = (taskType: string) => {
        const lowerType = taskType?.toLowerCase() || '';
        if (lowerType.includes('internal')) return <Briefcase className="w-4 h-4" />;
        if (lowerType.includes('leave') || lowerType.includes('vacation') || lowerType.includes('holiday')) return <Plane className="w-4 h-4" />;
        return <Calendar className="w-4 h-4" />;
    };

    return (
        <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="w-[800px] max-w-[800px]" style={{ width: '800px' }}>
                <DialogHeader>
                    <DialogTitle>Edit Time Entry</DialogTitle>
                    <DialogDescription>
                        Update the details of your time entry. Click save when you're done.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Entry Type - полная ширина */}
                    <div className="space-y-2">
                        <Label>Entry Type</Label>
                        <div className="flex items-center gap-2 p-2 border rounded-md bg-slate-50">
                            {getEntryIcon(editingEntry?.task_type || editingEntry?.type || '')}
                            <span className="capitalize font-medium">
                                {editingEntry?.type || editingEntry?.task_type || 'Unknown'}
                            </span>
                        </div>
                    </div>

                    {/* Date и Hours - в 2 колонки */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-date">Date *</Label>
                            <Input
                                id="edit-date"
                                type="date"
                                value={editDate}
                                onChange={(e) => setEditDate(e.target.value)}
                                disabled={isSubmitting}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-hours">Hours *</Label>
                            <Input
                                id="edit-hours"
                                type="number"
                                step="0.5"
                                min="0.5"
                                max="24"
                                value={editHours}
                                onChange={(e) => setEditHours(e.target.value)}
                                disabled={isSubmitting}
                                required
                            />
                            <p className="text-xs text-slate-500">Min: 0.5, Max: 24</p>
                        </div>
                    </div>

                    {/* EXTERNAL БЛОК - в 2 колонки */}
                    {editingEntry?.type === 'external' && (
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                {/* Country */}
                                <div className="space-y-2">
                                    <Label htmlFor="edit-country">Projects Country *</Label>
                                    <Select
                                        value={editCountry}
                                        onValueChange={(value) => {
                                            setEditCountry(value);
                                            setEditClient('');
                                            setEditProjectId('');
                                            setEditTaskId('');
                                            setEditProjectOptions([]);
                                            setEditProjectTaskOptions([]);
                                            setEditClientSearch('');
                                            setIsLoadingEditClients(true);
                                            getClients(value, {
                                                onSuccess: () => setIsLoadingEditClients(false),
                                                onError: () => setIsLoadingEditClients(false),
                                            });
                                        }}
                                        disabled={isSubmitting || countryOptions.length === 0 || isLoadingCountries}
                                    >
                                        <SelectTrigger id="edit-country">
                                            <SelectValue placeholder={
                                                isLoadingCountries ? "Loading countries..." :
                                                    countryOptions.length === 0 ? "No countries available" :
                                                        "Select country"
                                            } />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {countryOptions.map(countryOption => (
                                                <SelectItem key={countryOption.value} value={countryOption.value}>
                                                    {countryOption.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Client */}
                                <div className="space-y-2">
                                    <Label htmlFor="edit-client">Client *</Label>
                                    <div className="relative">
                                        <Select
                                            key={editCountry || 'no-country'}
                                            value={editClient}
                                            onValueChange={handleEditClientChange}
                                            disabled={!editCountry || isLoadingEditClients || isSubmitting}
                                        >
                                            <SelectTrigger id="edit-client" className="w-full">
                                                <SelectValue placeholder={
                                                    !editCountry
                                                        ? "Select country first"
                                                        : isLoadingEditClients
                                                            ? "Loading clients..."
                                                            : allClientOptions.length === 0
                                                                ? "No clients available"
                                                                : "Select client"
                                                } />
                                            </SelectTrigger>
                                            <SelectContent
                                                className="w-full"
                                                position="popper"
                                                sideOffset={5}
                                                onCloseAutoFocus={(e) => e.preventDefault()}
                                                onEscapeKeyDown={(e) => e.stopPropagation()}
                                            >
                                                <div className="flex flex-col" style={{ height: '320px' }}>
                                                    <div className="sticky top-0 bg-white z-20 p-2 border-b shadow-sm flex-shrink-0">
                                                        <div className="relative">
                                                            <Input
                                                                placeholder="Search client..."
                                                                value={editClientSearch}
                                                                onChange={(e) => setEditClientSearch(e.target.value)}
                                                                className="pl-8 pr-8 h-8 text-sm"
                                                                onClick={(e) => e.stopPropagation()}
                                                                onKeyDown={(e) => e.stopPropagation()}

                                                            />
                                                            {editClientSearch && (
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setEditClientSearch('');
                                                                    }}
                                                                    className="absolute right-2 top-1/2 transform -translate-y-1/2"
                                                                >
                                                                    <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex-1 overflow-y-auto min-h-0">
                                                        {isLoadingEditClients ? (
                                                            <div className="p-4 text-center text-gray-500 text-sm">Loading clients...</div>
                                                        ) : editClientOptions.length === 0 ? (
                                                            <div className="p-4 text-center text-gray-500 text-sm">
                                                                {editClientSearch ? `No clients found for "${editClientSearch}"` : "No clients available"}
                                                            </div>
                                                        ) : (
                                                            editClientOptions.map(clientOption => (
                                                                <SelectItem key={clientOption.value} value={clientOption.value}>
                                                                    <span className="font-medium">{clientOption.label}</span>
                                                                </SelectItem>
                                                            ))
                                                        )}
                                                    </div>
                                                </div>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {/* Project */}
                                <div className="space-y-2">
                                    <Label htmlFor="edit-project">Projects code *</Label>
                                    <Select
                                        value={editProjectId}
                                        onValueChange={handleEditProjectChange}
                                        disabled={!editClient || editProjectOptions.length === 0 || isLoadingEditProjects || isSubmitting}
                                    >
                                        <SelectTrigger id="edit-project">
                                            {isLoadingEditProjects ? (
                                                <div className="flex items-center">
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                                                    Loading projects...
                                                </div>
                                            ) : (
                                                <SelectValue placeholder={!editClient ? "Select client first" : editProjectOptions.length === 0 ? "No projects available" : "Select project"} />
                                            )}
                                        </SelectTrigger>
                                        <SelectContent className="max-h-[300px] overflow-y-auto">
                                            {editProjectOptions.map(projectOption => (
                                                <SelectItem key={projectOption.value} value={projectOption.value}>
                                                    <div className="flex flex-col py-1">
                                                        <div className="flex items-center gap-2">
                                                            {projectOption.code && (
                                                                <code className="text-xs font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                                                    {projectOption.code}
                                                                </code>
                                                            )}
                                                            <span className="font-medium">{projectOption.label}</span>
                                                        </div>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Task */}
                                <div className="space-y-2" >
                                    <Label htmlFor="edit-task">Task *</Label>
                                    <Select
                                        value={editTaskId}
                                        onValueChange={(value) => {
                                            setEditTaskId(value);
                                            const selectedTask = editProjectTaskOptions.find(t => t.value === value);
                                            if (selectedTask?.task_type) {
                                                setEditTaskType(selectedTask.task_type);
                                            }
                                        }}
                                        disabled={!editProjectId || editProjectTaskOptions.length === 0 || isLoadingEditTasks || isSubmitting}
                                    >
                                        <SelectTrigger id="edit-task" className="w-full">
                                            {isLoadingEditTasks ? (
                                                <div className="flex items-center">
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                                                    Loading tasks...
                                                </div>
                                            ) : (
                                                <div className="flex items-center">
                                                    <ListTodo className="w-4 h-4 mr-2 text-gray-400" />
                                                    <SelectValue placeholder={!editProjectId ? "Select project first" : editProjectTaskOptions.length === 0 ? "No tasks available" : "Select task"} />
                                                </div>
                                            )}
                                        </SelectTrigger>
                                        <SelectContent className="max-h-[300px] overflow-y-auto" style={{ height: '200px' }}>
                                            {editProjectTaskOptions.map(taskOption => (
                                                <SelectItem key={taskOption.value} value={taskOption.value}>
                                                    <span className="font-medium">{taskOption.label}</span>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </>
                    )}

                    {/* INTERNAL БЛОК - полная ширина */}
                    {editingEntry?.type === 'internal' && (
                        <div className="space-y-2">
                            <Label>Task *</Label>
                            <Select
                                value={editTaskId}
                                onValueChange={(value) => {
                                    setEditTaskId(value);
                                    const selectedTask = internalTaskOptions.find(t => t.value === value);
                                    if (selectedTask?.task_type) {
                                        setEditTaskType(selectedTask.task_type);
                                    }
                                }}
                                disabled={isSubmitting}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select a task" />
                                </SelectTrigger>
                                <SelectContent>
                                    {internalTaskOptions.map(taskOption => (
                                        <SelectItem key={taskOption.value} value={taskOption.value}>
                                            {taskOption.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {/* VACATIONS БЛОК - полная ширина */}
                    {editingEntry?.type === 'vacation' && (
                        <div className="space-y-2">
                            <Label htmlFor="edit-leave-type">Leave Type *</Label>
                            <Select
                                value={editLeaveTypeId}
                                onValueChange={(value) => {
                                    setEditLeaveTypeId(value);
                                    const selectedLeave = leaveOptions.find(l => l.value === value);
                                    if (selectedLeave?.task_type) {
                                        setEditTaskType(selectedLeave.task_type);
                                    }
                                }}
                                disabled={isSubmitting || leaveOptions.length === 0}
                            >
                                <SelectTrigger id="edit-leave-type" className="w-full">
                                    <div className="flex items-center">
                                        <ListTodo className="w-4 h-4 mr-2 text-gray-400" />
                                        <SelectValue placeholder={leaveOptions.length === 0 ? "No leave types available" : "Select leave type"} />
                                    </div>
                                </SelectTrigger>
                                <SelectContent>
                                    {leaveOptions.map(leaveOption => (
                                        <SelectItem key={leaveOption.value} value={leaveOption.value}>
                                            <span className="font-medium">{leaveOption.label}</span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {/* Description - полная ширина */}
                    <div className="space-y-2">
                        <Label htmlFor="edit-description">Description *</Label>
                        <Textarea
                            id="edit-description"
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                            rows={3}
                            disabled={isSubmitting}
                            required
                        />
                    </div>


                </div>

                <DialogFooter className="flex justify-between">
                    <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleUpdate}
                        style={{ backgroundColor: '#1F4E78' }}
                        disabled={isSubmitting || !editDate || !editHours}
                    >
                        {isSubmitting ? 'Saving...' : 'Save Changes'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}