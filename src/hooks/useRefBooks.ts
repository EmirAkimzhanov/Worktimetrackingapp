import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUserStore } from '../store/UsersStore';
import axios from 'axios';
import { api } from '../consts/api';
import { getPIE, getProjectStatuses, getSector, getServiceType } from '../services/refBooks';
import { getServiceLines } from '../services/serviceLines';
import { getTaskTypes } from '../services/task';

// ========== ИНТЕРФЕЙСЫ ==========

export interface Pie {
    id: number;
    name: string;
}




export const useGetPIE = (options?: {
    enabled?: boolean;
    staleTime?: number;
    cacheTime?: number;
    refetchOnWindowFocus?: boolean;
}) => {
    const token = useUserStore.getState().access_token;

    return useQuery({
        queryKey: ['pies'],
        queryFn: getPIE,
        enabled: !!token && (options?.enabled !== false),
        staleTime: options?.staleTime || 30 * 60 * 1000,
        gcTime: options?.cacheTime || 60 * 60 * 1000, // 1 час данные хранятся в кэше
        refetchOnWindowFocus: options?.refetchOnWindowFocus ?? false,
        retry: 1,
    });
};

export const useGetServiceType = (options?: {
    enabled?: boolean;
    staleTime?: number;
    cacheTime?: number;
    refetchOnWindowFocus?: boolean;
}) => {
    const token = useUserStore.getState().access_token;

    return useQuery({
        queryKey: ['serviceType'],
        queryFn: getServiceType,
        enabled: !!token && (options?.enabled !== false),
        staleTime: options?.staleTime || 30 * 60 * 1000,
        gcTime: options?.cacheTime || 60 * 60 * 1000, // 1 час данные хранятся в кэше
        refetchOnWindowFocus: options?.refetchOnWindowFocus ?? false,
        retry: 1,
    });
};

export const useGetSector = (options?: {
    enabled?: boolean;
    staleTime?: number;
    cacheTime?: number;
    refetchOnWindowFocus?: boolean;
}) => {
    const token = useUserStore.getState().access_token;

    return useQuery({
        queryKey: ['sector'],
        queryFn: getSector,
        enabled: !!token && (options?.enabled !== false),
        staleTime: options?.staleTime || 30 * 60 * 1000,
        gcTime: options?.cacheTime || 60 * 60 * 1000, // 1 час данные хранятся в кэше
        refetchOnWindowFocus: options?.refetchOnWindowFocus ?? false,
        retry: 1,
    });
};

export const useGetServiceLine = (options?: {
    enabled?: boolean;
    staleTime?: number;
    cacheTime?: number;
    refetchOnWindowFocus?: boolean;
}) => {
    const token = useUserStore.getState().access_token;

    return useQuery({
        queryKey: ['serviceLine'],
        queryFn: getServiceLines,
        enabled: !!token && (options?.enabled !== false),
        staleTime: options?.staleTime || 30 * 60 * 1000,
        gcTime: options?.cacheTime || 60 * 60 * 1000, // 1 час данные хранятся в кэше
        refetchOnWindowFocus: options?.refetchOnWindowFocus ?? false,
        retry: 1,
    });
}

export const useGetProjectStatuses = (options?: {
    enabled?: boolean;
    staleTime?: number;
    cacheTime?: number;
    refetchOnWindowFocus?: boolean;
}) => {
    const token = useUserStore.getState().access_token;

    return useQuery({
        queryKey: ['projectStatuses'],
        queryFn: getProjectStatuses,
        enabled: !!token && (options?.enabled !== false),
        staleTime: options?.staleTime || 30 * 60 * 1000,
        gcTime: options?.cacheTime || 60 * 60 * 1000, // 1 час данные хранятся в кэше
        refetchOnWindowFocus: options?.refetchOnWindowFocus ?? false,
        retry: 1,
    });
};

export const useGetTaskTypes = (options?: {
    enabled?: boolean;
    staleTime?: number;
    cacheTime?: number;
    refetchOnWindowFocus?: boolean;
}) => {
    const token = useUserStore.getState().access_token;

    return useQuery({
        queryKey: ['taskTypes'],
        queryFn: getTaskTypes,
        enabled: !!token && (options?.enabled !== false),
        staleTime: options?.staleTime || 30 * 60 * 1000,
        gcTime: options?.cacheTime || 60 * 60 * 1000, // 1 час данные хранятся в кэше
        refetchOnWindowFocus: options?.refetchOnWindowFocus ?? false,
        retry: 1,
    });
};


// Создание PIE
export const useCreatePIE = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (pieData: Omit<Pie, 'id'>): Promise<Pie> => {
            const token = useUserStore.getState().access_token;

            if (!token) {
                throw new Error("No access token available");
            }

            const res = await axios.post(`${api}api/clients/pies/`, pieData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            return res.data;
        },
        onSuccess: () => {
            // Инвалидируем кэш после успешного создания
            queryClient.invalidateQueries({ queryKey: ['pies'] });
        },
    });
};

export const useCreateTaskType = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: Omit<Pie, 'id'>): Promise<Pie> => {
            const token = useUserStore.getState().access_token;

            if (!token) {
                throw new Error("No access token available");
            }

            const res = await axios.post(`${api}api/projects/task-types/`, data, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['taskTypes'] });
        },
    });
};

export const useUpdateTaskType = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, ...data }: Pie): Promise<Pie> => {
            const token = useUserStore.getState().access_token;

            if (!token) {
                throw new Error("No access token available");
            }

            const res = await axios.patch(`${api}api/projects/task-types/${id}/`, data, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['taskTypes'] });
        },
    });
};
export const useDeleteTaskType = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: number | string): Promise<void> => {
            const token = useUserStore.getState().access_token;

            if (!token) {
                throw new Error("No access token available");
            }

            await axios.delete(`${api}api/projects/task-types/${id}/`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['taskTypes'] });
        },
    });
};

export const useCreateServiceLine = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (serviceLineData: Omit<Pie, 'id'>): Promise<Pie> => {
            const token = useUserStore.getState().access_token;

            if (!token) {
                throw new Error("No access token available");
            }

            const res = await axios.post(`${api}api/projects/service-lines/`, serviceLineData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            return res.data;
        },
        onSuccess: () => {
            // Инвалидируем кэш после успешного создания
            queryClient.invalidateQueries({ queryKey: ['serviceLine'] });
        },
    });
};

export const useCreateProjectStatus = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (projectStatusData: Omit<Pie, 'id'>): Promise<Pie> => {
            const token = useUserStore.getState().access_token;

            if (!token) {
                throw new Error("No access token available");
            }

            const res = await axios.post(`${api}api/projects/statuses/`, projectStatusData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            return res.data;
        },
        onSuccess: () => {
            // Инвалидируем кэш после успешного создания
            queryClient.invalidateQueries({ queryKey: ['projectStatuses'] });
        },
    });
};

export const useCreateSector = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (sector: Omit<Pie, 'id'>): Promise<Pie> => {
            const token = useUserStore.getState().access_token;

            if (!token) {
                throw new Error("No access token available");
            }

            const res = await axios.post(`${api}api/clients/sectors/`, sector, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            return res.data;
        },
        onSuccess: () => {
            // Инвалидируем кэш после успешного создания
            queryClient.invalidateQueries({ queryKey: ['sector'] });
        },
    });
};

export const useCreateServiceType = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (serviceData: Omit<Pie, 'id'>): Promise<Pie> => {
            const token = useUserStore.getState().access_token;

            if (!token) {
                throw new Error("No access token available");
            }

            const res = await axios.post(`${api}api/projects/service-types/`, serviceData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            return res.data;
        },
        onSuccess: () => {
            // Инвалидируем кэш после успешного создания
            queryClient.invalidateQueries({ queryKey: ['serviceType'] });
        },
    });
};

// Обновление PIE
export const useUpdatePIE = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, ...data }: Pie): Promise<Pie> => {
            const token = useUserStore.getState().access_token;

            if (!token) {
                throw new Error("No access token available");
            }

            const res = await axios.patch(`${api}api/clients/pies/${id}/`, data, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            return res.data;
        },
        onSuccess: () => {
            // Инвалидируем кэш после успешного обновления
            queryClient.invalidateQueries({ queryKey: ['pies'] });
        },
    });
};

export const useUpdateServiceLine = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, ...data }: Pie): Promise<Pie> => {
            const token = useUserStore.getState().access_token;

            if (!token) {
                throw new Error("No access token available");
            }

            const res = await axios.patch(`${api}api/projects/service-lines/${id}/`, data, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            return res.data;
        },
        onSuccess: () => {
            // Инвалидируем кэш после успешного обновления
            queryClient.invalidateQueries({ queryKey: ['serviceLine'] });
        },
    });
};

export const useUpdateProjectStatuses = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, ...data }: Pie): Promise<Pie> => {
            const token = useUserStore.getState().access_token;

            if (!token) {
                throw new Error("No access token available");
            }

            const res = await axios.patch(`${api}api/projects/statuses/${id}/`, data, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            return res.data;
        },
        onSuccess: () => {
            // Инвалидируем кэш после успешного обновления
            queryClient.invalidateQueries({ queryKey: ['projectStatuses'] });
        },
    });
};

export const useUpdateSector = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, ...data }: Pie): Promise<Pie> => {
            const token = useUserStore.getState().access_token;

            if (!token) {
                throw new Error("No access token available");
            }

            const res = await axios.patch(`${api}api/clients/sectors/${id}/`, data, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            return res.data;
        },
        onSuccess: () => {
            // Инвалидируем кэш после успешного обновления
            queryClient.invalidateQueries({ queryKey: ['sector'] });
        },
    });
};

export const useUpdateServiceType = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, ...data }: Pie): Promise<Pie> => {
            const token = useUserStore.getState().access_token;

            if (!token) {
                throw new Error("No access token available");
            }

            const res = await axios.patch(`${api}api/projects/service-types/${id}/`, data, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            return res.data;
        },
        onSuccess: () => {
            // Инвалидируем кэш после успешного обновления
            queryClient.invalidateQueries({ queryKey: ['serviceType'] });
        },
    });
};

// Удаление PIE
export const useDeletePIE = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: number): Promise<void> => {
            const token = useUserStore.getState().access_token;

            if (!token) {
                throw new Error("No access token available");
            }

            await axios.delete(`${api}api/clients/pies/${id}/`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
        },
        onSuccess: () => {
            // Инвалидируем кэш после успешного удаления
            queryClient.invalidateQueries({ queryKey: ['pies'] });
        },
    });
};

export const useDeleteServiceLine = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: number): Promise<void> => {
            const token = useUserStore.getState().access_token;

            if (!token) {
                throw new Error("No access token available");
            }

            await axios.delete(`${api}api/projects/service-lines/${id}/`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
        },
        onSuccess: () => {
            // Инвалидируем кэш после успешного удаления
            queryClient.invalidateQueries({ queryKey: ['serviceLine'] });
        },
    });
};

export const useDeleteProjectStatus = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: number): Promise<void> => {
            const token = useUserStore.getState().access_token;

            if (!token) {
                throw new Error("No access token available");
            }

            await axios.delete(`${api}api/projects/statuses/${id}/`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
        },
        onSuccess: () => {
            // Инвалидируем кэш после успешного удаления
            queryClient.invalidateQueries({ queryKey: ['projectStatus'] });
        },
    });
};

export const useDeleteSector = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: number): Promise<void> => {
            const token = useUserStore.getState().access_token;

            if (!token) {
                throw new Error("No access token available");
            }

            await axios.delete(`${api}api/clients/sectors/${id}/`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
        },
        onSuccess: () => {
            // Инвалидируем кэш после успешного удаления
            queryClient.invalidateQueries({ queryKey: ['sector'] });
        },
    });
};

export const useDeleteServiceType = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: number): Promise<void> => {
            const token = useUserStore.getState().access_token;

            if (!token) {
                throw new Error("No access token available");
            }

            await axios.delete(`${api}api/projects/service-types/${id}/`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
        },
        onSuccess: () => {
            // Инвалидируем кэш после успешного удаления
            queryClient.invalidateQueries({ queryKey: ['serviceType'] });
        },
    });
};