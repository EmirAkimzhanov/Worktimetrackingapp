export type WorkingDayIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface GlobalCalendarSettings {
    hours_per_day: string;
    working_days_of_week: WorkingDayIndex[];
    updated_at: string;
}

export interface GlobalSet {
    hours_per_day: number;
    working_days_of_week: WorkingDayIndex[];
    updated_at: string;
}