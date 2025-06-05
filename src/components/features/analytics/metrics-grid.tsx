import { Card } from "@/components/ui/card"
import { AnalyticsMetric } from "@/types/analytics"
import { ArrowDownIcon, ArrowUpIcon, MinusIcon } from "@radix-ui/react-icons"

interface MetricCardProps {
  title: string
  metric: AnalyticsMetric
  prefix?: string
  suffix?: string
}

function MetricCard({ title, metric, prefix, suffix }: MetricCardProps) {
  const trendIcon = {
    up: <ArrowUpIcon className="h-4 w-4 text-green-500" />,
    down: <ArrowDownIcon className="h-4 w-4 text-red-500" />,
    neutral: <MinusIcon className="h-4 w-4 text-muted-foreground" />
  }[metric.trend]

  return (
    <Card className="p-6">
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      <div className="mt-2 flex items-baseline">
        <p className="text-2xl font-semibold">
          {prefix}{metric.value.toLocaleString()}{suffix}
        </p>
        <div className="ml-2 flex items-center text-sm">
          {trendIcon}
          <span className={metric.trend === 'up' ? 'text-green-500' : metric.trend === 'down' ? 'text-red-500' : 'text-muted-foreground'}>
            {Math.abs(metric.change)}%
          </span>
        </div>
      </div>
    </Card>
  )
}

interface MetricsGridProps {
  data: {
    views: AnalyticsMetric
    clicks: AnalyticsMetric
    conversions: AnalyticsMetric
    revenue: AnalyticsMetric
  }
}

export function MetricsGrid({ data }: MetricsGridProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        title="Total Views"
        metric={data.views}
      />
      <MetricCard
        title="Total Clicks"
        metric={data.clicks}
      />
      <MetricCard
        title="Conversions"
        metric={data.conversions}
      />
      <MetricCard
        title="Revenue"
        metric={data.revenue}
        prefix="$"
      />
    </div>
  )
} 