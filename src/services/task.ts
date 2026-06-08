import axios from "axios";
import { api } from "../consts/api";
import { useUserStore } from "../store/UsersStore";

export const getInternalTasks = async () => {
  const token = useUserStore.getState().access_token;

  if (!token) {
    throw new Error("No access token available");
  }

  const res = await axios(
    `${api}api/projects/tasks/internal/`,

    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
  return res.data;
};

export const getTaskTypes = async () => {
  const token = useUserStore.getState().access_token;

  if (!token) {
    throw new Error("No access token available");
  }

  const res = await axios(
    `${api}api/projects/task-types/`,

    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
  return res.data;
};

export const getTasks = async () => {
  const token = useUserStore.getState().access_token;

  if (!token) {
    throw new Error("No access token available");
  }

  const res = await axios(
    `${api}api/projects/tasks/`,

    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
  return res.data;
};

export const EditTask = async (task_id: string, body: { name: string }) => {
  const token = useUserStore.getState().access_token;

  if (!token) {
    throw new Error("No access token available");
  }

  const res = await axios.patch(
    `${api}api/projects/tasks/${task_id}/`,
    body,

    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
  return res.data;
};

export const DeleteTask = async (task_id: string) => {
  const token = useUserStore.getState().access_token;

  if (!token) {
    throw new Error("No access token available");
  }

  const res = await axios.delete(
    `${api}api/projects/tasks/${task_id}/`,

    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
  return res.data;
};

export const createTask = async (body: { name: string; task_type: number }) => {
  const token = useUserStore.getState().access_token;

  if (!token) {
    throw new Error("No access token available");
  }

  const res = await axios.post(`${api}api/projects/tasks/`, body, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.data;
};

export const getLeaveTasks = async () => {
  const token = useUserStore.getState().access_token;

  if (!token) {
    throw new Error("No access token available");
  }

  const res = await axios(`${api}api/projects/tasks/leave/`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.data;
};

