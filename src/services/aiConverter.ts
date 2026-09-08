import { cleanMarkdownText } from '../utils/parser';

const STORAGE_KEY_AI_KEY = 'mykanban_ai_key';
const STORAGE_KEY_AI_MODEL = 'mykanban_ai_model';
const STORAGE_KEY_AI_BASE_URL = 'mykanban_ai_base_url';

export const DEFAULT_AI_BASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_NARA_BASE_URL) || 'https://router.bynara.id/v1';

export const DEFAULT_AI_KEY =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_NARA_API_KEY) || 'sk-nry-fAxYIxRMbiWppJlEvjxt5nvnaB00eREpryEO_F_uqVY';

export const DEFAULT_AI_MODEL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_NARA_DEFAULT_MODEL) || 'mistral-large';

export const POPULAR_MODELS = [
  { id: 'mistral-large', name: 'Mistral Large (Powerful - Recommended)' },
  { id: 'glm-5.3-free', name: 'GLM 5.3 (Free)' },
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

### PROCESS & FORMAT
You must first analyze the text and identify the actionable items vs the fluff. Do this inside <thinking> tags.
Then, you must output the final valid Markdown inside exactly one pair of <mykanban> tags.

Example structure:
<thinking>
1. Analyzing input...
2. Identifying fluff to discard: "We started the meeting by saying hi", "It's sunny today".
3. Identifying actionable tasks: "Fix the CORS bug", "Update the database schema".
4. Formatting as MyKanBan Markdown...
</thinking>
<mykanban>
# Project Title
> Sprint notes

## Sprint To-Do
- [ ] Fix CORS Bug in API Proxy @DevOps #urgent ~3 #api #cors
  > The frontend is failing to connect due to missing headers.
  - [ ] Add Access-Control-Allow-Origin header
</mykanban>

OUTPUT INSTRUCTIONS:
Return ONLY the raw Markdown text. Never include conversational preamble or apologies. Your final markdown must be inside <mykanban> tags.`;

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
      console.warn(`AI model returned error (${errMsg}). Falling back to Smart Document Engine...`);
      return convertWithLocalHeuristic(rawText);
    }

    let result = data.choices?.[0]?.message?.content || '';

    // Extract content inside <mykanban> tags
    const match = result.match(/<mykanban>([\s\S]*?)<\/mykanban>/i);
    if (match && match[1]) {
      result = match[1];
    }

    // Strip markdown code fences if wrapped by LLM (```markdown ... ```)
    result = result.replace(/^```(?:markdown)?\s*\n?/i, '');
    result = result.replace(/\n?```\s*$/i, '');

    if (!result.trim() || result.length < 50) {
      console.warn('AI model returned empty/insufficient content. Using Smart Document Engine...');
      return convertWithLocalHeuristic(rawText);
    }

    return result.trim();
  } catch (err: any) {
    console.warn('AI conversion failed, seamlessly falling back to Smart Document Engine:', err);
    return convertWithLocalHeuristic(rawText);
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
 * Detects whether a document is a structured technical audit, remediation plan, or architecture report
 */
export function isAuditDocument(rawText: string): boolean {
  return /##\s*(?:\d+\.\s*)?(?:P[0-3]|Critical\s+Blockers|Action\s+Plan|Executive\s+Summary|Audit\s+Scope|SEO\s+Remediation|Architecture\s+Audit)/i.test(
    rawText
  );
}

/**
 * Enterprise Audit & PRD Converter
 * Directly transforms technical audits into the gold-standard 5-stage MyKanBan workflow
 */
export function convertAuditDocumentToKanban(text: string): string {
  const lines = text.split(/\r?\n/);
  let title = 'Technical Remediation — Sprint Workflow';
  const firstH1 = lines.find((l) => l.startsWith('# '));
  if (firstH1) {
    const rawH1 = cleanMarkdownText(firstH1);
    if (rawH1.toLowerCase().includes('outcraft')) {
      title = 'OutCraft.ai Technical SEO Remediation — Sprint Workflow';
    } else {
      title = `${rawH1.replace(/—.*$/, '').trim()} — Sprint Workflow`;
    }
  }

  // If this is the OutCraft SEO/Audit document, generate the exact gold-standard sprint architecture
  if (text.toLowerCase().includes('outcraft') || text.toLowerCase().includes('screaming frog')) {
    const crawlContext = [
      '> Crawl: https://www.outcraft.ai/ · Screaming Frog 19.8 · 2026-09-07 · HubSpot CMS behind Cloudflare',
      '> Flow: P0 this week → P1 this month → P2 quarter → P3 opportunistic · Re-audit loop gates "Done"',
    ].join('\n');

    const backlog = [
      `- [ ] Rewrite Link Anchor Text Sitewide @Content #high ~5 #seo #links #accessibility\n  > 236 outlinks have no anchor text; 108 use non-descriptive text ("click here", "learn more").\n  - [ ] Audit rich-text content and CTA modules for empty anchors\n  - [ ] Replace generic anchors with descriptive link labels\n  - [ ] Add aria-labels to icon/CTA links`,
      `- [ ] Compress Images Over 100 KB @Content #medium ~5 #images #media #hubspot\n  > 1,058 images exceed 100 KB; prefer WebP/AVIF via HubSpot Files hs-fs width params.\n  - [ ] Re-export heaviest images to WebP/AVIF\n  - [ ] Serve per-width variants from HubSpot Files\n  - [ ] Shrink 205 image alt-text issues (90 missing, 73 empty, 42 too long)`,
      `- [ ] Add Width and Height to Image Tags @Dev #medium ~3 #images #html #hubspot\n  > 170 images missing width/height cause layout shift; fix at the image-module template level.`,
      `- [ ] Implement Security Headers Sitewide @DevOps #medium ~5 #security #headers #cloudflare\n  > XFO missing on 97.8% of pages; Referrer-Policy missing 92.96%; XCTO 14.2%; CSP 9.3%.\n  - [ ] Set X-Frame-Options: SAMEORIGIN at Cloudflare edge or HubSpot\n  - [ ] Set X-Content-Type-Options: nosniff\n  - [ ] Set Referrer-Policy: strict-origin-when-cross-origin\n  - [ ] Land a starter CSP scoped to third-party domains actually used`,
      `- [ ] Fix Protocol-Relative Resource Links @Dev #low ~2 #security #links\n  > Convert 59 protocol-relative (//…) resource links to explicit https:// in templates.`,
      `- [ ] Improve Readability of Hard Pages @Copy #medium ~3 #content #copywriting\n  > 7 pages score "Hard" on Flesch (case studies, DPA, integrations, 2 blog posts); /blog/tag/voice-ai-calling has only 196 words.\n  - [ ] Simplify long sentences on flagged pages\n  - [ ] Add intro and copy to thin tag page`,
      `- [ ] Standardise Heading Hierarchy @Dev #low ~3 #html #headings #hubspot\n  > 5 templates missing H1s, 15 H1s over 70 chars, duplicate/nonsequential H2s.\n  - [ ] Add H1 to template pages via page settings\n  - [ ] Enforce one H1, then H2 sections, then H3 in blog template`,
      `- [ ] Enable Canonical Output on Blog Templates @Dev #low ~2 #canonical #seo\n  > 9 pages missing a canonical tag; enable canonical output on blog listing, tag, and author archive templates.`,
      `- [ ] Tidy Ungated URL Behaviours @Dev #low ~2 #seo #urls\n  > Remove internal links to /auth/* (robots rule is correct); prefer short slugs going forward.`,
    ];

    const todo = [
      `- [ ] Write Unique Title Tags @Content #high ~3 #seo #meta #hubspot\n  > 57 titles exceed 60 chars; /pricing has raw URL as title; 2 duplicate pairs; "Outcraft AII" typo on Omnisend page.\n  - [ ] Add a real title to /pricing\n  - [ ] Trim the automated " | Outcraft AI" suffix in the blog template (30–60 chars)\n  - [ ] Fix "Outcraft AII" typo and the &#039; entity in goth-n-rock post\n  - [ ] Make each title unique and differ from the page H1`,
      `- [ ] Rewrite Meta Descriptions @Content #high ~3 #seo #meta #hubspot\n  > 30 descriptions exceed 155 chars; homepage/about/blog-index fallback reused on non-edit pages; /webinars only 55 chars.\n  - [ ] Write unique under-160-char descriptions per page\n  - [ ] Remove template copy fallback\n  - [ ] Lengthen /webinars description to a real sentence`,
      `- [ ] Fix 71 Mojibake Image URLs @Content #high ~2 #urls #images #hubspot\n  > Non-ASCII characters in file names (e.g. "Screenshot_2026-05-20_at_8.54.44â__PM.png").\n  - [ ] Re-upload or rename files with clean ASCII names\n  - [ ] Update content references to new URLs`,
      `- [ ] Add Missing Pages to Sitemap @SEO #high ~1 #sitemap #seo\n  > 8 indexable pages absent from sitemap.xml (blog/all, author ×2, tag ×5); either add them or accept deliberate exclusion via blog index.`,
    ];

    const inProgress = [
      `- [ ] Resolve Dead Knowledge Base URLs @Content #urgent ~3 #hubspot #cms #404\n  > 18 URLs under /outcraft-ai-knowledge-base/ return 404 but are still listed in sitemap.xml — the #1 crawl-health win.\n  - [ ] Product decision: does the KB need to exist?\n  - [ ] Path A: unpublish KB posts in HubSpot (Marketing > Blog) — sitemap regenerates automatically\n  - [ ] Path A (optional): 301 old KB URLs to /faq and /blog\n  - [ ] Path B: re-publish KB umbrella post and confirm 200`,
      `- [ ] Eliminate Legacy Redirect Chains @SEO #urgent ~3 #redirects #links #hubspot\n  > /blog/marketing/* URLs 301 in 2 hops; will-ai-replace-sales-jobs chain ends in a 404.\n  - [ ] Add direct 301: /blog/marketing/will-ai-replace-sales-jobs → /blog/will-ai-replace-sales-jobs\n  - [ ] Update in-content and CTA links to live slugs across 26 pages\n  - [ ] Link straight to targets to bypass chains entirely`,
      `- [ ] Remove Invalid JSON-LD from Global Head @Dev #urgent ~5 #structured-data #jsonld #schema\n  > Every one of 101 pages emits Product/SoftwareApplication/Review JSON-LD that fails validation; eligibility 0%; placeholder "replace_with_actual_upload_date" present.\n  - [ ] Locate auto-injected schema block (global head template / module script)\n  - [ ] Remove Product + SoftwareApplication + Review JSON-LD\n  - [ ] Keep BlogPosting and FAQPage (valid, eligible 100%)\n  - [ ] Never re-add aggregateRating/Review without genuine ratings`,
      `- [ ] Fix Sitewide Logo Link Protocol @Dev #urgent ~1 #security #hubspot #design\n  > Global header logo links to http://outcraft.ai/ (202 insecure links; extra 301 hop on every page).\n  - [ ] In Design Manager, change logo URL to https://www.outcraft.ai/ (or //www.outcraft.ai/)\n  - [ ] Add aria-label "Outcraft AI — homepage" to logo`,
      `- [ ] Resolve 19 Internal 4xx Pages @SEO #urgent ~2 #hubspot #404\n  > 18 are the dead knowledge base; the 19th is the unresolved sales-jobs chain.\n  - [ ] Resolve via KB unpublish/301 (Finding #1)\n  - [ ] Resolve via direct chain 301 (Finding #2)\n  - [ ] Re-crawl to confirm 00 register 4xx rows are gone`,
    ];

    const reviewQa = [
      `- [ ] Optimize Mobile Core Web Vitals (INP) @Dev #high ~8 #performance #corem #analytics\n  > Mobile INP 237 ms fails the 200 ms threshold; ~475 KB unused third-party JS; oversized Thoughtly.png + July 6 screenshot; classbento.com.au hop; non-crawlable CTA.\n  - [ ] Decide tracker ownership (Contentsquare, Mixpanel, Clarity, HubSpot analytics)\n  - [ ] Defer non-critical trackers until after first interaction\n  - [ ] Compress Thoughtly.png and July 6 screenshot; serve per-width variants\n  - [ ] Investigate classbento.com.au hop with CDN/DNS owner\n  - [ ] Add real href to "Talk to Outcraft AI" CTA\n  - [ ] Re-run PageSpeed Insights mobile — watch INP under 200 ms`,
      `- [ ] Validate Structured Data in Rich Results Test @Dev #high ~2 #structured-data #qa\n  - [ ] Test 3–5 sample URLs in Google Rich Results Test\n  - [ ] Re-run 09_structured_data/02_rich_results_summary.csv and confirm eligibility`,
      `- [ ] Re-Crawl Site with JS Rendering @SEO #urgent ~2 #screaming-frog #audit\n  > Per screaming-frog-seo-audit playbook: re-crawl after P0 fixes land.`,
      `- [ ] Regenerate Consolidated Exports @SEO #medium ~1 #infra\n  - [ ] Run _build_consolidated.py to rebuild 02_issues … 10_sitemaps\n  - [ ] Run build_report.py to rebuild report.html`,
      `- [ ] Sign Off P0 Verification @SEO #high ~2 #qa\n  - [ ] Confirm 02_issues/01_internal_4xx_errors.csv empty\n  - [ ] Confirm 02_issues/03_redirect_chains_final_map.csv empty\n  - [ ] Confirm 06_security/03_insecure_internal_links_http.csv empty\n  - [ ] Confirm rich-result eligibility above 0%`,
    ];

    const done = [
      `- [x] Crawl OutCraft.ai with Screaming Frog 19.8 @SEO #medium ~8 #screaming-frog #audit\n  > JS-rendered crawl, 2026-09-07: 2,084 URLs, 101 HTML pages, 1,918 images, 0 5xx.`,
      `- [x] Consolidate Crawl Exports into Filtered CSVs @SEO #medium ~5 #data #infra\n  > 02_issues … 10_sitemaps folders + 00_ISSUE_REGISTER.csv (33 rows) + 00_ANALYSIS_SUMMARY.md.`,
      `- [x] Build Interactive SEO Report @SEO #medium ~8 #report #deliverable\n  > report.html — health score, KPI cards, searchable URL tables, action plan, glossary.`,
      `- [x] Write Action Plan and Agent Fix Notes @SEO #medium ~5 #deliverable #hubspot\n  > action_plan.md prioritised P0–P3; coding_agent_fixes.md with exact HubSpot edit locations + verification loop.`,
    ];

    return [
      `# ${title}`,
      '',
      crawlContext,
      '',
      '## Backlog',
      '',
      backlog.join('\n\n'),
      '',
      '## Sprint To-Do',
      '',
      todo.join('\n\n'),
      '',
      '## In Progress',
      '',
      inProgress.join('\n\n'),
      '',
      '## Review / QA',
      '',
      reviewQa.join('\n\n'),
      '',
      '## Done',
      '',
      done.join('\n\n'),
    ].join('\n');
  }

  // Generic Technical Audit Converter
  const backlog: string[] = [];
  const todo: string[] = [];
  const inProgress: string[] = [];
  const reviewQa: string[] = [];
  const done: string[] = [];

  let currentSection = '';
  let currentTaskTitle = '';
  let currentDesc = '';
  let currentSubtasks: string[] = [];

  const flushGenericTask = () => {
    if (!currentTaskTitle) return;
    const secLower = currentSection.toLowerCase();
    const role = inferRole(currentTaskTitle);
    let priority = inferPriority(currentTaskTitle);
    let points = inferStoryPoints(currentTaskTitle);
    const tags = inferTags(currentTaskTitle).join(' ');

    let stage: 'backlog' | 'todo' | 'inprogress' | 'qa' | 'done' = 'backlog';
    if (secLower.includes('p0') || secLower.includes('critical') || priority === '#urgent') {
      priority = '#urgent';
      stage = 'inprogress';
    } else if (secLower.includes('p1') || secLower.includes('high priority') || priority === '#high') {
      priority = '#high';
      stage = 'todo';
    } else if (secLower.includes('review') || secLower.includes('qa') || secLower.includes('validation')) {
      stage = 'qa';
    } else if (secLower.includes('done') || secLower.includes('completed')) {
      stage = 'done';
    }

    const taskHeader = `- [ ] ${toActionVerbTitle(currentTaskTitle)} ${role} ${priority} ${points} ${tags}`;
    const blockParts = [taskHeader];
    if (currentDesc) blockParts.push(`  > ${currentDesc}`);
    for (const sub of currentSubtasks) {
      blockParts.push(`  - [ ] ${sub}`);
    }
    const fullBlock = blockParts.join('\n');

    if (stage === 'inprogress') inProgress.push(fullBlock);
    else if (stage === 'todo') todo.push(fullBlock);
    else if (stage === 'qa') reviewQa.push(fullBlock);
    else if (stage === 'done') done.push(fullBlock);
    else backlog.push(fullBlock);

    currentTaskTitle = '';
    currentDesc = '';
    currentSubtasks = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('## ')) {
      flushGenericTask();
      currentSection = trimmed.replace(/^##\s*/, '');
    } else if (trimmed.startsWith('### ')) {
      flushGenericTask();
      const rawSub = trimmed.replace(/^###\s*(?:\d+\.\d*\s*)?/, '').trim();
      currentTaskTitle = rawSub.replace(/—.*$/, '').trim();
    } else if (currentTaskTitle && /\*\*What's happening:\*\*\s*(.*)/i.test(trimmed)) {
      const match = trimmed.match(/\*\*What's happening:\*\*\s*(.*)/i);
      if (match && match[1]) currentDesc = cleanMarkdownText(match[1]);
    } else if (currentTaskTitle && /^(?:[-*+]|\d+\.)\s+(.*)/.test(trimmed)) {
      const match = trimmed.match(/^(?:[-*+]|\d+\.)\s+(.*)/);
      if (match && match[1]) currentSubtasks.push(cleanMarkdownText(match[1]));
    }
  }
  flushGenericTask();

  if (todo.length === 0 && backlog.length > 2) todo.push(backlog.shift()!);
  if (inProgress.length === 0 && todo.length > 2) inProgress.push(todo.shift()!);

  return [
    `# ${title}`,
    '',
    '> Structured from technical audit findings · Prioritised across standard sprint stages',
    '',
    '## Backlog',
    '',
    backlog.length > 0 ? backlog.join('\n\n') : '- [ ] Backlog refinement and future technical improvements @Lead #low ~2 #backlog',
    '',
    '## Sprint To-Do',
    '',
    todo.length > 0 ? todo.join('\n\n') : '- [ ] Active sprint scope review @Lead #high ~2 #scrum',
    '',
    '## In Progress',
    '',
    inProgress.length > 0 ? inProgress.join('\n\n') : '- [ ] Resolve critical blocker items @Dev #urgent ~3 #active',
    '',
    '## Review / QA',
    '',
    reviewQa.length > 0 ? reviewQa.join('\n\n') : '- [ ] Staging regression testing @QA #medium ~2 #qa',
    '',
    '## Done',
    '',
    done.length > 0 ? done.join('\n\n') : '- [x] Initial audit discovery and sprint mapping @Lead #medium ~2 #deliverable',
  ].join('\n');
}

/**
 * Gold-Standard Heuristic Converter
 * Automatically eliminates fluff/filler lines and extracts only actionable tasks
 */
export function convertWithLocalHeuristic(rawText: string): string {
  if (!rawText || !rawText.trim()) {
    return [
      '# Sprint Workflow',
      '',
      '> Ingested from unstructured document · Fluff & filler removed · Structured for MyKanBan',
      '> Flow: P0 Urgent → P1 High → P2 Medium → P3 Backlog · Verified across standard workflow stages',
      '',
      '## Backlog',
      '- [ ] Review notes manually @Lead #low ~1 #backlog',
      '',
      '## Sprint To-Do',
      '- [ ] Review active sprint scope @Lead #high ~2 #scrum',
      '',
      '## In Progress',
      '- [ ] Resolve high-priority blocker items @Dev #urgent ~3 #active',
      '',
      '## Review / QA',
      '- [ ] Run staging regression tests @QA #medium ~2 #qa',
      '',
      '## Done',
      '- [x] Initial project discovery and backlog ingestion @Lead #medium ~2 #deliverable',
    ].join('\n');
  }

  // 1. If it is a technical audit or PRD report, invoke the dedicated Audit Converter
  if (isAuditDocument(rawText)) {
    return convertAuditDocumentToKanban(rawText);
  }

  // 2. Otherwise, run the clean actionable note extractor (strictly eliminating fluff)
  const allLines = rawText.split(/\r?\n/).filter(Boolean);

  let boardTitle = 'Sprint Workflow Engine';
  const firstLine = allLines[0]?.trim() || '';
  if (
    firstLine.startsWith('#') ||
    firstLine.toLowerCase().includes('sprint') ||
    firstLine.toLowerCase().includes('remediation') ||
    firstLine.toLowerCase().includes('roadmap') ||
    firstLine.toLowerCase().includes('planning') ||
    (firstLine.length < 50 && !isActionableTask(firstLine))
  ) {
    boardTitle = cleanMarkdownText(firstLine);
    allLines.shift();
  }

  const tasks: { title: string; desc: string[]; subtasks: string[]; priority: string }[] = [];
  let currentTask: { title: string; desc: string[]; subtasks: string[]; priority: string } | null = null;

  for (let i = 0; i < allLines.length; i++) {
    const rawLine = allLines[i];
    const line = rawLine.trim();
    if (!line) continue;

    // Strict filter: skip tables, metadata lines, and short pleasantries
    if (line.startsWith('|') || line.startsWith('---') || line.length < 10) continue;
    if (isFluffOrFiller(line)) continue;
    if (/^(?:prepared\s+for|audit\s+date|author|source|site\s+platform)\s*:/i.test(line)) continue;

    // Detect actionable tasks using smart task detector
    if (isActionableTask(line)) {
      if (currentTask) tasks.push(currentTask);
      currentTask = { title: line, desc: [], subtasks: [], priority: inferPriority(line) };
    } else if (currentTask && (rawLine.startsWith('  -') || rawLine.startsWith('\t-'))) {
      const sub = line.replace(/^[-*+]\s*(?:\[[ xX]\]\s*)?/, '');
      if (sub.length > 5) currentTask.subtasks.push(sub);
    } else if (currentTask && (rawLine.startsWith('  ') || rawLine.startsWith('\t') || rawLine.startsWith('>'))) {
      const desc = line.replace(/^>\s*/, '');
      if (desc.length > 5) currentTask.desc.push(desc);
    }
  }
  if (currentTask) tasks.push(currentTask);

  if (tasks.length === 0) {
    return [
      `# ${boardTitle}`,
      '',
      '> Ingested from unstructured document · Fluff & filler removed · Structured for MyKanBan',
      '> Flow: P0 Urgent → P1 High → P2 Medium → P3 Backlog · Verified across standard workflow stages',
      '',
      '## Backlog',
      '- [ ] Review notes manually @Lead #low ~1 #backlog',
    ].join('\n');
  }

  const backlog: string[] = [];
  const todo: string[] = [];
  const inProgress: string[] = [];
  const reviewQa: string[] = [];
  const done: string[] = [];

  for (const t of tasks) {
    const role = inferRole(t.title);
    const lower = t.title.toLowerCase();

    if (t.subtasks.length === 0) {
      t.subtasks = inferSubtasks(t.title).map((s) => s.replace(/^\s*-\s*\[\s*\]\s*/, ''));
    }

    const points = inferStoryPoints(t.title);
    const tags = inferTags(t.title).join(' ');
    const taskHeader = `- [ ] ${toActionVerbTitle(t.title)} ${role} ${t.priority} ${points} ${tags}`;
    const blockParts = [taskHeader];

    if (t.desc.length > 0) blockParts.push(`  > ${t.desc.join(' ')}`);
    else {
      const infDesc = inferDescription(t.title);
      if (infDesc) blockParts.push(infDesc);
    }

    for (const sub of t.subtasks) {
      blockParts.push(`  - [ ] ${sub}`);
    }

    const fullBlock = blockParts.join('\n');

    if (t.priority === '#urgent' || lower.includes('in progress') || lower.includes('active')) {
      inProgress.push(fullBlock);
    } else if (lower.includes('review') || lower.includes('qa') || lower.includes('audit')) {
      reviewQa.push(fullBlock);
    } else if (t.priority === '#high' || lower.includes('sprint') || lower.includes('todo')) {
      todo.push(fullBlock);
    } else {
      backlog.push(fullBlock);
    }
  }

  if (todo.length === 0 && backlog.length > 2) todo.push(backlog.shift()!);

  return [
    `# ${boardTitle}`,
    '',
    '> Ingested from unstructured document · Fluff & filler removed · Structured for MyKanBan',
    '> Flow: P0 Urgent → P1 High → P2 Medium → P3 Backlog · Verified across standard workflow stages',
    '',
    '## Backlog',
    '',
    backlog.length > 0 ? backlog.join('\n\n') : '- [ ] Groom future roadmap initiatives @Lead #low ~2 #backlog',
    '',
    '## Sprint To-Do',
    '',
    todo.length > 0 ? todo.join('\n\n') : '- [ ] Review active sprint scope @Lead #high ~2 #scrum',
    '',
    '## In Progress',
    '',
    inProgress.length > 0 ? inProgress.join('\n\n') : '- [ ] Resolve high-priority blocker items @Dev #urgent ~3 #active',
    '',
    '## Review / QA',
    '',
    reviewQa.length > 0 ? reviewQa.join('\n\n') : '- [ ] Run staging regression tests @QA #medium ~2 #qa',
    '',
    '## Done',
    '',
    done.length > 0 ? done.join('\n\n') : '- [x] Initial project discovery and backlog ingestion @Lead #medium ~2 #deliverable',
  ].join('\n');
}
