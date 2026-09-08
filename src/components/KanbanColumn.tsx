import React, { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus, MoreHorizontal, AlertCircle, Trash2, Edit2, Check } from 'lucide-react';
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
      className={`flex flex-col w-80 min-w-[320px] max-w-[320px] bg-slate-900/70 border rounded-2xl p-3.5 transition-colors duration-200 max-h-[calc(100vh-140px)] ${
        isOver
          ? 'border-indigo-500 bg-slate-800/80 shadow-indigo-500/10 shadow-xl'
          : 'border-slate-800/90'
      }`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between gap-2 pb-3 mb-1 border-b border-slate-800/80">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {isEditingTitle ? (
            <div className="flex items-center gap-1.5 flex-1">
              <input
                type="text"
                autoFocus
                value={columnTitle}
                onChange={(e) => setColumnTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
                onBlur={handleSaveTitle}
                className="bg-slate-800 border border-indigo-500 rounded px-2 py-0.5 text-sm font-semibold text-white w-full outline-none"
              />
              <button
                onClick={handleSaveTitle}
                className="text-emerald-400 hover:text-emerald-300 p-1 rounded hover:bg-slate-800"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <h2
              onClick={() => setIsEditingTitle(true)}
              title="Click to rename"
              className="text-sm font-bold text-slate-200 truncate cursor-pointer hover:text-indigo-400 transition"
            >
              {column.title}
            </h2>
          )}

          {/* Task count & story points badges */}
          <div className="flex items-center gap-1">
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-bold font-mono ${
                isWipExceeded
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                  : 'bg-slate-800 text-slate-400 border border-slate-700/50'
              }`}
            >
              {tasks.length}
              {column.wipLimit ? `/${column.wipLimit}` : ''}
            </span>

            {columnPoints > 0 && (
              <span
                title="Total Story Points"
                className="text-[11px] px-1.5 py-0.5 rounded-full font-mono bg-indigo-950/60 text-indigo-300 border border-indigo-800/40"
              >
                {columnPoints}sp
              </span>
            )}
          </div>
        </div>

        {/* Column Menu */}
        <div className="relative">
          <button
            onClick={() => setShowColMenu(!showColMenu)}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {showColMenu && (
            <div
              className="absolute right-0 mt-1 w-44 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl py-1 z-50 text-xs"
              onMouseLeave={() => setShowColMenu(false)}
            >
              <button
                onClick={() => {
                  setIsEditingTitle(true);
                  setShowColMenu(false);
                }}
                className="w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-slate-700 text-slate-200"
              >
                <Edit2 className="w-3.5 h-3.5 text-indigo-400" />
                Rename Column
              </button>
              <button
                onClick={() => {
                  if (confirm(`Delete column "${column.title}" and its tasks?`)) {
                    onDeleteColumn(column.id);
                  }
                  setShowColMenu(false);
                }}
                className="w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-rose-950/40 text-rose-400"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Column
              </button>
            </div>
          )}
        </div>
      </div>

      {/* WIP Limit warning */}
      {isWipExceeded && (
        <div className="flex items-center gap-1.5 text-[11px] text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-1 rounded-lg mb-2">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>WIP limit exceeded! ({tasks.length}/{column.wipLimit})</span>
        </div>
      )}

      {/* Tasks List */}
      <div className="flex-1 overflow-y-auto pr-1 -mr-1 space-y-2 min-h-[120px]">
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
          <div className="h-28 border border-dashed border-slate-800 rounded-xl flex flex-col items-center justify-center text-slate-500 text-xs text-center p-4">
            <span>Empty Column</span>
            <span className="text-[11px] text-slate-600 mt-1">Drop cards here</span>
          </div>
        )}
      </div>

      {/* Column Footer: Quick Add Task */}
      <div className="pt-2 mt-2 border-t border-slate-800/80">
        {isAdding ? (
          <form onSubmit={handleCreateTask} className="bg-slate-800/90 rounded-xl p-2.5 border border-indigo-500/40">
            <textarea
              autoFocus
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Task title or description..."
              rows={2}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleCreateTask(e);
                }
              }}
            />
            <div className="flex items-center justify-between gap-2 mt-2">
              <div className="flex items-center gap-1.5">
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value as Priority)}
                  className="bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-[11px] text-slate-300"
                >
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={newPoints}
                  onChange={(e) => setNewPoints(e.target.value)}
                  placeholder="pts"
                  className="w-12 bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-[11px] text-slate-300 font-mono"
                  title="Story Points"
                />
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-2 py-1 text-xs text-slate-400 hover:text-white rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-2.5 py-1 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shadow"
                >
                  Add
                </button>
              </div>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 transition border border-transparent hover:border-slate-700/50"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Task</span>
          </button>
        )}
      </div>
    </div>
  );
};
