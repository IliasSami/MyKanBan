import { describe, it, expect } from 'vitest';
import { convertWithLocalHeuristic } from './aiConverter';

describe('aiConverter local heuristic', () => {
  it('converts unstructured task lines into valid MyKanBan Markdown', () => {
    const rawInput = `
# Team Sprint
- Build login authentication [urgent] #auth
- Setup PostgreSQL database schema [high] #backend
- Fix responsive layout on mobile [medium] #ui
- Document API endpoints [low] #docs
`;

    const result = convertWithLocalHeuristic(rawInput);
    expect(result).toContain('# Team Sprint');
    expect(result).toContain('## Sprint To-Do');
    expect(result).toContain('Build login authentication');
    expect(result).toContain('#urgent');
    expect(result).toContain('#auth');
    expect(result).toContain('Setup PostgreSQL database schema');
    expect(result).toContain('#backend');
    expect(result).toContain('Fix responsive layout on mobile');
  });

  it('handles empty input gracefully', () => {
    const result = convertWithLocalHeuristic('');
    expect(result).toContain('# Imported Board');
    expect(result).toContain('## To Do');
  });
});
