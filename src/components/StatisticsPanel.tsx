import React, { useMemo, useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Clock, Calendar, TrendingUp, FileText } from 'lucide-react';
import { useTimeTracker } from './TimeTrackerContext';
import { useUserStore } from '../store/UsersStore';
import { useGetTimeEntriesStats, useGetTimeEntrys } from '../hooks/useTimeEntry';

// Функция для безопасного преобразования в число
const safeToNumber = (value: any): number => {
  if (value === null || value === undefined) return 0;
  const num = Number(value);
  return isNaN(num) ? 0 : num;
};

// Функция для безопасного форматирования с toFixed
const safeToFixed = (value: any, digits: number = 1): string => {
  const num = safeToNumber(value);
  return num.toFixed(digits);
};

export function StatisticsPanel() {
  const { filters } = useTimeTracker();
  const time_entries = useUserStore((state) => state.time_entries);
  const { mutate: getTimeEntrys } = useGetTimeEntrys();
  const setCurrentMonth = useUserStore((state) => state.setCurrentMonth);
  const setCurrentYear = useUserStore((state) => state.setCurrentYear);
  const currentMonth = useUserStore((state) => state.currentMonth);
  const currentYear = useUserStore((state) => state.currentYear);
  const timeEntriesStats = useUserStore((state) => state.time_entries_stats);
  const { mutate: getTimeEntriesStats } = useGetTimeEntriesStats();

  const [isStatsLoading, setIsStatsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Получаем сегодняшнюю дату
  const today = new Date();
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth(); // 0-11

  // При монтировании устанавливаем текущий месяц и год в store
  useEffect(() => {
    if (!isInitialized) {
      console.log('Initializing with today\'s date:', { year: todayYear, month: todayMonth });
      setCurrentMonth(todayMonth.toString());
      setCurrentYear(todayYear.toString());
      setIsInitialized(true);
    }
  }, []);

  // Используем значения из store или сегодняшнюю дату
  const selectedYear = currentYear ? parseInt(currentYear) : todayYear;
  const selectedMonth = currentMonth ? parseInt(currentMonth) : todayMonth;

  // Загружаем данные при монтировании и при изменении месяца/года
  useEffect(() => {
    if (isInitialized) {
      loadTimeEntries();
      loadStats();
    }
  }, [currentMonth, currentYear, isInitialized]);

  const loadTimeEntries = () => {
    getTimeEntrys(undefined, {
      onSuccess: (data) => {
        console.log('Time entries loaded for statistics');
      },
      onError: (error) => {
        console.error('Statistics: Failed to load time entries:', error);
      }
    });
  };

  const loadStats = () => {
    // Используем сегодняшнюю дату если значения в store нет
    const year = currentYear || todayYear.toString();
    const month = currentMonth || todayMonth.toString();

    const yearNum = parseInt(year);
    const monthNum = parseInt(month);

    if (isNaN(yearNum) || isNaN(monthNum)) {
      console.error('Invalid year or month:', { year, month });
      return;
    }

    console.log('Loading stats for:', { year: yearNum, month: monthNum + 1 });

    setIsStatsLoading(true);
    getTimeEntriesStats(
      { year: year, month: (monthNum + 1).toString() }, // API ожидает месяц 1-12
      {
        onSuccess: (data) => {
          console.log('Statistics loaded:', data);
          setIsStatsLoading(false);
        },
        onError: (error) => {
          console.error('Failed to load statistics:', error);
          setIsStatsLoading(false);
        }
      }
    );
  };

  const statistics = useMemo(() => {
    // Проверяем валидность месяца и года
    if (isNaN(selectedYear) || isNaN(selectedMonth)) {
      return {
        totalHours: '0.0',
        avgHoursPerDay: '0.0',
        uniqueDays: 0,
        recordCount: 0,
        isFiltered: false,
        totalWorkingDays: 0,
        expectedHours: 0,
        completionRate: '0.0',
        monthName: '',
        year: selectedYear,
      };
    }

    // Если есть статистика из API, используем её
    if (timeEntriesStats) {
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
      const monthName = selectedMonth >= 0 && selectedMonth <= 11 ? monthNames[selectedMonth] : '';

      // ИСПРАВЛЕНО: безопасное преобразование чисел
      const totalHours = safeToNumber(timeEntriesStats.total_hours);
      const workedDays = safeToNumber(timeEntriesStats.worked_days);
      const totalWorkingDays = safeToNumber(timeEntriesStats.total_working_days);
      const expectedHours = safeToNumber(timeEntriesStats.expected_hours);
      const completionRate = safeToNumber(timeEntriesStats.completion_rate);
      const totalRecords = safeToNumber(timeEntriesStats.total_records);

      return {
        totalHours: safeToFixed(totalHours, 1),
        avgHoursPerDay: workedDays > 0 ? safeToFixed(totalHours / workedDays, 1) : '0.0',
        uniqueDays: workedDays,
        recordCount: totalRecords,
        isFiltered: filters.projects.length > 0 ||
          filters.searchText !== '' ||
          filters.hoursRange !== 'all',
        totalWorkingDays: totalWorkingDays,
        expectedHours: expectedHours,
        completionRate: safeToFixed(completionRate, 1),
        monthName,
        year: selectedYear,
      };
    }

    // Fallback: рассчитываем из time_entries
    const entries = Array.isArray(time_entries) ? time_entries : [];

    if (entries.length === 0) {
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
      const monthName = selectedMonth >= 0 && selectedMonth <= 11 ? monthNames[selectedMonth] : '';

      return {
        totalHours: '0.0',
        avgHoursPerDay: '0.0',
        uniqueDays: 0,
        recordCount: 0,
        isFiltered: false,
        totalWorkingDays: 0,
        expectedHours: 0,
        completionRate: '0.0',
        monthName,
        year: selectedYear,
      };
    }

    // Трансформируем записи из стора в формат для фильтрации
    const transformedEntries = entries.map(entry => ({
      id: entry.id,
      date: entry.date || entry.start_date,
      hours: safeToNumber(entry.hours || 0),
      description: entry.description || '',
      projectId: entry.project?.toString() || '',
      projectCode: entry.project_code || '',
      projectName: entry.project_name || '',
      task_type: entry.task_type,
      task: entry.task,
      country: entry.country,
      client: entry.client,
    }));

    // Сначала фильтруем по выбранному месяцу из календаря
    const monthFilteredEntries = transformedEntries.filter(entry => {
      if (!entry.date) return false;
      const entryDate = new Date(entry.date);
      const entryYear = entryDate.getFullYear();
      const entryMonth = entryDate.getMonth();
      return entryYear === selectedYear && entryMonth === selectedMonth;
    });

    // Затем применяем остальные фильтры
    const filteredEntries = monthFilteredEntries.filter(entry => {
      if (filters.projects.length > 0 && !filters.projects.includes(entry.projectId)) {
        return false;
      }
      if (filters.searchText && !entry.description?.toLowerCase().includes(filters.searchText.toLowerCase())) {
        return false;
      }
      if (filters.hoursRange !== 'all') {
        if (filters.hoursRange === 'low' && entry.hours >= 4) return false;
        if (filters.hoursRange === 'medium' && (entry.hours < 4 || entry.hours > 8)) return false;
        if (filters.hoursRange === 'high' && entry.hours <= 8) return false;
      }
      return true;
    });

    const totalHours = filteredEntries.reduce((sum, entry) => sum + entry.hours, 0);
    const uniqueDays = new Set(filteredEntries.map(entry => entry.date)).size;
    const avgHoursPerDay = uniqueDays > 0 ? totalHours / uniqueDays : 0;
    const recordCount = filteredEntries.length;

    const getWorkingDaysCount = (year: number, month: number): number => {
      const date = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      let workingDays = 0;
      while (date <= lastDay) {
        const dayOfWeek = date.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
          workingDays++;
        }
        date.setDate(date.getDate() + 1);
      }
      return workingDays;
    };

    const totalWorkingDays = getWorkingDaysCount(selectedYear, selectedMonth);
    const expectedHours = totalWorkingDays * 8;
    const completionRate = expectedHours > 0 ? (totalHours / expectedHours) * 100 : 0;

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    const monthName = selectedMonth >= 0 && selectedMonth <= 11 ? monthNames[selectedMonth] : '';

    return {
      totalHours: safeToFixed(totalHours, 1),
      avgHoursPerDay: safeToFixed(avgHoursPerDay, 1),
      uniqueDays,
      recordCount,
      isFiltered: filters.projects.length > 0 ||
        filters.searchText !== '' ||
        filters.hoursRange !== 'all',
      totalWorkingDays,
      expectedHours,
      completionRate: safeToFixed(completionRate, 1),
      monthName,
      year: selectedYear,
    };
  }, [time_entries, filters, currentMonth, currentYear, timeEntriesStats, selectedYear, selectedMonth]);

  const stats = [
    {
      title: `Total Hours (${statistics.monthName || ''} ${statistics.year || ''})`,
      value: statistics.totalHours,
      suffix: 'h',
      icon: Clock,
      color: '#1F4E78',
      bgColor: '#EFF6FF',
      description: `Expected: ${safeToFixed(statistics.expectedHours, 0)}h`
    },
    {
      title: 'Working Days',
      value: statistics.uniqueDays,
      suffix: ` / ${statistics.totalWorkingDays}`,
      icon: Calendar,
      color: '#00A3A1',
      bgColor: '#F0FDFA',
      description: `${statistics.totalWorkingDays} total working days`
    },
    {
      title: 'Completion Rate',
      value: statistics.completionRate,
      suffix: '%',
      icon: TrendingUp,
      color: '#10B981',
      bgColor: '#F0FDF4',
      description: `of ${safeToFixed(statistics.expectedHours, 0)}h target`
    },
    {
      title: 'Total Records',
      value: statistics.recordCount,
      suffix: '',
      icon: FileText,
      color: '#F59E0B',
      bgColor: '#FFFBEB',
      description: 'Time entries this month'
    },
  ];

  return (
    <div className="space-y-4">
      {isInitialized && (
        <div className="text-sm text-slate-500 mb-2">
          Showing data for: <span className="font-semibold text-blue-600">
            {statistics.monthName} {statistics.year}
          </span>
          {isStatsLoading && (
            <span className="ml-2 text-gray-400">(Loading stats...)</span>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="shadow-md hover:shadow-lg transition-all border-l-4" style={{ borderLeftColor: stat.color }}>
              <CardHeader className="pb-2">
                <CardDescription className="text-xs">{stat.title}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: stat.bgColor }}>
                    <Icon className="w-5 h-5" style={{ color: stat.color }} />
                  </div>
                  <div>
                    <div className="text-2xl font-bold" style={{ color: stat.color }}>
                      {stat.value}{stat.suffix}
                    </div>
                    <div className="text-xs text-slate-500">
                      {stat.description}
                    </div>
                    {statistics.isFiltered && (
                      <div className="text-xs text-blue-500 mt-1">Filtered</div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}