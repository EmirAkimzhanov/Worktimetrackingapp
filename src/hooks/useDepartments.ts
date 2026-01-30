import { useMutation } from '@tanstack/react-query';
import { useUserStore } from '../store/UsersStore';
import { getDepartmentRoles, getDepartments } from '../services/department';

export const useGetDepartments = () => {
    const setDepartments = useUserStore((state) => state.setDepartments);
    const setDepartmentMembers = useUserStore((state) => state.setDepartmentMembers);

    return useMutation({
        mutationFn: (department_id?: string) => getDepartments(department_id),
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
        mutationFn: () => getDepartmentRoles(),
        onSuccess: (data) => {
            setDepartmentRoles(data);
            console.log('Country clients loaded:', data);
        },
        onError: (error: Error) => {
            console.error("Get country clients error:", error.message);
        },
    });
};