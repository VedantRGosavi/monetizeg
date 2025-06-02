import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Create a campaign
export const createCampaign = mutation({
  args: {
    advertiserId: v.id("users"),
    name: v.string(),
    description: v.optional(v.string()),
    budget: v.object({
      total: v.number(),
      dailyLimit: v.optional(v.number()),
    }),
    startDate: v.number(),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const campaignId = await ctx.db.insert("campaigns", {
      ...args,
      status: "draft",
      budget: {
        ...args.budget,
        spent: 0,
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return campaignId;
  },
});

// Get campaigns by advertiser
export const getCampaignsByAdvertiser = query({
  args: { advertiserId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("campaigns")
      .withIndex("by_advertiser", (q) => q.eq("advertiserId", args.advertiserId))
      .collect();
  },
});

// Create an advertisement
export const createAdvertisement = mutation({
  args: {
    campaignId: v.id("campaigns"),
    title: v.string(),
    description: v.string(),
    imageUrl: v.optional(v.string()),
    targetUrl: v.string(),
    callToAction: v.string(),
    targeting: v.object({
      languages: v.array(v.string()),
      minStars: v.number(),
      maxStars: v.optional(v.number()),
      categories: v.array(v.string()),
      geoTargeting: v.optional(v.array(v.string())),
    }),
    budget: v.object({
      type: v.union(v.literal("cpm"), v.literal("cpc")),
      amount: v.number(),
      dailyLimit: v.optional(v.number()),
      totalLimit: v.optional(v.number()),
    }),
  },
  handler: async (ctx, args) => {
    const adId = await ctx.db.insert("advertisements", {
      ...args,
      status: "draft",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return adId;
  },
});

// Get advertisements by campaign
export const getAdvertisementsByCampaign = query({
  args: { campaignId: v.id("campaigns") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("advertisements")
      .withIndex("by_campaign", (q) => q.eq("campaignId", args.campaignId))
      .collect();
  },
});

// Get active advertisements
export const getActiveAdvertisements = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("advertisements")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();
  },
});

// Update advertisement status
export const updateAdvertisementStatus = mutation({
  args: {
    adId: v.id("advertisements"),
    status: v.union(v.literal("draft"), v.literal("active"), v.literal("paused"), v.literal("completed")),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.adId, {
      status: args.status,
      updatedAt: Date.now(),
    });
    return args.adId;
  },
});

