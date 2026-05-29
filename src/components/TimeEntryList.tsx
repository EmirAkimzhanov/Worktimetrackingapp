import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { Edit, Trash2, FileText, Clock, Calendar, Briefcase, Plane, ChevronDown, ChevronUp, ListTodo, Search, X } from 'lucide-react';
import { useTimeTracker } from './TimeTrackerContext';
import { toast } from 'sonner';
import { useDeleteTimeEntry, useEditTimeEntry, useGetHolidayTimeEntrys, useGetTimeEntrys } from '../hooks/useTimeEntry';
import { useUserStore } from '../store/UsersStore';
import { useGetInterbalTasks } from '../hooks/useTasks';
import { useGetLeaves } from '../hooks/useLeaves';
import { useGetCLientProjecs, useGetCountryClients } from '../hooks/useClients';
import { useGetProjectTasks } from '../hooks/useProject';

interface ProjectCode {
  id: number;
  code: string;
  project: number;
  created_at: string;
}

interface ClientWithProjects {
  id: number;
  project_codes: ProjectCode[];
  name: string;
  group: string;
  personal_number: string;
  client_code: string;
  bvd: string;
  sector: number;
  country: number;
  pie: string | null;
}

interface ProjectOption {
  value: string;
  label: string;
  code: string;
  project_id?: number;
}

interface GroupedTimeEntry {
  id: string;
  key: string;
  dates: string[];
  startDate: string;
  endDate: string;
  count: number;
  totalHours: number;
  user: string;
  hours: number;
  description: string;
  country: string | null;
  client: string | null;
  project: string | null;
  projectId: string;
  projectColor: string;
  projectCode: string;
  projectName: string;
  task_type: string | null;
  task: string | null;
  task_id: number | null;
  taskName: string;
  weekends_included: boolean;
  type: string;
  country_name: string;
  entryIds: string[];
}

interface DeleteTarget {
  id: string;
  isGroup: boolean;
}

export function TimeEntryList() {
  const {
    entries: mockEntries,
    projects,
    filters,
    selectedEntries,
    setSelectedEntries,
    updateEntry,
    deleteEntry,
    deleteEntries
  } = useTimeTracker();

  const [editingEntry, setEditingEntry] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<DeleteTarget | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [deleteErrors, setDeleteErrors] = useState<string[]>([]);
  const [isLoadingSingleEntry, setIsLoadingSingleEntry] = useState(false);

  // Состояния для формы редактирования
  const [editProjectId, setEditProjectId] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editHours, setEditHours] = useState('');
  const [editTaskType, setEditTaskType] = useState('');
  const [editTask, setEditTask] = useState('');
  const [editTaskId, setEditTaskId] = useState('');
  const [editCountry, setEditCountry] = useState('');
  const [editClient, setEditClient] = useState('');
  const [editWeekendsIncluded, setEditWeekendsIncluded] = useState(false);
  const [editLeaveTypeId, setEditLeaveTypeId] = useState('');

  // Состояния для EXTERNAL блока
  const [editClientSearch, setEditClientSearch] = useState('');
  const [isLoadingEditProjects, setIsLoadingEditProjects] = useState(false);
  const [isLoadingEditTasks, setIsLoadingEditTasks] = useState(false);
  const [editProjectOptions, setEditProjectOptions] = useState<ProjectOption[]>([]);
  const [editProjectTaskOptions, setEditProjectTaskOptions] = useState<Array<{ value: string, label: string, task_type: string }>>([]);
  const [isLoadingEditClients, setIsLoadingEditClients] = useState(false);

  // Локальное состояние для стран (не зависит от стора)
  const [countryOptions, setCountryOptions] = useState<Array<{ value: string, label: string, code: string }>>([]);

  const { mutate: getTimeEntrys, isLoading: isLoadingEntries } = useGetTimeEntrys();
  const { mutate: getTimeEntryById } = useGetTimeEntrys(); // используем тот же хук с id
  const { mutate: getCalendarHolidays } = useGetHolidayTimeEntrys();
  const { mutate: editTimeEntry, isLoading: isEditing } = useEditTimeEntry();
  const { mutateAsync: deleteTimeEntry, isLoading: isDeletingMutation } = useDeleteTimeEntry();
  const { mutate: getInternalTasks } = useGetInterbalTasks();
  const { mutate: getLeaves } = useGetLeaves();
  const { mutate: getClientProjects } = useGetCLientProjecs();
  const { mutate: getProjectTasks } = useGetProjectTasks();
  const { mutate: getClients } = useGetCountryClients();
  const time_entry = useUserStore((state) => state.time_entry);
  const setTimeEntry = useUserStore((state) => state.setTimeEntry);

  const time_entries = useUserStore((state) => state.time_entries);
  const internal_tasks = useUserStore((state) => state.internal_tasks);
  const leaves = useUserStore((state) => state.leaves);
  const selectedCountry = useUserStore((state) => state.selectedCountry);
  const clients = selectedCountry?.clients ?? [];
  const countriesFromStore = useUserStore((state) => state.countries);

  const [isLoadingInternalTasks, setIsLoadingInternalTasks] = useState(false);
  const [isLoadingLeaves, setIsLoadingLeaves] = useState(false);

  const safeTimeEntries = Array.isArray(time_entries) ? time_entries : [];

  // Загружаем страны один раз при монтировании и сохраняем в локальное состояние
  useEffect(() => {
    if (countriesFromStore && Array.isArray(countriesFromStore) && countriesFromStore.length > 0) {
      const options = countriesFromStore
        .filter(country => country && country.id != null && country.name)
        .map((country: any) => ({
          value: String(country.id),
          label: country.name,
          code: country.code || ''
        }));
      setCountryOptions(options);
    }
  }, [countriesFromStore]);

  // Опции клиентов для редактирования
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

  // Загрузка внутренних задач
  useEffect(() => {
    if (!internal_tasks || internal_tasks.length === 0) {
      setIsLoadingInternalTasks(true);
      getInternalTasks(undefined, {
        onSuccess: () => {
          setIsLoadingInternalTasks(false);
        },
        onError: (error) => {
          console.error('Failed to load internal tasks:', error);
          setIsLoadingInternalTasks(false);
        }
      });
    }
  }, []);

  // Загрузка leaves
  useEffect(() => {
    if (!leaves || leaves.length === 0) {
      setIsLoadingLeaves(true);
      getLeaves(undefined, {
        onSuccess: () => {
          setIsLoadingLeaves(false);
        },
        onError: (error) => {
          console.error('Failed to load leaves:', error);
          setIsLoadingLeaves(false);
        }
      });
    }
  }, []);

  const getTaskName = (taskId: number | null, taskType: string | null): string => {
    if (!taskId) return taskType || 'Unknown Task';
    return taskType || `Task ${taskId}`;
  };

  const getCountryName = (countryId: string | number | null): string => {
    if (!countryId) return 'Unknown Country';
    const countryMap: Record<string, string> = {
      'KZ': 'Kazakhstan',
      'KG': 'Kyrgyzstan',
      'RU': 'Russia',
      'UZ': 'Uzbekistan',
      'TJ': 'Tajikistan',
      'TM': 'Turkmenistan'
    };
    if (typeof countryId === 'string') {
      return countryMap[countryId] || countryId;
    }
    return `Country ${countryId}`;
  };

  const determineEntryType = (entry: any): string => {
    if (entry.task_type) {
      const lowerTaskType = entry.task_type.toLowerCase();
      if (lowerTaskType.includes('internal')) return 'internal';
      if (lowerTaskType.includes('leave') || lowerTaskType.includes('vacation') || lowerTaskType.includes('holiday')) return 'vacation';
      return 'external';
    }
    return 'external';
  };

  const getEntryColor = (taskType: string) => {
    const lowerType = taskType.toLowerCase();
    if (lowerType.includes('internal')) return '#8B5CF6';
    if (lowerType.includes('leave') || lowerType.includes('vacation') || lowerType.includes('holiday')) return '#F59E0B';
    return '#10B981';
  };

  const getEntryIcon = (taskType: string) => {
    const lowerType = taskType.toLowerCase();
    if (lowerType.includes('internal')) return <Briefcase className="w-4 h-4" />;
    if (lowerType.includes('leave') || lowerType.includes('vacation') || lowerType.includes('holiday')) return <Plane className="w-4 h-4" />;
    return <Calendar className="w-4 h-4" />;
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const formatShortDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  useEffect(() => {
    loadTimeEntries();
    getCalendarHolidays();
  }, []);

  const loadTimeEntries = () => {
    return new Promise((resolve, reject) => {
      getTimeEntrys(undefined, {
        onSuccess: (data) => {
          console.log('Loaded time entries:', data);
          resolve(data);
        },
        onError: (error) => {
          console.error('Failed to load time entries:', error);
          toast.error('Failed to load time entries');
          reject(error);
        }
      });
    });
  };

  // Функция для загрузки одной записи по ID
  const loadSingleTimeEntry = (entryId: string) => {
    return new Promise((resolve, reject) => {
      getTimeEntryById({ id: entryId }, {
        onSuccess: (data) => {
          console.log('Loaded single time entry:', data);
          // Сохраняем в store
          setTimeEntry(data);
          resolve(data);
        },
        onError: (error) => {
          console.error('Failed to load time entry:', error);
          toast.error('Failed to load time entry');
          reject(error);
        }
      });
    });
  };

  const groupedEntries = useMemo(() => {
    if (safeTimeEntries.length === 0) return [];

    const transformedEntries = safeTimeEntries.map(entry => {
      const dateValue = entry.date || entry.start_date;
      return {
        id: entry.id?.toString() || Math.random().toString(),
        user: entry.user,
        date: dateValue,
        start_date: entry.start_date,
        end_date: entry.end_date,
        hours: entry.hours || 0,
        description: entry.description || '',
        country: entry.country,
        client: entry.client,
        project: entry.project,
        projectId: entry.project?.toString() || '',
        projectColor: entry.project_color || '#1F4E78',
        projectCode: entry.project_code || 'N/A',
        projectName: entry.client || 'External Project',
        task_type: entry.task_type,
        task: entry.task,
        task_id: entry.task,
        taskName: getTaskName(entry.task, entry.task_type),
        weekends_included: entry.weekends_included || false,
        type: determineEntryType(entry),
        country_name: getCountryName(entry.country),
      };
    });

    const groups = new Map<string, GroupedTimeEntry>();

    transformedEntries.forEach(entry => {
      const groupKey = `${entry.user}|${entry.hours}|${entry.description}|${entry.country}|${entry.client}|${entry.project}|${entry.projectId}|${entry.projectColor}|${entry.projectCode}|${entry.projectName}|${entry.task_type}|${entry.task}|${entry.task_id}|${entry.taskName}|${entry.weekends_included}|${entry.type}|${entry.country_name}`;

      if (groups.has(groupKey)) {
        const group = groups.get(groupKey)!;
        group.dates.push(entry.date);
        group.entryIds.push(entry.id);
        if (entry.date < group.startDate) group.startDate = entry.date;
        if (entry.date > group.endDate) group.endDate = entry.date;
        group.count++;
        group.totalHours += entry.hours;
      } else {
        groups.set(groupKey, {
          id: entry.id,
          key: groupKey,
          dates: [entry.date],
          startDate: entry.date,
          endDate: entry.date,
          count: 1,
          totalHours: entry.hours,
          user: entry.user,
          hours: entry.hours,
          description: entry.description,
          country: entry.country,
          client: entry.client,
          project: entry.project,
          projectId: entry.projectId,
          projectColor: entry.projectColor,
          projectCode: entry.projectCode,
          projectName: entry.projectName,
          task_type: entry.task_type,
          task: entry.task,
          task_id: entry.task_id,
          taskName: entry.taskName,
          weekends_included: entry.weekends_included,
          type: entry.type,
          country_name: entry.country_name,
          entryIds: [entry.id]
        });
      }
    });

    return Array.from(groups.values()).sort((a, b) => {
      return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
    });
  }, [safeTimeEntries]);

  const filteredGroups = useMemo(() => {
    return groupedEntries.filter(group => {
      if (filters.projects.length > 0 && !filters.projects.includes(group.projectId)) return false;
      if (filters.searchText) {
        const searchLower = filters.searchText.toLowerCase();
        const matchesSearch =
          group.description.toLowerCase().includes(searchLower) ||
          group.client?.toLowerCase().includes(searchLower) ||
          group.taskName?.toLowerCase().includes(searchLower) ||
          group.projectCode.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }
      if (filters.hoursRange !== 'all') {
        if (filters.hoursRange === 'low' && group.hours >= 4) return false;
        if (filters.hoursRange === 'medium' && (group.hours < 4 || group.hours > 8)) return false;
        if (filters.hoursRange === 'high' && group.hours <= 8) return false;
      }
      if (filters.dateRange) {
        const [start, end] = filters.dateRange;
        const groupStart = new Date(group.startDate);
        const groupEnd = new Date(group.endDate);
        const filterStart = new Date(start);
        const filterEnd = new Date(end);
        const hasOverlap = group.dates.some(date => {
          const dateObj = new Date(date);
          return dateObj >= filterStart && dateObj <= filterEnd;
        });
        if (!hasOverlap) return false;
      }
      return true;
    });
  }, [groupedEntries, filters]);

  const totalHours = useMemo(() => {
    return filteredGroups.reduce((sum, group) => sum + group.totalHours, 0);
  }, [filteredGroups]);

  const selectedTotalHours = useMemo(() => {
    return filteredGroups
      .filter(group => group.entryIds.some(id => selectedEntries.includes(id)))
      .reduce((sum, group) => {
        const selectedInGroup = group.entryIds.filter(id => selectedEntries.includes(id));
        return sum + (selectedInGroup.length * group.hours);
      }, 0);
  }, [filteredGroups, selectedEntries]);

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
        onSuccess: (data: ClientWithProjects) => {
          const options = data?.project_codes?.map(pc => ({
            value: String(pc.id),
            label: data.name,
            code: pc.code,
            project_id: pc.project
          })) || [];
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
          const tasks = data?.tasks?.map((task: any) => ({
            value: String(task.id),
            label: task.name || 'Unnamed Task',
            task_type: task.task_type || ''
          })) || [];
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

  const handleEdit = async (group: GroupedTimeEntry) => {
    const entryId = group.entryIds[0];

    // Находим запись в уже загруженных time_entries по ID
    const fullEntry = safeTimeEntries.find(entry => String(entry.id) === entryId);

    if (!fullEntry) {
      console.error('Entry not found in time_entries');
      toast.error('Failed to find entry data');
      return;
    }

    console.log('Found entry in time_entries:', fullEntry);

    const matchedInternalTask = internalTaskOptions.find(t =>
      t.label === fullEntry.task || t.label === group.taskName
    );
    const matchedLeave = leaveOptions.find(l =>
      l.label === fullEntry.task || l.label === group.taskName
    );

    setEditingEntry({
      ...group,
      id: entryId,
      date: fullEntry.date || group.startDate,
      task_id: fullEntry.task
    });
    setEditDate(fullEntry.date || group.startDate);
    setEditHours(fullEntry.hours?.toString() || group.hours.toString());
    setEditDescription(fullEntry.description || group.description);
    setEditTaskType(fullEntry.task_type || group.task_type || '');
    setEditWeekendsIncluded(fullEntry.weekends_included || group.weekends_included);
    setEditClientSearch('');
    setEditTask('');

    // Internal
    setEditTaskId(matchedInternalTask ? matchedInternalTask.value : '');

    // Vacation
    setEditLeaveTypeId(matchedLeave ? matchedLeave.value : '');

    if (group.type === 'external') {
      // Находим страну по названию или коду из полных данных
      const matchedCountry = countryOptions.find(c =>
        c.label === String(fullEntry.country_name) ||
        c.code === String(fullEntry.country) ||
        c.value === String(fullEntry.country)
      );

      const countryId = matchedCountry ? matchedCountry.value : '';
      console.log('Found country:', matchedCountry, 'for country:', fullEntry.country);

      setEditCountry(countryId);
      setEditClient('');
      setEditProjectId('');
      setEditProjectOptions([]);
      setEditProjectTaskOptions([]);

      if (countryId) {
        setIsLoadingEditClients(true);
        // Загружаем клиентов для выбранной страны
        getClients(countryId, {
          onSuccess: (clientsData) => {
            setIsLoadingEditClients(false);

            const clientsList = Array.isArray(clientsData) ? clientsData : [];
            console.log('Loaded clients:', clientsList);

            // Ищем клиента по имени
            const matchedClient = clientsList.find((c: any) => {
              if (c.name === String(fullEntry.client)) return true;
              if (String(c.id) === String(fullEntry.client)) return true;
              return false;
            });

            console.log('Found client:', matchedClient);

            if (matchedClient) {
              setEditClient(String(matchedClient.id));

              // Загружаем проекты для клиента
              setIsLoadingEditProjects(true);
              getClientProjects(String(matchedClient.id), {
                onSuccess: (data: ClientWithProjects) => {
                  const options = data?.project_codes?.map(pc => ({
                    value: String(pc.id),
                    label: data.name,
                    code: pc.code,
                    project_id: pc.project
                  })) || [];
                  setEditProjectOptions(options);
                  setIsLoadingEditProjects(false);

                  console.log('Loaded projects:', options);

                  // Ищем проект по коду
                  const matchedProject = options.find(p => {
                    if (p.code === String(fullEntry.project_code)) return true;
                    return false;
                  });

                  console.log('Found project:', matchedProject);

                  if (matchedProject) {
                    setEditProjectId(matchedProject.value);

                    // Загружаем задачи для проекта
                    if (matchedProject.project_id) {
                      setIsLoadingEditTasks(true);
                      getProjectTasks(String(matchedProject.project_id), {
                        onSuccess: (taskData: any) => {
                          const tasks = taskData?.tasks?.map((task: any) => ({
                            value: String(task.id),
                            label: task.name || 'Unnamed Task',
                            task_type: task.task_type || ''
                          })) || [];
                          setEditProjectTaskOptions(tasks);
                          setIsLoadingEditTasks(false);

                          console.log('Loaded tasks:', tasks);

                          // Ищем задачу по названию
                          const matchedTask = tasks.find((t: any) => {
                            if (t.label === String(fullEntry.task)) return true;
                            return false;
                          });

                          console.log('Found task:', matchedTask);
                          setEditTaskId(matchedTask ? matchedTask.value : '');
                        },
                        onError: () => setIsLoadingEditTasks(false)
                      });
                    }
                  }
                },
                onError: () => setIsLoadingEditProjects(false)
              });
            }
          },
          onError: () => setIsLoadingEditClients(false)
        });
      }
    } else {
      setEditCountry('');
      setEditClient('');
      setEditProjectId('');
      setEditProjectOptions([]);
      setEditProjectTaskOptions([]);
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
          setEditingEntry(null);
          loadTimeEntries();
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

  const handleDeleteSingle = (entryId: string) => {
    setEntryToDelete({ id: entryId, isGroup: false });
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!entryToDelete) return;
    setIsDeleting(true);
    try {
      await new Promise((resolve, reject) => {
        deleteTimeEntry(entryToDelete.id, {
          onSuccess: (data) => {
            console.log('Entry deleted successfully:', data);
            deleteEntry(entryToDelete.id);
            if (selectedEntries.includes(entryToDelete.id)) {
              setSelectedEntries(selectedEntries.filter(id => id !== entryToDelete.id));
            }
            resolve(data);
          },
          onError: (error) => {
            console.error('Failed to delete entry:', error);
            reject(error);
          }
        });
      });
      toast.success('Entry deleted successfully');
      setEntryToDelete(null);
      setDeleteDialogOpen(false);
      await loadTimeEntries();
    } catch (error: any) {
      console.error('Failed to delete entry:', error);
      toast.error(error?.message || 'Failed to delete entry. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkDelete = () => {
    if (selectedEntries.length === 0) {
      toast.error('No entries selected');
      return;
    }
    setBulkDeleteDialogOpen(true);
  };

  const confirmBulkDelete = async () => {
    if (selectedEntries.length === 0) {
      toast.error('No entries selected');
      setBulkDeleteDialogOpen(false);
      return;
    }
    setIsBulkDeleting(true);
    setDeleteErrors([]);
    try {
      const results = await Promise.allSettled(
        selectedEntries.map(id => deleteTimeEntry(id))
      );
      const successful: string[] = [];
      const failed: { id: string; error: any }[] = [];
      results.forEach((result, index) => {
        const id = selectedEntries[index];
        if (result.status === 'fulfilled') {
          successful.push(id);
        } else {
          failed.push({ id, error: result.reason });
        }
      });
      if (successful.length > 0) {
        deleteEntries(successful);
        setSelectedEntries([]);
        toast.success(`Deleted ${successful.length} of ${selectedEntries.length}`);
      }
      if (failed.length > 0) {
        toast.error(`Failed to delete ${failed.length} entries`);
        setDeleteErrors(failed.map(f => `ID ${f.id}`));
      }
      await loadTimeEntries();
    } catch (error) {
      console.error('Bulk delete error:', error);
      toast.error('Something went wrong');
    } finally {
      setIsBulkDeleting(false);
      setBulkDeleteDialogOpen(false);
    }
  };

  const toggleSelectGroup = (group: GroupedTimeEntry) => {
    const allSelected = group.entryIds.every(id => selectedEntries.includes(id));
    if (allSelected) {
      setSelectedEntries(selectedEntries.filter(id => !group.entryIds.includes(id)));
    } else {
      setSelectedEntries([...selectedEntries, ...group.entryIds]);
    }
  };

  const toggleSelectEntry = (entryId: string) => {
    if (selectedEntries.includes(entryId)) {
      setSelectedEntries(selectedEntries.filter(id => id !== entryId));
    } else {
      setSelectedEntries([...selectedEntries, entryId]);
    }
  };

  const toggleSelectAll = () => {
    const allEntryIds = filteredGroups.flatMap(group => group.entryIds);
    if (selectedEntries.length === allEntryIds.length) {
      setSelectedEntries([]);
    } else {
      setSelectedEntries(allEntryIds);
    }
  };

  const toggleGroupExpand = (groupKey: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupKey)) {
      newExpanded.delete(groupKey);
    } else {
      newExpanded.add(groupKey);
    }
    setExpandedGroups(newExpanded);
  };

  const formatDateRange = (group: GroupedTimeEntry) => {
    if (group.count === 1) {
      return formatDate(group.startDate);
    }
    const start = formatShortDate(group.startDate);
    const end = formatShortDate(group.endDate);
    if (group.startDate === group.endDate) {
      return formatDate(group.startDate);
    }
    return (
      <div className="flex flex-col">
        <div className="flex items-center gap-1 text-slate-600">
          <Calendar className="w-4 h-4" />
          <span>{start} - {end}</span>
          <Badge variant="outline" className="ml-2 text-xs">
            {group.count} days
          </Badge>
        </div>
        <span className="text-xs text-slate-500">
          Total: {group.totalHours}h ({group.hours}h/day)
        </span>
      </div>
    );
  };

  return (
    <>
      <Card className="shadow-md border-t-4 flex flex-col" style={{ borderTopColor: '#F59E0B', height: '700px' }}>
        <CardHeader style={{ backgroundColor: '#F1F5F9' }} className="border-b flex-shrink-0">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle className="flex items-center gap-2" style={{ color: '#1F4E78' }}>
                <FileText className="w-5 h-5" />
                Time Entries
              </CardTitle>
              <CardDescription>
                {filteredGroups.length} groups · {totalHours.toFixed(1)} total hours
                {safeTimeEntries && ` · ${safeTimeEntries.length} total entries in database`}
                {(isLoadingEntries || isSubmitting || isDeleting || isBulkDeleting || isLoadingSingleEntry) && ' · Loading...'}
              </CardDescription>
            </div>
            {selectedEntries.length > 0 && (
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-600 bg-white px-3 py-1 rounded-full border">
                  Selected: {selectedEntries.length} entries · {selectedTotalHours.toFixed(1)}h
                </span>
                <Button
                  onClick={handleBulkDelete}
                  size="sm"
                  style={{ backgroundColor: '#EF4444' }}
                  className="text-white hover:opacity-90"
                  disabled={isSubmitting || isDeleting || isBulkDeleting}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Selected
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-6 flex-1 overflow-hidden p-0">
          <div className="h-full flex flex-col">
            <div className="flex-1 overflow-y-auto px-6">
              <div className="rounded-md border">
                <Table>
                  <TableHeader className="sticky top-0 bg-white z-10">
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedEntries.length === filteredGroups.flatMap(g => g.entryIds).length && filteredGroups.length > 0}
                          onCheckedChange={toggleSelectAll}
                          disabled={isSubmitting || isDeleting || isBulkDeleting}
                        />
                      </TableHead>
                      <TableHead>Date Range</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Client/Project</TableHead>
                      <TableHead>Task</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Hours</TableHead>
                      <TableHead className="w-24">Expand</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredGroups.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-slate-500 py-8">
                          {safeTimeEntries.length > 0
                            ? 'No time entries match your filters'
                            : 'No time entries found. Add some using the form above.'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredGroups.map(group => (
                        <React.Fragment key={group.key}>
                          <TableRow className="hover:bg-slate-50 bg-slate-50/30">
                            <TableCell>
                              <Checkbox
                                checked={group.entryIds.every(id => selectedEntries.includes(id))}
                                onCheckedChange={() => toggleSelectGroup(group)}
                                disabled={isSubmitting || isDeleting || isBulkDeleting}
                              />
                            </TableCell>
                            <TableCell>{formatDateRange(group)}</TableCell>
                            <TableCell>
                              <Badge
                                style={{
                                  backgroundColor: getEntryColor(group.task_type || group.type),
                                  color: 'white'
                                }}
                                className="flex items-center gap-1"
                              >
                                {getEntryIcon(group.task_type || group.type)}
                                <span className="capitalize">{group.task_type || group.type}</span>
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                <div className="font-medium">{group.client || 'Internal'}</div>
                                {group.projectCode && group.projectCode !== 'N/A' && (
                                  <span className="text-xs text-slate-500 font-mono">{group.projectCode}</span>
                                )}
                                {group.country && (
                                  <span className="text-xs text-slate-500">{group.country_name}</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {group.taskName}
                                {group.task && (
                                  <div className="text-xs text-slate-500">ID: {group.task}</div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="max-w-xs">
                              <div className="truncate" title={group.description}>
                                {group.description}
                              </div>
                              {group.weekends_included && (
                                <span className="text-xs text-slate-500">Weekends included</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex flex-col items-end">
                                <div className="flex items-center justify-end gap-1">
                                  <Clock className="w-4 h-4 text-slate-500" />
                                  <span className="font-medium">{group.totalHours}h</span>
                                </div>
                                {group.count > 1 && (
                                  <span className="text-xs text-slate-500">
                                    {group.hours}h/day
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                {group.count > 1 ? (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => toggleGroupExpand(group.key)}
                                    disabled={isSubmitting || isDeleting || isBulkDeleting}
                                  >
                                    {expandedGroups.has(group.key) ? (
                                      <ChevronUp className="w-4 h-4" />
                                    ) : (
                                      <ChevronDown className="w-4 h-4" />
                                    )}
                                  </Button>
                                ) : (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleEdit(group)}
                                      disabled={isSubmitting || isDeleting || isBulkDeleting || isLoadingSingleEntry}
                                      className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleDeleteSingle(group.entryIds[0])}
                                      disabled={isSubmitting || isDeleting || isBulkDeleting}
                                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>

                          {expandedGroups.has(group.key) && group.dates.sort().map((date, idx) => (
                            <TableRow key={`${group.key}-${idx}`} className="bg-slate-100/50 text-sm">
                              <TableCell>
                                <Checkbox
                                  checked={selectedEntries.includes(group.entryIds[idx])}
                                  onCheckedChange={() => toggleSelectEntry(group.entryIds[idx])}
                                  disabled={isSubmitting || isDeleting || isBulkDeleting}
                                />
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2 text-slate-600 pl-6">
                                  <Calendar className="w-3 h-3" />
                                  {formatDate(date)}
                                </div>
                              </TableCell>
                              <TableCell colSpan={2} className="text-slate-500">
                                Individual entry
                              </TableCell>
                              <TableCell></TableCell>
                              <TableCell></TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <Clock className="w-3 h-3 text-slate-500" />
                                  <span>{group.hours}h</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                                    onClick={() => {
                                      const entry = {
                                        ...group,
                                        id: group.entryIds[idx],
                                        date: date,
                                        task_id: group.task_id
                                      };
                                      setEditingEntry(entry);
                                      setEditProjectId(group.projectId);
                                      setEditDescription(group.description);
                                      setEditDate(date);
                                      setEditHours(group.hours.toString());
                                      setEditTaskType(group.task_type || '');
                                      setEditTask(group.task || '');
                                      handleEdit({
                                        ...group,
                                        id: group.entryIds[idx],
                                        startDate: date,
                                        entryIds: [group.entryIds[idx]],
                                        task_id: group.task_id
                                      });
                                      setEditCountry(group.country || '');
                                      setEditClient(group.client || '');
                                      setEditWeekendsIncluded(group.weekends_included);
                                    }}
                                    disabled={isSubmitting || isDeleting || isBulkDeleting}
                                  >
                                    <Edit className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => handleDeleteSingle(group.entryIds[idx])}
                                    disabled={isSubmitting || isDeleting || isBulkDeleting}
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </React.Fragment>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
            <div className="border-t bg-slate-50 px-6 py-3 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-600">
                  Showing {filteredGroups.length} groups ({filteredGroups.reduce((sum, g) => sum + g.count, 0)} entries) of {groupedEntries.length} groups ({safeTimeEntries.length} entries in database)
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#8B5CF6' }}></div>
                      <span>Internal</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#10B981' }}></div>
                      <span>External</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#F59E0B' }}></div>
                      <span>Leave/Vacation</span>
                    </div>
                  </div>
                  <div className="text-sm font-medium text-slate-700">
                    Total hours: <span className="text-blue-600">{totalHours.toFixed(1)}h</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Диалог редактирования */}
      <Dialog open={!!editingEntry} onOpenChange={(open) => !open && setEditingEntry(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Time Entry</DialogTitle>
            <DialogDescription>
              Update the details of your time entry. Click save when you're done.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Entry Type</Label>
              <div className="flex items-center gap-2 p-2 border rounded-md bg-slate-50">
                {getEntryIcon(editingEntry?.task_type || editingEntry?.type || '')}
                <span className="capitalize font-medium">
                  {editingEntry?.type || editingEntry?.task_type || 'Unknown'}
                </span>
              </div>
            </div>

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

            {/* EXTERNAL БЛОК */}
            {editingEntry?.type === 'external' && (
              <>
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
                      setEditClientSearch(''); // Сбрасываем поиск при смене страны
                      setIsLoadingEditClients(true);
                      getClients(value, {
                        onSuccess: () => setIsLoadingEditClients(false),
                        onError: () => setIsLoadingEditClients(false),
                      });
                    }}
                    disabled={isSubmitting || countryOptions.length === 0}
                  >
                    <SelectTrigger id="edit-country">
                      <SelectValue placeholder={
                        countryOptions.length === 0
                          ? "Loading countries..."
                          : "Select country"
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

                <div className="space-y-2">
                  <Label htmlFor="edit-client">Client *</Label>
                  <div className="relative">
                    <Select
                      key={editCountry || 'no-country'} // Ключ на основе страны для пересоздания
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
                      <SelectContent className="w-full">
                        {/* Фиксированная высота и скролл для всего контента */}
                        <div className="max-h-[300px] overflow-y-auto">
                          {/* Строка поиска - sticky */}
                          <div className="sticky top-0 bg-white z-10 p-2 border-b">
                            <div className="relative">
                              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <Input
                                placeholder="Search client..."
                                value={editClientSearch}
                                onChange={(e) => setEditClientSearch(e.target.value)}
                                className="pl-8 pr-8 h-8 text-sm"
                                onClick={(e) => e.stopPropagation()}
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

                          {/* Список клиентов с ограничением высоты */}
                          <div className="max-h-[200px] overflow-y-auto">
                            {isLoadingEditClients ? (
                              <div className="p-4 text-center text-gray-500 text-sm">
                                Loading clients...
                              </div>
                            ) : editClientOptions.length === 0 ? (
                              <div className="p-4 text-center text-gray-500 text-sm">
                                {editClientSearch
                                  ? `No clients found for "${editClientSearch}"`
                                  : "No clients available"}
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

                <div className="space-y-2">
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
                    <SelectContent className="max-h-[300px] overflow-y-auto">
                      {editProjectTaskOptions.map(taskOption => (
                        <SelectItem key={taskOption.value} value={taskOption.value}>
                          <span className="font-medium">{taskOption.label}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {/* INTERNAL БЛОК */}
            {editingEntry?.type === 'internal' && (
              <div className="space-y-2">
                <Label>Task *</Label>
                <Select
                  value={editTaskId || (editingEntry?.task_id ? String(editingEntry.task_id) : '')}
                  onValueChange={(value) => {
                    setEditTaskId(value);
                    const selectedTask = internalTaskOptions.find(t => t.value === value);
                    if (selectedTask?.task_type) {
                      setEditTaskType(selectedTask.task_type);
                    }
                  }}
                  disabled={isSubmitting || isLoadingInternalTasks}
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

            {/* VACATIONS БЛОК */}
            {editingEntry?.type === 'vacation' && (
              <div className="space-y-2">
                <Label htmlFor="edit-leave-type">Leave Type *</Label>
                <Select
                  value={editLeaveTypeId || (editingEntry?.leave_id ? String(editingEntry.leave_id) : '')}
                  onValueChange={(value) => {
                    setEditLeaveTypeId(value);
                    const selectedLeave = leaveOptions.find(l => l.value === value);
                    if (selectedLeave?.task_type) {
                      setEditTaskType(selectedLeave.task_type);
                    }
                  }}
                  disabled={isSubmitting || isLoadingLeaves || leaveOptions.length === 0}
                >
                  <SelectTrigger id="edit-leave-type" className="w-full">
                    {isLoadingLeaves ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                        Loading leave types...
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <ListTodo className="w-4 h-4 mr-2 text-gray-400" />
                        <SelectValue placeholder={leaveOptions.length === 0 ? "No leave types available" : "Select leave type"} />
                      </div>
                    )}
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

            {/* Description */}
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

            {/* Weekends checkbox */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="edit-weekends"
                checked={editWeekendsIncluded}
                onCheckedChange={(checked) => setEditWeekendsIncluded(checked as boolean)}
                disabled={isSubmitting}
              />
              <Label htmlFor="edit-weekends" className="text-sm font-normal">
                Include weekends
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingEntry(null)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              style={{ backgroundColor: '#1F4E78' }}
              disabled={isSubmitting || !editDate || !editHours || !editDescription}
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Диалог подтверждения одиночного удаления */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Time Entry</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this time entry? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600"
              style={{ backgroundColor: '#EF4444' }}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Диалог массового удаления */}
      <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Selected Entries</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedEntries.length} selected entries? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBulkDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmBulkDelete}
              disabled={isBulkDeleting}
              className="bg-red-500 hover:bg-red-600"
              style={{ backgroundColor: '#EF4444' }}
            >
              {isBulkDeleting ? 'Deleting...' : 'Delete All'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}