export interface User {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    grade: string | null;
    position: string | null;
    department: string;
    department_role: string;
    role: string | null;
    country: string;
    is_active: boolean;
    date_joined: string;
    date_left: string | null;
}

export interface Department {
    id: number;
    members: User[];
    managers: User[];
    name: string;
}

export type DepartmentsResponse = Department[];