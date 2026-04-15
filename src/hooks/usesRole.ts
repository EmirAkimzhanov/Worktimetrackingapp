import { useMutation } from "@tanstack/react-query";
import { useUserStore } from "../store/UsersStore";
import { getInternalTasks } from "../services/task";
import { createRole, deleteRole, editRole, getRoles } from "../services/role";

// ========== КЭШ ДЛЯ РОЛЕЙ ==========

let rolesCache: { data: any[]; timestamp: number } | null = null;
const CACHE_DURATION = 30 * 60 * 1000; // 30 минут

// Функция очистки кэша
const clearRolesCache = () => {
  rolesCache = null;
  console.log('Roles cache cleared');
};

// Функция получения кэшированных данных
const getCachedRoles = () => {
  const now = Date.now();
  if (rolesCache && (now - rolesCache.timestamp) < CACHE_DURATION) {
    console.log('Returning cached roles data');
    return rolesCache.data;
  }
  return null;
};

// ========== ХУКИ С КЭШИРОВАНИЕМ ==========

export const useGetRoles = () => {
  const setRoles = useUserStore((state) => state.setRoles);

  return useMutation({
    mutationFn: async (forceRefresh?: boolean) => {
      // Проверяем кэш
      if (!forceRefresh) {
        const cached = getCachedRoles();
        if (cached) {
          return cached;
        }
      }

      // Загружаем новые данные
      console.log(forceRefresh ? 'Force refreshing roles' : 'Fetching fresh roles');
      const data = await getRoles();
      rolesCache = { data, timestamp: Date.now() };
      return data;
    },
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
    mutationFn: async (body: { name: string }) => {
      const result = await createRole(body);
      // Очищаем кэш при создании новой роли
      clearRolesCache();
      return result;
    },
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
    mutationFn: async (params: { roleId: string; body: { name: string } }) => {
      const result = await editRole(params.roleId, params.body);
      // Очищаем кэш при редактировании роли
      clearRolesCache();
      return result;
    },
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
    mutationFn: async (roleId: string) => {
      const result = await deleteRole(roleId);
      // Очищаем кэш при удалении роли
      clearRolesCache();
      return result;
    },
    onSuccess: (data) => {
      console.log("Role deleted:", data);
    },
    onError: (error: Error) => {
      console.error("Delete role error:", error.message);
    },
  });
};

// ========== ДОПОЛНИТЕЛЬНЫЕ УТИЛИТЫ ==========

export const rolesCacheUtils = {
  clearCache: clearRolesCache,

  isCacheValid: () => {
    if (!rolesCache) return false;
    const now = Date.now();
    return (now - rolesCache.timestamp) < CACHE_DURATION;
  },

  getCacheAge: () => {
    if (!rolesCache) return null;
    const now = Date.now();
    return Math.floor((now - rolesCache.timestamp) / 1000); // в секундах
  },

  getCacheAgeInMinutes: () => {
    if (!rolesCache) return null;
    const now = Date.now();
    return Math.floor((now - rolesCache.timestamp) / 60000); // в минутах
  },

  getCacheSize: () => {
    return rolesCache ? rolesCache.data.length : 0;
  },

  getCacheData: () => {
    return rolesCache ? rolesCache.data : null;
  },

  refreshCache: async () => {
    // Принудительное обновление кэша
    const data = await getRoles();
    rolesCache = { data, timestamp: Date.now() };
    console.log('Roles cache refreshed');
    return data;
  },

  getCacheInfo: () => {
    if (!rolesCache) {
      return { exists: false, isValid: false, age: null, size: 0 };
    }

    const now = Date.now();
    const ageInSeconds = Math.floor((now - rolesCache.timestamp) / 1000);
    const isValid = ageInSeconds < CACHE_DURATION / 1000;

    return {
      exists: true,
      isValid,
      ageInSeconds,
      ageInMinutes: Math.floor(ageInSeconds / 60),
      size: rolesCache.data.length,
      remainingSeconds: isValid ? Math.floor((CACHE_DURATION / 1000) - ageInSeconds) : 0,
      remainingMinutes: isValid ? Math.floor((CACHE_DURATION / 60000) - (ageInSeconds / 60)) : 0,
      data: rolesCache.data
    };
  },

  // Функция для автоматической очистки при изменениях в связанных модулях
  clearOnMutation: () => {
    clearRolesCache();
  }
};