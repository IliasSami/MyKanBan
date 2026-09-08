import React, { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus, MoreHorizontal, Trash2, Edit2, Check } from 'lucide-react';
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
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  column,
  tasks,
  onOpenTaskDetail,
  onAddTask,
  onUpdateColumn,
  onDeleteColumn,
  onDeleteTask,
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
      className={`flex flex-col w-72 min-w-[288px] max-w-[288px] bg-white dark:bg-zinc-950 border rounded-xl p-3 transition-colors duration-150 max-h-[calc(100vh-125px)] ${
        isOver
          ? 'border-blue-500 bg-blue-50/40 dark:bg-zinc-900/60'
          : 'border-zinc-200 dark:border-zinc-800/90'
      }`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between gap-2 pb-2.5 mb-1 border-b border-zinc-200 dark:border-zinc-800/80">
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
              className="text-xs font-semibold text-zinc-900 dark:text-zinc-200 truncate cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition"
            >
              {column.title}
            </h2>
          )}

          {/* Counts */}
          <div className="flex items-center gap-1 font-mono text-[11px]">
            <span
              className={`px-1.5 py-0.2 rounded font-medium ${
                isWipExceeded
                  ? 'bg-red-50 dark:bg-zinc-800 text-red-600 dark:text-zinc-100 border border-red-300 dark:border-blue-500'
                  : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800'
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
            className="text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-300 p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-900 transition focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none"
          >
            <MoreHorizontal className="w-3.5 h-3.5" />
          </button>

          {showColMenu && (
            <div
              className="absolute right-0 mt-1 w-40 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl py-1 z-50 text-xs"
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
                className="w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
              >
                <Trash2 className="w-3.5 h-3.5 text-zinc-400" />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* WIP Limit warning */}
      {isWipExceeded && (
        <div className="text-[10px] font-mono text-zinc-700 dark:text-zinc-300 bg-red-50 dark:bg-zinc-900 border border-red-200 dark:border-zinc-700 px-2 py-0.5 rounded mb-2">
          WIP limit exceeded ({tasks.length}/{column.wipLimit})
        </div>
      )}

      {/* Task Cards List */}
      <div className="flex-1 overflow-y-auto pr-1 -mr-1 space-y-1.5 min-h-[100px]">
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <KanbanCard
              key={task.id}
              task={task}
              onOpenDetail={onOpenTaskDetail}
              onDelete={onDeleteTask}
            />
          ))}
        </SortableContext>

        {tasks.length === 0 && !isAdding && (
          <div className="h-20 border border-dashed border-zinc-300 dark:border-zinc-850 rounded-lg flex items-center justify-center text-zinc-400 dark:text-zinc-600 text-[11px]">
            Empty column
          </div>
        )}
      </div>

      {/* Column Footer: Quick Add */}
      <div className="pt-2 mt-2 border-t border-zinc-200 dark:border-zinc-800/80">
        {isAdding ? (
          <form onSubmit={handleCreateTask} className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-2 border border-zinc-200 dark:border-zinc-700">
            <textarea
              autoFocus
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Task title..."
              rows={2}
              className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded p-1.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-blue-500 resize-none focus-visible:ring-2 focus-visible:ring-blue-600"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleCreateTask(e);
                }
              }}
            />
            <div className="flex items-center justify-between gap-2 mt-1.5">
              <div className="flex items-center gap-1 font-mono text-[11px]">
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value as Priority)}
                  className="bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded px-1.5 py-0.5 text-zinc-700 dark:text-zinc-300 text-[11px] focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none"
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
                  className="w-10 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded px-1 py-0.5 text-zinc-700 dark:text-zinc-300 text-[11px] focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none"
                />
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-2 py-0.5 text-xs text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-2.5 py-0.5 text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white rounded transition focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none"
                >
                  Add
                </button>
              </div>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-normal text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Task</span>
          </button>
        )}
      </div>
    </div>
  );
};

