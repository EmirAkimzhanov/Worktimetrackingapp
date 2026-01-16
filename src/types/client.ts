import { Project } from "./project";

export interface Client {
    id: number;
    name: string;
    group: string;
    personal_number: string;
    sector: string;
}

export interface CountryWithClients {
    id: number;
    clients: Client[];
    name: string;
    code: string;
}

export interface MainEntity {
    id: number;
    name: string;
    projects: Project[];
}