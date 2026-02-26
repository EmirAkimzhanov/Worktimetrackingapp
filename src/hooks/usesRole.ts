import { useMutation } from "@tanstack/react-query";
import { useUserStore } from "../store/UsersStore";
import { getInternalTasks } from "../services/task";
import { createRole, deleteRole, editRole, getRoles } from "../services/role";

export const useGetRoles = () => {
  const setRoles = useUserStore((state) => state.setRoles);

  return useMutation({
    mutationFn: () => getRoles(),
    onSuccess: (data) => {
      setRoles(data);
      console.log("Roles loaded:", data);
    },
    onError: (error: Error) => {
      console.error("Get roles error:", error.message);
    },
  });
};

export const useCreateRole = () => {
  return useMutation({
    mutationFn: (body: { name: string }) => createRole(body),
    onSuccess: (data) => {
      console.log("Role created:", data);
    },
    onError: (error: Error) => {
      console.error("Create role error:", error.message);
    },
  });
};
export const useEditRole = () => {
  return useMutation({
    mutationFn: (params: { roleId: string; body: { name: string } }) =>
      editRole(params.roleId, params.body),
    onSuccess: (data) => {
      console.log("Role edited:", data);
    },
    onError: (error: Error) => {
      console.error("Edit role error:", error.message);
    },
  });
};

export const useDeleteRole = () => {
  return useMutation({
    mutationFn: (roleId: string) => deleteRole(roleId),
    onSuccess: (data) => {
      console.log("Role deleted:", data);
    },
    onError: (error: Error) => {
      console.error("Delete role error:", error.message);
    },
  });
};
