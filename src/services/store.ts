import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Board, Column, Task, Project, UserProfile, Priority } from '../types/kanban';
import { cleanMarkdownText, cleanMarkdownDescription } from '../utils/parser';

const STORAGE_KEY_PROJECTS = 'mykanban_projects';
const STORAGE_KEY_CURRENT_PROJECT = 'mykanban_current_project_id';
const STORAGE_KEY_USER = 'mykanban_user_profile';
const BROADCAST_CHANNEL_NAME = 'mykanban_broadcast_sync';

// Default initial user
const defaultUser: UserProfile = {
  id: 'user-' + Math.random().toString(36).substring(2, 8),
  name: 'Alex Developer',
  avatarColor: '#3b82f6',
  initials: 'AD',
};

// Sanitizes board data by stripping any leftover markdown tokens
export function sanitizeBoard(b: Board): Board {
  return {
    ...b,
    title: cleanMarkdownText(b.title),
    columns: b.columns.map((col) => ({
      ...col,
      title: cleanMarkdownText(col.title),
    })),
    tasks: b.tasks.map((t) => ({
      ...t,
      title: cleanMarkdownText(t.title),
      description: t.description ? cleanMarkdownDescription(t.description) : undefined,
      subtasks: t.subtasks?.map((s) => ({
        ...s,
        title: cleanMarkdownText(s.title),
      })),
    })),
  };
}

// Generate random collab code like "KAN-839"
export function generateCollabCode(): string {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const nums = '23456789';
  let prefix = '';
  for (let i = 0; i < 3; i++) prefix += letters.charAt(Math.floor(Math.random() * letters.length));
  let suffix = '';
  for (let i = 0; i < 3; i++) suffix += nums.charAt(Math.floor(Math.random() * nums.length));
  return `${prefix}-${suffix}`;
}

// Initial demo board backing SCRUM concepts
function createDemoProject(): { project: Project; board: Board } {
  const projectId = 'proj-demo-1';
  const boardId = 'board-demo-1';
  const now = Date.now();

  const project: Project = {
    id: projectId,
    title: 'Sprint 24: Core Platform',
    collabCode: 'KAN-842',
    createdAt: now,
    updatedAt: now,
  };

  const columns: Column[] = [
    { id: 'col-backlog', title: 'Product Backlog', order: 0 },
    { id: 'col-todo', title: 'Sprint To-Do', order: 1, wipLimit: 6 },
    { id: 'col-in-progress', title: 'In Progress', order: 2, wipLimit: 4 },
    { id: 'col-in-review', title: 'Code Review', order: 3, wipLimit: 3 },
    { id: 'col-done', title: 'Done', order: 4 },
  ];

  const tasks: Task[] = [
    {
      id: 'task-1',
      columnId: 'col-in-progress',
      title: 'Implement Markdown Ingestion Engine',
      description: 'Support header detection, checkbox tasks, and metadata tags (@assignee, #priority, ~points).',
      priority: 'urgent',
      storyPoints: 5,
      assignee: 'Alex',
      tags: ['feature', 'parser'],
      subtasks: [
        { id: 'sub-1', title: 'Support headers (# and ##)', completed: true },
        { id: 'sub-2', title: 'Extract metadata regex (@, #, ~)', completed: true },
        { id: 'sub-3', title: 'Live preview modal', completed: false },
      ],
      order: 0,
      createdAt: now - 3600000 * 5,
    },
    {
      id: 'task-2',
      columnId: 'col-todo',
      title: 'Add CSV import support via PapaParse',
      description: 'Support automatic column mapping for Title, Priority, Story Points, and Status.',
      priority: 'high',
      storyPoints: 3,
      assignee: 'Sarah',
      tags: ['import', 'csv'],
      order: 0,
      createdAt: now - 3600000 * 4,
    },
    {
      id: 'task-3',
      columnId: 'col-in-review',
      title: 'Collab Code Project Sharing System',
      description: 'Allow teammates to copy 6-character room codes and join immediately with zero setup.',
      priority: 'high',
      storyPoints: 5,
      assignee: 'David',
      tags: ['collab', 'realtime'],
      order: 0,
      createdAt: now - 3600000 * 3,
    },
    {
      id: 'task-4',
      columnId: 'col-done',
      title: 'Vite React Scaffolding & Cloudflare Pages Configuration',
      description: 'Setup lightning-fast client bundle and responsive edge deployment configuration.',
      priority: 'medium',
      storyPoints: 2,
      assignee: 'Alex',
      tags: ['devops', 'cloudflare'],
      order: 0,
      createdAt: now - 3600000 * 8,
    },
    {
      id: 'task-5',
      columnId: 'col-backlog',
      title: 'Export board to Markdown & CSV',
      description: 'Enable 1-click round-trip export so boards can be versioned in Git repositories.',
      priority: 'low',
      storyPoints: 2,
      tags: ['export', 'scrum'],
      order: 0,
      createdAt: now - 3600000 * 2,
    },
  ];

  const board: Board = {
    id: boardId,
    projectId,
    title: project.title,
    description: 'Scrum Sprint board with real-time multi-client synchronization.',
    columns,
    tasks,
    createdAt: now,
    updatedAt: now,
  };

  return { project, board };
}

// Global broadcast channel for tab-to-tab instant synchronization
let broadcastChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
  }
} catch {
  // BroadcastChannel unavailable
}

export function useKanbanStore() {
  const [user, setUser] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_USER);
      return saved ? JSON.parse(saved) : defaultUser;
    } catch {
      return defaultUser;
    }
  });

  const [projects, setProjects] = useState<Project[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PROJECTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    const demo = createDemoProject();
    return [demo.project];
  });

  const [currentProjectId, setCurrentProjectId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CURRENT_PROJECT);
      if (saved) return saved;
    } catch {}
    return 'proj-demo-1';
  });

  const currentProject: Project = useMemo(() => {
    return projects.find((p) => p.id === currentProjectId) || projects[0] || {
      id: 'proj-demo-1',
      title: 'Sprint 24: Core Platform',
      collabCode: 'KAN-842',
      createdAt: Date.now(),
    };
  }, [projects, currentProjectId]);

  const [board, setBoard] = useState<Board>(() => {
    try {
      const saved = localStorage.getItem(`mykanban_board_${currentProjectId}`);
      if (saved) return sanitizeBoard(JSON.parse(saved));
    } catch {}
    const demo = createDemoProject();
    return sanitizeBoard(demo.board);
  });

  // Save changes to localStorage and broadcast to other tabs
  const persistBoard = useCallback((updatedBoard: Board, shouldBroadcast = true) => {
    const clean = sanitizeBoard(updatedBoard);
    setBoard(clean);
    try {
      localStorage.setItem(`mykanban_board_${clean.projectId}`, JSON.stringify(clean));
      if (shouldBroadcast && broadcastChannel) {
        broadcastChannel.postMessage({
          type: 'BOARD_UPDATED',
          projectId: clean.projectId,
          board: clean,
        });
      }
    } catch (err) {
      console.error('Failed to persist board:', err);
    }
  }, []);

  // Listen for broadcast messages from other open tabs/windows
  useEffect(() => {
    if (!broadcastChannel) return;

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'BOARD_UPDATED' && event.data?.projectId === currentProjectId) {
        setBoard(sanitizeBoard(event.data.board));
      }
    };

    broadcastChannel.addEventListener('message', handleMessage);
    return () => {
      broadcastChannel?.removeEventListener('message', handleMessage);
    };
  }, [currentProjectId]);

  // Load board whenever currentProjectId changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CURRENT_PROJECT, currentProjectId);
      const saved = localStorage.getItem(`mykanban_board_${currentProjectId}`);
      if (saved) {
        setBoard(sanitizeBoard(JSON.parse(saved)));
      } else {
        // Fallback for fresh project
        const curProj = projects.find((p) => p.id === currentProjectId);
        const newBoard: Board = {
          id: `board-${currentProjectId}`,
          projectId: currentProjectId,
          title: curProj?.title || 'Kanban Board',
          columns: [
            { id: `col-bl-${Date.now()}`, title: 'Backlog', order: 0 },
            { id: `col-todo-${Date.now()}`, title: 'Sprint To-Do', order: 1 },
            { id: `col-prog-${Date.now()}`, title: 'In Progress', order: 2 },
            { id: `col-done-${Date.now()}`, title: 'Done', order: 3 },
          ],
          tasks: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        persistBoard(newBoard);
      }
    } catch (err) {
      console.error('Error switching project:', err);
    }
  }, [currentProjectId, projects, persistBoard]);

  // Save projects list
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(projects));
    } catch {}
  }, [projects]);

  // Save user profile
  const updateUserProfile = useCallback((newProfile: Partial<UserProfile>) => {
    setUser((prev) => {
      const updated = { ...prev, ...newProfile };
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Create a new project with unique collab code
  const createProject = useCallback((title: string, description?: string) => {
    const newId = `proj-${Math.random().toString(36).substring(2, 9)}`;
    const collabCode = generateCollabCode();
    const now = Date.now();

    const newProject: Project = {
      id: newId,
      title: title.trim() || 'New Kanban Project',
      collabCode,
      createdAt: now,
      updatedAt: now,
    };

    const newBoard: Board = {
      id: `board-${newId}`,
      projectId: newId,
      title: newProject.title,
      description: description || 'Scrum Kanban Board',
      columns: [
        { id: `col-1-${Date.now()}`, title: 'Backlog', order: 0 },
        { id: `col-2-${Date.now()}`, title: 'To Do', order: 1 },
        { id: `col-3-${Date.now()}`, title: 'In Progress', order: 2 },
        { id: `col-4-${Date.now()}`, title: 'Review', order: 3 },
        { id: `col-5-${Date.now()}`, title: 'Done', order: 4 },
      ],
      tasks: [],
      createdAt: now,
      updatedAt: now,
    };

    setProjects((prev) => [newProject, ...prev]);
    setCurrentProjectId(newId);
    persistBoard(newBoard);

    return { project: newProject, board: newBoard };
  }, [persistBoard]);

  // Join project by collab code
  const joinProjectByCode = useCallback((code: string): boolean => {
    const formattedCode = code.trim().toUpperCase();
    const existing = projects.find((p) => p.collabCode.toUpperCase() === formattedCode);

    if (existing) {
      setCurrentProjectId(existing.id);
      return true;
    }

    // If not found in local projects list, generate a linked remote project entry
    const newId = `proj-${Math.random().toString(36).substring(2, 9)}`;
    const newProj: Project = {
      id: newId,
      title: `Shared Board (${formattedCode})`,
      collabCode: formattedCode,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    setProjects((prev) => [newProj, ...prev]);
    setCurrentProjectId(newId);
    return true;
  }, [projects]);

  // Add Task
  const addTask = useCallback((taskData: {
    columnId: string;
    title: string;
    description?: string;
    priority: Priority;
    storyPoints?: number;
    assignee?: string;
    tags: string[];
  }) => {
    const now = Date.now();
    const newTask: Task = {
      id: `task-${Math.random().toString(36).substring(2, 9)}`,
      columnId: taskData.columnId,
      title: taskData.title.trim(),
      description: taskData.description?.trim(),
      priority: taskData.priority,
      storyPoints: taskData.storyPoints,
      assignee: taskData.assignee?.trim(),
      tags: taskData.tags,
      order: board.tasks.filter((t) => t.columnId === taskData.columnId).length,
      createdAt: now,
      updatedAt: now,
    };

    const updated = {
      ...board,
      tasks: [...board.tasks, newTask],
      updatedAt: now,
    };
    persistBoard(updated);
  }, [board, persistBoard]);

  // Update Task
  const updateTask = useCallback((taskId: string, patch: Partial<Task>) => {
    const now = Date.now();
    const updatedTasks = board.tasks.map((t) => (t.id === taskId ? { ...t, ...patch, updatedAt: now } : t));
    const updated = {
      ...board,
      tasks: updatedTasks,
      updatedAt: now,
    };
    persistBoard(updated);
  }, [board, persistBoard]);

  // Delete Task
  const deleteTask = useCallback((taskId: string) => {
    const updated = {
      ...board,
      tasks: board.tasks.filter((t) => t.id !== taskId),
      updatedAt: Date.now(),
    };
    persistBoard(updated);
  }, [board, persistBoard]);

  // Move Task across or within columns
  const moveTask = useCallback((taskId: string, targetColumnId: string, newOrder: number) => {
    const task = board.tasks.find((t) => t.id === taskId);
    if (!task) return;

    const otherTasks = board.tasks.filter((t) => t.id !== taskId);
    const targetColumnTasks = otherTasks.filter((t) => t.columnId === targetColumnId);

    // Insert at newOrder
    targetColumnTasks.splice(newOrder, 0, {
      ...task,
      columnId: targetColumnId,
      updatedAt: Date.now(),
    });

    // Reassign orders
    const reorderedTargetTasks = targetColumnTasks.map((t, idx) => ({
      ...t,
      order: idx,
    }));

    const finalTasks = [
      ...otherTasks.filter((t) => t.columnId !== targetColumnId),
      ...reorderedTargetTasks,
    ];

    const updated = {
      ...board,
      tasks: finalTasks,
      updatedAt: Date.now(),
    };
    persistBoard(updated);
  }, [board, persistBoard]);

  // Add Column
  const addColumn = useCallback((title: string) => {
    const newCol: Column = {
      id: `col-${Math.random().toString(36).substring(2, 9)}`,
      title: title.trim(),
      order: board.columns.length,
    };

    const updated = {
      ...board,
      columns: [...board.columns, newCol],
      updatedAt: Date.now(),
    };
    persistBoard(updated);
  }, [board, persistBoard]);

  // Rename Column
  const updateColumn = useCallback((columnId: string, patch: Partial<Column>) => {
    const updatedCols = board.columns.map((c) => (c.id === columnId ? { ...c, ...patch } : c));
    const updated = {
      ...board,
      columns: updatedCols,
      updatedAt: Date.now(),
    };
    persistBoard(updated);
  }, [board, persistBoard]);

  // Delete Column
  const deleteColumn = useCallback((columnId: string) => {
    const updatedCols = board.columns.filter((c) => c.id !== columnId);
    const updatedTasks = board.tasks.filter((t) => t.columnId !== columnId);
    const updated = {
      ...board,
      columns: updatedCols,
      tasks: updatedTasks,
      updatedAt: Date.now(),
    };
    persistBoard(updated);
  }, [board, persistBoard]);

  // Bulk import parsed columns and tasks
  const importParsedData = useCallback((parsed: { title?: string; columns: { title: string; tasks: any[] }[] }, replace = true) => {
    const now = Date.now();
    let finalColumns: Column[] = [];
    let finalTasks: Task[] = [];

    if (!replace) {
      finalColumns = [...board.columns];
      finalTasks = [...board.tasks];
    }

    // Create columns and tasks
    parsed.columns.forEach((pCol, cIdx) => {
      let col = finalColumns.find((c) => c.title.toLowerCase() === pCol.title.toLowerCase());
      if (!col) {
        col = {
          id: `col-${Math.random().toString(36).substring(2, 9)}`,
          title: pCol.title,
          order: finalColumns.length + cIdx,
        };
        finalColumns.push(col);
      }

      pCol.tasks.forEach((pTask, tIdx) => {
        const task: Task = {
          id: `task-${Math.random().toString(36).substring(2, 9)}`,
          columnId: col!.id,
          title: pTask.title,
          description: pTask.description,
          priority: pTask.priority || 'medium',
          storyPoints: pTask.storyPoints,
          assignee: pTask.assignee,
          tags: pTask.tags || [],
          subtasks: pTask.subtasks || [],
          order: finalTasks.filter((t) => t.columnId === col!.id).length + tIdx,
          createdAt: now,
          updatedAt: now,
        };
        finalTasks.push(task);
      });
    });

    const updated: Board = {
      ...board,
      title: parsed.title && replace ? parsed.title : board.title,
      columns: finalColumns,
      tasks: finalTasks,
      updatedAt: now,
    };

    persistBoard(updated);
  }, [board, persistBoard]);

  // Leave project
  const leaveProject = useCallback((collabCode: string) => {
    setProjects((prev) => {
      const remaining = prev.filter((p) => p.collabCode.toUpperCase() !== collabCode.toUpperCase());
      if (remaining.length > 0 && currentProject.collabCode === collabCode) {
        setCurrentProjectId(remaining[0].id);
      }
      return remaining;
    });
  }, [currentProject]);

  return {
    user,
    updateUserProfile,
    projects,
    currentProject,
    currentProjectId,
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
  };
}
