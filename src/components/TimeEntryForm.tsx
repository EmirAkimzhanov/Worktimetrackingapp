import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Switch } from './ui/switch';
import { ToggleGroup, ToggleGroupItem } from './ui/toggle-group';
import { Plus, Calendar as CalendarIcon, CalendarRange, ListTodo, Briefcase, Plane } from 'lucide-react';
import { useTimeTracker } from './TimeTrackerContext';
import { toast } from 'sonner@2.0.3';
import { useGetHolidayTimeEntrys, useGetTimeEntrys, useSendTimeEntrys } from '../hooks/useTimeEntry';
import { useUserStore } from '../store/UsersStore';
import { useGetCountries } from '../hooks/useCountries';
import { Country } from '../types/countries';
import { useGetCLientProjecs, useGetCountryClients } from '../hooks/useClients';
import { Client } from '../types/client';
import { Project, Task } from '../types/project';
import { useGetProjectTasks } from '../hooks/useProject';
import { useGetInterbalTasks } from '../hooks/useTasks';
import { useGetLeaves } from '../hooks/useLeaves';
import { Leave } from '../types/leave';

type InputMode = 'single' | 'range';
type TabType = 'internal' | 'external' | 'vacations';

export function TimeEntryForm() {
  const { addMultipleEntries } = useTimeTracker();
  const [inputMode, setInputMode] = useState<InputMode>('single');
  const [activeTab, setActiveTab] = useState<TabType>('internal');
  const [projectId, setProjectId] = useState('');
  const [selectedTask, setSelectedTask] = useState('');
  const [selectedLeaveType, setSelectedLeaveType] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [hours, setHours] = useState('8');
  const [includeWeekends, setIncludeWeekends] = useState(true);
  const [country, setCountry] = useState<string>('');
  const [client, setClient] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCountriesLoading, setIsCountriesLoading] = useState(false);
  const [isLoadingInternalTasks, setIsLoadingInternalTasks] = useState(false);
  const [isLoadingLeaves, setIsLoadingLeaves] = useState(false);
  const [localCountryOptions, setLocalCountryOptions] = useState<Array<{ value: string, label: string, code: string }>>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const countriesLoadedRef = useRef(false);
  const internalTasksLoadedRef = useRef(false);
  const leavesLoadedRef = useRef(false);

  const { mutate: sendEntrys } = useSendTimeEntrys();
  const { mutate: getCountries } = useGetCountries();
  const { mutate: getClients, isPending: isLoadingClients } = useGetCountryClients();
  const { mutate: getClientProjects } = useGetCLientProjecs();
  const { mutate: getProjectTasks } = useGetProjectTasks();
  const { mutate: getInternalTasks } = useGetInterbalTasks();
  const { mutate: getLeaves } = useGetLeaves();
  const { mutate: getTimeEntrys } = useGetTimeEntrys();
  const { mutate: getCalendarHolidays } = useGetHolidayTimeEntrys();


  // Получаем данные из стора
  const countries = useUserStore((state) => state.countries);
  const selectedCountry = useUserStore((s) => s.selectedCountry);
  const clients = selectedCountry?.clients ?? [];
  const client_projects = useUserStore((state) => state.client_projects);
  const setClientProjects = useUserStore((state) => state.setClientProjects);
  const project_tasks = useUserStore((state) => state.project_tasks);
  const setProjectTasks = useUserStore((state) => state.setProjectTasks);
  const clearProjectTasks = useUserStore((state) => state.clearProjectTasks);
  const internal_tasks = useUserStore((state) => state.internal_tasks);
  const setInternalTasks = useUserStore((state) => state.setInternalTasks);
  const leaves = useUserStore((state) => state.leaves);

  // Преобразуем клиентов в формат для Select
  const clientOptions = useMemo(() => {
    if (!Array.isArray(clients) || clients.length === 0) return [];

    return clients
      .filter(client => client && client.id != null && client.name)
      .map((client: Client) => ({
        value: String(client.id),
        label: client.name || 'Unnamed Client',
        group: client.group || '',
        sector: client.sector || '',
        personal_number: client.personal_number || ''
      }));
  }, [clients]);

  // Преобразуем проекты в формат для Select
  const projectOptions = useMemo(() => {
    if (!client_projects?.projects || !Array.isArray(client_projects.projects)) return [];

    return client_projects.projects
      .filter((project: Project) => project && project.id != null && project.name)
      .map((project: Project) => ({
        value: String(project.id),
        label: project.name || 'Unnamed Project',
        code: project.code || '',
        description: project.description || '',
        is_chargeable: project.is_chargeable || false,
        status: project.status || '',
        manager: project.manager || ''
      }));
  }, [client_projects]);

  // Преобразуем задачи проекта в формат для Select
  const projectTaskOptions = useMemo(() => {
    if (!project_tasks?.tasks || !Array.isArray(project_tasks.tasks)) return [];

    return project_tasks.tasks
      .filter((task: Task) => task && task.id != null && task.name)
      .map((task: Task) => ({
        value: String(task.id),
        label: task.name || 'Unnamed Task',
        task_type: task.task_type || ''
      }));
  }, [project_tasks]);

  // Преобразуем внутренние задачи в формат для Select
  const internalTaskOptions = useMemo(() => {
    if (!internal_tasks || !Array.isArray(internal_tasks)) return [];

    return internal_tasks
      .filter((task: Task) => task && task.id != null && task.name)
      .map((task: Task) => ({
        value: String(task.id),
        label: task.name || 'Unnamed Task',
        task_type: task.task_type || ''
      }));
  }, [internal_tasks]);

  // Преобразуем leaves в формат для Select
  const leaveOptions = useMemo(() => {
    if (!leaves || !Array.isArray(leaves)) {
      return [];
    }

    return leaves
      .filter(leave => leave && leave.id != null && leave.name)
      .map((leave: Leave) => ({
        value: String(leave.id),
        label: leave.name || 'Unnamed Leave',
        task_type: leave.task_type || ''
      }));
  }, [leaves]);

  // Функция для преобразования стран в опции
  const convertCountriesToOptions = (countriesData: any): Array<{ value: string, label: string, code: string }> => {
    if (!countriesData) return [];

    let countriesArray: Country[] = [];

    if (Array.isArray(countriesData)) {
      countriesArray = countriesData;
    } else if (countriesData && typeof countriesData === 'object') {
      countriesArray = Object.values(countriesData);
    }

    const options = countriesArray
      .filter(country => country && country.id != null && country.name)
      .map((country: Country) => ({
        value: String(country.id),
        label: country.name || 'Unknown Country',
        code: country.code || ''
      }));

    return options;
  };

  // Обновляем опции стран при изменении данных в сторе
  useEffect(() => {
    if (countries && !countriesLoadedRef.current) {
      const options = convertCountriesToOptions(countries);
      if (options.length > 0) {
        setLocalCountryOptions(options);
        countriesLoadedRef.current = true;
        setIsCountriesLoading(false);
      }
    }
  }, [countries]);

  // Загружаем страны при монтировании компонента
  useEffect(() => {
    if (!countriesLoadedRef.current) {
      setIsCountriesLoading(true);

      const hasCountriesInStore = countries &&
        ((Array.isArray(countries) && countries.length > 0) ||
          (!Array.isArray(countries) && Object.keys(countries).length > 0));

      if (!hasCountriesInStore) {
        getCountries(undefined, {
          onSuccess: () => {
            // После успешной загрузки, страны будут в сторе
          },
          onError: (error) => {
            console.error('Failed to load countries:', error);
            toast.error('Failed to load countries');
            setIsCountriesLoading(false);
            countriesLoadedRef.current = true;
          }
        });
      } else {
        const options = convertCountriesToOptions(countries);
        setLocalCountryOptions(options);
        setIsCountriesLoading(false);
        countriesLoadedRef.current = true;
      }
    }
  }, []);

  // Загружаем внутренние задачи при монтировании компонента
  useEffect(() => {
    if (!internalTasksLoadedRef.current) {
      setIsLoadingInternalTasks(true);

      getInternalTasks(undefined, {
        onSuccess: (data) => {
          setInternalTasks(data);
          setIsLoadingInternalTasks(false);
          internalTasksLoadedRef.current = true;

          if (data && data.length > 0) {
            toast.success(`Loaded ${data.length} internal tasks`);
          } else {
            toast.warning('No internal tasks found');
          }
        },
        onError: (error) => {
          console.error('Failed to load internal tasks:', error);
          toast.error('Failed to load internal tasks');
          setIsLoadingInternalTasks(false);
          internalTasksLoadedRef.current = true;
        }
      });
    }
  }, []);

  // Загружаем leaves при монтировании компонента
  useEffect(() => {
    if (!leavesLoadedRef.current) {
      setIsLoadingLeaves(true);

      getLeaves(undefined, {
        onSuccess: (data) => {
          setIsLoadingLeaves(false);
          leavesLoadedRef.current = true;

          if (data && data.length > 0) {
            toast.success(`Loaded ${data.length} leave types`);
          } else {
            toast.warning('No leave types found');
          }
        },
        onError: (error) => {
          console.error('Failed to load leaves:', error);
          toast.error('Failed to load leave types');
          setIsLoadingLeaves(false);
          leavesLoadedRef.current = true;
        }
      });
    }
  }, []);

  // Загружаем клиентов при выборе страны
  useEffect(() => {
    if (country && activeTab === 'external') {
      getClients(country);
    }
  }, [country, activeTab]);

  // Функция для загрузки проектов при выборе клиента
  const handleClientChange = (clientId: string) => {
    setClient(clientId);
    setProjectId('');
    setSelectedTask('');
    clearProjectTasks();

    if (clientId) {
      setIsLoadingProjects(true);

      getClientProjects(clientId, {
        onSuccess: (data) => {
          setClientProjects(data);
          setIsLoadingProjects(false);

          if (data?.projects?.length > 0) {
            toast.success(`Loaded ${data.projects.length} projects for the client`);
          } else {
            toast.warning('No projects found for this client');
          }
        },
        onError: (error) => {
          console.error('Failed to load projects:', error);
          toast.error('Failed to load projects');
          setIsLoadingProjects(false);
          setClientProjects(null);
        }
      });
    } else {
      setClientProjects(null);
    }
  };

  // Функция для загрузки задач при выборе проекта
  const handleProjectChange = (projectId: string) => {
    setProjectId(projectId);
    setSelectedTask('');

    if (projectId) {
      setIsLoadingTasks(true);

      getProjectTasks(projectId, {
        onSuccess: (data) => {
          setProjectTasks(data);
          setIsLoadingTasks(false);

          if (data?.tasks?.length > 0) {
            toast.success(`Loaded ${data.tasks.length} tasks for the project`);
          } else {
            toast.warning('No tasks found for this project');
          }
        },
        onError: (error) => {
          console.error('Failed to load project tasks:', error);
          toast.error('Failed to load project tasks');
          setIsLoadingTasks(false);
          setProjectTasks(null);
        }
      });
    } else {
      clearProjectTasks();
    }
  };

  const handleCountryChange = (countryId: string) => {
    setCountry(countryId);
    setClient('');
    setProjectId('');
    setSelectedTask('');
    setClientProjects(null);
    clearProjectTasks();
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    if (tab !== 'external') {
      setClientProjects(null);
      clearProjectTasks();
    }
    if (tab !== 'vacations') {
      setSelectedLeaveType('');
    }
  };

  const resetForm = () => {
    setSelectedTask('');
    setSelectedLeaveType('');
    setDescription('');
    setHours('8');
    setProjectId('');
  };

  const createRequestBody = (): any => {
    // Базовый объект с общими полями
    const baseBody = {
      description,
      hours: parseFloat(hours),
      ...(inputMode === 'single'
        ? { start_date: date, end_date: date }
        : { start_date: startDate, end_date: endDate, weekends_included: includeWeekends }
      )
    };

    // Добавляем поля в зависимости от активной вкладки
    switch (activeTab) {
      case 'internal':
        const selectedInternalTask = internalTaskOptions.find(t => t.value === selectedTask);
        return {
          ...baseBody,
          id: 0, // или генерируйте id
          country: null,
          client: null,
          project: null,
          task_type: selectedInternalTask?.task_type || null,
          task: selectedInternalTask?.value ? parseInt(selectedInternalTask.value) : null
        };

      case 'external':
        const selectedCountryObj = localCountryOptions.find(c => c.value === country);
        const selectedClient = clientOptions.find(c => c.value === client);
        const selectedProject = projectOptions.find(p => p.value === projectId);
        const selectedProjectTask = projectTaskOptions.find(t => t.value === selectedTask);

        return {
          ...baseBody,
          id: 0,
          country: selectedCountryObj?.value ? parseInt(selectedCountryObj.value) : null,
          // ОТПРАВЛЯЕМ ID КЛИЕНТА ВМЕСТО ИМЕНИ
          client: selectedClient?.value || null, // Изменено здесь
          project: selectedProject?.value ? parseInt(selectedProject.value) : null,
          task_type: selectedProjectTask?.task_type || null,
          task: selectedProjectTask?.value ? parseInt(selectedProjectTask.value) : null
        };

      case 'vacations':
        const selectedLeave = leaveOptions.find(l => l.value === selectedLeaveType);
        return {
          ...baseBody,
          id: 0,
          country: null,
          client: null,
          project: null,
          task_type: selectedLeave?.task_type || null,
          task: selectedLeave?.value ? parseInt(selectedLeave.value) : null
        };

      default:
        return baseBody;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Валидация
    if (activeTab === 'external') {
      if (!projectId || !selectedTask || !description || !hours || !country || !client) {
        toast.error('Please fill in all required fields');
        setIsSubmitting(false);
        return;
      }
    } else if (activeTab === 'internal') {
      if (!selectedTask || !description || !hours) {
        toast.error('Please fill in all required fields');
        setIsSubmitting(false);
        return;
      }
    } else if (activeTab === 'vacations') {
      if (!selectedLeaveType || !description || !hours) {
        toast.error('Please fill in all required fields');
        setIsSubmitting(false);
        return;
      }
    }

    const hoursNum = parseFloat(hours);
    if (isNaN(hoursNum) || hoursNum < 0.5 || hoursNum > 24) {
      toast.error('Hours must be between 0.5 and 24');
      setIsSubmitting(false);
      return;
    }

    if (inputMode === 'range') {
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (start > end) {
        toast.error('Start date must be before end date');
        setIsSubmitting(false);
        return;
      }
    }

    // Создаем тело запроса в новом формате
    const requestBody = createRequestBody();

    // Отправляем запрос
    sendEntrys(requestBody, {
      onSuccess: (data) => {
        // Создаем записи для локального состояния
        const entriesToAdd = [];
        const selectedCountryObj = localCountryOptions.find(c => c.value === country);
        const selectedClient = clientOptions.find(c => c.value === client);
        const selectedProject = projectOptions.find(p => p.value === projectId);
        const selectedProjectTask = projectTaskOptions.find(t => t.value === selectedTask);
        const selectedInternalTask = internalTaskOptions.find(t => t.value === selectedTask);
        const selectedLeave = leaveOptions.find(l => l.value === selectedLeaveType);

        if (inputMode === 'single') {
          // Одна запись
          let entry;

          if (activeTab === 'internal') {
            entry = {
              type: 'internal',
              task: selectedInternalTask?.label || selectedTask,
              task_id: selectedInternalTask?.value ? parseInt(selectedInternalTask.value) : undefined,
              description,
              date,
              hours: hoursNum,
            };
          } else if (activeTab === 'external') {
            entry = {
              type: 'external',
              projectId,
              projectName: selectedProject?.label || projectId,
              projectCode: selectedProject?.code || '',
              task: selectedProjectTask?.label || selectedTask,
              task_id: selectedProjectTask?.value ? parseInt(selectedProjectTask.value) : undefined,
              description,
              date,
              hours: hoursNum,
              country: selectedCountryObj?.label || country,
              client: selectedClient?.label || client,
              // Сохраняем ID клиента для локального состояния
              client_id: selectedClient?.value ? parseInt(selectedClient.value) : undefined,
            };
          } else if (activeTab === 'vacations') {
            entry = {
              type: 'vacation',
              leave_type: selectedLeave?.label || selectedLeaveType,
              leave_type_label: selectedLeave?.label || selectedLeaveType,
              leave_id: selectedLeave?.value ? parseInt(selectedLeave.value) : undefined,
              description,
              date,
              hours: hoursNum,
            };
          }

          if (entry) {
            entriesToAdd.push(entry);
          }
        } else {
          // Диапазон дат
          const start = new Date(startDate);
          const end = new Date(endDate);
          const currentDate = new Date(start);
          const endDateForLoop = new Date(end);
          endDateForLoop.setDate(endDateForLoop.getDate() + 1);

          while (currentDate < endDateForLoop) {
            const dayOfWeek = currentDate.getDay();
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

            if (includeWeekends || !isWeekend) {
              let entry;

              if (activeTab === 'internal') {
                entry = {
                  type: 'internal',
                  task: selectedInternalTask?.label || selectedTask,
                  task_id: selectedInternalTask?.value ? parseInt(selectedInternalTask.value) : undefined,
                  description,
                  date: currentDate.toISOString().split('T')[0],
                  hours: hoursNum,
                };
              } else if (activeTab === 'external') {
                entry = {
                  type: 'external',
                  projectId,
                  projectName: selectedProject?.label || projectId,
                  projectCode: selectedProject?.code || '',
                  task: selectedProjectTask?.label || selectedTask,
                  task_id: selectedProjectTask?.value ? parseInt(selectedProjectTask.value) : undefined,
                  description,
                  date: currentDate.toISOString().split('T')[0],
                  hours: hoursNum,
                  country: selectedCountryObj?.label || country,
                  client: selectedClient?.label || client,
                  // Сохраняем ID клиента для локального состояния
                  client_id: selectedClient?.value ? parseInt(selectedClient.value) : undefined,
                };
              } else if (activeTab === 'vacations') {
                entry = {
                  type: 'vacation',
                  leave_type: selectedLeave?.label || selectedLeaveType,
                  leave_type_label: selectedLeave?.label || selectedLeaveType,
                  leave_id: selectedLeave?.value ? parseInt(selectedLeave.value) : undefined,
                  description,
                  date: currentDate.toISOString().split('T')[0],
                  hours: hoursNum,
                };
              }

              if (entry) {
                entriesToAdd.push(entry);
              }
            }

            currentDate.setDate(currentDate.getDate() + 1);
          }
        }

        // Добавляем записи в локальное состояние
        if (entriesToAdd.length > 0) {
          addMultipleEntries(entriesToAdd);
          const message = inputMode === 'single'
            ? 'Time entry added successfully'
            : `Added ${entriesToAdd.length} time entries for the period ${startDate} to ${endDate}`;
          toast.success(message);
        } else {
          toast.warning('No time entries were added. Check your date range and weekend settings.');
        }

        getTimeEntrys(undefined, {
          onSuccess: (timeEntriesData) => {
          },
          onError: (error) => {
            console.error('Failed to refresh time entries:', error);
            // Не показываем ошибку пользователю, чтобы не мешать основному флоу
          }
        });

        resetForm();
      },
      onError: (error) => {
        console.error('Ошибка отправки:', error);
        toast.error('Failed to add time entry: ' + error.message);
      },
      onSettled: () => {
        setIsSubmitting(false);
      }
    });
  };

  const tabButtonClass = (tab: TabType) =>
    activeTab === tab
      ? "bg-blue-50 text-blue-700 border-blue-200"
      : "bg-gray-50 text-gray-600 border-transparent hover:bg-gray-100";

  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow border-t-4" style={{ borderTopColor: '#1F4E78' }}>
      <CardHeader style={{ backgroundColor: '#F1F5F9' }} className="border-b">
        <CardTitle className="flex items-center gap-2" style={{ color: '#1F4E78' }}>
          <Plus className="w-5 h-5" />
          Add Time Entry
        </CardTitle>
        <CardDescription>Track your work hours and vacations</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="mb-6">
          <div className="flex gap-2 p-1 bg-gray-100 rounded-xl w-fit" style={{ display: 'flex', marginBottom: '25px' }}>
            <button
              type="button"
              onClick={() => handleTabChange('internal')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-colors ${tabButtonClass('internal')}`}
            >
              <Briefcase className="w-4 h-4" />
              Internal
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('external')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-colors ${tabButtonClass('external')}`}
            >
              <CalendarIcon className="w-4 h-4" />
              External
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('vacations')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-colors ${tabButtonClass('vacations')}`}
            >
              <Plane className="w-4 h-4" />
              Vacations
            </button>
          </div>
        </div>

        {activeTab === 'internal' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <ToggleGroup
                type="single"
                value={inputMode}
                onValueChange={(value) => value && setInputMode(value as InputMode)}
                className="justify-start"
              >
                <ToggleGroupItem value="single" className="gap-2">
                  <CalendarIcon className="w-4 h-4" />
                  Single Date
                </ToggleGroupItem>
                <ToggleGroupItem value="range" className="gap-2">
                  <CalendarRange className="w-4 h-4" />
                  Date Range
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="task">Task *</Label>
              <Select
                value={selectedTask}
                onValueChange={setSelectedTask}
                disabled={isLoadingInternalTasks || internalTaskOptions.length === 0}
              >
                <SelectTrigger id="task" className="w-full">
                  {isLoadingInternalTasks ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                      Loading internal tasks...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <ListTodo className="w-4 h-4 mr-2 text-gray-400" />
                      <SelectValue
                        placeholder={
                          internalTaskOptions.length === 0
                            ? "No internal tasks available"
                            : "Select a task"
                        }
                      />
                    </div>
                  )}
                </SelectTrigger>
                <SelectContent>
                  {internalTaskOptions.map(taskOption => (
                    <SelectItem key={taskOption.value} value={taskOption.value}>
                      <div className="flex flex-col">
                        <span className="font-medium">{taskOption.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!isLoadingInternalTasks && internalTaskOptions.length === 0 && (
                <p className="text-sm text-amber-600">
                  No internal tasks available. Please contact administrator.
                </p>
              )}
            </div>

            {inputMode === 'single' ? (
              <div className="space-y-2">
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date *</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">End Date *</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2 p-3 bg-slate-50 rounded-lg">
                  <Switch
                    id="weekends"
                    checked={includeWeekends}
                    onCheckedChange={setIncludeWeekends}
                  />
                  <Label htmlFor="weekends" className="cursor-pointer">
                    {includeWeekends ? 'Include weekends' : 'Exclude weekends'}
                  </Label>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="hours">{inputMode === 'range' ? 'Hours per Day' : 'Hours'} *</Label>
              <Input
                id="hours"
                type="number"
                step="0.5"
                min="0.5"
                max="24"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                placeholder="8.0"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detailed description of the work done"
                rows={3}
                required
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="text-sm text-gray-500">
                Fields marked with * are required
              </div>
              <Button
                type="submit"
                style={{ backgroundColor: '#1F4E78' }}
                disabled={isSubmitting || !selectedTask}
                className="px-6"
              >
                {isSubmitting ? (
                  'Adding...'
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Time Entry{inputMode === 'range' ? 's' : ''}
                  </>
                )}
              </Button>
            </div>
          </form>
        )}

        {activeTab === 'external' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <ToggleGroup
                type="single"
                value={inputMode}
                onValueChange={(value) => value && setInputMode(value as InputMode)}
                className="justify-start"
              >
                <ToggleGroupItem value="single" className="gap-2">
                  <CalendarIcon className="w-4 h-4" />
                  Single Date
                </ToggleGroupItem>
                <ToggleGroupItem value="range" className="gap-2">
                  <CalendarRange className="w-4 h-4" />
                  Date Range
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="country">Country *</Label>
                <Select
                  value={country}
                  onValueChange={handleCountryChange}
                  disabled={isCountriesLoading || localCountryOptions.length === 0}
                >
                  <SelectTrigger id="country">
                    <SelectValue
                      placeholder={
                        isCountriesLoading
                          ? "Loading countries..."
                          : localCountryOptions.length === 0
                            ? "No countries available"
                            : country
                              ? localCountryOptions.find(c => c.value === country)?.label || "Select country"
                              : "Select country"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {localCountryOptions.map(countryOption => (
                      <SelectItem key={countryOption.value} value={countryOption.value}>
                        {countryOption.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!isCountriesLoading && localCountryOptions.length === 0 && (
                  <p className="text-sm text-amber-600">No countries available. Please contact administrator.</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="client">Client *</Label>
                <Select
                  value={client}
                  onValueChange={handleClientChange}
                  disabled={!country || clientOptions.length === 0 || isLoadingClients}
                >
                  <SelectTrigger id="client">
                    {isLoadingClients ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                        Loading clients...
                      </div>
                    ) : (
                      <SelectValue
                        placeholder={
                          !country
                            ? "Select country first"
                            : clientOptions.length === 0
                              ? "No clients available for this country"
                              : "Select client"
                        }
                      />
                    )}
                  </SelectTrigger>
                  <SelectContent>
                    {clientOptions.map(clientOption => (
                      <SelectItem key={clientOption.value} value={clientOption.value}>
                        <div className="flex flex-col">
                          <span className="font-medium">{clientOption.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {/* {country && clientOptions.length === 0 && !isLoadingClients && (
                  <p className="text-sm text-amber-600">
                    No clients available for this country.
                  </p>
                )} */}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="project">Project *</Label>
              <Select
                value={projectId}
                onValueChange={handleProjectChange}
                disabled={!client || projectOptions.length === 0 || isLoadingProjects}
              >
                <SelectTrigger id="project">
                  {isLoadingProjects ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                      Loading projects...
                    </div>
                  ) : (
                    <SelectValue
                      placeholder={
                        !client
                          ? "Select client first"
                          : projectOptions.length === 0
                            ? "No projects available for this client"
                            : "Select project"
                      }
                    />
                  )}
                </SelectTrigger>
                <SelectContent>
                  {projectOptions.map(projectOption => (
                    <SelectItem key={projectOption.value} value={projectOption.value}>
                      <div className="flex flex-col py-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{projectOption.label}</span>
                          {projectOption.is_chargeable && (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                              Chargeable
                            </span>
                          )}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {client && projectOptions.length === 0 && !isLoadingProjects && (
                <p className="text-sm text-amber-600">
                  No projects available for this client. Please select another client.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="task">Task *</Label>
              <Select
                value={selectedTask}
                onValueChange={setSelectedTask}
                disabled={!projectId || projectTaskOptions.length === 0 || isLoadingTasks}
              >
                <SelectTrigger id="task" className="w-full">
                  {isLoadingTasks ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                      Loading tasks...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <ListTodo className="w-4 h-4 mr-2 text-gray-400" />
                      <SelectValue
                        placeholder={
                          !projectId
                            ? "Select project first"
                            : projectTaskOptions.length === 0
                              ? "No tasks available for this project"
                              : "Select task"
                        }
                      />
                    </div>
                  )}
                </SelectTrigger>
                <SelectContent>
                  {projectTaskOptions.map(taskOption => (
                    <SelectItem key={taskOption.value} value={taskOption.value}>
                      <div className="flex flex-col">
                        <span className="font-medium">{taskOption.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                  {projectTaskOptions.length === 0 && internalTaskOptions.length > 0 && (
                    <>
                      <div className="px-2 py-1 text-xs text-gray-500">Project specific tasks not available</div>
                      {internalTaskOptions.map(taskOption => (
                        <SelectItem key={taskOption.value} value={taskOption.value}>
                          {taskOption.label}
                        </SelectItem>
                      ))}
                    </>
                  )}
                </SelectContent>
              </Select>
              {projectId && projectTaskOptions.length === 0 && !isLoadingTasks && (
                <p className="text-sm text-amber-600">
                  No specific tasks found for this project. You can select from internal tasks.
                </p>
              )}
            </div>

            {inputMode === 'single' ? (
              <div className="space-y-2">
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date *</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">End Date *</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2 p-3 bg-slate-50 rounded-lg">
                  <Switch
                    id="weekends"
                    checked={includeWeekends}
                    onCheckedChange={setIncludeWeekends}
                  />
                  <Label htmlFor="weekends" className="cursor-pointer">
                    {includeWeekends ? 'Include weekends' : 'Exclude weekends'}
                  </Label>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="hours">{inputMode === 'range' ? 'Hours per Day' : 'Hours'} *</Label>
              <Input
                id="hours"
                type="number"
                step="0.5"
                min="0.5"
                max="24"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                placeholder="8.0"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detailed description of the work done"
                rows={3}
                required
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="text-sm text-gray-500">
                Fields marked with * are required
              </div>
              <Button
                type="submit"
                style={{ backgroundColor: '#1F4E78' }}
                disabled={isSubmitting || !projectId || !selectedTask || !country || !client}
                className="px-6"
              >
                {isSubmitting ? (
                  'Adding...'
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Time Entry{inputMode === 'range' ? 's' : ''}
                  </>
                )}
              </Button>
            </div>
          </form>
        )}

        {activeTab === 'vacations' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <ToggleGroup
                type="single"
                value={inputMode}
                onValueChange={(value) => value && setInputMode(value as InputMode)}
                className="justify-start"
              >
                <ToggleGroupItem value="single" className="gap-2">
                  <CalendarIcon className="w-4 h-4" />
                  Single Date
                </ToggleGroupItem>
                <ToggleGroupItem value="range" className="gap-2">
                  <CalendarRange className="w-4 h-4" />
                  Date Range
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="leaveType">Leave Type *</Label>
              <Select
                value={selectedLeaveType}
                onValueChange={setSelectedLeaveType}
                disabled={isLoadingLeaves || leaveOptions.length === 0}
              >
                <SelectTrigger id="leaveType" className="w-full">
                  {isLoadingLeaves ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                      Loading leave types...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <ListTodo className="w-4 h-4 mr-2 text-gray-400" />
                      <SelectValue
                        placeholder={
                          leaveOptions.length === 0
                            ? "No leave types available"
                            : "Select leave type"
                        }
                      />
                    </div>
                  )}
                </SelectTrigger>
                <SelectContent>
                  {leaveOptions.map(leaveOption => (
                    <SelectItem key={leaveOption.value} value={leaveOption.value}>
                      <div className="flex flex-col">
                        <span className="font-medium">{leaveOption.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!isLoadingLeaves && leaveOptions.length === 0 && (
                <p className="text-sm text-amber-600">
                  No leave types available. Please contact administrator.
                </p>
              )}
            </div>

            {inputMode === 'single' ? (
              <div className="space-y-2">
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date *</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">End Date *</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2 p-3 bg-slate-50 rounded-lg">
                  <Switch
                    id="weekends"
                    checked={includeWeekends}
                    onCheckedChange={setIncludeWeekends}
                  />
                  <Label htmlFor="weekends" className="cursor-pointer">
                    {includeWeekends ? 'Include weekends' : 'Exclude weekends'}
                  </Label>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="hours">{inputMode === 'range' ? 'Hours per Day' : 'Hours'} *</Label>
              <Input
                id="hours"
                type="number"
                step="0.5"
                min="0.5"
                max="24"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                placeholder="8.0"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Vacation description"
                rows={3}
                required
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="text-sm text-gray-500">
                Fields marked with * are required
              </div>
              <Button
                type="submit"
                style={{ backgroundColor: '#1F4E78' }}
                disabled={isSubmitting || !selectedLeaveType}
                className="px-6"
              >
                {isSubmitting ? (
                  'Adding...'
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Vacation{inputMode === 'range' ? 's' : ''}
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}