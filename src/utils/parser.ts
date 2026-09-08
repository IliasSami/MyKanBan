import Papa from 'papaparse';
import type { Priority, ParseResult } from '../types/kanban';

export interface ParsedTaskDraft {
  title: string;
  description?: string;
  priority: Priority;
  storyPoints?: number;
  assignee?: string;
  tags: string[];
  subtasks?: { id: string; title: string; completed: boolean }[];
}

export interface ParsedColumnDraft {
  title: string;
  tasks: ParsedTaskDraft[];
}

/**
 * Extracts metadata from a task string:
 * - Assignee: @name or @(First Last)
 * - Priority: #urgent, #high, #medium, #low
 * - Story Points: ~3, (3pts), [3sp], 3sp, ~5pt
 * - Tags: other #hashtags
 */
export function extractTaskMetadata(rawLine: string): ParsedTaskDraft {
  let text = rawLine.trim();
  let priority: Priority = 'medium';
  let storyPoints: number | undefined = undefined;
  let assignee: string | undefined = undefined;
  const tags: string[] = [];

  // Extract Assignee: @(First Last) or @username
  const assigneeMatch = text.match(/@\(([^)]+)\)|@([a-zA-Z0-9_-]+)/);
  if (assigneeMatch) {
    assignee = assigneeMatch[1] || assigneeMatch[2];
    text = text.replace(assigneeMatch[0], '');
  }

  // Extract Priority: #urgent | #high | #medium | #low
  const priorityMatch = text.match(/#(urgent|critical|high|medium|med|low)/i);
  if (priorityMatch) {
    const p = priorityMatch[1].toLowerCase();
    if (p === 'urgent' || p === 'critical') priority = 'urgent';
    else if (p === 'high') priority = 'high';
    else if (p === 'low') priority = 'low';
    else priority = 'medium';
    text = text.replace(priorityMatch[0], '');
  }

  // Extract Story Points: ~3, ~3pts, (3pts), [3sp], 3sp, ~5
  const pointsMatch = text.match(/(?:~|\b)(\d+)\s*(?:pts?|sp)\b|~(\d+)\b|\[(\d+)(?:\s*(?:pts?|sp))?\]|\((\d+)(?:\s*(?:pts?|sp))?\)/i);
  if (pointsMatch) {
    const pointsStr = pointsMatch[1] || pointsMatch[2] || pointsMatch[3] || pointsMatch[4];
    storyPoints = parseInt(pointsStr, 10);
    text = text.replace(pointsMatch[0], '');
  }

  // Extract additional hashtags as tags
  const tagMatches = text.match(/#([a-zA-Z0-9_-]+)/g);
  if (tagMatches) {
    for (const tag of tagMatches) {
      const cleanTag = tag.replace('#', '').trim();
      if (!['urgent', 'critical', 'high', 'medium', 'med', 'low'].includes(cleanTag.toLowerCase())) {
        tags.push(cleanTag);
      }
      text = text.replace(tag, '');
    }
  }

  // Clean up title
  const title = text.replace(/\s+/g, ' ').trim();

  return {
    title: title || 'Untitled Task',
    priority,
    storyPoints,
    assignee,
    tags,
  };
}

/**
 * Parses Markdown formatted board data.
 * Supports:
 * # Board Title (optional)
 * ## Column Title (or ###)
 * - [ ] Task Title @assignee #priority ~points
 *   - Subtask 1
 *   - Subtask 2
 */
export function parseMarkdown(markdown: string): ParseResult {
  const lines = markdown.split(/\r?\n/);
  let boardTitle = 'Imported Kanban Board';
  const columns: ParsedColumnDraft[] = [];
  let currentColumn: ParsedColumnDraft | null = null;
  let currentTask: ParsedTaskDraft | null = null;

  // Default columns if none specified
  const defaultLanes = ['Backlog', 'To Do', 'In Progress', 'In Review', 'Done'];

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    if (!line) continue;

    // Check if line is Board Title: "# My Project Kanban"
    if (/^#\s+/.test(line) && columns.length === 0 && !currentColumn) {
      boardTitle = line.replace(/^#\s+/, '').trim();
      continue;
    }

    // Check if line is Column Header: "## Column Name" or "### Column Name" or "**Column Name:**"
    const colHeaderMatch = line.match(/^(?:#{1,3}\s+|\*\*)([^*#]+)(?:\*\*|:)?$/);
    if (colHeaderMatch && !line.startsWith('-') && !line.startsWith('*')) {
      const colTitle = colHeaderMatch[1].trim();
      currentColumn = {
        title: colTitle,
        tasks: [],
      };
      columns.push(currentColumn);
      currentTask = null;
      continue;
    }

    // Check if indented line belongs to previous task (description or subtask)
    if (currentTask && (rawLine.startsWith('  ') || rawLine.startsWith('\t'))) {
      const subtaskMatch = line.match(/^[-*]\s+(?:\[([ xX])\]\s+)?(.*)$/);
      if (subtaskMatch) {
        if (!currentTask.subtasks) currentTask.subtasks = [];
        currentTask.subtasks.push({
          id: `sub-${Math.random().toString(36).substring(2, 9)}`,
          title: subtaskMatch[2].trim(),
          completed: subtaskMatch[1]?.toLowerCase() === 'x',
        });
      } else {
        // Appending to description
        currentTask.description = currentTask.description
          ? `${currentTask.description}\n${line}`
          : line;
      }
      continue;
    }

    // Check if line is a top-level task bullet: "- [ ] Task" or "- [x] Task" or "- Task" or "* Task" or "1. Task"
    const taskMatch = line.match(/^(?:[-*]|\d+\.)\s+(?:\[([ xX])\]\s+)?(.*)$/);
    if (taskMatch) {
      const isCompleted = taskMatch[1]?.toLowerCase() === 'x';
      const taskBody = taskMatch[2];

      if (!currentColumn) {
        currentColumn = {
          title: 'To Do',
          tasks: [],
        };
        columns.push(currentColumn);
      }

      const parsedMeta = extractTaskMetadata(taskBody);
      currentTask = {
        ...parsedMeta,
        subtasks: [],
      };

      if (isCompleted && currentColumn.title.toLowerCase() !== 'done') {
        currentTask.tags.push('completed');
      }

      currentColumn.tasks.push(currentTask);
      continue;
    }
  }

  // If no columns were found, create standard Scrum lanes and put tasks in "To Do"
  if (columns.length === 0) {
    for (const lane of defaultLanes) {
      columns.push({
        title: lane,
        tasks: [],
      });
    }
  }

  return {
    title: boardTitle,
    columns,
  };
}

/**
 * Parses CSV formatted board data.
 * Headers supported (case-insensitive):
 * Title, Column/Status, Assignee, Priority, Story Points/Points, Description, Tags
 */
export function parseCSV(csvContent: string): ParseResult {
  const result = Papa.parse<Record<string, string>>(csvContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase(),
  });

  const columnsMap: Map<string, ParsedTaskDraft[]> = new Map();
  const defaultColumn = 'To Do';

  for (const row of result.data) {
    // Find title
    const title = row['title'] || row['name'] || row['task'] || row['summary'] || row['item'];
    if (!title) continue;

    // Find column / status
    const column = row['column'] || row['status'] || row['stage'] || row['lane'] || row['state'] || defaultColumn;
    const colName = column.trim();

    // Priority
    const rawPriority = (row['priority'] || row['severity'] || 'medium').toLowerCase().trim();
    let priority: Priority = 'medium';
    if (rawPriority.includes('urg') || rawPriority.includes('crit')) priority = 'urgent';
    else if (rawPriority.includes('high')) priority = 'high';
    else if (rawPriority.includes('low')) priority = 'low';

    // Story Points
    const rawPoints = row['story points'] || row['storypoints'] || row['points'] || row['estimate'] || row['sp'];
    const storyPoints = rawPoints ? parseInt(rawPoints, 10) : undefined;

    // Assignee
    const assignee = row['assignee'] || row['owner'] || row['assigned to'] || row['assigned'] || undefined;

    // Description
    const description = row['description'] || row['details'] || row['notes'] || undefined;

    // Tags
    const rawTags = row['tags'] || row['labels'] || row['category'] || '';
    const tags = rawTags
      ? rawTags.split(/[,;|]/).map((t) => t.trim()).filter(Boolean)
      : [];

    const task: ParsedTaskDraft = {
      title: title.trim(),
      description: description?.trim(),
      priority,
      storyPoints: Number.isNaN(storyPoints) ? undefined : storyPoints,
      assignee: assignee?.trim(),
      tags,
    };

    if (!columnsMap.has(colName)) {
      columnsMap.set(colName, []);
    }
    columnsMap.get(colName)!.push(task);
  }

  const columns: ParsedColumnDraft[] = [];
  for (const [colTitle, tasks] of columnsMap.entries()) {
    columns.push({
      title: colTitle,
      tasks,
    });
  }

  if (columns.length === 0) {
    columns.push(
      { title: 'Backlog', tasks: [] },
      { title: 'To Do', tasks: [] },
      { title: 'In Progress', tasks: [] },
      { title: 'Done', tasks: [] }
    );
  }

  return {
    title: 'Imported CSV Board',
    columns,
  };
}

/**
 * Converts a board structure to clean Markdown format for exporting.
 */
export function exportToMarkdown(
  boardTitle: string,
  columns: { id: string; title: string }[],
  tasks: { columnId: string; title: string; description?: string; priority: Priority; storyPoints?: number; assignee?: string; tags: string[]; subtasks?: { title: string; completed: boolean }[] }[]
): string {
  let md = `# ${boardTitle}\n\n`;

  for (const col of columns) {
    md += `## ${col.title}\n\n`;
    const colTasks = tasks.filter((t) => t.columnId === col.id);

    if (colTasks.length === 0) {
      md += `*(No tasks)*\n\n`;
      continue;
    }

    for (const task of colTasks) {
      let taskLine = `- [ ] ${task.title}`;
      if (task.assignee) taskLine += ` @${task.assignee}`;
      if (task.priority !== 'medium') taskLine += ` #${task.priority}`;
      if (task.storyPoints) taskLine += ` ~${task.storyPoints}pts`;
      if (task.tags && task.tags.length > 0) {
        taskLine += ` ${task.tags.map((t) => `#${t}`).join(' ')}`;
      }
      md += `${taskLine}\n`;

      if (task.description) {
        md += `  > ${task.description.split('\n').join('\n  > ')}\n`;
      }

      if (task.subtasks && task.subtasks.length > 0) {
        for (const sub of task.subtasks) {
          md += `  - [${sub.completed ? 'x' : ' '}] ${sub.title}\n`;
        }
      }
    }
    md += '\n';
  }

  return md;
}

/**
 * Converts a board structure to CSV format for exporting.
 */
export function exportToCSV(
  columns: { id: string; title: string }[],
  tasks: { columnId: string; title: string; description?: string; priority: Priority; storyPoints?: number; assignee?: string; tags: string[] }[]
): string {
  const colMap = new Map(columns.map((c) => [c.id, c.title]));
  const rows = tasks.map((t) => ({
    Title: t.title,
    Column: colMap.get(t.columnId) || 'To Do',
    Assignee: t.assignee || '',
    Priority: t.priority,
    'Story Points': t.storyPoints || '',
    Tags: t.tags.join(', '),
    Description: t.description || '',
  }));

  return Papa.unparse(rows);
}
