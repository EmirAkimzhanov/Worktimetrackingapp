import { useMutation } from "@tanstack/react-query";
import { getCountries } from "../services/countries";
import { useUserStore } from "../store/UsersStore";
import {
  createPosition,
  deletePosition,
  editPosition,
  getPositions,
} from "../services/position";

export const useGetPositions = () => {
  const setPositions = useUserStore((state) => state.setPositions);
  return useMutation({
    mutationFn: () => getPositions(),
    onSuccess: (data) => {
      setPositions(data);
      console.log(data);
    },
    onError: (error) => {
      console.error("Send supports error:", error);
    },
  });
};

export const useCreatePosition = () => {
  return useMutation({
    mutationFn: (body: { name: string }) => createPosition(body),
    onSuccess: (data) => {
      console.log("Position created:", data);
    },
    onError: (error) => {
      console.error("Create position error:", error);
    },
  });
};

export const useEditPosition = () => {
  return useMutation({
    mutationFn: (params: { positionId: string; body: { name: string } }) =>
      editPosition(params.body, params.positionId),
    onSuccess: (data) => {
      console.log("Position edited:", data);
    },
    onError: (error: Error) => {
      console.error("Edit position error:", error.message);
    },
  });
};

export const useDeletePosition = () => {
  return useMutation({
    mutationFn: (params: { positionId: string }) =>
      deletePosition(params.positionId),
    onSuccess: (data) => {
      console.log("Position deleted:", data);
    },
    onError: (error: Error) => {
      console.error("Delete position error:", error.message);
    },
  });
};
