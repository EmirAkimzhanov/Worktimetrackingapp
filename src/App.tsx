import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TimeTrackerProvider } from './components/TimeTrackerContext';
import { TimeEntryForm } from './components/TimeEntryForm';
import { TimeEntryList } from './components/TimeEntryList';
import { CalendarView } from './components/CalendarView';
import { StatisticsPanel } from './components/StatisticsPanel';
import { FilterPanel } from './components/FilterPanel';
import { AdminPanel } from './components/AdminPanel';
import { Clock, Settings, FileText, LogOutIcon } from 'lucide-react';
import { Button } from './components/ui/button';
import { Toaster } from './components/ui/sonner';
import { Link, useLocation } from 'react-router-dom';
import TimeTrackerLogin from './pages/LoginPage';
import { useUserStore } from './store/UsersStore';
import { useLogOut } from './hooks/UseAuth';
import { setupInterceptors } from './axios/axiosConfig';
import { useTokenMonitor } from './hooks/useTokenMonitor';

// Создаем QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    },
    mutations: {
      retry: 1,
    },
  },
});

// Компонент навигации
function Navigation() {
  const location = useLocation();
  const isTimesheet = location.pathname === '/' || location.pathname === '/timesheet';
  const isAdmin = location.pathname === '/admin';

  const me = useUserStore((state) => state.me);
  const { mutate: logout } = useLogOut();

  return (
    <header className="border-b border-slate-200 shadow-sm" style={{ backgroundColor: '#1F4E78' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-3 no-underline">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#00A3A1' }}>
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-white">Professional Time Tracker</h1>
                <p className="text-blue-100 text-sm">Track your work hours and manage projects</p>
              </div>
            </Link>
          </div>
          <div className="flex gap-2">
            <Button
              asChild
              variant={isTimesheet ? 'secondary' : 'ghost'}
              className={isTimesheet ? '' : 'text-white hover:bg-white/10'}
            >
              <Link to="/">
                <FileText className="w-4 h-4 mr-2" />
                Timesheet
              </Link>
            </Button>

            {me?.role === 'admin' && (
              <Button
                asChild
                variant={isAdmin ? 'secondary' : 'ghost'}
                className={isAdmin ? '' : 'text-white hover:bg-white/10'}
              >
                <Link to="/admin">
                  <Settings className="w-4 h-4 mr-2" />
                  Admin
                </Link>
              </Button>
            )}

            <Button
              asChild
              variant="destructive"
              onClick={() => {
                logout();
              }}
            >

              <Link to="/login">
                <LogOutIcon className="w-4 h-4 mr-2" />
                Logout
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}

// Компонент для страницы Timesheet
function TimesheetPage() {
  return (
    <div className="space-y-6">
      <StatisticsPanel />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TimeEntryForm />
        <CalendarView />
      </div>
      <FilterPanel />
      <TimeEntryList />
    </div>
  );
}

// Компонент для страницы Admin
function AdminPage() {
  return (
    <div className="space-y-6">
      <AdminPanel />
    </div>
  );
}

// Layout с навбаром для защищенных роутов
function ProtectedLayout() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F8FAFC' }}>
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <Outlet />
      </main>
    </div>
  );
}

// Layout без навбара для страницы логина
function LoginLayout() {
  return <Outlet />;
}

// Компонент с настройкой interceptors
function AppInitializer() {
  const navigate = useNavigate();

  // useEffect(() => {
  //   setupInterceptors(navigate);
  // }, [navigate]);
  // useTokenMonitor();

  return null;
}

// Главный компонент с роутами
function AppRoutes() {
  return (
    <Routes>
      {/* Маршрут для логина без навбара */}
      <Route element={<LoginLayout />}>
        <Route path="/login" element={<TimeTrackerLogin />} />
      </Route>

      {/* Защищенные маршруты с навбаром */}
      <Route element={<ProtectedLayout />}>
        <Route path="/" element={<TimesheetPage />} />
        <Route path="/timesheet" element={<TimesheetPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Route>

      {/* Редирект для несуществующих маршрутов */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// Главный компонент приложения - ТОЛЬКО ОДИН BrowserRouter
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <TimeTrackerProvider>
          <AppInitializer />
          <AppRoutes />
          <Toaster />
        </TimeTrackerProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}