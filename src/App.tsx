import { useState } from 'react';
import { Navbar } from './components/Navbar';
import { ScrumMetricsBar } from './components/ScrumMetricsBar';
import { BoardControlBar, type DensityMode } from './components/BoardControlBar';
import { KanbanBoard } from './components/KanbanBoard';
import { MobileKanbanView } from './components/MobileKanbanView';
import { ImportModal } from './components/ImportModal';
import { TaskModal } from './components/TaskModal';
import { CollabModal } from './components/CollabModal';
import { AccessibilityMenu } from './components/AccessibilityMenu';
import { AccessibilityProvider } from './context/AccessibilityContext';
import { useKanbanStore } from './services/store';
import { useConvexKanban } from './services/useConvexKanban';
import type { Task } from './types/kanban';
import { exportToMarkdown, exportToCSV } from './utils/parser';

interface KanbanViewProps {
  store: ReturnType<typeof useKanbanStore> | ReturnType<typeof useConvexKanban>;
  isCloud: boolean;
}

function KanbanView({ store }: KanbanViewProps) {
  const {
    user,
    updateUserProfile,
    projects,
    currentProject,
    setCurrentProjectId,
    createProject,
    joinProjectByCode,
    leaveProject,
    board,
    addTask,
    updateTask,
    deleteTask,
    moveTask,
    addColumn,
    updateColumn,
    deleteColumn,
    importParsedData,
  } = store;

  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isCollabOpen, setIsCollabOpen] = useState(false);
  const [isA11yOpen, setIsA11yOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Search, Filter & Density Controls
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string | null>(null);
  const [density, setDensity] = useState<DensityMode>('comfortable');

  const handleExportMarkdown = () => {
    const md = exportToMarkdown(board.title, board.columns, board.tasks);
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${board.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    const csv = exportToCSV(board.columns, board.tasks);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${board.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleQuickAddTask = () => {
    if (board.columns.length === 0) return;
    const targetCol = board.columns[0];
    addTask({
      columnId: targetCol.id,
      title: 'New Story',
      priority: 'medium',
      tags: [],
    });
  };

  return (
    <div className="min-h-screen bg-zinc-100/70 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col selection:bg-blue-600 selection:text-white transition-colors duration-150">
      {/* WCAG Skip Link */}
      <a
        href="#kanban-main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg focus:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-400 font-medium text-xs tracking-wide uppercase"
      >
        Skip to Kanban Board
      </a>

      {/* Sticky Top Navigation */}
      <Navbar
        project={currentProject}
        boardTitle={board.title}
        user={user}
        onOpenImport={() => setIsImportOpen(true)}
        onOpenCollab={() => setIsCollabOpen(true)}
        onOpenA11y={() => setIsA11yOpen(true)}
        onExportMarkdown={handleExportMarkdown}
        onExportCSV={handleExportCSV}
      />

      {/* Scrum Velocity & Sprint Metrics Header (Desktop) */}
      <div className="hidden md:block">
        <ScrumMetricsBar columns={board.columns} tasks={board.tasks} />
      </div>

      {/* Autonomous Search, Filter & View Density Controls (Desktop) */}
      <div className="hidden md:block">
        <BoardControlBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          priorityFilter={priorityFilter}
          onPriorityFilterChange={setPriorityFilter}
          density={density}
          onDensityChange={setDensity}
          columns={board.columns}
          tasks={board.tasks}
          onQuickAddTask={handleQuickAddTask}
        />
      </div>

      {/* Desktop / Tablet Kanban Board Surface */}
      <main className="hidden md:flex flex-1 flex-col overflow-hidden">
        <KanbanBoard
          board={board}
          onMoveTask={moveTask}
          onAddTask={addTask}
          onUpdateColumn={updateColumn}
          onDeleteColumn={deleteColumn}
          onDeleteTask={deleteTask}
          onAddColumn={addColumn}
          onOpenTaskDetail={(task) => setSelectedTask(task)}
          searchQuery={searchQuery}
          priorityFilter={priorityFilter}
          density={density}
        />
      </main>

      {/* Native Mobile App Surface (Notion / Google Keep Feel) */}
      <div className="flex md:hidden flex-1 flex-col overflow-hidden">
        <MobileKanbanView
          board={board}
          project={currentProject}
          onMoveTask={moveTask}
          onAddTask={addTask}
          onDeleteTask={deleteTask}
          onOpenTaskDetail={(task) => setSelectedTask(task)}
          onOpenCollab={() => setIsCollabOpen(true)}
          onOpenImport={() => setIsImportOpen(true)}
          onOpenA11y={() => setIsA11yOpen(true)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          priorityFilter={priorityFilter}
          onPriorityFilterChange={setPriorityFilter}
        />
      </div>

      {/* Ingestion & AI Parser Modal */}
      <ImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImport={(parsed, replace) => importParsedData(parsed, replace)}
      />

      {/* Task Details / Edit Modal */}
      <TaskModal
        task={selectedTask}
        columns={board.columns}
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        onUpdate={updateTask}
        onDelete={deleteTask}
      />

      {/* Collaboration Codes & Project Switcher Modal */}
      <CollabModal
        isOpen={isCollabOpen}
        onClose={() => setIsCollabOpen(false)}
        currentProject={currentProject}
        projects={projects}
        user={user}
        onUpdateUser={updateUserProfile}
        onJoinCode={joinProjectByCode}
        onCreateProject={createProject}
        onSelectProject={(id) => setCurrentProjectId(id)}
        onLeaveProject={leaveProject}
      />

      {/* Accessibility & Display Controls Modal */}
      <AccessibilityMenu
        isOpen={isA11yOpen}
        onClose={() => setIsA11yOpen(false)}
      />
    </div>
  );
}

function ConvexApp() {
  const store = useConvexKanban();
  return <KanbanView store={store} isCloud={true} />;
}

function LocalApp() {
  const store = useKanbanStore();
  return <KanbanView store={store} isCloud={false} />;
}

export function App() {
  const hasConvex = Boolean(import.meta.env.VITE_CONVEX_URL);
  return (
    <AccessibilityProvider>
      {hasConvex ? <ConvexApp /> : <LocalApp />}
    </AccessibilityProvider>
  );
}

export default App;
