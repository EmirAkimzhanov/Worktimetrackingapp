interface Country {
    id: number;
    name: string;
    code: number;
}

export interface Countries {
    [id: string]: Country;
}