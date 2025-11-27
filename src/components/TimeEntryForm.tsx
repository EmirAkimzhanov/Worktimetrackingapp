import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Switch } from './ui/switch';
import { ToggleGroup, ToggleGroupItem } from './ui/toggle-group';
import { Plus, Calendar as CalendarIcon, CalendarRange } from 'lucide-react';
import { useTimeTracker } from './TimeTrackerContext';
import { toast } from 'sonner@2.0.3';

type InputMode = 'single' | 'range';

export function TimeEntryForm() {
  const { addEntry, projects } = useTimeTracker();
  const [inputMode, setInputMode] = useState<InputMode>('single');
  const [projectId, setProjectId] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [hours, setHours] = useState('8');
  const [includeWeekends, setIncludeWeekends] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!projectId || !description || !hours) {
      toast.error('Please fill in all required fields');
      return;
    }

    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    const hoursNum = parseFloat(hours);
    if (isNaN(hoursNum) || hoursNum < 0.5 || hoursNum > 24) {
      toast.error('Hours must be between 0.5 and 24');
      return;
    }

    if (inputMode === 'single') {
      addEntry({
        projectId: project.id,
        projectName: project.name,
        projectColor: project.color,
        projectCode: project.code,
        description,
        date,
        hours: hoursNum,
      });
      toast.success('Time entry added successfully');
    } else {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (start > end) {
        toast.error('Start date must be before end date');
        return;
      }

      let currentDate = new Date(start);
      let count = 0;

      while (currentDate <= end) {
        const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;
        
        if (includeWeekends || !isWeekend) {
          addEntry({
            projectId: project.id,
            projectName: project.name,
            projectColor: project.color,
            projectCode: project.code,
            description,
            date: currentDate.toISOString().split('T')[0],
            hours: hoursNum,
          });
          count++;
        }
        
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      toast.success(`Added ${count} time entries`);
    }

    setDescription('');
    setHours('8');
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
              placeholder="What did you work on?"
              rows={3}
              required
            />
          </div>

          <Button type="submit" className="w-full" style={{ backgroundColor: '#1F4E78' }}>
            <Plus className="w-4 h-4 mr-2" />
            Add Time Entry
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
