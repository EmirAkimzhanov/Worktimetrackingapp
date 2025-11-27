import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { Plus, Edit, Trash2, Settings, FolderKanban } from 'lucide-react';
import { useTimeTracker, Project } from './TimeTrackerContext';
import { toast } from 'sonner@2.0.3';

export function AdminPanel() {
  const { projects, addProject, updateProject, deleteProject, entries } = useTimeTracker();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);

  const [projectName, setProjectName] = useState('');
  const [projectCode, setProjectCode] = useState('');
  const [projectColor, setProjectColor] = useState('#1F4E78');

  const resetForm = () => {
    setProjectName('');
    setProjectCode('');
    setProjectColor('#1F4E78');
  };

  const handleAdd = () => {
    if (!projectName.trim() || !projectCode.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Check if code already exists
    if (projects.some(p => p.code.toLowerCase() === projectCode.toLowerCase())) {
      toast.error('Project code already exists');
      return;
    }

    addProject({
      name: projectName,
      code: projectCode.toUpperCase(),
      color: projectColor,
    });

    toast.success('Project added successfully');
    setIsAddDialogOpen(false);
    resetForm();
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setProjectName(project.name);
    setProjectCode(project.code);
    setProjectColor(project.color);
  };

  const handleUpdate = () => {
    if (!editingProject) return;

    if (!projectName.trim() || !projectCode.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Check if code already exists (excluding current project)
    if (projects.some(p => p.id !== editingProject.id && p.code.toLowerCase() === projectCode.toLowerCase())) {
      toast.error('Project code already exists');
      return;
    }

    updateProject(editingProject.id, {
      name: projectName,
      code: projectCode.toUpperCase(),
      color: projectColor,
    });

    toast.success('Project updated successfully');
    setEditingProject(null);
    resetForm();
  };

  const handleDelete = (id: string) => {
    setProjectToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (projectToDelete) {
      const entriesCount = entries.filter(e => e.projectId === projectToDelete).length;
      deleteProject(projectToDelete);
      toast.success(`Project deleted successfully${entriesCount > 0 ? ` (${entriesCount} time entries removed)` : ''}`);
      setProjectToDelete(null);
    }
    setDeleteDialogOpen(false);
  };

  const getProjectStats = (projectId: string) => {
    const projectEntries = entries.filter(e => e.projectId === projectId);
    const totalHours = projectEntries.reduce((sum, e) => sum + e.hours, 0);
    return {
      entriesCount: projectEntries.length,
      totalHours: totalHours.toFixed(1),
    };
  };

  const predefinedColors = [
    { name: 'Navy', value: '#1F4E78' },
    { name: 'Blue', value: '#0066CC' },
    { name: 'Teal', value: '#00A3A1' },
    { name: 'Purple', value: '#7C3AED' },
    { name: 'Amber', value: '#F59E0B' },
    { name: 'Red', value: '#EF4444' },
    { name: 'Green', value: '#22C55E' },
    { name: 'Pink', value: '#EC4899' },
  ];

  return (
    <>
      <Card className="shadow-md">
        <CardHeader style={{ backgroundColor: '#1F4E78' }} className="text-white border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-white">
                <Settings className="w-5 h-5" />
                Project Administration
              </CardTitle>
              <CardDescription className="text-blue-100">
                Manage projects and project codes
              </CardDescription>
            </div>
            <Button 
              onClick={() => setIsAddDialogOpen(true)}
              style={{ backgroundColor: '#00A3A1' }}
              className="hover:opacity-90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Project
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project Code</TableHead>
                  <TableHead>Project Name</TableHead>
                  <TableHead>Color</TableHead>
                  <TableHead className="text-right">Entries</TableHead>
                  <TableHead className="text-right">Total Hours</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-slate-500 py-8">
                      No projects found
                    </TableCell>
                  </TableRow>
                ) : (
                  projects.map(project => {
                    const stats = getProjectStats(project.id);
                    return (
                      <TableRow key={project.id} className="hover:bg-slate-50">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <FolderKanban className="w-4 h-4 text-slate-500" />
                            <span className="font-mono">{project.code}</span>
                          </div>
                        </TableCell>
                        <TableCell>{project.name}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-6 h-6 rounded border border-slate-300" 
                              style={{ backgroundColor: project.color }}
                            />
                            <span className="text-xs text-slate-500 font-mono">{project.color}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{stats.entriesCount}</TableCell>
                        <TableCell className="text-right">{stats.totalHours}h</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(project)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(project.id)}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add Project Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
        setIsAddDialogOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Project</DialogTitle>
            <DialogDescription>Create a new project with a unique code</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="add-code">Project Code *</Label>
              <Input
                id="add-code"
                value={projectCode}
                onChange={(e) => setProjectCode(e.target.value.toUpperCase())}
                placeholder="e.g., PROJ-001"
                className="font-mono"
              />
              <p className="text-xs text-slate-500">Must be unique across all projects</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-name">Project Name *</Label>
              <Input
                id="add-name"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Enter project name"
              />
            </div>
            <div className="space-y-2">
              <Label>Project Color *</Label>
              <div className="grid grid-cols-4 gap-2">
                {predefinedColors.map(color => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setProjectColor(color.value)}
                    className={`p-3 rounded-lg border-2 transition-all hover:scale-105 ${
                      projectColor === color.value ? 'border-slate-900 ring-2 ring-slate-300' : 'border-slate-200'
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Label htmlFor="custom-color" className="text-xs">Custom:</Label>
                <Input
                  id="custom-color"
                  type="color"
                  value={projectColor}
                  onChange={(e) => setProjectColor(e.target.value)}
                  className="w-20 h-10"
                />
                <span className="text-xs text-slate-500 font-mono">{projectColor}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsAddDialogOpen(false);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button onClick={handleAdd} style={{ backgroundColor: '#1F4E78' }}>
              Add Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Project Dialog */}
      <Dialog open={!!editingProject} onOpenChange={(open) => {
        if (!open) {
          setEditingProject(null);
          resetForm();
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
            <DialogDescription>Update project details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-code">Project Code *</Label>
              <Input
                id="edit-code"
                value={projectCode}
                onChange={(e) => setProjectCode(e.target.value.toUpperCase())}
                className="font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-name">Project Name *</Label>
              <Input
                id="edit-name"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Project Color *</Label>
              <div className="grid grid-cols-4 gap-2">
                {predefinedColors.map(color => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setProjectColor(color.value)}
                    className={`p-3 rounded-lg border-2 transition-all hover:scale-105 ${
                      projectColor === color.value ? 'border-slate-900 ring-2 ring-slate-300' : 'border-slate-200'
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Label htmlFor="edit-custom-color" className="text-xs">Custom:</Label>
                <Input
                  id="edit-custom-color"
                  type="color"
                  value={projectColor}
                  onChange={(e) => setProjectColor(e.target.value)}
                  className="w-20 h-10"
                />
                <span className="text-xs text-slate-500 font-mono">{projectColor}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setEditingProject(null);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} style={{ backgroundColor: '#1F4E78' }}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this project? All associated time entries will also be removed. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
