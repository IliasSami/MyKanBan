import { describe, it, expect } from 'vitest';
import { parseMarkdown, parseCSV, extractTaskMetadata, exportToMarkdown, exportToCSV } from './parser';

describe('Kanban Ingestion Engine', () => {
  it('extracts task metadata accurately', () => {
    const raw = 'Build parser @Alex #urgent ~5pts #feature #core';
    const meta = extractTaskMetadata(raw);

    expect(meta.title).toBe('Build parser');
    expect(meta.assignee).toBe('Alex');
    expect(meta.priority).toBe('urgent');
    expect(meta.storyPoints).toBe(5);
    expect(meta.tags).toContain('feature');
    expect(meta.tags).toContain('core');
  });

  it('parses structured Markdown with columns, tasks, and subtasks', () => {
    const md = `
# Sprint 24
## Backlog
- [ ] Research WebAssembly @David #high ~3
## Done
- [x] Initial setup @Alex ~2
  - Subtask 1
  - Subtask 2
`;
    const result = parseMarkdown(md);

    expect(result.title).toBe('Sprint 24');
    expect(result.columns.length).toBe(2);
    expect(result.columns[0].title).toBe('Backlog');
    expect(result.columns[0].tasks[0].title).toBe('Research WebAssembly');
    expect(result.columns[0].tasks[0].priority).toBe('high');
    expect(result.columns[0].tasks[0].storyPoints).toBe(3);

    expect(result.columns[1].title).toBe('Done');
    expect(result.columns[1].tasks[0].subtasks?.length).toBe(2);
  });

  it('parses CSV data into columns and tasks', () => {
    const csv = `Title,Column,Assignee,Priority,Points,Description
"Setup CI/CD",Done,Alex,medium,2,"Automated deployment"
"Fix Bug",To Do,Sarah,urgent,1,"Critical fix"`;

    const result = parseCSV(csv);
    expect(result.columns.length).toBe(2);

    const doneCol = result.columns.find((c) => c.title === 'Done');
    expect(doneCol).toBeDefined();
    expect(doneCol?.tasks[0].title).toBe('Setup CI/CD');
    expect(doneCol?.tasks[0].storyPoints).toBe(2);

    const todoCol = result.columns.find((c) => c.title === 'To Do');
    expect(todoCol).toBeDefined();
    expect(todoCol?.tasks[0].priority).toBe('urgent');
  });

  it('exports board to Markdown and CSV round-trip', () => {
    const columns = [
      { id: 'col-1', title: 'To Do' },
      { id: 'col-2', title: 'Done' },
    ];
    const tasks = [
      {
        columnId: 'col-1',
        title: 'Task A',
        priority: 'high' as const,
        storyPoints: 5,
        assignee: 'Alex',
        tags: ['web'],
      },
    ];

    const md = exportToMarkdown('My Board', columns, tasks);
    expect(md).toContain('# My Board');
    expect(md).toContain('## To Do');
    expect(md).toContain('- [ ] Task A @Alex #high ~5pts #web');

    const csv = exportToCSV(columns, tasks);
    expect(csv).toContain('Task A');
    expect(csv).toContain('To Do');
  });
});
