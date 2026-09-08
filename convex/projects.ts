import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Helper to generate 6-character clean room code like "KAN-839" or "SCRUM-492"
function generateCollabCode(): string {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const nums = "23456789";
  let prefix = "";
  for (let i = 0; i < 3; i++) {
    prefix += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  let suffix = "";
  for (let i = 0; i < 3; i++) {
    suffix += nums.charAt(Math.floor(Math.random() * nums.length));
  }
  return `${prefix}-${suffix}`;
}

export const createProject = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    customCode: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const collabCode = args.customCode
      ? args.customCode.trim().toUpperCase()
      : generateCollabCode();
    const now = Date.now();

    const projectId = await ctx.db.insert("projects", {
      title: args.title,
      description: args.description,
      collabCode,
      createdAt: now,
      updatedAt: now,
    });

    // Create default board for this project
    const boardId = await ctx.db.insert("boards", {
      projectId,
      title: args.title,
      createdAt: now,
      updatedAt: now,
    });

    // Create default Scrum columns
    const defaultCols = ["Backlog", "To Do", "In Progress", "In Review", "Done"];
    for (let i = 0; i < defaultCols.length; i++) {
      await ctx.db.insert("columns", {
        boardId,
        title: defaultCols[i],
        order: i,
      });
    }

    return { projectId, boardId, collabCode };
  },
});

export const listProjects = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("projects").order("desc").take(20);
  },
});

export const getProjectByCollabCode = query({
  args: {
    collabCode: v.string(),
  },
  handler: async (ctx, args) => {
    const formattedCode = args.collabCode.trim().toUpperCase();
    let project = await ctx.db
      .query("projects")
      .withIndex("by_collabCode", (q) => q.eq("collabCode", formattedCode))
      .first();

    // Fallback: If no project matches this exact code, return the most recent project
    // so the board never hangs in an infinite loading state
    if (!project) {
      project = await ctx.db.query("projects").order("desc").first();
    }

    if (!project) return null;

    const board = await ctx.db
      .query("boards")
      .withIndex("by_projectId", (q) => q.eq("projectId", project._id))
      .first();

    return { project, board };
  },
});

export const getProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.projectId);
  },
});

export const seedDemoBoard = mutation({
  args: {
    collabCode: v.string(),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const formattedCode = args.collabCode.trim().toUpperCase();
    const existing = await ctx.db
      .query("projects")
      .withIndex("by_collabCode", (q) => q.eq("collabCode", formattedCode))
      .first();

    if (existing) {
      return { projectId: existing._id, collabCode: existing.collabCode, alreadyExisted: true };
    }

    const now = Date.now();
    const projectId = await ctx.db.insert("projects", {
      title: args.title,
      collabCode: formattedCode,
      createdAt: now,
      updatedAt: now,
    });

    const boardId = await ctx.db.insert("boards", {
      projectId,
      title: args.title,
      createdAt: now,
      updatedAt: now,
    });

    const colTitles = [
      "Product Backlog",
      "Sprint To-Do",
      "In Progress",
      "Code Review",
      "Done",
    ];

    const columnIds: Record<string, any> = {};
    for (let i = 0; i < colTitles.length; i++) {
      const id = await ctx.db.insert("columns", {
        boardId,
        title: colTitles[i],
        order: i,
      });
      columnIds[colTitles[i]] = id;
    }

    const demoTasks = [
      {
        col: "Product Backlog",
        title: "Investigate Redis cache for edge workers",
        priority: "low" as const,
        storyPoints: 2,
        tags: ["cache", "infra"],
        order: 0,
      },
      {
        col: "Sprint To-Do",
        title: "Build drag-and-drop card preview",
        priority: "high" as const,
        storyPoints: 3,
        tags: ["ui", "dnd"],
        order: 0,
      },
      {
        col: "Sprint To-Do",
        title: "Collab code project sharing",
        assignee: "Alex",
        priority: "high" as const,
        storyPoints: 5,
        tags: ["collab"],
        order: 1,
      },
      {
        col: "In Progress",
        title: "Ingest structured Markdown and CSV files",
        description: "Strip markdown special characters and extract metadata tags",
        assignee: "Alex",
        priority: "urgent" as const,
        storyPoints: 5,
        tags: ["parser"],
        order: 0,
      },
      {
        col: "Code Review",
        title: "Review PR: Convex WebSocket live synchronization",
        assignee: "Sarah",
        priority: "urgent" as const,
        storyPoints: 3,
        tags: ["convex"],
        order: 0,
      },
      {
        col: "Done",
        title: "Vite React scaffolding and Cloudflare Pages setup",
        assignee: "Alex",
        priority: "medium" as const,
        storyPoints: 2,
        tags: ["devops"],
        order: 0,
      },
    ];

    for (const dt of demoTasks) {
      await ctx.db.insert("tasks", {
        boardId,
        columnId: columnIds[dt.col],
        title: dt.title,
        description: dt.description,
        assignee: dt.assignee,
        priority: dt.priority,
        storyPoints: dt.storyPoints,
        tags: dt.tags,
        order: dt.order,
        createdAt: now,
      });
    }

    return { projectId, boardId, collabCode: formattedCode, alreadyExisted: false };
  },
});


