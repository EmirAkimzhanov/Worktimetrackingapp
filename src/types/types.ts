export interface User {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    date_joined: string;
    leave_date?: string;
    is_active: boolean;
    position_id: number;
    department_id: number;
    role: 'admin' | 'user' | 'manager';
}

export interface Client {
    id: number;
    name: string;
    company: string;
    email: string;
    phone: string;
    country: string;
    is_active: boolean;
    created_at: string;
}

export interface Position {
    id: number;
    name: string;
}

export interface Department {
    id: number;
    name: string;
}

export interface UserFormData {
    email: string;
    first_name: string;
    last_name: string;
    password: string;
    date_joined: string;
    leave_date?: string;
    is_active: boolean;
    position_id: number;
    department_id: number;
    role: 'admin' | 'user' | 'manager';
}

export interface ClientFormData {
    name: string;
    company: string;
    email: string;
    phone: string;
    country: string;
    is_active: boolean;
}

export interface ProjectFormData {
    name: string;
    code: string;
    color: string;
    client_id?: number;
    project_manager?: number;
    country: string;
    department: string;
    description: string;
}

export interface Workday {
    id: number;
    date: string; // YYYY-MM-DD
    type: 'workday' | 'weekend' | 'holiday';
    description?: string;
    is_recurring?: boolean;
}

export interface WorkdayFormData {
    date: string;
    type: 'workday' | 'weekend' | 'holiday';
    description: string;
    is_recurring: boolean;
}

// В types/types.ts добавьте:
export interface CountryCalendarConfig {
    id: number;
    country: string;
    countryCode: string;
    weeklySchedule: WeeklySchedule;
    holidays: Holiday[];
    workWeekends: WorkWeekend[];
    statistics: CalendarStatistics;
}

export interface WeeklySchedule {
    id: number;
    country_id: number;
    monday: boolean; // true = рабочий день
    tuesday: boolean;
    wednesday: boolean;
    thursday: boolean;
    friday: boolean;
    saturday: boolean;
    sunday: boolean;
    workHoursPerDay: number;
}

export interface Holiday {
    id: number;
    country_id: number;
    date: string; // YYYY-MM-DD
    name: string;
    is_halfday: boolean;
    is_recurring: boolean;
}

export interface WorkWeekend {
    id: number;
    country_id: number;
    date: string; // YYYY-MM-DD
    description?: string;
}

export interface CalendarStatistics {
    yearlyWorkDays: number;
    yearlyHours: number;
    daysInWeek: number;
    hoursInWeek: number;
    vacationDays: number;
    lastUpdated: string;
}


export interface Department {
    id: number;
    name: string;
    code: string; // Делаем опциональным
    createdAt?: string; // Делаем опциональным
    updatedAt?: string; // Делаем опциональным
    teamSize?: number; // Делаем опциональным
}

export interface DepartmentFormData {
    name: string;
    code?: string;
}

export interface TeamMember {
    id: number;
    userId: number;
    departmentId: number;
    role: 'member' | 'lead' | 'manager';
    joinDate: string;
}