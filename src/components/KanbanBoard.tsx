import React, { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type {
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import type { Board, Column, Task, Priority } from '../types/kanban';
import { KanbanColumn } from './KanbanColumn';
import { KanbanCard } from './KanbanCard';

interface KanbanBoardProps {
  board: Board;
  onMoveTask: (taskId: string, targetColumnId: string, newOrder: number) => void;
  onAddTask: (taskData: {
    columnId: string;
    title: string;
    description?: string;
    priority: Priority;
    storyPoints?: number;
    assignee?: string;
    tags: string[];
  }) => void;
  onUpdateColumn: (columnId: string, patch: Partial<Column>) => void;
  onDeleteColumn: (columnId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onAddColumn: (title: string) => void;
  onOpenTaskDetail: (task: Task) => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  board,
  onMoveTask,
  onAddTask,
  onUpdateColumn,
  onDeleteColumn,
  onDeleteTask,
  onAddColumn,
  onOpenTaskDetail,
}) => {
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [isAddingCol, setIsAddingCol] = useState(false);
  const [newColTitle, setNewColTitle] = useState('');

  // Sensors with distance constraint to avoid hijacking card clicks
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = board.tasks.find((t) => t.id === active.id);
    if (task) setActiveTask(task);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const currentTask = board.tasks.find((t) => t.id === activeId);
    if (!currentTask) return;

    // Check if dragging over a column directly
    const isOverColumn = board.columns.some((c) => c.id === overId);
    if (isOverColumn) {
      if (currentTask.columnId !== overId) {
        onMoveTask(activeId, overId, board.tasks.filter((t) => t.columnId === overId).length);
      }
      return;
    }

    // Check if dragging over another task
    const overTask = board.tasks.find((t) => t.id === overId);
    if (overTask && currentTask.columnId !== overTask.columnId) {
      const overIndex = board.tasks
        .filter((t) => t.columnId === overTask.columnId)
        .findIndex((t) => t.id === overId);
      onMoveTask(activeId, overTask.columnId, overIndex >= 0 ? overIndex : 0);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const currentTask = board.tasks.find((t) => t.id === activeId);
    if (!currentTask) return;

    // Dropped over a column directly
    if (board.columns.some((c) => c.id === overId)) {
      onMoveTask(activeId, overId, board.tasks.filter((t) => t.columnId === overId).length);
      return;
    }

    // Dropped over another task
    const overTask = board.tasks.find((t) => t.id === overId);
    if (overTask) {
      const colTasks = board.tasks.filter((t) => t.columnId === overTask.columnId);
      const newIndex = colTasks.findIndex((t) => t.id === overId);
      onMoveTask(activeId, overTask.columnId, newIndex >= 0 ? newIndex : 0);
    }
  };

  const handleCreateColumn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColTitle.trim()) return;
    onAddColumn(newColTitle.trim());
    setNewColTitle('');
    setIsAddingCol(false);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex-1 overflow-x-auto p-4 lg:p-6">
        <div className="flex items-start gap-5 min-w-max pb-6">
          {board.columns.map((column) => {
            const columnTasks = board.tasks
              .filter((t) => t.columnId === column.id)
              .sort((a, b) => a.order - b.order);

            return (
              <KanbanColumn
                key={column.id}
                column={column}
                tasks={columnTasks}
                onOpenTaskDetail={onOpenTaskDetail}
                onAddTask={onAddTask}
                onUpdateColumn={onUpdateColumn}
                onDeleteColumn={onDeleteColumn}
                onDeleteTask={onDeleteTask}
              />
            );
          })}

          {/* Add New Column Button / Inline Form */}
          <div className="w-80 min-w-[320px]">
            {isAddingCol ? (
              <form
                onSubmit={handleCreateColumn}
                className="bg-slate-900/80 border border-indigo-500/50 rounded-2xl p-3.5 shadow-xl"
              >
                <input
                  type="text"
                  autoFocus
                  value={newColTitle}
                  onChange={(e) => setNewColTitle(e.target.value)}
                  placeholder="Column name (e.g., Testing, Blocked)..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <div className="flex items-center justify-end gap-2 mt-2.5">
                  <button
                    type="button"
                    onClick={() => setIsAddingCol(false)}
                    className="px-2.5 py-1 text-xs text-slate-400 hover:text-white rounded"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shadow"
                  >
                    Add Column
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setIsAddingCol(true)}
                className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl border-2 border-dashed border-slate-800 hover:border-slate-700 bg-slate-900/30 hover:bg-slate-900/60 text-slate-400 hover:text-slate-200 transition text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                <span>Add Column</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Drag Overlay for smooth card preview under pointer */}
      <DragOverlay>
        {activeTask ? (
          <div className="rotate-2 scale-105 shadow-2xl opacity-90">
            <KanbanCard
              task={activeTask}
              onOpenDetail={() => {}}
              onDelete={() => {}}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};
