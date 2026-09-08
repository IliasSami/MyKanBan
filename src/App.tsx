import { useState } from 'react';
import { Navbar } from './components/Navbar';
import { ScrumMetricsBar } from './components/ScrumMetricsBar';
import { KanbanBoard } from './components/KanbanBoard';
import { ImportModal } from './components/ImportModal';
import { TaskModal } from './components/TaskModal';
import { CollabModal } from './components/CollabModal';
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
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

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

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Sticky Top Navigation */}
      <Navbar
        project={currentProject}
        boardTitle={board.title}
        user={user}
        onOpenImport={() => setIsImportOpen(true)}
        onOpenCollab={() => setIsCollabOpen(true)}
        onExportMarkdown={handleExportMarkdown}
        onExportCSV={handleExportCSV}
      />

      {/* Scrum Velocity & Sprint Metrics Header */}
      <ScrumMetricsBar columns={board.columns} tasks={board.tasks} />

      {/* Main Interactive Kanban Surface */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <KanbanBoard
          board={board}
          onMoveTask={moveTask}
          onAddTask={addTask}
          onUpdateColumn={updateColumn}
          onDeleteColumn={deleteColumn}
          onDeleteTask={deleteTask}
          onAddColumn={addColumn}
          onOpenTaskDetail={(task) => setSelectedTask(task)}
        />
      </main>

      {/* Ingestion & Parser Modal */}
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
  return hasConvex ? <ConvexApp /> : <LocalApp />;
}

export default App;
