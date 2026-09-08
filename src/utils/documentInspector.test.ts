import { describe, it, expect } from 'vitest';
import { inspectDocument } from './documentInspector';

describe('documentInspector', () => {
  it('identifies native MyKanBan markdown as ready', () => {
    const md = `
# Sprint 1
## To Do
- [ ] Task 1 @Alex #high ~3
- [ ] Task 2 @Sarah #urgent ~5
## Done
- [x] Task 3
`;
    const result = inspectDocument(md, 'markdown');
    expect(result.isParsable).toBe(true);
    expect(result.diagnosis.status).toBe('ready');
    expect(result.tasksCount).toBe(3);
    expect(result.columnsCount).toBe(2);
  });

  it('flags unstructured meeting notes as needing AI conversion', () => {
    const notes = `
Sprint Planning Notes:
Alex mentioned we need to fix the authentication issue by Thursday.
Sarah is focusing on redesigning the mobile interface.
Dave will setup database migrations and test deployment.
`;
    const result = inspectDocument(notes, 'notes');
    expect(result.isParsable).toBe(false);
    expect(result.diagnosis.status).toBe('needs_ai');
    expect(result.diagnosis.title).toContain('Unstructured Document');
  });

  it('identifies valid Kanban JSON as ready', () => {
    const json = JSON.stringify({
      title: 'Roadmap',
      columns: [
        {
          title: 'Planning',
          tasks: [{ title: 'Design System', priority: 'high', storyPoints: 5 }],
        },
      ],
    });
    const result = inspectDocument(json, 'json');
    expect(result.isParsable).toBe(true);
    expect(result.diagnosis.status).toBe('ready');
    expect(result.tasksCount).toBe(1);
    expect(result.columnsCount).toBe(1);
  });

  it('handles empty documents properly', () => {
    const result = inspectDocument('', 'markdown');
    expect(result.isParsable).toBe(false);
    expect(result.diagnosis.status).toBe('empty');
  });
});
