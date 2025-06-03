import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

interface AnalyticsEvent {
  _id: Id<"analytics">;
  _creationTime: number;
  adId: Id<"advertisements">;
  repositoryId: Id<"repositories">;
  eventType: 'impression' | 'click' | 'conversion';
  timestamp: number;
  // Add other fields as needed
}

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


    const query = ctx.db
      .query("analytics")
      .withIndex("by_ad", (q) => q.eq("adId", args.adId as Id<"advertisements">));

    const events = await query.collect() as AnalyticsEvent[];

    // Filter by date range if provided
    const filteredEvents = events.filter((event) => {
      if (args.startDate && event.timestamp < args.startDate) return false;
      if (args.endDate && event.timestamp > args.endDate) return false;
      return true;
    });

    // Aggregate data
    const impressions = filteredEvents.filter((e: any) => e.eventType === "impression").length;
    const clicks = filteredEvents.filter((e: any) => e.eventType === "click").length;
    const conversions = filteredEvents.filter((e: any) => e.eventType === "conversion").length;

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
    const query = ctx.db
      .query("analytics")
      .withIndex("by_repository", (q) => q.eq("repositoryId", args.repositoryId as Id<"repositories">));

    const events = await query.collect() as AnalyticsEvent[];

    // Filter by date range if provided
    const filteredEvents = events.filter((event) => {
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
        .withIndex("by_ad", (q) => q.eq("adId", args.adId as Id<"advertisements">))
        .collect();
    } else if (args.repositoryId) {
      events = await ctx.db
        .query("analytics")
        .withIndex("by_repository", (q) => q.eq("repositoryId", args.repositoryId as Id<"repositories">))
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

    // Type assertion for event type
    filteredEvents.forEach((event: AnalyticsEvent) => {
      const date = new Date(event.timestamp).toISOString().split('T')[0];
      if (!dailyData[date]) {
        dailyData[date] = { impressions: 0, clicks: 0, conversions: 0 };
      }
      if (event.eventType === 'impression') {
        dailyData[date].impressions++;
      } else if (event.eventType === 'click') {
        dailyData[date].clicks++;
      } else if (event.eventType === 'conversion') {
        dailyData[date].conversions++;
      }
    });

    return Object.entries(dailyData).map(([date, data]) => ({
      date,
      ...data,
      ctr: data.impressions > 0 ? (data.clicks / data.impressions) * 100 : 0,
    }));
  },
});

