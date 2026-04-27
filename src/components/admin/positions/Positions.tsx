// src/components/positions/Positions.tsx
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../ui/alert-dialog";
import {
  PlusCircle,
  Trash2,
  X,
  AlertTriangle,
  Plus,
  Pencil,
} from "lucide-react";
import {
  useCreatePosition,
  useDeletePosition,
  useEditPosition,
  useGetPositions,
} from "../../../hooks/usePosition";
import { useUserStore } from "../../../store/UsersStore";
import {
  useCreateGrade,
  useDeleteGrade,
  useEditGrade,
} from "../../../hooks/useGrade";
import { toast } from "sonner";

// Обновленные интерфейсы в соответствии со структурой данных
interface Grade {
  id: number;
  name: string;
  short_name: string;
  position: number;
}

interface Position {
  id: number;
  name: string;
  grades: Grade[];
}

interface PositionsProps {
  onPositionCreated?: (position: Position) => void;
  onPositionDeleted?: (positionId: number) => void;
  onGradeCreated?: (positionId: number, grade: Grade) => void;
  onGradeDeleted?: (positionId: number, gradeId: number) => void;
}

export function Positions({
  onPositionCreated,
  onPositionDeleted,
  onGradeCreated,
  onGradeDeleted,
}: PositionsProps) {
  // Локальное состояние для управления позициями
  const [localPositions, setLocalPositions] = useState<Position[]>([]);

  // Состояние для диалога создания/редактирования позиции
  const [isPositionDialogOpen, setIsPositionDialogOpen] = useState(false);
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);
  const [positionName, setPositionName] = useState("");

  // Состояние для диалога создания/редактирования грейда
  const [isGradeDialogOpen, setIsGradeDialogOpen] = useState(false);
  const [editingGrade, setEditingGrade] = useState<Grade | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(
    null,
  );
  const [gradeName, setGradeName] = useState("");
  const [gradeShortName, setGradeShortName] = useState("");

  const { mutate: createGrade } = useCreateGrade();
  const { mutate: createPosition } = useCreatePosition();
  const { mutate: editPosition } = useEditPosition();
  const { mutate: deletePosition } = useDeletePosition();
  const { mutate: editGrade } = useEditGrade();
  const { mutate: deleteGrade } = useDeleteGrade();
  const { mutate: getPositions, isPending: isPositionsLoading } =
    useGetPositions();
  const store_positions = useUserStore((state) => state.positions);

  // Состояние для диалога подтверждения удаления позиции
  const [isDeletePositionDialogOpen, setIsDeletePositionDialogOpen] =
    useState(false);
  const [positionToDelete, setPositionToDelete] = useState<{
    positionId: number;
    positionName: string;
    gradesCount: number;
  } | null>(null);

  // Состояние для диалога подтверждения удаления грейда
  const [isDeleteGradeDialogOpen, setIsDeleteGradeDialogOpen] = useState(false);
  const [gradeToDelete, setGradeToDelete] = useState<{
    positionId: number;
    gradeId: number;
    gradeName: string;
    positionName: string;
  } | null>(null);

  // Загружаем позиции при монтировании компонента (без принудительного обновления)
  useEffect(() => {
    getPositions(false); // false - использовать кэш если есть
  }, [getPositions]);

  // Обновляем локальное состояние при изменении store_positions
  useEffect(() => {
    if (store_positions && store_positions.length > 0) {
      setLocalPositions(store_positions as Position[]);
    } else {
      setLocalPositions([]);
    }
  }, [store_positions]);

  // Функция для принудительного обновления позиций (сбрасывает кэш)
  const refreshPositions = () => {
    getPositions(true); // true - принудительное обновление, игнорируем кэш
  };

  // Обработчики для создания/редактирования позиции
  const handleOpenPositionDialog = (position?: Position) => {
    if (position) {
      setEditingPosition(position);
      setPositionName(position.name);
    } else {
      setEditingPosition(null);
      setPositionName("");
    }
    setIsPositionDialogOpen(true);
  };

  const handleClosePositionDialog = () => {
    setIsPositionDialogOpen(false);
    setEditingPosition(null);
    setPositionName("");
  };

  const handleSavePosition = () => {
    if (!positionName.trim()) return;

    if (editingPosition) {
      editPosition(
        {
          positionId: editingPosition.id.toString(),
          body: { name: positionName.trim() },
        },
        {
          onSuccess: () => {
            toast.success(`Position "${positionName}" updated successfully`);
            refreshPositions(); // Принудительно обновляем после изменения
            handleClosePositionDialog();
          },
          onError: (error) => {
            console.error("Error updating position:", error);
            toast.error("Failed to update position");
          },
        },
      );
    } else {
      createPosition(
        { name: positionName.trim() },
        {
          onSuccess: (data) => {
            toast.success(`Position "${positionName}" created successfully`);
            refreshPositions(); // Принудительно обновляем после создания
            handleClosePositionDialog();
            onPositionCreated?.(data);
          },
          onError: (error) => {
            console.error("Error creating position:", error);
            toast.error("Failed to create position");
          },
        },
      );
    }
  };

  // Обработчики для создания/редактирования грейда
  const handleOpenGradeDialog = (position: Position, grade?: Grade) => {
    setSelectedPosition(position);
    if (grade) {
      setEditingGrade(grade);
      setGradeName(grade.name);
      setGradeShortName(grade.short_name || "");
    } else {
      setEditingGrade(null);
      setGradeName("");
      setGradeShortName("");
    }
    setIsGradeDialogOpen(true);
  };

  const handleCloseGradeDialog = () => {
    setIsGradeDialogOpen(false);
    setSelectedPosition(null);
    setEditingGrade(null);
    setGradeName("");
    setGradeShortName("");
  };

  const handleSaveGrade = () => {
    if (!selectedPosition || !gradeName.trim()) return;

    if (editingGrade) {
      // Редактирование грейда
      editGrade(
        {
          gradeId: editingGrade.id.toString(),
          body: {
            name: gradeName.trim(),
            short_name: gradeShortName.trim() || null,
            position: selectedPosition.id,
          },
        },
        {
          onSuccess: () => {
            toast.success(`Grade "${gradeName}" updated successfully`);
            refreshPositions(); // Принудительно обновляем после редактирования грейда
            handleCloseGradeDialog();
          },
          onError: (error) => {
            console.error("Error updating grade:", error);
            toast.error("Failed to update grade");
          },
        },
      );
    } else {
      // Создание нового грейда
      createGrade(
        {
          position: selectedPosition.id,
          name: gradeName.trim(),
          short_name: gradeShortName.trim() || null,
        },
        {
          onSuccess: (data) => {
            toast.success(`Grade "${gradeName}" added successfully`);
            refreshPositions(); // Принудительно обновляем после создания грейда
            handleCloseGradeDialog();
            onGradeCreated?.(selectedPosition.id, data);
          },
          onError: (error) => {
            console.error("Error creating grade:", error);
            toast.error("Failed to create grade");
          },
        },
      );
    }
  };

  // Обработчики для удаления позиции
  const handleDeletePositionClick = (position: Position) => {
    setPositionToDelete({
      positionId: position.id,
      positionName: position.name,
      gradesCount: position.grades.length,
    });
    setIsDeletePositionDialogOpen(true);
  };

  const handleConfirmDeletePosition = () => {
    if (!positionToDelete) return;

    deletePosition(
      { positionId: positionToDelete.positionId.toString() },
      {
        onSuccess: () => {
          toast.success(
            `Position "${positionToDelete.positionName}" deleted successfully`,
          );
          refreshPositions(); // Принудительно обновляем после удаления позиции
          setIsDeletePositionDialogOpen(false);
          setPositionToDelete(null);
          onPositionDeleted?.(positionToDelete.positionId);
        },
      },
    );
  };

  const handleCancelDeletePosition = () => {
    setIsDeletePositionDialogOpen(false);
    setPositionToDelete(null);
  };

  // Обработчики для удаления грейда
  const handleDeleteGradeClick = (
    positionId: number,
    gradeId: number,
    gradeName: string,
    positionName: string,
  ) => {
    setGradeToDelete({
      positionId,
      gradeId,
      gradeName,
      positionName,
    });
    setIsDeleteGradeDialogOpen(true);
  };

  const handleConfirmDeleteGrade = () => {
    if (!gradeToDelete) return;

    deleteGrade(
      { gradeId: gradeToDelete.gradeId.toString() },
      {
        onSuccess: () => {
          toast.success(
            `Grade "${gradeToDelete.gradeName}" deleted successfully`,
          );
          refreshPositions(); // Принудительно обновляем после удаления грейда
          setIsDeleteGradeDialogOpen(false);
          setGradeToDelete(null);
          onGradeDeleted?.(gradeToDelete.positionId, gradeToDelete.gradeId);
        },
        onError: (error) => {
          console.error("Error deleting grade:", error);
          toast.error("Failed to delete grade");
        },
      },
    );
  };

  const handleCancelDeleteGrade = () => {
    setIsDeleteGradeDialogOpen(false);
    setGradeToDelete(null);
  };

  // Показываем загрузку, если данные еще загружаются
  if (isPositionsLoading && !store_positions) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading positions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Диалог подтверждения удаления позиции */}
      <AlertDialog
        open={isDeletePositionDialogOpen}
        onOpenChange={setIsDeletePositionDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Delete Position
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              {positionToDelete && (
                <>
                  <p>
                    Are you sure you want to delete the position{" "}
                    <span className="font-semibold">
                      {positionToDelete.positionName}
                    </span>
                    ?
                  </p>
                  <div className="p-3 bg-red-50 rounded-lg border border-red-100">
                    <p className="font-medium text-gray-900">
                      This position has {positionToDelete.gradesCount} grade
                      {positionToDelete.gradesCount !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <p className="text-sm text-gray-600">
                    This action cannot be undone. All grades associated with
                    this position will be permanently deleted.
                  </p>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelDeletePosition}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeletePosition}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete Position
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Диалог подтверждения удаления грейда */}
      <AlertDialog
        open={isDeleteGradeDialogOpen}
        onOpenChange={setIsDeleteGradeDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Delete Grade
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              {gradeToDelete && (
                <>
                  <p>
                    Are you sure you want to delete this grade from{" "}
                    <span className="font-semibold">
                      {gradeToDelete.positionName}
                    </span>
                    ?
                  </p>
                  <div className="p-3 bg-red-50 rounded-lg border border-red-100">
                    <p className="font-medium text-gray-900">
                      Grade: {gradeToDelete.gradeName}
                    </p>
                  </div>
                  <p className="text-sm text-gray-600">
                    This action cannot be undone. This grade will be permanently
                    removed from the position.
                  </p>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelDeleteGrade}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeleteGrade}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete Grade
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Диалог создания/редактирования позиции */}
      <Dialog
        open={isPositionDialogOpen}
        onOpenChange={setIsPositionDialogOpen}
      >
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>
              {editingPosition ? "Edit Position" : "Add New Position"}
            </DialogTitle>
            <DialogDescription>
              {editingPosition
                ? "Update the job position name."
                : "Create a new job position. You can add grades to it later."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="position-name">Position Name</Label>
              <Input
                id="position-name"
                value={positionName}
                onChange={(e) => setPositionName(e.target.value)}
                placeholder="e.g., Senior Developer"
                autoFocus
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleClosePositionDialog}>
              Cancel
            </Button>
            <Button
              onClick={handleSavePosition}
              disabled={!positionName.trim()}
            >
              {editingPosition ? "Save Changes" : "Create Position"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Диалог создания/редактирования грейда */}
      <Dialog open={isGradeDialogOpen} onOpenChange={setIsGradeDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>
              {editingGrade ? "Edit Grade" : "Add New Grade"}
            </DialogTitle>
            <DialogDescription>
              {selectedPosition && (
                <>
                  {editingGrade
                    ? `Update grade for position "${selectedPosition.name}"`
                    : `Add a new grade level to position "${selectedPosition.name}"`}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="grade-name">Grade Name *</Label>
              <Input
                id="grade-name"
                value={gradeName}
                onChange={(e) => setGradeName(e.target.value)}
                placeholder="e.g., Junior 1"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="grade-short-name">Short Name</Label>
              <Input
                id="grade-short-name"
                value={gradeShortName}
                onChange={(e) => setGradeShortName(e.target.value)}
                placeholder="e.g., J1"
              />
              <p className="text-xs text-muted-foreground">
                Optional abbreviation or short name for the grade
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseGradeDialog}>
              Cancel
            </Button>
            <Button onClick={handleSaveGrade} disabled={!gradeName.trim()}>
              {editingGrade ? "Save Changes" : "Create Grade"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Position Management</h3>
          <p className="text-sm text-muted-foreground">
            Manage job positions and their grade levels
          </p>
        </div>
        <Button onClick={() => handleOpenPositionDialog()}>
          <PlusCircle className="w-4 h-4 mr-2" />
          Add Position
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Positions & Grades</CardTitle>
          <p className="text-sm text-muted-foreground">
            Total positions: {localPositions.length}
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {localPositions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No positions defined yet. Add your first position.
              </div>
            ) : (
              localPositions.map((position) => (
                <Card key={position.id} className="overflow-hidden">
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <h4 className="font-semibold text-lg">
                          {position.name}
                        </h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenGradeDialog(position)}
                          title="Add grade"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenPositionDialog(position)}
                          title="Edit position"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeletePositionClick(position)}
                          title="Delete position"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {position.grades.length === 0 ? (
                        <div className="text-sm text-muted-foreground italic">
                          No grades defined for this position. Click the +
                          button to add a grade.
                        </div>
                      ) : (
                        <>
                          <p className="text-sm font-medium text-muted-foreground">
                            Grade levels ({position.grades.length}):
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {position.grades.map((grade) => (
                              <div
                                key={grade.id}
                                className="flex flex-col items-start gap-1 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-sm font-medium border border-primary/20 group hover:bg-primary/20 transition-colors"
                              >
                                <div className="flex items-center gap-1">
                                  <span>{grade.name}</span>
                                  {grade.short_name && (
                                    <span className="text-xs text-muted-foreground">
                                      ({grade.short_name})
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() =>
                                      handleOpenGradeDialog(position, grade)
                                    }
                                    className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-blue-500"
                                    title="Edit grade"
                                  >
                                    <Pencil className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleDeleteGradeClick(
                                        position.id,
                                        grade.id,
                                        grade.name,
                                        position.name,
                                      )
                                    }
                                    className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-500"
                                    title="Delete grade"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}