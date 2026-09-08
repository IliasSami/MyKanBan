import { action } from "./_generated/server";
import { v } from "convex/values";

const GOLD_STANDARD_SYSTEM_PROMPT = `You are the Chief Agile Architect & Lead Technical Workflow Engine for MyKanBan.
Your role is to transform any unstructured text, audit report, meeting minutes, technical spec, or task list into the gold-standard MyKanBan Native Markdown format.

### TARGET OUTPUT SPECIFICATION:

1. **Board Title & Sprint Context**:
   - Line 1: '# <Project / Sprint Title>'
   - Followed immediately by 1-2 blockquote lines starting with '> ' specifying context, audit source, or sprint rules:
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
     NO markdown bold (**), NO italics (*), NO code ticks (\`). Keep text clean and readable.
   - **Assignee / Role**: Infer appropriate technical role:
     @Dev, @Content, @DevOps, @SEO, @QA, @Copy, @Design, @Lead, or specific name if mentioned.
   - **Priority**: Exactly one token: #urgent, #high, #medium, #low.
     (Urgent/P0/Broken -> #urgent, P1/High/Important -> #high, P2/Medium -> #medium, P3/Low/Minor -> #low).
   - **Story Points**: Fibonacci estimation prefixed with '~': ~1, ~2, ~3, ~5, ~8.
     (Trivial/quick -> ~1, Small -> ~2, Medium -> ~3, Large/Complex -> ~5, Epic/Deep -> ~8).
   - **Tags**: 2-5 relevant lowercase hashtags: e.g., #seo #links #accessibility #performance #cloudflare.

4. **Task Context & Rationale (Indented 2 spaces with '> ')**:
   Underneath complex tasks, add a blockquote line explaining the background, metrics, or reason:
     > 236 outlinks have no anchor text; 108 use non-descriptive text ("click here", "learn more").

5. **Actionable Subtask Checklist (Indented 2 spaces with '- [ ] ')**:
   Underneath tasks requiring multiple steps, acceptance criteria, or specific fixes, provide 2-4 concrete subtasks:
     - [ ] Audit rich-text content and CTA modules for empty anchors
     - [ ] Replace generic anchors with descriptive link labels
     - [ ] Add aria-labels to icon/CTA links

OUTPUT INSTRUCTIONS:
Return ONLY the raw Markdown text. Never include conversational preamble, apologies, or markdown code fence wrappers (\`\`\`markdown).`;

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
    const model = args.model || "glm-5.3-free";

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
          { role: "user", content: `Convert this document into MyKanBan Markdown:\n\n${args.rawContent}` },
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

    content = content.replace(/^```(?:markdown)?\s*\n?/i, "");
    content = content.replace(/\n?```\s*$/i, "");

    return content.trim();
  },
});
