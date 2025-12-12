import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Switch } from './ui/switch';
import { ToggleGroup, ToggleGroupItem } from './ui/toggle-group';
import { Plus, Calendar as CalendarIcon, CalendarRange, ListTodo } from 'lucide-react';
import { useTimeTracker } from './TimeTrackerContext';
import { toast } from 'sonner@2.0.3';

type InputMode = 'single' | 'range';

// Предопределенные задачи
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

export function TimeEntryForm() {
  const { addMultipleEntries, projects } = useTimeTracker();
  const [inputMode, setInputMode] = useState<InputMode>('single');
  const [projectId, setProjectId] = useState('');
  const [task, setTask] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [hours, setHours] = useState('8');
  const [includeWeekends, setIncludeWeekends] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!projectId || !task || !description || !hours) {
      toast.error('Please fill in all required fields');
      setIsSubmitting(false);
      return;
    }

    const project = projects.find(p => p.id === projectId);
    if (!project) {
      setIsSubmitting(false);
      return;
    }

    const hoursNum = parseFloat(hours);
    if (isNaN(hoursNum) || hoursNum < 0.5 || hoursNum > 24) {
      toast.error('Hours must be between 0.5 and 24');
      setIsSubmitting(false);
      return;
    }

    const selectedTask = TASK_OPTIONS.find(t => t.value === task);
    if (!selectedTask) {
      toast.error('Please select a valid task');
      setIsSubmitting(false);
      return;
    }

    if (inputMode === 'single') {
      const entry = {
        projectId: project.id,
        projectName: project.name,
        projectColor: project.color,
        projectCode: project.code,
        task: selectedTask.label,
        description,
        date,
        hours: hoursNum,
      };

      addMultipleEntries([entry]);
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

      // Добавляем один день для корректного сравнения дат
      const endDateForLoop = new Date(end);
      endDateForLoop.setDate(endDateForLoop.getDate() + 1);

      while (currentDate < endDateForLoop) {
        const dayOfWeek = currentDate.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

        if (includeWeekends || !isWeekend) {
          entriesToAdd.push({
            projectId: project.id,
            projectName: project.name,
            projectColor: project.color,
            projectCode: project.code,
            task: selectedTask.label,
            description,
            date: currentDate.toISOString().split('T')[0],
            hours: hoursNum,
          });
        }

        // Переходим к следующему дню
        currentDate.setDate(currentDate.getDate() + 1);
      }

      if (entriesToAdd.length > 0) {
        addMultipleEntries(entriesToAdd);
        toast.success(`Added ${entriesToAdd.length} time entries for the period ${startDate} to ${endDate}`);
      } else {
        toast.warning('No time entries were added. Check your date range and weekend settings.');
      }
    }

    setTask('');
    setDescription('');
    setHours('8');
    setIsSubmitting(false);
  };

  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow border-t-4" style={{ borderTopColor: '#1F4E78' }}>
      <CardHeader style={{ backgroundColor: '#F1F5F9' }} className="border-b">
        <CardTitle className="flex items-center gap-2" style={{ color: '#1F4E78' }}>
          <Plus className="w-5 h-5" />
          Add Time Entry
        </CardTitle>
        <CardDescription>Track your work hours with single date or date range</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Input Mode</Label>
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
            <Label htmlFor="project">Project *</Label>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger id="project">
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map(project => (
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
      </CardContent>
    </Card>
  );
}