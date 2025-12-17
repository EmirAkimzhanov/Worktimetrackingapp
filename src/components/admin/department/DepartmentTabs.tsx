"use client"

import React, { useState } from 'react'
import { Plus, Trash2, Edit2, Search, AlertTriangle } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

// Типы данных
interface Task {
    id: string
    text: string
    departmentId: string
    estimatedHours?: number
}

interface Department {
    id: string
    name: string
    color: string
}

const initialDepartments: Department[] = [
    { id: 'dept1', name: 'Finance Department', color: 'blue' },
    { id: 'dept2', name: 'Operations Department', color: 'green' },
    { id: 'dept3', name: 'HR Department', color: 'purple' },
    { id: 'dept4', name: 'IT Department', color: 'orange' },
]

const initialTasks: Task[] = [
    // Finance Department tasks
    { id: '1', text: 'Risk Assessment', departmentId: 'dept1', estimatedHours: 8 },
    { id: '2', text: 'Pre-taxiance procedures: PR', departmentId: 'dept1', estimatedHours: 4 },
    { id: '3', text: 'Cash Flow Analysis', departmentId: 'dept1' },
    { id: '4', text: 'PPE Accounting', departmentId: 'dept1', estimatedHours: 6 },
    { id: '5', text: 'CC G&A Review', departmentId: 'dept1' },

    // Operations Department tasks
    { id: '6', text: 'Travels in town for the client', departmentId: 'dept2', estimatedHours: 10 },
    { id: '7', text: 'Tax - Yearly tax returns & financial statements', departmentId: 'dept2' },
    { id: '8', text: 'Tax - Reconciliation procedures', departmentId: 'dept2', estimatedHours: 5 },
    { id: '9', text: 'Client communication and consulting', departmentId: 'dept2' },
    { id: '10', text: 'Stock management', departmentId: 'dept2', estimatedHours: 8 },

    // HR Department tasks
    { id: '11', text: 'HR - Recruitment Process', departmentId: 'dept3', estimatedHours: 12 },
    { id: '12', text: 'HR - Employee Onboarding', departmentId: 'dept3' },
    { id: '13', text: 'HR - Performance Reviews', departmentId: 'dept3', estimatedHours: 6 },
    { id: '14', text: 'HR - Training Programs', departmentId: 'dept3' },

    // IT Department tasks
    { id: '15', text: 'IT - System Maintenance', departmentId: 'dept4', estimatedHours: 16 },
    { id: '16', text: 'IT - Security Audit', departmentId: 'dept4' },
    { id: '17', text: 'IT - Software Updates', departmentId: 'dept4', estimatedHours: 8 },
    { id: '18', text: 'IT - User Support', departmentId: 'dept4' },
]

const SimpleDepartmentsTables = () => {
    const [departments, setDepartments] = useState<Department[]>(initialDepartments)
    const [tasks, setTasks] = useState<Task[]>(initialTasks)
    const [newTaskDialogOpen, setNewTaskDialogOpen] = useState(false)
    const [newDepartmentDialogOpen, setNewDepartmentDialogOpen] = useState(false)
    const [editTaskDialogOpen, setEditTaskDialogOpen] = useState(false)
    const [deleteDepartmentDialogOpen, setDeleteDepartmentDialogOpen] = useState(false)
    const [deleteTaskDialogOpen, setDeleteTaskDialogOpen] = useState(false)
    const [selectedDepartment, setSelectedDepartment] = useState<string>('')
    const [newTask, setNewTask] = useState<Partial<Task>>({
        text: '',
        estimatedHours: undefined
    })
    const [newDepartment, setNewDepartment] = useState<Partial<Department>>({
        name: '',
        color: 'blue'
    })
    const [editingTask, setEditingTask] = useState<Task | null>(null)
    const [editTaskData, setEditTaskData] = useState<Partial<Task>>({})
    const [departmentToDelete, setDepartmentToDelete] = useState<Department | null>(null)
    const [taskToDelete, setTaskToDelete] = useState<Task | null>(null)
    const [searchQuery, setSearchQuery] = useState('')

    // Получение задач по отделу
    const getTasksByDepartment = (departmentId: string) => {
        let filteredTasks = tasks.filter(task => task.departmentId === departmentId)

        // Применяем поиск
        if (searchQuery) {
            filteredTasks = filteredTasks.filter(task =>
                task.text.toLowerCase().includes(searchQuery.toLowerCase())
            )
        }

        return filteredTasks
    }

    // Добавление новой задачи
    const handleAddTask = () => {
        if (!newTask.text?.trim() || !selectedDepartment) return

        const taskToAdd: Task = {
            id: Date.now().toString(),
            text: newTask.text.trim(),
            departmentId: selectedDepartment,
            estimatedHours: newTask.estimatedHours
        }

        setTasks(prev => [...prev, taskToAdd])

        // Сброс формы
        setNewTask({ text: '', estimatedHours: undefined })
        setNewTaskDialogOpen(false)
        setSelectedDepartment('')
    }

    // Добавление нового отдела
    const handleAddDepartment = () => {
        if (!newDepartment.name?.trim()) return

        const departmentToAdd: Department = {
            id: `dept${departments.length + 1}`,
            name: newDepartment.name.trim(),
            color: newDepartment.color || 'blue'
        }

        setDepartments(prev => [...prev, departmentToAdd])

        // Сброс формы
        setNewDepartment({ name: '', color: 'blue' })
        setNewDepartmentDialogOpen(false)
    }

    // Начало удаления задачи
    const handleStartDeleteTask = (task: Task) => {
        setTaskToDelete(task)
        setDeleteTaskDialogOpen(true)
    }

    // Удаление задачи
    const handleDeleteTask = () => {
        if (!taskToDelete) return

        setTasks(prev => prev.filter(task => task.id !== taskToDelete.id))
        setDeleteTaskDialogOpen(false)
        setTaskToDelete(null)
    }

    // Начало редактирования задачи
    const handleStartEditTask = (task: Task) => {
        setEditingTask(task)
        setEditTaskData({ text: task.text, estimatedHours: task.estimatedHours })
        setEditTaskDialogOpen(true)
    }

    // Сохранение изменений задачи
    const handleSaveEditTask = () => {
        if (!editingTask || !editTaskData.text?.trim()) return

        setTasks(prev => prev.map(task =>
            task.id === editingTask.id
                ? { ...task, text: editTaskData.text!.trim(), estimatedHours: editTaskData.estimatedHours }
                : task
        ))

        setEditTaskDialogOpen(false)
        setEditingTask(null)
        setEditTaskData({})
    }

    // Начало удаления отдела
    const handleStartDeleteDepartment = (department: Department) => {
        setDepartmentToDelete(department)
        setDeleteDepartmentDialogOpen(true)
    }

    // Удаление отдела
    const handleDeleteDepartment = () => {
        if (!departmentToDelete) return

        // Удаляем отдел
        setDepartments(prev => prev.filter(dept => dept.id !== departmentToDelete.id))
        // Удаляем все задачи этого отдела
        setTasks(prev => prev.filter(task => task.departmentId !== departmentToDelete.id))

        setDeleteDepartmentDialogOpen(false)
        setDepartmentToDelete(null)
    }

    // Вспомогательная функция для получения цвета отдела
    const getDepartmentColor = (color: string) => {
        const colorMap: Record<string, string> = {
            blue: 'border-l-blue-500 bg-blue-50',
            green: 'border-l-green-500 bg-green-50',
            purple: 'border-l-purple-500 bg-purple-50',
            orange: 'border-l-orange-500 bg-orange-50',
            red: 'border-l-red-500 bg-red-50',
            pink: 'border-l-pink-500 bg-pink-50',
        }
        return colorMap[color] || 'border-l-gray-500 bg-gray-50'
    }

    // Получение статистики по отделу
    const getDepartmentStats = (departmentId: string) => {
        const deptTasks = tasks.filter(task => task.departmentId === departmentId)
        const totalHours = deptTasks.reduce((sum, task) => sum + (task.estimatedHours || 0), 0)

        return {
            total: deptTasks.length,
            totalHours: totalHours,
        }
    }

    // Получение общей статистики
    const getTotalStats = () => {
        const totalTasks = tasks.length
        const totalHours = tasks.reduce((sum, task) => sum + (task.estimatedHours || 0), 0)
        const departmentsWithTasks = departments.filter(dept =>
            tasks.some(task => task.departmentId === dept.id)
        ).length

        return {
            totalTasks,
            totalHours,
            activeDepartments: departmentsWithTasks
        }
    }

    const stats = getTotalStats()

    // Получение количества задач в удаляемом отделе
    const getTasksCountForDeletingDepartment = () => {
        if (!departmentToDelete) return 0
        return tasks.filter(task => task.departmentId === departmentToDelete.id).length
    }

    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Заголовок и панель управления */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Department Tasks</h1>
                    <p className="text-gray-600 mt-2">Simple task tracking for time management</p>
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

                    <div className="flex gap-2">
                        <Dialog open={newTaskDialogOpen} onOpenChange={setNewTaskDialogOpen}>
                            <DialogTrigger asChild>
                                <Button
                                    className="bg-blue-600 hover:bg-blue-700"
                                    onClick={() => setSelectedDepartment('')}
                                >
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
                                        <Label htmlFor="department">Department *</Label>
                                        <select
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            value={selectedDepartment}
                                            onChange={(e) => setSelectedDepartment(e.target.value)}
                                        >
                                            <option value="">Select department</option>
                                            {departments.map(dept => (
                                                <option key={dept.id} value={dept.id}>
                                                    {dept.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="taskText">Task Description *</Label>
                                        <Input
                                            id="taskText"
                                            placeholder="Enter task description..."
                                            value={newTask.text}
                                            onChange={(e) => setNewTask({ ...newTask, text: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3">
                                    <Button
                                        variant="outline"
                                        onClick={() => setNewTaskDialogOpen(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleAddTask}
                                        disabled={!newTask.text?.trim() || !selectedDepartment}
                                        variant='default'
                                    >
                                        Add Task
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>

                        <Dialog open={newDepartmentDialogOpen} onOpenChange={setNewDepartmentDialogOpen}>
                            {/* <DialogTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="border-gray-300 hover:bg-gray-50"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Department
                                </Button>
                            </DialogTrigger> */}
                            <DialogContent className="sm:max-w-[400px]">
                                <DialogHeader>
                                    <DialogTitle>Add New Department</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="deptName">Department Name *</Label>
                                        <Input
                                            id="deptName"
                                            placeholder="Enter department name..."
                                            value={newDepartment.name}
                                            onChange={(e) => setNewDepartment({ ...newDepartment, name: e.target.value })}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="color">Color Theme</Label>
                                        <div className="flex gap-2 flex-wrap">
                                            {['blue', 'green', 'purple', 'orange', 'red', 'pink'].map((color) => (
                                                <button
                                                    key={color}
                                                    type="button"
                                                    onClick={() => setNewDepartment({ ...newDepartment, color })}
                                                    className={`w-8 h-8 rounded-full border-2 ${newDepartment.color === color
                                                        ? 'border-gray-800'
                                                        : 'border-transparent'
                                                        } ${{
                                                            blue: 'bg-blue-500',
                                                            green: 'bg-green-500',
                                                            purple: 'bg-purple-500',
                                                            orange: 'bg-orange-500',
                                                            red: 'bg-red-500',
                                                            pink: 'bg-pink-500',
                                                        }[color]}`}
                                                    title={color.charAt(0).toUpperCase() + color.slice(1)}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3">
                                    <Button
                                        variant="outline"
                                        onClick={() => setNewDepartmentDialogOpen(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleAddDepartment}
                                        disabled={!newDepartment.name?.trim()}
                                        className="bg-green-600 hover:bg-green-700"
                                    >
                                        Add Department
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            </div>

            {/* Диалоговое окно подтверждения удаления отдела */}
            <Dialog open={deleteDepartmentDialogOpen} onOpenChange={setDeleteDepartmentDialogOpen}>
                <DialogContent className="sm:max-w-[450px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <AlertTriangle className="w-5 h-5" />
                            Delete Department
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
                            <div className={`w-3 h-8 bg-${departmentToDelete?.color}-500 rounded`}></div>
                            <div>
                                <h3 className="font-semibold text-gray-900">{departmentToDelete?.name}</h3>
                            </div>
                        </div>

                        <div className="text-sm text-gray-600 space-y-2">
                            <p className="font-medium">Are you sure you want to delete this department?</p>
                            <p>This action will permanently delete:</p>
                            <ul className="list-disc pl-5 space-y-1">
                                <li>The department "{departmentToDelete?.name}"</li>
                                <li>{getTasksCountForDeletingDepartment()} associated task(s)</li>
                            </ul>
                            <p className="mt-2 font-medium text-red-600">This action cannot be undone.</p>
                        </div>
                    </div>
                    <DialogFooter className="gap-2">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setDeleteDepartmentDialogOpen(false)
                                setDepartmentToDelete(null)
                            }}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleDeleteDepartment}
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                        >
                            Delete Department
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Диалоговое окно подтверждения удаления задачи */}
            <Dialog open={deleteTaskDialogOpen} onOpenChange={setDeleteTaskDialogOpen}>
                <DialogContent className="sm:max-w-[450px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <AlertTriangle className="w-5 h-5" />
                            Delete Task
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="p-3 bg-red-50 rounded-lg">
                            <p className="font-medium text-gray-900">{taskToDelete?.text}</p>
                            {taskToDelete && (
                                <p className="text-sm text-gray-600 mt-1">
                                    Department: {departments.find(d => d.id === taskToDelete.departmentId)?.name}
                                </p>
                            )}
                        </div>

                        <div className="text-sm text-gray-600">
                            <p className="font-medium">Are you sure you want to delete this task?</p>
                            <p className="mt-1 text-red-600">This action cannot be undone.</p>
                        </div>
                    </div>
                    <DialogFooter className="gap-2">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setDeleteTaskDialogOpen(false)
                                setTaskToDelete(null)
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

            {/* Диалоговое окно редактирования задачи */}
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
                                value={editTaskData.text || ''}
                                onChange={(e) => setEditTaskData({ ...editTaskData, text: e.target.value })}
                            />
                        </div>

                        {editingTask && (
                            <div className="text-sm text-gray-500">
                                <p>Department: <span className="font-medium">{departments.find(d => d.id === editingTask.departmentId)?.name}</span></p>
                            </div>
                        )}
                    </div>
                    <div className="flex justify-end gap-3">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setEditTaskDialogOpen(false)
                                setEditingTask(null)
                                setEditTaskData({})
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSaveEditTask}
                            disabled={!editTaskData.text?.trim()}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            Save Changes
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Таблицы по отделам */}
            <div className="space-y-8">
                {departments.map((department) => {
                    const deptTasks = getTasksByDepartment(department.id)
                    const deptStats = getDepartmentStats(department.id)

                    return (
                        <div key={department.id} className={`rounded-lg border ${getDepartmentColor(department.color)}`}>
                            {/* Заголовок таблицы с названием отдела */}
                            <div className="p-4 border-b bg-white/50">
                                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-3 h-8 bg-${department.color}-500 rounded`}></div>
                                        <div>
                                            <h2 className="text-lg font-bold text-gray-900">{department.name}</h2>
                                            <div className="flex items-center gap-4 mt-1">
                                                <span className="text-sm text-gray-600">
                                                    {deptTasks.length} tasks
                                                </span>
                                                {deptStats.totalHours > 0 && (
                                                    <span className="text-sm text-gray-600">
                                                        {deptStats.totalHours}h estimated
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Button
                                            size="sm"
                                            variant="default"
                                            onClick={() => {
                                                setSelectedDepartment(department.id)
                                                setNewTaskDialogOpen(true)
                                            }}
                                            className="text-sm"
                                        >
                                            <Plus className="w-3 h-3 mr-1" />
                                            Add Task
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleStartDeleteDepartment(department)}
                                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Таблица задач */}
                            {deptTasks.length > 0 ? (
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
                                            {deptTasks.map((task, index) => (
                                                <TableRow key={task.id} className="hover:bg-gray-50/50">
                                                    <TableCell>
                                                        <div className="flex items-center justify-center w-8 h-8 bg-gray-100 text-gray-700 rounded-full text-sm font-semibold">
                                                            {index + 1}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="font-medium text-gray-900">{task.text}</div>
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
                                    <p className="text-lg">No tasks in this department</p>
                                    <p className="text-sm mt-2">Add tasks using the "Add Task" button</p>
                                </div>
                            )}

                            {/* Статистика внизу таблицы */}
                            <div className="p-3 border-t bg-white/30">
                                <div className="flex items-center justify-between text-sm text-gray-600">
                                    <span>
                                        {deptTasks.length} task{deptTasks.length !== 1 ? 's' : ''}
                                        {deptStats.totalHours > 0 && ` • ${deptStats.totalHours} estimated hours`}
                                    </span>
                                    {searchQuery && (
                                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                            Search: "{searchQuery}"
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Пустой отдел (если нет задач) */}
            {departments.length === 0 && (
                <Card className="text-center py-12">
                    <CardContent>
                        <div className="text-gray-400 mb-4">
                            <Plus className="w-16 h-16 mx-auto" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">No Departments Yet</h3>
                        <p className="text-gray-500 mb-6">Add your first department to get started</p>
                        <Button
                            onClick={() => setNewDepartmentDialogOpen(true)}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Add First Department
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

export default SimpleDepartmentsTables