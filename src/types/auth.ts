export interface LoginUserBody {
    email: string,
    password: string
}

export interface Activate {
    email: string,
    activation_code: string,
    password: string,
    password_confirm: string,
}

export interface Me {
    email: string;
    first_name: string;     // First name, maxLength: 150, minLength: 1
    last_name: string;      // Last name, maxLength: 150, minLength: 1
    grade: number;          // Grade
    position: number;       // Position
    department: number;     // Department
    department_role: number; // Department role
    role: string;           // Role
    country: number;        // Country
}