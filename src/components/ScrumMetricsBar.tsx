import React, { useEffect, useRef } from 'react';
import { Target, CheckCircle2, TrendingUp, Award, Layers } from 'lucide-react';
import type { Column, Task } from '../types/kanban';
import { fireSprintCelebration } from './Confetti';

interface ScrumMetricsBarProps {
  columns: Column[];
  tasks: Task[];
}

export const ScrumMetricsBar: React.FC<ScrumMetricsBarProps> = ({ columns, tasks }) => {
  // Find "Done" or completed column
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

  // Trigger confetti celebration when reaching 100%
  useEffect(() => {
    if (percentage === 100 && totalPoints > 0 && prevPercentageRef.current < 100) {
      fireSprintCelebration();
    }
    prevPercentageRef.current = percentage;
  }, [percentage, totalPoints]);

  return (
    <div className="bg-slate-900/60 border-b border-slate-800/80 px-4 lg:px-6 py-2.5">
      <div className="max-w-[1920px] mx-auto flex flex-wrap items-center justify-between gap-4 text-xs">
        {/* Left: Sprint Story Points Progress */}
        <div className="flex items-center gap-4 flex-1 min-w-[280px]">
          <div className="flex items-center gap-1.5 text-slate-400 font-medium">
            <Target className="w-4 h-4 text-indigo-400" />
            <span>Sprint Velocity:</span>
          </div>

          <div className="flex-1 max-w-xs bg-slate-800 rounded-full h-2.5 overflow-hidden border border-slate-700/50 relative">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${percentage}%` }}
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="font-bold text-white">
              {donePoints} <span className="text-slate-400 font-normal">/ {totalPoints} SP</span>
            </span>
            <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono text-[11px] font-bold border border-indigo-500/30">
              {percentage}%
            </span>
          </div>
        </div>

        {/* Right: Quick Scrum Metrics Badges */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5 text-slate-300 bg-slate-800/50 px-2.5 py-1 rounded-lg border border-slate-700/40">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Completed:</span>
            <span className="font-bold text-white">{doneTasksCount}</span>
            <span className="text-slate-500">({taskPercentage}%)</span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-300 bg-slate-800/50 px-2.5 py-1 rounded-lg border border-slate-700/40">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>Total Tasks:</span>
            <span className="font-bold text-white">{totalTasksCount}</span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-300 bg-slate-800/50 px-2.5 py-1 rounded-lg border border-slate-700/40">
            <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
            <span>Columns:</span>
            <span className="font-bold text-white">{columns.length}</span>
          </div>

          {percentage === 100 && totalPoints > 0 && (
            <button
              onClick={() => fireSprintCelebration()}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold animate-pulse hover:bg-emerald-500/30 transition"
            >
              <Award className="w-3.5 h-3.5 text-emerald-400" />
              <span>Sprint Completed! 🎉</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
