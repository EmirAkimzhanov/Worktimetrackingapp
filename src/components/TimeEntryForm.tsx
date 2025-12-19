import React, { useState, useEffect } from 'react';
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

type InputMode = 'single' | 'range';
type TabType = 'internal' | 'external' | 'vacations';

// Предопределенные задачи по странам и клиентам
const TASK_OPTIONS = [
  { value: 'bug_fixing', label: 'Bug Fixing' },
  { value: 'feature_development', label: 'Feature Development' },
  { value: 'code_review', label: 'Code Review' },
  { value: 'testing', label: 'Testing' },
  { value: 'documentation', label: 'Documentation' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'planning', label: 'Planning' },
  { value: 'refactoring', label: 'Refactoring' },
  { value: 'research', label: 'Research' },
  { value: 'deployment', label: 'Deployment' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'support', label: 'Support' },
  { value: 'training', label: 'Training' },
  { value: 'analysis', label: 'Analysis' },
  { value: 'design', label: 'Design' },
];

// Страны для внешних проектов
const COUNTRIES = [
  { value: 'us', label: 'United States' },
  { value: 'uk', label: 'United Kingdom' },
  { value: 'de', label: 'Germany' },
  { value: 'fr', label: 'France' },
  { value: 'jp', label: 'Japan' },
  { value: 'ca', label: 'Canada' },
  { value: 'au', label: 'Australia' },
  { value: 'other', label: 'Other' },
];

// Клиенты для внешних проектов
const CLIENTS = [
  { value: 'client_a', label: 'Client A Corp.' },
  { value: 'client_b', label: 'Client B Ltd.' },
  { value: 'client_c', label: 'Client C GmbH' },
  { value: 'client_d', label: 'Client D Inc.' },
  { value: 'client_e', label: 'Client E S.A.' },
];

// Проекты, сгруппированные по странам и клиентам
const PROJECTS_BY_COUNTRY_CLIENT = {
  // США проекты
  us: {
    client_a: [
      { id: 'us_client_a_1', name: 'US Client A - E-commerce Platform', code: 'USA-CA1', color: '#3B82F6' },
      { id: 'us_client_a_2', name: 'US Client A - Mobile App', code: 'USA-CA2', color: '#10B981' },
    ],
    client_b: [
      { id: 'us_client_b_1', name: 'US Client B - Banking System', code: 'USA-CB1', color: '#8B5CF6' },
      { id: 'us_client_b_2', name: 'US Client B - Analytics Dashboard', code: 'USA-CB2', color: '#F59E0B' },
    ],
  },
  // Великобритания проекты
  uk: {
    client_a: [
      { id: 'uk_client_a_1', name: 'UK Client A - Healthcare Portal', code: 'UK-CA1', color: '#EF4444' },
      { id: 'uk_client_a_2', name: 'UK Client A - CRM System', code: 'UK-CA2', color: '#06B6D4' },
    ],
    client_c: [
      { id: 'uk_client_c_1', name: 'UK Client C - Logistics Platform', code: 'UK-CC1', color: '#84CC16' },
    ],
  },
  // Германия проекты
  de: {
    client_c: [
      { id: 'de_client_c_1', name: 'DE Client C - Automotive Software', code: 'DE-CC1', color: '#F97316' },
      { id: 'de_client_c_2', name: 'DE Client C - IoT Platform', code: 'DE-CC2', color: '#8B5CF6' },
    ],
    client_d: [
      { id: 'de_client_d_1', name: 'DE Client D - Manufacturing ERP', code: 'DE-CD1', color: '#EC4899' },
    ],
  },
  // Франция проекты
  fr: {
    client_e: [
      { id: 'fr_client_e_1', name: 'FR Client E - Fashion E-commerce', code: 'FR-CE1', color: '#14B8A6' },
    ],
  },
  // Япония проекты
  jp: {
    client_b: [
      { id: 'jp_client_b_1', name: 'JP Client B - Gaming Platform', code: 'JP-CB1', color: '#F43F5E' },
    ],
    client_d: [
      { id: 'jp_client_d_1', name: 'JP Client D - Robotics Software', code: 'JP-CD1', color: '#6366F1' },
    ],
  },
  // Канада проекты
  ca: {
    client_a: [
      { id: 'ca_client_a_1', name: 'CA Client A - Education Platform', code: 'CA-CA1', color: '#0EA5E9' },
    ],
    client_e: [
      { id: 'ca_client_e_1', name: 'CA Client E - Real Estate Portal', code: 'CA-CE1', color: '#10B981' },
    ],
  },
  // Австралия проекты
  au: {
    client_b: [
      { id: 'au_client_b_1', name: 'AU Client B - Tourism Platform', code: 'AU-CB1', color: '#F59E0B' },
    ],
    client_c: [
      { id: 'au_client_c_1', name: 'AU Client C - Mining Software', code: 'AU-CC1', color: '#84CC16' },
    ],
  },
  // Другие страны
  other: {
    client_a: [
      { id: 'other_client_a_1', name: 'Other Client A - General Development', code: 'OTH-CA1', color: '#6B7280' },
    ],
    client_e: [
      { id: 'other_client_e_1', name: 'Other Client E - Consulting Platform', code: 'OTH-CE1', color: '#9CA3AF' },
    ],
  },
};

// Задачи, сгруппированные по странам и клиентам
const TASKS_BY_COUNTRY_CLIENT = {
  // США задачи
  us: {
    client_a: ['feature_development', 'testing', 'deployment', 'support'],
    client_b: ['bug_fixing', 'code_review', 'analysis', 'maintenance'],
  },
  // Великобритания задачи
  uk: {
    client_a: ['documentation', 'meeting', 'planning', 'research'],
    client_c: ['feature_development', 'testing', 'deployment'],
  },
  // Германия задачи
  de: {
    client_c: ['bug_fixing', 'refactoring', 'analysis', 'design'],
    client_d: ['feature_development', 'testing', 'documentation'],
  },
  // Франция задачи
  fr: {
    client_e: ['design', 'research', 'planning', 'deployment'],
  },
  // Япония задачи
  jp: {
    client_b: ['testing', 'analysis', 'research', 'design'],
    client_d: ['feature_development', 'bug_fixing', 'maintenance'],
  },
  // Канада задачи
  ca: {
    client_a: ['documentation', 'training', 'support', 'meeting'],
    client_e: ['feature_development', 'testing', 'deployment'],
  },
  // Австралия задачи
  au: {
    client_b: ['research', 'analysis', 'planning', 'design'],
    client_c: ['feature_development', 'testing', 'deployment'],
  },
  // Другие страны
  other: {
    client_a: ['general_development', 'support', 'maintenance'],
    client_e: ['consulting', 'analysis', 'planning'],
  },
};

export function TimeEntryForm() {
  const { addMultipleEntries } = useTimeTracker();
  const [inputMode, setInputMode] = useState<InputMode>('single');
  const [activeTab, setActiveTab] = useState<TabType>('internal');
  const [projectId, setProjectId] = useState('');
  const [task, setTask] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [hours, setHours] = useState('8');
  const [includeWeekends, setIncludeWeekends] = useState(true);
  const [country, setCountry] = useState('');
  const [client, setClient] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Фильтрованные проекты и задачи
  const [filteredProjects, setFilteredProjects] = useState<any[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<any[]>([]);

  // Эффект для фильтрации проектов и задач при изменении country и client
  useEffect(() => {
    if (country && client) {
      // Получаем проекты для выбранной страны и клиента
      const countryData = PROJECTS_BY_COUNTRY_CLIENT[country as keyof typeof PROJECTS_BY_COUNTRY_CLIENT];
      if (countryData) {
        const clientProjects = countryData[client as keyof typeof countryData];
        setFilteredProjects(clientProjects || []);
      } else {
        setFilteredProjects([]);
      }

      // Получаем задачи для выбранной страны и клиента
      const tasksData = TASKS_BY_COUNTRY_CLIENT[country as keyof typeof TASKS_BY_COUNTRY_CLIENT];
      if (tasksData) {
        const clientTasks = tasksData[client as keyof typeof tasksData];
        if (clientTasks) {
          const filteredTaskOptions = TASK_OPTIONS.filter(taskOption =>
            clientTasks.includes(taskOption.value)
          );
          setFilteredTasks(filteredTaskOptions);
        } else {
          setFilteredTasks([]);
        }
      } else {
        setFilteredTasks([]);
      }

      // Сбрасываем выбранный проект и задачу при изменении фильтров
      setProjectId('');
      setTask('');
    } else {
      setFilteredProjects([]);
      setFilteredTasks([]);
      setProjectId('');
      setTask('');
    }
  }, [country, client]);

  const resetForm = () => {
    setTask('');
    setDescription('');
    setHours('8');
    setCountry('');
    setClient('');
    setProjectId('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Валидация в зависимости от активной вкладки
    if (activeTab === 'internal') {
      if (!task || !description || !hours) {
        toast.error('Please fill in all required fields');
        setIsSubmitting(false);
        return;
      }
    } else if (activeTab === 'external') {
      if (!projectId || !task || !description || !hours || !country || !client) {
        toast.error('Please fill in all required fields');
        setIsSubmitting(false);
        return;
      }
    } else if (activeTab === 'vacations') {
      if (!description || !hours) {
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

    // Для internal и external нужна задача
    if (activeTab !== 'vacations') {
      const selectedTask = TASK_OPTIONS.find(t => t.value === task);
      if (!selectedTask) {
        toast.error('Please select a valid task');
        setIsSubmitting(false);
        return;
      }
    }

    if (inputMode === 'single') {
      let entry;

      if (activeTab === 'internal') {
        entry = {
          type: 'internal',
          task: TASK_OPTIONS.find(t => t.value === task)?.label || task,
          description,
          date,
          hours: hoursNum,
        };
      } else if (activeTab === 'external') {
        // Находим выбранный проект
        const selectedProject = filteredProjects.find(p => p.id === projectId);
        if (!selectedProject) {
          toast.error('Selected project not found');
          setIsSubmitting(false);
          return;
        }

        entry = {
          type: 'external',
          projectId: selectedProject.id,
          projectName: selectedProject.name,
          projectColor: selectedProject.color,
          projectCode: selectedProject.code,
          task: TASK_OPTIONS.find(t => t.value === task)?.label || task,
          description,
          date,
          hours: hoursNum,
          country,
          client,
        };
      } else if (activeTab === 'vacations') {
        entry = {
          type: 'vacation',
          description,
          date,
          hours: hoursNum,
        };
      }

      addMultipleEntries([entry!]);
      toast.success('Time entry added successfully');
    } else {
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (start > end) {
        toast.error('Start date must be before end date');
        setIsSubmitting(false);
        return;
      }

      const entriesToAdd = [];
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
              task: TASK_OPTIONS.find(t => t.value === task)?.label || task,
              description,
              date: currentDate.toISOString().split('T')[0],
              hours: hoursNum,
            };
          } else if (activeTab === 'external') {
            const selectedProject = filteredProjects.find(p => p.id === projectId);
            if (!selectedProject) {
              toast.error('Selected project not found');
              setIsSubmitting(false);
              return;
            }

            entry = {
              type: 'external',
              projectId: selectedProject.id,
              projectName: selectedProject.name,
              projectColor: selectedProject.color,
              projectCode: selectedProject.code,
              task: TASK_OPTIONS.find(t => t.value === task)?.label || task,
              description,
              date: currentDate.toISOString().split('T')[0],
              hours: hoursNum,
              country,
              client,
            };
          } else if (activeTab === 'vacations') {
            entry = {
              type: 'vacation',
              description,
              date: currentDate.toISOString().split('T')[0],
              hours: hoursNum,
            };
          }

          entriesToAdd.push(entry!);
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }

      if (entriesToAdd.length > 0) {
        addMultipleEntries(entriesToAdd);
        toast.success(`Added ${entriesToAdd.length} time entries for the period ${startDate} to ${endDate}`);
      } else {
        toast.warning('No time entries were added. Check your date range and weekend settings.');
      }
    }

    resetForm();
    setIsSubmitting(false);
  };

  // Стили для активного и неактивного таба
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
        {/* Табы как кнопки */}
        <div className="mb-6">
          <div className="flex gap-2 p-1 bg-gray-100 rounded-xl w-fit" style={{ display: 'flex', marginBottom: '25px' }}>
            <button
              type="button"
              onClick={() => setActiveTab('internal')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-colors ${tabButtonClass('internal')}`}
            >
              <Briefcase className="w-4 h-4" />
              Internal
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('external')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-colors ${tabButtonClass('external')}`}
            >
              <CalendarIcon className="w-4 h-4" />
              External
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('vacations')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-colors ${tabButtonClass('vacations')}`}
            >
              <Plane className="w-4 h-4" />
              Vacations
            </button>
          </div>
        </div>

        {/* Internal Tab Content */}
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
              <Select value={task} onValueChange={setTask}>
                <SelectTrigger id="task" className="w-full">
                  <div className="flex items-center">
                    <ListTodo className="w-4 h-4 mr-2 text-gray-400" />
                    <SelectValue placeholder="Select a task type" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {TASK_OPTIONS.map(taskOption => (
                    <SelectItem key={taskOption.value} value={taskOption.value}>
                      {taskOption.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                disabled={isSubmitting}
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

        {/* External Tab Content */}
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
                <Select value={country} onValueChange={setCountry}>
                  <SelectTrigger id="country">
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map(countryOption => (
                      <SelectItem key={countryOption.value} value={countryOption.value}>
                        {countryOption.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="client">Client *</Label>
                <Select value={client} onValueChange={setClient}>
                  <SelectTrigger id="client">
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    {CLIENTS.map(clientOption => (
                      <SelectItem key={clientOption.value} value={clientOption.value}>
                        {clientOption.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Проекты, зависящие от выбора страны и клиента */}
            <div className="space-y-2">
              <Label htmlFor="project">Project *</Label>
              <Select
                value={projectId}
                onValueChange={setProjectId}
                disabled={!country || !client || filteredProjects.length === 0}
              >
                <SelectTrigger id="project">
                  <SelectValue
                    placeholder={
                      !country || !client
                        ? "Select country and client first"
                        : filteredProjects.length === 0
                          ? "No projects available for this combination"
                          : "Select a project"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {filteredProjects.map(project => (
                    <SelectItem key={project.id} value={project.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: project.color }}
                        />
                        <span className="font-mono text-xs text-slate-500">{project.code}</span>
                        <span>{project.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {country && client && filteredProjects.length === 0 && (
                <p className="text-sm text-amber-600">
                  No projects available for {COUNTRIES.find(c => c.value === country)?.label} - {CLIENTS.find(c => c.value === client)?.label}
                </p>
              )}
            </div>

            {/* Задачи, зависящие от выбора страны и клиента */}
            <div className="space-y-2">
              <Label htmlFor="task">Task *</Label>
              <Select
                value={task}
                onValueChange={setTask}
                disabled={!country || !client || filteredTasks.length === 0}
              >
                <SelectTrigger id="task" className="w-full">
                  <div className="flex items-center">
                    <ListTodo className="w-4 h-4 mr-2 text-gray-400" />
                    <SelectValue
                      placeholder={
                        !country || !client
                          ? "Select country and client first"
                          : filteredTasks.length === 0
                            ? "No tasks available for this combination"
                            : "Select a task type"
                      }
                    />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {filteredTasks.map(taskOption => (
                    <SelectItem key={taskOption.value} value={taskOption.value}>
                      {taskOption.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {country && client && filteredTasks.length === 0 && (
                <p className="text-sm text-amber-600">
                  No tasks available for {COUNTRIES.find(c => c.value === country)?.label} - {CLIENTS.find(c => c.value === client)?.label}
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
                disabled={isSubmitting || !projectId || !task}
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

        {/* Vacations Tab Content */}
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
                placeholder="Vacation description (e.g., Annual leave, Sick leave, etc.)"
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
                disabled={isSubmitting}
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