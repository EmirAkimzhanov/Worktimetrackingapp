import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ToggleGroup, ToggleGroupItem } from './ui/toggle-group';
import { Filter, X, Search } from 'lucide-react';
import { useTimeTracker } from './TimeTrackerContext';

export function FilterPanel() {
  const { projects, filters, setFilters } = useTimeTracker();

  const handleQuickFilter = (value: string) => {
    if (!value) return;
    
    setFilters({ quickFilter: value as 'all' | 'today' | 'week' | 'month' });
    
    const today = new Date();
    let dateRange: [string, string] | null = null;

    switch (value) {
      case 'today':
        dateRange = [today.toISOString().split('T')[0], today.toISOString().split('T')[0]];
        break;
      case 'week':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        dateRange = [
          weekStart.toISOString().split('T')[0],
          weekEnd.toISOString().split('T')[0]
        ];
        break;
      case 'month':
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        dateRange = [
          monthStart.toISOString().split('T')[0],
          monthEnd.toISOString().split('T')[0]
        ];
        break;
      default:
        dateRange = null;
    }

    setFilters({ dateRange });
  };

  const handleClearFilters = () => {
    setFilters({
      projects: [],
      dateRange: null,
      searchText: '',
      hoursRange: 'all',
      quickFilter: 'all',
    });
  };

  const toggleProject = (projectId: string) => {
    const newProjects = filters.projects.includes(projectId)
      ? filters.projects.filter(id => id !== projectId)
      : [...filters.projects, projectId];
    setFilters({ projects: newProjects });
  };

  const hasActiveFilters = 
    filters.projects.length > 0 || 
    filters.dateRange !== null || 
    filters.searchText !== '' ||
    filters.hoursRange !== 'all' ||
    filters.quickFilter !== 'all';

  return (
    <Card className="shadow-md border-t-4" style={{ borderTopColor: '#00A3A1' }}>
      <CardHeader style={{ backgroundColor: '#F1F5F9' }} className="border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2" style={{ color: '#1F4E78' }}>
            <Filter className="w-5 h-5" />
            Filters & Search
          </CardTitle>
          {hasActiveFilters && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleClearFilters}
            >
              <X className="w-4 h-4 mr-1" />
              Clear All
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label>Quick Filters</Label>
            <ToggleGroup 
              type="single" 
              value={filters.quickFilter}
              onValueChange={handleQuickFilter}
              className="grid grid-cols-4 w-full"
            >
              <ToggleGroupItem value="all" className="text-xs">All</ToggleGroupItem>
              <ToggleGroupItem value="today" className="text-xs">Today</ToggleGroupItem>
              <ToggleGroupItem value="week" className="text-xs">Week</ToggleGroupItem>
              <ToggleGroupItem value="month" className="text-xs">Month</ToggleGroupItem>
            </ToggleGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="search">Search</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                id="search"
                placeholder="Search descriptions..."
                value={filters.searchText}
                onChange={(e) => setFilters({ searchText: e.target.value })}
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="projects">Projects</Label>
            <Select
              value={filters.projects.length > 0 ? filters.projects[0] : 'all'}
              onValueChange={(value) => {
                if (value === 'all') {
                  setFilters({ projects: [] });
                } else {
                  toggleProject(value);
                }
              }}
            >
              <SelectTrigger id="projects">
                <SelectValue placeholder="All projects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
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
            <Label htmlFor="hours">Hours Range</Label>
            <Select
              value={filters.hoursRange}
              onValueChange={(value) => setFilters({ hoursRange: value as any })}
            >
              <SelectTrigger id="hours">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Hours</SelectItem>
                <SelectItem value="low">&lt; 4 hours</SelectItem>
                <SelectItem value="medium">4-8 hours</SelectItem>
                <SelectItem value="high">&gt; 8 hours</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {filters.quickFilter === 'all' && (
          <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg">
            <div className="space-y-2">
              <Label htmlFor="startDate">Custom Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={filters.dateRange?.[0] || ''}
                onChange={(e) => setFilters({ 
                  dateRange: [e.target.value, filters.dateRange?.[1] || e.target.value] 
                })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">Custom End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={filters.dateRange?.[1] || ''}
                onChange={(e) => setFilters({ 
                  dateRange: [filters.dateRange?.[0] || e.target.value, e.target.value] 
                })}
              />
            </div>
          </div>
        )}

        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 pt-2 border-t">
            {filters.projects.map(projectId => {
              const project = projects.find(p => p.id === projectId);
              return project ? (
                <Badge
                  key={projectId}
                  style={{ backgroundColor: project.color }}
                  className="gap-1 cursor-pointer"
                  onClick={() => toggleProject(projectId)}
                >
                  {project.name}
                  <X className="w-3 h-3" />
                </Badge>
              ) : null;
            })}
            {filters.hoursRange !== 'all' && (
              <Badge variant="secondary" className="gap-1 cursor-pointer" onClick={() => setFilters({ hoursRange: 'all' })}>
                {filters.hoursRange === 'low' ? '< 4 hours' : 
                 filters.hoursRange === 'medium' ? '4-8 hours' : '> 8 hours'}
                <X className="w-3 h-3" />
              </Badge>
            )}
            {filters.searchText && (
              <Badge variant="secondary" className="gap-1 cursor-pointer" onClick={() => setFilters({ searchText: '' })}>
                Search: {filters.searchText}
                <X className="w-3 h-3" />
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
