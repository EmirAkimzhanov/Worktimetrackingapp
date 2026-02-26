import axios from "axios";
import { api } from "../consts/api";
import { useUserStore } from "../store/UsersStore";

export const createGrade = async (body: { name: string; position: number }) => {
  const token = useUserStore.getState().access_token;

  if (!token) {
    throw new Error("No access token available");
  }

  const res = await axios.post(
    `${api}api/accounts/grades/`,
    body,

    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
  return res.data;
};

export const editGrade = async (
  body: { name: string; position: string },
  gradeId: string,
) => {
  const token = useUserStore.getState().access_token;

  if (!token) {
    throw new Error("No access token available");
  }

  const res = await axios.patch(
    `${api}api/accounts/grades/${gradeId}/`,
    body,

    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
  return res.data;
};

export const deleteGrade = async (gradeId: string) => {
  const token = useUserStore.getState().access_token;

  if (!token) {
    throw new Error("No access token available");
  }

  const res = await axios.delete(`${api}api/accounts/grades/${gradeId}/`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.data;
};
