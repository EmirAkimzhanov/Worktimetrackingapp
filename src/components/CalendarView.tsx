import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, FolderKanban, FileText, User, CalendarDays, Gift, Coffee } from 'lucide-react';
import { useTimeTracker } from './TimeTrackerContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { useUserStore } from '../store/UsersStore';
import { useGetHolidayTimeEntrys } from '../hooks/useTimeEntry';
import { useGetGlobalSettings } from '../hooks/useGlobalSettings';

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

// Маппинг дней недели (0 = Sunday, 1 = Monday, ...)
const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function CalendarView() {
  const { filters } = useTimeTracker();
  const time_entries = useUserStore((state) => state.time_entries) as TimeEntry[];
  const calendar_holidays = useUserStore((state) => state.calendar_holidays) as CalendarHoliday[] | null;
  const currentMonth = useUserStore((state) => state.currentMonth);
  const setCurrentMonth = useUserStore((state) => state.setCurrentMonth);
  const me = useUserStore((state) => state.me);
  const globalSettings = useUserStore((state) => state.globalSettings);

  // Используем новый хук useGetGlobalSettings с правильным параметром
  const {
    data: globSet,
    refetch: refetchGlobalSettings,
    isLoading: isLoadingSettings
  } = useGetGlobalSettings(me?.country_id || '');

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedDateEntries, setSelectedDateEntries] = useState<(TimeEntry | HolidayTimeEntry)[]>([]);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [currentEntryIndex, setCurrentEntryIndex] = useState(0);

  // Инициализация currentDate из store или текущей даты
  const [currentDate, setCurrentDate] = useState(() => {
    if (currentMonth) {
      return new Date(currentMonth);
    }
    return new Date();
  });

  // Сохраняем выбранный месяц в store при изменении
  useEffect(() => {
    if (setCurrentMonth) {
      setCurrentMonth(currentDate);
    }
  }, [currentDate, setCurrentMonth]);

  // Получаем все записи времени из хранилища
  const allEntries = useMemo(() => {
    return time_entries || [];
  }, [time_entries]);

  // Функция для проверки, является ли день выходным (не входит в working_days)
  const isDayOff = (dateStr: string): boolean => {
    // Используем globSet из запроса или globalSettings из store
    const settings = globSet || globalSettings;
    if (!settings || !settings.working_days) return false;

    const date = new Date(dateStr);
    const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, ...

    // Если день недели не входит в список рабочих дней - это выходной
    return !settings.working_days.includes(dayOfWeek);
  };

  // Функция для проверки, является ли дата праздником
  const getHolidayForDate = (dateStr: string): CalendarHoliday | null => {
    if (!calendar_holidays || calendar_holidays.length === 0) {
      return null;
    }

    const date = new Date(dateStr);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const monthDay = `${month}-${day}`;

    const holiday = calendar_holidays.find(h => h.date === monthDay);
    return holiday || null;
  };

  const filteredEntries = useMemo(() => {
    const filtered = allEntries.filter(entry => {
      if (!entry) return false;

      if (filters.projects.length > 0 && entry.project &&
        !filters.projects.includes(entry.project)) {
        return false;
      }

      if (filters.searchText && entry.description &&
        !entry.description.toLowerCase().includes(filters.searchText.toLowerCase())) {
        return false;
      }

      if (filters.hoursRange !== 'all' && entry.hours) {
        const hours = entry.hours;
        if (filters.hoursRange === 'low' && hours >= 4) return false;
        if (filters.hoursRange === 'medium' && (hours < 4 || hours > 8)) return false;
        if (filters.hoursRange === 'high' && hours <= 8) return false;
      }

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

  const goToCurrentMonth = () => {
    setCurrentDate(new Date());
  };

  const getEntriesForDate = (day: number): (TimeEntry | HolidayTimeEntry)[] => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    const regularEntries = filteredEntries.filter(entry => {
      return entry.date === dateStr;
    });

    const holiday = getHolidayForDate(dateStr);

    if (holiday) {
      const holidayEntry: HolidayTimeEntry = {
        id: -holiday.id,
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

  const getProjectColor = (entry: TimeEntry | HolidayTimeEntry) => {
    if (isHolidayEntry(entry)) {
      return '#DC2626';
    }
    return entry.project_color || '#0066CC';
  };

  const getProjectCode = (entry: TimeEntry | HolidayTimeEntry) => {
    if (isHolidayEntry(entry)) {
      return 'HOL';
    }
    return entry.project_code || 'PRJ';
  };

  const getProjectName = (entry: TimeEntry | HolidayTimeEntry) => {
    if (isHolidayEntry(entry)) {
      return 'Holiday';
    }
    return entry.project_code || entry.project || 'Unknown Project';
  };

  const getClient = (entry: TimeEntry | HolidayTimeEntry) => {
    if (isHolidayEntry(entry)) {
      return 'Public Holiday';
    }
    return entry.client || 'No client';
  };

  const getTaskType = (entry: TimeEntry | HolidayTimeEntry) => {
    if (isHolidayEntry(entry)) {
      return 'Holiday';
    }
    return entry.task_type || 'No type';
  };

  const getTaskName = (entry: TimeEntry | HolidayTimeEntry) => {
    if (isHolidayEntry(entry)) {
      return entry.task || entry.holidayName || 'Public Holiday';
    }
    return entry.task || entry.task_type || 'No task';
  };

  const currentSettings = globSet || globalSettings;

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
                {currentSettings && (
                  <span className="ml-2 text-xs">
                    • Working days: {currentSettings.working_days?.map(d => dayNames[d]).join(', ')}
                  </span>
                )}
                {isLoadingSettings && <span className="ml-2 text-xs text-gray-400">• Loading settings...</span>}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetchGlobalSettings()}
                disabled={isLoadingSettings}
              >
                Refresh
              </Button>
              <Button variant="outline" size="icon" onClick={previousMonth}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={goToCurrentMonth}>
                Today
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
              const isDayOffDay = isDayOff(dateStr);
              const dayEntries = getEntriesForDate(day);
              const totalHours = getTotalHoursForDate(day);
              const isHoliday = holiday !== null;

              // Определяем стиль для дня
              let dayBgColor = '';
              let dayBorderColor = '';
              let dayTextColor = '';

              if (isHoliday) {
                // Праздничные дни - красный
                dayBgColor = '#FEF2F2';
                dayBorderColor = '#FECACA';
                dayTextColor = '#DC2626';
              } else if (isDayOffDay) {
                // Выходные дни (не в working_days) - желтый
                dayBgColor = '#FEFCE8';
                dayBorderColor = '#FDE047';
                dayTextColor = '#B45309';
              } else if (isToday(day)) {
                // Сегодняшний день - синий
                dayBgColor = '#EFF6FF';
                dayBorderColor = '#0066CC';
                dayTextColor = '#0066CC';
              } else {
                // Обычные рабочие дни
                dayBgColor = 'transparent';
                dayBorderColor = '#E2E8F0';
                dayTextColor = '#475569';
              }

              return (
                <button
                  key={day}
                  onClick={() => handleDayClick(day)}
                  className="aspect-square border rounded-lg p-2 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 hover:bg-slate-50"
                  style={{
                    backgroundColor: dayBgColor,
                    borderColor: dayBorderColor
                  }}
                >
                  <div className="h-full flex flex-col">
                    <div className="text-center mb-1 flex items-center justify-center gap-1">
                      <span style={{ color: dayTextColor, fontWeight: isToday(day) || isHoliday ? 600 : 400 }}>
                        {day}
                      </span>
                      {isHoliday && <Gift className="w-3 h-3 text-red-500" />}
                      {isDayOffDay && !isHoliday && <Coffee className="w-3 h-3 text-amber-500" />}
                    </div>

                    {isHoliday && holiday && (
                      <div className="text-[10px] text-red-600 text-center font-medium truncate px-1">
                        {holiday.holiday_name}
                      </div>
                    )}

                    {isDayOffDay && !isHoliday && (
                      <div className="text-[10px] text-amber-600 text-center font-medium truncate px-1">
                        Day Off
                      </div>
                    )}

                    {!isHoliday && !isDayOffDay && dayEntries.filter(e => !isHolidayEntry(e)).length > 0 && (
                      <div className="flex-1 space-y-1 overflow-hidden mt-1">
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
        </CardContent>
      </Card>

      {/* Модальное окно с деталями дня - без изменений */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        {/* ... содержимое модального окна без изменений ... */}
        <DialogContent className="w-[90vw] h-[90vh] flex flex-col p-0">
          <DialogHeader className="p-3 border-b shrink-0">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <DialogTitle className="flex items-center gap-2 text-xl">
                <CalendarDays className="w-5 h-5 flex-shrink-0" />
                <span>{selectedDate && formatDate(selectedDate)}</span>
              </DialogTitle>
            </div>

            {selectedDateEntries.length > 0 && (
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                <span>Total: {selectedDateEntries.reduce((sum, e) => sum + (e.hours || 0), 0).toFixed(1)}h</span>
                <span>•</span>
                <span>{selectedDateEntries.length} entries</span>
              </div>
            )}
          </DialogHeader>

          <div className="flex-1 flex flex-col p-3 overflow-y-auto">
            {selectedDateEntries.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <CalendarIcon className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p className="text-lg">No time entries for this day</p>
                </div>
              </div>
            ) : (
              currentEntry && (
                <div className="flex-1 flex flex-col h-full">
                  <div style={{ marginBottom: '15px', padding: '10px' }} className={`p-5 rounded-xl mb-6 ${isHolidayEntry(currentEntry) ? 'bg-red-50 border border-red-100' : 'bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100'}`}>
                    <div className="flex gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div
                          className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm"
                          style={{ backgroundColor: getProjectColor(currentEntry) + '20', border: `1px solid ${getProjectColor(currentEntry)}30` }}
                        >
                          {isHolidayEntry(currentEntry) ? (
                            <Gift className="w-7 h-7" style={{ color: getProjectColor(currentEntry) }} />
                          ) : (
                            <FolderKanban className="w-7 h-7" style={{ color: getProjectColor(currentEntry) }} />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h2 className="text-xl font-bold text-gray-800">
                              {getProjectName(currentEntry)}
                            </h2>
                            <span
                              className="px-2 py-0.5 rounded-md text-xs font-mono"
                              style={{
                                backgroundColor: getProjectColor(currentEntry) + '15',
                                color: getProjectColor(currentEntry),
                                border: `1px solid ${getProjectColor(currentEntry)}30`
                              }}
                            >
                              {getProjectCode(currentEntry)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex-1">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Task Type</div>
                            <div className="flex items-center gap-1.5 text-sm text-gray-700">
                              <FileText className="w-3.5 h-3.5" />
                              <span>{getTaskType(currentEntry)}</span>
                            </div>
                          </div>

                          {!isHolidayEntry(currentEntry) && currentEntry.client && (
                            <div>
                              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Client</div>
                              <div className="flex items-center gap-1.5 text-sm text-gray-700">
                                <User className="w-3.5 h-3.5" />
                                <span>{getClient(currentEntry)}</span>
                              </div>
                            </div>
                          )}

                          {!isHolidayEntry(currentEntry) && currentEntry.hours > 0 && (
                            <div>
                              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Hours</div>
                              <div className="flex items-center gap-1.5 text-sm font-semibold text-blue-700">
                                <Clock className="w-3.5 h-3.5" />
                                <span>{currentEntry.hours?.toFixed(1)} hours</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Date</div>
                      <div className="text-gray-900">
                        {new Date(currentEntry.date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </div>
                    </div>

                    {!isHolidayEntry(currentEntry) && currentEntry.user && (
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">User</div>
                        <div className="text-gray-900">
                          {currentEntry.user}
                        </div>
                      </div>
                    )}

                    {currentEntry.task && (
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                          {isHolidayEntry(currentEntry) ? 'Holiday Name' : 'Task'}
                        </div>
                        <div className="text-gray-900">
                          {getTaskName(currentEntry)}
                        </div>
                      </div>
                    )}

                    {currentEntry.description && (
                      <div className="md:col-span-2 bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Description</div>
                        <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                          {currentEntry.description}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-6 mt-6 border-t border-gray-200">
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
        </DialogContent>
      </Dialog>
    </>
  );
}