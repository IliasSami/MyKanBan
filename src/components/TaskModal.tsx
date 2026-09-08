import React, { useState, useEffect } from 'react';
import {
  X,
  Trash2,
  CheckSquare,
  Plus,
  Tag,
  Clock,
  User,
  Flame,
} from 'lucide-react';
import type { Task, Column, Priority } from '../types/kanban';

interface TaskModalProps {
  task: Task | null;
  columns: Column[];
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (taskId: string, patch: Partial<Task>) => void;
  onDelete: (taskId: string) => void;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  task,
  columns,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [columnId, setColumnId] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [storyPoints, setStoryPoints] = useState<string>('');
  const [assignee, setAssignee] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [subtasks, setSubtasks] = useState<{ id: string; title: string; completed: boolean }[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      setColumnId(task.columnId || '');
      setPriority(task.priority || 'medium');
      setStoryPoints(task.storyPoints !== undefined ? task.storyPoints.toString() : '');
      setAssignee(task.assignee || '');
      setTags(task.tags || []);
      setSubtasks(task.subtasks || []);
    }
  }, [task]);

  if (!isOpen || !task) return null;

  const handleSave = () => {
    onUpdate(task.id, {
      title: title.trim() || 'Untitled Task',
      description: description.trim() || undefined,
      columnId,
      priority,
      storyPoints: storyPoints ? parseInt(storyPoints, 10) : undefined,
      assignee: assignee.trim() || undefined,
      tags,
      subtasks,
    });
    onClose();
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const cleanTag = tagInput.trim().replace(/^#/, '');
      if (!tags.includes(cleanTag)) {
        setTags([...tags, cleanTag]);
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;
    setSubtasks([
      ...subtasks,
      {
        id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        title: newSubtaskTitle.trim(),
        completed: false,
      },
    ]);
    setNewSubtaskTitle('');
  };

  const handleToggleSubtask = (id: string) => {
    setSubtasks(
      subtasks.map((s) => (s.id === id ? { ...s, completed: !s.completed } : s))
    );
  };

  const handleDeleteSubtask = (id: string) => {
    setSubtasks(subtasks.filter((s) => s.id !== id));
  };

  const completedSubtasksCount = subtasks.filter((s) => s.completed).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700/90 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-slate-500 bg-slate-800 px-2 py-0.5 rounded">
              TASK-{task.id.slice(-4).toUpperCase()}
            </span>
            <select
              value={columnId}
              onChange={(e) => setColumnId(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-xs font-semibold text-indigo-400 rounded-lg px-2.5 py-1 focus:outline-none focus:border-indigo-500"
            >
              {columns.map((col) => (
                <option key={col.id} value={col.id}>
                  {col.title}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (confirm(`Delete task "${task.title}"?`)) {
                  onDelete(task.id);
                  onClose();
                }
              }}
              title="Delete task"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
          {/* Title */}
          <div>
            <label className="block text-slate-400 font-medium mb-1">Task Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-white focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          {/* Grid: Priority, Story Points, Assignee */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Priority */}
            <div>
              <label className="block text-slate-400 font-medium mb-1 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span>Priority</span>
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="urgent">🔥 Urgent</option>
                <option value="high">⚡ High</option>
                <option value="medium">🔷 Medium</option>
                <option value="low">💤 Low</option>
              </select>
            </div>

            {/* Story Points */}
            <div>
              <label className="block text-slate-400 font-medium mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                <span>Story Points (SP)</span>
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={storyPoints}
                onChange={(e) => setStoryPoints(e.target.value)}
                placeholder="e.g., 3, 5, 8"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono font-bold text-indigo-300 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Assignee */}
            <div>
              <label className="block text-slate-400 font-medium mb-1 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-cyan-400" />
                <span>Assignee</span>
              </label>
              <input
                type="text"
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                placeholder="e.g., Alex, Sarah"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-slate-400 font-medium mb-1">Description & Notes</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details, acceptance criteria, or relevant links..."
              rows={4}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition leading-relaxed resize-y"
            />
          </div>

          {/* Subtasks / Checklist */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-slate-400 font-medium flex items-center gap-1.5">
                <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
                <span>Subtasks / Checklist</span>
              </label>
              {subtasks.length > 0 && (
                <span className="text-[11px] font-mono text-slate-400">
                  {completedSubtasksCount} of {subtasks.length} completed
                </span>
              )}
            </div>

            {/* Progress bar */}
            {subtasks.length > 0 && (
              <div className="w-full bg-slate-800 rounded-full h-1.5 mb-3 overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${(completedSubtasksCount / subtasks.length) * 100}%` }}
                />
              </div>
            )}

            {/* Subtask list */}
            <div className="space-y-1.5 mb-2">
              {subtasks.map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-center justify-between gap-2 p-2 rounded-lg bg-slate-950/60 border border-slate-800/80 hover:border-slate-700"
                >
                  <label className="flex items-center gap-2 flex-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sub.completed}
                      onChange={() => handleToggleSubtask(sub.id)}
                      className="w-4 h-4 rounded accent-emerald-500"
                    />
                    <span
                      className={`text-xs ${
                        sub.completed ? 'line-through text-slate-500' : 'text-slate-200'
                      }`}
                    >
                      {sub.title}
                    </span>
                  </label>
                  <button
                    onClick={() => handleDeleteSubtask(sub.id)}
                    className="text-slate-500 hover:text-rose-400 p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Subtask Input */}
            <form onSubmit={handleAddSubtask} className="flex gap-2">
              <input
                type="text"
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                placeholder="Add new subtask item..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl border border-slate-700 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Add
              </button>
            </form>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-slate-400 font-medium mb-1.5 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-indigo-400" />
              <span>Tags</span>
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-950/60 text-indigo-300 border border-indigo-800/60 font-mono text-[11px]"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-rose-400 ml-0.5"
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              placeholder="Type tag and press Enter..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900/90">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg shadow-indigo-500/20 transition"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};
