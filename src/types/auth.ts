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