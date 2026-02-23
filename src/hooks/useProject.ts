import { useMutation } from '@tanstack/react-query';
import { useUserStore } from '../store/UsersStore';
import { deleteProject, editProject, getProjects, getProjectTasks, sendProject } from '../services/project';
import { ProjectBody } from '../types/project';


export const useGetProjectTasks = () => {
    const setProjectTasks = useUserStore((state) => state.setProjectTasks);

    return useMutation({
        mutationFn: (project_id: string) => getProjectTasks(project_id),
        onSuccess: (data) => {
            setProjectTasks(data);
            console.log('Country clients loaded:', data);
        },
        onError: (error: Error) => {
            console.error("Get country clients error:", error.message);
        },
    });
};


export const useSendProject = () => {


    return useMutation({
        mutationFn: (project_data: ProjectBody) => sendProject(project_data),
        onSuccess: (data) => {
            console.log('Country clients loaded:', data);
        },
        onError: (error: Error) => {
            console.error("Get country clients error:", error.message);
        },
    });
};

export const useEditProject = () => {


    return useMutation({
        mutationFn: ({ project_data, project_id }: { project_data: ProjectBody; project_id: string }) => editProject(project_data, project_id),
        onSuccess: (data) => {

            console.log('Country clients loaded:', data);
        },
        onError: (error: Error) => {
            console.error("Get country clients error:", error.message);
        },
    });
};

export const useGetProjects = () => {
    const setProjects = useUserStore((state) => state.setProjects);

    return useMutation({
        mutationFn: () => getProjects(),
        onSuccess: (data) => {
            setProjects(data);
            console.log('Country clients loaded:', data);
        },
        onError: (error: Error) => {
            console.error("Get country clients error:", error.message);
        },
    });
};

export const useDeleteProject = () => {


    return useMutation({
        mutationFn: (project_id: string) => deleteProject(project_id),
        onSuccess: (data) => {
            console.log('Country clients loaded:', data);
        },
        onError: (error: Error) => {
            console.error("Get country clients error:", error.message);
        },
    });
};