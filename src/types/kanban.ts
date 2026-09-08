export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
  id: string;
  columnId: string;
  title: string;
  description?: string;
  priority: Priority;
  storyPoints?: number;
  assignee?: string;
  tags: string[];
  subtasks?: { id: string; title: string; completed: boolean }[];
  order: number;
  createdAt: number;
  updatedAt?: number;
}

export interface Column {
  id: string;
  title: string;
  order: number;
  wipLimit?: number;
}

export interface Board {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  columns: Column[];
  tasks: Task[];
  createdAt: number;
  updatedAt: number;
}

export interface Project {
  id: string;
  title: string;
  collabCode: string;
  createdAt: number;
  updatedAt: number;
}

export interface UserProfile {
  id: string;
  name: string;
  avatarColor: string;
  initials: string;
}

export interface ParseResult {
  title: string;
  columns: { title: string; tasks: Omit<Task, 'id' | 'columnId' | 'order' | 'createdAt'>[] }[];
}
