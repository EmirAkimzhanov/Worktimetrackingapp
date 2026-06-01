export interface TimeBody {
    id: number;
    country: number | null;
    client: string | null;
    project: number | null;
    task_type: number | null;
    task: number | null;
    weekends_included?: boolean;
    start_date?: string;
    end_date?: string;
    hours?: number;
    description: string;
}

export interface TimeEntry {
    id: number;
    user: string;
    country: number | null;
    client: string | null;
    project: number | null;
    project_color: string | null;
    project_code: string | null;
    task_type: string | null;
    task: number | null;
    weekends_included: boolean;
    start_date: string;
    end_date: string;
    hours: number;
    description: string;
    leave_document?: File | string | null;
}

export interface EditDate {
    date: string;
    start_date?: string;
    end_date?: string;
    country?: number;
    client?: number;
    project?: number;
    task_type?: number;
    task?: number;
    weekends_included?: boolean;
    hours?: number;
    description?: string;
}

export interface Holidays {
    id: number;
    date: string;
    input_date: string;
    holiday_name: string | null;
    day_type: 'holiday' | 'working_weekend' | 'working_day';
    description: string;
    is_recurring: boolean;
    country: number;
}


export interface LetterBody {
    email: string;
    subject: string;
    body: string;
}

export interface ReminderBody {
    emails: string[];
    start_date: string;
    end_date: string;
}

export interface WorkingWeekends {
    id: number;
    date: string;
    input_date: string;
    holiday_name: string | null;
    day_type: string;
    description: string;
    is_recurring: boolean;
    country: number;
}

export interface TimeEntryStats {
    total_hours: number;
    expected_hours: number;
    completion_rate: number;
    worked_days: number;
    total_working_days: number;
    total_records: number;
}