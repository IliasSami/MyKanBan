import React, { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus, MoreHorizontal, Trash2, Edit2, Check, AlertCircle } from 'lucide-react';
import type { Column, Task, Priority } from '../types/kanban';
import { KanbanCard } from './KanbanCard';

interface KanbanColumnProps {
  column: Column;
  tasks: Task[];
  onOpenTaskDetail: (task: Task) => void;
  onAddTask: (taskData: {
    columnId: string;
    title: string;
    priority: Priority;
    storyPoints?: number;
    tags: string[];
  }) => void;
  onUpdateColumn: (columnId: string, patch: Partial<Column>) => void;
  onDeleteColumn: (columnId: string) => void;
  onDeleteTask: (taskId: string) => void;
  density?: 'comfortable' | 'compact';
  onMoveTaskToNextStage?: (taskId: string) => void;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  column,
  tasks,
  onOpenTaskDetail,
  onAddTask,
  onUpdateColumn,
  onDeleteColumn,
  onDeleteTask,
  density = 'comfortable',
  onMoveTaskToNextStage,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: {
      type: 'Column',
      column,
    },
  });

  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState<Priority>('medium');
  const [newPoints, setNewPoints] = useState<string>('3');

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [columnTitle, setColumnTitle] = useState(column.title);
  const [showColMenu, setShowColMenu] = useState(false);

  const columnPoints = tasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
  const isWipExceeded = column.wipLimit !== undefined && tasks.length > column.wipLimit;
  const wipPercentage = column.wipLimit ? Math.min(100, Math.round((tasks.length / column.wipLimit) * 100)) : 0;

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    onAddTask({
      columnId: column.id,
      title: newTitle.trim(),
      priority: newPriority,
      storyPoints: newPoints ? parseInt(newPoints, 10) : undefined,
      tags: [],
    });

    setNewTitle('');
    setIsAdding(false);
  };

  const handleSaveTitle = () => {
    if (columnTitle.trim() && columnTitle !== column.title) {
      onUpdateColumn(column.id, { title: columnTitle.trim() });
    }
    setIsEditingTitle(false);
  };

  return (
    <div
      ref={setNodeRef}
      className={`column-3d snap-center flex flex-col w-[85vw] sm:w-72 min-w-[288px] max-w-[320px] sm:max-w-[288px] bg-white/95 dark:bg-zinc-950/90 backdrop-blur-xs border rounded-2xl p-3.5 transition-all duration-200 max-h-[calc(100vh-170px)] ${
        isOver
          ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/30 dark:bg-blue-950/20'
          : isWipExceeded
          ? 'border-red-300 dark:border-red-900/50'
          : 'border-zinc-200/90 dark:border-zinc-800/90'
      }`}
    >
      {/* Column Header */}
      <div className="pb-2.5 mb-1.5 border-b border-zinc-200/80 dark:border-zinc-800/80">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {isEditingTitle ? (
              <div className="flex items-center gap-1 flex-1">
                <input
                  type="text"
                  autoFocus
                  value={columnTitle}
                  onChange={(e) => setColumnTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
                  onBlur={handleSaveTitle}
                  className="bg-white dark:bg-zinc-900 border border-blue-500 rounded px-2 py-0.5 text-xs font-medium text-zinc-900 dark:text-zinc-100 w-full outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                />
                <button
                  onClick={handleSaveTitle}
                  aria-label="Save column title"
                  className="text-blue-600 dark:text-blue-400 p-0.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-900"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <h2
                onClick={() => setIsEditingTitle(true)}
                title="Click to rename"
                className="text-xs font-bold text-zinc-900 dark:text-zinc-100 tracking-tight truncate cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition"
              >
                {column.title}
              </h2>
            )}

            {/* Counts & Points */}
            <div className="flex items-center gap-1 font-mono text-[11px] shrink-0">
              <span
                className={`px-2 py-0.5 rounded-full font-semibold transition ${
                  isWipExceeded
                    ? 'bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-800'
                    : 'bg-zinc-100 dark:bg-zinc-850 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700/60'
                }`}
              >
                {tasks.length}
                {column.wipLimit ? `/${column.wipLimit}` : ''}
              </span>

              {columnPoints > 0 && (
                <span className="text-zinc-400 dark:text-zinc-500 text-[10px]">
                  {columnPoints}sp
                </span>
              )}
            </div>
          </div>

          {/* Column Menu */}
          <div className="relative">
            <button
              onClick={() => setShowColMenu(!showColMenu)}
              aria-label={`Options for ${column.title}`}
              aria-expanded={showColMenu}
              className="text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-300 p-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none"
            >
              <MoreHorizontal className="w-3.5 h-3.5" />
            </button>

            {showColMenu && (
              <div
                className="absolute right-0 mt-1 w-40 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl py-1 z-50 text-xs"
                onMouseLeave={() => setShowColMenu(false)}
              >
                <button
                  onClick={() => {
                    setIsEditingTitle(true);
                    setShowColMenu(false);
                  }}
                  className="w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200"
                >
                  <Edit2 className="w-3.5 h-3.5 text-zinc-400" />
                  Rename
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Delete column "${column.title}" and its tasks?`)) {
                      onDeleteColumn(column.id);
                    }
                    setShowColMenu(false);
                  }}
                  className="w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-red-600 dark:text-red-400"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-500" />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>

        {/* WIP Capacity Gauge Bar */}
        {column.wipLimit !== undefined && (
          <div className="mt-2">
            <div className="w-full bg-zinc-100 dark:bg-zinc-850 h-1 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  isWipExceeded
                    ? 'bg-red-500 animate-pulse'
                    : wipPercentage > 75
                    ? 'bg-amber-500'
                    : 'bg-blue-500'
                }`}
                style={{ width: `${wipPercentage}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* WIP Limit warning Banner */}
      {isWipExceeded && (
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 px-2 py-1 rounded-lg mb-2">
          <AlertCircle className="w-3 h-3 shrink-0 text-red-500" />
          <span>WIP limit exceeded ({tasks.length}/{column.wipLimit})</span>
        </div>
      )}

      {/* Task Cards List */}
      <div className="flex-1 overflow-y-auto pr-1 -mr-1 space-y-1.5 min-h-[120px]">
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <KanbanCard
              key={task.id}
              task={task}
              onOpenDetail={onOpenTaskDetail}
              onDelete={onDeleteTask}
              density={density}
              onMoveToNextStage={
                onMoveTaskToNextStage ? () => onMoveTaskToNextStage(task.id) : undefined
              }
            />
          ))}
        </SortableContext>

        {tasks.length === 0 && !isAdding && (
          <div className="h-28 border border-dashed border-zinc-200 dark:border-zinc-850 rounded-xl flex flex-col items-center justify-center p-3 text-center transition">
            <p className="text-zinc-400 dark:text-zinc-500 text-xs font-medium">Empty Stage</p>
            <p className="text-zinc-400/80 dark:text-zinc-600 text-[10px] mt-0.5">Drop stories or tap + to start</p>
          </div>
        )}
      </div>

      {/* Column Footer: Quick Add */}
      <div className="pt-2 mt-2 border-t border-zinc-200/80 dark:border-zinc-800/80">
        {isAdding ? (
          <form onSubmit={handleCreateTask} className="bg-zinc-50 dark:bg-zinc-900/90 rounded-xl p-2.5 border border-zinc-200 dark:border-zinc-700 shadow-sm">
            <textarea
              autoFocus
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Task title..."
              rows={2}
              className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg p-2 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-blue-500 resize-none focus-visible:ring-2 focus-visible:ring-blue-600"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleCreateTask(e);
                }
              }}
            />
            <div className="flex items-center justify-between gap-2 mt-2">
              <div className="flex items-center gap-1 font-mono text-[11px]">
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value as Priority)}
                  className="bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-md px-1.5 py-1 text-zinc-700 dark:text-zinc-300 text-[11px] focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none"
                >
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="medium">Med</option>
                  <option value="low">Low</option>
                </select>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={newPoints}
                  onChange={(e) => setNewPoints(e.target.value)}
                  placeholder="sp"
                  className="w-12 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-md px-1 py-1 text-zinc-700 dark:text-zinc-300 text-[11px] focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-2 py-1 text-xs text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-3d px-3 py-1 text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none"
                >
                  Add
                </button>
              </div>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Task</span>
          </button>
        )}
      </div>
    </div>
  );
};

