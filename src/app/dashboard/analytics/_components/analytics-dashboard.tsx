'use client'

import { MetricsGrid } from "@/components/features/analytics/metrics-grid"
import { AnalyticsChart } from "@/components/features/analytics/analytics-chart"
import { AnalyticsData } from "@/types/analytics"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface AnalyticsDashboardProps {
  data: AnalyticsData
}

export function AnalyticsDashboard({ data }: AnalyticsDashboardProps) {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Analytics</h2>
          <p className="text-muted-foreground">
            Track your monetization performance
          </p>
        </div>
        <Select defaultValue="week">
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="day">Last 24 hours</SelectItem>
            <SelectItem value="week">Last 7 days</SelectItem>
            <SelectItem value="month">Last 30 days</SelectItem>
            <SelectItem value="year">Last 12 months</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <MetricsGrid
        data={{
          views: data.views,
          clicks: data.clicks,
          conversions: data.conversions,
          revenue: data.revenue
        }}
      />

      <div className="grid gap-6">
        <AnalyticsChart
          data={data.dailyData}
          metrics={['views', 'clicks', 'conversions', 'revenue']}
        />
      </div>
    </div>
  )
} 