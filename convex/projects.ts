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
  },
  handler: async (ctx, args) => {
    const collabCode = generateCollabCode();
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

export const getProjectByCollabCode = query({
  args: {
    collabCode: v.string(),
  },
  handler: async (ctx, args) => {
    const formattedCode = args.collabCode.trim().toUpperCase();
    const project = await ctx.db
      .query("projects")
      .withIndex("by_collabCode", (q) => q.eq("collabCode", formattedCode))
      .first();

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
