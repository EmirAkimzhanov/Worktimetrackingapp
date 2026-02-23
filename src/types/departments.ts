export interface Department {
    id: number;
    name: string;
}

export type DepartmentArray = Department[]

export interface DepartmentMember {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    position?: string; // опциональное поле, присутствует не у всех
    grade?: string; // опциональное поле, присутствует не у всех
    department: string;
    department_role: string;
    country: string;
    date_joined: string; // ISO формат даты
    date_left: string | null;
    is_active: boolean;
}

export interface DepartmentWithMembers {
    id: number;
    name: string;
    members: DepartmentMember[];
}