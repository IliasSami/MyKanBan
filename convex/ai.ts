import { action } from "./_generated/server";
import { v } from "convex/values";

const GOLD_STANDARD_SYSTEM_PROMPT = `You are the Chief Agile Architect & Lead Technical Workflow Engine for MyKanBan.
Your role is to transform unstructured text, meeting notes, audit reports, or task lists into the gold-standard MyKanBan Native Markdown format.

### CORE OBJECTIVE: EXTRACT ONLY ACTIONABLE WORK
1. **Remove Fluff & Filler**: Ignore pleasantries, generic discussion, background context that isn't actionable, and meaningless bullet points.
2. **Ensure Meaningful Tasks**: Every task must represent a distinct unit of work with a clear deliverable or outcome. Do not create tasks for vague statements like "discussed SEO" or "good meeting".

### TARGET OUTPUT SPECIFICATION:

1. **Board Title & Sprint Context**:
   - Line 1: '# <Project / Sprint Title>'
   - Followed immediately by 1-2 blockquote lines starting with '> ' specifying context, audit source, or sprint rules:
     Example:
     # OutCraft.ai Technical SEO Remediation — Sprint Workflow
     > Crawl: https://www.outcraft.ai/ · Screaming Frog 19.8 · 2026-09-07
     > Flow: P0 this week → P1 this month → P2 quarter

2. **Standard Workflow Stages (use Level 2 headers '##')**:
   Strictly distribute tasks into standard agile workflow stages:
   - ## Backlog (longer-term, research, improvements)
   - ## Sprint To-Do (active sprint scope, ready to pick up)
   - ## In Progress (underway items)
   - ## Review / QA (validation, testing)
   - ## Done (completed items)

3. **Task Line Anatomy (Strict Single Line)**:
   - Format: '- [ ] <Action Title> @<Assignee/Role> #<priority> ~<points> #<tag1> #<tag2> ...'
   
   RULES FOR TASK FIELDS:
   - **Action Verb Title**: MUST begin with a concise imperative action verb:
     e.g., Rewrite, Compress, Implement, Configure, Standardise, Resolve, Eliminate, Optimize, Fix.
     NO markdown bold (**), NO italics (*), NO code ticks (\`).
   - **Assignee / Role**: Infer appropriate technical role: @Dev, @Content, @DevOps, @SEO, @QA, @Design.
   - **Priority**: Exactly one token: #urgent, #high, #medium, #low.
   - **Story Points**: Fibonacci estimation prefixed with '~': ~1, ~2, ~3, ~5, ~8.
   - **Tags**: 2-5 relevant lowercase hashtags.

4. **Task Context & Rationale (Indented 2 spaces with '> ')**:
   Underneath complex tasks, add a blockquote line explaining the background or reason:
     > 236 outlinks have no anchor text; 108 use non-descriptive text.

5. **Actionable Subtask Checklist (Indented 2 spaces with '- [ ] ')**:
   Underneath tasks requiring multiple steps, provide 2-4 concrete subtasks:
     - [ ] Audit rich-text content for empty anchors
     - [ ] Replace generic anchors with descriptive link labels

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
  - [ ] Deploy to staging and test
</mykanban>
`;

export const convertWithNara = action({
  args: {
    rawContent: v.string(),
    model: v.optional(v.string()),
    apiKey: v.optional(v.string()),
    baseUrl: v.optional(v.string()),
  },
  handler: async (_ctx, args) => {
    const apiKey = args.apiKey || "sk-nry-fAxYIxRMbiWppJlEvjxt5nvnaB00eREpryEO_F_uqVY";
    const baseUrl = args.baseUrl || "https://router.bynara.id/v1";
    // Default to the powerful model for better reasoning
    const model = args.model || "mistral-large";

    const authHeader = apiKey.startsWith("Bearer ") ? apiKey : `Bearer ${apiKey}`;
    const targetUrl = `${baseUrl.replace(/\/+$/, "")}/chat/completions`;

    const response = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: GOLD_STANDARD_SYSTEM_PROMPT },
          { role: "user", content: `Analyze this document, remove fluff, extract meaningful tasks, and convert it into MyKanBan Markdown:\n\n${args.rawContent}` },
        ],
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      let msg = `Nara AI responded with status ${response.status}`;
      try {
        const json = JSON.parse(errText);
        if (json?.error?.message) {
          msg = json.error.message;
        }
      } catch {
        if (errText) msg = errText;
      }
      throw new Error(msg);
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("No response generated from AI model.");
    }

    // Extract content inside <mykanban> tags
    const match = content.match(/<mykanban>([\s\S]*?)<\/mykanban>/i);
    if (match && match[1]) {
      content = match[1];
    }

    content = content.replace(/^```(?:markdown)?\s*\n?/i, "");
    content = content.replace(/\n?```\s*$/i, "");

    return content.trim();
  },
});
