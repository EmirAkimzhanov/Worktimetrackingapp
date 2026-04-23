import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUserStore } from '../store/UsersStore';
import axios from 'axios';
import { api } from '../consts/api';
import { getManagers } from '../services/managers';

// ========== ИНТЕРФЕЙСЫ ==========

interface Manager {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    grade: string;
    position: string;
    department: string;
    department_role: string;
    role: string | null;
    country: string;
    is_active: boolean;
    date_joined: string;
    date_left: string | null;
}

// ========== СЕРВИСНАЯ ФУНКЦИЯ ==========



// ========== ПРАВИЛЬНЫЙ ХУК С useQuery ==========

export const useGetManagers = (options?: {
    enabled?: boolean;
    staleTime?: number;
    cacheTime?: number;
    refetchOnWindowFocus?: boolean;
}) => {
    const token = useUserStore.getState().access_token;

    return useQuery({
        queryKey: ['managers'],
        queryFn: getManagers,
        enabled: !!token && (options?.enabled !== false),
        staleTime: options?.staleTime || 30 * 60 * 1000,
        gcTime: options?.cacheTime || 60 * 60 * 1000, // 1 час данные хранятся в кэше
        refetchOnWindowFocus: options?.refetchOnWindowFocus ?? false,
        retry: 1,
    });
};

// ========== МУТАЦИИ ДЛЯ ИЗМЕНЕНИЯ ДАННЫХ ==========
// (пример, если в будущем понадобится)

export const useUpdateManager = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (managerId: number) => {
            // Логика обновления менеджера
            const token = useUserStore.getState().access_token;
            const res = await axios.patch(`${api}api/accounts/users/managers/${managerId}/`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            return res.data;
        },
        onSuccess: () => {
            // Инвалидируем кэш после успешного обновления
            queryClient.invalidateQueries({ queryKey: ['managers'] });
        },
    });
};