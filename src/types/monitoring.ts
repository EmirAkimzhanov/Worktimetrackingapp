export interface Monitoring {
    id: number;                   // ID
    title: string;                 // title (дублируется в описании)
    start_date: string;            // Start date ($date)
    end_date: string;              // End date ($date)
    country: number | null;        // Country (x-nullable: true)
    client: number | null;         // Client (x-nullable: true)
    project: number | null;        // Project (x-nullable: true)
    task_type: number | null;      // Task type (x-nullable: true)
    task: number | null;           // Task (x-nullable: true)
    weekends_included: boolean;    // Weekends included
    hours: number;                 // Hours (обязательное поле, отмечено *)
    description: string;           // Description
    created_at: string;            // Created at ($date-time, readOnly)
    updated_at: string;            // Updated at ($date-time, readOnly)

}