import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Create a payment record
export const createPayment = mutation({
  args: {
    userId: v.id("users"),
    type: v.union(v.literal("earning"), v.literal("payout"), v.literal("subscription")),
    amount: v.number(),
    currency: v.string(),
    status: v.union(v.literal("pending"), v.literal("completed"), v.literal("failed"), v.literal("cancelled")),
    stripePaymentIntentId: v.optional(v.string()),
    stripeTransferId: v.optional(v.string()),
    description: v.optional(v.string()),
    metadata: v.optional(v.object({
      adId: v.optional(v.id("advertisements")),
      repositoryId: v.optional(v.id("repositories")),
      period: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const paymentId = await ctx.db.insert("payments", {
      ...args,
      createdAt: Date.now(),
    });

    return paymentId;
  },
});

// Get payments by user
export const getPaymentsByUser = query({
  args: { 
    userId: v.id("users"),
    type: v.optional(v.union(v.literal("earning"), v.literal("payout"), v.literal("subscription"))),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("payments")
      .withIndex("by_user", (q) => q.eq("userId", args.userId));

    const payments = await query.collect();

    if (args.type) {
      return payments.filter(payment => payment.type === args.type);
    }

    return payments;
  },
});

// Update payment status
export const updatePaymentStatus = mutation({
  args: {
    paymentId: v.id("payments"),
    status: v.union(v.literal("pending"), v.literal("completed"), v.literal("failed"), v.literal("cancelled")),
    stripePaymentIntentId: v.optional(v.string()),
    stripeTransferId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { paymentId, ...updateData } = args;
    await ctx.db.patch(paymentId, {
      ...updateData,
      processedAt: Date.now(),
    });

    return paymentId;
  },
});

// Get user earnings summary
export const getUserEarnings = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const earnings = await ctx.db
      .query("payments")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const totalEarnings = earnings
      .filter(p => p.type === "earning" && p.status === "completed")
      .reduce((sum, p) => sum + p.amount, 0);

    const totalPayouts = earnings
      .filter(p => p.type === "payout" && p.status === "completed")
      .reduce((sum, p) => sum + p.amount, 0);

    const pendingEarnings = earnings
      .filter(p => p.type === "earning" && p.status === "pending")
      .reduce((sum, p) => sum + p.amount, 0);

    return {
      totalEarnings,
      totalPayouts,
      pendingEarnings,
      availableBalance: totalEarnings - totalPayouts,
    };
  },
});

// Create subscription
export const createSubscription = mutation({
  args: {
    userId: v.id("users"),
    stripeSubscriptionId: v.string(),
    plan: v.union(v.literal("pro"), v.literal("enterprise")),
    status: v.union(v.literal("active"), v.literal("cancelled"), v.literal("past_due"), v.literal("unpaid")),
    currentPeriodStart: v.number(),
    currentPeriodEnd: v.number(),
    cancelAtPeriodEnd: v.boolean(),
  },
  handler: async (ctx, args) => {
    const subscriptionId = await ctx.db.insert("subscriptions", {
      ...args,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return subscriptionId;
  },
});

// Get user subscription
export const getUserSubscription = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
  },
});

// Update subscription
export const updateSubscription = mutation({
  args: {
    subscriptionId: v.id("subscriptions"),
    status: v.optional(v.union(v.literal("active"), v.literal("cancelled"), v.literal("past_due"), v.literal("unpaid"))),
    currentPeriodStart: v.optional(v.number()),
    currentPeriodEnd: v.optional(v.number()),
    cancelAtPeriodEnd: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { subscriptionId, ...updateData } = args;
    await ctx.db.patch(subscriptionId, {
      ...updateData,
      updatedAt: Date.now(),
    });

    return subscriptionId;
  },
});

