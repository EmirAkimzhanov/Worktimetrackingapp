export interface Calendar {
    id: number;
    date: string;
    input_date: string;
    holiday_name?: string | null;
    day_type: string;
    description: string;
    is_recurring: boolean;
    country: number;
}

export interface CalendarEvent {
    input_date: string;
    holiday_name?: string | null;
    day_type: string;
    description: string;
    is_recurring: boolean;
    country: number;
}