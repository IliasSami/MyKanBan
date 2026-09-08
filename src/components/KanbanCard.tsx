import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CheckSquare, Trash2, ArrowRight, Check } from 'lucide-react';
import type { Task } from '../types/kanban';

interface KanbanCardProps {
  task: Task;
  onOpenDetail: (task: Task) => void;
  onDelete: (taskId: string) => void;
  density?: 'comfortable' | 'compact';
  onMoveToNextStage?: () => void;
}

export const KanbanCard: React.FC<KanbanCardProps> = ({
  task,
  onOpenDetail,
  onDelete,
  density = 'comfortable',
  onMoveToNextStage,
}) => {
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
  const subtaskProgress = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="opacity-30 bg-blue-500/10 border-2 border-dashed border-blue-500 rounded-xl p-3 h-20 my-1.5"
      />
    );
  }

  // Priority badge presentation
  const renderPriority = () => {
    switch (task.priority) {
      case 'urgent':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/60 px-1.5 py-0.2 rounded-md shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            Urgent
          </span>
        );
      case 'high':
        return (
          <span className="text-[10px] font-medium text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 px-1.5 py-0.2 rounded-md">
            High
          </span>
        );
      case 'medium':
        return (
          <span className="text-[10px] font-normal text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/60 px-1.5 py-0.2 rounded-md">
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

  // Compact Mode Rendering
  if (density === 'compact') {
    return (
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        tabIndex={0}
        role="button"
        aria-label={`Task: ${task.title}`}
        onClick={() => onOpenDetail(task)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onOpenDetail(task);
          }
        }}
        className="card-3d group relative flex items-center justify-between gap-2 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 rounded-lg px-2.5 py-2 my-1 border border-zinc-200/90 dark:border-zinc-800/90 cursor-grab active:cursor-grabbing select-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none"
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${
              task.priority === 'urgent'
                ? 'bg-red-500'
                : task.priority === 'high'
                ? 'bg-amber-500'
                : task.priority === 'low'
                ? 'bg-zinc-400'
                : 'bg-blue-500'
            }`}
          />
          <span className="text-xs font-medium text-zinc-900 dark:text-zinc-100 truncate">
            {task.title}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {task.storyPoints !== undefined && (
            <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1 rounded">
              {task.storyPoints}sp
            </span>
          )}
          {task.assignee && (
            <span className="text-[10px] text-zinc-600 dark:text-zinc-300 font-mono">
              @{task.assignee}
            </span>
          )}
          {onMoveToNextStage && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMoveToNextStage();
              }}
              className="p-1 rounded text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400"
              title="Move to next stage"
            >
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // Comfortable Mode Rendering with 3D Depth
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
      className="card-3d group relative bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 rounded-xl p-3.5 my-2 border border-zinc-200/90 dark:border-zinc-800/90 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all cursor-grab active:cursor-grabbing select-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none"
    >
      {/* Top Header: Priority + Story Points + Quick Actions */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5">
          {renderPriority()}
          {task.storyPoints !== undefined && (
            <span className="text-[10px] font-mono font-medium text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-950 px-1.5 py-0.5 rounded-md border border-zinc-200 dark:border-zinc-800">
              {task.storyPoints} sp
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {onMoveToNextStage && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMoveToNextStage();
              }}
              title="Advance to next stage"
              aria-label="Advance to next stage"
              className="md:hidden p-1 rounded-md text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 bg-zinc-100 dark:bg-zinc-800 transition"
            >
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              if (confirm(`Delete task "${task.title}"?`)) {
                onDelete(task.id);
              }
            }}
            title="Delete task"
            aria-label={`Delete task ${task.title}`}
            className="opacity-0 group-hover:opacity-100 focus:opacity-100 text-zinc-400 hover:text-red-600 dark:text-zinc-500 dark:hover:text-red-400 p-0.5 rounded transition focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Task Title */}
      <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 mb-1.5 leading-snug line-clamp-2">
        {task.title}
      </h3>

      {/* Clean Description */}
      {task.description && (
        <div className="mb-3 relative group/desc">
          <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-blue-500/20 group-hover/desc:bg-blue-500/50 rounded-full transition-colors" />
          <p className="pl-2.5 text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-3 font-normal leading-relaxed">
            {task.description}
          </p>
        </div>
      )}

      {/* Subtask Checklist & Progress */}
      {totalSubtasks > 0 && (
        <div className="mb-3 space-y-1.5">
          <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 dark:text-zinc-400">
            <span className="flex items-center gap-1">
              <CheckSquare className="w-3 h-3 text-blue-500" />
              <span>Subtasks</span>
            </span>
            <span>
              {completedSubtasks}/{totalSubtasks}
            </span>
          </div>
          
          <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1 rounded-full overflow-hidden mb-2">
            <div
              className="h-full bg-blue-600 dark:bg-blue-500 rounded-full transition-all duration-300"
              style={{ width: `${subtaskProgress}%` }}
            />
          </div>

          {/* Render up to 3 subtasks */}
          <div className="space-y-1 mt-1.5">
            {task.subtasks!.slice(0, 3).map((sub) => (
              <div key={sub.id} className="flex items-start gap-1.5 opacity-90">
                <div className="mt-0.5 shrink-0 w-3 h-3 rounded-sm border border-zinc-300 dark:border-zinc-700 flex items-center justify-center bg-white dark:bg-zinc-900">
                  {sub.completed && <Check className="w-2.5 h-2.5 text-blue-600 dark:text-blue-400" />}
                </div>
                <span className={`text-[10px] leading-tight ${sub.completed ? 'line-through text-zinc-400 dark:text-zinc-500' : 'text-zinc-600 dark:text-zinc-300'} line-clamp-1`}>
                  {sub.title}
                </span>
              </div>
            ))}
            {totalSubtasks > 3 && (
              <div className="text-[9px] font-mono text-zinc-400 pl-4.5 pt-0.5">
                +{totalSubtasks - 3} more subtasks...
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tags */}
      {task.tags && task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {task.tags.map((tag) => (
            <span
              key={tag}
              className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-zinc-50 dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Card Footer */}
      {task.assignee && (
        <div className="flex items-center justify-end pt-1.5 border-t border-zinc-100 dark:border-zinc-800/60 text-[11px]">
          <span className="text-[10px] font-medium bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700/60 font-sans flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            @{task.assignee}
          </span>
        </div>
      )}
    </div>
  );
};

