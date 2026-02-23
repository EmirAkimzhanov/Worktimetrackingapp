"use client";

import React, { useEffect, useState } from "react";
import { Plus, Trash2, Edit2, Search, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useDeleteTask,
  useEditTask,
  useGetTasks,
  useGetTaskTypes,
} from "../../../hooks/useTasks";
import { useUserStore } from "../../../store/UsersStore";
import { toast } from "sonner@2.0.3";

// Типы данных из стора
interface Task {
  id: number;
  name: string;
  task_type?: number;
}

interface TaskType {
  id: number;
  name: string;
}

const SimpleDepartmentsTables = () => {
  const [newTaskDialogOpen, setNewTaskDialogOpen] = useState(false);
  const [editTaskDialogOpen, setEditTaskDialogOpen] = useState(false);
  const [deleteTaskDialogOpen, setDeleteTaskDialogOpen] = useState(false);
  const [selectedTaskType, setSelectedTaskType] = useState<number | null>(null);
  const [newTask, setNewTask] = useState<Partial<Task>>({
    name: "",
    task_type: undefined,
  });
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editTaskData, setEditTaskData] = useState<Partial<Task>>({});
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { mutate: getTasks } = useGetTasks();
  const { mutate: getTaskTypes } = useGetTaskTypes();
  const { mutate: editTask } = useEditTask();
  const { mutate: deleteTask } = useDeleteTask();
  const store_tasks = useUserStore((state) => state.tasks);
  const task_types = useUserStore((state) => state.task_types);

  useEffect(() => {
    getTasks();
    getTaskTypes();
  }, []);

  // Получаем маппинг task_type_id -> название типа
  const taskTypeMap = React.useMemo(() => {
    const map = new Map<number, string>();
    if (task_types) {
      task_types.forEach((type: TaskType) => {
        map.set(type.id, type.name);
      });
    }
    return map;
  }, [task_types]);

  // Группируем задачи по task_type
  const tasksByType = React.useMemo(() => {
    if (!store_tasks) return new Map<number, Task[]>();

    const grouped = new Map<number, Task[]>();

    store_tasks.forEach((task: Task) => {
      const typeId = task.task_type || 0;
      if (!grouped.has(typeId)) {
        grouped.set(typeId, []);
      }
      grouped.get(typeId)?.push(task);
    });

    return grouped;
  }, [store_tasks]);

  // Получаем все доступные типы задач
  const availableTaskTypes = React.useMemo(() => {
    if (!task_types) return [];
    return task_types;
  }, [task_types]);

  // Получение задач по типу с поиском
  const getTasksByTypeWithSearch = (typeId: number) => {
    const tasks = tasksByType.get(typeId) || [];

    if (!searchQuery) return tasks;

    return tasks.filter((task) =>
      task.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  };

  // Получение статистики по типу
  const getTypeStats = (typeId: number) => {
    const tasks = tasksByType.get(typeId) || [];
    return {
      total: tasks.length,
    };
  };

  // Добавление новой задачи
  const handleAddTask = () => {
    if (!newTask.name?.trim() || !selectedTaskType) return;

    // Здесь будет вызов API для создания задачи
    console.log("Adding task:", {
      name: newTask.name.trim(),
      task_type: selectedTaskType,
    });

    setNewTask({ name: "", task_type: undefined });
    setSelectedTaskType(null);
    setNewTaskDialogOpen(false);
  };

  // Начало редактирования задачи
  const handleStartEditTask = (task: Task) => {
    setEditingTask(task);
    setEditTaskData({ name: task.name });
    setEditTaskDialogOpen(true);
  };

  // Сохранение изменений задачи
  const handleSaveEditTask = () => {
    if (!editingTask || !editTaskData.name?.trim()) return;

    editTask(
      {
        task_id: editingTask.id.toString(),
        body: {
          name: editTaskData.name.trim(),
        },
      },
      {
        onSuccess: () => {
          toast.success("Task updated successfully");
          getTasks(); // Обновляем список задач
          setEditTaskDialogOpen(false);
          setEditingTask(null);
          setEditTaskData({});
        },
        onError: (error) => {
          console.error("Error editing task:", error);
          toast.error("Failed to update task");
        },
      },
    );
  };

  // Начало удаления задачи
  const handleStartDeleteTask = (task: Task) => {
    setTaskToDelete(task);
    setDeleteTaskDialogOpen(true);
  };

  // Удаление задачи - ИСПРАВЛЕНО!
  const handleDeleteTask = () => {
    if (!taskToDelete) return;

    deleteTask(
      taskToDelete.id.toString(), // ✅ передаём string
      {
        onSuccess: () => {
          toast.success("Task deleted successfully");
          getTasks();
          setDeleteTaskDialogOpen(false);
          setTaskToDelete(null);
        },
        onError: (error) => {
          console.error("Error deleting task:", error);
          toast.error("Failed to delete task");
        },
      },
    );
  };
  // Фильтруем типы задач, которые нужно показать
  const visibleTaskTypes = React.useMemo(() => {
    return availableTaskTypes.filter((taskType: TaskType) => {
      const typeTasks = getTasksByTypeWithSearch(taskType.id);
      // Показываем тип, если есть задачи после поиска
      return typeTasks.length > 0;
    });
  }, [availableTaskTypes, searchQuery, tasksByType]);

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Заголовок и панель управления */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tasks by Type</h1>
          <p className="text-gray-600 mt-2">
            View and manage tasks organized by their type
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-full"
            />
          </div>

          <Dialog open={newTaskDialogOpen} onOpenChange={setNewTaskDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Task
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add New Task</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="taskType">Task Type *</Label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={selectedTaskType || ""}
                    onChange={(e) =>
                      setSelectedTaskType(Number(e.target.value))
                    }
                  >
                    <option value="">Select task type</option>
                    {task_types?.map((type: TaskType) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="taskText">Task Description *</Label>
                  <Input
                    id="taskText"
                    placeholder="Enter task description..."
                    value={newTask.name}
                    onChange={(e) =>
                      setNewTask({ ...newTask, name: e.target.value })
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setNewTaskDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddTask}
                  disabled={!newTask.name?.trim() || !selectedTaskType}
                >
                  Add Task
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Диалог удаления задачи */}
      <Dialog
        open={deleteTaskDialogOpen}
        onOpenChange={setDeleteTaskDialogOpen}
      >
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Delete Task
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-3 bg-red-50 rounded-lg">
              <p className="font-medium text-gray-900">{taskToDelete?.name}</p>
              {taskToDelete && taskToDelete.task_type && (
                <p className="text-sm text-gray-600 mt-1">
                  Type: {taskTypeMap.get(taskToDelete.task_type)}
                </p>
              )}
            </div>
            <div className="text-sm text-gray-600">
              <p className="font-medium">
                Are you sure you want to delete this task?
              </p>
              <p className="mt-1 text-red-600">This action cannot be undone.</p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteTaskDialogOpen(false);
                setTaskToDelete(null);
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteTask}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              Delete Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Диалог редактирования задачи */}
      <Dialog open={editTaskDialogOpen} onOpenChange={setEditTaskDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="editTaskText">Task Description *</Label>
              <Input
                id="editTaskText"
                placeholder="Enter task description..."
                value={editTaskData.name || ""}
                onChange={(e) =>
                  setEditTaskData({ ...editTaskData, name: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="editTaskType">Task Type</Label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={editTaskData.task_type || ""}
                onChange={(e) =>
                  setEditTaskData({
                    ...editTaskData,
                    task_type: Number(e.target.value),
                  })
                }
              >
                <option value="">Select task type</option>
                {task_types?.map((type: TaskType) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>

            {editingTask && (
              <div className="text-sm text-gray-500">
                <p>
                  Current type:{" "}
                  <span className="font-medium">
                    {taskTypeMap.get(editingTask.task_type || 0)}
                  </span>
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditTaskDialogOpen(false);
                setEditingTask(null);
                setEditTaskData({});
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveEditTask}
              disabled={!editTaskData.name?.trim()}
              style={{
                backgroundColor: "#111827",
                color: "white",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "#1f2937")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "#111827")
              }
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Таблицы по типам задач */}
      <div className="space-y-8">
        {visibleTaskTypes.map((taskType: TaskType) => {
          const typeTasks = getTasksByTypeWithSearch(taskType.id);
          const typeStats = getTypeStats(taskType.id);

          return (
            <div
              key={taskType.id}
              className="mb-8 last:mb-0"
              style={{ margin: "30px 0" }}
            >
              <div className="rounded-lg border border-l-4 border-l-blue-500 bg-blue-50">
                {/* Заголовок таблицы с названием типа */}
                <div className="p-4 border-b bg-white/50">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-8 bg-blue-500 rounded"></div>
                      <div>
                        <h2 className="text-lg font-bold text-gray-900">
                          {taskType.name}
                        </h2>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="text-sm text-gray-600">
                            {typeStats.total} task
                            {typeStats.total !== 1 ? "s" : ""}
                          </span>
                        </div>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => {
                        setSelectedTaskType(taskType.id);
                        setNewTaskDialogOpen(true);
                      }}
                      className="text-sm"
                      style={{ width: "15%" }}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add Task
                    </Button>
                  </div>
                </div>

                {/* Таблица задач */}
                {typeTasks.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">#</TableHead>
                          <TableHead>Task Description</TableHead>
                          <TableHead className="w-24">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {typeTasks.map((task, index) => (
                          <TableRow
                            key={task.id}
                            className="hover:bg-gray-50/50"
                          >
                            <TableCell>
                              <div className="flex items-center justify-center w-8 h-8 bg-gray-100 text-gray-700 rounded-full text-sm font-semibold">
                                {index + 1}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium text-gray-900">
                                {task.name}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleStartEditTask(task)}
                                  className="h-7 px-2"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleStartDeleteTask(task)}
                                  className="h-7 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-500">
                    <p className="text-lg">No tasks in this category</p>
                    <p className="text-sm mt-2">
                      Add tasks using the "Add Task" button
                    </p>
                  </div>
                )}

                {/* Статистика внизу таблицы */}
                {typeTasks.length > 0 && (
                  <div className="p-3 border-t bg-white/30">
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>
                        {typeTasks.length} task
                        {typeTasks.length !== 1 ? "s" : ""}
                      </span>
                      {searchQuery && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                          Search: "{searchQuery}"
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Пустое состояние */}
      {(!store_tasks ||
        store_tasks.length === 0 ||
        visibleTaskTypes.length === 0) && (
        <Card className="text-center py-12 mt-8">
          <CardContent>
            <div className="text-gray-400 mb-4">
              <Plus className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              {!store_tasks || store_tasks.length === 0
                ? "No Tasks Yet"
                : "No matching tasks"}
            </h3>
            <p className="text-gray-500 mb-6">
              {!store_tasks || store_tasks.length === 0
                ? "Add your first task to get started"
                : "Try adjusting your search query"}
            </p>
            <Button
              onClick={() => setNewTaskDialogOpen(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add First Task
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SimpleDepartmentsTables;
