import React, { useState, useEffect } from 'react';
import {
  X,
  Trash2,
  CheckSquare,
  Plus,
  Clock,
  User,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-800 bg-zinc-950">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-medium text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
              TASK-{task.id.slice(-4).toUpperCase()}
            </span>
            <select
              value={columnId}
              onChange={(e) => setColumnId(e.target.value)}
              className="bg-zinc-900 border border-zinc-700 text-xs font-medium text-zinc-200 rounded px-2 py-0.5 focus:outline-none focus:border-blue-500"
            >
              {columns.map((col) => (
                <option key={col.id} value={col.id}>
                  {col.title}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                if (confirm(`Delete task "${task.title}"?`)) {
                  onDelete(task.id);
                  onClose();
                }
              }}
              title="Delete task"
              className="p-1 rounded text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900 transition"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {/* Title */}
          <div>
            <label className="block text-zinc-400 font-medium mb-1">Task Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-medium text-zinc-100 focus:outline-none focus:border-blue-500 transition"
            />
          </div>

          {/* Grid: Priority, Story Points, Assignee */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Priority */}
            <div>
              <label className="block text-zinc-400 font-medium mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
              >
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            {/* Story Points */}
            <div>
              <label className="block text-zinc-400 font-medium mb-1 flex items-center gap-1">
                <Clock className="w-3 h-3 text-zinc-500" />
                <span>Story Points (sp)</span>
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={storyPoints}
                onChange={(e) => setStoryPoints(e.target.value)}
                placeholder="e.g. 3, 5"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-zinc-200 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Assignee */}
            <div>
              <label className="block text-zinc-400 font-medium mb-1 flex items-center gap-1">
                <User className="w-3 h-3 text-zinc-500" />
                <span>Assignee</span>
              </label>
              <input
                type="text"
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                placeholder="e.g. Alex"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-zinc-400 font-medium mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Task details and acceptance criteria..."
              rows={4}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-xs text-zinc-200 focus:outline-none focus:border-blue-500 transition leading-relaxed resize-y"
            />
          </div>

          {/* Subtasks */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-zinc-400 font-medium flex items-center gap-1.5">
                <CheckSquare className="w-3.5 h-3.5 text-zinc-500" />
                <span>Subtasks / Checklist</span>
              </label>
              {subtasks.length > 0 && (
                <span className="text-[11px] font-mono text-zinc-500">
                  {completedSubtasksCount}/{subtasks.length} done
                </span>
              )}
            </div>

            {subtasks.length > 0 && (
              <div className="w-full bg-zinc-900 rounded-full h-1 mb-2.5 overflow-hidden">
                <div
                  className="bg-blue-500 h-full rounded-full transition-all duration-200"
                  style={{ width: `${(completedSubtasksCount / subtasks.length) * 100}%` }}
                />
              </div>
            )}

            <div className="space-y-1 mb-2">
              {subtasks.map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-center justify-between gap-2 p-1.5 rounded bg-zinc-900/60 border border-zinc-800/80"
                >
                  <label className="flex items-center gap-2 flex-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sub.completed}
                      onChange={() => handleToggleSubtask(sub.id)}
                      className="w-3.5 h-3.5 rounded accent-blue-600"
                    />
                    <span
                      className={`text-xs ${
                        sub.completed ? 'line-through text-zinc-500' : 'text-zinc-200'
                      }`}
                    >
                      {sub.title}
                    </span>
                  </label>
                  <button
                    onClick={() => handleDeleteSubtask(sub.id)}
                    className="text-zinc-600 hover:text-zinc-300 p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddSubtask} className="flex gap-1.5">
              <input
                type="text"
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                placeholder="Add subtask..."
                className="flex-1 bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded border border-zinc-700 flex items-center gap-1 font-medium"
              >
                <Plus className="w-3 h-3" />
                Add
              </button>
            </form>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-zinc-400 font-medium mb-1">Tags</label>
            <div className="flex flex-wrap gap-1 mb-1.5">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-0.2 rounded bg-zinc-900 text-zinc-400 border border-zinc-800 font-mono text-[10px]"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-zinc-200"
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
              className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-zinc-800 bg-zinc-950">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 rounded"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 rounded transition"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};
