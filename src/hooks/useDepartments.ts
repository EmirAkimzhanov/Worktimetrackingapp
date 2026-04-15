import { useMutation } from '@tanstack/react-query';
import { useUserStore } from '../store/UsersStore';
import { createDepartment, deleteDepartment, editDepartmentMemberRole, editDepartmentName, getDepartmentRoles, getDepartments } from '../services/department';

// ========== КЭШ ДЛЯ ДЕПАРТАМЕНТОВ ==========

// Кэш для всех департаментов (список)
let departmentsListCache: { data: any; timestamp: number } | null = null;

// Кэш для конкретных департаментов с участниками (по department_id)
const departmentMembersCache = new Map<string, { data: any; timestamp: number }>();

// Кэш для ролей
let departmentRolesCache: { data: any; timestamp: number } | null = null;

const CACHE_DURATION = 30 * 60 * 1000; // 30 минут

// Функции очистки кэша
const clearDepartmentsListCache = () => {
    departmentsListCache = null;
    console.log('Departments list cache cleared');
};

const clearDepartmentMembersCache = (departmentId?: string) => {
    if (departmentId) {
        departmentMembersCache.delete(departmentId);
        console.log(`Department members cache cleared for ID: ${departmentId}`);
    } else {
        departmentMembersCache.clear();
        console.log('All department members cache cleared');
    }
};

const clearDepartmentRolesCache = () => {
    departmentRolesCache = null;
    console.log('Department roles cache cleared');
};

// Очистка всех кэшей департаментов
const clearAllDepartmentsCaches = () => {
    clearDepartmentsListCache();
    clearDepartmentMembersCache();
    clearDepartmentRolesCache();
};

// ========== ХУКИ С КЭШИРОВАНИЕМ ==========

export const useGetDepartments = () => {
    const setDepartments = useUserStore((state) => state.setDepartments);
    const setDepartmentMembers = useUserStore((state) => state.setDepartmentMembers);

    return useMutation({
        mutationFn: async (department_id?: string) => {
            const now = Date.now();

            if (department_id) {
                // Запрос конкретного департамента с участниками
                const cached = departmentMembersCache.get(department_id);
                if (cached && (now - cached.timestamp) < CACHE_DURATION) {
                    console.log(`Using cached department members for ID: ${department_id}`);
                    return cached.data;
                }

                // Загружаем новые данные
                console.log(`Fetching fresh department members for ID: ${department_id}`);
                const data = await getDepartments(department_id);
                departmentMembersCache.set(department_id, { data, timestamp: now });
                return data;
            } else {
                // Запрос всех департаментов (только список)
                if (departmentsListCache && (now - departmentsListCache.timestamp) < CACHE_DURATION) {
                    console.log('Using cached departments list');
                    return departmentsListCache.data;
                }

                // Загружаем новые данные
                console.log('Fetching fresh departments list');
                const data = await getDepartments();
                departmentsListCache = { data, timestamp: now };
                return data;
            }
        },
        onSuccess: (data, variables) => {
            const departmentId = variables; // department_id?: string

            if (departmentId) {
                // Если передан ID, значит запросили конкретный департамент с members
                console.log('Department with members loaded:', data);
                setDepartmentMembers(data); // Сохраняем в department_members
            } else {
                // Если ID не передан, значит запросили все департаменты (только список)
                console.log('All departments loaded:', data);
                setDepartments(data); // Сохраняем в departments
            }
        },
        onError: (error: Error) => {
            console.error("Get departments error:", error.message);
        },
    });
};

export const useGetDepartmentRoles = () => {
    const setDepartmentRoles = useUserStore((state) => state.setDepartmentRoles);

    return useMutation({
        mutationFn: async () => {
            // Проверяем кэш
            const now = Date.now();
            if (departmentRolesCache && (now - departmentRolesCache.timestamp) < CACHE_DURATION) {
                console.log('Using cached department roles');
                return departmentRolesCache.data;
            }

            // Загружаем новые данные
            console.log('Fetching fresh department roles');
            const data = await getDepartmentRoles();
            departmentRolesCache = { data, timestamp: now };
            return data;
        },
        onSuccess: (data) => {
            setDepartmentRoles(data);
            console.log('Department roles loaded:', data);
        },
        onError: (error: Error) => {
            console.error("Get department roles error:", error.message);
        },
    });
};

export const useEditDepartmentRoles = () => {
    return useMutation({
        mutationFn: async ({
            userId,
            department_role,
        }: {
            userId: number;
            department_role: number;
        }) => {
            const result = await editDepartmentMemberRole(userId, {
                department_role,
            });
            // Очищаем кэш всех департаментов при изменении роли
            clearAllDepartmentsCaches();
            return result;
        },
        onSuccess: (data) => {
            console.log('Department role edited:', data);
        },
        onError: (error: Error) => {
            console.error("Edit department role error:", error.message);
        },
    });
};

export const useCreateDepartment = () => {
    return useMutation({
        mutationFn: async (body: { name: string }) => {
            const result = await createDepartment(body);
            // Очищаем кэш списка департаментов при создании нового
            clearDepartmentsListCache();
            return result;
        },
        onSuccess: (data) => {
            console.log('Department created:', data);
        },
        onError: (error: Error) => {
            console.error("Create department error:", error.message);
        },
    });
};

export const useEditDepartmentName = () => {
    return useMutation({
        mutationFn: async ({
            department_id,
            name,
        }: {
            department_id: number;
            name: string;
        }) => {
            const result = await editDepartmentName(department_id, { name });
            // Очищаем кэш списка департаментов и конкретного департамента
            clearDepartmentsListCache();
            clearDepartmentMembersCache(department_id.toString());
            return result;
        },
        onSuccess: (data) => {
            console.log('Department name edited:', data);
        },
        onError: (error: Error) => {
            console.error("Edit department name error:", error.message);
        },
    });
};

export const useDeleteDepartment = () => {
    return useMutation({
        mutationFn: async ({
            department_id,
        }: {
            department_id: number;
        }) => {
            const result = await deleteDepartment(department_id);
            // Очищаем все кэши при удалении департамента
            clearAllDepartmentsCaches();
            return result;
        },
        onSuccess: (data) => {
            console.log('Department deleted:', data);
        },
        onError: (error: Error) => {
            console.error("Delete department error:", error.message);
        },
    });
};

// ========== ДОПОЛНИТЕЛЬНЫЕ УТИЛИТЫ ==========

export const departmentsCacheUtils = {
    clearListCache: clearDepartmentsListCache,
    clearMembersCache: clearDepartmentMembersCache,
    clearRolesCache: clearDepartmentRolesCache,
    clearAll: clearAllDepartmentsCaches,
    getCacheStats: () => ({
        departmentsListCached: !!departmentsListCache,
        departmentMembersCount: departmentMembersCache.size,
        departmentRolesCached: !!departmentRolesCache,
    }),
    getCacheAge: () => {
        const now = Date.now();
        return {
            departmentsList: departmentsListCache ? Math.floor((now - departmentsListCache.timestamp) / 1000) : null,
            departmentRoles: departmentRolesCache ? Math.floor((now - departmentRolesCache.timestamp) / 1000) : null,
        };
    }
};