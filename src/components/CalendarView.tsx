import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, X, FolderKanban, FileText, User, CalendarDays } from 'lucide-react';
import { useTimeTracker } from './TimeTrackerContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';

export function CalendarView() {
  const { entries, filters } = useTimeTracker();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedDateEntries, setSelectedDateEntries] = useState<any[]>([]);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

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

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const previousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const getEntriesForDate = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return filteredEntries.filter(entry => entry.date === dateStr);
  };

  const getTotalHoursForDate = (day: number) => {
    const dayEntries = getEntriesForDate(day);
    return dayEntries.reduce((sum, entry) => sum + entry.hours, 0);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleDayClick = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayEntries = getEntriesForDate(day);

    setSelectedDate(dateStr);
    setSelectedDateEntries(dayEntries);
    setIsDetailsOpen(true);
  };

  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const calendarDays = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  const isToday = (day: number | null) => {
    if (!day) return false;
    const today = new Date();
    return day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear();
  };

  // Вспомогательные функции для статистики
  const getHoursByProject = () => {
    const hoursMap = new Map<string, number>();
    selectedDateEntries.forEach(entry => {
      const current = hoursMap.get(entry.projectName) || 0;
      hoursMap.set(entry.projectName, current + entry.hours);
    });
    return Array.from(hoursMap.entries());
  };

  const getTasksBreakdown = () => {
    const tasksMap = new Map<string, number>();
    selectedDateEntries.forEach(entry => {
      const taskName = entry.task || 'No task';
      const current = tasksMap.get(taskName) || 0;
      tasksMap.set(taskName, current + 1);
    });
    return Array.from(tasksMap.entries());
  };

  return (
    <>
      <Card className="shadow-md hover:shadow-lg transition-shadow border-t-4" style={{ borderTopColor: '#0066CC' }}>
        <CardHeader style={{ backgroundColor: '#F1F5F9' }} className="border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2" style={{ color: '#1F4E78' }}>
                <CalendarIcon className="w-5 h-5" />
                Calendar View
              </CardTitle>
              <CardDescription>Click on a day to see task details</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={previousMonth}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <div className="min-w-[180px] text-center">
                {monthName}
              </div>
              <Button variant="outline" size="icon" onClick={nextMonth}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-7 gap-2">
            {weekDays.map(day => (
              <div key={day} className="text-center text-slate-600 p-2">
                {day}
              </div>
            ))}

            {calendarDays.map((day, index) => {
              if (day === null) {
                return <div key={`empty-${index}`} className="aspect-square" />;
              }

              const dayEntries = getEntriesForDate(day);
              const totalHours = getTotalHoursForDate(day);

              return (
                <button
                  key={day}
                  onClick={() => handleDayClick(day)}
                  className={`aspect-square border rounded-lg p-2 hover:bg-slate-50 transition-colors ${isToday(day) ? 'ring-2 ring-offset-1' : 'border-slate-200'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  style={isToday(day) ? { borderColor: '#0066CC', backgroundColor: '#EFF6FF' } : {}}
                >
                  <div className="h-full flex flex-col">
                    <div className="text-center mb-1" style={isToday(day) ? { color: '#0066CC', fontWeight: 600 } : {}}>
                      {day}
                    </div>
                    {dayEntries.length > 0 && (
                      <div className="flex-1 space-y-1 overflow-hidden">
                        {dayEntries.slice(0, 2).map(entry => (
                          <div
                            key={entry.id}
                            className="text-xs px-1 py-0.5 rounded truncate"
                            style={{
                              backgroundColor: entry.projectColor + '20',
                              color: entry.projectColor
                            }}
                          >
                            {entry.projectCode}
                          </div>
                        ))}
                        {dayEntries.length > 2 && (
                          <div className="text-xs text-slate-500 px-1">
                            +{dayEntries.length - 2} more
                          </div>
                        )}
                        <div className="flex items-center gap-1 text-xs px-1 mt-1">
                          <Clock className="w-3 h-3" style={{ color: '#0066CC' }} />
                          <span style={{ color: '#0066CC', fontWeight: 600 }}>{totalHours}h</span>
                        </div>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Модальное окно с деталями дня */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5" />
              {selectedDate && formatDate(selectedDate)}
            </DialogTitle>

          </DialogHeader>

          {selectedDateEntries.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CalendarIcon className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>No time entries for this day</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Total hours</p>
                  <p className="text-2xl font-bold text-blue-700">
                    {selectedDateEntries.reduce((sum, entry) => sum + entry.hours, 0)}h
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total tasks</p>
                  <p className="text-2xl font-bold text-blue-700">{selectedDateEntries.length}</p>
                </div>
              </div>

              <div className="space-y-3">
                {selectedDateEntries.map(entry => (
                  <Card key={entry.id} className="border-l-4" style={{ borderLeftColor: entry.projectColor }}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: entry.projectColor + '20' }}
                          >
                            <FolderKanban className="w-4 h-4" style={{ color: entry.projectColor }} />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">{entry.projectName}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                                {entry.projectCode}
                              </span>
                              <span className="flex items-center gap-1 text-sm text-gray-600">
                                <Clock className="w-3 h-3" />
                                {entry.hours}h
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {entry.userName && (
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <User className="w-3 h-3" />
                              {entry.userName}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-3">
                        {entry.task && (
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <FileText className="w-4 h-4 text-gray-500" />
                              <span className="text-sm font-medium text-gray-700">Task</span>
                            </div>
                            <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{entry.task}</p>
                          </div>
                        )}

                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <FileText className="w-4 h-4 text-gray-500" />
                            <span className="text-sm font-medium text-gray-700">Description</span>
                          </div>
                          <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{entry.description}</p>
                        </div>

                        <div className="flex items-center justify-between text-sm text-gray-500 pt-2 border-t">
                          <div className="flex items-center gap-4">
                            <span>Entry ID: {entry.id.slice(0, 8)}...</span>
                            <span>Added: {new Date(entry.createdAt || entry.date).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="pt-4 border-t">
                <h4 className="font-semibold mb-2 text-gray-700">Daily Summary</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Hours by Project</p>
                    <ul className="mt-2 space-y-1">
                      {getHoursByProject().map(([project, hours]) => (
                        <li key={project} className="flex justify-between text-sm">
                          <span className="truncate">{project}</span>
                          <span className="font-medium">{hours}h</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Tasks Breakdown</p>
                    <ul className="mt-2 space-y-1">
                      {getTasksBreakdown().map(([task, count]) => (
                        <li key={task} className="flex justify-between text-sm">
                          <span className="truncate">{task}</span>
                          <span className="font-medium">{count}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}