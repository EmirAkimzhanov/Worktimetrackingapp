import axios from "axios";
import { api } from "../consts/api";
import { useUserStore } from "../store/UsersStore";

export const getRoles = async () => {
  const token = useUserStore.getState().access_token;

  if (!token) {
    throw new Error("No access token available");
  }

  const res = await axios(
    `${api}api/accounts/roles/`,

    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
  return res.data;
};

export const createRole = async (body: { name: string }) => {
  const token = useUserStore.getState().access_token;

  if (!token) {
    throw new Error("No access token available");
  }

  const res = await axios.post(
    `${api}api/accounts/roles/`,
    body,

    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
  return res.data;
};

export const editRole = async (roleId: string, body: { name: string }) => {
  const token = useUserStore.getState().access_token;

  if (!token) {
    throw new Error("No access token available");
  }

  const res = await axios.patch(
    `${api}api/accounts/roles/${roleId}/`,
    body,

    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
  return res.data;
};

export const deleteRole = async (roleId: string) => {
  const token = useUserStore.getState().access_token;

  if (!token) {
    throw new Error("No access token available");
  }

  const res = await axios.delete(
    `${api}api/accounts/roles/${roleId}/`,

    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
  return res.data;
};
