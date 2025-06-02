import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Add a repository
export const addRepository = mutation({
  args: {
    userId: v.id("users"),
    githubId: v.number(),
    name: v.string(),
    fullName: v.string(),
    description: v.optional(v.string()),
    language: v.optional(v.string()),
    stars: v.number(),
    forks: v.number(),
    isPrivate: v.boolean(),
    defaultBranch: v.string(),
  },
  handler: async (ctx, args) => {
    const existingRepo = await ctx.db
      .query("repositories")
      .withIndex("by_github_id", (q) => q.eq("githubId", args.githubId))
      .first();

    if (existingRepo) {
      // Update existing repository
      await ctx.db.patch(existingRepo._id, {
        ...args,
        updatedAt: Date.now(),
      });
      return existingRepo._id;
    }

    // Create new repository
    const repoId = await ctx.db.insert("repositories", {
      ...args,
      isMonetized: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return repoId;
  },
});

// Get repositories by user
export const getRepositoriesByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("repositories")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

// Get monetized repositories
export const getMonetizedRepositories = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("repositories")
      .withIndex("by_monetized", (q) => q.eq("isMonetized", true))
      .collect();
  },
});

// Update repository monetization settings
export const updateRepositoryMonetization = mutation({
  args: {
    repositoryId: v.id("repositories"),
    isMonetized: v.boolean(),
    adPlacementConfig: v.optional(v.object({
      enabled: v.boolean(),
      maxAds: v.number(),
      placement: v.union(v.literal("top"), v.literal("middle"), v.literal("bottom")),
      categories: v.array(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const { repositoryId, ...updateData } = args;
    await ctx.db.patch(repositoryId, {
      ...updateData,
      updatedAt: Date.now(),
    });
    return repositoryId;
  },
});

// Delete repository
export const deleteRepository = mutation({
  args: { repositoryId: v.id("repositories") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.repositoryId);
  },
});

