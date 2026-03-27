import axios from 'axios'
import { api } from '../consts/api';
import { useUserStore } from '../store/UsersStore';
import { Country } from '../types/countries';


export const getCountries = async () => {
    const token = useUserStore.getState().access_token;

    if (!token) {
        throw new Error("No access token available");
    }

    const res = await axios(`${api}api/accounts/countries/`,

        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );
    return res.data;
}

export const addCountry = async (country: Country) => {
    const token = useUserStore.getState().access_token;

    if (!token) {
        throw new Error("No access token available");
    }

    const res = await axios.post(`${api}api/accounts/countries/`, country,

        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );
    return res.data;
}

export const deleteCountry = async (id: string) => {
    const token = useUserStore.getState().access_token;

    if (!token) {
        throw new Error("No access token available");
    }

    const res = await axios.delete(`${api}api/accounts/countries/${id}/`,

        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );
    return res.data;
}


export const editCountry = async (id: string, country: Country) => {
    const token = useUserStore.getState().access_token;

    if (!token) {
        throw new Error("No access token available");
    }

    const res = await axios.patch(`${api}api/accounts/countries/${id}/`, country,

        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );
    return res.data;
}


