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
}