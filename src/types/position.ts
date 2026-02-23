export interface Grade {
    id: number;
    name: string;
}

export interface Position {
    id: number;
    name: string;
    grades?: Grade[];
}