import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Record an analytics event
export const recordEvent = mutation({
  args: {
    adId: v.id("advertisements"),
    repositoryId: v.id("repositories"),
    eventType: v.union(v.literal("impression"), v.literal("click"), v.literal("conversion")),
    userAgent: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
    referrer: v.optional(v.string()),
    metadata: v.optional(v.object({
      country: v.optional(v.string()),
      device: v.optional(v.string()),
      browser: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const eventId = await ctx.db.insert("analytics", {
      ...args,
      timestamp: Date.now(),
    });

    return eventId;
  },
});

// Get analytics for an advertisement
export const getAnalyticsByAd = query({
  args: {
    adId: v.id("advertisements"),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("analytics")
      .withIndex("by_ad", (q) => q.eq("adId", args.adId));

    const events = await query.collect();

    // Filter by date range if provided
    const filteredEvents = events.filter(event => {
      if (args.startDate && event.timestamp < args.startDate) return false;
      if (args.endDate && event.timestamp > args.endDate) return false;
      return true;
    });

    // Aggregate data
    const impressions = filteredEvents.filter(e => e.eventType === "impression").length;
    const clicks = filteredEvents.filter(e => e.eventType === "click").length;
    const conversions = filteredEvents.filter(e => e.eventType === "conversion").length;

    return {
      impressions,
      clicks,
      conversions,
      ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
      conversionRate: clicks > 0 ? (conversions / clicks) * 100 : 0,
      events: filteredEvents,
    };
  },
});

// Get analytics for a repository
export const getAnalyticsByRepository = query({
  args: {
    repositoryId: v.id("repositories"),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("analytics")
      .withIndex("by_repository", (q) => q.eq("repositoryId", args.repositoryId));

    const events = await query.collect();

    // Filter by date range if provided
    const filteredEvents = events.filter(event => {
      if (args.startDate && event.timestamp < args.startDate) return false;
      if (args.endDate && event.timestamp > args.endDate) return false;
      return true;
    });

    // Aggregate data
    const impressions = filteredEvents.filter(e => e.eventType === "impression").length;
    const clicks = filteredEvents.filter(e => e.eventType === "click").length;
    const conversions = filteredEvents.filter(e => e.eventType === "conversion").length;

    return {
      impressions,
      clicks,
      conversions,
      ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
      conversionRate: clicks > 0 ? (conversions / clicks) * 100 : 0,
      events: filteredEvents,
    };
  },
});

// Get daily analytics summary
export const getDailyAnalytics = query({
  args: {
    startDate: v.number(),
    endDate: v.number(),
    adId: v.optional(v.id("advertisements")),
    repositoryId: v.optional(v.id("repositories")),
  },
  handler: async (ctx, args) => {
    let events;

    if (args.adId) {
      events = await ctx.db
        .query("analytics")
        .withIndex("by_ad", (q) => q.eq("adId", args.adId))
        .collect();
    } else if (args.repositoryId) {
      events = await ctx.db
        .query("analytics")
        .withIndex("by_repository", (q) => q.eq("repositoryId", args.repositoryId))
        .collect();
    } else {
      events = await ctx.db.query("analytics").collect();
    }

    // Filter by date range
    const filteredEvents = events.filter(event => 
      event.timestamp >= args.startDate && event.timestamp <= args.endDate
    );

    // Group by day
    const dailyData: Record<string, { impressions: number; clicks: number; conversions: number }> = {};

    filteredEvents.forEach(event => {
      const date = new Date(event.timestamp).toISOString().split('T')[0];
      if (!dailyData[date]) {
        dailyData[date] = { impressions: 0, clicks: 0, conversions: 0 };
      }
      dailyData[date][event.eventType]++;
    });

    return Object.entries(dailyData).map(([date, data]) => ({
      date,
      ...data,
      ctr: data.impressions > 0 ? (data.clicks / data.impressions) * 100 : 0,
    }));
  },
});

