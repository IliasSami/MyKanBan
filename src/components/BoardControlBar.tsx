import React from 'react';
import {
  Search,
  X,
  LayoutGrid,
  List,
  AlertTriangle,
  Plus,
  Flame,
} from 'lucide-react';
import type { Column, Task } from '../types/kanban';

export type DensityMode = 'comfortable' | 'compact';

interface BoardControlBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  priorityFilter: string | null;
  onPriorityFilterChange: (p: string | null) => void;
  density: DensityMode;
  onDensityChange: (d: DensityMode) => void;
  columns: Column[];
  tasks: Task[];
  onQuickAddTask: () => void;
}

export const BoardControlBar: React.FC<BoardControlBarProps> = ({
  searchQuery,
  onSearchChange,
  priorityFilter,
  onPriorityFilterChange,
  density,
  onDensityChange,
  columns,
  tasks,
  onQuickAddTask,
}) => {
  // Detect WIP bottlenecks across columns
  const overloadedCols = columns.filter((col) => {
    if (col.wipLimit === undefined) return false;
    const count = tasks.filter((t) => t.columnId === col.id).length;
    return count > col.wipLimit;
  });

  const hasActiveFilters = searchQuery.trim().length > 0 || priorityFilter !== null;

  const handleClearFilters = () => {
    onSearchChange('');
    onPriorityFilterChange(null);
  };

  return (
    <div className="bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-zinc-200/80 dark:border-zinc-800/80 px-4 lg:px-6 py-2 transition-colors">
      <div className="max-w-[1920px] mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Left: Search & Filter Inputs */}
        <div className="flex items-center gap-2 flex-1 min-w-[240px] max-w-xl">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Filter tasks by name, @assignee, #tag, #urgent..."
              className="w-full bg-zinc-100 dark:bg-zinc-900/90 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 text-xs pl-8 pr-7 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-0.5 rounded"
                title="Clear search"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Quick Priority Filter Pills */}
          <div className="hidden sm:flex items-center gap-1">
            <button
              onClick={() => onPriorityFilterChange(priorityFilter === 'urgent' ? null : 'urgent')}
              className={`px-2 py-1 rounded-md text-[11px] font-medium transition flex items-center gap-1 border ${
                priorityFilter === 'urgent'
                  ? 'bg-red-600 text-white border-red-700 shadow-xs'
                  : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-850 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800'
              }`}
            >
              <Flame className="w-3 h-3" />
              <span>Urgent</span>
            </button>

            <button
              onClick={() => onPriorityFilterChange(priorityFilter === 'high' ? null : 'high')}
              className={`px-2 py-1 rounded-md text-[11px] font-medium transition border ${
                priorityFilter === 'high'
                  ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                  : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-850 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800'
              }`}
            >
              High
            </button>

            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="px-2 py-1 text-[11px] text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition underline underline-offset-2"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Right: Density Toggle & Actions */}
        <div className="flex items-center gap-2.5">
          {/* Overloaded WIP Alert */}
          {overloadedCols.length > 0 && (
            <div
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 text-amber-800 dark:text-amber-300 text-[11px] font-medium animate-pulse"
              title={`WIP Limit exceeded in: ${overloadedCols.map((c) => c.title).join(', ')}`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>WIP Limit Warning ({overloadedCols.length})</span>
            </div>
          )}

          {/* Density Mode Switcher */}
          <div className="flex items-center bg-zinc-100 dark:bg-zinc-900 p-0.5 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <button
              onClick={() => onDensityChange('comfortable')}
              title="Comfortable card view (with subtasks and metadata)"
              aria-label="Comfortable card view"
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition ${
                density === 'comfortable'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cards</span>
            </button>

            <button
              onClick={() => onDensityChange('compact')}
              title="Compact high-density view"
              aria-label="Compact high-density view"
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition ${
                density === 'compact'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Compact</span>
            </button>
          </div>

          {/* Quick Add Story Button */}
          <button
            onClick={onQuickAddTask}
            className="btn-3d flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-xs focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Task</span>
          </button>
        </div>
      </div>
    </div>
  );
};
