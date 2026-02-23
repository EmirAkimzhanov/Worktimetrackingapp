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
import { Edit, Trash2, FileText, Clock, Calendar, Briefcase, Plane } from 'lucide-react';
import { useTimeTracker } from './TimeTrackerContext';
import { toast } from 'sonner@2.0.3';
import { useGetTimeEntrys } from '../hooks/useTimeEntry';
import { useUserStore } from '../store/UsersStore';

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
  const [entryToDelete, setEntryToDelete] = useState<number | null>(null);

  const [editProjectId, setEditProjectId] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editHours, setEditHours] = useState('');

  const { mutate: getTimeEntrys } = useGetTimeEntrys();
  const time_entries = useUserStore((state) => state.time_entries);

  // Вспомогательная функция для получения названия задачи
  const getTaskName = (taskId: number | null, taskType: string | null): string => {
    if (!taskId) return taskType || 'Unknown Task';
    return taskType || `Task ${taskId}`;
  };

  // Вспомогательная функция для получения названия страны
  const getCountryName = (countryId: number | null): string => {
    if (!countryId) return 'Unknown Country';
    return `Country ${countryId}`;
  };

  // Функция для определения типа записи
  const determineEntryType = (entry: any): string => {
    // Если есть task_type, используем его
    if (entry.task_type) {
      return entry.task_type;
    }

    // Логика определения типа
    const lowerTaskType = (entry.task_type || '').toLowerCase();

    if (lowerTaskType.includes('internal')) {
      return 'internal';
    } else if (lowerTaskType.includes('leave') || lowerTaskType.includes('vacation') || lowerTaskType.includes('holiday')) {
      return 'leave';
    } else {
      return 'external';
    }
  };

  // Функция для получения цвета по task_type
  const getEntryColor = (taskType: string) => {
    const lowerType = taskType.toLowerCase();

    // internal - фиолетовый
    if (lowerType.includes('internal')) {
      return '#8B5CF6';
    }

    // leave/vacation - оранжевый
    if (lowerType.includes('leave') || lowerType.includes('vacation') || lowerType.includes('holiday')) {
      return '#F59E0B';
    }

    // все остальное - external (зеленый)
    return '#10B981';
  };

  // Функция для получения иконки по task_type
  const getEntryIcon = (taskType: string) => {
    const lowerType = taskType.toLowerCase();

    // internal - Briefcase
    if (lowerType.includes('internal')) {
      return <Briefcase className="w-4 h-4" />;
    }

    // leave/vacation - Plane
    if (lowerType.includes('leave') || lowerType.includes('vacation') || lowerType.includes('holiday')) {
      return <Plane className="w-4 h-4" />;
    }

    // все остальное - external (Calendar)
    return <Calendar className="w-4 h-4" />;
  };

  // Загружаем записи при монтировании компонента
  useEffect(() => {
    getTimeEntrys(undefined, {
      onSuccess: (data) => {
        console.log('Loaded time entries:', data);
      },
      onError: (error) => {
        console.error('Failed to load time entries:', error);
        toast.error('Failed to load time entries');
      }
    });
  }, []);

  // Получаем реальные записи из стора
  const realEntries = useMemo(() => {
    if (!time_entries || time_entries.length === 0) {
      return [];
    }

    // Преобразуем записи из формата API в формат UI
    return time_entries.map(entry => ({
      id: entry.id.toString(),
      user: entry.user,
      date: entry.start_date,
      start_date: entry.start_date,
      end_date: entry.end_date,
      hours: entry.hours,
      description: entry.description,
      country: entry.country,
      client: entry.client,
      project: entry.project,
      projectId: entry.project?.toString() || '',
      projectColor: entry.project_color || '#1F4E78',
      projectCode: entry.project_code || 'N/A',
      projectName: entry.client || 'External Project',
      task_type: entry.task_type,
      task: entry.task,
      taskName: getTaskName(entry.task, entry.task_type),
      weekends_included: entry.weekends_included,
      type: determineEntryType(entry),
      // Добавляем поля для совместимости
      client_name: entry.client,
      country_name: getCountryName(entry.country),
      task_name: getTaskName(entry.task, entry.task_type),
    }));
  }, [time_entries, getTaskName, getCountryName, determineEntryType]);

  const filteredEntries = useMemo(() => {
    return realEntries.filter(entry => {
      // Фильтрация по проектам
      if (filters.projects.length > 0 && !filters.projects.includes(entry.projectId)) {
        return false;
      }

      // Фильтрация по поисковому запросу
      if (filters.searchText &&
        !entry.description.toLowerCase().includes(filters.searchText.toLowerCase()) &&
        !entry.client?.toLowerCase().includes(filters.searchText.toLowerCase()) &&
        !entry.taskName?.toLowerCase().includes(filters.searchText.toLowerCase())) {
        return false;
      }

      // Фильтрация по диапазону часов
      if (filters.hoursRange !== 'all') {
        if (filters.hoursRange === 'low' && entry.hours >= 4) return false;
        if (filters.hoursRange === 'medium' && (entry.hours < 4 || entry.hours > 8)) return false;
        if (filters.hoursRange === 'high' && entry.hours <= 8) return false;
      }

      // Фильтрация по диапазону дат
      if (filters.dateRange) {
        const entryDate = new Date(entry.date);
        const [start, end] = filters.dateRange;
        if (entryDate < new Date(start) || entryDate > new Date(end)) {
          return false;
        }
      }

      return true;
    });
  }, [realEntries, filters]);

  const totalHours = useMemo(() => {
    return filteredEntries.reduce((sum, entry) => sum + entry.hours, 0);
  }, [filteredEntries]);

  const selectedTotalHours = useMemo(() => {
    return filteredEntries
      .filter(entry => selectedEntries.includes(entry.id))
      .reduce((sum, entry) => sum + entry.hours, 0);
  }, [filteredEntries, selectedEntries]);

  const handleEdit = (entry: any) => {
    setEditingEntry(entry);
    setEditProjectId(entry.projectId);
    setEditDescription(entry.description);
    setEditDate(entry.date);
    setEditHours(entry.hours.toString());
  };

  const handleUpdate = () => {
    if (!editingEntry) return;

    const hoursNum = parseFloat(editHours);
    if (isNaN(hoursNum) || hoursNum < 0.5 || hoursNum > 24) {
      toast.error('Hours must be between 0.5 and 24');
      return;
    }

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
  };

  const handleDelete = (id: string) => {
    setEntryToDelete(parseInt(id));
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (entryToDelete !== null) {
      deleteEntry(entryToDelete.toString());
      toast.success('Entry deleted successfully');
      setEntryToDelete(null);
    }
    setDeleteDialogOpen(false);
  };

  const handleBulkDelete = () => {
    setBulkDeleteDialogOpen(true);
  };

  const confirmBulkDelete = () => {
    deleteEntries(selectedEntries);
    toast.success(`Deleted ${selectedEntries.length} entries`);
    setBulkDeleteDialogOpen(false);
  };

  const toggleSelectEntry = (id: string) => {
    setSelectedEntries(
      selectedEntries.includes(id)
        ? selectedEntries.filter(entryId => entryId !== id)
        : [...selectedEntries, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedEntries.length === filteredEntries.length) {
      setSelectedEntries([]);
    } else {
      setSelectedEntries(filteredEntries.map(entry => entry.id));
    }
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
                {filteredEntries.length} records · {totalHours.toFixed(1)} total hours
                {time_entries && ` · ${time_entries.length} total in database`}
              </CardDescription>
            </div>
            {selectedEntries.length > 0 && (
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-600 bg-white px-3 py-1 rounded-full border">
                  Selected: {selectedEntries.length} entries · {selectedTotalHours.toFixed(1)}h
                </span>
                <Button onClick={handleBulkDelete} size="sm" style={{ backgroundColor: '#EF4444' }} className="text-white hover:opacity-90">
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
                          checked={selectedEntries.length === filteredEntries.length && filteredEntries.length > 0}
                          onCheckedChange={toggleSelectAll}
                        />
                      </TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Client/Project</TableHead>
                      <TableHead>Task</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Hours</TableHead>
                      <TableHead className="w-24">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEntries.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-slate-500 py-8">
                          {time_entries && time_entries.length > 0
                            ? 'No time entries match your filters'
                            : 'No time entries found. Add some using the form above.'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredEntries.map(entry => (
                        <TableRow key={entry.id} className="hover:bg-slate-50">
                          <TableCell>
                            <Checkbox
                              checked={selectedEntries.includes(entry.id)}
                              onCheckedChange={() => toggleSelectEntry(entry.id)}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2 text-slate-600">
                                <Calendar className="w-4 h-4" />
                                {new Date(entry.date).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </div>
                              {entry.start_date !== entry.end_date && (
                                <span className="text-xs text-slate-500">
                                  {new Date(entry.start_date).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric'
                                  })} - {new Date(entry.end_date).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric'
                                  })}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              style={{
                                backgroundColor: getEntryColor(entry.task_type || entry.type),
                                color: 'white'
                              }}
                              className="flex items-center gap-1"
                            >
                              {getEntryIcon(entry.task_type || entry.type)}
                              <span className="capitalize">{entry.task_type || entry.type}</span>
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <div className="font-medium">{entry.client || 'Internal'}</div>
                              {entry.projectCode && entry.projectCode !== 'N/A' && (
                                <span className="text-xs text-slate-500 font-mono">{entry.projectCode}</span>
                              )}
                              {entry.country && (
                                <span className="text-xs text-slate-500">{entry.country_name}</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {entry.taskName}
                              {entry.task && (
                                <div className="text-xs text-slate-500">ID: {entry.task}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="max-w-xs">
                            <div className="truncate" title={entry.description}>
                              {entry.description}
                            </div>
                            {entry.weekends_included && (
                              <span className="text-xs text-slate-500">Weekends included</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Clock className="w-4 h-4 text-slate-500" />
                              <span className="font-medium">{entry.hours}h</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit(entry)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(entry.id)}
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
            <div className="border-t bg-slate-50 px-6 py-3 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-600">
                  Showing {filteredEntries.length} of {realEntries.length} entries
                  {time_entries && time_entries.length > realEntries.length && ` (${time_entries.length} in database)`}
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

      <Dialog open={!!editingEntry} onOpenChange={(open) => !open && setEditingEntry(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Time Entry</DialogTitle>
            <DialogDescription>Update the details of your time entry</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-type">Entry Type</Label>
              <div className="flex items-center gap-2">
                {getEntryIcon(editingEntry?.task_type || editingEntry?.type || '')}
                <span className="capitalize">{editingEntry?.task_type || editingEntry?.type || 'Unknown'}</span>
              </div>
            </div>
            {editingEntry?.type === 'external' && (
              <div className="space-y-2">
                <Label htmlFor="edit-client">Client</Label>
                <Input
                  id="edit-client"
                  value={editingEntry?.client || ''}
                  disabled
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="edit-date">Date</Label>
              <Input
                id="edit-date"
                type="date"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-hours">Hours</Label>
              <Input
                id="edit-hours"
                type="number"
                step="0.5"
                min="0.5"
                max="24"
                value={editHours}
                onChange={(e) => setEditHours(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-task">Task</Label>
              <Input
                id="edit-task"
                value={editingEntry?.taskName || ''}
                disabled
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingEntry(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} style={{ backgroundColor: '#1F4E78' }}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Time Entry</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this time entry? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Selected Entries</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedEntries.length} selected entries? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmBulkDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}