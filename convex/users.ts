import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Create a new user
export const createUser = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    githubUsername: v.optional(v.string()),
    githubId: v.optional(v.number()),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (existingUser) {
      return existingUser._id;
    }

    const userId = await ctx.db.insert("users", {
      ...args,
      plan: "free",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return userId;
  },
});

// Get user by Clerk ID
export const getUserByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();
  },
});

// Update user profile
export const updateUser = mutation({
  args: {
    clerkId: v.string(),
    name: v.optional(v.string()),
    githubUsername: v.optional(v.string()),
    githubId: v.optional(v.number()),
    avatarUrl: v.optional(v.string()),
    plan: v.optional(v.union(v.literal("free"), v.literal("pro"), v.literal("enterprise"))),
    stripeCustomerId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const { clerkId, ...updateData } = args;
    await ctx.db.patch(user._id, {
      ...updateData,
      updatedAt: Date.now(),
    });

    return user._id;
  },
});

// Get all users (admin only)
export const getAllUsers = query({
  handler: async (ctx) => {
    return await ctx.db.query("users").collect();
  },
});

