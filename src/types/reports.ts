export interface TimeEntryCreate {
    id?: number;              // ID, только для чтения, опциональный при создании
    start_date: string;       // Start date (string в формате date)
    end_date: string;         // End date (string в формате date)
    country?: number | null;  // Country (integer, может быть null)
    client?: number | null;   // Client (integer, может быть null)
    project?: number | null;  // Project (integer, может быть null)
    task_type?: number | null; // Task type (integer, может быть null)
    task?: number | null;     // Task (integer, может быть null)
    weekends_included?: boolean; // Weekends included (boolean)
    hours: number;            // Hours (required, integer, min: -2147483648, max: 2147483647)
    description?: string;     // Description (string, optional)
}

export interface LeaveReportsData {
    id: number;
    weekends_included: boolean;
    holidays_included: boolean;
    start_date: string;      // "YYYY-MM-DD"
    end_date: string;        // "YYYY-MM-DD"
    country: string;
    client: string;
    project_code: string;
    task_type: string;
    task: string;
    leave_document: LeaveDocument | null;
    date: string;            // "YYYY-MM-DD"
    hours: number;
    description: string;
    created_at: string;      // "YYYY-MM-DDTHH:mm:ss.SSSZ"
    updated_at: string;
}


// leaveReport.ts

export interface LeaveDocument {
    id: number;
    name: string;
    url: string;
}
