import { Client, Department, Position, User } from "../types/types";

export const COUNTRIES = [
    'United States', 'Canada', 'United Kingdom', 'Germany', 'France',
    'Japan', 'Australia', 'Singapore', 'India', 'Brazil'
];

export const PREDEFINED_COLORS = [
    { name: 'Navy', value: '#1F4E78' },
    { name: 'Blue', value: '#0066CC' },
    { name: 'Teal', value: '#00A3A1' },
    { name: 'Purple', value: '#7C3AED' },
    { name: 'Amber', value: '#F59E0B' },
    { name: 'Red', value: '#EF4444' },
    { name: 'Green', value: '#22C55E' },
    { name: 'Pink', value: '#EC4899' },
];

export const MOCK_POSITIONS: Position[] = [
    { id: 1, name: 'Developer' },
    { id: 2, name: 'Designer' },
    { id: 3, name: 'Project Manager' },
    { id: 4, name: 'Analyst' },
    { id: 5, name: 'Tester' },
    { id: 6, name: 'Team Lead' }
];

export const MOCK_DEPARTMENTS: Department[] = [
    { id: 1, name: 'IT' },
    { id: 2, name: 'HR' },
    { id: 3, name: 'Finance' },
    { id: 4, name: 'Marketing' },
    { id: 5, name: 'Operations' },
    { id: 6, name: 'Sales' }
];

export const MOCK_USERS: User[] = [
    {
        id: 1,
        email: 'admin@company.com',
        first_name: 'John',
        last_name: 'Doe',
        date_joined: '2024-01-01',
        leave_date: '',
        is_active: true,
        position_id: 6,
        department_id: 1,
        role: 'admin'
    },
    // ... остальные пользователи
];

export const MOCK_CLIENTS: Client[] = [
    {
        id: 1,
        name: 'Robert Johnson',
        company: 'TechCorp Inc.',
        email: 'r.johnson@techcorp.com',
        phone: '+1-555-0123',
        country: 'United States',
        is_active: true,
        created_at: '2024-01-01'
    },
    // ... остальные клиенты
];

export const getRoleBadgeVariant = (role: string) => {
    switch (role) {
        case 'admin': return 'destructive';
        case 'manager': return 'default';
        case 'user': return 'secondary';
        default: return 'outline';
    }
};

export const getDeptRoleBadgeVariant = (role: string) => {
    switch (role) {
        case 'Manager': return 'destructive';  // красный
        case 'Member': return 'secondary';      // серый/обычный
        default: return 'outline';
    }
};