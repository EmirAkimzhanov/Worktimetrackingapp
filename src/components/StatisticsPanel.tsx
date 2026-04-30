import React, { useMemo, useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Clock, Calendar, TrendingUp, FileText } from 'lucide-react';
import { useTimeTracker } from './TimeTrackerContext';
import { useUserStore } from '../store/UsersStore';
import { useGetTimeEntrys } from '../hooks/useTimeEntry';

export function StatisticsPanel() {
  const { filters } = useTimeTracker();
  const time_entries = useUserStore((state) => state.time_entries);
  const { mutate: getTimeEntrys } = useGetTimeEntrys();
  const currentMonth = useUserStore((state) => state.currentMonth);

  // Загружаем записи при монтировании
  useEffect(() => {
    loadTimeEntries();
  }, []);

  const loadTimeEntries = () => {
    getTimeEntrys(undefined, {
      onSuccess: (data) => {
      },
      onError: (error) => {
        console.error('Statistics: Failed to load time entries:', error);
      }
    });
  };

  const statistics = useMemo(() => {
    if (!time_entries || time_entries.length === 0) {
      return {
        totalHours: '0.0',
        avgHoursPerDay: '0.0',
        uniqueDays: 0,
        recordCount: 0,
        isFiltered: false,
        totalWorkingDays: 0,
        expectedHours: 0,
        completionRate: 0,
      };
    }

    // Получаем год и месяц из currentMonth
    let selectedYear = new Date().getFullYear();
    let selectedMonth = new Date().getMonth();

    if (currentMonth) {
      const monthDate = new Date(currentMonth);
      selectedYear = monthDate.getFullYear();
      selectedMonth = monthDate.getMonth();
    }

    // Трансформируем записи из стора в формат для фильтрации
    const transformedEntries = time_entries.map(entry => ({
      id: entry.id,
      date: entry.date || entry.start_date,
      hours: entry.hours,
      description: entry.description,
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
      // Фильтр по проектам
      if (filters.projects.length > 0 && !filters.projects.includes(entry.projectId)) {
        return false;
      }

      // Фильтр по поиску
      if (filters.searchText && !entry.description?.toLowerCase().includes(filters.searchText.toLowerCase())) {
        return false;
      }

      // Фильтр по часам
      if (filters.hoursRange !== 'all') {
        if (filters.hoursRange === 'low' && entry.hours >= 4) return false;
        if (filters.hoursRange === 'medium' && (entry.hours < 4 || entry.hours > 8)) return false;
        if (filters.hoursRange === 'high' && entry.hours <= 8) return false;
      }

      return true;
    });

    const totalHours = filteredEntries.reduce((sum, entry) => sum + (entry.hours || 0), 0);
    const uniqueDays = new Set(filteredEntries.map(entry => entry.date)).size;
    const avgHoursPerDay = uniqueDays > 0 ? totalHours / uniqueDays : 0;
    const recordCount = filteredEntries.length;

    // Расчет рабочих дней в месяце (пн-пт)
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

    // Форматирование названия месяца
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    const monthName = monthNames[selectedMonth];

    return {
      totalHours: totalHours.toFixed(1),
      avgHoursPerDay: avgHoursPerDay.toFixed(1),
      uniqueDays,
      recordCount,
      isFiltered: filters.projects.length > 0 ||
        filters.searchText !== '' ||
        filters.hoursRange !== 'all',
      totalWorkingDays,
      expectedHours,
      completionRate: completionRate.toFixed(1),
      monthName,
      year: selectedYear,
    };
  }, [time_entries, filters, currentMonth]);

  const stats = [
    {
      title: `Total Hours (${statistics.monthName || ''} ${statistics.year || ''})`,
      value: statistics.totalHours,
      suffix: 'h',
      icon: Clock,
      color: '#1F4E78',
      bgColor: '#EFF6FF',
      description: `Expected: ${statistics.expectedHours}h`
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
      description: `of ${statistics.expectedHours}h target`
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
      {/* Индикатор выбранного месяца */}
      {currentMonth && (
        <div className="text-sm text-slate-500 mb-2">
          Showing data for: <span className="font-semibold text-blue-600">
            {statistics.monthName} {statistics.year}
          </span>
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