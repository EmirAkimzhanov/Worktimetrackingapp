import { useMutation } from "@tanstack/react-query";
import { useUserStore } from "../store/UsersStore";
import { getPositions } from "../services/position";
import { createGrade, deleteGrade, editGrade } from "../services/grade";

export const useCreateGrade = () => {
  return useMutation({
    mutationFn: (body: { name: string; position: number }) => createGrade(body),
    onSuccess: (data) => {
      console.log(data);
    },
    onError: (error) => {
      console.error("Send supports error:", error);
    },
  });
};

export const useEditGrade = () => {
  return useMutation({
    mutationFn: (params: {
      gradeId: string;
      body: { name: string; position: string };
    }) => editGrade(params.body, params.gradeId),
    onSuccess: (data) => {
      console.log("Grade edited:", data);
    },
    onError: (error: Error) => {
      console.error("Edit grade error:", error.message);
    },
  });
};

export const useDeleteGrade = () => {
  return useMutation({
    mutationFn: (params: { gradeId: string }) => deleteGrade(params.gradeId),
    onSuccess: (data) => {
      console.log("Grade deleted:", data);
    },
    onError: (error: Error) => {
      console.error("Delete grade error:", error.message);
    },
  });
};
