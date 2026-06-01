import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, FolderKanban, FileText, User, CalendarDays, Gift, Coffee, RefreshCw } from 'lucide-react';
import { useTimeTracker } from './TimeTrackerContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { useUserStore } from '../store/UsersStore';
import { useGetGlobalSettings } from '../hooks/useGlobalSettings';
import { useGetWorkingWeekends, useGetTimeEntrys } from '../hooks/useTimeEntry';

// Интерфейс для записи времени
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

interface WorkingWeekend {
  id: number;
  date: string;
  input_date: string;
  holiday_name: string | null;
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

// Расширенный интерфейс для рабочего выходного
interface WorkingWeekendTimeEntry extends TimeEntry {
  isWorkingWeekend: true;
  workingWeekendDescription?: string;
}

type SpecialDayEntry = TimeEntry | HolidayTimeEntry | WorkingWeekendTimeEntry;

// Маппинг дней недели для отображения
const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function CalendarView() {
  const { filters } = useTimeTracker();
  const time_entries = useUserStore((state) => state.time_entries);
  const calendar_holidays = useUserStore((state) => state.calendar_holidays);
  const currentMonth = useUserStore((state) => state.currentMonth);
  const setCurrentMonth = useUserStore((state) => state.setCurrentMonth);
  const currentYear = useUserStore((state) => state.currentYear);
  const setCurrentYear = useUserStore((state) => state.setCurrentYear);
  const me = useUserStore((state) => state.me);
  const workingWeekends = useUserStore((state) => state.workingWeekends);
  const { mutate: getWorkingWeekends } = useGetWorkingWeekends();
  const { mutate: getTimeEntrys } = useGetTimeEntrys();

  // Загружаем рабочие выходные при монтировании
  useEffect(() => {
    if (me?.country_id) {
      getWorkingWeekends(me.country_id);
    }
  }, [me?.country_id, getWorkingWeekends]);

  const safeTimeEntries = Array.isArray(time_entries) ? time_entries : [];
  const safeCalendarHolidays = Array.isArray(calendar_holidays) ? calendar_holidays : [];
  const safeWorkingWeekends = Array.isArray(workingWeekends) ? workingWeekends : [];

  const countryId = useMemo(() => {
    return me?.country_id ? String(me.country_id) : undefined;
  }, [me?.country_id]);

  const globalSettingsQuery = useGetGlobalSettings(countryId as any);
  const globSet = globalSettingsQuery?.data ?? null;
  const isLoadingSettings = globalSettingsQuery?.isLoading ?? false;
  const refetchGlobalSettings = globalSettingsQuery?.refetch;

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedDateEntries, setSelectedDateEntries] = useState<SpecialDayEntry[]>([]);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [currentEntryIndex, setCurrentEntryIndex] = useState(0);
  const [isLoadingEntries, setIsLoadingEntries] = useState(false);

  // Инициализация currentDate с проверкой на валидность сохраненных значений
  const [currentDate, setCurrentDate] = useState(() => {
    const today = new Date();
    const todayYear = today.getFullYear();
    const todayMonth = today.getMonth();

    // Проверяем сохраненные значения из store
    if (currentYear && currentMonth) {
      const savedYear = parseInt(currentYear);
      const savedMonth = parseInt(currentMonth);

      // Валидация: год должен быть между 2000 и 2100, месяц между 0 и 11
      if (!isNaN(savedYear) && !isNaN(savedMonth) &&
        savedYear >= 2000 && savedYear <= 2100 &&
        savedMonth >= 0 && savedMonth <= 11) {
        return new Date(savedYear, savedMonth, 1);
      }
    }

    // Если сохраненные значения некорректны, возвращаем текущую дату
    return new Date(todayYear, todayMonth, 1);
  });

  // Функция для загрузки записей за текущий месяц
  const loadEntriesForCurrentMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Вычисляем первый и последний день месяца
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const startDate = firstDay.toISOString().split('T')[0];
    const endDate = lastDay.toISOString().split('T')[0];

    console.log(`Loading entries for ${month + 1}/${year}: ${startDate} to ${endDate}`);

    setIsLoadingEntries(true);

    getTimeEntrys(
      { start_date: startDate, end_date: endDate, forceRefresh: true },
      {
        onSuccess: (data) => {
          console.log(`Loaded entries for ${month + 1}/${year}:`, data);
          setIsLoadingEntries(false);
        },
        onError: (error) => {
          console.error('Failed to load entries for month:', error);
          setIsLoadingEntries(false);
        }
      }
    );
  };

  // Эффект для синхронизации store с currentDate при монтировании (если были некорректные значения)
  useEffect(() => {
    const savedYear = currentYear ? parseInt(currentYear) : null;
    const savedMonth = currentMonth ? parseInt(currentMonth) : null;

    const isYearValid = savedYear !== null && !isNaN(savedYear) && savedYear >= 2000 && savedYear <= 2100;
    const isMonthValid = savedMonth !== null && !isNaN(savedMonth) && savedMonth >= 0 && savedMonth <= 11;

    // Если сохраненные значения некорректны, обновляем store
    if (!isYearValid || !isMonthValid) {
      const today = new Date();
      setCurrentMonth(today.getMonth().toString());
      setCurrentYear(today.getFullYear().toString());
    }
  }, []);

  // Загружаем записи при изменении месяца
  useEffect(() => {
    loadEntriesForCurrentMonth();
  }, [currentDate]);

  // Обновляем месяц в store при изменении
  useEffect(() => {
    if (setCurrentMonth) {
      setCurrentMonth(currentDate.getMonth().toString());
    }
  }, [currentDate, setCurrentMonth]);

  // Обновляем год в store при изменении
  useEffect(() => {
    if (setCurrentYear) {
      setCurrentYear(currentDate.getFullYear().toString());
    }
  }, [currentDate, setCurrentYear]);

  const allEntries = useMemo(() => {
    return safeTimeEntries;
  }, [safeTimeEntries]);

  const workingDays = useMemo(() => {
    return globSet?.working_days ?? [0, 1, 2, 3, 4];
  }, [globSet]);

  const isDayOff = (dateStr: string): boolean => {
    const date = new Date(dateStr);
    let dayOfWeek = date.getDay();
    const adjustedDayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    return !workingDays.includes(adjustedDayOfWeek);
  };

  const getWorkingWeekendForDate = (dateStr: string): WorkingWeekend | null => {
    if (safeWorkingWeekends.length === 0) return null;

    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const fullDate = `${year}-${month}-${day}`;

    const workingWeekend = safeWorkingWeekends.find(w => w.input_date === fullDate || w.date === fullDate);
    return workingWeekend || null;
  };

  const getHolidayForDate = (dateStr: string): CalendarHoliday | null => {
    if (safeCalendarHolidays.length === 0) return null;

    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const fullDate = `${year}-${month}-${day}`;
    const monthDay = `${month}-${day}`;

    const holiday = safeCalendarHolidays.find(h => {
      if (h.is_recurring) {
        return h.date === monthDay;
      }
      return h.date === fullDate;
    });

    return holiday || null;
  };

  const filteredEntries = useMemo(() => {
    // Сначала фильтруем по дате месяца
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const monthEntries = allEntries.filter(entry => {
      if (!entry?.date) return false;
      const entryDate = new Date(entry.date);
      return entryDate >= firstDay && entryDate <= lastDay;
    });

    // Затем применяем остальные фильтры
    return monthEntries.filter(entry => {
      if (filters.projects.length > 0 && entry.project && !filters.projects.includes(entry.project)) return false;
      if (filters.searchText && entry.description && !entry.description.toLowerCase().includes(filters.searchText.toLowerCase())) return false;
      if (filters.hoursRange !== 'all' && entry.hours) {
        const hours = entry.hours;
        if (filters.hoursRange === 'low' && hours >= 4) return false;
        if (filters.hoursRange === 'medium' && (hours < 4 || hours > 8)) return false;
        if (filters.hoursRange === 'high' && hours <= 8) return false;
      }
      return true;
    });
  }, [allEntries, filters, currentDate]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  let startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const previousMonth = () => {
    const newDate = new Date(year, month - 1, 1);
    setCurrentDate(newDate);
  };

  const nextMonth = () => {
    const newDate = new Date(year, month + 1, 1);
    setCurrentDate(newDate);
  };

  const goToCurrentMonth = () => {
    const today = new Date();
    const newDate = new Date(today.getFullYear(), today.getMonth(), 1);
    setCurrentDate(newDate);
  };

  const handleRefresh = async () => {
    await refetchGlobalSettings?.();
    if (me?.country_id) {
      getWorkingWeekends(me.country_id);
    }
    loadEntriesForCurrentMonth(); // Перезагружаем записи за текущий месяц
  };

  const getEntriesForDate = (day: number): SpecialDayEntry[] => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const regularEntries = filteredEntries.filter(entry => entry.date === dateStr);
    const holiday = getHolidayForDate(dateStr);
    const workingWeekend = getWorkingWeekendForDate(dateStr);

    const result: SpecialDayEntry[] = [...regularEntries];

    // Добавляем праздник, если есть
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
        description: holiday.description || `Public holiday: ${holiday.holiday_name}.`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        isHoliday: true,
        holidayName: holiday.holiday_name,
        holidayDescription: holiday.description
      };
      result.unshift(holidayEntry);
    }

    // Добавляем рабочий выходной, если есть (даже если есть обычные записи)
    if (workingWeekend) {
      const workingWeekendEntry: WorkingWeekendTimeEntry = {
        id: -workingWeekend.id,
        user: 'System',
        country: null,
        client: null,
        project: 'Working Weekend',
        project_color: '#16A34A',
        project_code: 'WW',
        task_type: 'Working Weekend',
        task: 'Working Day on Weekend',
        weekends_included: false,
        date: dateStr,
        hours: 0,
        description: workingWeekend.description || 'This day is marked as a working day (working weekend).',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        isWorkingWeekend: true,
        workingWeekendDescription: workingWeekend.description
      };
      result.unshift(workingWeekendEntry);
    }

    return result;
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

  const handlePreviousEntry = () => setCurrentEntryIndex(prev => Math.max(0, prev - 1));
  const handleNextEntry = () => setCurrentEntryIndex(prev => Math.min(selectedDateEntries.length - 1, prev + 1));

  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  const calendarDays = [];
  for (let i = 0; i < startOffset; i++) calendarDays.push(null);
  for (let day = 1; day <= daysInMonth; day++) calendarDays.push(day);

  const isToday = (day: number | null) => {
    if (!day) return false;
    const today = new Date();
    return day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
  };

  const currentEntry = selectedDateEntries[currentEntryIndex];

  const isHolidayEntry = (entry: any): entry is HolidayTimeEntry => entry && entry.isHoliday === true;
  const isWorkingWeekendEntry = (entry: any): entry is WorkingWeekendTimeEntry => entry && entry.isWorkingWeekend === true;

  const getProjectColor = (entry: SpecialDayEntry) => {
    if (isHolidayEntry(entry)) return '#DC2626';
    if (isWorkingWeekendEntry(entry)) return '#16A34A';
    return entry.project_color || '#0066CC';
  };

  const getProjectName = (entry: SpecialDayEntry) => {
    if (isHolidayEntry(entry)) return 'Holiday';
    if (isWorkingWeekendEntry(entry)) return 'Working Weekend';
    return entry.project_code || entry.project || 'Unknown Project';
  };

  const getClient = (entry: SpecialDayEntry) => {
    if (isHolidayEntry(entry)) return 'Public Holiday';
    if (isWorkingWeekendEntry(entry)) return 'System';
    return entry.client || 'No client';
  };

  const getTaskType = (entry: SpecialDayEntry) => {
    if (isHolidayEntry(entry)) return 'Holiday';
    if (isWorkingWeekendEntry(entry)) return 'Working Weekend';
    return entry.task_type || 'No type';
  };

  const getTaskName = (entry: SpecialDayEntry) => {
    if (isHolidayEntry(entry)) return entry.task || entry.holidayName || 'Public Holiday';
    if (isWorkingWeekendEntry(entry)) return 'Working Day on Weekend';
    return entry.task || entry.task_type || 'No task';
  };

  const getDescription = (entry: SpecialDayEntry) => {
    if (isWorkingWeekendEntry(entry)) {
      return entry.workingWeekendDescription || 'This day is marked as a working day (working weekend).';
    }
    return entry.description;
  };

  return (
    <>
      <Card className="shadow-md hover:shadow-lg transition-shadow border-t-4" style={{ borderTopColor: '#0066CC' }}>
        <CardHeader style={{ backgroundColor: '#F1F5F9', height: '100px' }} className="border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2" style={{ color: '#1F4E78' }}>
                <CalendarIcon className="w-5 h-5" />
                Calendar View
              </CardTitle>
              <CardDescription>
                {isLoadingEntries && 'Loading entries for this month...'}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoadingSettings || isLoadingEntries}>
                <RefreshCw className={`w-4 h-4 mr-1 ${isLoadingSettings || isLoadingEntries ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button variant="outline" size="icon" onClick={previousMonth} disabled={isLoadingEntries}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={goToCurrentMonth} disabled={isLoadingEntries}>Today</Button>
              <div className="min-w-[180px] text-center font-medium">{monthName}</div>
              <Button variant="outline" size="icon" onClick={nextMonth} disabled={isLoadingEntries}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-7 gap-2">
            {weekDays.map(day => (
              <div key={day} className="text-center text-slate-600 p-2 font-medium">{day}</div>
            ))}

            {calendarDays.map((day, index) => {
              if (day === null) return <div key={`empty-${index}`} className="aspect-square" />;

              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const holiday = getHolidayForDate(dateStr);
              const workingWeekend = getWorkingWeekendForDate(dateStr);
              const isWorkingWeekendDay = workingWeekend !== null;
              const isDayOffDay = !isWorkingWeekendDay && isDayOff(dateStr);
              const dayEntries = getEntriesForDate(day);
              const regularEntriesCount = dayEntries.filter(e => !isHolidayEntry(e) && !isWorkingWeekendEntry(e)).length;
              const isHoliday = holiday !== null;
              const totalHours = getTotalHoursForDate(day);

              let dayBgColor = '', dayBorderColor = '', dayTextColor = '';

              if (isHoliday) {
                dayBgColor = '#FEF2F2';
                dayBorderColor = '#FECACA';
                dayTextColor = '#DC2626';
              } else if (isWorkingWeekendDay) {
                dayBgColor = 'white';
                dayBorderColor = '#E2E8F0';
                dayTextColor = '#166534';
              } else if (isDayOffDay) {
                dayBgColor = '#FEFCE8';
                dayBorderColor = '#FDE047';
                dayTextColor = '#B45309';
              } else if (isToday(day)) {
                dayBgColor = '#EFF6FF';
                dayBorderColor = '#0066CC';
                dayTextColor = '#0066CC';
              } else {
                dayBgColor = 'transparent';
                dayBorderColor = '#E2E8F0';
                dayTextColor = '#475569';
              }

              return (
                <button
                  key={day}
                  onClick={() => handleDayClick(day)}
                  className="aspect-square border rounded-lg p-2 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 hover:bg-slate-50"
                  style={{ backgroundColor: dayBgColor, borderColor: dayBorderColor }}
                  disabled={isLoadingEntries}
                >
                  <div className="h-full flex flex-col">
                    <div className="text-center mb-1 flex items-center justify-center gap-1">
                      <span style={{ color: dayTextColor, fontWeight: isToday(day) || isHoliday ? 600 : 400 }}>
                        {day}
                      </span>
                      {isHoliday && <Gift className="w-3 h-3 text-red-500" />}
                      {isWorkingWeekendDay && !isHoliday && <RefreshCw className="w-3 h-3 text-green-500" />}
                      {isDayOffDay && !isHoliday && !isWorkingWeekendDay && <Coffee className="w-3 h-3 text-amber-500" />}
                    </div>

                    {(totalHours > 0 || regularEntriesCount > 0 || isHoliday || isWorkingWeekendDay) && (
                      <div className="flex-1 space-y-0 overflow-hidden mt-0">
                        <div className={`text-xs text-center font-medium rounded-md py-0.5 px-1 ${isHoliday && totalHours === 0 && regularEntriesCount === 0 ? 'text-red-600 bg-red-50' :
                          isWorkingWeekendDay && totalHours === 0 && regularEntriesCount === 0 ? 'text-green-600 bg-green-50' :
                            isDayOffDay && totalHours === 0 && regularEntriesCount === 0 ? 'text-amber-600 bg-amber-50' :
                              'text-blue-600 bg-blue-50'
                          }`}>
                          {totalHours > 0 && (
                            <div className="-mt-0.5">{`${totalHours.toFixed(1)}h`}</div>
                          )}
                          {regularEntriesCount > 0 && (
                            <div className="text-[10px] opacity-75 -mt-0.5">
                              {regularEntriesCount} {regularEntriesCount === 1 ? 'entry' : 'entries'}
                            </div>
                          )}
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
        <DialogContent className="max-w-5xl w-[90vw] max-h-[85vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="p-6 pb-4 shrink-0 bg-white border-b border-gray-100">
            <DialogTitle className="flex items-center gap-3 text-xl">
              <CalendarDays className="w-5 h-5 text-blue-600" />
              <span className="font-semibold">{selectedDate && formatDate(selectedDate)}</span>
            </DialogTitle>
            {selectedDateEntries.length > 0 && (
              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100">
                <span className="text-sm text-gray-600">
                  Total hours: <span className="font-bold text-blue-600">
                    {selectedDateEntries.reduce((sum, e) => sum + (e.hours || 0), 0).toFixed(1)}h
                  </span>
                </span>
                <div className="w-px h-4 bg-gray-200" />
                <span className="text-sm text-gray-600">
                  {selectedDateEntries.filter(e => !isHolidayEntry(e) && !isWorkingWeekendEntry(e)).length} {selectedDateEntries.filter(e => !isHolidayEntry(e) && !isWorkingWeekendEntry(e)).length === 1 ? 'entry' : 'entries'}
                </span>
              </div>
            )}
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
            {selectedDateEntries.length === 0 ? (
              <div className="flex items-center justify-center min-h-[300px]">
                <div className="text-center">
                  <CalendarIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500">No time entries for this day</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm" style={{ padding: '10px' }}>
                  <div className="p-5 bg-gray-50">
                    <div className="flex items-center gap-4">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: getProjectColor(currentEntry) + '15' }}
                      >
                        {isHolidayEntry(currentEntry) && <Gift className="w-5 h-5" style={{ color: getProjectColor(currentEntry) }} />}
                        {isWorkingWeekendEntry(currentEntry) && <RefreshCw className="w-5 h-5" style={{ color: getProjectColor(currentEntry) }} />}
                        {!isHolidayEntry(currentEntry) && !isWorkingWeekendEntry(currentEntry) && (
                          <FolderKanban className="w-5 h-5" style={{ color: getProjectColor(currentEntry) }} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-semibold text-gray-900">
                          {getProjectName(currentEntry)}
                        </h3>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 space-y-4">
                    <div className="flex items-center gap-6 flex-wrap">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          <span className="text-gray-400 mr-1">Type:</span>
                          {getTaskType(currentEntry)}
                        </span>
                      </div>

                      {!isHolidayEntry(currentEntry) && !isWorkingWeekendEntry(currentEntry) && (
                        <>
                          <div className="w-px h-5 bg-gray-200" />
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600">
                              <span className="text-gray-400 mr-1">Client:</span>
                              {getClient(currentEntry)}
                            </span>
                          </div>
                        </>
                      )}

                      {!isHolidayEntry(currentEntry) && !isWorkingWeekendEntry(currentEntry) && currentEntry.hours > 0 && (
                        <>
                          <div className="w-px h-5 bg-gray-200" />
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" style={{ color: getProjectColor(currentEntry) }} />
                            <span className="text-sm font-semibold" style={{ color: getProjectColor(currentEntry) }}>
                              {currentEntry.hours?.toFixed(1)} hours
                            </span>
                          </div>
                        </>
                      )}
                    </div>

                    <div>
                      {currentEntry.task && (
                        <div className="flex items-start gap-2 pt-2">
                          <span className="text-xs text-gray-400 mt-0.5">Task:</span>
                          <span className="text-sm text-gray-700 flex-1">{getTaskName(currentEntry)}</span>
                        </div>
                      )}

                      {getDescription(currentEntry) && (
                        <div className="flex items-start gap-2 pt-2">
                          <span className="text-xs text-gray-400 mt-0.5">Description:</span>
                          <span className="text-sm text-gray-600 flex-1 leading-relaxed">
                            {getDescription(currentEntry)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {selectedDateEntries.length > 1 && (
                  <div className="flex items-center justify-center gap-1.5 py-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                  </div>
                )}

                {selectedDateEntries.length > 1 && (
                  <div className="flex items-center justify-between gap-3 pt-2">
                    <Button variant="outline" size="sm" onClick={handlePreviousEntry} disabled={currentEntryIndex === 0} className="gap-1.5 px-4 rounded-lg text-sm">
                      <ChevronLeft className="w-3.5 h-3.5" />
                      Previous
                    </Button>
                    <div className="bg-gray-100 rounded-full px-3 py-1">
                      <span className="text-xs font-medium text-gray-600">
                        {currentEntryIndex + 1} / {selectedDateEntries.length}
                      </span>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleNextEntry} disabled={currentEntryIndex === selectedDateEntries.length - 1} className="gap-1.5 px-4 rounded-lg text-sm">
                      Next
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}