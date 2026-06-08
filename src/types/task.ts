export interface Task {
    id: number;
    name: string;
    task_type: string; // Можно уточнить тип, если известны все возможные значения
}

export type TasksArray = Task[];

export interface LeaveTasks {
    name: string;
    task_type: number;
}