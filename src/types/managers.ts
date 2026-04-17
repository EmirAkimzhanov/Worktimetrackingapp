export interface Manager {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    grade: string;
    position: string;
    department: string;
    department_role: string;
    role: string | null;
    country: string;
    is_active: boolean;
    date_joined: string; // ISO datetime string
    date_left: string | null;
}