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

const SYSTEM_PROMPT = `You are the MyKanBan Agile Architect & Workflow Engine.
Your task is to take any raw notes, task lists, PRD, or messy bullet points and convert them into the clean "MyKanBan Native Markdown" format.

TARGET FORMAT RULES:
1. First line must be "# Board Title"
2. Column headers must be "## Column Title" (e.g., "## Backlog", "## Sprint To-Do", "## In Progress", "## Review / QA", "## Done")
3. Tasks must be checklist bullets:
   - [ ] Clean Actionable Title @Assignee #Priority ~StoryPoints #Tag1 #Tag2
4. Priorities: only #urgent, #high, #medium, #low.
5. Story points: Fibonacci numbers ~1, ~2, ~3, ~5, ~8.
6. Multi-line descriptions must be indented 2 spaces with "> "
7. Subtasks must be indented 2 spaces with "- [ ] " or "- [x] "
8. Do NOT use markdown bold (**) or code backticks inside task titles. Keep them clean and readable.

Return ONLY the raw markdown content without enclosing backticks, greetings, or explanations.`;

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
      // Not on Pages or proxy failed
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

/**
 * Smart local heuristic converter that works 100% offline with zero dependencies.
 * Used as an instant backup when remote credits are depleted or offline.
 */
export function convertWithLocalHeuristic(rawText: string): string {
  const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return '# Imported Board\n\n## To Do\n';

  let boardTitle = 'Imported Sprint Board';
  const firstLine = lines[0];
  if (firstLine.startsWith('#') || firstLine.toLowerCase().includes('sprint') || firstLine.length < 40) {
    boardTitle = cleanMarkdownText(firstLine);
  }

  const backlogTasks: string[] = [];
  const todoTasks: string[] = [];
  const inProgressTasks: string[] = [];
  const doneTasks: string[] = [];

  let currentCategory = 'todo';

  for (const line of lines) {
    const lower = line.toLowerCase();

    // Stage boundary detection
    if (lower.includes('backlog') || lower.includes('icebox') || lower.includes('future')) {
      currentCategory = 'backlog';
      continue;
    }
    if (lower.includes('progress') || lower.includes('doing') || lower.includes('working')) {
      currentCategory = 'progress';
      continue;
    }
    if (lower.includes('done') || lower.includes('completed') || lower.includes('finished')) {
      currentCategory = 'done';
      continue;
    }
    if (lower.includes('todo') || lower.includes('to do') || lower.includes('sprint')) {
      currentCategory = 'todo';
      continue;
    }

    // Skip top title
    if (line === firstLine && line.startsWith('#')) continue;

    // Clean task title
    const cleanTitle = cleanMarkdownText(line);
    if (!cleanTitle || cleanTitle.length < 2) continue;

    // Infer priority
    let priorityTag = '';
    if (lower.includes('urgent') || lower.includes('critical') || lower.includes('asap') || lower.includes('blocker')) {
      priorityTag = ' #urgent';
    } else if (lower.includes('high') || lower.includes('important')) {
      priorityTag = ' #high';
    } else if (lower.includes('low') || lower.includes('nice to have')) {
      priorityTag = ' #low';
    }

    // Infer points
    let pointsTag = ' ~3';
    const pointsMatch = line.match(/\b(\d+)\s*(?:pts?|sp|points?)\b/i);
    if (pointsMatch) {
      pointsTag = ` ~${pointsMatch[1]}`;
    }

    // Infer assignee
    let assigneeTag = '';
    const assigneeMatch = line.match(/@([a-zA-Z0-9_-]+)|(?:assigned to|owner:)\s*([a-zA-Z0-9_-]+)/i);
    if (assigneeMatch) {
      assigneeTag = ` @${assigneeMatch[1] || assigneeMatch[2]}`;
    }

    const taskLine = `- [ ] ${cleanTitle}${assigneeTag}${priorityTag}${pointsTag}`;

    if (currentCategory === 'backlog') backlogTasks.push(taskLine);
    else if (currentCategory === 'progress') inProgressTasks.push(taskLine);
    else if (currentCategory === 'done') doneTasks.push(taskLine.replace('- [ ]', '- [x]'));
    else todoTasks.push(taskLine);
  }

  let out = `# ${boardTitle}\n\n`;

  if (backlogTasks.length > 0) {
    out += `## Backlog\n${backlogTasks.join('\n')}\n\n`;
  }

  out += `## Sprint To-Do\n${(todoTasks.length > 0 ? todoTasks : ['- [ ] Review sprint backlog ~1']).join('\n')}\n\n`;

  if (inProgressTasks.length > 0) {
    out += `## In Progress\n${inProgressTasks.join('\n')}\n\n`;
  }

  if (doneTasks.length > 0) {
    out += `## Done\n${doneTasks.join('\n')}\n\n`;
  }

  return out.trim();
}
