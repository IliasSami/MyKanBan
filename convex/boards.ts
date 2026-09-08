import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getBoardData = query({
  args: { boardId: v.id("boards") },
  handler: async (ctx, args) => {
    const board = await ctx.db.get(args.boardId);
    if (!board) return null;

    const columns = await ctx.db
      .query("columns")
      .withIndex("by_boardId", (q) => q.eq("boardId", args.boardId))
      .collect();
    columns.sort((a, b) => a.order - b.order);

    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_boardId", (q) => q.eq("boardId", args.boardId))
      .collect();
    tasks.sort((a, b) => a.order - b.order);

    return {
      board,
      columns,
      tasks,
    };
  },
});

export const addColumn = mutation({
  args: {
    boardId: v.id("boards"),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("columns")
      .withIndex("by_boardId", (q) => q.eq("boardId", args.boardId))
      .collect();

    const maxOrder = existing.reduce((max, c) => Math.max(max, c.order), -1);

    return await ctx.db.insert("columns", {
      boardId: args.boardId,
      title: args.title,
      order: maxOrder + 1,
    });
  },
});

export const updateColumn = mutation({
  args: {
    columnId: v.id("columns"),
    title: v.optional(v.string()),
    wipLimit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { columnId, ...patch } = args;
    await ctx.db.patch(columnId, patch);
  },
});

export const deleteColumn = mutation({
  args: {
    columnId: v.id("columns"),
  },
  handler: async (ctx, args) => {
    // Delete associated tasks
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_columnId", (q) => q.eq("columnId", args.columnId))
      .collect();

    for (const task of tasks) {
      await ctx.db.delete(task._id);
    }

    await ctx.db.delete(args.columnId);
  },
});

export const importBoardData = mutation({
  args: {
    boardId: v.id("boards"),
    columns: v.array(
      v.object({
        title: v.string(),
        tasks: v.array(
          v.object({
            title: v.string(),
            description: v.optional(v.string()),
            priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("urgent")),
            storyPoints: v.optional(v.number()),
            assignee: v.optional(v.string()),
            tags: v.array(v.string()),
          })
        ),
      })
    ),
    replaceExisting: v.boolean(),
  },
  handler: async (ctx, args) => {
    if (args.replaceExisting) {
      // Clear existing tasks and columns
      const existingTasks = await ctx.db
        .query("tasks")
        .withIndex("by_boardId", (q) => q.eq("boardId", args.boardId))
        .collect();
      for (const t of existingTasks) await ctx.db.delete(t._id);

      const existingCols = await ctx.db
        .query("columns")
        .withIndex("by_boardId", (q) => q.eq("boardId", args.boardId))
        .collect();
      for (const c of existingCols) await ctx.db.delete(c._id);
    }

    const now = Date.now();
    for (let cIdx = 0; cIdx < args.columns.length; cIdx++) {
      const colData = args.columns[cIdx];
      const columnId = await ctx.db.insert("columns", {
        boardId: args.boardId,
        title: colData.title,
        order: cIdx,
      });

      for (let tIdx = 0; tIdx < colData.tasks.length; tIdx++) {
        const taskData = colData.tasks[tIdx];
        await ctx.db.insert("tasks", {
          boardId: args.boardId,
          columnId,
          title: taskData.title,
          description: taskData.description,
          priority: taskData.priority,
          storyPoints: taskData.storyPoints,
          assignee: taskData.assignee,
          tags: taskData.tags,
          order: tIdx,
          createdAt: now,
        });
      }
    }
  },
});
