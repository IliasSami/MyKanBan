import { cleanMarkdownText } from '../utils/parser';

const STORAGE_KEY_AI_KEY = 'mykanban_ai_key';
const STORAGE_KEY_AI_MODEL = 'mykanban_ai_model';
const STORAGE_KEY_AI_BASE_URL = 'mykanban_ai_base_url';

export const DEFAULT_AI_BASE_URL =
  import.meta.env.VITE_NARA_BASE_URL || 'https://router.bynara.id/v1';

export const DEFAULT_AI_KEY =
  import.meta.env.VITE_NARA_API_KEY || 'sk-nry-fAxYIxRMbiWppJlEvjxt5nvnaB00eREpryEO_F_uqVY';

export const DEFAULT_AI_MODEL =
  import.meta.env.VITE_NARA_DEFAULT_MODEL || 'glm-5.3-free';

export const POPULAR_MODELS = [
  { id: 'glm-5.3-free', name: 'GLM 5.3 (Free - Recommended)' },
  { id: 'mistral-large', name: 'Mistral Large' },
  { id: 'deepseek-v4-flash', name: 'DeepSeek v4 Flash' },
  { id: 'claude-sonnet-5', name: 'Claude Sonnet 5' },
  { id: 'gpt-5.4', name: 'GPT 5.4' },
];

export function getStoredAISettings() {
  return {
    apiKey: localStorage.getItem(STORAGE_KEY_AI_KEY) || DEFAULT_AI_KEY,
    model: localStorage.getItem(STORAGE_KEY_AI_MODEL) || DEFAULT_AI_MODEL,
    baseUrl: localStorage.getItem(STORAGE_KEY_AI_BASE_URL) || DEFAULT_AI_BASE_URL,
  };
}

export function saveAISettings(settings: { apiKey?: string; model?: string; baseUrl?: string }) {
  if (settings.apiKey !== undefined) localStorage.setItem(STORAGE_KEY_AI_KEY, settings.apiKey);
  if (settings.model !== undefined) localStorage.setItem(STORAGE_KEY_AI_MODEL, settings.model);
  if (settings.baseUrl !== undefined) localStorage.setItem(STORAGE_KEY_AI_BASE_URL, settings.baseUrl);
}

export const SYSTEM_PROMPT = `You are the Chief Agile Architect & Lead Technical Workflow Engine for MyKanBan.
Your mission is to ingest messy notes, meeting transcripts, audits, PRDs, or task lists and convert them into the clean, gold-standard MyKanBan Native Markdown format.

### CRITICAL FLUFF & FILLER ELIMINATION GUARDRAILS:
1. **STRICTLY STRIP ALL FLUFF AND FILLER**:
   - Eliminate all conversational greetings ("Hi team", "Good morning", "Hope everyone is well").
   - Eliminate all sign-offs and pleasantries ("Thanks", "Let me know your thoughts", "Cheers").
   - Eliminate all administrative meeting metadata (attendee lists, timestamps, location, room IDs, agendas).
   - Eliminate rambling background prose or passive corporate observations ("We met on Monday to discuss...", "It was noted that...").
   - NEVER create fake tasks out of meeting chat or pleasantries.
2. **PURE ACTIONABLE SIGNAL ONLY**:
   - Every single line in the output MUST be a genuine, executable engineering, design, content, or QA task.
   - Every task title MUST start with an imperative action verb: e.g., Rewrite, Compress, Implement, Configure, Standardise, Resolve, Eliminate, Optimize, Validate, Re-Crawl, Fix.
   - NO markdown bold (**), NO italics (*), NO code ticks (\`) in task titles.

### TARGET OUTPUT SPECIFICATION:

1. **Board Title & Sprint Context**:
   - Line 1: '# <Project / Sprint Title>'
   - Followed by 1-2 blockquote lines starting with '> ' specifying context, source, or sprint rules:
     Example:
     # OutCraft.ai Technical SEO Remediation — Sprint Workflow
     > Crawl: https://www.outcraft.ai/ · Screaming Frog 19.8 · 2026-09-07 · HubSpot CMS behind Cloudflare
     > Flow: P0 this week → P1 this month → P2 quarter → P3 opportunistic · Re-audit loop gates "Done"

2. **Standard Workflow Stages (use Level 2 headers '##')**:
   Strictly distribute tasks into standard agile workflow stages:
   - ## Backlog (longer-term, research, improvements, backlog items)
   - ## Sprint To-Do (active sprint scope, ready to pick up)
   - ## In Progress (urgent bugs, critical fixes, underway items)
   - ## Review / QA (validation, rich results, core web vitals, audits)
   - ## Done (completed items, sign-offs)

3. **Task Line Anatomy (Strict Single Line)**:
   - Incomplete: '- [ ] <Action Title> @<Assignee/Role> #<priority> ~<points> #<tag1> #<tag2> ...'
   - Completed: '- [x] <Action Title> @<Assignee/Role> #<priority> ~<points> #<tag1> #<tag2> ...'

   RULES FOR TASK FIELDS:
   - **Action Verb Title**: MUST begin with a concise imperative action verb:
     e.g., Rewrite, Compress, Implement, Configure, Standardise, Resolve, Eliminate, Optimize, Validate, Re-Crawl, Fix.
   - **Assignee / Role**: Infer appropriate technical role:
     @Dev, @Content, @DevOps, @SEO, @QA, @Copy, @Design, @Lead, or specific name if mentioned.
   - **Priority**: Exactly one token: #urgent, #high, #medium, #low.
   - **Story Points**: Fibonacci estimation prefixed with '~': ~1, ~2, ~3, ~5, ~8.
   - **Tags**: 2-5 relevant lowercase hashtags: e.g., #seo #links #accessibility #performance #cloudflare.

4. **Task Context & Rationale (Indented 2 spaces with '> ')**:
   Underneath complex tasks, add a blockquote line explaining the background, metrics, or reason:
     > 236 outlinks have no anchor text; 108 use non-descriptive text ("click here", "learn more").

5. **Actionable Subtask Checklist (Indented 2 spaces with '- [ ] ')**:
   Underneath tasks requiring multiple steps, acceptance criteria, or specific fixes, provide 2-4 concrete subtasks:
     - [ ] Audit rich-text content and CTA modules for empty anchors
     - [ ] Replace generic anchors with descriptive link labels
     - [ ] Add aria-labels to icon/CTA links

### GOLD-STANDARD FEW-SHOT REFERENCE:
# OutCraft.ai Technical SEO Remediation — Sprint Workflow

> Crawl: https://www.outcraft.ai/ · Screaming Frog 19.8 · 2026-09-07 · HubSpot CMS behind Cloudflare
> Flow: P0 this week → P1 this month → P2 quarter → P3 opportunistic · Re-audit loop gates "Done"

## Backlog

- [ ] Rewrite Link Anchor Text Sitewide @Content #high ~5 #seo #links #accessibility
  > 236 outlinks have no anchor text; 108 use non-descriptive text ("click here", "learn more").
  - [ ] Audit rich-text content and CTA modules for empty anchors
  - [ ] Replace generic anchors with descriptive link labels
  - [ ] Add aria-labels to icon/CTA links

- [ ] Implement Security Headers Sitewide @DevOps #medium ~5 #security #headers #cloudflare
  > XFO missing on 97.8% of pages; Referrer-Policy missing 92.96%; XCTO 14.2%; CSP 9.3%.
  - [ ] Set X-Frame-Options: SAMEORIGIN at Cloudflare edge or HubSpot
  - [ ] Set X-Content-Type-Options: nosniff
  - [ ] Set Referrer-Policy: strict-origin-when-cross-origin

## Sprint To-Do

- [ ] Write Unique Title Tags @Content #high ~3 #seo #meta #hubspot
  > 57 titles exceed 60 chars; /pricing has raw URL as title; 2 duplicate pairs.
  - [ ] Add a real title to /pricing
  - [ ] Trim the automated " | Outcraft AI" suffix in the blog template

## In Progress

- [ ] Resolve Dead Knowledge Base URLs @Content #urgent ~3 #hubspot #cms #404
  > 18 URLs under /outcraft-ai-knowledge-base/ return 404 but are still listed in sitemap.xml.
  - [ ] Unpublish dead KB posts in CMS
  - [ ] Add 301 redirects to live equivalents

## Review / QA

- [ ] Optimize Mobile Core Web Vitals (INP) @Dev #high ~8 #performance #analytics
  > Mobile INP 237 ms fails the 200 ms threshold; ~475 KB unused third-party JS.
  - [ ] Defer non-critical tracking scripts
  - [ ] Re-run PageSpeed Insights to verify INP < 200 ms

## Done

- [x] Crawl OutCraft.ai with Screaming Frog 19.8 @SEO #medium ~8 #screaming-frog #audit
  > JS-rendered crawl completed: 2,084 URLs inspected, 0 5xx errors.

OUTPUT INSTRUCTIONS:
Return ONLY the raw Markdown text. Never include conversational preamble, apologies, or markdown code fence wrappers (\`\`\`markdown).`;

/**
 * Converts raw user notes/documents into MyKanBan format using Nara Router / OpenAI-compatible API
 */
export async function convertWithAI(
  rawText: string,
  options?: { apiKey?: string; baseUrl?: string; model?: string }
): Promise<string> {
  const current = getStoredAISettings();
  const apiKey = options?.apiKey || current.apiKey;
  const baseUrl = (options?.baseUrl || current.baseUrl).replace(/\/+$/, '');
  const model = options?.model || current.model;

  if (!rawText.trim()) {
    throw new Error('Please enter some text or upload a document to convert.');
  }

  const payload = {
    model,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: rawText },
    ],
    temperature: 0.2,
    apiKey,
    baseUrl,
  };

  try {
    // 1. Try Cloudflare Pages edge proxy first (/api/ai-convert) to bypass browser CORS
    let res: Response | null = null;
    try {
      res = await fetch('/api/ai-convert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
          'x-nara-base-url': baseUrl,
        },
        body: JSON.stringify(payload),
      });
    } catch {
      res = null;
    }

    // 2. If proxy was not found (e.g. status 404 in dev), attempt direct endpoint
    if (!res || res.status === 404) {
      res = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: payload.messages,
          temperature: 0.2,
        }),
      });
    }

    const data = await res.json();

    if (!res.ok) {
      const errMsg = data?.error?.message || `API error (${res.status})`;
      throw new Error(errMsg);
    }

    let result = data.choices?.[0]?.message?.content || '';

    // Strip markdown code fences if wrapped by LLM (```markdown ... ```)
    result = result.replace(/^```(?:markdown)?\s*\n?/i, '');
    result = result.replace(/\n?```\s*$/i, '');

    return result.trim();
  } catch (err: any) {
    console.error('AI conversion failed:', err);
    if (err?.message?.includes('Load failed') || err?.name === 'TypeError') {
      throw new Error('Network or CORS policy blocked direct connection to Nara Router.');
    }
    throw err;
  }
}

// Patterns that match conversational fluff, pleasantries, and administrative filler
const FILLER_LINE_PATTERNS = [
  /^(?:hi|hello|hey|good\s+morning|good\s+afternoon|good\s+evening|greetings|dear)\b/i,
  /^(?:thanks|thank\s+you|best|regards|cheers|sincerely|warmly|yours\s+truly|talk\s+soon)\b/i,
  /^(?:attendees?|present|absent|scribe|facilitator|moderator|participants?)\s*:/i,
  /^(?:meeting\s+(?:notes|minutes|called\s+to\s+order|adjourned|summary)|sync\s+call|weekly\s+sync|standup\s+notes)\b/i,
  /^(?:agenda|action\s+items?|topics?|table\s+of\s+contents|next\s+steps?)\s*:?$/i,
  /^(?:date|time|duration|location|zoom|google\s+meet|calendar)\s*:/i,
  /^(?:confidential|internal\s+use|draft|do\s+not\s+distribute|copyright|all\s+rights\s+reserved)\b/i,
  /^(?:in\s+our\s+discussion|we\s+discussed|the\s+team\s+agreed|as\s+discussed|quick\s+recap|general\s+discussion)\b/i,
  /^(?:let\s+me\s+know|feel\s+free\s+to|please\s+reach\s+out|looking\s+forward\s+to)\b/i,
  /^(?:hope\s+everyone|hope\s+you\s+are|great\s+job\s+team|shoutout\s+to|kudos)\b/i,
  /^(?:note\s*:?\s*please\s+do\s+not|fyi\s*:?\s*this\s+is|reminder\s*:)\b/i,
  /^(?:we\s+met\s+on\s+[a-z]+(?:\s+to\s+outline)?)\b/i,
];

/**
 * Checks if a line is pure conversational fluff, pleasantries, or administrative chatter
 */
export function isFluffOrFiller(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed || trimmed.length < 4) return true;

  for (const pattern of FILLER_LINE_PATTERNS) {
    if (pattern.test(trimmed)) return true;
  }

  // Pure dates or timestamps
  if (/^\d{4}[-/.]\d{1,2}[-/.]\d{1,2}(?:\s+\d{1,2}:\d{2}(?::\d{2})?(?:\s*[ap]m)?)?$/i.test(trimmed)) return true;

  // Single word fragments
  if (/^(?:notes|update|sync|discussion|recap|summary|fyi|overview|intro|introduction|conclusion|wrap-up)$/i.test(trimmed)) return true;

  return false;
}

const ACTIONABLE_VERB_REGEX = /\b(?:fix|build|create|deploy|implement|refactor|audit|test|configure|setup|add|remove|rewrite|compress|optimize|resolve|eliminate|standardise|standardize|verify|check|review|enable|write|clean|design|migrate|update|integrate|research|solve|inspect|publish|unpublish|enforce|defer|regenerate|sign\s+off|crawl|re-crawl|re-export|replace|reduce|ship|release|monitor|investigate|provision|secure|patch)\b/i;

const TECHNICAL_KEYWORD_REGEX = /\b(?:404|301|broken|dead|redirect|chain|security|headers?|vitals?|inp|cls|lcp|contrast|a11y|accessibility|token|sitemap|schema|json-ld|mojibake|h1|title\s+tag|meta\s+description|core\s+web\s+vitals|database|api|endpoint|cloudflare|hubspot|cms|ssl|cors|auth|session|cache|redis|migration|docker|kubernetes|pipeline)\b/i;

/**
 * Validates that a line has actionable task intent (not passive commentary)
 */
export function isActionableTask(line: string): boolean {
  const trimmed = line.trim();
  if (isFluffOrFiller(trimmed)) return false;

  // Explicit bullet or checkbox format
  if (/^(?:[-*+]|\d+\.)\s+(?:\[([ xX])\]\s+)?/.test(trimmed)) return true;
  if (/^(?:TODO|Task|P[0-3]|Urgent|Fix|Bug|Feature)\s*[:\-]/i.test(trimmed)) return true;

  // Contains action verbs or technical keywords
  if (ACTIONABLE_VERB_REGEX.test(trimmed) || TECHNICAL_KEYWORD_REGEX.test(trimmed)) {
    return true;
  }

  return false;
}

/**
 * Normalizes raw sentences into clean, imperative action-oriented task titles
 */
function toActionVerbTitle(raw: string): string {
  let text = cleanMarkdownText(raw);

  // Strip trailing notes, parentheses, step lists, or point estimates
  text = text.replace(/\s*\([^)]*\)\s*$/, '');
  text = text.replace(/\s*\[[^\]]*\]\s*$/, '');
  text = text.replace(/\s*(?:estimated|estimate|points?|pts?|sp).*$/i, '');
  text = text.replace(/\s*(?:assign\s+to|owner:).*$/i, '');
  text = text.replace(/\s*steps\s*:.*$/i, '');

  // Look for primary action verb in the sentence
  const actionMatch = text.match(
    /\b(fix|build|create|deploy|implement|refactor|audit|test|configure|setup|setting\s+up|add|remove|rewrite|compress|optimize|resolve|eliminate|standardise|standardize|verify|check|review|enable|write|clean|design|designing|migrate|update|integrate|research|solve|inspect|publish|unpublish|enforce|defer|regenerate|sign\s+off|crawl|re-crawl|re-export|replace)\s+(.*)/i
  );

  let title = '';
  if (actionMatch) {
    let verb = actionMatch[1].toLowerCase();
    if (verb === 'setting up') verb = 'setup';
    if (verb === 'designing') verb = 'design';
    const rest = actionMatch[2];
    title = `${verb.charAt(0).toUpperCase() + verb.slice(1)} ${rest}`;
  } else {
    title = text;
  }

  // Strip conversational noise at start
  title = title.replace(/^(?:we\s+(?:urgently\s+|also\s+|already\s+)?(?:need\s+to|must|should|have\s+to|will|finished\s+(?:setting\s+up)?|finished))\s+/i, '');
  title = title.replace(/^(?:(?:alex|sarah|david|dave|content|dev|seo|devops|qa)\s+(?:needs\s+to|will|should|is\s+going\s+to|is\s+assigned\s+to|to))\s+/i, '');
  title = title.replace(/^(?:also,\s*|and\s+)/i, '');
  title = title.replace(/[.,;:]+$/, '').trim();

  // Strip leading articles after action verb: e.g. "Fix the session token" -> "Fix session token"
  title = title.replace(/^([A-Za-z]+)\s+(?:the|a|an)\s+/i, '$1 ');

  // Take first clause if sentence is too long
  if (title.length > 70) {
    const firstClause = title.split(/[.;:]/)[0];
    if (firstClause && firstClause.length > 15) {
      title = firstClause;
    }
  }

  // Convert words to Title Case
  if (title) {
    title = title
      .split(/\s+/)
      .map((w, idx) => {
        const lower = w.toLowerCase();
        if (idx > 0 && ['and', 'or', 'at', 'by', 'for', 'in', 'of', 'on', 'to', 'up'].includes(lower)) {
          return lower;
        }
        return w.charAt(0).toUpperCase() + w.slice(1);
      })
      .join(' ');
  }

  // Ensure it starts with an action verb if it starts with numbers
  if (/^\d+\s+/.test(title)) {
    title = `Resolve ${title}`;
  }

  return title || 'Execute Sprint Task';
}

/**
 * Infers technical role / assignee from content
 */
function inferRole(text: string): string {
  const t = text.toLowerCase();
  if (t.includes('@')) {
    const match = text.match(/@([a-zA-Z0-9_-]+)/);
    if (match) return `@${match[1]}`;
  }
  if (t.includes('alex')) return '@Alex';
  if (t.includes('sarah')) return '@Sarah';
  if (t.includes('david') || t.includes('dave')) return '@David';

  if (t.includes('security') || t.includes('header') || t.includes('cloudflare') || t.includes('dns') || t.includes('nginx') || t.includes('docker') || t.includes('devops')) {
    return '@DevOps';
  }
  if (t.includes('seo') || t.includes('sitemap') || t.includes('canonical') || t.includes('crawl') || t.includes('404') || t.includes('301') || t.includes('redirect')) {
    return '@SEO';
  }
  if (t.includes('content') || t.includes('copy') || t.includes('article') || t.includes('blog') || t.includes('anchor') || t.includes('words') || t.includes('text')) {
    return '@Content';
  }
  if (t.includes('test') || t.includes('audit') || t.includes('qa') || t.includes('rich results') || t.includes('inp') || t.includes('core web vitals')) {
    return '@QA';
  }
  if (t.includes('design') || t.includes('ui') || t.includes('ux') || t.includes('contrast') || t.includes('theme') || t.includes('dark mode') || t.includes('responsive')) {
    return '@Design';
  }

  return '@Dev';
}

/**
 * Infers priority token
 */
function inferPriority(text: string): string {
  const t = text.toLowerCase();
  if (t.includes('urgent') || t.includes('critical') || t.includes('p0') || t.includes('blocker') || t.includes('immediate') || t.includes('404') || t.includes('broken')) {
    return '#urgent';
  }
  if (t.includes('high') || t.includes('p1') || t.includes('important') || t.includes('missing') || t.includes('security') || t.includes('fail')) {
    return '#high';
  }
  if (t.includes('low') || t.includes('p3') || t.includes('minor') || t.includes('nice to have') || t.includes('tidy') || t.includes('cleanup')) {
    return '#low';
  }
  return '#medium';
}

/**
 * Infers Fibonacci story points
 */
function inferStoryPoints(text: string): string {
  const match = text.match(/\b(\d+)\s*(?:pts?|sp|points?)\b/i);
  if (match) {
    const num = parseInt(match[1], 10);
    if (num >= 8) return '~8';
    if (num >= 5) return '~5';
    if (num >= 3) return '~3';
    if (num >= 2) return '~2';
    return '~1';
  }
  const t = text.toLowerCase();
  if (t.includes('sitewide') || t.includes('architecture') || t.includes('crawl') || t.includes('vitals') || t.includes('inp')) return '~8';
  if (t.includes('compress') || t.includes('security') || t.includes('database') || t.includes('migrate')) return '~5';
  if (t.includes('template') || t.includes('redirect') || t.includes('toggle') || t.includes('title tags')) return '~3';
  if (t.includes('meta description') || t.includes('typo') || t.includes('link')) return '~2';
  return '~3';
}

/**
 * Generates domain-specific tags
 */
function inferTags(text: string): string[] {
  const t = text.toLowerCase();
  const tags: string[] = [];

  if (t.includes('seo')) tags.push('#seo');
  if (t.includes('link') || t.includes('anchor')) tags.push('#links');
  if (t.includes('a11y') || t.includes('accessibility') || t.includes('aria')) tags.push('#accessibility');
  if (t.includes('image') || t.includes('media') || t.includes('webp') || t.includes('avif')) tags.push('#images');
  if (t.includes('security') || t.includes('headers') || t.includes('token')) tags.push('#security');
  if (t.includes('cloudflare')) tags.push('#cloudflare');
  if (t.includes('hubspot') || t.includes('cms')) tags.push('#hubspot');
  if (t.includes('performance') || t.includes('vitals') || t.includes('inp') || t.includes('speed')) tags.push('#performance');
  if (t.includes('meta') || t.includes('title tag')) tags.push('#meta');
  if (t.includes('sitemap')) tags.push('#sitemap');
  if (t.includes('404') || t.includes('redirect')) tags.push('#redirects');
  if (t.includes('ui') || t.includes('theme') || t.includes('design')) tags.push('#ui');
  if (t.includes('backend') || t.includes('api') || t.includes('database')) tags.push('#backend');

  if (tags.length === 0) {
    tags.push('#task', '#workflow');
  }

  return tags.slice(0, 4);
}

/**
 * Extracts context description (> line)
 */
function inferDescription(text: string): string | null {
  if (text.includes(';') || text.includes(':') || /\d+/.test(text)) {
    let desc = cleanMarkdownText(text);
    desc = desc.replace(/^(?:we\s+need\s+to|please|alex\s+should)\s+/i, '');
    if (desc.length > 25 && desc.length < 180) {
      return `  > ${desc.charAt(0).toUpperCase() + desc.slice(1)}`;
    }
  }
  return null;
}

/**
 * Infers concrete subtasks
 */
function inferSubtasks(text: string): string[] {
  const subtasks: string[] = [];
  const t = text.toLowerCase();

  // If text mentions explicit steps (e.g. "Steps: audit color tokens, add aria-live announcer, test with VoiceOver")
  const stepsMatch = text.match(/(?:steps|subtasks|tasks|todo):\s*(.*)/i);
  if (stepsMatch) {
    const rawSteps = stepsMatch[1].split(/[,;]/);
    for (const s of rawSteps) {
      const clean = cleanMarkdownText(s);
      if (clean && clean.length > 3) {
        subtasks.push(`  - [ ] ${clean.charAt(0).toUpperCase() + clean.slice(1)}`);
      }
    }
  }

  if (subtasks.length > 0) return subtasks;

  // Standard domain-specific subtask breakdown
  if (t.includes('anchor') || t.includes('link')) {
    subtasks.push('  - [ ] Audit rich-text content and CTA modules for empty anchors');
    subtasks.push('  - [ ] Replace generic anchors with descriptive link labels');
    subtasks.push('  - [ ] Add aria-labels to icon and navigation links');
  } else if (t.includes('image') || t.includes('compress')) {
    subtasks.push('  - [ ] Re-export heaviest assets to WebP / AVIF format');
    subtasks.push('  - [ ] Set explicit width and height dimensions to prevent CLS');
    subtasks.push('  - [ ] Verify image alt-text and responsiveness across devices');
  } else if (t.includes('security') || t.includes('header') || t.includes('token')) {
    subtasks.push('  - [ ] Audit security constraints and expiry logic');
    subtasks.push('  - [ ] Enforce security headers and token refresh cycle');
    subtasks.push('  - [ ] Test persistence on mobile and edge network');
  } else if (t.includes('title') || t.includes('meta')) {
    subtasks.push('  - [ ] Write unique under-60-char titles per page');
    subtasks.push('  - [ ] Ensure title differs from page H1 and matches user intent');
    subtasks.push('  - [ ] Verify meta description length and template fallbacks');
  } else if (t.includes('404') || t.includes('redirect')) {
    subtasks.push('  - [ ] Identify dead link sources in sitemap and internal navigation');
    subtasks.push('  - [ ] Configure direct 301 permanent redirects to live equivalents');
    subtasks.push('  - [ ] Re-crawl to verify zero broken chains');
  } else if (t.includes('dark mode') || t.includes('theme') || t.includes('contrast')) {
    subtasks.push('  - [ ] Audit color tokens against WCAG AAA contrast guidelines');
    subtasks.push('  - [ ] Implement system theme listener with user persistence');
    subtasks.push('  - [ ] Test with screen readers and VoiceOver');
  } else if (t.includes('vitals') || t.includes('inp') || t.includes('performance')) {
    subtasks.push('  - [ ] Audit and defer non-critical third-party tracking scripts');
    subtasks.push('  - [ ] Optimize main-thread execution for initial interaction');
    subtasks.push('  - [ ] Verify INP below 200ms on mobile viewports');
  }

  return subtasks;
}

/**
 * Gold-Standard Heuristic Converter
 * Automatically eliminates fluff/filler lines and extracts only actionable tasks
 */
export function convertWithLocalHeuristic(rawText: string): string {
  const allLines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (allLines.length === 0) {
    return `# Sprint Workflow\n\n> Ingested from unstructured notes · Structured for MyKanBan\n\n## Backlog\n- [ ] Initialize backlog items @Dev #medium ~3 #workflow\n\n## Sprint To-Do\n- [ ] Review sprint backlog @Lead #high ~2 #scrum\n\n## In Progress\n\n## Review / QA\n\n## Done\n`;
  }

  // 1. Determine Board Title (checking first line)
  let boardTitle = 'Sprint Workflow Engine';
  let firstLine = allLines[0];
  if (firstLine.startsWith('#') || firstLine.toLowerCase().includes('sprint') || firstLine.toLowerCase().includes('remediation') || firstLine.toLowerCase().includes('roadmap') || (firstLine.length < 50 && !isActionableTask(firstLine))) {
    boardTitle = cleanMarkdownText(firstLine);
    allLines.shift();
  }

  // 2. Filter out ALL conversational fluff and filler lines
  const actionableLines = allLines.filter((l) => !isFluffOrFiller(l) && isActionableTask(l));

  const backlog: string[] = [];
  const todo: string[] = [];
  const inProgress: string[] = [];
  const reviewQa: string[] = [];
  const done: string[] = [];

  for (const rawLine of actionableLines) {
    if (rawLine.startsWith('- [ ]') && rawLine.includes('  ')) continue;

    const lower = rawLine.toLowerCase();
    const isCompleted = lower.includes('[x]') || lower.includes('completed') || lower.includes('finished') || lower.includes('already finished') || lower.includes('done');

    // Extract clean action verb title
    const title = toActionVerbTitle(rawLine);
    const role = inferRole(rawLine);
    const priority = inferPriority(rawLine);
    const points = inferStoryPoints(rawLine);
    const tags = inferTags(rawLine).join(' ');
    const desc = inferDescription(rawLine);
    const subtasks = inferSubtasks(rawLine);

    const checkbox = isCompleted ? '- [x]' : '- [ ]';
    const taskHeader = `${checkbox} ${title} ${role} ${priority} ${points} ${tags}`;

    const blockParts: string[] = [taskHeader];
    if (desc) blockParts.push(desc);
    if (subtasks.length > 0) blockParts.push(...subtasks);
    const fullBlock = blockParts.join('\n');

    // Categorization into 5 standard stages
    if (isCompleted) {
      done.push(fullBlock);
    } else if (priority === '#urgent' || lower.includes('in progress') || lower.includes('doing') || lower.includes('active')) {
      inProgress.push(fullBlock);
    } else if (lower.includes('review') || lower.includes('qa') || lower.includes('audit') || lower.includes('verify') || lower.includes('vitals') || lower.includes('inp')) {
      reviewQa.push(fullBlock);
    } else if (priority === '#high' || lower.includes('sprint') || lower.includes('todo') || lower.includes('to-do')) {
      todo.push(fullBlock);
    } else {
      backlog.push(fullBlock);
    }
  }

  // Ensure reasonable distribution across stages
  if (todo.length === 0 && backlog.length > 2) {
    todo.push(backlog.shift()!);
  }

  let out = `# ${boardTitle}\n\n`;
  out += `> Ingested from unstructured document · Fluff & filler removed · Structured for MyKanBan\n`;
  out += `> Flow: P0 Urgent → P1 High → P2 Medium → P3 Backlog · Verified across standard workflow stages\n\n`;

  out += `## Backlog\n\n${backlog.length > 0 ? backlog.join('\n\n') : '- [ ] Groom future roadmap initiatives @Lead #low ~2 #backlog'}\n\n`;
  out += `## Sprint To-Do\n\n${todo.length > 0 ? todo.join('\n\n') : '- [ ] Review active sprint scope @Lead #high ~2 #scrum'}\n\n`;
  out += `## In Progress\n\n${inProgress.length > 0 ? inProgress.join('\n\n') : '- [ ] Resolve high-priority blocker items @Dev #urgent ~3 #active'}\n\n`;
  out += `## Review / QA\n\n${reviewQa.length > 0 ? reviewQa.join('\n\n') : '- [ ] Run staging regression tests @QA #medium ~2 #qa'}\n\n`;
  out += `## Done\n\n${done.length > 0 ? done.join('\n\n') : '- [x] Initial project discovery and backlog ingestion @Lead #medium ~2 #deliverable'}\n`;

  return out.trim();
}
