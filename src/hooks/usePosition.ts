import { useMutation } from "@tanstack/react-query";
import { getCountries } from "../services/countries";
import { useUserStore } from "../store/UsersStore";
import {
  createPosition,
  deletePosition,
  editPosition,
  getPositions,
} from "../services/position";

// ========== КЭШ ДЛЯ ПОЗИЦИЙ ==========

let positionsCache: { data: any[]; timestamp: number } | null = null;
const CACHE_DURATION = 30 * 60 * 1000; // 30 минут

// Функция очистки кэша
const clearPositionsCache = () => {
  positionsCache = null;
  console.log('Positions cache cleared');
};

// Функция получения кэшированных данных
const getCachedPositions = () => {
  const now = Date.now();
  if (positionsCache && (now - positionsCache.timestamp) < CACHE_DURATION) {
    console.log('Returning cached positions data');
    return positionsCache.data;
  }
  return null;
};

// ========== ХУКИ С КЭШИРОВАНИЕМ ==========

export const useGetPositions = () => {
  const setPositions = useUserStore((state) => state.setPositions);

  return useMutation({
    mutationFn: async (forceRefresh?: boolean) => {
      // Проверяем кэш
      if (!forceRefresh) {
        const cached = getCachedPositions();
        if (cached) {
          return cached;
        }
      }

      // Загружаем новые данные
      console.log(forceRefresh ? 'Force refreshing positions' : 'Fetching fresh positions');
      const data = await getPositions();
      positionsCache = { data, timestamp: Date.now() };
      return data;
    },
    onSuccess: (data) => {
      setPositions(data);
      console.log('Positions loaded:', data);
    },
    onError: (error) => {
      console.error("Get positions error:", error);
    },
  });
};

export const useCreatePosition = () => {
  return useMutation({
    mutationFn: async (body: { name: string }) => {
      const result = await createPosition(body);
      // Очищаем кэш при создании новой позиции
      clearPositionsCache();
      return result;
    },
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
    mutationFn: async (params: { positionId: string; body: { name: string } }) => {
      const result = await editPosition(params.body, params.positionId);
      // Очищаем кэш при редактировании позиции
      clearPositionsCache();
      return result;
    },
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
    mutationFn: async (params: { positionId: string }) => {
      const result = await deletePosition(params.positionId);
      // Очищаем кэш при удалении позиции
      clearPositionsCache();
      return result;
    },
    onSuccess: (data) => {
      console.log("Position deleted:", data);
    },
    onError: (error: Error) => {
      console.error("Delete position error:", error.message);
    },
  });
};

// ========== ДОПОЛНИТЕЛЬНЫЕ УТИЛИТЫ ==========

export const positionsCacheUtils = {
  clearCache: clearPositionsCache,
  isCacheValid: () => {
    if (!positionsCache) return false;
    const now = Date.now();
    return (now - positionsCache.timestamp) < CACHE_DURATION;
  },
  getCacheAge: () => {
    if (!positionsCache) return null;
    const now = Date.now();
    return Math.floor((now - positionsCache.timestamp) / 1000); // в секундах
  },
  getCacheAgeInMinutes: () => {
    if (!positionsCache) return null;
    const now = Date.now();
    return Math.floor((now - positionsCache.timestamp) / 60000); // в минутах
  },
  getCacheSize: () => {
    return positionsCache ? positionsCache.data.length : 0;
  },
  getCacheData: () => {
    return positionsCache ? positionsCache.data : null;
  },
  refreshCache: async () => {
    // Принудительное обновление кэша
    const data = await getPositions();
    positionsCache = { data, timestamp: Date.now() };
    console.log('Positions cache refreshed');
    return data;
  }
};