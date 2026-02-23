export interface User {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    role: string;
    position: string;
    grade: string;
    department: string;
    department_role: string;
    country: string;
    date_joined: string;
    date_left: string | null;
    is_active: boolean;
}

export interface UserBody {
    email: string;
    first_name: string;
    last_name: string;
    grade: number;
    position: number;
    department: number;
    department_role: number;
    role: number;
    country: number;
}
export interface DepartmentRole {
    id: number;
    name: string;
}