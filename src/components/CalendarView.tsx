import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, FolderKanban, FileText, User, CalendarDays, ChevronUp, ChevronDown, Gift, Star } from 'lucide-react';
import { useTimeTracker } from './TimeTrackerContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { useUserStore } from '../store/UsersStore';
import { useGetHolidayTimeEntrys } from '../hooks/useTimeEntry';

// Интерфейс для записи времени в новом формате
interface TimeEntry {
  id: number;
  user: string;
  country: string | null;
  client: string | null;
  project: string | null;
  project_color: string | null;
  project_code: string | null;
  task_type: string | null;
  task: string | null;
  weekends_included: boolean;
  date: string;
  hours: number;
  description: string;
  created_at: string;
  updated_at: string;
}

interface CalendarHoliday {
  id: number;
  date: string;
  holiday_name: string;
  day_type: string;
  description: string;
  is_recurring: boolean;
  country: number;
}

// Расширенный интерфейс для праздника как задачи
interface HolidayTimeEntry extends TimeEntry {
  isHoliday: true;
  holidayName: string;
  holidayDescription?: string;
}

export function CalendarView() {
  const { filters } = useTimeTracker();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedDateEntries, setSelectedDateEntries] = useState<(TimeEntry | HolidayTimeEntry)[]>([]);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [currentEntryIndex, setCurrentEntryIndex] = useState(0);
  const time_entries = useUserStore((state) => state.time_entries) as TimeEntry[];
  const calendar_holidays = useUserStore((state) => state.calendar_holidays) as CalendarHoliday[] | null;

  // Получаем все записи времени из хранилища
  const allEntries = useMemo(() => {
    return time_entries || [];
  }, [time_entries]);

  // Функция для проверки, является ли дата праздником
  const getHolidayForDate = (dateStr: string): CalendarHoliday | null => {
    if (!calendar_holidays || calendar_holidays.length === 0) {
      return null;
    }

    const date = new Date(dateStr);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const monthDay = `${month}-${day}`;

    // Ищем праздник для этой даты
    const holiday = calendar_holidays.find(h => h.date === monthDay);
    return holiday || null;
  };

  const filteredEntries = useMemo(() => {
    const filtered = allEntries.filter(entry => {
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
        const hours = entry.hours;
        if (filters.hoursRange === 'low' && hours >= 4) return false;
        if (filters.hoursRange === 'medium' && (hours < 4 || hours > 8)) return false;
        if (filters.hoursRange === 'high' && hours <= 8) return false;
      }

      // Фильтрация по диапазону дат
      if (filters.dateRange && entry.date) {
        const entryDate = new Date(entry.date);
        const [start, end] = filters.dateRange;
        if (entryDate < new Date(start) || entryDate > new Date(end)) {
          return false;
        }
      }

      return true;
    });

    return filtered;
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

  const getEntriesForDate = (day: number): (TimeEntry | HolidayTimeEntry)[] => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    const regularEntries = filteredEntries.filter(entry => {
      return entry.date === dateStr;
    });

    const holiday = getHolidayForDate(dateStr);

    if (holiday) {
      // Создаем объект праздника как задачу
      const holidayEntry: HolidayTimeEntry = {
        id: -holiday.id, // Используем отрицательный ID для отличия от обычных задач
        user: 'System',
        country: null,
        client: null,
        project: 'Holidays',
        project_color: '#DC2626',
        project_code: 'HOL',
        task_type: 'Holiday',
        task: holiday.holiday_name,
        weekends_included: false,
        date: dateStr,
        hours: 0,
        description: holiday.description || `Public holiday: ${holiday.holiday_name}. ${holiday.day_type === 'working' ? 'Working day' : 'Non-working day'}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        isHoliday: true,
        holidayName: holiday.holiday_name,
        holidayDescription: holiday.description
      };

      // Возвращаем праздник вместе с обычными задачами
      return [holidayEntry, ...regularEntries];
    }

    return regularEntries;
  };

  const getTotalHoursForDate = (day: number) => {
    const dayEntries = getEntriesForDate(day);
    return dayEntries.reduce((sum, entry) => sum + (entry.hours || 0), 0);
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
    setCurrentEntryIndex(0);
    setIsDetailsOpen(true);
  };

  const handlePreviousEntry = () => {
    setCurrentEntryIndex(prev => Math.max(0, prev - 1));
  };

  const handleNextEntry = () => {
    setCurrentEntryIndex(prev => Math.min(selectedDateEntries.length - 1, prev + 1));
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

  // Получение текущей записи
  const currentEntry = selectedDateEntries[currentEntryIndex];

  // Проверка, является ли запись праздником
  const isHolidayEntry = (entry: any): entry is HolidayTimeEntry => {
    return entry && entry.isHoliday === true;
  };

  // Получение цвета проекта
  const getProjectColor = (entry: TimeEntry | HolidayTimeEntry) => {
    if (isHolidayEntry(entry)) {
      return '#DC2626';
    }
    return entry.project_color || '#0066CC';
  };

  // Получение кода проекта
  const getProjectCode = (entry: TimeEntry | HolidayTimeEntry) => {
    if (isHolidayEntry(entry)) {
      return 'HOL';
    }
    return entry.project_code || 'PRJ';
  };

  // Получение названия проекта
  const getProjectName = (entry: TimeEntry | HolidayTimeEntry) => {
    if (isHolidayEntry(entry)) {
      return 'Holiday';
    }
    return entry.project_code || entry.project || 'Unknown Project';
  };

  // Получение клиента
  const getClient = (entry: TimeEntry | HolidayTimeEntry) => {
    if (isHolidayEntry(entry)) {
      return 'Public Holiday';
    }
    return entry.client || 'No client';
  };

  // Получение типа задачи
  const getTaskType = (entry: TimeEntry | HolidayTimeEntry) => {
    if (isHolidayEntry(entry)) {
      return 'Holiday';
    }
    return entry.task_type || 'No type';
  };

  // Получение названия задачи
  const getTaskName = (entry: TimeEntry | HolidayTimeEntry) => {
    if (isHolidayEntry(entry)) {
      return entry.task || entry.holidayName || 'Public Holiday';
    }
    return entry.task || entry.task_type || 'No task';
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
              <CardDescription>
                {allEntries.length > 0
                  ? `Click on a day to see task details (${allEntries.length} total entries)`
                  : 'No time entries yet'}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={previousMonth}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <div className="min-w-[180px] text-center font-medium">
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
              <div key={day} className="text-center text-slate-600 p-2 font-medium">
                {day}
              </div>
            ))}

            {calendarDays.map((day, index) => {
              if (day === null) {
                return <div key={`empty-${index}`} className="aspect-square" />;
              }

              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const holiday = getHolidayForDate(dateStr);
              const dayEntries = getEntriesForDate(day);
              const totalHours = getTotalHoursForDate(day);
              const isHoliday = holiday !== null;

              return (
                <button
                  key={day}
                  onClick={() => handleDayClick(day)}
                  className={`aspect-square border rounded-lg p-2 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 
                    ${isHoliday ? 'bg-red-50 border-red-200 hover:bg-red-100' : 'hover:bg-slate-50 border-slate-200'}
                    ${isToday(day) ? 'ring-2 ring-offset-1' : ''}`}
                  style={isToday(day) && !isHoliday ? { borderColor: '#0066CC', backgroundColor: '#EFF6FF' } :
                    isHoliday ? { borderColor: '#FECACA', backgroundColor: '#FEF2F2' } : {}}
                >
                  <div className="h-full flex flex-col">
                    <div className="text-center mb-1 flex items-center justify-center gap-1">
                      <span style={isToday(day) && !isHoliday ? { color: '#0066CC', fontWeight: 600 } :
                        isHoliday ? { color: '#DC2626', fontWeight: 600 } : {}}>
                        {day}
                      </span>
                      {isHoliday && (
                        <Gift className="w-3 h-3 text-red-500" />
                      )}
                    </div>

                    {isHoliday && holiday && (
                      <div className="text-[10px] text-red-600 text-center font-medium truncate px-1">
                        {holiday.holiday_name}
                      </div>
                    )}

                    {!isHoliday && dayEntries.filter(e => !isHolidayEntry(e)).length > 0 && (
                      <div className="flex-1 space-y-1 overflow-hidden">
                        {dayEntries.filter(e => !isHolidayEntry(e)).slice(0, 2).map(entry => {
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
                        {dayEntries.filter(e => !isHolidayEntry(e)).length > 2 && (
                          <div className="text-xs text-slate-500 px-1">
                            +{dayEntries.filter(e => !isHolidayEntry(e)).length - 2} more
                          </div>
                        )}
                        {totalHours > 0 && (
                          <div className="flex items-center gap-1 text-xs px-1 mt-1">
                            <Clock className="w-3 h-3" style={{ color: '#0066CC' }} />
                            <span style={{ color: '#0066CC', fontWeight: 600 }}>{totalHours.toFixed(1)}h</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {allEntries.length === 0 && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-700">
                ℹ️ No time entries found. Add some using the form above.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Модальное окно с деталями дня - версия с пагинацией */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl h-[600px] flex flex-col p-0">
          {/* Фиксированный заголовок с пагинацией */}
          <DialogHeader className="p-6 border-b shrink-0">
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2 text-xl">
                <CalendarDays className="w-5 h-5" />
                {selectedDate && formatDate(selectedDate)}
              </DialogTitle>

              {/* Индикатор страницы и навигация */}
              {selectedDateEntries.length > 0 && (
                <div className="flex items-center gap-4" style={{ marginTop: '15px' }}>
                  <span className="text-sm text-gray-500">
                    {currentEntryIndex + 1} of {selectedDateEntries.length} tasks
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handlePreviousEntry}
                      disabled={currentEntryIndex === 0}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleNextEntry}
                      disabled={currentEntryIndex === selectedDateEntries.length - 1}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Краткая статистика дня */}
            {selectedDateEntries.length > 0 && (
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                <span>Total: {selectedDateEntries.reduce((sum, e) => sum + (e.hours || 0), 0).toFixed(1)}h</span>
                <span>•</span>
                <span>{selectedDateEntries.length} entries</span>
              </div>
            )}
          </DialogHeader>

          {/* Прокручиваемое содержимое с текущей записью */}
          <div className="flex-1 overflow-y-auto p-6">
            {selectedDateEntries.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CalendarIcon className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p className="text-lg">No time entries for this day</p>
              </div>
            ) : (
              currentEntry && (
                <div className="space-y-4">
                  {/* Карточка текущей записи */}
                  <div className={`border rounded-lg overflow-hidden ${isHolidayEntry(currentEntry) ? 'border-red-200' : ''}`}>
                    {/* Заголовок с проектом */}
                    <div className={`p-6 border-b ${isHolidayEntry(currentEntry) ? 'bg-red-50' : 'bg-white'}`}>
                      <div className="flex items-center gap-4">
                        <div
                          className="w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: getProjectColor(currentEntry) + '20' }}
                        >
                          {isHolidayEntry(currentEntry) ? (
                            <Gift className="w-8 h-8" style={{ color: getProjectColor(currentEntry) }} />
                          ) : (
                            <FolderKanban className="w-8 h-8" style={{ color: getProjectColor(currentEntry) }} />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-gray-900">
                              {getProjectName(currentEntry)}
                            </h2>
                            {!isHolidayEntry(currentEntry) && currentEntry.hours > 0 && (
                              <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-lg">
                                <Clock className="w-5 h-5 text-blue-600" />
                                <span className="text-2xl font-bold text-blue-700">
                                  {currentEntry.hours?.toFixed(1)}h
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-3 flex-wrap">
                            <span
                              className="px-3 py-1 rounded-full text-sm"
                              style={{
                                backgroundColor: getProjectColor(currentEntry) + '20',
                                color: getProjectColor(currentEntry)
                              }}
                            >
                              {getProjectCode(currentEntry)}
                            </span>
                            <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm">
                              {getTaskType(currentEntry)}
                            </span>
                            {!isHolidayEntry(currentEntry) && currentEntry.client && (
                              <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm">
                                {getClient(currentEntry)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Детали записи */}
                    <div className="p-6 bg-gray-50">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <CalendarDays className="w-4 h-4 text-gray-500" />
                            <span className="text-sm font-medium text-gray-700">Date</span>
                          </div>
                          <p className="text-gray-900 bg-white p-3 rounded-lg border">
                            {new Date(currentEntry.date).toLocaleDateString('en-US', {
                              weekday: 'long',
                              month: 'long',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </p>
                        </div>

                        {!isHolidayEntry(currentEntry) && currentEntry.user && (
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <User className="w-4 h-4 text-gray-500" />
                              <span className="text-sm font-medium text-gray-700">User</span>
                            </div>
                            <p className="text-gray-900 bg-white p-3 rounded-lg border">
                              {currentEntry.user}
                            </p>
                          </div>
                        )}
                      </div>

                      {currentEntry.task && (
                        <div className="mt-4">
                          <div className="flex items-center gap-2 mb-2">
                            {isHolidayEntry(currentEntry) ? (
                              <Gift className="w-4 h-4 text-red-500" />
                            ) : (
                              <FileText className="w-4 h-4 text-gray-500" />
                            )}
                            <span className="text-sm font-medium text-gray-700">
                              {isHolidayEntry(currentEntry) ? 'Holiday Name' : 'Task'}
                            </span>
                          </div>
                          <p className={`text-gray-900 bg-white p-4 rounded-lg border ${isHolidayEntry(currentEntry) ? 'border-red-200' : ''}`}>
                            {getTaskName(currentEntry)}
                          </p>
                        </div>
                      )}

                      {currentEntry.description && (
                        <div className="mt-4">
                          <div className="flex items-center gap-2 mb-2">
                            <FileText className="w-4 h-4 text-gray-500" />
                            <span className="text-sm font-medium text-gray-700">Description</span>
                          </div>
                          <p className="text-gray-900 bg-white p-4 rounded-lg border whitespace-pre-wrap min-h-[100px]">
                            {currentEntry.description}
                          </p>
                        </div>
                      )}

                      {/* Дополнительная информация */}
                      <div className="mt-4 pt-4 border-t flex flex-wrap gap-4 text-sm text-gray-500">
                        {!isHolidayEntry(currentEntry) && currentEntry.country && (
                          <span>📍 Country: {currentEntry.country}</span>
                        )}
                        {!isHolidayEntry(currentEntry) && currentEntry.weekends_included !== undefined && (
                          <span>📅 Weekends: {currentEntry.weekends_included ? 'Included' : 'Excluded'}</span>
                        )}
                        <span>🆔 ID: {currentEntry.id}</span>
                        {isHolidayEntry(currentEntry) && (
                          <span>🎉 This is a public holiday</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Навигация снизу (дубль для удобства) */}
                  <div className="flex items-center justify-between pt-2">
                    <Button
                      variant="outline"
                      onClick={handlePreviousEntry}
                      disabled={currentEntryIndex === 0}
                      className="gap-2"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Previous Task
                    </Button>
                    <span className="text-sm text-gray-500">
                      Task {currentEntryIndex + 1} of {selectedDateEntries.length}
                    </span>
                    <Button
                      variant="outline"
                      onClick={handleNextEntry}
                      disabled={currentEntryIndex === selectedDateEntries.length - 1}
                      className="gap-2"
                    >
                      Next Task
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )
            )}
          </div>

          {/* Фиксированный футер */}
          <div className="border-t p-4 flex justify-end shrink-0 bg-white">
            <Button onClick={() => setIsDetailsOpen(false)} size="lg" variant="default">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}