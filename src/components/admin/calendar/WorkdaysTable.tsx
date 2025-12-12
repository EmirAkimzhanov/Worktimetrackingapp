// src/components/admin/WorkdaysTable.tsx
import React from 'react';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import { Edit, Trash2, Calendar } from 'lucide-react';
import { Workday } from '../../../types/types';
import { format } from 'date-fns';

interface WorkdaysTableProps {
  workdays: Workday[];
  onEdit: (workday: Workday) => void;
  onDelete: (id: number) => void;
}

export function WorkdaysTable({ workdays, onEdit, onDelete }: WorkdaysTableProps) {
  const getTypeColor = (type: Workday['type']) => {
    switch (type) {
      case 'workday':
        return 'bg-blue-100 text-blue-800';
      case 'weekend':
        return 'bg-yellow-100 text-yellow-800';
      case 'holiday':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeLabel = (type: Workday['type']) => {
    switch (type) {
      case 'workday':
        return 'Working Day';
      case 'weekend':
        return 'Weekend';
      case 'holiday':
        return 'Holiday';
      default:
        return type;
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Day</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Recurring</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {workdays.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>No workdays configured</p>
                <p className="text-sm mt-2">Add days to customize your calendar</p>
              </TableCell>
            </TableRow>
          ) : (
            workdays
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map((workday) => {
                const date = new Date(workday.date);
                const dayName = format(date, 'EEEE');

                return (
                  <TableRow key={workday.id}>
                    <TableCell className="font-medium">
                      {format(date, 'dd MMM yyyy')}
                    </TableCell>
                    <TableCell>{dayName}</TableCell>
                    <TableCell>
                      <Badge className={getTypeColor(workday.type)}>
                        {getTypeLabel(workday.type)}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {workday.description || '-'}
                    </TableCell>
                    <TableCell>
                      {workday.is_recurring ? (
                        <Badge variant="outline" className="border-green-200 text-green-700">
                          Yes
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-gray-200 text-gray-700">
                          No
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEdit(workday)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onDelete(workday.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
          )}
        </TableBody>
      </Table>
    </div>
  );
}