import { useMutation } from "@tanstack/react-query";
import { useUserStore } from "../store/UsersStore";
import { getProjectTasks } from "../services/project";
import {
  DeleteTask,
  EditTask,
  getInternalTasks,
  getTasks,
  getTaskTypes,
} from "../services/task";

export const useGetInterbalTasks = () => {
  const setInternalTasks = useUserStore((state) => state.setInternalTasks);

  return useMutation({
    mutationFn: () => getInternalTasks(),
    onSuccess: (data) => {
      setInternalTasks(data);
      console.log("Country clients loaded:", data);
    },
    onError: (error: Error) => {
      console.error("Get country clients error:", error.message);
    },
  });
};

export const useGetTaskTypes = () => {
  const setTaskTypes = useUserStore((state) => state.setTaskTypes);

  return useMutation({
    mutationFn: () => getTaskTypes(),
    onSuccess: (data) => {
      setTaskTypes(data);
      console.log("Country clients loaded:", data);
    },
    onError: (error: Error) => {
      console.error("Get country clients error:", error.message);
    },
  });
};

export const useGetTasks = () => {
  const setTasks = useUserStore((state) => state.setTasks);

  return useMutation({
    mutationFn: () => getTasks(),
    onSuccess: (data) => {
      setTasks(data);
      console.log("Country clients loaded:", data);
    },
    onError: (error: Error) => {
      console.error("Get country clients error:", error.message);
    },
  });
};

export const useEditTask = () => {
  return useMutation({
    mutationFn: (params: { task_id: string; body: { name: string } }) =>
      EditTask(params.task_id, params.body),
    onSuccess: (data) => {},
    onError: (error: Error) => {},
  });
};

export const useDeleteTask = () => {
  return useMutation({
    mutationFn: (task_id: string) => DeleteTask(task_id),
    onSuccess: (data) => {},
    onError: (error: Error) => {},
  });
};
