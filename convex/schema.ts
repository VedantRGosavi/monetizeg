import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Users table - stores user information from Clerk
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    githubUsername: v.optional(v.string()),
    githubId: v.optional(v.number()),
    avatarUrl: v.optional(v.string()),
    plan: v.union(v.literal("free"), v.literal("pro"), v.literal("enterprise")),
    stripeCustomerId: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_email", ["email"])
    .index("by_github_username", ["githubUsername"]),

  // Repositories table - stores connected GitHub repositories
  repositories: defineTable({
    userId: v.id("users"),
    githubId: v.number(),
    name: v.string(),
    fullName: v.string(), // owner/repo
    description: v.optional(v.string()),
    language: v.optional(v.string()),
    stars: v.number(),
    forks: v.number(),
    isPrivate: v.boolean(),
    defaultBranch: v.string(),
    webhookId: v.optional(v.number()),
    isMonetized: v.boolean(),
    adPlacementConfig: v.optional(v.object({
      enabled: v.boolean(),
      maxAds: v.number(),
      placement: v.union(v.literal("top"), v.literal("middle"), v.literal("bottom")),
      categories: v.array(v.string()),
    })),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_github_id", ["githubId"])
    .index("by_full_name", ["fullName"])
    .index("by_monetized", ["isMonetized"]),

  // Advertisements table - stores ad content and metadata
  advertisements: defineTable({
    campaignId: v.id("campaigns"),
    title: v.string(),
    description: v.string(),
    imageUrl: v.optional(v.string()),
    targetUrl: v.string(),
    callToAction: v.string(),
    status: v.union(v.literal("draft"), v.literal("active"), v.literal("paused"), v.literal("completed")),
    targeting: v.object({
      languages: v.array(v.string()),
      minStars: v.number(),
      maxStars: v.optional(v.number()),
      categories: v.array(v.string()),
      geoTargeting: v.optional(v.array(v.string())),
    }),
    budget: v.object({
      type: v.union(v.literal("cpm"), v.literal("cpc")),
      amount: v.number(), // in cents
      dailyLimit: v.optional(v.number()),
      totalLimit: v.optional(v.number()),
    }),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_campaign", ["campaignId"])
    .index("by_status", ["status"]),

  // Campaigns table - groups advertisements and manages budgets
  campaigns: defineTable({
    advertiserId: v.id("users"),
    name: v.string(),
    description: v.optional(v.string()),
    status: v.union(v.literal("draft"), v.literal("active"), v.literal("paused"), v.literal("completed")),
    budget: v.object({
      total: v.number(), // in cents
      spent: v.number(), // in cents
      dailyLimit: v.optional(v.number()),
    }),
    startDate: v.number(),
    endDate: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_advertiser", ["advertiserId"])
    .index("by_status", ["status"]),

  // Ad Placements table - tracks where ads are placed
  adPlacements: defineTable({
    adId: v.id("advertisements"),
    repositoryId: v.id("repositories"),
    position: v.union(v.literal("top"), v.literal("middle"), v.literal("bottom")),
    isActive: v.boolean(),
    placedAt: v.number(),
    removedAt: v.optional(v.number()),
  })
    .index("by_ad", ["adId"])
    .index("by_repository", ["repositoryId"])
    .index("by_active", ["isActive"]),

  // Analytics table - tracks ad performance
  analytics: defineTable({
    adId: v.id("advertisements"),
    repositoryId: v.id("repositories"),
    eventType: v.union(v.literal("impression"), v.literal("click"), v.literal("conversion")),
    timestamp: v.number(),
    userAgent: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
    referrer: v.optional(v.string()),
    metadata: v.optional(v.object({
      country: v.optional(v.string()),
      device: v.optional(v.string()),
      browser: v.optional(v.string()),
    })),
  })
    .index("by_ad", ["adId"])
    .index("by_repository", ["repositoryId"])
    .index("by_event_type", ["eventType"])
    .index("by_timestamp", ["timestamp"]),

  // Payments table - tracks revenue and payouts
  payments: defineTable({
    userId: v.id("users"),
    type: v.union(v.literal("earning"), v.literal("payout"), v.literal("subscription")),
    amount: v.number(), // in cents
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
    createdAt: v.number(),
    processedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_type", ["type"])
    .index("by_status", ["status"])
    .index("by_created_at", ["createdAt"]),

  // Subscriptions table - manages user subscriptions
  subscriptions: defineTable({
    userId: v.id("users"),
    stripeSubscriptionId: v.string(),
    plan: v.union(v.literal("pro"), v.literal("enterprise")),
    status: v.union(v.literal("active"), v.literal("cancelled"), v.literal("past_due"), v.literal("unpaid")),
    currentPeriodStart: v.number(),
    currentPeriodEnd: v.number(),
    cancelAtPeriodEnd: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_stripe_id", ["stripeSubscriptionId"])
    .index("by_status", ["status"]),

  // Webhooks table - logs webhook events
  webhooks: defineTable({
    source: v.union(v.literal("github"), v.literal("stripe"), v.literal("clerk")),
    eventType: v.string(),
    payload: v.any(),
    processed: v.boolean(),
    error: v.optional(v.string()),
    createdAt: v.number(),
    processedAt: v.optional(v.number()),
  })
    .index("by_source", ["source"])
    .index("by_processed", ["processed"])
    .index("by_created_at", ["createdAt"]),
});

