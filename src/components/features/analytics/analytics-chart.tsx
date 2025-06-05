'use client'

import { DailyMetric } from "@/types/analytics"
import { Card } from "@/components/ui/card"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts"

interface AnalyticsChartProps {
  data: DailyMetric[]
  metrics?: ('views' | 'clicks' | 'conversions' | 'revenue')[]
}

const defaultMetrics: ('views' | 'clicks')[] = ['views', 'clicks']

const metricColors = {
  views: "#2563eb",
  clicks: "#16a34a",
  conversions: "#9333ea",
  revenue: "#ea580c"
} as const

const metricLabels = {
  views: "Views",
  clicks: "Clicks",
  conversions: "Conversions",
  revenue: "Revenue"
} as const

export function AnalyticsChart({ 
  data,
  metrics = defaultMetrics 
}: AnalyticsChartProps) {
  const formattedData = data.map(metric => ({
    ...metric,
    date: new Date(metric.date).toLocaleDateString(),
    revenue: typeof metric.revenue === 'number' ? `$${metric.revenue}` : metric.revenue
  }))

  return (
    <Card className="p-6">
      <div className="h-[400px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={formattedData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date"
              fontSize={12}
              tickLine={false}
            />
            <YAxis 
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value: number) => value.toLocaleString()}
            />
            <Tooltip />
            <Legend />
            {metrics.map(metric => (
              <Line
                key={metric}
                type="monotone"
                dataKey={metric}
                stroke={metricColors[metric]}
                name={metricLabels[metric]}
                strokeWidth={2}
                dot={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
} 