import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  projects: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    collabCode: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_collabCode", ["collabCode"]),

  boards: defineTable({
    projectId: v.id("projects"),
    title: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_projectId", ["projectId"]),

  columns: defineTable({
    boardId: v.id("boards"),
    title: v.string(),
    order: v.number(),
    wipLimit: v.optional(v.number()),
  }).index("by_boardId", ["boardId"]),

  tasks: defineTable({
    boardId: v.id("boards"),
    columnId: v.id("columns"),
    title: v.string(),
    description: v.optional(v.string()),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("urgent")),
    storyPoints: v.optional(v.number()),
    assignee: v.optional(v.string()),
    tags: v.array(v.string()),
    subtasks: v.optional(
      v.array(
        v.object({
          id: v.string(),
          title: v.string(),
          completed: v.boolean(),
        })
      )
    ),
    order: v.number(),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index("by_boardId", ["boardId"])
    .index("by_columnId", ["columnId"]),

  collaborators: defineTable({
    projectId: v.id("projects"),
    userId: v.string(),
    name: v.string(),
    avatarColor: v.string(),
    lastActive: v.number(),
  }).index("by_projectId", ["projectId"]),
});
