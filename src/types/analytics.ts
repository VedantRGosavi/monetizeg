export interface AnalyticsMetric {
  value: number
  change: number
  trend: 'up' | 'down' | 'neutral'
}

export interface AnalyticsPeriod {
  start: Date
  end: Date
}

export interface DailyMetric {
  date: Date
  views: number
  clicks: number
  conversions: number
  revenue: number
}

export interface AnalyticsData {
  views: AnalyticsMetric
  clicks: AnalyticsMetric
  conversions: AnalyticsMetric
  revenue: AnalyticsMetric
  dailyData: DailyMetric[]
  period: AnalyticsPeriod
}

export interface AnalyticsFilter {
  period: 'day' | 'week' | 'month' | 'year'
  repositoryId?: string
  campaignId?: string
} 