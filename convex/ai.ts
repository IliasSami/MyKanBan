import { action } from "./_generated/server";
import { v } from "convex/values";

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

    const systemPrompt = `You are the MyKanBan Engine AI. Convert unstructured documents, meeting notes, PRDs, or task lists into native MyKanBan Markdown format.
Strict rules:
1. First line must be '# Project: <Clear Title>'
2. Organize into standard workflow stages using '## <Stage Name>' (e.g. ## Backlog, ## To Do, ## In Progress, ## Review, ## Done).
3. Format each task as '- [ ] Task Title @assignee #priority ~points #tags'
4. Output ONLY the raw Markdown without code fence blocks or commentary.`;

    const response = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
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
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("No response generated from AI model.");
    }

    return content;
  },
});
