import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

export interface TimeEntry {
  id: string;
  projectId: string;
  projectName: string;
  projectColor: string;
  projectCode: string;
  description: string;
  date: string;
  hours: number;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  code: string;
  color: string;
  client_id?: number;
  clientName?: string;
  projectManager?: number;
  projectManagerName?: string;
  country: string;
  department: string;
  description: string;
}

export interface FilterState {
  projects: string[];
  dateRange: [string, string] | null;
  searchText: string;
  hoursRange: 'all' | 'low' | 'medium' | 'high';
  quickFilter: 'all' | 'today' | 'week' | 'month';
}

interface TimeTrackerContextType {
  entries: TimeEntry[];
  projects: Project[];
  filters: FilterState;
  selectedEntries: string[];
  addEntry: (entry: Omit<TimeEntry, 'id' | 'createdAt'>) => void;
  addMultipleEntries: (entries: Omit<TimeEntry, 'id' | 'createdAt'>[]) => void;
  updateEntry: (id: string, entry: Partial<TimeEntry>) => void;
  deleteEntry: (id: string) => void;
  deleteEntries: (ids: string[]) => void;
  setFilters: (filters: Partial<FilterState>) => void;
  setSelectedEntries: (ids: string[]) => void;
  addProject: (project: Omit<Project, 'id'>) => void;
  updateProject: (id: string, project: Partial<Project>) => void;
  deleteProject: (id: string) => void;
}

const TimeTrackerContext = createContext<TimeTrackerContextType | undefined>(undefined);

const INITIAL_PROJECTS: Project[] = [
  { id: 'main', name: 'Main Project', code: 'MAIN-001', color: '#1F4E78', client_id: 12, clientName: 'test', projectManager: 123, projectManagerName: 'bc', country: 'kg', department: 'consult', description: 'test' },
  { id: 'side', name: 'Side Project', code: 'SIDE-002', color: '#0066CC', client_id: 12, clientName: 'test', projectManager: 123, projectManagerName: 'bc', country: 'kg', department: 'consult', description: 'test' },
  { id: 'learning', name: 'Learning & Development', code: 'L&D-003', color: '#7C3AED', client_id: 12, clientName: 'test', projectManager: 123, projectManagerName: 'bc', country: 'kg', department: 'consult', description: 'test' },
  { id: 'meetings', name: 'Internal Meetings', code: 'MTG-004', color: '#F59E0B', client_id: 12, clientName: 'test', projectManager: 123, projectManagerName: 'bc', country: 'kg', department: 'consult', description: 'test' },
  { id: 'vacation', name: 'Vacation', code: 'VAC-005', color: '#00A3A1', client_id: 12, clientName: 'test', projectManager: 123, projectManagerName: 'bc', country: 'kg', department: 'consult', description: 'test' },
  { id: 'sick', name: 'Sick Leave', code: 'SICK-006', color: '#EF4444', client_id: 12, clientName: 'test', projectManager: 123, projectManagerName: 'bc', country: 'kg', department: 'consult', description: 'test' },
];

const generateSampleData = (projects: Project[]): TimeEntry[] => {
  const entries: TimeEntry[] = [];
  const today = new Date();

  for (let i = 0; i < 21; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    if (Math.random() > 0.65) continue;

    const numEntries = Math.floor(Math.random() * 2) + 1;

    for (let j = 0; j < numEntries; j++) {
      const project = projects[Math.floor(Math.random() * projects.length)];
      const hours = [2, 3, 4, 5, 6, 7, 8][Math.floor(Math.random() * 7)];

      const descriptions = [
        'Working on project features and bug fixes',
        'Client meeting and project planning',
        'Code review and documentation',
        'Research and learning new technologies',
        'Team collaboration and sprint planning',
        'Development and testing',
        'Design mockups and UI improvements',
        'Database optimization',
      ];

      entries.push({
        id: `${dateStr}-${j}-${Date.now()}-${Math.random()}`,
        projectId: project.id,
        projectName: project.name,
        projectColor: project.color,
        projectCode: project.code,
        description: descriptions[Math.floor(Math.random() * descriptions.length)],
        date: dateStr,
        hours,
        createdAt: date.toISOString(),
      });
    }
  }

  return entries.sort((a, b) => b.date.localeCompare(a.date));
};

export function TimeTrackerProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [entries, setEntries] = useState<TimeEntry[]>(() => generateSampleData(INITIAL_PROJECTS));
  const [filters, setFiltersState] = useState<FilterState>({
    projects: [],
    dateRange: null,
    searchText: '',
    hoursRange: 'all',
    quickFilter: 'all',
  });
  const [selectedEntries, setSelectedEntries] = useState<string[]>([]);

  const generateUniqueId = useCallback(() => {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }, []);

  const addEntry = useCallback((entry: Omit<TimeEntry, 'id' | 'createdAt'>) => {
    const newEntry: TimeEntry = {
      ...entry,
      id: generateUniqueId(),
      createdAt: new Date().toISOString(),
    };
    setEntries(prev => [newEntry, ...prev]);
  }, [generateUniqueId]);

  const addMultipleEntries = useCallback((entriesToAdd: Omit<TimeEntry, 'id' | 'createdAt'>[]) => {
    const newEntries = entriesToAdd.map(entry => ({
      ...entry,
      id: generateUniqueId(),
      createdAt: new Date().toISOString(),
    }));
    setEntries(prev => [...newEntries, ...prev]);
  }, [generateUniqueId]);

  const updateEntry = useCallback((id: string, updatedEntry: Partial<TimeEntry>) => {
    setEntries(prev => prev.map(entry =>
      entry.id === id ? { ...entry, ...updatedEntry } : entry
    ));
  }, []);

  const deleteEntry = useCallback((id: string) => {
    setEntries(prev => prev.filter(entry => entry.id !== id));
    setSelectedEntries(prev => prev.filter(entryId => entryId !== id));
  }, []);

  const deleteEntries = useCallback((ids: string[]) => {
    setEntries(prev => prev.filter(entry => !ids.includes(entry.id)));
    setSelectedEntries([]);
  }, []);

  const setFilters = useCallback((newFilters: Partial<FilterState>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }));
  }, []);

  const addProject = useCallback((project: Omit<Project, 'id'>) => {
    const newProject: Project = {
      ...project,
      id: `project-${Date.now()}-${Math.random()}`,
    };
    setProjects(prev => [...prev, newProject]);
  }, []);

  const updateProject = useCallback((id: string, updatedProject: Partial<Project>) => {
    setProjects(prev => prev.map(project =>
      project.id === id ? { ...project, ...updatedProject } : project
    ));

    // Update all entries with this project
    if (updatedProject.name || updatedProject.color || updatedProject.code) {
      setEntries(prev => prev.map(entry => {
        if (entry.projectId === id) {
          return {
            ...entry,
            projectName: updatedProject.name || entry.projectName,
            projectColor: updatedProject.color || entry.projectColor,
            projectCode: updatedProject.code || entry.projectCode,
          };
        }
        return entry;
      }));
    }
  }, []);

  const deleteProject = useCallback((id: string) => {
    setProjects(prev => prev.filter(project => project.id !== id));
    // Remove entries associated with this project
    setEntries(prev => prev.filter(entry => entry.projectId !== id));
  }, []);

  return (
    <TimeTrackerContext.Provider
      value={{
        entries,
        projects,
        filters,
        selectedEntries,
        addEntry,
        addMultipleEntries,
        updateEntry,
        deleteEntry,
        deleteEntries,
        setFilters,
        setSelectedEntries,
        addProject,
        updateProject,
        deleteProject,
      }}
    >
      {children}
    </TimeTrackerContext.Provider>
  );
}

export function useTimeTracker() {
  const context = useContext(TimeTrackerContext);
  if (context === undefined) {
    throw new Error('useTimeTracker must be used within a TimeTrackerProvider');
  }
  return context;
}