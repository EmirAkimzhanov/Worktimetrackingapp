// src/components/positions/Positions.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from '../../ui/dialog';
import { PlusCircle, Pencil, Trash2, X } from 'lucide-react';

interface Position {
    id: number;
    name: string;
    grades: string[];
}

interface PositionsProps {
    positions?: Position[];
    onPositionCreated?: (position: Position) => void;
    onPositionUpdated?: (position: Position) => void;
    onPositionDeleted?: (positionId: number) => void;
    onGradeCreated?: (positionId: number, grade: string) => void;
    onGradeUpdated?: (positionId: number, gradeIndex: number, grade: string) => void;
    onGradeDeleted?: (positionId: number, gradeIndex: number) => void;
}

// Моковые данные по умолчанию
const defaultPositions: Position[] = [
    { id: 1, name: 'Notes', grades: ['Notes'] },
    { id: 2, name: 'Junior', grades: ['Assistant 1', 'Assistant 2'] },
    { id: 3, name: 'Senior', grades: ['Assistant 3', 'Senior 1', 'Senior 2'] },
    { id: 4, name: 'Manager', grades: ['Manager 1', 'Manager 2'] },
    { id: 5, name: 'Senior Manager', grades: ['Senior Manager 1', 'Senior Manager 2'] },
    { id: 6, name: 'Partner', grades: ['Partner'] },
    { id: 7, name: 'Director', grades: ['Director'] }
];

export function Positions({
    positions = defaultPositions, // Используем моковые данные по умолчанию
    onPositionCreated,
    onPositionUpdated,
    onPositionDeleted,
    onGradeCreated,
    onGradeUpdated,
    onGradeDeleted
}: PositionsProps) {
    // Локальное состояние для управления позициями
    const [localPositions, setLocalPositions] = useState<Position[]>(positions);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingPosition, setEditingPosition] = useState<Position | null>(null);
    const [positionName, setPositionName] = useState('');
    const [grades, setGrades] = useState<string[]>(['']);

    // Синхронизируем локальное состояние с переданными позициями
    useEffect(() => {
        setLocalPositions(positions);
    }, [positions]);

    const handleOpenDialog = (position?: Position) => {
        if (position) {
            setEditingPosition(position);
            setPositionName(position.name);
            setGrades([...position.grades, '']); // Добавляем пустое поле для нового грейда
        } else {
            setEditingPosition(null);
            setPositionName('');
            setGrades(['']);
        }
        setIsDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setIsDialogOpen(false);
        setTimeout(() => {
            setEditingPosition(null);
            setPositionName('');
            setGrades(['']);
        }, 300);
    };

    const handleSavePosition = () => {
        if (!positionName.trim()) return;

        const cleanedGrades = grades.filter(grade => grade.trim() !== '');

        if (editingPosition) {
            const updatedPosition = {
                ...editingPosition,
                name: positionName,
                grades: cleanedGrades
            };

            // Обновляем локальное состояние
            setLocalPositions(prev =>
                prev.map(p => p.id === editingPosition.id ? updatedPosition : p)
            );

            // Вызываем колбэк если передан
            onPositionUpdated?.(updatedPosition);
        } else {
            const newPosition = {
                id: Date.now(), // Генерируем уникальный ID
                name: positionName,
                grades: cleanedGrades
            };

            // Добавляем новую позицию в локальное состояние
            setLocalPositions(prev => [...prev, newPosition]);

            // Вызываем колбэк если передан
            onPositionCreated?.(newPosition);
        }

        handleCloseDialog();
    };

    const handleDeletePosition = (positionId: number) => {
        if (window.confirm('Are you sure you want to delete this position?')) {
            // Удаляем из локального состояния
            setLocalPositions(prev => prev.filter(p => p.id !== positionId));

            // Вызываем колбэк если передан
            onPositionDeleted?.(positionId);
        }
    };

    const addGradeField = () => {
        setGrades([...grades, '']);
    };

    const updateGrade = (index: number, value: string) => {
        const newGrades = [...grades];
        newGrades[index] = value;
        setGrades(newGrades);
    };

    const removeGrade = (index: number) => {
        if (grades.length > 1) {
            const newGrades = grades.filter((_, i) => i !== index);
            setGrades(newGrades);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold">Position Management</h3>
                    <p className="text-sm text-muted-foreground">
                        Manage job positions and their grade levels
                    </p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={() => handleOpenDialog()}>
                            <PlusCircle className="w-4 h-4 mr-2" />
                            Add Position
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>
                                {editingPosition ? 'Edit Position' : 'Add New Position'}
                            </DialogTitle>
                            <DialogDescription>
                                Define a position and its associated grade levels.
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

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label>Grade Levels</Label>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={addGradeField}
                                    >
                                        <PlusCircle className="w-4 h-4 mr-1" />
                                        Add Grade
                                    </Button>
                                </div>

                                <div className="space-y-2 max-h-60 overflow-y-auto p-2 border rounded-md">
                                    {grades.map((grade, index) => (
                                        <div key={index} className="flex items-center gap-2">
                                            <Input
                                                value={grade}
                                                onChange={(e) => updateGrade(index, e.target.value)}
                                                placeholder={`Grade ${index + 1}`}
                                                className="flex-1"
                                            />
                                            {grades.length > 1 && (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => removeGrade(index)}
                                                >
                                                    <X className="w-4 h-4" />
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={handleCloseDialog}>
                                Cancel
                            </Button>
                            <Button onClick={handleSavePosition}>
                                {editingPosition ? 'Save Changes' : 'Create Position'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
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

                                                <h4 className="font-semibold text-lg">{position.name}</h4>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleOpenDialog(position)}
                                                    title="Edit position"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDeletePosition(position.id)}
                                                    title="Delete position"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            {position.grades.length === 0 ? (
                                                <div className="text-sm text-muted-foreground italic">
                                                    No grades defined for this position.
                                                </div>
                                            ) : (
                                                <>
                                                    <p className="text-sm font-medium text-muted-foreground">
                                                        Grade levels ({position.grades.length}):
                                                    </p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {position.grades.map((grade, index) => (
                                                            <div
                                                                key={`${position.id}-${index}`}
                                                                className="px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-sm font-medium border border-primary/20"
                                                            >
                                                                {grade}
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