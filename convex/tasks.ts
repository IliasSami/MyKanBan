import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const addTask = mutation({
  args: {
    boardId: v.id("boards"),
    columnId: v.id("columns"),
    title: v.string(),
    description: v.optional(v.string()),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("urgent")),
    storyPoints: v.optional(v.number()),
    assignee: v.optional(v.string()),
    tags: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("tasks")
      .withIndex("by_columnId", (q) => q.eq("columnId", args.columnId))
      .collect();

    const maxOrder = existing.reduce((max, t) => Math.max(max, t.order), -1);

    return await ctx.db.insert("tasks", {
      ...args,
      order: maxOrder + 1,
      createdAt: Date.now(),
    });
  },
});

export const updateTask = mutation({
  args: {
    taskId: v.id("tasks"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("urgent"))),
    storyPoints: v.optional(v.number()),
    assignee: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    subtasks: v.optional(
      v.array(
        v.object({
          id: v.string(),
          title: v.string(),
          completed: v.boolean(),
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    const { taskId, ...patch } = args;
    await ctx.db.patch(taskId, {
      ...patch,
      updatedAt: Date.now(),
    });
  },
});

export const moveTask = mutation({
  args: {
    taskId: v.id("tasks"),
    targetColumnId: v.id("columns"),
    newOrder: v.number(),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) return;

    await ctx.db.patch(args.taskId, {
      columnId: args.targetColumnId,
      order: args.newOrder,
      updatedAt: Date.now(),
    });
  },
});

export const deleteTask = mutation({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.taskId);
  },
});
