import React, { useEffect, useRef } from 'react';
import { Target, CheckCircle2, Layers } from 'lucide-react';
import type { Column, Task } from '../types/kanban';
import { fireSprintCelebration } from './Confetti';

interface ScrumMetricsBarProps {
  columns: Column[];
  tasks: Task[];
}

export const ScrumMetricsBar: React.FC<ScrumMetricsBarProps> = ({ columns, tasks }) => {
  const doneColumnIds = columns
    .filter((c) => c.title.toLowerCase().includes('done') || c.title.toLowerCase().includes('completed'))
    .map((c) => c.id);

  const totalPoints = tasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
  const donePoints = tasks
    .filter((t) => doneColumnIds.includes(t.columnId))
    .reduce((sum, t) => sum + (t.storyPoints || 0), 0);

  const doneTasksCount = tasks.filter((t) => doneColumnIds.includes(t.columnId)).length;
  const totalTasksCount = tasks.length;

  const percentage = totalPoints > 0 ? Math.round((donePoints / totalPoints) * 100) : 0;
  const taskPercentage = totalTasksCount > 0 ? Math.round((doneTasksCount / totalTasksCount) * 100) : 0;

  const prevPercentageRef = useRef(percentage);

  useEffect(() => {
    if (percentage === 100 && totalPoints > 0 && prevPercentageRef.current < 100) {
      fireSprintCelebration();
    }
    prevPercentageRef.current = percentage;
  }, [percentage, totalPoints]);

  return (
    <div className="bg-zinc-950 border-b border-zinc-800/80 px-4 lg:px-6 py-2">
      <div className="max-w-[1920px] mx-auto flex flex-wrap items-center justify-between gap-4 text-xs">
        {/* Sprint Velocity Progress */}
        <div className="flex items-center gap-3 flex-1 min-w-[260px] max-w-lg">
          <div className="flex items-center gap-1 text-zinc-400 font-medium">
            <Target className="w-3.5 h-3.5 text-blue-400" />
            <span>Velocity:</span>
          </div>

          <div className="flex-1 bg-zinc-900 rounded-full h-1.5 overflow-hidden border border-zinc-800">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${percentage}%` }}
            />
          </div>

          <div className="flex items-center gap-1.5 font-mono text-xs">
            <span className="text-zinc-100 font-semibold">{donePoints}</span>
            <span className="text-zinc-500">/</span>
            <span className="text-zinc-400">{totalPoints} sp</span>
            <span className="text-[11px] font-semibold text-blue-400 bg-blue-500/10 px-1.5 py-0.2 rounded border border-blue-500/20">
              {percentage}%
            </span>
          </div>
        </div>

        {/* Minimal Metrics Counters */}
        <div className="flex items-center gap-4 text-xs font-mono text-zinc-400">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-zinc-500" />
            <span>Done:</span>
            <span className="text-zinc-200 font-semibold">{doneTasksCount}/{totalTasksCount}</span>
            <span className="text-zinc-600">({taskPercentage}%)</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-zinc-500" />
            <span>Columns:</span>
            <span className="text-zinc-200 font-semibold">{columns.length}</span>
          </div>

          {percentage === 100 && totalPoints > 0 && (
            <span className="text-blue-400 font-semibold font-sans bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20 text-[11px]">
              Sprint 100% Complete
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
