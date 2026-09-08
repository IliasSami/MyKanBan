import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CheckSquare, MoreVertical, Flame } from 'lucide-react';
import type { Task, Priority } from '../types/kanban';

interface KanbanCardProps {
  task: Task;
  onOpenDetail: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

const priorityColors: Record<Priority, { bg: string; text: string; border: string; label: string }> = {
  urgent: {
    bg: 'bg-rose-500/15',
    text: 'text-rose-400',
    border: 'border-rose-500/30',
    label: 'Urgent',
  },
  high: {
    bg: 'bg-amber-500/15',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
    label: 'High',
  },
  medium: {
    bg: 'bg-sky-500/15',
    text: 'text-sky-400',
    border: 'border-sky-500/30',
    label: 'Medium',
  },
  low: {
    bg: 'bg-slate-500/15',
    text: 'text-slate-400',
    border: 'border-slate-500/30',
    label: 'Low',
  },
};

export const KanbanCard: React.FC<KanbanCardProps> = ({ task, onOpenDetail, onDelete }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: 'Task',
      task,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const priorityMeta = priorityColors[task.priority] || priorityColors.medium;
  const completedSubtasks = task.subtasks ? task.subtasks.filter((s) => s.completed).length : 0;
  const totalSubtasks = task.subtasks ? task.subtasks.length : 0;

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="opacity-40 bg-slate-800/80 border-2 border-dashed border-indigo-500 rounded-xl p-3.5 h-28 my-1.5 shadow-2xl"
      />
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onOpenDetail(task)}
      className="group relative bg-slate-800/90 hover:bg-slate-800 text-slate-100 rounded-xl p-3.5 my-2 border border-slate-700/70 hover:border-indigo-500/50 shadow-sm hover:shadow-lg transition-all duration-150 cursor-grab active:cursor-grabbing select-none"
    >
      {/* Top Header: Priority Badge + Story Points */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5">
          <span
            className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md border ${priorityMeta.bg} ${priorityMeta.text} ${priorityMeta.border}`}
          >
            {task.priority === 'urgent' && <Flame className="w-3 h-3 animate-pulse text-rose-500" />}
            {priorityMeta.label}
          </span>

          {task.storyPoints !== undefined && (
            <span className="text-[11px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-slate-900/60 text-indigo-300 border border-slate-700/50">
              {task.storyPoints} sp
            </span>
          )}
        </div>

        {/* Action menu trigger */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (confirm(`Delete task "${task.title}"?`)) {
                onDelete(task.id);
              }
            }}
            title="Delete task"
            className="text-slate-400 hover:text-rose-400 p-1 rounded hover:bg-slate-700 transition"
          >
            <MoreVertical className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Task Title */}
      <h3 className="text-sm font-semibold text-slate-100 mb-1 leading-snug line-clamp-2">
        {task.title}
      </h3>

      {/* Description Snippet */}
      {task.description && (
        <p className="text-xs text-slate-400 line-clamp-2 mb-2 font-normal">
          {task.description}
        </p>
      )}

      {/* Tags */}
      {task.tags && task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2.5">
          {task.tags.map((tag) => (
            <span
              key={tag}
              className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-900/50 text-slate-400 border border-slate-700/40"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Bottom Footer: Subtasks & Assignee */}
      <div className="flex items-center justify-between pt-1 border-t border-slate-700/40 text-xs">
        {totalSubtasks > 0 ? (
          <div
            className={`flex items-center gap-1 font-mono text-[11px] ${
              completedSubtasks === totalSubtasks ? 'text-emerald-400 font-bold' : 'text-slate-400'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>
              {completedSubtasks}/{totalSubtasks}
            </span>
          </div>
        ) : (
          <div />
        )}

        {task.assignee && (
          <div
            title={`Assigned to ${task.assignee}`}
            className="flex items-center gap-1 text-[11px] text-slate-300 bg-slate-900/60 px-2 py-0.5 rounded-full border border-slate-700/50 font-medium"
          >
            <span className="w-2 h-2 rounded-full bg-indigo-500" />
            <span className="truncate max-w-[90px]">{task.assignee}</span>
          </div>
        )}
      </div>
    </div>
  );
};
