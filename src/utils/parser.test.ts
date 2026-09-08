import { describe, it, expect } from 'vitest';
import {
  parseMarkdown,
  parseCSV,
  parseJSON,
  extractTaskMetadata,
  exportToMarkdown,
  exportToCSV,
  cleanMarkdownText,
  cleanMarkdownDescription,
} from './parser';

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

  it('strips markdown special characters cleanly from titles, headers, and descriptions', () => {
    // Bold, italic, code, quotes, links
    expect(cleanMarkdownText('**Refactor Engine**: `v2` update')).toBe('Refactor Engine: v2 update');
    expect(cleanMarkdownText('Fix [issue #42](https://github.com/issues/42)')).toBe('Fix issue #42');
    expect(cleanMarkdownText('### **Sprint Review**')).toBe('Sprint Review');
    expect(cleanMarkdownDescription('> Detailed notes on architecture\n> Second line')).toBe(
      'Detailed notes on architecture\nSecond line'
    );

    const md = `
# **Sprint 25: AI Engine**

## ### **In Progress**
- [ ] **Ingest Markdown files** @Alex #urgent ~5
  > Parser should strip > and **bold** formatting
  - [x] **Subtask item with bold**
`;

    const result = parseMarkdown(md);
    expect(result.title).toBe('Sprint 25: AI Engine');
    expect(result.columns[0].title).toBe('In Progress');
    expect(result.columns[0].tasks[0].title).toBe('Ingest Markdown files');
    expect(result.columns[0].tasks[0].description).toBe('Parser should strip > and bold formatting');
    expect(result.columns[0].tasks[0].subtasks?.[0].title).toBe('Subtask item with bold');
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

  it('parses KBF JSON format with WIP limits, subtasks, and story points', () => {
    const json = JSON.stringify({
      title: 'Sprint 26 KBF',
      columns: [
        {
          title: 'In Progress',
          wipLimit: 3,
          tasks: [
            {
              title: 'Build KBF Engine',
              description: 'Native schema processing',
              priority: 'urgent',
              storyPoints: 5,
              assignee: 'Alex',
              tags: ['kbf', 'core'],
              subtasks: [
                { title: 'Write parser', completed: true },
                { title: 'Add schema validation', completed: false },
              ],
            },
          ],
        },
      ],
    });

    const result = parseJSON(json);
    expect(result.title).toBe('Sprint 26 KBF');
    expect(result.columns.length).toBe(1);
    expect(result.columns[0].title).toBe('In Progress');
    expect(result.columns[0].wipLimit).toBe(3);
    expect(result.columns[0].tasks[0].title).toBe('Build KBF Engine');
    expect(result.columns[0].tasks[0].priority).toBe('urgent');
    expect(result.columns[0].tasks[0].storyPoints).toBe(5);
    expect(result.columns[0].tasks[0].subtasks?.length).toBe(2);
    expect(result.columns[0].tasks[0].subtasks?.[0].completed).toBe(true);
  });
});
