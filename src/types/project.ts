import { Task } from "./task";

export interface Project {
    id: number;
    name: string;
    code: string;
    description: string;
    is_chargeable?: boolean | null;
    status: string;
    country: string;
    manager: string;
    client: string;
    department: string;
    service_line: string;
    task_type: string;
}


// Основной интерфейс проекта
export interface ProjectTasks {
    id: number;
    name: string;
    code: string;
    description: string;
    is_chargeable: boolean;
    status: string; // Можно уточнить: 'In progress' | 'Completed' | 'On hold' и т.д.
    country: string; // Код страны (2 символа)
    client: string; // Название клиента
    department: string; // Например: 'CONS'
    service_line: string; // Например: 'Non Audit - Consulting'
    tasks: Task[];
}