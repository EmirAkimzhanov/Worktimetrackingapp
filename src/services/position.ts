import axios from "axios";
import { api } from "../consts/api";
import { useUserStore } from "../store/UsersStore";

export const getPositions = async () => {
  const token = useUserStore.getState().access_token;

  if (!token) {
    throw new Error("No access token available");
  }

  const res = await axios(
    `${api}api/accounts/positions/`,

    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
  return res.data;
};

export const createPosition = async (body: { name: string }) => {
  const token = useUserStore.getState().access_token;

  if (!token) {
    throw new Error("No access token available");
  }

  const res = await axios.post(`${api}api/accounts/positions/`, body, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.data;
};

export const editPosition = async (
  body: { name: string },
  positionId: string,
) => {
  const token = useUserStore.getState().access_token;

  if (!token) {
    throw new Error("No access token available");
  }

  const res = await axios.patch(
    `${api}api/accounts/positions/${positionId}/`,
    body,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
  return res.data;
};

export const deletePosition = async (positionId: string) => {
  const token = useUserStore.getState().access_token;

  if (!token) {
    throw new Error("No access token available");
  }

  const res = await axios.delete(
    `${api}api/accounts/positions/${positionId}/`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
  return res.data;
};
