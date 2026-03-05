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