import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Clock, Calendar, TrendingUp, FileText } from 'lucide-react';
import { useTimeTracker } from './TimeTrackerContext';

export function StatisticsPanel() {
  const { entries, filters } = useTimeTracker();

  const statistics = useMemo(() => {
    const filteredEntries = entries.filter(entry => {
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

    const totalHours = filteredEntries.reduce((sum, entry) => sum + entry.hours, 0);
    const uniqueDays = new Set(filteredEntries.map(entry => entry.date)).size;
    const avgHoursPerDay = uniqueDays > 0 ? totalHours / uniqueDays : 0;
    const recordCount = filteredEntries.length;

    return {
      totalHours: totalHours.toFixed(1),
      avgHoursPerDay: avgHoursPerDay.toFixed(1),
      uniqueDays,
      recordCount,
      isFiltered: filters.projects.length > 0 || 
                  filters.searchText !== '' || 
                  filters.hoursRange !== 'all' ||
                  filters.dateRange !== null ||
                  filters.quickFilter !== 'all',
    };
  }, [entries, filters]);

  const stats = [
    {
      title: 'Total Hours',
      value: statistics.totalHours,
      suffix: 'h',
      icon: Clock,
      color: '#1F4E78',
      bgColor: '#EFF6FF',
    },
    {
      title: 'Working Days',
      value: statistics.uniqueDays,
      suffix: '',
      icon: Calendar,
      color: '#00A3A1',
      bgColor: '#F0FDFA',
    },
    {
      title: 'Avg Hours/Day',
      value: statistics.avgHoursPerDay,
      suffix: 'h',
      icon: TrendingUp,
      color: '#7C3AED',
      bgColor: '#F5F3FF',
    },
    {
      title: 'Total Records',
      value: statistics.recordCount,
      suffix: '',
      icon: FileText,
      color: '#F59E0B',
      bgColor: '#FFFBEB',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title} className="shadow-md hover:shadow-lg transition-all border-l-4" style={{ borderLeftColor: stat.color }}>
            <CardHeader className="pb-3">
              <CardDescription className="text-xs">{stat.title}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg" style={{ backgroundColor: stat.bgColor }}>
                  <Icon className="w-6 h-6" style={{ color: stat.color }} />
                </div>
                <div>
                  <div className="text-3xl" style={{ color: stat.color }}>
                    {stat.value}{stat.suffix}
                  </div>
                  {statistics.isFiltered && (
                    <div className="text-xs text-slate-500 mt-1">Filtered</div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
