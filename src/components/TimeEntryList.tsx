import React, { useMemo, useState } from 'react';
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
import { Edit, Trash2, FileText, Clock, Calendar } from 'lucide-react';
import { useTimeTracker, TimeEntry } from './TimeTrackerContext';
import { toast } from 'sonner@2.0.3';

export function TimeEntryList() {
  const { entries, projects, filters, selectedEntries, setSelectedEntries, updateEntry, deleteEntry, deleteEntries } = useTimeTracker();
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<string | null>(null);
  
  const [editProjectId, setEditProjectId] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editHours, setEditHours] = useState('');

  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      if (filters.projects.length > 0 && !filters.projects.includes(entry.projectId)) {
        return false;
      }
      if (filters.searchText && !entry.description.toLowerCase().includes(filters.searchText.toLowerCase())) {
        return false;
      }
      if (filters.hoursRange !== 'all') {
        if (filters.hoursRange === 'low' && entry.hours >= 4) return false;
        if (filters.hoursRange === 'medium' && (entry.hours < 4 || entry.hours > 8)) return false;
        if (filters.hoursRange === 'high' && entry.hours <= 8) return false;
      }
      if (filters.dateRange) {
        const entryDate = new Date(entry.date);
        const [start, end] = filters.dateRange;
        if (entryDate < new Date(start) || entryDate > new Date(end)) {
          return false;
        }
      }
      return true;
    });
  }, [entries, filters]);

  const totalHours = useMemo(() => {
    return filteredEntries.reduce((sum, entry) => sum + entry.hours, 0);
  }, [filteredEntries]);

  const selectedTotalHours = useMemo(() => {
    return filteredEntries
      .filter(entry => selectedEntries.includes(entry.id))
      .reduce((sum, entry) => sum + entry.hours, 0);
  }, [filteredEntries, selectedEntries]);

  const handleEdit = (entry: TimeEntry) => {
    setEditingEntry(entry);
    setEditProjectId(entry.projectId);
    setEditDescription(entry.description);
    setEditDate(entry.date);
    setEditHours(entry.hours.toString());
  };

  const handleUpdate = () => {
    if (!editingEntry) return;

    const project = projects.find(p => p.id === editProjectId);
    if (!project) return;

    const hoursNum = parseFloat(editHours);
    if (isNaN(hoursNum) || hoursNum < 0.5 || hoursNum > 24) {
      toast.error('Hours must be between 0.5 and 24');
      return;
    }

    updateEntry(editingEntry.id, {
      projectId: project.id,
      projectName: project.name,
      projectColor: project.color,
      projectCode: project.code,
      description: editDescription,
      date: editDate,
      hours: hoursNum,
    });

    toast.success('Entry updated successfully');
    setEditingEntry(null);
  };

  const handleDelete = (id: string) => {
    setEntryToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (entryToDelete) {
      deleteEntry(entryToDelete);
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
      <Card className="shadow-md border-t-4" style={{ borderTopColor: '#F59E0B' }}>
        <CardHeader style={{ backgroundColor: '#F1F5F9' }} className="border-b">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle className="flex items-center gap-2" style={{ color: '#1F4E78' }}>
                <FileText className="w-5 h-5" />
                Time Entries
              </CardTitle>
              <CardDescription>
                {filteredEntries.length} records · {totalHours.toFixed(1)} total hours
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
        <CardContent className="pt-6">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedEntries.length === filteredEntries.length && filteredEntries.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Hours</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEntries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-slate-500 py-8">
                      No time entries found
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
                        <div className="flex items-center gap-2 text-slate-600">
                          <Calendar className="w-4 h-4" />
                          {new Date(entry.date).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Badge style={{ backgroundColor: entry.projectColor }}>
                            {entry.projectName}
                          </Badge>
                          <span className="text-xs text-slate-500 font-mono">{entry.projectCode}</span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {entry.description}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Clock className="w-4 h-4 text-slate-500" />
                          <span>{entry.hours}h</span>
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
              <Label htmlFor="edit-project">Project</Label>
              <Select value={editProjectId} onValueChange={setEditProjectId}>
                <SelectTrigger id="edit-project">
                  <SelectValue />
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
