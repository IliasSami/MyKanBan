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
import { useAccessibility } from '../context/AccessibilityContext';

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
  const { announce } = useAccessibility();

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
    if (task) {
      setActiveTask(task);
      announce(`Picked up task: ${task.title}`);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const currentTask = board.tasks.find((t) => t.id === activeId);
    if (!currentTask) return;

    const isOverColumn = board.columns.some((c) => c.id === overId);
    if (isOverColumn) {
      if (currentTask.columnId !== overId) {
        onMoveTask(activeId, overId, board.tasks.filter((t) => t.columnId === overId).length);
      }
      return;
    }

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

    if (board.columns.some((c) => c.id === overId)) {
      onMoveTask(activeId, overId, board.tasks.filter((t) => t.columnId === overId).length);
      const col = board.columns.find((c) => c.id === overId);
      if (col) announce(`Moved task ${currentTask.title} to ${col.title}`);
      return;
    }

    const overTask = board.tasks.find((t) => t.id === overId);
    if (overTask) {
      const colTasks = board.tasks.filter((t) => t.columnId === overTask.columnId);
      const newIndex = colTasks.findIndex((t) => t.id === overId);
      onMoveTask(activeId, overTask.columnId, newIndex >= 0 ? newIndex : 0);
      const col = board.columns.find((c) => c.id === overTask.columnId);
      if (col) announce(`Moved task ${currentTask.title} to ${col.title}`);
    }
  };

  const handleCreateColumn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColTitle.trim()) return;
    onAddColumn(newColTitle.trim());
    announce(`Created column: ${newColTitle.trim()}`);
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
      <div
        id="kanban-main"
        tabIndex={-1}
        className="flex-1 overflow-x-auto p-4 lg:p-6 bg-zinc-100/70 dark:bg-zinc-950 transition-colors focus:outline-none"
      >
        <div className="flex items-start gap-4 min-w-max pb-6">
          {board.columns.length === 0 ? (
            <div className="flex items-start gap-4" aria-label="Loading workspace columns">
              {['Backlog', 'Sprint To-Do', 'In Progress', 'Done'].map((placeholder) => (
                <div
                  key={placeholder}
                  className="w-72 min-w-[288px] bg-white/60 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-850 rounded-xl p-3 flex flex-col gap-3 animate-pulse"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-zinc-200/80 dark:border-zinc-800/60">
                    <span className="text-xs font-mono text-zinc-500 uppercase tracking-wider">{placeholder}</span>
                    <div className="h-4 w-6 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
                  </div>
                  <div className="h-20 bg-zinc-100 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800/50 rounded-lg" />
                  <div className="h-24 bg-zinc-100 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800/50 rounded-lg" />
                  <div className="h-16 bg-zinc-100 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800/50 rounded-lg" />
                </div>
              ))}
            </div>
          ) : (
            board.columns.map((column) => {
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
            })
          )}

          {/* Add New Column */}
          <div className="w-72 min-w-[288px]">
            {isAddingCol ? (
              <form
                onSubmit={handleCreateColumn}
                className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 shadow-lg"
              >
                <input
                  type="text"
                  autoFocus
                  value={newColTitle}
                  onChange={(e) => setNewColTitle(e.target.value)}
                  placeholder="Column name..."
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded px-2.5 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-600"
                />
                <div className="flex items-center justify-end gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingCol(false)}
                    className="px-2 py-1 text-xs text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white rounded transition focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none"
                  >
                    Add
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setIsAddingCol(true)}
                className="w-full flex items-center justify-center gap-1.5 p-3 rounded-xl border border-dashed border-zinc-300 hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-700 bg-white/40 hover:bg-white dark:bg-zinc-950/40 dark:hover:bg-zinc-900/40 text-zinc-600 hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-zinc-300 transition text-xs font-medium focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Column</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeTask ? (
          <div className="rotate-1 shadow-2xl opacity-95">
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

