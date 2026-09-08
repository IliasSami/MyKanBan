import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CheckSquare, Trash2 } from 'lucide-react';
import type { Task } from '../types/kanban';

interface KanbanCardProps {
  task: Task;
  onOpenDetail: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

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

  const completedSubtasks = task.subtasks ? task.subtasks.filter((s) => s.completed).length : 0;
  const totalSubtasks = task.subtasks ? task.subtasks.length : 0;

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="opacity-30 bg-zinc-900 border border-blue-500 rounded-lg p-3 h-24 my-1.5"
      />
    );
  }

  // Minimal priority presentation (Monochrome scale with accessible contrast)
  const renderPriority = () => {
    switch (task.priority) {
      case 'urgent':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-red-700 dark:text-zinc-100 bg-red-50 dark:bg-zinc-800 border border-red-200 dark:border-zinc-600 px-1.5 py-0.2 rounded">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 dark:bg-blue-500" />
            Urgent
          </span>
        );
      case 'high':
        return (
          <span className="text-[10px] font-medium text-zinc-800 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700/60 px-1.5 py-0.2 rounded">
            High
          </span>
        );
      case 'medium':
        return (
          <span className="text-[10px] font-normal text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 px-1.5 py-0.2 rounded">
            Med
          </span>
        );
      case 'low':
      default:
        return (
          <span className="text-[10px] font-normal text-zinc-400 dark:text-zinc-500 px-1 py-0.2">
            Low
          </span>
        );
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      tabIndex={0}
      role="button"
      aria-label={`Task: ${task.title}, Priority: ${task.priority}${task.storyPoints ? `, ${task.storyPoints} story points` : ''}`}
      onClick={() => onOpenDetail(task)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpenDetail(task);
        }
      }}
      className="group relative bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-850 text-zinc-900 dark:text-zinc-100 rounded-lg p-3 my-1.5 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition cursor-grab active:cursor-grabbing select-none shadow-xs focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none"
    >
      {/* Top Header: Priority + Story Points */}
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5">
          {renderPriority()}
          {task.storyPoints !== undefined && (
            <span className="text-[10px] font-mono font-medium text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-950 px-1.5 py-0.2 rounded border border-zinc-200 dark:border-zinc-800">
              {task.storyPoints} sp
            </span>
          )}
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            if (confirm(`Delete task "${task.title}"?`)) {
              onDelete(task.id);
            }
          }}
          title="Delete task"
          aria-label={`Delete task ${task.title}`}
          className="opacity-0 group-hover:opacity-100 focus:opacity-100 text-zinc-400 hover:text-red-600 dark:text-zinc-500 dark:hover:text-zinc-200 p-0.5 rounded transition focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>

      {/* Task Title */}
      <h3 className="text-xs font-medium text-zinc-900 dark:text-zinc-100 mb-1 leading-snug line-clamp-2">
        {task.title}
      </h3>

      {/* Clean Description */}
      {task.description && (
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-2 mb-2 font-normal leading-relaxed">
          {task.description}
        </p>
      )}

      {/* Tags */}
      {task.tags && task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {task.tags.map((tag) => (
            <span
              key={tag}
              className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-50 dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Card Footer */}
      {(totalSubtasks > 0 || task.assignee) && (
        <div className="flex items-center justify-between pt-1.5 border-t border-zinc-100 dark:border-zinc-800/60 text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
          {totalSubtasks > 0 ? (
            <div className="flex items-center gap-1">
              <CheckSquare className="w-3 h-3 text-zinc-400 dark:text-zinc-500" />
              <span>
                {completedSubtasks}/{totalSubtasks}
              </span>
            </div>
          ) : (
            <div />
          )}

          {task.assignee && (
            <span className="text-[10px] bg-zinc-100 dark:bg-zinc-950 px-1.5 py-0.2 rounded text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 font-sans">
              @{task.assignee}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

