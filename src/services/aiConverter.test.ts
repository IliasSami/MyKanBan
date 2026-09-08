import { describe, it, expect } from 'vitest';
import { convertWithLocalHeuristic, isFluffOrFiller, isActionableTask } from './aiConverter';

describe('aiConverter fluff and filler filtering', () => {
  it('correctly identifies conversational fluff and meeting metadata', () => {
    expect(isFluffOrFiller('Hi team, hope you are having a great week!')).toBe(true);
    expect(isFluffOrFiller('Attendees: Alex, Sarah, David')).toBe(true);
    expect(isFluffOrFiller('Meeting notes - Weekly sync')).toBe(true);
    expect(isFluffOrFiller('Thanks everyone, let me know your thoughts!')).toBe(true);
    expect(isFluffOrFiller('We met on Monday to outline our upcoming sprint goals.')).toBe(true);
    expect(isFluffOrFiller('Agenda:')).toBe(true);

    // Real tasks must NOT be flagged as fluff
    expect(isFluffOrFiller('Rewrite Link Anchor Text Sitewide @Content #high ~5')).toBe(false);
    expect(isFluffOrFiller('Fix session token expiry bug on mobile')).toBe(false);
    expect(isFluffOrFiller('Compress images over 100 KB')).toBe(false);
  });

  it('correctly identifies actionable tasks vs passive chatter', () => {
    expect(isActionableTask('Fix session token expiry bug on mobile')).toBe(true);
    expect(isActionableTask('- [ ] Implement Security Headers Sitewide')).toBe(true);
    expect(isActionableTask('Resolve dead knowledge base 404 URLs')).toBe(true);

    expect(isActionableTask('We had a general discussion about the weather.')).toBe(false);
    expect(isActionableTask('Hi team, hope everyone is doing well!')).toBe(false);
  });

  it('strips fluff and converts unstructured text into gold-standard MyKanBan Markdown', () => {
    const rawNotes = `
Sprint Planning & Architecture Notes:
Attendees: Alex, Sarah, David
Hi team, thanks everyone for joining today's sprint kick-off!
We had a great discussion about our goals.
- We urgently need to fix the session token expiry bug on mobile. Assign to Alex, estimated 3 points.
Sarah will work on designing the dark mode toggle and contrast settings (high priority, 5 points). Steps: audit color tokens, add aria-live announcer, test with VoiceOver.
Dave is assigned to research Redis edge caching for future sprint velocity (estimated 2 points).
We already finished setting up the Vite build and Cloudflare Pages deployment pipeline last week.
Let me know if anyone has questions, have a great week!
`;

    const result = convertWithLocalHeuristic(rawNotes);

    // Check that title and context exist
    expect(result).toContain('# Sprint Planning & Architecture Notes');
    expect(result).toContain('Fluff & filler removed');

    // Check that conversational fluff was stripped
    expect(result).not.toContain('Hi team');
    expect(result).not.toContain('Attendees');
    expect(result).not.toContain('We had a great discussion');
    expect(result).not.toContain('Let me know if anyone has questions');

    // Check that actionable tasks were properly converted
    expect(result).toContain('Fix Session Token Expiry Bug on Mobile');
    expect(result).toContain('@Alex');
    expect(result).toContain('#urgent');
    expect(result).toContain('~3');

    expect(result).toContain('Design Dark Mode Toggle and Contrast Settings');
    expect(result).toContain('@Sarah');
    expect(result).toContain('#high');
    expect(result).toContain('~5');
    // Check that subtasks were generated
    expect(result).toContain('- [ ] Audit color tokens');
    expect(result).toContain('- [ ] Add aria-live announcer');

    // Check done category for completed item
    expect(result).toContain('## Done');
    expect(result).toContain('- [x]');
  });

  it('handles empty input gracefully with standard scaffold', () => {
    const result = convertWithLocalHeuristic('');
    expect(result).toContain('# Sprint Workflow');
    expect(result).toContain('## Backlog');
    expect(result).toContain('## Sprint To-Do');
    expect(result).toContain('## In Progress');
    expect(result).toContain('## Review / QA');
    expect(result).toContain('## Done');
  });
});
