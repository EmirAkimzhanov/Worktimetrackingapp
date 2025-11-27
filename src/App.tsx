import React, { useState } from 'react';
import { TimeTrackerProvider } from './components/TimeTrackerContext';
import { TimeEntryForm } from './components/TimeEntryForm';
import { TimeEntryList } from './components/TimeEntryList';
import { CalendarView } from './components/CalendarView';
import { StatisticsPanel } from './components/StatisticsPanel';
import { FilterPanel } from './components/FilterPanel';
import { AdminPanel } from './components/AdminPanel';
import { Clock, Settings, FileText } from 'lucide-react';
import { Button } from './components/ui/button';
import { Toaster } from './components/ui/sonner';

export default function App() {
  const [activeView, setActiveView] = useState<'timesheet' | 'admin'>('timesheet');

  return (
    <TimeTrackerProvider>
      <div className="min-h-screen" style={{ backgroundColor: '#F8FAFC' }}>
        <header className="border-b border-slate-200 shadow-sm" style={{ backgroundColor: '#1F4E78' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#00A3A1' }}>
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-white">Professional Time Tracker</h1>
                  <p className="text-blue-100 text-sm">Track your work hours and manage projects</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={activeView === 'timesheet' ? 'secondary' : 'ghost'}
                  onClick={() => setActiveView('timesheet')}
                  className={activeView === 'timesheet' ? '' : 'text-white hover:bg-white/10'}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Timesheet
                </Button>
                <Button
                  variant={activeView === 'admin' ? 'secondary' : 'ghost'}
                  onClick={() => setActiveView('admin')}
                  className={activeView === 'admin' ? '' : 'text-white hover:bg-white/10'}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Admin
                </Button>
              </div>
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          {activeView === 'timesheet' ? (
            <div className="space-y-6">
              <StatisticsPanel />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <TimeEntryForm />
                <CalendarView />
              </div>
              <FilterPanel />
              <TimeEntryList />
            </div>
          ) : (
            <div className="space-y-6">
              <AdminPanel />
            </div>
          )}
        </main>
      </div>
      <Toaster />
    </TimeTrackerProvider>
  );
}
