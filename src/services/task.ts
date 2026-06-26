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

export const getTaskTypeExcel = async (taskTypeId: number): Promise<Blob> => {
  const token = useUserStore.getState().access_token;

  if (!token) {
    throw new Error("No access token available");
  }

  try {
    const res = await axios.get(`${api}api/projects/task-types/${taskTypeId}/export-excel/`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      responseType: 'blob'
    });

    if (!(res.data instanceof Blob)) {
      throw new Error('Invalid response format');
    }

    return res.data;
  } catch (error) {
    console.error('Error fetching task type Excel:', error);
    throw error;
  }
}

export const downloadTaskTypeExcel = async (taskTypeId: number, taskTypeName?: string, filename?: string) => {
  try {
    const blob = await getTaskTypeExcel(taskTypeId);

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;

    const defaultFilename = `tasks_${taskTypeName || 'export'}_${new Date().toISOString().split('T')[0]}.xlsx`;
    link.download = filename || defaultFilename;

    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading task type Excel:', error);
    throw error;
  }
}

export const importTaskTypeExcel = async (taskTypeId: number, file: File): Promise<any> => {
  const token = useUserStore.getState().access_token;

  if (!token) {
    throw new Error("No access token available");
  }

  const formData = new FormData();
  formData.append('file', file);

  try {
    const res = await axios.post(
      `${api}api/projects/task-types/${taskTypeId}/import-excel/`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return res.data;
  } catch (error) {
    console.error('Error importing task type Excel:', error);
    throw error;
  }
}