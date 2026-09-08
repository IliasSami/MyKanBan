import React, { useState } from 'react';
import {
  Plus,
  CheckSquare,
  Sparkles,
  Layers,
  Flame,
  X,
  Target,
  Lock,
  Copy,
  Check,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import type { Board, Task, Priority, Project } from '../types/kanban';
import { KanbanCard } from './KanbanCard';

interface MobileKanbanViewProps {
  board: Board;
  project: Project;
  onMoveTask: (taskId: string, targetColumnId: string, newOrder: number) => void;
  onAddTask: (taskData: {
    columnId: string;
    title: string;
    description?: string;
    priority: Priority;
    storyPoints?: number;
    assignee?: string;
    tags: string[];
  }) => void;
  onDeleteTask: (taskId: string) => void;
  onOpenTaskDetail: (task: Task) => void;
  onOpenCollab: () => void;
  onOpenImport: () => void;
  onOpenA11y: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  priorityFilter: string | null;
  onPriorityFilterChange: (p: string | null) => void;
}

export const MobileKanbanView: React.FC<MobileKanbanViewProps> = ({
  board,
  project,
  onMoveTask,
  onAddTask,
  onDeleteTask,
  onOpenTaskDetail,
  onOpenCollab,
  onOpenImport,
  searchQuery,
  onSearchChange,
  priorityFilter,
  onPriorityFilterChange,
}) => {
  const [activeColumnIndex, setActiveColumnIndex] = useState(0);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isMetricsSheetOpen, setIsMetricsSheetOpen] = useState(false);
  const [isSearchSheetOpen, setIsSearchSheetOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState<Priority>('medium');
  const [newPoints, setNewPoints] = useState<string>('3');
  const [copied, setCopied] = useState(false);

  const columns = board.columns;
  const currentColumn = columns[activeColumnIndex] || columns[0];

  // Filter tasks based on query and priority
  const filterTask = (task: Task): boolean => {
    if (priorityFilter && task.priority !== priorityFilter) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    if (task.title.toLowerCase().includes(q)) return true;
    if (task.description?.toLowerCase().includes(q)) return true;
    if (task.assignee?.toLowerCase().includes(q.replace('@', ''))) return true;
    if (task.tags.some((t) => t.toLowerCase().includes(q.replace('#', '')))) return true;
    return false;
  };

  const activeColumnTasks = currentColumn
    ? board.tasks
        .filter((t) => t.columnId === currentColumn.id && filterTask(t))
        .sort((a, b) => a.order - b.order)
    : [];

  const handleCopyInvite = () => {
    const inviteUrl = `${window.location.origin}/?room=${project.collabCode}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleMoveToNext = (taskId: string) => {
    if (activeColumnIndex < columns.length - 1) {
      const nextCol = columns[activeColumnIndex + 1];
      const targetOrder = board.tasks.filter((t) => t.columnId === nextCol.id).length;
      onMoveTask(taskId, nextCol.id, targetOrder);
    }
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !currentColumn) return;

    onAddTask({
      columnId: currentColumn.id,
      title: newTitle.trim(),
      priority: newPriority,
      storyPoints: newPoints ? parseInt(newPoints, 10) : undefined,
      tags: [],
    });

    setNewTitle('');
    setIsQuickAddOpen(false);
  };

  // Metrics calculations
  const doneColumnIds = columns
    .filter((c) => c.title.toLowerCase().includes('done') || c.title.toLowerCase().includes('completed'))
    .map((c) => c.id);
  const totalPoints = board.tasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
  const donePoints = board.tasks
    .filter((t) => doneColumnIds.includes(t.columnId))
    .reduce((sum, t) => sum + (t.storyPoints || 0), 0);
  const velocityPercentage = totalPoints > 0 ? Math.round((donePoints / totalPoints) * 100) : 0;

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-zinc-100/70 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 pb-20">
      {/* Mobile Top Sub-Header: Active Project & Quick Invite */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={onOpenCollab}
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs font-mono text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700"
          >
            <Lock className="w-3 h-3 text-blue-500" />
            <span className="font-semibold">{project.collabCode}</span>
          </button>
          <span className="text-xs text-zinc-500 truncate font-medium">
            {board.title || project.title}
          </span>
        </div>

        <button
          onClick={handleCopyInvite}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-medium border border-blue-200 dark:border-blue-500/30"
        >
          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          <span>{copied ? 'Copied' : 'Invite'}</span>
        </button>
      </div>

      {/* Segmented Stage Carousel (Top Pill Tabs) */}
      <div className="sticky top-0 z-10 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 px-3 py-2.5 overflow-x-auto no-scrollbar shadow-xs">
        <div className="flex items-center gap-2 min-w-max">
          {columns.map((col, idx) => {
            const count = board.tasks.filter((t) => t.columnId === col.id).length;
            const isActive = idx === activeColumnIndex;
            const isWipExceeded = col.wipLimit !== undefined && count > col.wipLimit;

            return (
              <button
                key={col.id}
                onClick={() => setActiveColumnIndex(idx)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all select-none ${
                  isActive
                    ? 'btn-3d bg-blue-600 text-white shadow-md'
                    : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800/80 hover:bg-zinc-200 dark:hover:bg-zinc-850'
                }`}
              >
                <span>{col.title}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : isWipExceeded
                      ? 'bg-red-500 text-white'
                      : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  {count}
                  {col.wipLimit ? `/${col.wipLimit}` : ''}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Stage Header Info */}
      <div className="flex items-center justify-between px-4 pt-3 pb-1 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm tracking-tight text-zinc-900 dark:text-zinc-100">
            {currentColumn?.title}
          </span>
          <span className="text-zinc-400 text-xs font-mono">
            ({activeColumnTasks.length} {activeColumnTasks.length === 1 ? 'task' : 'tasks'})
          </span>
        </div>

        {/* Carousel Prev / Next Buttons */}
        <div className="flex items-center gap-1">
          <button
            disabled={activeColumnIndex === 0}
            onClick={() => setActiveColumnIndex((prev) => Math.max(0, prev - 1))}
            className="p-1 rounded-lg text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 disabled:opacity-30"
            title="Previous Stage"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-[11px] font-mono text-zinc-400">
            {activeColumnIndex + 1}/{columns.length}
          </span>
          <button
            disabled={activeColumnIndex >= columns.length - 1}
            onClick={() => setActiveColumnIndex((prev) => Math.min(columns.length - 1, prev + 1))}
            className="p-1 rounded-lg text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 disabled:opacity-30"
            title="Next Stage"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Active Stage Card Feed */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2.5">
        {activeColumnTasks.map((task) => (
          <KanbanCard
            key={task.id}
            task={task}
            onOpenDetail={onOpenTaskDetail}
            onDelete={onDeleteTask}
            density="comfortable"
            onMoveToNextStage={
              activeColumnIndex < columns.length - 1
                ? () => handleMoveToNext(task.id)
                : undefined
            }
          />
        ))}

        {activeColumnTasks.length === 0 && (
          <div className="h-44 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl flex flex-col items-center justify-center p-6 text-center mt-4">
            <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-2">
              <Plus className="w-5 h-5" />
            </div>
            <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
              No tasks in {currentColumn?.title}
            </p>
            <p className="text-xs text-zinc-500 mt-1 max-w-xs">
              Tap the blue + button below to create your first story in this stage.
            </p>
          </div>
        )}

        {/* Mobile Community Attribution Note */}
        <div className="pt-8 pb-4 text-center text-xs text-zinc-400 dark:text-zinc-500">
          <p>
            Built from scratch for the community by{' '}
            <a
              href="https://iliassami.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-700 dark:text-zinc-300 font-semibold underline decoration-zinc-300 dark:decoration-zinc-700 underline-offset-2"
            >
              Ilias Sami
            </a>
          </p>
          <div className="mt-1 flex items-center justify-center gap-2">
            <a
              href="https://iliassami.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 font-medium hover:underline"
            >
              iliassami.com ↗
            </a>
            <span>•</span>
            <span className="text-emerald-600 dark:text-emerald-400">100% Free & Open-Source</span>
          </div>
        </div>
      </div>

      {/* Google Keep style Floating Action Button (FAB) */}
      <button
        onClick={() => setIsQuickAddOpen(true)}
        title="Add New Task"
        aria-label="Add New Task"
        className="fab-3d fixed right-5 bottom-20 z-30 w-13 h-13 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-2xl focus:outline-none"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Quick Add Task Modal / Bottom Sheet */}
      {isQuickAddOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150"
          onClick={() => setIsQuickAddOpen(false)}
        >
          <div
            className="w-full sm:max-w-md bg-white dark:bg-zinc-950 border-t sm:border border-zinc-200 dark:border-zinc-800 rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl pb-safe"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle bar on mobile */}
            <div className="w-12 h-1 bg-zinc-300 dark:bg-zinc-700 rounded-full mx-auto mb-4 sm:hidden" />

            <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800 mb-3">
              <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-blue-600" />
                Add to {currentColumn?.title}
              </span>
              <button
                onClick={() => setIsQuickAddOpen(false)}
                className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-3">
              <textarea
                autoFocus
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="What needs to be done?"
                rows={3}
                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl p-3 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 resize-none"
              />

              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 font-mono text-xs">
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as Priority)}
                    className="bg-zinc-100 dark:bg-zinc-850 border border-zinc-300 dark:border-zinc-700 rounded-lg px-2.5 py-2 text-zinc-800 dark:text-zinc-200 text-xs"
                  >
                    <option value="urgent">🔥 Urgent</option>
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
                    placeholder="Points"
                    className="w-16 bg-zinc-100 dark:bg-zinc-850 border border-zinc-300 dark:border-zinc-700 rounded-lg px-2 py-2 text-zinc-800 dark:text-zinc-200 text-xs text-center"
                  />
                </div>

                <button
                  type="submit"
                  className="btn-3d flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl transition"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Metrics Bottom Sheet */}
      {isMetricsSheetOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end justify-center animate-in fade-in duration-150"
          onClick={() => setIsMetricsSheetOpen(false)}
        >
          <div
            className="w-full bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 rounded-t-3xl p-5 shadow-2xl pb-safe"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1 bg-zinc-300 dark:bg-zinc-700 rounded-full mx-auto mb-4" />

            <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800 mb-4">
              <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Target className="w-4 h-4 text-blue-600" />
                Sprint Health & Velocity
              </span>
              <button
                onClick={() => setIsMetricsSheetOpen(false)}
                className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Velocity Progress Bar */}
            <div className="space-y-2 mb-5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-zinc-500">Story Point Velocity</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">
                  {donePoints} / {totalPoints} sp ({velocityPercentage}%)
                </span>
              </div>
              <div className="w-full bg-zinc-100 dark:bg-zinc-900 h-2 rounded-full overflow-hidden border border-zinc-200 dark:border-zinc-800">
                <div
                  className="h-full bg-blue-600 dark:bg-blue-500 rounded-full transition-all duration-300"
                  style={{ width: `${velocityPercentage}%` }}
                />
              </div>
            </div>

            {/* Stages Distribution Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              {columns.map((col) => {
                const count = board.tasks.filter((t) => t.columnId === col.id).length;
                return (
                  <div
                    key={col.id}
                    className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between"
                  >
                    <span className="text-zinc-700 dark:text-zinc-300 font-medium truncate">
                      {col.title}
                    </span>
                    <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Quick Search Bottom Sheet */}
      {isSearchSheetOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end justify-center animate-in fade-in duration-150"
          onClick={() => setIsSearchSheetOpen(false)}
        >
          <div
            className="w-full bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 rounded-t-3xl p-5 shadow-2xl pb-safe"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1 bg-zinc-300 dark:bg-zinc-700 rounded-full mx-auto mb-4" />

            <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800 mb-3">
              <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Search & Filter
              </span>
              <button
                onClick={() => setIsSearchSheetOpen(false)}
                className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search by keyword, @assignee, #tag..."
              className="w-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl p-3 text-xs text-zinc-900 dark:text-zinc-100 mb-3 focus:outline-none focus:border-blue-500"
            />

            <div className="flex items-center gap-2">
              <button
                onClick={() => onPriorityFilterChange(priorityFilter === 'urgent' ? null : 'urgent')}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold transition border flex items-center justify-center gap-1 ${
                  priorityFilter === 'urgent'
                    ? 'bg-red-600 text-white border-red-700'
                    : 'bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300'
                }`}
              >
                <Flame className="w-3.5 h-3.5" />
                <span>Urgent</span>
              </button>
              <button
                onClick={() => {
                  onSearchChange('');
                  onPriorityFilterChange(null);
                  setIsSearchSheetOpen(false);
                }}
                className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* iOS / Android Native Style Bottom App Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-20 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border-t border-zinc-200 dark:border-zinc-800 px-3 py-1.5 flex items-center justify-around pb-safe shadow-lg">
        <button
          onClick={() => {}}
          className="flex flex-col items-center gap-0.5 p-1 text-blue-600 dark:text-blue-400"
        >
          <Layers className="w-5 h-5" />
          <span className="text-[10px] font-medium">Board</span>
        </button>

        <button
          onClick={() => setIsMetricsSheetOpen(true)}
          className="flex flex-col items-center gap-0.5 p-1 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          <Target className="w-5 h-5" />
          <span className="text-[10px] font-medium">Velocity</span>
        </button>

        <button
          onClick={onOpenImport}
          className="flex flex-col items-center gap-0.5 p-1 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          <Sparkles className="w-5 h-5 text-blue-500" />
          <span className="text-[10px] font-medium">AI Convert</span>
        </button>

        <button
          onClick={() => setIsSearchSheetOpen(true)}
          className={`flex flex-col items-center gap-0.5 p-1 ${
            searchQuery || priorityFilter
              ? 'text-blue-600 dark:text-blue-400 font-bold'
              : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
          }`}
        >
          <CheckSquare className="w-5 h-5" />
          <span className="text-[10px] font-medium">Filter</span>
        </button>

        <button
          onClick={onOpenCollab}
          className="flex flex-col items-center gap-0.5 p-1 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          <Lock className="w-5 h-5" />
          <span className="text-[10px] font-medium">Rooms</span>
        </button>
      </nav>
    </div>
  );
};
