import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import type { Board, Column, Task, Project, UserProfile, Priority } from '../types/kanban';
import { cleanMarkdownText, cleanMarkdownDescription } from '../utils/parser';

const STORAGE_KEY_USER = 'mykanban_user_profile';
const STORAGE_KEY_CODE = 'mykanban_active_collab_code';

const defaultUser: UserProfile = {
  id: 'user-' + Math.random().toString(36).substring(2, 8),
  name: 'Alex Developer',
  avatarColor: '#3b82f6',
  initials: 'AD',
};

export function useConvexKanban() {
  const [activeCode, setActiveCode] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY_CODE) || 'XBW-843';
  });

  const [user, setUser] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_USER);
      return saved ? JSON.parse(saved) : defaultUser;
    } catch {
      return defaultUser;
    }
  });

  // Convex Queries
  const projectData = useQuery(api.projects.getProjectByCollabCode, { collabCode: activeCode });
  const allProjects = useQuery(api.projects.listProjects);
  const boardId = projectData?.board?._id;

  const rawBoardData = useQuery(
    api.boards.getBoardData,
    boardId ? { boardId: boardId as Id<"boards"> } : "skip"
  );

  // Sync activeCode if backend provided a fallback project (e.g. invalid code entered)
  useState(() => {
    // Initial check
  });
  useMemo(() => {
    if (projectData?.project?.collabCode && projectData.project.collabCode !== activeCode) {
      setActiveCode(projectData.project.collabCode);
      localStorage.setItem(STORAGE_KEY_CODE, projectData.project.collabCode);
    }
  }, [projectData?.project?.collabCode, activeCode]);

  // Convex Mutations
  const createProjectMutation = useMutation(api.projects.createProject);
  const addTaskMutation = useMutation(api.tasks.addTask);
  const updateTaskMutation = useMutation(api.tasks.updateTask);
  const moveTaskMutation = useMutation(api.tasks.moveTask);
  const deleteTaskMutation = useMutation(api.tasks.deleteTask);
  const addColumnMutation = useMutation(api.boards.addColumn);
  const updateColumnMutation = useMutation(api.boards.updateColumn);
  const deleteColumnMutation = useMutation(api.boards.deleteColumn);
  const importBoardMutation = useMutation(api.boards.importBoardData);

  // User Profile
  const updateUserProfile = useCallback((patch: Partial<UserProfile>) => {
    setUser((prev) => {
      const updated = { ...prev, ...patch };
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Map Convex Data to standard UI types
  const board: Board = useMemo(() => {
    if (!rawBoardData?.board) {
      return {
        id: 'loading-board',
        projectId: 'loading-proj',
        title: projectData?.project?.title || 'Loading Board...',
        columns: [],
        tasks: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
    }

    const columns: Column[] = rawBoardData.columns.map((c) => ({
      id: c._id,
      title: cleanMarkdownText(c.title),
      order: c.order,
      wipLimit: c.wipLimit,
    }));

    const tasks: Task[] = rawBoardData.tasks.map((t) => ({
      id: t._id,
      columnId: t.columnId,
      title: cleanMarkdownText(t.title),
      description: t.description ? cleanMarkdownDescription(t.description) : undefined,
      priority: t.priority,
      storyPoints: t.storyPoints,
      assignee: t.assignee,
      tags: t.tags || [],
      subtasks: t.subtasks?.map((s) => ({ ...s, title: cleanMarkdownText(s.title) })),
      order: t.order,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    }));

    return {
      id: rawBoardData.board._id,
      projectId: rawBoardData.board.projectId,
      title: cleanMarkdownText(rawBoardData.board.title),
      columns,
      tasks,
      createdAt: rawBoardData.board.createdAt,
      updatedAt: rawBoardData.board.updatedAt,
    };
  }, [rawBoardData, projectData]);

  const currentProject: Project = useMemo(() => {
    return {
      id: projectData?.project?._id || 'proj-active',
      title: projectData?.project?.title || 'Active Project',
      collabCode: projectData?.project?.collabCode || activeCode,
      createdAt: projectData?.project?.createdAt || Date.now(),
      updatedAt: projectData?.project?.updatedAt || Date.now(),
    };
  }, [projectData, activeCode]);

  const projects: Project[] = useMemo(() => {
    if (!allProjects || allProjects.length === 0) {
      return [currentProject];
    }
    return allProjects.map((p) => ({
      id: p._id,
      title: p.title,
      collabCode: p.collabCode,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }));
  }, [allProjects, currentProject]);

  // Switch to project by ID
  const setCurrentProjectId = useCallback((projectId: string) => {
    const target = allProjects?.find((p) => p._id === projectId);
    if (target) {
      setActiveCode(target.collabCode);
      localStorage.setItem(STORAGE_KEY_CODE, target.collabCode);
    }
  }, [allProjects]);

  // Create Project
  const createProject = useCallback(async (title: string, description?: string) => {
    const result = await createProjectMutation({ title, description });
    setActiveCode(result.collabCode);
    localStorage.setItem(STORAGE_KEY_CODE, result.collabCode);
  }, [createProjectMutation]);

  // Join Project by Code
  const joinProjectByCode = useCallback((code: string) => {
    const formatted = code.trim().toUpperCase();
    setActiveCode(formatted);
    localStorage.setItem(STORAGE_KEY_CODE, formatted);
    return true;
  }, []);


  // Add Task
  const addTask = useCallback(async (taskData: {
    columnId: string;
    title: string;
    description?: string;
    priority: Priority;
    storyPoints?: number;
    assignee?: string;
    tags: string[];
  }) => {
    if (!boardId) return;
    await addTaskMutation({
      boardId: boardId as Id<"boards">,
      columnId: taskData.columnId as Id<"columns">,
      title: cleanMarkdownText(taskData.title),
      description: taskData.description ? cleanMarkdownDescription(taskData.description) : undefined,
      priority: taskData.priority,
      storyPoints: taskData.storyPoints,
      assignee: taskData.assignee,
      tags: taskData.tags,
    });
  }, [boardId, addTaskMutation]);

  // Update Task
  const updateTask = useCallback(async (taskId: string, patch: Partial<Task>) => {
    await updateTaskMutation({
      taskId: taskId as Id<"tasks">,
      title: patch.title ? cleanMarkdownText(patch.title) : undefined,
      description: patch.description ? cleanMarkdownDescription(patch.description) : undefined,
      priority: patch.priority,
      storyPoints: patch.storyPoints,
      assignee: patch.assignee,
      tags: patch.tags,
      subtasks: patch.subtasks,
    });
  }, [updateTaskMutation]);

  // Move Task
  const moveTask = useCallback(async (taskId: string, targetColumnId: string, newOrder: number) => {
    await moveTaskMutation({
      taskId: taskId as Id<"tasks">,
      targetColumnId: targetColumnId as Id<"columns">,
      newOrder,
    });
  }, [moveTaskMutation]);

  // Delete Task
  const deleteTask = useCallback(async (taskId: string) => {
    await deleteTaskMutation({ taskId: taskId as Id<"tasks"> });
  }, [deleteTaskMutation]);

  // Add Column
  const addColumn = useCallback(async (title: string) => {
    if (!boardId) return;
    await addColumnMutation({
      boardId: boardId as Id<"boards">,
      title: cleanMarkdownText(title),
    });
  }, [boardId, addColumnMutation]);

  // Update Column
  const updateColumn = useCallback(async (columnId: string, patch: Partial<Column>) => {
    await updateColumnMutation({
      columnId: columnId as Id<"columns">,
      title: patch.title ? cleanMarkdownText(patch.title) : undefined,
      wipLimit: patch.wipLimit,
    });
  }, [updateColumnMutation]);

  // Delete Column
  const deleteColumn = useCallback(async (columnId: string) => {
    await deleteColumnMutation({ columnId: columnId as Id<"columns"> });
  }, [deleteColumnMutation]);

  // Import Parsed Data
  const importParsedData = useCallback(async (
    parsed: { title?: string; columns: { title: string; tasks: any[] }[] },
    replaceExisting = true
  ) => {
    if (!boardId) return;
    await importBoardMutation({
      boardId: boardId as Id<"boards">,
      columns: parsed.columns.map((c) => ({
        title: cleanMarkdownText(c.title),
        tasks: c.tasks.map((t) => ({
          title: cleanMarkdownText(t.title),
          description: t.description ? cleanMarkdownDescription(t.description) : undefined,
          priority: t.priority || 'medium',
          storyPoints: t.storyPoints,
          assignee: t.assignee,
          tags: t.tags || [],
        })),
      })),
      replaceExisting,
    });
  }, [boardId, importBoardMutation]);

  return {
    user,
    updateUserProfile,
    projects,
    currentProject,
    currentProjectId: currentProject.id,
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
  };
}
