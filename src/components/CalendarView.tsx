import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { useTimeTracker } from './TimeTrackerContext';

export function CalendarView() {
  const { entries, filters } = useTimeTracker();
  const [currentDate, setCurrentDate] = useState(new Date());

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

  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow border-t-4" style={{ borderTopColor: '#0066CC' }}>
      <CardHeader style={{ backgroundColor: '#F1F5F9' }} className="border-b">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2" style={{ color: '#1F4E78' }}>
              <CalendarIcon className="w-5 h-5" />
              Calendar View
            </CardTitle>
            <CardDescription>Your work hours throughout the month</CardDescription>
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
              <div
                key={day}
                className={`aspect-square border rounded-lg p-2 hover:bg-slate-50 transition-colors ${
                  isToday(day) ? 'ring-2 ring-offset-1' : 'border-slate-200'
                }`}
                style={isToday(day) ? { borderColor: '#0066CC', backgroundColor: '#EFF6FF', ringColor: '#0066CC' } : {}}
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
                          title={`${entry.projectName}: ${entry.hours}h - ${entry.description}`}
                        >
                          {entry.projectName}
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
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
