import { useMutation } from "@tanstack/react-query";
import { useUserStore } from "../store/UsersStore";
import { getPositions } from "../services/position";
import { createGrade, deleteGrade, editGrade } from "../services/grade";

// ========== КЭШ ДЛЯ ГРЕЙДОВ ==========

// Кэш для грейдов (предполагаем, что они привязаны к позициям или глобальные)
let gradesCache: { data: any[]; timestamp: number } | null = null;
const CACHE_DURATION = 30 * 60 * 1000; // 30 минут

// Функции очистки кэша
const clearGradesCache = () => {
  gradesCache = null;
  console.log('Grades cache cleared');
};

// Функция получения кэшированных данных
const getCachedGrades = () => {
  const now = Date.now();
  if (gradesCache && (now - gradesCache.timestamp) < CACHE_DURATION) {
    console.log('Returning cached grades data');
    return gradesCache.data;
  }
  return null;
};

// Примечание: В вашем коде нет хука useGetGrades, но я его добавлю
// Если у вас есть сервис getGrades, раскомментируйте импорт
// import { getGrades } from "../services/grade";

// Хук для получения грейдов (если он вам нужен)
// export const useGetGrades = () => {
//     const setGrades = useUserStore((state) => state.setGrades);
//     
//     return useMutation({
//         mutationFn: async () => {
//             const cached = getCachedGrades();
//             if (cached) {
//                 return cached;
//             }
//             
//             const data = await getGrades();
//             gradesCache = { data, timestamp: Date.now() };
//             return data;
//         },
//         onSuccess: (data) => {
//             setGrades(data);
//             console.log('Grades loaded:', data);
//         },
//         onError: (error) => {
//             console.error("Get grades error:", error);
//         },
//     });
// };

export const useCreateGrade = () => {
  return useMutation({
    mutationFn: async (body: { name: string; position: number }) => {
      const result = await createGrade(body);
      // Очищаем кэш при создании нового грейда
      clearGradesCache();
      return result;
    },
    onSuccess: (data) => {
      console.log('Grade created:', data);
    },
    onError: (error) => {
      console.error("Create grade error:", error);
    },
  });
};

export const useEditGrade = () => {
  return useMutation({
    mutationFn: async (params: {
      gradeId: string;
      body: { name: string; position: string };
    }) => {
      const result = await editGrade(params.body, params.gradeId);
      // Очищаем кэш при редактировании грейда
      clearGradesCache();
      return result;
    },
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
    mutationFn: async (params: { gradeId: string }) => {
      const result = await deleteGrade(params.gradeId);
      // Очищаем кэш при удалении грейда
      clearGradesCache();
      return result;
    },
    onSuccess: (data) => {
      console.log("Grade deleted:", data);
    },
    onError: (error: Error) => {
      console.error("Delete grade error:", error.message);
    },
  });
};

// ========== ДОПОЛНИТЕЛЬНЫЕ УТИЛИТЫ ==========

export const gradesCacheUtils = {
  clearCache: clearGradesCache,
  isCacheValid: () => {
    if (!gradesCache) return false;
    const now = Date.now();
    return (now - gradesCache.timestamp) < CACHE_DURATION;
  },
  getCacheAge: () => {
    if (!gradesCache) return null;
    const now = Date.now();
    return Math.floor((now - gradesCache.timestamp) / 1000); // в секундах
  },
  getCacheSize: () => {
    return gradesCache ? gradesCache.data.length : 0;
  }
};