import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, X, FolderKanban, FileText, User, CalendarDays, ChevronUp, ChevronDown } from 'lucide-react';
import { useTimeTracker } from './TimeTrackerContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { useUserStore } from '../store/UsersStore';

export function CalendarView() {
  const { filters } = useTimeTracker();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedDateEntries, setSelectedDateEntries] = useState<any[]>([]);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [expandedEntries, setExpandedEntries] = useState<Set<number>>(new Set());
  const time_entries = useUserStore((state) => state.time_entries);

  // Получаем все записи времени из хранилища
  const allEntries = useMemo(() => {
    return time_entries || [];
  }, [time_entries]);

  const filteredEntries = useMemo(() => {
    return allEntries.filter(entry => {
      if (!entry) return false;

      // Фильтрация по проектам
      if (filters.projects.length > 0 && entry.project &&
        !filters.projects.includes(entry.project)) {
        return false;
      }

      // Фильтрация по тексту поиска
      if (filters.searchText && entry.description &&
        !entry.description.toLowerCase().includes(filters.searchText.toLowerCase())) {
        return false;
      }

      // Фильтрация по диапазону часов
      if (filters.hoursRange !== 'all' && entry.hours) {
        const hours = parseFloat(entry.hours);
        if (filters.hoursRange === 'low' && hours >= 4) return false;
        if (filters.hoursRange === 'medium' && (hours < 4 || hours > 8)) return false;
        if (filters.hoursRange === 'high' && hours <= 8) return false;
      }

      // Фильтрация по диапазону дат
      if (filters.dateRange && entry.start_date) {
        const entryDate = new Date(entry.start_date);
        const [start, end] = filters.dateRange;
        if (entryDate < new Date(start) || entryDate > new Date(end)) {
          return false;
        }
      }

      return true;
    });
  }, [allEntries, filters]);

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
    return filteredEntries.filter(entry => {
      // Проверяем, попадает ли день в диапазон start_date - end_date
      if (!entry.start_date) return false;

      const startDate = new Date(entry.start_date);
      const endDate = entry.end_date ? new Date(entry.end_date) : new Date(entry.start_date);
      const targetDate = new Date(dateStr);

      // Проверяем, находится ли целевая дата в диапазоне
      return targetDate >= startDate && targetDate <= endDate;
    });
  };

  const getTotalHoursForDate = (day: number) => {
    const dayEntries = getEntriesForDate(day);
    return dayEntries.reduce((sum, entry) => {
      const hours = parseFloat(entry.hours) || 0;

      // Если запись растянута на несколько дней, нужно разделить часы
      if (entry.start_date && entry.end_date) {
        const startDate = new Date(entry.start_date);
        const endDate = new Date(entry.end_date);

        // Если это один день, возвращаем все часы
        if (startDate.toDateString() === endDate.toDateString()) {
          return sum + hours;
        }

        // Если запись на несколько дней, делим часы равномерно
        const dayDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24)) + 1;
        const hoursPerDay = hours / dayDiff;
        return sum + hoursPerDay;
      }

      return sum + hours;
    }, 0);
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
    setExpandedEntries(new Set()); // Сбрасываем раскрытые записи
    setIsDetailsOpen(true);
  };

  const toggleEntryExpansion = (entryId: number) => {
    const newExpanded = new Set(expandedEntries);
    if (newExpanded.has(entryId)) {
      newExpanded.delete(entryId);
    } else {
      newExpanded.add(entryId);
    }
    setExpandedEntries(newExpanded);
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
      if (!entry) return;
      const projectName = entry.project || 'Unknown Project';
      let hours = parseFloat(entry.hours) || 0;

      // Если запись на несколько дней, корректируем часы
      if (entry.start_date && entry.end_date && selectedDate) {
        const startDate = new Date(entry.start_date);
        const endDate = new Date(entry.end_date);
        const targetDate = new Date(selectedDate);

        if (startDate.toDateString() !== endDate.toDateString()) {
          const dayDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24)) + 1;
          hours = hours / dayDiff;
        }
      }

      const current = hoursMap.get(projectName) || 0;
      hoursMap.set(projectName, current + hours);
    });
    return Array.from(hoursMap.entries());
  };

  const getTasksBreakdown = () => {
    const tasksMap = new Map<string, number>();
    selectedDateEntries.forEach(entry => {
      if (!entry) return;
      const taskName = entry.task || 'No task';
      const current = tasksMap.get(taskName) || 0;
      tasksMap.set(taskName, current + 1);
    });
    return Array.from(tasksMap.entries());
  };

  // Получение цвета проекта
  const getProjectColor = (entry: any) => {
    if (!entry) return '#0066CC';
    return entry.project_color || '#0066CC';
  };

  // Получение кода проекта
  const getProjectCode = (entry: any) => {
    if (!entry) return 'PRJ';
    return entry.project_code || 'PRJ';
  };

  // Получение названия проекта
  const getProjectName = (entry: any) => {
    if (!entry) return 'Unknown Project';
    return entry.project || 'Unknown Project';
  };

  // Получение клиента
  const getClient = (entry: any) => {
    if (!entry) return 'No client';
    return entry.client || 'No client';
  };

  // Получение типа задачи
  const getTaskType = (entry: any) => {
    if (!entry) return 'No type';
    return entry.task_type || 'No type';
  };

  // Форматирование даты диапазона
  const formatDateRange = (entry: any) => {
    if (!entry.start_date) return '';

    const startDate = new Date(entry.start_date);
    if (!entry.end_date || entry.start_date === entry.end_date) {
      return startDate.toLocaleDateString();
    }

    const endDate = new Date(entry.end_date);
    return `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
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
                        {dayEntries.slice(0, 2).map(entry => {
                          const projectColor = getProjectColor(entry);
                          const projectCode = getProjectCode(entry);

                          return (
                            <div
                              key={entry.id}
                              className="text-xs px-1 py-0.5 rounded truncate"
                              style={{
                                backgroundColor: projectColor + '20',
                                color: projectColor
                              }}
                            >
                              {projectCode}
                            </div>
                          );
                        })}
                        {dayEntries.length > 2 && (
                          <div className="text-xs text-slate-500 px-1">
                            +{dayEntries.length - 2} more
                          </div>
                        )}
                        <div className="flex items-center gap-1 text-xs px-1 mt-1">
                          <Clock className="w-3 h-3" style={{ color: '#0066CC' }} />
                          <span style={{ color: '#0066CC', fontWeight: 600 }}>{totalHours.toFixed(1)}h</span>
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
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
          <div className="flex flex-col h-full">
            {/* Заголовок с фиксированной высотой */}
            <DialogHeader className="p-6 border-b">
              <DialogTitle className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5" />
                {selectedDate && formatDate(selectedDate)}
              </DialogTitle>
            </DialogHeader>

            {/* Прокручиваемое содержимое */}
            <div className="flex-1 overflow-y-auto p-6">
              {selectedDateEntries.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CalendarIcon className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p>No time entries for this day</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Статистика вверху */}
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-600">Total hours</p>
                      <p className="text-2xl font-bold text-blue-700">
                        {selectedDateEntries.reduce((sum, entry) => {
                          let hours = parseFloat(entry.hours) || 0;

                          // Корректируем часы для многодневных записей
                          if (entry.start_date && entry.end_date && selectedDate) {
                            const startDate = new Date(entry.start_date);
                            const endDate = new Date(entry.end_date);
                            const targetDate = new Date(selectedDate);

                            if (startDate.toDateString() !== endDate.toDateString()) {
                              const dayDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24)) + 1;
                              hours = hours / dayDiff;
                            }
                          }

                          return sum + hours;
                        }, 0).toFixed(1)}h
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total tasks</p>
                      <p className="text-2xl font-bold text-blue-700">{selectedDateEntries.length}</p>
                    </div>
                  </div>

                  {/* Список записей */}
                  <div className="space-y-3">
                    {selectedDateEntries.map(entry => {
                      const projectColor = getProjectColor(entry);
                      const projectName = getProjectName(entry);
                      const projectCode = getProjectCode(entry);
                      const isExpanded = expandedEntries.has(entry.id);
                      let hours = parseFloat(entry.hours) || 0;

                      // Корректируем часы для многодневных записей
                      if (entry.start_date && entry.end_date && selectedDate) {
                        const startDate = new Date(entry.start_date);
                        const endDate = new Date(entry.end_date);
                        const targetDate = new Date(selectedDate);

                        if (startDate.toDateString() !== endDate.toDateString()) {
                          const dayDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24)) + 1;
                          hours = hours / dayDiff;
                        }
                      }

                      return (
                        <div key={entry.id} className="border rounded-lg overflow-hidden">
                          {/* Заголовок записи - всегда видимый */}
                          <div
                            className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                            onClick={() => toggleEntryExpansion(entry.id)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3 flex-1">
                                <div
                                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                                  style={{ backgroundColor: projectColor + '20' }}
                                >
                                  <FolderKanban className="w-5 h-5" style={{ color: projectColor }} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between">
                                    <h4 className="font-semibold text-gray-900 truncate">{projectName}</h4>
                                    <div className="flex items-center gap-2">
                                      <span className="flex items-center gap-1 text-sm font-medium text-gray-700">
                                        <Clock className="w-4 h-4" />
                                        {hours.toFixed(1)}h
                                      </span>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                      >
                                        {isExpanded ? (
                                          <ChevronUp className="w-4 h-4" />
                                        ) : (
                                          <ChevronDown className="w-4 h-4" />
                                        )}
                                      </Button>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                                    <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                                      {projectCode}
                                    </span>
                                    <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-600">
                                      {getTaskType(entry)}
                                    </span>
                                    {entry.client && (
                                      <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-600">
                                        {getClient(entry)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Раскрывающееся содержимое */}
                          {isExpanded && (
                            <div className="border-t p-4 bg-gray-50">
                              <div className="space-y-3">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <div>
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-sm font-medium text-gray-700">Date Range</span>
                                    </div>
                                    <p className="text-gray-900 bg-white p-2 rounded-lg border">
                                      {formatDateRange(entry)}
                                    </p>
                                  </div>
                                  {entry.user && (
                                    <div>
                                      <div className="flex items-center gap-2 mb-1">
                                        <User className="w-4 h-4 text-gray-500" />
                                        <span className="text-sm font-medium text-gray-700">User</span>
                                      </div>
                                      <p className="text-gray-900 bg-white p-2 rounded-lg border">
                                        {entry.user.split('@')[0]}
                                      </p>
                                    </div>
                                  )}
                                </div>

                                {entry.task && (
                                  <div>
                                    <div className="flex items-center gap-2 mb-1">
                                      <FileText className="w-4 h-4 text-gray-500" />
                                      <span className="text-sm font-medium text-gray-700">Task</span>
                                    </div>
                                    <p className="text-gray-900 bg-white p-3 rounded-lg border">
                                      {entry.task}
                                    </p>
                                  </div>
                                )}

                                {entry.description && (
                                  <div>
                                    <div className="flex items-center gap-2 mb-1">
                                      <FileText className="w-4 h-4 text-gray-500" />
                                      <span className="text-sm font-medium text-gray-700">Description</span>
                                    </div>
                                    <p className="text-gray-900 bg-white p-3 rounded-lg border whitespace-pre-wrap">
                                      {entry.description}
                                    </p>
                                  </div>
                                )}

                                <div className="flex items-center justify-between text-sm text-gray-500 pt-2 border-t">
                                  <div className="flex items-center gap-4">
                                    <span>Entry ID: {entry.id}</span>
                                    {entry.weekends_included !== undefined && (
                                      <span>Weekends: {entry.weekends_included ? 'Included' : 'Excluded'}</span>
                                    )}
                                    {entry.country && (
                                      <span>Country: {entry.country}</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Статистика внизу */}
                  <div className="pt-4 border-t">
                    <h4 className="font-semibold mb-2 text-gray-700">Daily Summary</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-gray-50 rounded-lg border">
                        <p className="text-sm font-medium text-gray-700 mb-2">Hours by Project</p>
                        <ul className="space-y-2">
                          {getHoursByProject().map(([project, hours]) => (
                            <li key={project} className="flex justify-between items-center">
                              <span className="text-sm text-gray-600 truncate">{project}</span>
                              <span className="font-medium text-blue-600">{hours.toFixed(1)}h</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg border">
                        <p className="text-sm font-medium text-gray-700 mb-2">Tasks Breakdown</p>
                        <ul className="space-y-2">
                          {getTasksBreakdown().map(([task, count]) => (
                            <li key={task} className="flex justify-between items-center">
                              <span className="text-sm text-gray-600 truncate">{task}</span>
                              <span className="font-medium text-blue-600">{count}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Футер с кнопкой закрытия */}
            <div className="border-t p-4 flex justify-end">
              <Button onClick={() => setIsDetailsOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}